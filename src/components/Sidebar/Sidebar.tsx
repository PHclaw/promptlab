import {
  Bot,
  User,
  Sparkles,
  Code2,
  FileText,
  GitBranch,
  Zap,
} from 'lucide-react';
import type { BlockType } from '../../types';
import { clsx } from 'clsx';

const blockTypes: { type: BlockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'system', label: 'System', icon: <Bot className="w-5 h-5" />, color: 'text-purple-600 bg-purple-100' },
  { type: 'user', label: 'User', icon: <User className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100' },
  { type: 'assistant', label: 'Assistant', icon: <Sparkles className="w-5 h-5" />, color: 'text-green-600 bg-green-100' },
  { type: 'variable', label: 'Variable', icon: <Code2 className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-100' },
  { type: 'template', label: 'Template', icon: <FileText className="w-5 h-5" />, color: 'text-pink-600 bg-pink-100' },
  { type: 'condition', label: 'Condition', icon: <GitBranch className="w-5 h-5" />, color: 'text-orange-600 bg-orange-100' },
  { type: 'output', label: 'Output', icon: <Zap className="w-5 h-5" />, color: 'text-indigo-600 bg-indigo-100' },
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, type: BlockType) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">Prompt Blocks</h2>
        <p className="text-xs text-gray-500 mt-1">拖拽到画布中</p>
      </div>

      {/* Block Types */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {blockTypes.map(({ type, label, icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg cursor-grab',
              'border border-gray-200 hover:border-gray-300',
              'transition-all hover:shadow-md active:cursor-grabbing',
              color
            )}
          >
            {icon}
            <span className="font-medium text-gray-800">{label}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-gray-200 bg-slate-50">
        <p className="text-xs text-gray-500">
          💡 提示：连接节点构建复杂提示词流程
        </p>
      </div>
    </div>
  );
}
