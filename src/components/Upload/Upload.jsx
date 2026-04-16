// 上传页面组件
// 功能：上传图片，配置标题和 prompt 信息

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Upload.css';

/**
 * 上传页面组件
 * 功能：
 * 1. 支持图片上传（点击选择或拖拽上传）
 * 2. 配置作品标题
 * 3. 管理 prompt 字段（添加、删除、编辑）
 * 4. 通过 Electron API 保存文件到本地
 */
export default function Upload() {
  const navigate = useNavigate();  // 路由导航
  
  // 状态管理
  const [selectedFiles, setSelectedFiles] = useState([]);  // 选中的文件数组
  const [imagePreviews, setImagePreviews] = useState([]);  // 图片预览数组
  const [title, setTitle] = useState('');  // 标题
  const [promptFields, setPromptFields] = useState([{ name: '', value: '' }]);  // prompt 字段
  const [isSaving, setIsSaving] = useState(false);  // 保存中状态
  const [isDragging, setIsDragging] = useState(false);  // 拖拽状态
  const [templates, setTemplates] = useState([]);  // 模板列表
  const [showTemplateModal, setShowTemplateModal] = useState(false);  // 显示模板选择对话框
  
  /**
   * 处理文件（从选择或拖拽）
   * @param {File[]} files - 选中的文件数组
   * @param {boolean} append - 是否追加到现有文件
   */
  const processFiles = (files, append = false) => {
    if (!files || files.length === 0) return;
    
    const validImages = [];
    
    for (const file of files) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      validImages.push(file);
      
      // 生成预览图片
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    }
    
    if (append) {
      // 追加到现有文件
      setSelectedFiles(prev => [...prev, ...validImages]);
    } else {
      // 替换现有文件
      setSelectedFiles(validImages);
    }
    
    // 如果标题为空，使用第一个文件名（不含扩展名）
    if (!title && validImages.length > 0) {
      const fileName = validImages[0].name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  };
  
  /**
   * 处理文件选择
   * @param {Event} e - 文件选择事件
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // 清空之前的选择
    setSelectedFiles([]);
    setImagePreviews([]);
    processFiles(files);
  };
  
  /**
   * 拖拽进入
   * @param {Event} e - 拖拽事件
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  /**
   * 拖拽离开
   * @param {Event} e - 拖拽事件
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  /**
   * 拖拽悬停
   * @param {Event} e - 拖拽事件
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  /**
   * 拖拽放下
   * @param {Event} e - 拖拽事件
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      // 追加到现有文件
      processFiles(files, true);
    }
  };
  
  /**
   * 添加新的 prompt 字段
   */
  const addPromptField = () => {
    setPromptFields([...promptFields, { name: '', value: '' }]);
  };
  
  /**
   * 删除 prompt 字段
   * @param {number} index - 字段索引
   */
  const removePromptField = (index) => {
    if (promptFields.length > 1) {
      setPromptFields(promptFields.filter((_, i) => i !== index));
    }
  };
  
  /**
   * 更新 prompt 字段
   * @param {number} index - 字段索引
   * @param {string} field - 字段名（name 或 value）
   * @param {string} value - 字段值
   */
  const updatePromptField = (index, field, value) => {
    const newFields = [...promptFields];
    newFields[index][field] = value;
    setPromptFields(newFields);
  };
  
  /**
   * 生成唯一文件名（原始文件名 + 时间戳后缀）
   * @param {string} originalName - 原始文件名
   * @returns {string} 唯一文件名
   */
  const generateFileName = (originalName) => {
    const timestamp = Date.now();
    const ext = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${timestamp}.${ext}`;
  };
  
  /**
   * 将图片转换为 Buffer
   * @param {File} file - 图片文件
   * @returns {Promise<Uint8Array>} 图片的 Buffer 数组
   */
  const fileToBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const buffer = new Uint8Array(arrayBuffer);
        resolve(Array.from(buffer));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };
  
  /**
   * 处理提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert('请选择至少一张图片');
      return;
    }
    
    // 生成唯一的文件夹名称，使用标题或时间戳
    const folderName = title || `upload_${Date.now()}`;
    
    setIsSaving(true);
    
    try {
      // 准备 prompt 数据
      const prompt = {};
      promptFields.forEach(field => {
        if (field.name && field.value) {
          prompt[field.name] = field.value;
        }
      });
      
      // 调用 Electron API 创建文件夹
      if (window.electronAPI) {
        try {
          await window.electronAPI.createFolder(folderName);
          console.log('文件夹创建成功:', folderName);
        } catch (error) {
          console.error('创建文件夹时出错:', error);
          throw error;
        }
      } else {
        console.log('开发环境：文件夹不会真正创建');
        console.log('创建文件夹:', folderName);
      }
      
      // 生成所有图片的文件名
      const imageFileNames = selectedFiles.map(file => generateFileName(file.name));
      
      // 准备 JSON 数据（只保存一个，作为详情页的主文件）
      const jsonData = {
        title: title || folderName,
        prompt: Object.keys(prompt).length > 0 ? prompt : null,
        images: imageFileNames,
        folder: folderName, // 添加文件夹信息
        timestamp: Date.now() // 添加时间戳
      };
      
      // 保存所有图片
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = imageFileNames[i];
        
        // 转换图片为 Buffer
        const imageBuffer = await fileToBuffer(file);
        
        // 调用 Electron API 保存文件
        if (window.electronAPI) {
          try {
            const saveImageResult = await window.electronAPI.saveImage(`${folderName}/${fileName}`, imageBuffer);
            console.log('saveImage 结果:', saveImageResult);
            
            // 只保存一个JSON文件作为主文件
            if (i === 0) {
              // 直接使用saveImage方法保存info.json文件到image目录
              const jsonContent = JSON.stringify(jsonData, null, 2);
              // 转换字符串为ArrayBuffer
              const encoder = new TextEncoder();
              const arrayBuffer = encoder.encode(jsonContent);
              // 转换为普通数组
              const jsonBuffer = Array.from(arrayBuffer);
              console.log('准备保存info.json文件:', `${folderName}/info.json`);
              console.log('info.json内容:', jsonData);
              try {
                const saveJsonResult = await window.electronAPI.saveImage(`${folderName}/info.json`, jsonBuffer);
                console.log('saveJson 结果:', saveJsonResult);
              } catch (error) {
                console.error('保存info.json文件失败:', error);
              }
            }
          } catch (error) {
            console.error('保存文件时出错:', error);
            throw error;
          }
        } else {
          // 开发环境模拟（仅输出日志，不保存文件）
          console.log('开发环境：文件不会真正保存');
          console.log('保存图片:', `${folderName}/${fileName}`);
          if (i === 0) {
            console.log('保存 JSON:', `${folderName}/info.json`, jsonData);
          }
        }
      }
      
      // 跳回瀑布页
      navigate('/');
      // 不需要刷新页面，WaterFall组件会在挂载时加载数据
      
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败：' + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * 加载模板数据
   */
  const loadTemplates = async () => {
    try {
      if (window.electronAPI && window.electronAPI.loadTemplates) {
        const result = await window.electronAPI.loadTemplates();
        if (result.success) {
          setTemplates(result.data || []);
        } else {
          console.error('加载模板失败:', result.error);
        }
      } else {
        console.log('开发环境：无法加载模板');
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  /**
   * 显示模板选择对话框
   */
  const handleLoadTemplate = async () => {
    await loadTemplates();
    setShowTemplateModal(true);
  };

  /**
   * 应用模板
   * @param {Object} template - 选中的模板
   */
  const applyTemplate = (template) => {
    if (template.fields && template.fields.length > 0) {
      // 转换模板字段格式，确保每个字段都有name和value属性
      const fields = template.fields.map(field => ({
        name: field.name || field.key || '',
        value: field.value || ''
      }));
      setPromptFields(fields);
    } else {
      setPromptFields([{ name: '', value: '' }]);
    }
    setShowTemplateModal(false);
  };

  /**
   * 返回瀑布页
   */
  const handleCancel = () => {
    navigate('/');
  };
  
  return (
    <div className="upload-container">
      <div className="upload-content">
        {/* 标题栏 */}
        <div className="upload-header">
          <button className="back-button" onClick={handleCancel}>
            ← 返回
          </button>
          <h1 className="upload-title">上传作品</h1>
        </div>
        
        <form className="upload-form" onSubmit={handleSubmit}>
          {/* 左侧：图片上传 */}
          <div className="upload-left">
            <div className="upload-image-section">
              <h3 className="section-title">上传作品</h3>
              
              {/* 标题输入 */}
              <div className="title-input-section">
                <label className="input-label">标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入标题（可选，默认为文件名）"
                  className="title-input"
                />
              </div>
              
              {/* 图片上传区域（支持拖拽） */}
              <div 
                className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreviews.length > 0 ? (
                  <div className="image-previews-container">
                    {imagePreviews.map((preview, index) => (
                      <div 
                        key={index} 
                        className="image-preview-wrapper"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', index.toString());
                          e.currentTarget.classList.add('dragging');
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.classList.remove('dragging');
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          if (draggedIndex !== index) {
                            // 调整图片顺序
                            const newFiles = [...selectedFiles];
                            const [draggedFile] = newFiles.splice(draggedIndex, 1);
                            newFiles.splice(index, 0, draggedFile);
                            setSelectedFiles(newFiles);
                            
                            const newPreviews = [...imagePreviews];
                            const [draggedPreview] = newPreviews.splice(draggedIndex, 1);
                            newPreviews.splice(index, 0, draggedPreview);
                            setImagePreviews(newPreviews);
                          }
                        }}
                      >
                        <img src={preview} alt={`预览 ${index + 1}`} className="image-preview" />
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={() => {
                            // 移除指定索引的图片
                            const newFiles = [...selectedFiles];
                            newFiles.splice(index, 1);
                            setSelectedFiles(newFiles);
                            
                            const newPreviews = [...imagePreviews];
                            newPreviews.splice(index, 1);
                            setImagePreviews(newPreviews);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="image-upload-input"
                      multiple
                    />
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-text">
                        {isDragging ? '松开鼠标上传图片' : '点击或拖拽多张图片到此处上传'}
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
          
          {/* 右侧：Prompt 配置 */}
          <div className="upload-right">
            <div className="prompt-section">
              <div className="prompt-header">
                <h3 className="section-title">Prompt 配置</h3>
                <button 
                  type="button" 
                  className="load-template-btn"
                  onClick={handleLoadTemplate}
                >
                  加载模板
                </button>
              </div>
              
              <div className="prompt-fields">
                {promptFields.map((field, index) => (
                  <div key={index} className="prompt-field-item">
                    <div className="prompt-field-row">
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => updatePromptField(index, 'name', e.target.value)}
                        placeholder="字段名"
                        className="prompt-field-name-input"
                        spellCheck="false"
                      />
                      {promptFields.length > 1 && (
                        <button
                          type="button"
                          className="remove-field-btn"
                          onClick={() => removePromptField(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <textarea
                      value={field.value}
                      onChange={(e) => updatePromptField(index, 'value', e.target.value)}
                      placeholder="字段值"
                      className="prompt-field-value-input"
                      rows={3}
                      spellCheck="false"
                    />
                  </div>
                ))}
              </div>
              
              {/* 添加字段按钮 */}
              <div className="prompt-footer">
                <button 
                  type="button" 
                  className="add-field-btn"
                  onClick={addPromptField}
                >
                  + 添加字段
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {/* 底部操作按钮 */}
        <div className="upload-footer">
          <button 
            type="button" 
            className="cancel-btn"
            onClick={handleCancel}
          >
            取消
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '确定'}
          </button>
        </div>
      </div>

      {/* 模板选择对话框 */}
      {showTemplateModal && (
        <div className="template-modal-overlay">
          <div className="template-modal">
            <div className="template-modal-header">
              <h3>选择模板</h3>
              <button 
                type="button" 
                className="close-modal-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="template-modal-body">
              {templates.length > 0 ? (
                <div className="template-list">
                  {templates.map(template => (
                    <div 
                      key={template.id} 
                      className="template-item"
                      onClick={() => applyTemplate(template)}
                    >
                      <span className="template-name">{template.name}</span>
                      <span className="template-field-count">
                        {template.fields ? template.fields.length : 0} 个字段
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-templates-message">
                  没有可用的模板
                </div>
              )}
            </div>
            <div className="template-modal-footer">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
