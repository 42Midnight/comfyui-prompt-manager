// React 应用入口文件

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// 创建根节点并渲染应用
// StrictMode 会帮助发现潜在问题并警告
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
