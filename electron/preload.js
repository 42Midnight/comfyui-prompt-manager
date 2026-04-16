// Electron 预加载脚本
// 功能：将 Electron 的 IPC 方法暴露给渲染进程，实现安全的跨进程通信

const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload 脚本已加载');

// 向渲染进程暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 保存图片文件
  saveImage: (fileName, bufferArray) => {
    console.log('调用 saveImage:', fileName);
    return ipcRenderer.invoke('save-image', fileName, bufferArray);
  },
  // 保存 JSON 文件
  saveJson: (fileName, data) => {
    console.log('调用 saveJson:', fileName);
    return ipcRenderer.invoke('save-json', fileName, data);
  },
  // 删除图片和 JSON 文件
  deleteFiles: (imageFileName, jsonFileName) => {
    console.log('调用 deleteFiles:', imageFileName, jsonFileName);
    return ipcRenderer.invoke('delete-files', imageFileName, jsonFileName);
  },
  // 读取作品数据
  readWorks: () => {
    console.log('调用 readWorks');
    return ipcRenderer.invoke('read-works');
  },
  // 读取单个作品详情
  readWorkDetail: (fileName) => {
    console.log('调用 readWorkDetail:', fileName);
    return ipcRenderer.invoke('read-work-detail', fileName);
  },
  // 创建文件夹
  createFolder: (folderName) => {
    console.log('调用 createFolder:', folderName);
    return ipcRenderer.invoke('create-folder', folderName);
  },
  // 加载模板数据
  loadTemplates: () => {
    console.log('调用 loadTemplates');
    return ipcRenderer.invoke('load-templates');
  },
  // 保存模板数据
  saveTemplates: (templates) => {
    console.log('调用 saveTemplates:', templates.length);
    return ipcRenderer.invoke('save-templates', templates);
  }
});

console.log('electronAPI 已暴露到 window');
