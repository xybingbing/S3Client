package main

// ConnectionConfig 连接配置
type ConnectionConfig struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Endpoint        string `json:"endpoint"`
	Region          string `json:"region"`
	AccessKeyID     string `json:"accessKeyId"`
	SecretAccessKey string `json:"secretAccessKey"`
	PathStyle       bool   `json:"pathStyle"`
	ForceSSL        bool   `json:"forceSSL"`
	// Bucket 默认选中的存储桶（进入文件管理时自动选中）
	Bucket string `json:"bucket"`
}

// BucketInfo 存储桶信息
type BucketInfo struct {
	Name         string `json:"name"`
	CreationDate string `json:"creationDate,omitempty"`
}

// BucketCheckResult 存储桶可用性检查结果
type BucketCheckResult struct {
	// Exists 存储桶是否存在
	Exists bool `json:"exists"`
	// Accessible 当前凭证是否可访问该存储桶
	Accessible bool `json:"accessible"`
	// Message 结果说明
	Message string `json:"message"`
}

// ObjectItem 对象（文件或文件夹）
type ObjectItem struct {
	Key          string `json:"key"`
	Name         string `json:"name"`
	IsFolder     bool   `json:"isFolder"`
	Size         int64  `json:"size"`
	LastModified string `json:"lastModified,omitempty"`
	StorageClass string `json:"storageClass,omitempty"`
	ETag         string `json:"etag,omitempty"`
	ContentType  string `json:"contentType,omitempty"`
}

// ListResult 列表结果
type ListResult struct {
	Folders     []ObjectItem `json:"folders"`
	Files       []ObjectItem `json:"files"`
	IsTruncated bool         `json:"isTruncated"`
	NextToken   string       `json:"nextToken,omitempty"`
}

// TestResult 连接测试结果
type TestResult struct {
	Buckets int `json:"buckets"`
	// CanListBuckets 当前凭证是否具备列出存储桶的权限
	CanListBuckets bool `json:"canListBuckets"`
	// BucketNames 可列出的存储桶名称（无权限时返回手动配置的名称）
	BucketNames []string `json:"bucketNames"`
}

// TransferProgress 传输进度事件负载
type TransferProgress struct {
	ID     string `json:"id"`
	Loaded int64  `json:"loaded"`
	Total  int64  `json:"total"`
}

// TransferError 传输错误事件负载
type TransferError struct {
	ID      string `json:"id"`
	Message string `json:"message"`
}

// TransferDone 传输完成事件负载
type TransferDone struct {
	ID string `json:"id"`
}
