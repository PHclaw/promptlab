import { Moon, Sun, FolderOpen, Save, Plus } from 'lucide-react';
import { usePromptLabStore } from '../../stores';
import { clsx } from 'clsx';

export function Header() {
  const { darkMode, toggleDarkMode, toggleTemplates, blocks, saveAsTemplate } = usePromptLabStore();

  const handleSaveAsTemplate = () => {
    const name = prompt('模板名称：');
    if (!name) return;
    const description = prompt('模板描述：') || '';
    saveAsTemplate(name, description);
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
        <div className="text-sm text-gray-500 mr-4">
          {blocks.length} 个块
        </div>

        {/* New Prompt */}
        <button
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

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
