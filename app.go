package main

import (
	"context"
	"os"
)

// App 应用结构，其导出方法会被绑定给前端调用
type App struct {
	ctx       context.Context
	transfers *TransferManager
}

// NewApp 创建应用实例
func NewApp() *App {
	return &App{transfers: newTransferManager()}
}

// startup 应用启动时保存运行时上下文
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetHomeDir 返回当前用户主目录，作为下载默认位置
func (a *App) GetHomeDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	return home
}