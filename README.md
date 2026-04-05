# ComfyUI Prompt Manager

## 项目简介
ComfyUI Prompt Manager 是一个基于 React + Electron 开发的本地桌面应用，用于管理和组织ComfyUI等AI生成的图片作品及其对应的提示词信息。方便学习和管理提示词。
虽然该项目一开始为ComfyUI的使用场景而设计，但该项目的使用场景不局限于管理ComfyUI相关的提示词，实际上可以作为通用的提示词管理工具。

## 使用平台说明
目前本仓库只提供Windows操作系统的安装包。想要在其他操作系统上使用，可以自己配置打包到其他操作系统。

## 功能特性
- 🖼️ **瀑布流展示**：响应式瀑布流布局，根据屏幕宽度自动调整列数
- 📁 **文件管理**：支持图片上传、批量选择和删除
- 📝 **Prompt 配置**：为每个作品添加和管理多个 Prompt 字段
- 📋 **复制功能**：支持复制单个 Prompt 字段或全部字段
- 💾 **本地存储**：所有数据存储在本地文件系统，无需网络连接
- 📱 **响应式设计**：适配不同屏幕尺寸

## 技术栈
- **前端框架**：React 19.2.4
- **构建工具**：Vite 8.0.1
- **桌面应用**：Electron 41.1.1
- **路由管理**：React Router 7.14.0
- **样式**：CSS3

## 安装和运行

### 发布页下载链接

[Windows](https://github.com/42Midnight/comfyui-prompt-manager/releases/latest)

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run start
```
这将同时启动 Vite 开发服务器和 Electron 应用。

### 构建生产版本
```bash
npm run build
```

### 打包桌面应用
```bash
npm run dist:win
```
这将生成 Windows 平台的可执行文件。

## 项目结构
```
comfyui-prompt-manager/
├── electron/            # Electron 主进程和预加载脚本
│   ├── main.js          # 主进程文件，处理窗口创建和 IPC 通信
│   └── preload.js       # 预加载脚本，暴露 IPC 接口
├── src/                 # React 源代码
│   ├── components/      # 组件
│   │   ├── Detail/      # 图片详情页
│   │   ├── Upload/      # 上传页面
│   │   └── WaterFall/   # 瀑布流首页
│   ├── App.jsx          # 应用主组件
│   └── index.css        # 全局样式
├── image/               # 图片存储目录
├── data/                # JSON 数据存储目录
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 使用说明

### 上传作品
1. 点击顶部导航栏的「添加作品」按钮
2. 点击或拖拽图片到上传区域
3. 输入作品标题（可选，默认为文件名）
4. 添加和配置 Prompt 字段
5. 点击「确定」按钮保存

### 浏览作品
- 在首页浏览瀑布流展示的作品
- 点击作品卡片进入详情页
- 支持批量选择和删除作品

### 查看详情
- 在详情页查看完整图片和标题
- 浏览和复制 Prompt 信息
- 支持删除作品

## 数据存储
- 图片文件存储在 `image/` 目录
- JSON 数据存储在 `data/` 目录
- 打包后，数据存储在应用根目录的对应文件夹

## 注意事项
- 请确保有足够的存储空间来保存图片
- 支持的图片格式：JPG、PNG、JPEG
- 打包后的应用会在首次运行时自动创建必要的目录结构

---

# ComfyUI Prompt Manager

## Project Introduction
ComfyUI Prompt Manager is a local desktop application built with React and Electron for managing and organizing AI-generated images and their corresponding prompts, especially for ComfyUI. It helps users efficiently study and manage prompt engineering workflows.
Although designed for ComfyUI, it is not limited to that scenario and can be used as a universal prompt manager for various AI generation tools.

## Platform Usage Instructions
Currently, this repository only provides installation packages for the Windows operating system.
If you wish to use it on other operating systems, you can configure and package it for those platforms yourself.

## Features
- 🖼️ **Waterfall Layout**：Responsive waterfall layout that automatically adjusts the number of columns based on screen width
- 📁 **File Management**：Support image upload, batch selection and deletion
- 📝 **Prompt Configuration**：Add and manage multiple Prompt fields for each work
- 📋 **Copy Function**：Support copying single Prompt field or all fields
- 💾 **Local Storage**：All data is stored in the local file system, no network connection required
- 📱 **Responsive Design**：Adapt to different screen sizes

## Technology Stack
- **Frontend Framework**：React 19.2.4
- **Build Tool**：Vite 8.0.1
- **Desktop Application**：Electron 41.1.1
- **Routing Management**：React Router 7.14.0
- **Styling**：CSS3

## Installation and Running


### Download from Releases

[Windows](https://github.com/42Midnight/comfyui-prompt-manager/releases/latest)

### Install Dependencies
```bash
npm install
```

### Development Mode
```bash
npm run start
```
This will start both the Vite development server and the Electron application.

### Build Production Version
```bash
npm run build
```

### Package Desktop Application
```bash
npm run dist:win
```
This will generate an executable file for the Windows platform.

## Project Structure
```
comfyui-prompt-manager/
├── electron/            # Electron main process and preload scripts
│   ├── main.js          # Main process file, handling window creation and IPC communication
│   └── preload.js       # Preload script, exposing IPC interfaces
├── src/                 # React source code
│   ├── components/      # Components
│   │   ├── Detail/      # Image detail page
│   │   ├── Upload/      # Upload page
│   │   └── WaterFall/   # Waterfall homepage
│   ├── App.jsx          # Application main component
│   └── index.css        # Global styles
├── image/               # Image storage directory
├── data/                # JSON data storage directory
├── package.json         # Project configuration
└── README.md            # Project description
```

## Usage Instructions

### Upload Works
1. Click the "Add Work" button in the top navigation bar
2. Click or drag images to the upload area
3. Enter the work title (optional, defaults to filename)
4. Add and configure Prompt fields
5. Click the "Confirm" button to save

### Browse Works
- Browse works displayed in waterfall layout on the homepage
- Click on work cards to enter the detail page
- Support batch selection and deletion of works

### View Details
- View the complete image and title on the detail page
- Browse and copy Prompt information
- Support deleting works

## Data Storage
- Image files are stored in the `image/` directory
- JSON data is stored in the `data/` directory
- After packaging, data is stored in the corresponding folders in the application root directory

## Notes
- Please ensure sufficient storage space to save images
- Supported image formats: JPG, PNG, JPEG
- The packaged application will automatically create the necessary directory structure when first run
