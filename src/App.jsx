// 应用主组件，配置路由

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WaterFall from './components/WaterFall/WaterFall'  // 瀑布流首页
import Detail from './components/Detail/Detail'        // 图片详情页
import Upload from './components/Upload/Upload'        // 上传页面
import './index.css'                                   // 全局样式

function App() {
  return (
    <Router>
      <Routes>
        {/* 首页：瀑布流 */}
        <Route path="/" element={<WaterFall />} />
        {/* 详情页：图片详情，:fileName 为动态参数 */}
        <Route path="/detail/:fileName" element={<Detail />} />
        {/* 上传页面 */}
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </Router>
  )
}

export default App
