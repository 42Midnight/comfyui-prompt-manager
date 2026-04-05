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
  const [selectedFile, setSelectedFile] = useState(null);  // 选中的文件
  const [imagePreview, setImagePreview] = useState(null);  // 图片预览
  const [title, setTitle] = useState('');  // 标题
  const [promptFields, setPromptFields] = useState([{ name: '', value: '' }]);  // prompt 字段
  const [isSaving, setIsSaving] = useState(false);  // 保存中状态
  const [isDragging, setIsDragging] = useState(false);  // 拖拽状态
  
  /**
   * 处理文件（从选择或拖拽）
   * @param {File} file - 选中的文件
   */
  const processFile = (file) => {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    setSelectedFile(file);
    // 如果标题为空，使用文件名（不含扩展名）
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
    // 生成预览图片
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  /**
   * 处理文件选择
   * @param {Event} e - 文件选择事件
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
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
    
    if (!selectedFile) {
      alert('请选择一张图片');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 生成文件名
      const fileName = generateFileName(selectedFile.name);
      const jsonFileName = fileName.replace(/\.[^/.]+$/, '');
      
      // 准备 prompt 数据
      const prompt = {};
      promptFields.forEach(field => {
        if (field.name && field.value) {
          prompt[field.name] = field.value;
        }
      });
      
      // 准备 JSON 数据
      const jsonData = {
        title: title || fileName.replace(/\.[^/.]+$/, ''),
        prompt: Object.keys(prompt).length > 0 ? prompt : null
      };
      
      // 转换图片为 Buffer
      const imageBuffer = await fileToBuffer(selectedFile);
      
      // 调试：检查 window.electronAPI
      console.log('window.electronAPI 是否存在:', !!window.electronAPI);
      
      // 调用 Electron API 保存文件
      if (window.electronAPI) {
        console.log('使用 Electron API 保存文件...');
        console.log('保存图片文件名:', fileName);
        console.log('保存 JSON 文件名:', `${jsonFileName}.json`);
        
        try {
          const saveImageResult = await window.electronAPI.saveImage(fileName, imageBuffer);
          console.log('saveImage 结果:', saveImageResult);
          
          const saveJsonResult = await window.electronAPI.saveJson(`${jsonFileName}.json`, jsonData);
          console.log('saveJson 结果:', saveJsonResult);
          
          console.log('文件保存成功！');
        } catch (error) {
          console.error('保存文件时出错:', error);
          throw error;
        }
      } else {
        // 开发环境模拟（仅输出日志，不保存文件）
        console.log('开发环境：文件不会真正保存');
        console.log('保存图片:', fileName);
        console.log('保存 JSON:', `${jsonFileName}.json`, jsonData);
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
              <h3 className="section-title">上传图片</h3>
              
              {/* 图片上传区域（支持拖拽） */}
              <div 
                className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {imagePreview ? (
                  <div className="image-preview-wrapper">
                    <img src={imagePreview} alt="预览" className="image-preview" />
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                    >
                    </button>
                  </div>
                ) : (
                  <label className="image-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="image-upload-input"
                    />
                    <div className="upload-placeholder">
                      <span className="upload-icon">+</span>
                      <span className="upload-text">
                        {isDragging ? '松开鼠标上传图片' : '点击或拖拽图片到此处上传'}
                      </span>
                    </div>
                  </label>
                )}
              </div>
              
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
            </div>
          </div>
          
          {/* 右侧：Prompt 配置 */}
          <div className="upload-right">
            <div className="prompt-section">
              <div className="prompt-header">
                <h3 className="section-title">Prompt 配置</h3>
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
    </div>
  );
}
