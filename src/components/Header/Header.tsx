import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, FolderOpen, Save, Plus, Download, FileJson, FileText, Trash2 } from 'lucide-react';
import { usePromptLabStore } from '../../stores';
import { clsx } from 'clsx';

export function Header() {
  const {
    darkMode,
    toggleDarkMode,
    toggleTemplates,
    blocks,
    saveAsTemplate,
    clearCanvas,
    exportAsJSON,
    exportAsMarkdown,
    showPreview,
    togglePreview,
  } = usePromptLabStore();

  const [showExport, setShowExport] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveAsTemplate = () => {
    const name = prompt('模板名称：');
    if (!name) return;
    const description = prompt('模板描述：') || '';
    saveAsTemplate(name, description);
  };

  const handleExportJSON = () => {
    const json = exportAsJSON();
    downloadFile(json, 'promptlab-export.json', 'application/json');
    setShowExport(false);
  };

  const handleExportMarkdown = () => {
    const md = exportAsMarkdown();
    downloadFile(md, 'promptlab-export.md', 'text/markdown');
    setShowExport(false);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">PL</span>
        </div>
        <div>
          <h1 className="font-bold text-gray-900">PromptLab</h1>
          <p className="text-xs text-gray-500">可视化提示词实验室</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Block Count */}
        <div className="text-sm text-gray-500 mr-2">
          {blocks.length} 个块
        </div>

        {/* New Prompt */}
        <button
          onClick={() => {
            if (blocks.length > 0) {
              setShowNewConfirm(true);
            } else {
              clearCanvas();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          title="新建"
        >
          <Plus className="w-4 h-4" />
          新建
        </button>

        {/* Templates */}
        <button
          onClick={toggleTemplates}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          title="模板"
        >
          <FolderOpen className="w-4 h-4" />
          模板
        </button>

        {/* Save as Template */}
        <button
          onClick={handleSaveAsTemplate}
          disabled={blocks.length === 0}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
            blocks.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          )}
        >
          <Save className="w-4 h-4" />
          保存为模板
        </button>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setShowExport(!showExport)}
            disabled={blocks.length === 0}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
              blocks.length === 0
                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <Download className="w-4 h-4" />
            导出
          </button>

          {showExport && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 animate-fade-in">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <FileJson className="w-4 h-4 text-blue-500" />
                导出为 JSON
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4 text-green-500" />
                导出为 Markdown
              </button>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* New Canvas Confirmation Modal */}
      {showNewConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900">新建画布</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              当前画布有 {blocks.length} 个块，新建将清空所有内容。是否继续？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  clearCanvas();
                  setShowNewConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors"
              >
                清空并新建
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
