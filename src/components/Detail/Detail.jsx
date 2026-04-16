// 图片详情页组件
// 功能：显示图片详情、Prompt 信息，支持复制和删除功能

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Detail.css';

/**
 * 图片详情页组件
 * 功能：
 * 1. 显示图片详情和标题
 * 2. 展示 Prompt 信息，支持复制单个字段或全部字段
 * 3. 支持删除作品功能
 * 4. 通过 Electron API 动态读取作品详情
 */
export default function Detail() {
  const { fileName } = useParams();  // 获取 URL 参数中的文件名
  const navigate = useNavigate();  // 路由导航
  
  // 状态管理
  const [workData, setWorkData] = useState(null);  // 当前图片数据
  const [copiedField, setCopiedField] = useState(null);  // 复制成功提示
  const [copiedAll, setCopiedAll] = useState(false);  // 复制全部成功提示
  const [copiedSelected, setCopiedSelected] = useState(false);  // 复制选中成功提示
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);  // 删除确认弹窗
  const [isDeleting, setIsDeleting] = useState(false);  // 删除中状态
  const [selectedFields, setSelectedFields] = useState([]);  // 选中的字段
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);  // 是否处于多选模式
  const [currentImageIndex, setCurrentImageIndex] = useState(0);  // 当前显示的图片索引
  const [editingField, setEditingField] = useState(null);  // 当前正在编辑的字段
  const [editForm, setEditForm] = useState({ name: '', value: '' });  // 编辑表单数据
  
  /**
   * 根据文件名加载图片数据
   * 打包后通过 Electron API 读取，开发模式使用静态导入
   */
  useEffect(() => {
    const loadWorkData = async () => {
      if (!fileName) return;
      
      try {
        if (window.electronAPI) {
          // 打包后：通过 Electron API 读取文件
          console.log('加载作品详情:', fileName);
          const result = await window.electronAPI.readWorkDetail(fileName);
          console.log('readWorkDetail 结果:', result);
          
          if (result.success) {
            setWorkData(result.workData);
          } else {
            console.error('读取作品详情失败:', result.error);
            // 显示错误信息
            alert('加载作品详情失败: ' + result.error);
            navigate('/');
          }
        } else {
          // 开发模式：使用静态导入
          const decodedFileName = decodeURIComponent(fileName);
          
          // 检查是否为文件夹中的图片
          const pathParts = decodedFileName.split('/');
          if (pathParts.length > 1) {
            // 文件夹中的图片
            const folderName = pathParts[0];
            const imageName = pathParts[1];
            
            try {
              // 动态导入图片
              const imageModule = await import(`../../../image/${folderName}/${imageName}`);
              // 动态导入info.json
              let jsonData = {}
              try {
                const jsonModule = await import(`../../../image/${folderName}/info.json`);
                jsonData = jsonModule.default;
              } catch (error) {
                console.log('info.json 文件不存在，使用默认数据');
              }
              
              setWorkData({
                id: folderName,
                title: jsonData.title || folderName,
                cover: imageModule.default,
                fileName: decodedFileName,
                prompt: jsonData.prompt || null,
                images: jsonData.images || [imageName]
              });
            } catch (error) {
              console.error('加载作品详情失败:', error);
              alert('加载作品详情失败: ' + error.message);
              navigate('/');
            }
          } else {
            // 根目录下的图片
            const imageModules = import.meta.glob('../../../image/*.{jpg,png,jpeg}', { eager: true, import: 'default' });
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
            
            const fileNameWithoutExt = decodedFileName.replace(/\.(jpg|png|jpeg)$/, '');
            
            if (imageDataMap[fileNameWithoutExt]) {
              const imageData = imageDataMap[fileNameWithoutExt];
              const jsonData = jsonDataMap[fileNameWithoutExt] || {};
              
              setWorkData({
                id: fileNameWithoutExt,
                title: jsonData.title || fileNameWithoutExt,
                cover: imageData.url,
                fileName: imageData.fileName,
                prompt: jsonData.prompt || null,
                images: jsonData.images || [imageData.fileName]
              });
            } else {
              console.error('图片文件不存在:', fileName);
              alert('图片文件不存在');
              navigate('/');
            }
          }
        }
      } catch (error) {
        console.error('加载作品详情失败:', error);
        alert('加载作品详情失败: ' + error.message);
        navigate('/');
      }
    };
    
    loadWorkData();
  }, [fileName, navigate]);
  
  /**
   * 返回瀑布流页面
   */
  const handleBack = () => {
    navigate('/');
  };
  
  /**
   * 复制文本到剪贴板
   * @param {string} fieldName - 字段名称
   * @param {string} text - 要复制的文本
   */
  const handleCopy = async (fieldName, text) => {
    try {
      // 在编辑模式下，使用编辑表单中的值
      let valueToCopy = text;
      if (editingField === fieldName) {
        valueToCopy = editForm.value;
      }
      
      await navigator.clipboard.writeText(valueToCopy);
      setCopiedField(fieldName);
      // 2 秒后清除复制成功提示
      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  
  /**
   * 复制所有字段值
   */
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
  
  /**
   * 切换字段选择状态
   * @param {string} fieldName - 字段名称
   */
  const handleToggleSelect = (fieldName) => {
    // 在编辑模式下，不能进行多选操作
    if (editingField) {
      return;
    }
    
    setSelectedFields(prev => {
      if (prev.includes(fieldName)) {
        return prev.filter(name => name !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };
  
  /**
   * 复制选中的字段值
   */
  const handleCopySelected = async () => {
    if (!workData || !workData.prompt || selectedFields.length === 0) return;
    
    try {
      // 将选中字段值用换行符连接
      const selectedValues = selectedFields.map(fieldName => workData.prompt[fieldName]).join('\n');
      await navigator.clipboard.writeText(selectedValues);
      setCopiedSelected(true);
      // 立即退出多选模式
      setIsMultiSelectMode(false);
      setSelectedFields([]);
      // 2 秒后清除复制成功提示
      setTimeout(() => {
        setCopiedSelected(false);
      }, 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  
  /**
   * 开始编辑字段
   */
  const handleStartEdit = (fieldName, fieldValue) => {
    // 进入编辑模式时，退出多选模式
    setIsMultiSelectMode(false);
    setSelectedFields([]);
    
    setEditingField(fieldName);
    setEditForm({ name: fieldName, value: fieldValue });
  };
  
  /**
   * 保存编辑
   */
  const handleSaveEdit = async () => {
    if (!editingField || !workData) return;
    
    try {
      // 创建新的prompt数据
      const newPrompt = { ...workData.prompt };
      
      // 如果字段名改变，删除旧字段，添加新字段
      if (editForm.name !== editingField) {
        delete newPrompt[editingField];
      }
      
      // 添加或更新字段
      newPrompt[editForm.name] = editForm.value;
      
      // 更新本地状态
      setWorkData(prev => ({
        ...prev,
        prompt: newPrompt
      }));
      
      // 调用Electron API保存更新后的JSON文件
      if (window.electronAPI) {
        // 构建JSON文件路径
        let jsonPath;
        if (workData.fileName.includes('/')) {
          // 文件夹中的图片，JSON文件在image目录
          const pathParts = workData.fileName.split('/');
          const folderName = pathParts[0];
          jsonPath = `${folderName}/info.json`;
        } else {
          // 根目录下的图片，JSON文件在data目录
          jsonPath = `${workData.id}.json`;
        }
        
        // 准备要保存的数据
        const saveData = {
          ...workData,
          prompt: newPrompt
        };
        
        // 保存JSON文件
        const result = await window.electronAPI.saveJson(jsonPath, saveData);
        console.log('保存编辑结果:', result);
      }
      
      // 结束编辑模式
      setEditingField(null);
      setEditForm({ name: '', value: '' });
    } catch (error) {
      console.error('保存编辑失败:', error);
      alert('保存编辑失败: ' + error.message);
    }
  };
  
  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setEditingField(null);
    setEditForm({ name: '', value: '' });
  };
  
  /**
   * 更新编辑表单
   */
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  /**
   * 显示删除确认弹窗
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  /**
   * 取消删除
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  /**
   * 确认删除
   */
  const handleConfirmDelete = async () => {
    if (!workData) return;
    
    setIsDeleting(true);
    try {
      const imageFileName = workData.fileName;
      const jsonFileName = workData.id + '.json';
      
      // 调用 Electron API 删除文件
      if (window.electronAPI) {
        const result = await window.electronAPI.deleteFiles(imageFileName, jsonFileName);
        console.log('删除文件结果:', result);
      } else {
        console.log('开发环境：模拟删除文件', imageFileName, jsonFileName);
      }
      
      // 删除成功，返回瀑布页
      navigate('/');
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
      {/* 顶部导航栏 */}
      <div className="detail-navbar">
        <button className="back-button" onClick={handleBack}>
          ← 返回
        </button>
        <div className="navbar-title">{workData.title}</div>
        <div className="navbar-actions">
          <span className="prompt-info-text">Prompt 信息</span>
          {workData.prompt && (
            <>
              {copiedSelected ? (
                <button 
                  className="copy-selected-button copied"
                >
                  已复制选中
                </button>
              ) : isMultiSelectMode ? (
                selectedFields.length > 0 ? (
                  <button 
                    className="copy-selected-button"
                    onClick={handleCopySelected}
                  >
                    复制选中 ({selectedFields.length})
                  </button>
                ) : (
                  <button 
                    className="copy-selected-button"
                    onClick={() => setIsMultiSelectMode(false)}
                  >
                    取消多选
                  </button>
                )
              ) : (
                <button 
                  className="copy-selected-button"
                  onClick={async () => {
                    // 进入多选模式时，如果处于编辑模式，先保存编辑结果
                    if (editingField) {
                      await handleSaveEdit();
                    }
                    setIsMultiSelectMode(true);
                  }}
                >
                  多选
                </button>
              )}
              <button 
                className={`copy-all-button ${copiedAll ? 'copied' : ''}`}
                onClick={handleCopyAll}
              >
                {copiedAll ? '已复制全部' : '复制全部'}
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* 详情内容区域：左右布局 */}
      <div className="detail-content">
        {/* 左侧：图片展示区域 */}
        <div className="detail-left">
          {/* 多张图片展示 */}
          {workData.images && workData.images.length > 1 ? (
            <div className="multiple-images-container">
              {workData.images.map((imageName, index) => {
                // 构建图片路径
                let imagePath;
                console.log('workData.cover:', workData.cover);
                console.log('imageName:', imageName);
                
                if (workData.cover.startsWith('file://')) {
                  // 如果cover是file://路径，提取目录部分并添加图片名称
                  const coverPath = workData.cover;
                  // 找到最后一个斜杠或反斜杠的位置
                  const lastSeparatorIndex = Math.max(
                    coverPath.lastIndexOf('/'),
                    coverPath.lastIndexOf('\\')
                  );
                  if (lastSeparatorIndex !== -1) {
                    // 提取目录部分并添加新的图片名称
                    const directoryPath = coverPath.substring(0, lastSeparatorIndex);
                    // 确保使用正斜杠
                    imagePath = `${directoryPath}/${imageName}`;
                    console.log('构建的图片路径:', imagePath);
                  } else {
                    // 如果路径格式不正确，直接使用图片名称
                    imagePath = imageName;
                    console.log('路径格式不正确，直接使用图片名称:', imagePath);
                  }
                } else if (workData.cover.includes('/')) {
                  // 如果cover包含路径，替换最后一个部分
                  const pathParts = workData.cover.split('/');
                  // 确保路径正确，特别是当cover路径包含文件夹时
                  if (pathParts.length > 1) {
                    // 保留路径部分，只替换图片名称
                    pathParts[pathParts.length - 1] = imageName;
                    imagePath = pathParts.join('/');
                    console.log('构建的图片路径:', imagePath);
                  } else {
                    // 简单路径，直接使用图片名称
                    imagePath = imageName;
                    console.log('简单路径，直接使用图片名称:', imagePath);
                  }
                } else {
                  // 否则直接使用imageName
                  imagePath = imageName;
                  console.log('直接使用图片名称:', imagePath);
                }
                return (
                  <div key={index} className="detail-image-wrapper">
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <img 
                        src={imagePath} 
                        alt={`${workData.title} ${index + 1}`} 
                        className="detail-image"
                        onError={(e) => {
                          console.error('图片加载失败:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<p style="color: #ff6b6b;">图片加载失败</p>`;
                        }}
                      />
                    </div>
                    <p className="image-filename">{imageName}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            // 单张图片展示
            <div className="detail-image-wrapper">
              <img 
                src={workData.cover} 
                alt={workData.title} 
                className="detail-image"
              />
              <p className="image-filename">文件名：{workData.fileName}</p>
            </div>
          )}
          
          {/* 图片信息 */}
          <div className="detail-info">
            <button className="delete-button" onClick={handleDeleteClick}>
              删除作品
            </button>
          </div>
        </div>
        
        {/* 右侧：Prompt 信息展示区域 */}
        <div className="detail-right">
          {workData.prompt ? (
            // 如果有 prompt 数据，展示各个字段
            <div className="prompt-list">
              {Object.entries(workData.prompt).map(([fieldName, fieldValue]) => {
                const isSelected = selectedFields.includes(fieldName);
                return (
                  <div 
                    key={fieldName} 
                    className={`prompt-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => isMultiSelectMode && handleToggleSelect(fieldName)}
                  >
                    {/* 字段名称、复选框、复制按钮和编辑按钮 */}
                    <div className="prompt-card-header">
                      <div className="prompt-field-header" style={{ flex: 1, marginRight: '16px' }}>
                        {isMultiSelectMode && (
                          <input
                            type="checkbox"
                            className="field-checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(fieldName);
                            }}
                          />
                        )}
                        {editingField === fieldName ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => handleEditFormChange('name', e.target.value)}
                            className="edit-field-name"
                            spellCheck="false"
                            style={{
                              background: '#222',
                              color: '#fff',
                              border: '1px solid #444',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '16px',
                              fontWeight: '600',
                              marginLeft: '26px',
                              width: '100%'
                            }}
                          />
                        ) : (
                          <span className="prompt-field-name">{fieldName}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {editingField === fieldName ? (
                          <>
                            <button 
                              className="edit-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                              style={{
                                background: '#4caf50',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                minWidth: '80px',
                                textAlign: 'center'
                              }}
                            >
                              保存
                            </button>
                            <button 
                              className="edit-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#fff',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                minWidth: '80px',
                                textAlign: 'center'
                              }}
                            >
                              取消
                            </button>
                          </>
                        ) : (
                          <button 
                            className="edit-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(fieldName, fieldValue);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              minWidth: '80px',
                              textAlign: 'center'
                            }}
                          >
                            编辑
                          </button>
                        )}
                        <button 
                          className={`copy-button ${copiedField === fieldName ? 'copied' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(fieldName, fieldValue);
                          }}
                        >
                          {copiedField === fieldName ? '已复制' : '复制'}
                        </button>
                      </div>
                    </div>
                    {/* 字段内容 */}
                    <div className="prompt-card-content">
                      {editingField === fieldName ? (
                        <textarea
                          value={editForm.value}
                          onChange={(e) => handleEditFormChange('value', e.target.value)}
                          className="edit-field-value"
                          spellCheck="false"
                          style={{
                            width: '100%',
                            minHeight: '100px',
                            background: '#222',
                            color: '#ccc',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            resize: 'vertical'
                          }}
                        />
                      ) : (
                        fieldValue
                      )}
                    </div>
                  </div>
                );
              })}
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
