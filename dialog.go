package main

import "github.com/wailsapp/wails/v2/pkg/runtime"

// PickFiles 打开系统文件对话框，支持多选
func (a *App) PickFiles() ([]string, error) {
	return runtime.OpenMultipleFilesDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择要上传的文件",
	})
}

// PickFolder 打开系统目录对话框，返回所选文件夹路径
func (a *App) PickFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
}

// PickSaveDir 选择下载保存的目标目录
func (a *App) PickSaveDir() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "选择保存位置",
	})
}