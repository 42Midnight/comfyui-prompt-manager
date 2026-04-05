// 瀑布流组件
// 功能：展示图片卡片，支持批量选择和删除

import './Waterfall.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 自动导入所有图片文件
const imageModules = import.meta.glob('../../../image/*.{jpg,png,jpeg}', { eager: true, import: 'default' });
// 自动导入所有 JSON 数据文件
const jsonModules = import.meta.glob('../../../data/*.json', { eager: true, import: 'default' });

// 构建 JSON 数据映射，方便通过文件名快速查找
const jsonDataMap = {};
Object.entries(jsonModules).forEach(([jsonPath, jsonData]) => {
  const fileName = jsonPath.replace('../../../data/', '').replace('.json', '');
  jsonDataMap[fileName] = jsonData;
});

// 处理图片数据，提取时间戳并排序
const works = Object.entries(imageModules).map(([imagePath, cover], index) => {
  const fileNameWithExt = imagePath.replace('../../../image/', '');
  const fileName = fileNameWithExt.replace(/\.(jpg|png|jpeg)$/, '');
  const jsonData = jsonDataMap[fileName] || {};
  
  // 从文件名中提取时间戳（格式：filename_timestamp）
  let timestamp = 0;
  const match = fileName.match(/_\d+$/);
  if (match) {
    timestamp = parseInt(match[0].replace('_', ''));
  }
  
  return {
    title: jsonData.title || fileName,  // 标题（从 JSON 读取或使用文件名）
    cover: cover,                        // 图片路径
    fileName: fileNameWithExt,           // 带扩展名的文件名
    timestamp: timestamp                 // 时间戳（用于排序）
  };
})
// 按时间戳倒序排序，最新的在前面
.sort((a, b) => b.timestamp - a.timestamp)
// 重新分配 ID
.map((work, index) => ({
  ...work,
  id: index + 1
}));

export default function WaterFall() {
  const navigate = useNavigate();
  const containerRef = useRef(null);  // 瀑布流容器引用
  
  // 状态管理
  const [columns, setColumns] = useState([]);          // 列高数组
  const [columnCount, setColumnCount] = useState(6);   // 列数
  const [cardPositions, setCardPositions] = useState({});  // 卡片位置
  const [isBatchMode, setIsBatchMode] = useState(false);  // 批量选择模式
  const [selectedWorks, setSelectedWorks] = useState([]);  // 选中的作品
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);  // 删除确认弹窗
  const [isDeleting, setIsDeleting] = useState(false);  // 删除中状态
  
  // 处理卡片点击
  // 批量模式下：切换选中状态
  // 非批量模式：跳转到详情页
  const handleCardClick = (e, work) => {
    if (isBatchMode) {
      const isSelected = selectedWorks.some(w => w.id === work.id);
      if (isSelected) {
        setSelectedWorks(selectedWorks.filter(w => w.id !== work.id));
      } else {
        setSelectedWorks([...selectedWorks, work]);
      }
      return;
    }
    navigate(`/detail/${encodeURIComponent(work.fileName)}`);
  };
  
  // 处理添加按钮点击
  const handleAddClick = () => {
    navigate('/upload');
  };
  
  // 切换批量选择模式
  const handleBatchModeToggle = () => {
    setIsBatchMode(!isBatchMode);
    if (isBatchMode) {
      setSelectedWorks([]);  // 退出批量模式时清空选择
    }
  };
  
  // 处理选择框点击（已废弃，现在直接点击卡片即可）
  const handleSelectWork = (e, work) => {
    e.stopPropagation();
    const isSelected = selectedWorks.some(w => w.id === work.id);
    if (isSelected) {
      setSelectedWorks(selectedWorks.filter(w => w.id !== work.id));
    } else {
      setSelectedWorks([...selectedWorks, work]);
    }
  };
  
  // 处理删除按钮点击
  const handleDeleteClick = () => {
    if (selectedWorks.length === 0) {
      alert('请选择要删除的作品');
      return;
    }
    setShowDeleteConfirm(true);
  };
  
  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      for (const work of selectedWorks) {
        const imageFileName = work.fileName;
        const jsonFileName = work.fileName.replace(/\.(jpg|png|jpeg)$/, '') + '.json';
        
        // 调用 Electron API 删除文件
        if (window.electronAPI) {
          await window.electronAPI.deleteFiles(imageFileName, jsonFileName);
        } else {
          console.log('开发环境：模拟删除文件', imageFileName, jsonFileName);
        }
      }
      
      // 重置状态并刷新页面
      setShowDeleteConfirm(false);
      setIsBatchMode(false);
      setSelectedWorks([]);
      window.location.reload();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败：' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 根据屏幕宽度计算列数
  const calculateColumnCount = () => {
    const width = window.innerWidth;
    if (width <= 400) return 1;
    if (width <= 600) return 2;
    if (width <= 900) return 3;
    if (width <= 1200) return 4;
    if (width <= 1400) return 5;
    return 6;
  };
  
  // 初始化瀑布流布局
  const initMasonry = () => {
    if (!containerRef.current) return;
    
    const count = calculateColumnCount();
    setColumnCount(count);
    
    const newColumns = Array(count).fill(0);
    setColumns(newColumns);
    
    calculateCardPositions(count);
  };
  
  // 计算卡片位置
  const calculateCardPositions = (count) => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = (containerWidth * 0.9) / count;  // 卡片宽度（占容器的 90%）
    const gap = (containerWidth * 0.1) / (count + 1);  // 间距
    const rowGap = 10;  // 行间距
    
    const columnHeights = Array(count).fill(0);  // 记录每列的高度
    const positions = {};  // 存储卡片位置
    
    works.forEach(work => {
      // 找到高度最小的列
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      // 计算卡片位置
      const left = gap + (shortestColumn * (cardWidth + gap));
      const top = columnHeights[shortestColumn] + rowGap;
      
      positions[work.id] = {
        left: `${left}px`,
        top: `${top}px`,
        width: `${cardWidth}px`
      };
      
      // 更新列高
      columnHeights[shortestColumn] = top + cardWidth + 40;  // 40 是标题区域高度
    });
    
    setCardPositions(positions);
    
    // 设置容器高度
    if (containerRef.current) {
      const containerHeight = Math.max(...columnHeights) + rowGap;
      containerRef.current.style.height = `${containerHeight}px`;
    }
  };
  
  // 初始化和窗口 resize 时重新计算布局
  useEffect(() => {
    initMasonry();
    window.addEventListener('resize', initMasonry);
    return () => window.removeEventListener('resize', initMasonry);
  }, [works]);
  
  return (
    <div className="waterfall-page">
      <nav className="top-navbar">
        <div className="navbar-brand">Prompt Manager</div>
        <div className="navbar-actions">
          {!isBatchMode ? (
            <>
              <button className="navbar-batch-btn" onClick={handleBatchModeToggle}>
                批量选择
              </button>
              <button className="navbar-add-btn" onClick={handleAddClick}>
                <span className="add-icon">+</span>
                <span className="add-text">添加作品</span>
              </button>
            </>
          ) : (
            <>
              <span className="selected-count">{selectedWorks.length} 个已选</span>
              <button className="navbar-cancel-btn" onClick={handleBatchModeToggle}>
                取消
              </button>
              <button 
                className="navbar-delete-btn" 
                onClick={handleDeleteClick}
                disabled={selectedWorks.length === 0}
              >
                删除选中
              </button>
            </>
          )}
        </div>
      </nav>
      
      <div className="waterfall-container" ref={containerRef}>
        {works.map(work => {
          const position = cardPositions[work.id] || { left: '0px', top: '0px', width: '16%' };
          const isSelected = selectedWorks.some(w => w.id === work.id);
          
          return (
            <div 
              key={work.id} 
              className={`work-card ${isBatchMode ? 'batch-mode' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                left: position.left,
                top: position.top,
                width: position.width
              }}
              onClick={(e) => handleCardClick(e, work)}
            >
              <div className={`work-cover ${isSelected ? 'selected' : ''}`}>
                {isBatchMode && (
                  <div className="select-checkbox">
                    <div className={`checkbox-inner ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                  </div>
                )}
                <img src={work.cover} alt={work.title} />
              </div>
              <div className="work-info">
                <p className="work-title">{work.title}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-dialog">
            <h3 className="delete-confirm-title">确认删除</h3>
            <p className="delete-confirm-message">
              确定要删除这 {selectedWorks.length} 个作品吗？此操作不可恢复！
            </p>
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
