package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime"
	"net/url"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
	awshttp "github.com/aws/smithy-go/transport/http"
)

// buildS3Client 根据连接配置构建 S3 客户端
func buildS3Client(ctx context.Context, cfg ConnectionConfig) (*s3.Client, error) {
	endpoint := strings.TrimSpace(cfg.Endpoint)
	if endpoint != "" && !strings.Contains(endpoint, "://") {
		scheme := "https"
		if !cfg.ForceSSL {
			scheme = "http"
		}
		endpoint = scheme + "://" + endpoint
	}

	region := strings.TrimSpace(cfg.Region)
	if region == "" {
		region = "us-east-1"
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithRegion(region),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		),
	)
	if err != nil {
		return nil, err
	}

	return s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if endpoint != "" {
			o.BaseEndpoint = aws.String(endpoint)
		}
		o.UsePathStyle = cfg.PathStyle
	}), nil
}

// wrapS3Error 将 SDK 错误转换为更友好的提示
func wrapS3Error(err error) error {
	if err == nil {
		return nil
	}
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		msg := apiErr.ErrorMessage()
		if msg == "" {
			msg = apiErr.ErrorFault().String()
		}
		return fmt.Errorf("%s: %s", apiErr.ErrorCode(), msg)
	}
	return err
}

// formatTime 统一时间格式
func formatTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

// isBucketListDenied 判断错误是否属于"无权限列出存储桶"
func isBucketListDenied(err error) bool {
	var apiErr smithy.APIError
	if !errors.As(err, &apiErr) {
		return false
	}
	switch apiErr.ErrorCode() {
	case "AccessDenied", "AccessDeniedException", "AllAccessDisabled", "Forbidden", "SignatureDoesNotMatch":
		return true
	}
	return false
}

// TestConnection 测试连接并检测列出存储桶的权限
func (a *App) TestConnection(cfg ConnectionConfig) (TestResult, error) {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return TestResult{}, err
	}
	out, err := client.ListBuckets(a.ctx, &s3.ListBucketsInput{})
	if err != nil {
		// 凭证无 ListBuckets 权限时不算失败，由用户手动指定存储桶
		if isBucketListDenied(err) {
			return TestResult{CanListBuckets: false}, nil
		}
		return TestResult{}, wrapS3Error(err)
	}
	names := make([]string, 0, len(out.Buckets))
	for _, b := range out.Buckets {
		names = append(names, aws.ToString(b.Name))
	}
	return TestResult{Buckets: len(out.Buckets), CanListBuckets: true, BucketNames: names}, nil
}

// ListBuckets 列出全部存储桶（无权限时回退到默认选中的存储桶）
func (a *App) ListBuckets(cfg ConnectionConfig) ([]BucketInfo, error) {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return nil, err
	}
	out, err := client.ListBuckets(a.ctx, &s3.ListBucketsInput{})
	if err != nil {
		// 无权限列出存储桶时，回退到连接配置中默认选中的存储桶
		if isBucketListDenied(err) {
			if name := strings.TrimSpace(cfg.Bucket); name != "" {
				return []BucketInfo{{Name: name}}, nil
			}
			return []BucketInfo{}, nil
		}
		return nil, wrapS3Error(err)
	}
	buckets := make([]BucketInfo, 0, len(out.Buckets))
	for _, b := range out.Buckets {
		buckets = append(buckets, BucketInfo{
			Name:         aws.ToString(b.Name),
			CreationDate: formatTime(b.CreationDate),
		})
	}
	return buckets, nil
}

// s3ErrorCode 提取错误码与 HTTP 状态码
func s3ErrorCode(err error) (string, int) {
	code := ""
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		code = apiErr.ErrorCode()
	}
	status := 0
	var respErr *awshttp.ResponseError
	if errors.As(err, &respErr) {
		status = respErr.HTTPStatusCode()
	}
	return code, status
}

// CheckBucket 检查指定存储桶是否存在、当前凭证是否可访问
func (a *App) CheckBucket(cfg ConnectionConfig, bucket string) (BucketCheckResult, error) {
	name := strings.TrimSpace(bucket)
	if name == "" {
		return BucketCheckResult{Exists: false, Message: "存储桶名称不能为空"}, nil
	}
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return BucketCheckResult{}, err
	}
	_, err = client.HeadBucket(a.ctx, &s3.HeadBucketInput{Bucket: aws.String(name)})
	if err == nil {
		return BucketCheckResult{Exists: true, Accessible: true, Message: "存储桶存在，可正常访问"}, nil
	}
	code, status := s3ErrorCode(err)
	switch {
	case status == 404 || code == "NoSuchBucket" || code == "NotFound":
		return BucketCheckResult{Exists: false, Message: "存储桶不存在"}, nil
	case status == 403 || code == "AccessDenied" || code == "Forbidden":
		return BucketCheckResult{Exists: true, Accessible: false, Message: "存储桶存在，但当前凭证无权访问"}, nil
	}
	return BucketCheckResult{}, wrapS3Error(err)
}

// ListObjects 列出一级对象（文件夹与文件分离）
func (a *App) ListObjects(cfg ConnectionConfig, bucket, prefix, token string) (ListResult, error) {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return ListResult{}, err
	}

	in := &s3.ListObjectsV2Input{
		Bucket:    aws.String(bucket),
		Prefix:    aws.String(prefix),
		Delimiter: aws.String("/"),
	}
	if token != "" {
		in.ContinuationToken = aws.String(token)
	}

	out, err := client.ListObjectsV2(a.ctx, in)
	if err != nil {
		return ListResult{}, wrapS3Error(err)
	}

	res := ListResult{Folders: []ObjectItem{}, Files: []ObjectItem{}}

	for _, cp := range out.CommonPrefixes {
		full := aws.ToString(cp.Prefix)
		name := strings.TrimSuffix(strings.TrimPrefix(full, prefix), "/")
		if name == "" {
			continue
		}
		res.Folders = append(res.Folders, ObjectItem{Key: full, Name: name, IsFolder: true})
	}

	for _, obj := range out.Contents {
		key := aws.ToString(obj.Key)
		if key == prefix || strings.HasSuffix(key, "/") {
			continue
		}
		name := strings.TrimPrefix(key, prefix)
		if name == "" {
			continue
		}
		res.Files = append(res.Files, ObjectItem{
			Key:          key,
			Name:         name,
			IsFolder:     false,
			Size:         aws.ToInt64(obj.Size),
			LastModified: formatTime(obj.LastModified),
			StorageClass: string(obj.StorageClass),
			ETag:         strings.Trim(aws.ToString(obj.ETag), "\""),
		})
	}

	res.IsTruncated = aws.ToBool(out.IsTruncated)
	res.NextToken = aws.ToString(out.NextContinuationToken)
	return res, nil
}

// HeadObject 获取单个对象元信息
func (a *App) HeadObject(cfg ConnectionConfig, bucket, key string) (ObjectItem, error) {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return ObjectItem{}, err
	}
	out, err := client.HeadObject(a.ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return ObjectItem{}, wrapS3Error(err)
	}
	return ObjectItem{
		Key:          key,
		Name:         filepath.Base(key),
		IsFolder:     false,
		Size:         aws.ToInt64(out.ContentLength),
		LastModified: formatTime(out.LastModified),
		StorageClass: string(out.StorageClass),
		ETag:         strings.Trim(aws.ToString(out.ETag), "\""),
		ContentType:  aws.ToString(out.ContentType),
	}, nil
}

// CreateFolder 通过写入零字节占位对象创建文件夹
func (a *App) CreateFolder(cfg ConnectionConfig, bucket, prefix, name string) error {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return err
	}
	key := prefix + strings.Trim(name, "/") + "/"
	_, err = client.PutObject(a.ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(nil),
	})
	return wrapS3Error(err)
}

// DeleteObjects 批量删除对象（自动分批，每批最多 1000 个）
func (a *App) DeleteObjects(cfg ConnectionConfig, bucket string, keys []string) error {
	if len(keys) == 0 {
		return nil
	}
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return err
	}
	const batchSize = 1000
	for start := 0; start < len(keys); start += batchSize {
		end := start + batchSize
		if end > len(keys) {
			end = len(keys)
		}
		ids := make([]types.ObjectIdentifier, 0, end-start)
		for _, k := range keys[start:end] {
			ids = append(ids, types.ObjectIdentifier{Key: aws.String(k)})
		}
		_, err = client.DeleteObjects(a.ctx, &s3.DeleteObjectsInput{
			Bucket: aws.String(bucket),
			Delete: &types.Delete{Objects: ids, Quiet: aws.Bool(true)},
		})
		if err != nil {
			return wrapS3Error(err)
		}
	}
	return nil
}

// escapeCopySource 逐段转义对象键，保留路径分隔符
func escapeCopySource(bucket, key string) string {
	segments := strings.Split(key, "/")
	for i, s := range segments {
		segments[i] = url.PathEscape(s)
	}
	return bucket + "/" + strings.Join(segments, "/")
}

// CopyObject 复制对象（也用于重命名与移动）
func (a *App) CopyObject(cfg ConnectionConfig, bucket, srcKey, dstKey string) error {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return err
	}
	_, err = client.CopyObject(a.ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(bucket),
		Key:        aws.String(dstKey),
		CopySource: aws.String(escapeCopySource(bucket, srcKey)),
	})
	return wrapS3Error(err)
}

// GetPresignedURL 生成临时可访问的预签名 URL
func (a *App) GetPresignedURL(cfg ConnectionConfig, bucket, key string, expiresIn int) (string, error) {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return "", err
	}
	if expiresIn <= 0 {
		expiresIn = 3600
	}
	presigner := s3.NewPresignClient(client)
	out, err := presigner.PresignGetObject(a.ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(time.Duration(expiresIn)*time.Second))
	if err != nil {
		return "", wrapS3Error(err)
	}
	return out.URL, nil
}

// guessContentType 依据扩展名推断内容类型
func guessContentType(name string) string {
	if ct := mime.TypeByExtension(filepath.Ext(name)); ct != "" {
		return ct
	}
	return "application/octet-stream"
}
