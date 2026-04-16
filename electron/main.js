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

// 创建文件夹（IPC 处理）
ipcMain.handle('create-folder', async (event, folderName) => {
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
    const folderPath = path.join(appRootPath, 'image', folderName)
    // 确保目录存在
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }
    return { success: true, path: folderPath }
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
    
    // 构建图片路径
    const imagePath = path.join(appRootPath, 'image', imageFileName)
    
    // 检查图片文件名是否包含路径（即是否在文件夹中）
    const pathParts = imageFileName.split('/')
    if (pathParts.length > 1) {
      // 带路径的文件名，如 folder/image.jpg
      const folderName = pathParts[0]
      const folderPath = path.join(appRootPath, 'image', folderName)
      
      // 删除整个文件夹及其所有内容
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        // 递归删除文件夹中的所有文件
        const files = fs.readdirSync(folderPath)
        for (const file of files) {
          const filePath = path.join(folderPath, file)
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath)
          }
        }
        // 删除空文件夹
        fs.rmdirSync(folderPath)
      }
    } else {
      // 简单的图片文件，直接删除
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
      
      // 删除对应的 JSON 文件
      const jsonPath = path.join(appRootPath, 'data', jsonFileName)
      if (fs.existsSync(jsonPath)) {
        fs.unlinkSync(jsonPath)
      }
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
    
    // 确保目录存在
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true })
    }
    
    // 读取所有文件夹和独立图片
    const works = []
    const items = fs.readdirSync(imageDir)
    
    items.forEach(item => {
      const itemPath = path.join(imageDir, item)
      const stats = fs.statSync(itemPath)
      
      if (stats.isDirectory()) {
        // 处理文件夹：每个文件夹对应一个详情页
        const folderName = item
        const folderPath = itemPath
        
        // 读取文件夹中的info.json文件
        const infoJsonPath = path.join(folderPath, 'info.json')
        let jsonData = {}
        
        if (fs.existsSync(infoJsonPath)) {
          try {
            jsonData = JSON.parse(fs.readFileSync(infoJsonPath, 'utf-8'))
          } catch (error) {
            console.error('读取info.json失败:', error)
          }
        }
        
        // 读取文件夹中的所有图片
        const imageFiles = []
        const folderItems = fs.readdirSync(folderPath)
        
        folderItems.forEach(folderItem => {
          const ext = path.extname(folderItem).toLowerCase()
          if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            imageFiles.push(folderItem)
          }
        })
        
        // 如果有图片，创建一个作品
        if (imageFiles.length > 0) {
          const firstImage = imageFiles[0]
          const coverPath = `file://${path.join(folderPath, firstImage)}`
          
          works.push({
            title: jsonData.title || folderName,
            fileName: `${folderName}/${firstImage}`, // 使用带路径的文件名
            timestamp: jsonData.timestamp || Date.now(),
            cover: coverPath,
            folder: folderName,
            images: imageFiles // 保存所有图片信息
          })
        }
      } else {
        // 处理独立图片（不在文件夹中的图片）
        const ext = path.extname(item).toLowerCase()
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          const fileName = item
          const coverPath = `file://${path.join(imageDir, fileName)}`
          
          // 尝试读取对应的JSON文件
          const jsonPath = path.join(imageDir, fileName.replace(/\.(jpg|jpeg|png)$/i, '.json'))
          let jsonData = {}
          
          if (fs.existsSync(jsonPath)) {
            try {
              jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
            } catch (error) {
              console.error('读取JSON文件失败:', error)
            }
          }
          
          works.push({
            title: jsonData.title || fileName.replace(/\.(jpg|jpeg|png)$/i, ''),
            fileName: fileName,
            timestamp: jsonData.timestamp || Date.now(),
            cover: coverPath,
            images: [fileName] // 单个图片
          })
        }
      }
    })
    
    // 按时间戳排序并添加ID
    const sortedWorks = works
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((work, index) => ({
        ...work,
        id: index + 1
      }))
    
    return { success: true, works: sortedWorks }
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
    
    // 检查是否存在于文件夹中
    let imagePath, jsonPath, jsonData = {}
    let isInFolder = false
    
    // 检查fileName是否包含路径
    const pathParts = decodedFileName.split('/')
    if (pathParts.length > 1) {
      // 带路径的文件名，如 folder/image.jpg
      const folderName = pathParts[0]
      const imageName = pathParts[1]
      const folderPath = path.join(imageDir, folderName)
      
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        imagePath = path.join(folderPath, imageName)
        if (fs.existsSync(imagePath)) {
          isInFolder = true
          
          // 查找该文件夹中的info.json文件
          const folderJsonPath = path.join(folderPath, 'info.json')
          if (fs.existsSync(folderJsonPath)) {
            jsonPath = folderJsonPath
            try {
              jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
            } catch (error) {
              console.error('读取info.json文件失败:', folderJsonPath, error)
            }
          } else {
            // 如果info.json文件不存在，直接读取文件夹中的所有图片
            console.log('info.json文件不存在，直接读取文件夹中的所有图片');
            const imageFiles = []
            const folderItems = fs.readdirSync(folderPath)
            
            folderItems.forEach(folderItem => {
              const ext = path.extname(folderItem).toLowerCase()
              if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                imageFiles.push(folderItem)
              }
            })
            
            jsonData.images = imageFiles
          }
        }
      }
    } else {
      // 遍历image目录下的所有文件夹
      if (fs.existsSync(imageDir)) {
        const folders = fs.readdirSync(imageDir).filter(item => {
          const itemPath = path.join(imageDir, item)
          return fs.statSync(itemPath).isDirectory()
        })
        
        for (const folder of folders) {
          const folderImagePath = path.join(imageDir, folder, decodedFileName)
          if (fs.existsSync(folderImagePath)) {
            imagePath = folderImagePath
            isInFolder = true
            
            // 查找该文件夹中的info.json文件
            const folderJsonPath = path.join(imageDir, folder, 'info.json')
            if (fs.existsSync(folderJsonPath)) {
              jsonPath = folderJsonPath
              try {
                jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
              } catch (error) {
                console.error('读取info.json文件失败:', folderJsonPath, error)
              }
            } else {
              // 如果info.json文件不存在，直接读取文件夹中的所有图片
              console.log('info.json文件不存在，直接读取文件夹中的所有图片');
              const imageFiles = []
              const folderPath = path.join(imageDir, folder)
              const folderItems = fs.readdirSync(folderPath)
              
              folderItems.forEach(folderItem => {
                const ext = path.extname(folderItem).toLowerCase()
                if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                  imageFiles.push(folderItem)
                }
              })
              
              jsonData.images = imageFiles
            }
            break
          }
        }
      }
    }
    
    // 如果不在文件夹中，使用旧的方式
    if (!isInFolder) {
      imagePath = path.join(imageDir, decodedFileName)
      if (!fs.existsSync(imagePath)) {
        return { success: false, error: '图片文件不存在' }
      }
      
      const jsonFileName = fileNameWithoutExt + '.json'
      jsonPath = path.join(jsonDir, jsonFileName)
      if (fs.existsSync(jsonPath)) {
        try {
          jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
        } catch (error) {
          console.error('读取JSON文件失败:', jsonFileName, error)
        }
      }
    }
    
    // 构建作品详情数据
    // 确保cover路径使用正斜杠，这样在浏览器中才能正确加载
    const coverPath = `file://${imagePath}`.replace(/\\/g, '/');
    const workData = {
      id: fileNameWithoutExt,
      title: jsonData.title || fileNameWithoutExt,
      cover: coverPath,
      fileName: decodedFileName,
      prompt: jsonData.prompt || null,
      images: jsonData.images || [] // 包含所有图片的文件名
    }
    
    return { success: true, workData }
  } catch (error) {
    console.error('读取作品详情失败:', error)
    return { success: false, error: error.message }
  }
})

// 加载模板数据
ipcMain.handle('load-templates', async (event) => {
  try {
    // 获取应用根目录
    let appRootPath
    if (app.isPackaged) {
      appRootPath = path.dirname(app.getAppPath())
    } else {
      appRootPath = path.join(__dirname, '..')
    }
    
    // 模板数据存储路径
    const TEMPLATE_DIR = path.join(appRootPath, 'data', 'TextTemplate')
    const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'templates.json')
    
    // 确保目录存在
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
    }
    
    // 确保文件存在
    if (!fs.existsSync(TEMPLATE_FILE)) {
      // 创建默认模板
      const defaultTemplate = {
        id: Date.now(),
        name: '默认模板',
        fields: []
      }
      fs.writeFileSync(TEMPLATE_FILE, JSON.stringify([defaultTemplate]))
      return {
        success: true,
        data: [defaultTemplate]
      }
    }
    
    // 读取文件内容
    const data = fs.readFileSync(TEMPLATE_FILE, 'utf8')
    const templates = JSON.parse(data)
    
    return {
      success: true,
      data: templates
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// 保存模板数据
ipcMain.handle('save-templates', async (event, templates) => {
  try {
    // 获取应用根目录
    let appRootPath
    if (app.isPackaged) {
      appRootPath = path.dirname(app.getAppPath())
    } else {
      appRootPath = path.join(__dirname, '..')
    }
    
    // 模板数据存储路径
    const TEMPLATE_DIR = path.join(appRootPath, 'data', 'TextTemplate')
    const TEMPLATE_FILE = path.join(TEMPLATE_DIR, 'templates.json')
    
    // 确保目录存在
    if (!fs.existsSync(TEMPLATE_DIR)) {
      fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
    }
    
    // 写入文件
    fs.writeFileSync(TEMPLATE_FILE, JSON.stringify(templates, null, 2))
    
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
