// 应用主组件，配置路由
// 功能：设置应用的路由结构，管理不同页面之间的导航

import { HashRouter as Router, Routes, Route } from 'react-router-dom' // 导入路由相关组件
import WaterFall from './components/WaterFall/WaterFall'  // 导入瀑布流首页组件
import Detail from './components/Detail/Detail'        // 导入图片详情页组件
import Upload from './components/Upload/Upload'        // 导入上传页面组件
import Settings from './components/Settings/Settings'  // 导入设置页面组件
import './index.css'                                   // 导入全局样式

/**
 * 应用主组件
 * 配置应用的路由结构
 */
function App() {
  return (
    <Router> {/* 使用 HashRouter 避免路由匹配问题 */}
      <Routes> {/* 路由配置 */}
        {/* 首页：瀑布流展示 */}
        <Route path="/" element={<WaterFall />} />
        {/* 详情页：图片详情，:fileName 为动态参数 */}
        <Route path="/detail/:fileName" element={<Detail />} />
        {/* 上传页面：添加新作品 */}
        <Route path="/upload" element={<Upload />} />
        {/* 设置页面：应用设置 */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  )
}

export default App
