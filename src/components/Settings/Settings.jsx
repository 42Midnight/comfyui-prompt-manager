// 设置页面组件
// 功能：提供应用设置选项

import './Settings.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

// 使用通过preload.js暴露的electronAPI
const electronAPI = window.electronAPI || {};

/**
 * 设置页面组件
 * 功能：
 * 1. 提供应用设置选项
 * 2. 支持返回瀑布页
 * 3. 左侧选择栏，右侧内容区域
 * 4. 上传模板管理功能
 */
export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general'); // 当前激活的标签
  
  // 上传模板相关状态
  const [templates, setTemplates] = useState([]); // 模板列表
  const [activeTemplate, setActiveTemplate] = useState(null); // 当前激活的模板
  const [contextMenu, setContextMenu] = useState(null); // 右键菜单状态
  const [editingTemplateId, setEditingTemplateId] = useState(null); // 正在编辑的模板ID
  const [editingTemplateName, setEditingTemplateName] = useState(''); // 正在编辑的模板名称
  const editInputRef = useRef(null); // 输入框引用，用于全选内容
  
  // 读取模板数据
  const loadTemplates = async () => {
    try {
      if (electronAPI.loadTemplates) {
        const result = await electronAPI.loadTemplates();
        if (result.success) {
          const templates = result.data || [];
          if (templates.length > 0) {
            setTemplates(templates);
            setActiveTemplate(templates[0].id);
            setFields(templates[0].fields || []);
          } else {
            // 如果模板列表为空，保持为空状态
            setTemplates([]);
            setActiveTemplate(null);
            setFields([]);
          }
        } else {
          console.error('读取模板数据失败:', result.error);
        }
      } else {
        console.log('在开发模式下，使用内存中的模板数据');
        // 在开发模式下，保持为空状态
        if (templates.length === 0) {
          setTemplates([]);
          setActiveTemplate(null);
          setFields([]);
        }
      }
    } catch (error) {
      console.error('读取模板数据失败:', error);
    }
  };
  
  // 保存模板数据
  const saveTemplates = async (templatesToSave) => {
    try {
      if (electronAPI.saveTemplates) {
        const result = await electronAPI.saveTemplates(templatesToSave);
        if (!result.success) {
          console.error('保存模板数据失败:', result.error);
        }
      } else {
        console.log('在开发模式下，模板数据仅保存在内存中');
      }
    } catch (error) {
      console.error('保存模板数据失败:', error);
    }
  };
  
  // 组件加载时读取模板数据
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // 当模板数据变化时自动保存
  useEffect(() => {
    if (templates.length > 0) {
      saveTemplates(templates);
    }
  }, [templates]);
  
  // 添加点击事件监听器，点击页面其他地方关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu) {
        setContextMenu(null);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('click', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);
  
  // 当进入编辑状态时，全选输入框内容
  useEffect(() => {
    if (editingTemplateId && editInputRef.current) {
      // 在下一个渲染周期执行全选，确保输入框已经渲染
      setTimeout(() => {
        editInputRef.current.select();
      }, 0);
    }
  }, [editingTemplateId]);
  
  // 模板字段相关状态
  const [fields, setFields] = useState([]); // 当前模板的字段列表
  
  // 处理返回按钮点击
  const handleBackClick = () => {
    // 如果当前在上传模板标签，保存当前模板的字段
    if (activeTab === 'upload' && activeTemplate) {
      const updatedTemplates = templates.map(t => {
        if (t.id === activeTemplate) {
          return { ...t, fields: fields };
        }
        return t;
      });
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
    }
    navigate('/');
  };
  
  // 处理标签切换
  const handleTabChange = (tab) => {
    // 如果当前在上传模板标签，保存当前模板的字段
    if (activeTab === 'upload' && activeTemplate) {
      const updatedTemplates = templates.map(t => {
        if (t.id === activeTemplate) {
          return { ...t, fields: fields };
        }
        return t;
      });
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
    }
    
    setActiveTab(tab);
    // 如果切换到上传模板标签，重置字段列表
    if (tab === 'upload') {
      const template = templates.find(t => t.id === activeTemplate);
      if (template) {
        setFields(template.fields);
      }
    }
  };
  
  // 处理新建模板
  const handleCreateTemplate = () => {
    const newTemplate = {
      id: Date.now(),
      name: '新建模板',
      fields: []
    };
    
    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    setActiveTemplate(newTemplate.id);
    setFields([]);
    // 自动进入重命名状态
    setEditingTemplateId(newTemplate.id);
    setEditingTemplateName('新建模板');
  };
  
  // 处理右键菜单
  const handleContextMenu = (e, templateId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      templateId
    });
  };
  
  // 处理关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  // 处理重命名模板
  const handleRenameTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplateId(templateId);
      setEditingTemplateName(template.name);
    }
    setContextMenu(null);
  };
  
  // 处理保存模板名称
  const handleSaveTemplateName = (templateId) => {
    if (editingTemplateName.trim()) {
      const updatedTemplates = templates.map(t => {
        if (t.id === templateId) {
          return { ...t, name: editingTemplateName.trim() };
        }
        return t;
      });
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);
    }
    setEditingTemplateId(null);
    setEditingTemplateName('');
  };
  
  // 处理取消编辑模板名称
  const handleCancelEditTemplateName = () => {
    setEditingTemplateId(null);
    setEditingTemplateName('');
  };
  
  // 处理删除模板
  const handleDeleteTemplate = (templateId = activeTemplate) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
    if (newTemplates.length > 0) {
      // 如果删除的是当前激活的模板，切换到第一个模板
      if (templateId === activeTemplate) {
        setActiveTemplate(newTemplates[0].id);
        setFields(newTemplates[0].fields);
      }
    } else {
      setActiveTemplate(null);
      setFields([]);
    }
    setContextMenu(null);
  };
  
  // 处理模板切换
  const handleTemplateChange = (templateId) => {
    // 保存当前模板的字段
    const updatedTemplates = templates.map(t => {
      if (t.id === activeTemplate) {
        return { ...t, fields: fields };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
    
    // 切换到新模板
    setActiveTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFields(template.fields);
    }
  };
  
  // 处理添加字段
  const handleAddField = () => {
    const newField = {
      id: Date.now(),
      name: '',
      value: ''
    };
    
    const newFields = [...fields, newField];
    setFields(newFields);
    
    // 更新模板的字段
    const updatedTemplates = templates.map(t => {
      if (t.id === activeTemplate) {
        return { ...t, fields: newFields };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
  };
  
  // 处理更新字段
  const handleUpdateField = (fieldId, key, value) => {
    const newFields = fields.map(field => {
      if (field.id === fieldId) {
        return { ...field, [key]: value };
      }
      return field;
    });
    setFields(newFields);
    
    // 更新模板的字段
    const updatedTemplates = templates.map(t => {
      if (t.id === activeTemplate) {
        return { ...t, fields: newFields };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
  };
  
  // 处理删除字段
  const handleDeleteField = (fieldId) => {
    const newFields = fields.filter(f => f.id !== fieldId);
    setFields(newFields);
    
    // 更新模板的字段
    const updatedTemplates = templates.map(t => {
      if (t.id === activeTemplate) {
        return { ...t, fields: newFields };
      }
      return t;
    });
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates);
  };
  
  return (
    <div className="settings-page">
      <nav className="settings-navbar">
        <div className="navbar-brand">设置</div>
        <div className="navbar-actions">
          <button className="navbar-back-btn" onClick={handleBackClick}>
            返回
          </button>
        </div>
      </nav>
      
      <div className="settings-container">
        {/* 左侧选择栏 */}
        <div className="settings-sidebar">
          <div 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => handleTabChange('general')}
          >
            <span className="tab-icon">⚙️</span>
            常规设置
          </div>
          <div 
            className={`settings-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => handleTabChange('upload')}
          >
            <span className="tab-icon">📁</span>
            上传模板
          </div>
        </div>
        
        {/* 右侧内容区域 */}
        <div className="settings-main">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3 className="section-title">常规设置</h3>
              <p className="section-description">常规设置正在开发中...</p>
            </div>
          )}
          
          {activeTab === 'upload' && (
            <div className="upload-template-container">
              {/* 上传模板侧栏 */}
              <div className="template-sidebar">
                <div className="template-header">
                  <div className="template-actions">
                    <button className="template-create-btn" onClick={handleCreateTemplate}>
                      <span className="icon">+</span>
                      <span>新建</span>
                    </button>
                    <button className="template-delete-btn" onClick={() => handleDeleteTemplate(activeTemplate)} disabled={!activeTemplate}>
                      <span className="icon">🗑️</span>
                      <span>删除</span>
                    </button>
                  </div>
                </div>
                
                <div className="template-list">
                  {templates.map(template => (
                    <div
                      key={template.id}
                      className={`template-item ${activeTemplate === template.id ? 'active' : ''}`}
                      onClick={() => handleTemplateChange(template.id)}
                      onContextMenu={(e) => handleContextMenu(e, template.id)}
                    >
                      <span className="template-icon">📄</span>
                      {editingTemplateId === template.id ? (
                        <div className="template-edit-container">
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            className="template-edit-input"
                            autoFocus
                            onBlur={() => handleSaveTemplateName(template.id)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveTemplateName(template.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEditTemplateName();
                              }
                            }}
                          />
                        </div>
                      ) : (
                        template.name
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 右键菜单 */}
                {contextMenu && (
                  <div 
                    className="context-menu"
                    style={{
                      position: 'fixed',
                      left: contextMenu.x,
                      top: contextMenu.y,
                      zIndex: 1000
                    }}
                  >
                    <div className="context-menu-item" onClick={() => handleRenameTemplate(contextMenu.templateId)}>
                      重命名
                    </div>
                    <div className="context-menu-item" onClick={() => handleDeleteTemplate(contextMenu.templateId)}>
                      删除
                    </div>
                  </div>
                )}
              </div>
              
              {/* 模板编辑区域 */}
              <div className="template-editor">
                <h3 className="section-title">Prompt 配置</h3>
                
                {activeTemplate ? (
                  <>
                    <div className="fields-container">
                      {fields.map(field => (
                        <div key={field.id} className="field-form">
                          <input
                            type="text"
                            placeholder="字段名"
                            value={field.name}
                            onChange={(e) => handleUpdateField(field.id, 'name', e.target.value)}
                            className="field-name-input"
                            spellCheck="false"
                          />
                          <textarea
                            placeholder="字段值"
                            value={field.value}
                            onChange={(e) => handleUpdateField(field.id, 'value', e.target.value)}
                            className="field-value-input"
                            spellCheck="false"
                          />
                          <button 
                            className="delete-field-btn"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button className="add-field-btn" onClick={handleAddField}>
                      <span className="icon">+</span>
                      <span>添加字段</span>
                    </button>
                  </>
                ) : (
                  <div className="no-template-message">
                    请先创建一个模板
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
