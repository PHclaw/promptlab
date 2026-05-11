import { useState, useEffect } from 'react';
import { X, Play, Variable } from 'lucide-react';
import { usePromptLabStore } from '../../stores';
import type { CollectedVariable } from '../../types';
import { clsx } from 'clsx';

export function VariableModal() {
  const {
    showVariableModal,
    toggleVariableModal,
    collectVariables,
    collectedVariables,
    setVariableValue,
    executePrompt,
    isExecuting,
  } = usePromptLabStore();

  const [vars, setVars] = useState<CollectedVariable[]>([]);

  useEffect(() => {
    if (showVariableModal) {
      const collected = collectVariables();
      setVars(collected);
      // Sync to store
      collected.forEach((v) => {
        const existing = collectedVariables.find((cv) => cv.name === v.name);
        if (!existing) {
          setVariableValue(v.name, v.value);
        }
      });
    }
  }, [showVariableModal]);

  if (!showVariableModal) return null;

  const hasEmpty = vars.some((v) => !v.value.trim());

  const handleExecute = async () => {
    const varMap: Record<string, string> = {};
    vars.forEach((v) => {
      varMap[v.name] = v.value;
    });
    toggleVariableModal();
    try {
      await executePrompt(varMap);
    } catch {
      // Error handled in store
    }
  };

  const handleSkip = async () => {
    toggleVariableModal();
    try {
      await executePrompt();
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Variable className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">变量填写</h2>
              <p className="text-xs text-gray-500">检测到 {vars.length} 个变量需要填写</p>
            </div>
          </div>
          <button
            onClick={toggleVariableModal}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Variable Inputs */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {vars.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Variable className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>没有检测到变量</p>
              <p className="text-xs mt-1">{'使用 {{变量名}} 语法定义变量'}</p>
            </div>
          ) : (
            vars.map((v) => (
              <div key={v.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="font-mono text-primary-600">{'{{'}</span>
                  {v.name}
                  <span className="font-mono text-primary-600">{'}}'}</span>
                </label>
                <input
                  type="text"
                  value={v.value}
                  onChange={(e) => {
                    const updated = vars.map((cv) =>
                      cv.name === v.name ? { ...cv, value: e.target.value } : cv
                    );
                    setVars(updated);
                    setVariableValue(v.name, e.target.value);
                  }}
                  placeholder={`输入 ${v.name} 的值...`}
                  className={clsx(
                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-colors',
                    !v.value.trim() ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200 bg-white'
                  )}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            跳过变量
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all',
              isExecuting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm'
            )}
          >
            <Play className="w-4 h-4" />
            {isExecuting ? '执行中...' : '执行'}
          </button>
        </div>
      </div>
    </div>
  );
}
