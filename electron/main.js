// Electron 主进程文件
// 功能：创建窗口，处理 IPC 通信，管理应用生命周期

import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 创建主窗口
function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload 路径:', preloadPath);
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,  // 启用上下文隔离
      nodeIntegration: false,  // 禁用 node 集成
    }
  })

  // 加载应用
  if (app.isPackaged) {
    // 打包后加载本地文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // 开发模式加载 Vite 服务器
    mainWindow.loadURL('http://localhost:5173')
  }

  // 窗口关闭时退出应用
  mainWindow.on('closed', function () {
    app.quit()
  })
  
  // 页面加载完成回调
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('页面加载完成');
  })
}

// 保存图片文件（IPC 处理）
ipcMain.handle('save-image', async (event, fileName, bufferArray) => {
  try {
    const imagePath = path.join(__dirname, '..', 'image', fileName)
    const buffer = Buffer.from(bufferArray)
    fs.writeFileSync(imagePath, buffer)
    return { success: true, path: imagePath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 保存 JSON 文件（IPC 处理）
ipcMain.handle('save-json', async (event, fileName, data) => {
  try {
    const jsonPath = path.join(__dirname, '..', 'data', fileName)
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: jsonPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除图片和 JSON 文件（IPC 处理）
ipcMain.handle('delete-files', async (event, imageFileName, jsonFileName) => {
  try {
    const imagePath = path.join(__dirname, '..', 'image', imageFileName)
    const jsonPath = path.join(__dirname, '..', 'data', jsonFileName)
    
    // 删除图片文件
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
    
    // 删除 JSON 文件
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath)
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 应用准备就绪
app.whenReady().then(() => {
  createWindow()

  // 激活应用时的处理
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  app.quit()
})
