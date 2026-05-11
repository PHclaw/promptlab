import {
  Bot,
  User,
  Sparkles,
  Code2,
  FileText,
  GitBranch,
  Zap,
  GripVertical,
} from 'lucide-react';
import type { BlockType } from '../../types';
import { clsx } from 'clsx';

const blockTypes: {
  type: BlockType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    type: 'system',
    label: 'System',
    desc: '设定 AI 角色和行为规则',
    icon: <Bot className="w-5 h-5" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    type: 'user',
    label: 'User',
    desc: '用户输入和提问',
    icon: <User className="w-5 h-5" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    type: 'assistant',
    label: 'Assistant',
    desc: 'AI 的回复示例',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-400',
  },
  {
    type: 'variable',
    label: 'Variable',
    desc: '可替换的变量占位符',
    icon: <Code2 className="w-5 h-5" />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200 hover:border-yellow-400',
  },
  {
    type: 'template',
    label: 'Template',
    desc: '可复用的提示词模板',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200 hover:border-pink-400',
  },
  {
    type: 'condition',
    label: 'Condition',
    desc: '条件分支逻辑',
    icon: <GitBranch className="w-5 h-5" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200 hover:border-orange-400',
  },
  {
    type: 'output',
    label: 'Output',
    desc: '最终输出格式要求',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200 hover:border-indigo-400',
  },
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
        <p className="text-xs text-gray-500 mt-1">拖拽到画布中构建提示词</p>
      </div>

      {/* Block Types */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {blockTypes.map(({ type, label, desc, icon, color, bg, border }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={clsx(
              'flex items-start gap-3 p-3 rounded-xl cursor-grab',
              'border transition-all hover:shadow-md active:cursor-grabbing',
              bg,
              border
            )}
          >
            <div className="flex items-center gap-2 pt-0.5">
              <GripVertical className="w-3 h-3 text-gray-300 shrink-0" />
              <div className={clsx('p-1.5 rounded-lg bg-white/80', color)}>
                {icon}
              </div>
            </div>
            <div className="min-w-0">
              <span className={clsx('font-semibold text-sm', color)}>{label}</span>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-gray-200 bg-slate-50">
        <p className="text-xs text-gray-500">
          💡 使用 <code className="px-1 py-0.5 bg-gray-200 rounded text-primary-600 font-mono">{'{{变量名}}'}</code> 定义变量
        </p>
      </div>
    </div>
  );
}
