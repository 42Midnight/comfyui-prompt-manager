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
      webSecurity: false,  // 禁用 web 安全策略，允许加载本地资源
    }
  })

  // 加载应用
  if (app.isPackaged) {
    // 打包后加载本地文件
    const appPath = app.getAppPath()
    mainWindow.loadFile(path.join(appPath, 'dist/index.html'))
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
    // 获取应用根目录（asar文件所在的目录）
    let appRootPath
    if (app.isPackaged) {
      // 打包后：获取asar文件所在的目录
      appRootPath = path.dirname(app.getAppPath())
    } else {
      // 开发模式：使用项目根目录
      appRootPath = path.join(__dirname, '..')
    }
    const imagePath = path.join(appRootPath, 'image', fileName)
    // 确保目录存在
    const imageDir = path.dirname(imagePath)
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }
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
    // 获取应用根目录（asar文件所在的目录）
    let appRootPath
    if (app.isPackaged) {
      // 打包后：获取asar文件所在的目录
      appRootPath = path.dirname(app.getAppPath())
    } else {
      // 开发模式：使用项目根目录
      appRootPath = path.join(__dirname, '..')
    }
    const jsonPath = path.join(appRootPath, 'data', fileName)
    // 确保目录存在
    const jsonDir = path.dirname(jsonPath)
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true })
    }
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: jsonPath }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 删除图片和 JSON 文件（IPC 处理）
ipcMain.handle('delete-files', async (event, imageFileName, jsonFileName) => {
  try {
    // 获取应用根目录（asar文件所在的目录）
    let appRootPath
    if (app.isPackaged) {
      // 打包后：获取asar文件所在的目录
      appRootPath = path.dirname(app.getAppPath())
    } else {
      // 开发模式：使用项目根目录
      appRootPath = path.join(__dirname, '..')
    }
    const imagePath = path.join(appRootPath, 'image', imageFileName)
    const jsonPath = path.join(appRootPath, 'data', jsonFileName)
    
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

// 读取作品数据（IPC 处理）
ipcMain.handle('read-works', async (event) => {
  try {
    // 获取应用根目录（asar文件所在的目录）
    let appRootPath
    if (app.isPackaged) {
      // 打包后：获取asar文件所在的目录
      appRootPath = path.dirname(app.getAppPath())
    } else {
      // 开发模式：使用项目根目录
      appRootPath = path.join(__dirname, '..')
    }
    
    const imageDir = path.join(appRootPath, 'image')
    const jsonDir = path.join(appRootPath, 'data')
    
    // 确保目录存在
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true })
    }
    
    // 读取图片文件
    const imageFiles = fs.readdirSync(imageDir).filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png'].includes(ext)
    })
    
    // 读取JSON文件并构建映射
    const jsonDataMap = {}
    const jsonFiles = fs.readdirSync(jsonDir).filter(file => path.extname(file) === '.json')
    jsonFiles.forEach(file => {
      const jsonPath = path.join(jsonDir, file)
      try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
        const fileName = file.replace('.json', '')
        jsonDataMap[fileName] = jsonData
      } catch (error) {
        console.error('读取JSON文件失败:', file, error)
      }
    })
    
    // 构建作品数据
    const works = imageFiles.map((fileNameWithExt, index) => {
      const fileName = fileNameWithExt.replace(/\.(jpg|jpeg|png)$/i, '')
      const jsonData = jsonDataMap[fileName] || {}
      
      // 从文件名中提取时间戳
      let timestamp = 0
      const match = fileName.match(/_\d+$/)
      if (match) {
        timestamp = parseInt(match[0].replace('_', ''))
      }
      
      return {
        title: jsonData.title || fileName,
        fileName: fileNameWithExt,
        timestamp: timestamp,
        // 图片路径：使用绝对路径
        cover: `file://${path.join(imageDir, fileNameWithExt)}`
      }
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((work, index) => ({
      ...work,
      id: index + 1
    }))
    
    return { success: true, works }
  } catch (error) {
    console.error('读取作品数据失败:', error)
    return { success: false, error: error.message, works: [] }
  }
})

// 读取单个作品详情（IPC 处理）
ipcMain.handle('read-work-detail', async (event, fileName) => {
  try {
    // 获取应用根目录（asar文件所在的目录）
    let appRootPath
    if (app.isPackaged) {
      // 打包后：获取asar文件所在的目录
      appRootPath = path.dirname(app.getAppPath())
    } else {
      // 开发模式：使用项目根目录
      appRootPath = path.join(__dirname, '..')
    }
    
    const imageDir = path.join(appRootPath, 'image')
    const jsonDir = path.join(appRootPath, 'data')
    
    // 确保目录存在
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }
    if (!fs.existsSync(jsonDir)) {
      fs.mkdirSync(jsonDir, { recursive: true })
    }
    
    // 处理文件名
    const decodedFileName = decodeURIComponent(fileName)
    const fileNameWithoutExt = decodedFileName.replace(/\.(jpg|jpeg|png)$/i, '')
    const jsonFileName = fileNameWithoutExt + '.json'
    
    // 检查图片文件是否存在
    const imagePath = path.join(imageDir, decodedFileName)
    if (!fs.existsSync(imagePath)) {
      return { success: false, error: '图片文件不存在' }
    }
    
    // 读取JSON文件
    let jsonData = {}
    const jsonPath = path.join(jsonDir, jsonFileName)
    if (fs.existsSync(jsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      } catch (error) {
        console.error('读取JSON文件失败:', jsonFileName, error)
      }
    }
    
    // 构建作品详情数据
    const workData = {
      id: fileNameWithoutExt,
      title: jsonData.title || fileNameWithoutExt,
      cover: `file://${imagePath}`,
      fileName: decodedFileName,
      prompt: jsonData.prompt || null
    }
    
    return { success: true, workData }
  } catch (error) {
    console.error('读取作品详情失败:', error)
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
