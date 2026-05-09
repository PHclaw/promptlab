import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Save,
  Settings2,
  X,
  Plus,
  Radio,
  Pencil,
  Wifi,
  Loader2,
  Minus,
} from 'lucide-react';
import { usePromptLabStore } from '../../stores';
import { clsx } from 'clsx';
import type { ModelConfig, ApiFormat } from '../../types';

export function PreviewPanel() {
  const {
    blocks,
    selectedBlockId,
    models,
    activeModelId,
    isExecuting,
    executePrompt,
    executionHistory,
    updateBlock,
    removeBlock,
    showModelPanel,
    toggleModelPanel,
    addModel,
    updateModel,
    removeModel,
    toggleModelEnabled,
    setActiveModel,
    testConnection,
  } = usePromptLabStore();

  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [execError, setExecError] = useState<string | null>(null);

  // Model config editing state
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModelConfig>>({});
  const [testingConn, setTestingConn] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [resultCollapsed, setResultCollapsed] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const activeModel = models.find((m) => m.id === activeModelId);

  useEffect(() => {
    if (selectedBlock) {
      setEditContent(selectedBlock.content);
    }
  }, [selectedBlockId, selectedBlock?.content]);

  // Generate preview text from blocks
  const previewText = blocks
    .sort((a, b) => a.position.y - b.position.y)
    .map((block) => {
      const label = block.type.toUpperCase();
      return `${label}:\n${block.content}`;
    })
    .join('\n\n---\n\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveBlock = () => {
    if (selectedBlockId && editContent !== selectedBlock?.content) {
      updateBlock(selectedBlockId, { content: editContent });
    }
  };

  const handleDeleteBlock = () => {
    if (selectedBlockId) {
      removeBlock(selectedBlockId);
    }
  };

  // Execute with error handling
  const handleExecute = async () => {
    setExecError(null);
    try {
      await executePrompt();
    } catch (e) {
      setExecError(e instanceof Error ? e.message : String(e));
    }
  };

  // --- Model Panel Actions ---

  const startAddCustom = useCallback(() => {
    const newId = `custom-${Date.now()}`;
    const newModel: ModelConfig = {
      id: newId,
      name: 'Custom',
      provider: '自定义',
      icon: '✏️',
      enabled: true,
      isCustom: true,
      apiKey: '',
      apiBase: '',
      model: '',
      apiFormat: 'openai',
      temperature: 0.7,
      maxTokens: 2048,
    };
    addModel(newModel);
    setEditingModelId(newId);
    setEditForm({ ...newModel });
    if (!showModelPanel) toggleModelPanel();
  }, [addModel, showModelPanel, toggleModelPanel]);

  const startEditModel = useCallback(
    (model: ModelConfig) => {
      setEditingModelId(model.id);
      setEditForm({ ...model });
      if (!showModelPanel) toggleModelPanel();
    },
    [showModelPanel, toggleModelPanel]
  );

  const cancelEdit = () => {
    setEditingModelId(null);
    setEditForm({});
    setTestResult(null);
  };

  const saveModelConfig = () => {
    if (!editingModelId || !editForm.name) return;
    updateModel(editingModelId, {
      name: editForm.name,
      apiKey: editForm.apiKey ?? '',
      apiBase: editForm.apiBase ?? '',
      model: editForm.model ?? '',
      apiFormat: editForm.apiFormat ?? 'openai',
      temperature: editForm.temperature ?? 0.7,
      maxTokens: editForm.maxTokens ?? 2048,
    });
    // Auto-enable and select
    updateModel(editingModelId, { enabled: true });
    setActiveModel(editingModelId);
    setEditingModelId(null);
    setEditForm({});
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!editingModelId) return;
    setTestingConn(editingModelId);
    setTestResult(null);
    const result = await testConnection(editingModelId);
    setTestResult(result);
    setTestingConn(null);
  };

  const lastResult = executionHistory[0];

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">
          {selectedBlock ? '编辑节点' : '预览'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="复制"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleModelPanel}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              showModelPanel ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100'
            )}
            title="模型配置"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Block Editor - Show when a block is selected */}
      {selectedBlock ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    selectedBlock.type === 'system' && 'bg-purple-100 text-purple-700',
                    selectedBlock.type === 'user' && 'bg-blue-100 text-blue-700',
                    selectedBlock.type === 'assistant' && 'bg-green-100 text-green-700',
                    selectedBlock.type === 'variable' && 'bg-yellow-100 text-yellow-700',
                    selectedBlock.type === 'template' && 'bg-pink-100 text-pink-700',
                    selectedBlock.type === 'condition' && 'bg-orange-100 text-orange-700',
                    selectedBlock.type === 'output' && 'bg-indigo-100 text-indigo-700'
                  )}
                >
                  {selectedBlock.type}
                </span>
              </div>
              <button
                onClick={handleDeleteBlock}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                删除
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={editContent}
              onChange={(value) => setEditContent(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'off',
                folding: false,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                automaticLayout: true,
              }}
              theme="vs-light"
            />
          </div>

          <div className="p-3 border-t border-gray-100">
            <button
              onClick={handleSaveBlock}
              disabled={editContent === selectedBlock.content}
              className={clsx(
                'w-full py-2 rounded-lg font-medium transition-all',
                'flex items-center justify-center gap-2',
                editContent === selectedBlock.content
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
              )}
            >
              <Save className="w-4 h-4" />
              保存修改
            </button>
          </div>
        </div>
      ) : (
        /* Preview Editor */
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={previewText}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'off',
              folding: false,
              wordWrap: 'on',
              padding: { top: 12, bottom: 12 },
            }}
            theme="vs-light"
          />
        </div>
      )}

      {/* Execution Section */}
      <div className="border-t border-gray-200">
        {/* Active Model Badge */}
        {activeModel && !showModelPanel && (
          <div className="px-3 py-2 bg-primary-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs">
                <Radio className="w-3 h-3 text-primary-500" />
                <span className="font-medium text-primary-700">{activeModel.name}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{activeModel.model}</span>
              </div>
              <button
                onClick={() => startEditModel(activeModel)}
                className="p-1 hover:bg-primary-100 rounded transition-colors"
                title="编辑配置"
              >
                <Pencil className="w-3 h-3 text-primary-500" />
              </button>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <div className="p-3">
          <button
            onClick={handleExecute}
            disabled={isExecuting || blocks.length === 0 || !activeModelId}
            className={clsx(
              'w-full py-2.5 rounded-lg font-medium transition-all',
              'flex items-center justify-center gap-2',
              isExecuting || blocks.length === 0 || !activeModelId
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
            )}
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                执行中...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                执行
              </>
            )}
          </button>

          {!activeModelId && (
            <p className="text-xs text-gray-400 text-center mt-2">
              ⚙️ 点击右上角齿轮图标配置模型
            </p>
          )}
          {blocks.length === 0 && activeModelId && (
            <p className="text-xs text-gray-400 text-center mt-2">
              从左侧拖拽块到画布中
            </p>
          )}

          {execError && (
            <p className="text-xs text-red-500 text-center mt-2 break-all">{execError}</p>
          )}
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className="p-3 border-t border-gray-100 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">最近结果</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {lastResult.tokens.total > 0 ? `${lastResult.tokens.total} tokens · ` : ''}
                  {lastResult.latency}ms
                </span>
                <button
                  onClick={() => setResultCollapsed((c) => !c)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                  title={resultCollapsed ? '展开' : '最小化'}
                >
                  {resultCollapsed ? (
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <Minus className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => {
                    executionHistory.forEach((_, i) => {
                      // clear by removing - just collapse visually
                    });
                    setResultCollapsed(false);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                  title="清除结果"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
            {!resultCollapsed && (
              <div
                className={clsx(
                  'text-sm p-2 rounded border',
                  lastResult.output.startsWith('❌')
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-gray-700 bg-white border-gray-200'
                )}
              >
                <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed m-0">
                  {lastResult.output.length > 300
                    ? lastResult.output.slice(0, 300) + '...'
                    : lastResult.output}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ====== MODEL CONFIG PANEL (ChatBox Style) ====== */}
        {showModelPanel && (
          <div className="border-t border-gray-200 bg-gray-50/80">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
              <h4 className="font-semibold text-sm text-gray-800">模型</h4>
              <button
                onClick={toggleModelPanel}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex" style={{ minHeight: 320 }}>
              {/* Left: Model List */}
              <div className="w-[45%] border-r border-gray-200 overflow-y-auto py-1">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={clsx(
                      'flex items-center px-3 py-2 cursor-pointer group hover:bg-gray-100 transition-colors',
                      editingModelId === model.id && 'bg-blue-50'
                    )}
                    onClick={() => startEditModel(model)}
                  >
                    {/* Icon */}
                    <span className="mr-2.5 text-base shrink-0 w-5 text-center">
                      {model.icon || (model.isCustom ? '✏️' : '🤖')}
                    </span>
                    {/* Name + Provider */}
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {model.name}
                      </div>
                      {model.isCustom && (
                        <div className="text-[10px] text-blue-500">自定义</div>
                      )}
                    </div>
                    {/* Toggle Switch */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleModelEnabled(model.id);
                        if (!model.enabled) setActiveModel(model.id);
                      }}
                      className={clsx(
                        'relative w-8 h-4.5 rounded-full transition-colors shrink-0',
                        model.enabled ? 'bg-primary-500' : 'bg-gray-300'
                      )}
                      style={{ height: 18 }}
                    >
                      <span
                        className={clsx(
                          'absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform',
                          model.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                        style={{ width: 14, height: 14, top: 2 }}
                      />
                    </button>
                  </div>
                ))}

                {/* Add Custom Button */}
                <button
                  onClick={startAddCustom}
                  className="flex items-center gap-2 mx-3 my-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg border border-dashed border-primary-300 transition-colors w-[calc(100%-24px)]"
                >
                  <Plus className="w-4 h-4" />
                  添加模型
                </button>
              </div>

              {/* Right: Config Form */}
              <div className="flex-1 p-4 overflow-y-auto">
                {editingModelId && editForm.name !== undefined ? (
                  <div className="space-y-3.5">
                    {/* Display Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        显示名称
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="输入自定义名称..."
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={editForm.apiKey || ''}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, apiKey: e.target.value }))
                          }
                          placeholder="输入你的 API Key"
                          className="w-full px-3 py-1.5 pr-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                          🔑
                        </span>
                      </div>
                    </div>

                    {/* API Base URL */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        API Base URL
                      </label>
                      <input
                        type="text"
                        value={editForm.apiBase || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, apiBase: e.target.value }))
                        }
                        placeholder="输入 API 基础 URL"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                      />
                      {/* Hints */}
                      <div className="mt-1.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              apiBase: 'https://api.anthropic.com',
                              apiFormat: 'anthropic',
                            }))
                          }
                          className="block text-[11px] text-blue-500 hover:text-blue-700 hover:underline truncate"
                        >
                          • Anthropic 兼容（以硅基流动为例）：https://api.siliconflow.cn
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              apiBase: 'https://api.siliconflow.cn/v1',
                              apiFormat: 'openai',
                            }))
                          }
                          className="block text-[11px] text-blue-500 hover:text-blue-700 hover:underline truncate"
                        >
                          • OpenAI 兼容（以硅基流动为例）：https://api.siliconflow.cn/v1
                        </button>
                      </div>
                    </div>

                    {/* Model Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        可用模型列表 / 自定义模型名
                      </label>
                      <input
                        type="text"
                        value={editForm.model || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, model: e.target.value }))
                        }
                        placeholder="如 gpt-4o, claude-3.5-sonnet, deepseek-chat"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* API Format */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        API 格式
                      </label>
                      <div className="flex gap-4">
                        {(['anthropic', 'openai'] as ApiFormat[]).map((fmt) => (
                          <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="apiFormat"
                              checked={editForm.apiFormat === fmt}
                              onChange={() =>
                                setEditForm((f) => ({ ...f, apiFormat: fmt }))
                              }
                              className="w-3.5 h-3.5 text-primary-500 accent-primary-500"
                            />
                            <span className="text-xs text-gray-600">
                              {fmt === 'anthropic' ? 'Anthropic 兼容' : 'OpenAI 兼容'}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">
                        请选择 API 协议兼容格式：Anthropic 兼容或 OpenAI 兼容
                      </p>
                    </div>

                    {/* Test Connection */}
                    <button
                      onClick={handleTestConnection}
                      disabled={
                        testingConn === editingModelId ||
                        (!editForm.apiKey && !editForm.apiBase?.includes('localhost') && !editForm.apiBase?.includes('127.0.0.1')) ||
                        !editForm.apiBase
                      }
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors',
                        testingConn === editingModelId
                          ? 'bg-gray-50 text-gray-400 border-gray-200'
                          : 'hover:bg-gray-100 text-gray-600 border-gray-200'
                      )}
                    >
                      {testingConn === editingModelId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wifi className="w-3 h-3" />
                      )}
                      测试连接
                    </button>

                    {testResult && (
                      <p
                        className={clsx(
                          'text-xs',
                          testResult.success ? 'text-green-600' : 'text-red-500'
                        )}
                      >
                        {testResult.success ? '✅' : '❌'} {testResult.message}
                      </p>
                    )}

                    {/* Delete custom model button */}
                    {models.find((m) => m.id === editingModelId)?.isCustom && (
                      <button
                        onClick={() => {
                          removeModel(editingModelId!);
                          cancelEdit();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除此模型
                      </button>
                    )}
                  </div>
                ) : (
                  /* No model selected hint */
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-10">
                    <Pencil className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">选择或添加一个模型</p>
                    <p className="text-xs mt-1">从左侧选择已有模型，或点击「添加模型」</p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelEdit}
                className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveModelConfig}
                disabled={!editingModelId || !editForm.name || (!editForm.apiKey && !editForm.apiBase?.includes('localhost') && !editForm.apiBase?.includes('127.0.0.1'))}
                className={clsx(
                  'px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  !editingModelId || !editForm.name || (!editForm.apiKey && !editForm.apiBase?.includes('localhost') && !editForm.apiBase?.includes('127.0.0.1'))
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
