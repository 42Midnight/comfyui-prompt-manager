// 图片详情页组件
// 功能：显示图片详情、Prompt 信息，支持复制和删除功能

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Detail.css';

// 使用 Vite 的 import.meta.glob API 自动加载 image 文件夹中的所有图片
const imageModules = import.meta.glob('../../../image/*.{jpg,png,jpeg}', { eager: true, import: 'default' });

// 使用 Vite 的 import.meta.glob API 自动加载 data 文件夹中的所有 JSON 文件
const jsonModules = import.meta.glob('../../../data/*.json', { eager: true, import: 'default' });

// 创建文件名到 JSON 数据的映射
const jsonDataMap = {};
Object.entries(jsonModules).forEach(([jsonPath, jsonData]) => {
  const fileName = jsonPath.replace('../../../data/', '').replace('.json', '');
  jsonDataMap[fileName] = jsonData;
});

// 创建文件名到图片 URL 的映射
const imageDataMap = {};
Object.entries(imageModules).forEach(([imagePath, imageUrl]) => {
  const fileNameWithExt = imagePath.replace('../../../image/', '');
  const fileName = fileNameWithExt.replace(/\.(jpg|png|jpeg)$/, '');
  imageDataMap[fileName] = {
    url: imageUrl,
    fileName: fileNameWithExt
  };
});

export default function Detail() {
  const { fileName } = useParams();  // 获取 URL 参数中的文件名
  const navigate = useNavigate();  // 路由导航
  
  // 状态管理
  const [workData, setWorkData] = useState(null);  // 当前图片数据
  const [copiedField, setCopiedField] = useState(null);  // 复制成功提示
  const [copiedAll, setCopiedAll] = useState(false);  // 复制全部成功提示
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);  // 删除确认弹窗
  const [isDeleting, setIsDeleting] = useState(false);  // 删除中状态
  
  // 根据文件名加载图片数据
  useEffect(() => {
    if (!fileName) return;
    
    const decodedFileName = decodeURIComponent(fileName);
    const fileNameWithoutExt = decodedFileName.replace(/\.(jpg|png|jpeg)$/, '');
    
    if (imageDataMap[fileNameWithoutExt]) {
      const imageData = imageDataMap[fileNameWithoutExt];
      const jsonData = jsonDataMap[fileNameWithoutExt] || {};
      
      setWorkData({
        id: fileNameWithoutExt,
        title: jsonData.title || fileNameWithoutExt,
        cover: imageData.url,
        fileName: imageData.fileName,
        prompt: jsonData.prompt || null  // 读取 prompt 数据
      });
    }
  }, [fileName]);
  
  // 返回瀑布流页面
  const handleBack = () => {
    navigate('/');
  };
  
  // 复制文本到剪贴板
  const handleCopy = async (fieldName, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      // 2 秒后清除复制成功提示
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  
  // 复制所有字段值
  const handleCopyAll = async () => {
    if (!workData || !workData.prompt) return;
    
    try {
      // 将所有字段值用换行符连接
      const allValues = Object.values(workData.prompt).join('\n');
      await navigator.clipboard.writeText(allValues);
      setCopiedAll(true);
      // 2 秒后清除复制成功提示
      setTimeout(() => {
        setCopiedAll(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  
  // 显示删除确认弹窗
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    if (!workData) return;
    
    setIsDeleting(true);
    try {
      const imageFileName = workData.fileName;
      const jsonFileName = workData.id + '.json';
      
      // 调用 Electron API 删除文件
      if (window.electronAPI) {
        await window.electronAPI.deleteFiles(imageFileName, jsonFileName);
      } else {
        console.log('开发环境：模拟删除文件', imageFileName, jsonFileName);
      }
      
      // 删除成功，返回瀑布页并刷新
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败：' + error.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  // 如果数据未加载，显示加载中
  if (!workData) {
    return (
      <div className="detail-loading">
        <p>加载中...</p>
      </div>
    );
  }
  
  return (
    <div className="detail-container">
      {/* 返回按钮 */}
      <button className="back-button" onClick={handleBack}>
        ← 返回
      </button>
      
      {/* 详情内容区域：左右布局 */}
      <div className="detail-content">
        {/* 左侧：图片展示区域 */}
        <div className="detail-left">
          {/* 图片标题 */}
          <h1 className="detail-title">{workData.title}</h1>
          
          {/* 完整图片展示 */}
          <div className="detail-image-wrapper">
            <img 
              src={workData.cover} 
              alt={workData.title} 
              className="detail-image"
            />
          </div>
          
          {/* 图片信息 */}
          <div className="detail-info">
            <p className="detail-filename">文件名：{workData.fileName}</p>
            <button className="delete-button" onClick={handleDeleteClick}>
              删除作品
            </button>
          </div>
        </div>
        
        {/* 右侧：Prompt 信息展示区域 */}
        <div className="detail-right">
          <div className="prompt-header">
            <h2 className="prompt-title">Prompt 信息</h2>
            {workData.prompt && (
              <button 
                className={`copy-all-button ${copiedAll ? 'copied' : ''}`}
                onClick={handleCopyAll}
              >
                {copiedAll ? '已复制全部' : '复制全部'}
              </button>
            )}
          </div>
          
          {workData.prompt ? (
            // 如果有 prompt 数据，展示各个字段
            <div className="prompt-list">
              {Object.entries(workData.prompt).map(([fieldName, fieldValue]) => (
                <div key={fieldName} className="prompt-card">
                  {/* 字段名称和复制按钮 */}
                  <div className="prompt-card-header">
                    <span className="prompt-field-name">{fieldName}</span>
                    <button 
                      className={`copy-button ${copiedField === fieldName ? 'copied' : ''}`}
                      onClick={() => handleCopy(fieldName, fieldValue)}
                    >
                      {copiedField === fieldName ? '已复制' : '复制'}
                    </button>
                  </div>
                  {/* 字段内容 */}
                  <div className="prompt-card-content">
                    {fieldValue}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 如果没有 prompt 数据，显示提示
            <div className="no-prompt">
              <p>暂无 Prompt 信息</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <h3 className="delete-confirm-title">确认删除</h3>
            <p className="delete-confirm-message">确定要删除这个作品吗？此操作不可恢复！</p>
            <div className="delete-confirm-buttons">
              <button 
                className="delete-confirm-cancel" 
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                取消
              </button>
              <button 
                className="delete-confirm-ok" 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
