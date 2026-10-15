package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// TransferManager 管理正在进行的传输任务，支持取消
type TransferManager struct {
	mu      sync.Mutex
	cancels map[string]context.CancelFunc
}

func newTransferManager() *TransferManager {
	return &TransferManager{cancels: make(map[string]context.CancelFunc)}
}

func (m *TransferManager) set(id string, cancel context.CancelFunc) {
	m.mu.Lock()
	m.cancels[id] = cancel
	m.mu.Unlock()
}

func (m *TransferManager) cancel(id string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	if c, ok := m.cancels[id]; ok {
		c()
		delete(m.cancels, id)
		return true
	}
	return false
}

func (m *TransferManager) remove(id string) {
	m.mu.Lock()
	delete(m.cancels, id)
	m.mu.Unlock()
}

// progressReader 统计上传读取的字节数
type progressReader struct {
	r      io.Reader
	onRead func(int64)
}

func (p *progressReader) Read(b []byte) (int, error) {
	n, err := p.r.Read(b)
	if n > 0 && p.onRead != nil {
		p.onRead(int64(n))
	}
	return n, err
}

// progressWriter 统计下载写入的字节数
type progressWriter struct {
	w       io.WriterAt
	onWrite func(int64)
}

func (p *progressWriter) WriteAt(b []byte, off int64) (int, error) {
	n, err := p.w.WriteAt(b, off)
	if n > 0 && p.onWrite != nil {
		p.onWrite(int64(n))
	}
	return n, err
}

// progressReporter 对进度事件做节流后推送
type progressReporter struct {
	app      *App
	id       string
	total    int64
	loaded   atomic.Int64
	lastEmit int64
	mu       sync.Mutex
}

func newProgressReporter(app *App, id string, total int64) *progressReporter {
	return &progressReporter{app: app, id: id, total: total}
}

func (p *progressReporter) add(delta int64) {
	cur := p.loaded.Add(delta)
	now := time.Now().UnixMilli()
	p.mu.Lock()
	if now-p.lastEmit < 100 && cur < p.total {
		p.mu.Unlock()
		return
	}
	p.lastEmit = now
	p.mu.Unlock()
	p.app.emitProgress(p.id, cur, p.total)
}

func (p *progressReporter) finish() {
	p.app.emitProgress(p.id, p.total, p.total)
}

func (a *App) emitProgress(id string, loaded, total int64) {
	runtime.EventsEmit(a.ctx, "transfer:progress", TransferProgress{ID: id, Loaded: loaded, Total: total})
}

func (a *App) emitDone(id string) {
	runtime.EventsEmit(a.ctx, "transfer:done", TransferDone{ID: id})
}

func (a *App) emitTransferError(id, message string) {
	runtime.EventsEmit(a.ctx, "transfer:error", TransferError{ID: id, Message: message})
}

// uploadTarget 待上传的本地文件与目标键
type uploadTarget struct {
	path string
	key  string
}

// collectUploadTargets 展开路径列表（支持目录递归），生成上传目标
func collectUploadTargets(prefix string, paths []string) ([]uploadTarget, int64, error) {
	var targets []uploadTarget
	var total int64

	for _, p := range paths {
		info, err := os.Stat(p)
		if err != nil {
			return nil, 0, err
		}
		if info.IsDir() {
			base := filepath.Dir(p)
			walkErr := filepath.Walk(p, func(path string, fi os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				if fi.IsDir() {
					return nil
				}
				rel, err := filepath.Rel(base, path)
				if err != nil {
					return err
				}
				targets = append(targets, uploadTarget{path: path, key: prefix + filepath.ToSlash(rel)})
				total += fi.Size()
				return nil
			})
			if walkErr != nil {
				return nil, 0, walkErr
			}
			continue
		}
		targets = append(targets, uploadTarget{path: p, key: prefix + filepath.Base(p)})
		total += info.Size()
	}
	return targets, total, nil
}

// StartUpload 异步批量上传，进度通过事件推送
func (a *App) StartUpload(taskID string, cfg ConnectionConfig, bucket, prefix string, paths []string) error {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return err
	}

	targets, total, err := collectUploadTargets(prefix, paths)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(a.ctx)
	a.transfers.set(taskID, cancel)

	go func() {
		defer a.transfers.remove(taskID)
		defer cancel()

		uploader := manager.NewUploader(client, func(u *manager.Uploader) {
			u.PartSize = 16 * 1024 * 1024
			u.Concurrency = 4
		})

		reporter := newProgressReporter(a, taskID, total)
		for _, t := range targets {
			if ctx.Err() != nil {
				a.emitTransferError(taskID, "任务已取消")
				return
			}
			if err := uploadOne(ctx, uploader, bucket, t.key, t.path, reporter); err != nil {
				a.emitTransferError(taskID, err.Error())
				return
			}
		}
		reporter.finish()
		a.emitDone(taskID)
	}()

	return nil
}

func uploadOne(ctx context.Context, uploader *manager.Uploader, bucket, key, localPath string, reporter *progressReporter) error {
	f, err := os.Open(localPath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = uploader.Upload(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucket),
		Key:         aws.String(key),
		Body:        &progressReader{r: f, onRead: reporter.add},
		ContentType: aws.String(guessContentType(localPath)),
	})
	return wrapS3Error(err)
}

// StartDownload 异步批量下载，进度通过事件推送
func (a *App) StartDownload(taskID string, cfg ConnectionConfig, bucket string, keys []string, saveDir string) error {
	client, err := buildS3Client(a.ctx, cfg)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(a.ctx)
	a.transfers.set(taskID, cancel)

	go func() {
		defer a.transfers.remove(taskID)
		defer cancel()

		downloader := manager.NewDownloader(client, func(d *manager.Downloader) {
			d.PartSize = 16 * 1024 * 1024
			d.Concurrency = 4
		})

		var total int64
		for _, k := range keys {
			head, err := client.HeadObject(ctx, &s3.HeadObjectInput{
				Bucket: aws.String(bucket),
				Key:    aws.String(k),
			})
			if err == nil {
				total += aws.ToInt64(head.ContentLength)
			}
		}

		reporter := newProgressReporter(a, taskID, total)
		for _, k := range keys {
			if ctx.Err() != nil {
				a.emitTransferError(taskID, "任务已取消")
				return
			}
			dest := uniquePath(filepath.Join(saveDir, filepath.Base(k)))
			if err := downloadOne(ctx, downloader, bucket, k, dest, reporter); err != nil {
				a.emitTransferError(taskID, err.Error())
				return
			}
		}
		reporter.finish()
		a.emitDone(taskID)
	}()

	return nil
}

func downloadOne(ctx context.Context, downloader *manager.Downloader, bucket, key, dest string, reporter *progressReporter) error {
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = downloader.Download(ctx, &progressWriter{w: f, onWrite: reporter.add}, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	return wrapS3Error(err)
}

// uniquePath 避免覆盖已存在的同名文件
func uniquePath(p string) string {
	if _, err := os.Stat(p); os.IsNotExist(err) {
		return p
	}
	ext := filepath.Ext(p)
	base := strings.TrimSuffix(p, ext)
	for i := 1; ; i++ {
		candidate := fmt.Sprintf("%s (%d)%s", base, i, ext)
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
}

// CancelTransfer 取消指定传输任务
func (a *App) CancelTransfer(taskID string) bool {
	return a.transfers.cancel(taskID)
}