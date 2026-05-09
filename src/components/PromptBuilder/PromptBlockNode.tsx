import { memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Bot,
  User,
  Sparkles,
  Code2,
  FileText,
  GitBranch,
  Zap,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type { BlockType, PromptBlock } from '../../types';
import { clsx } from 'clsx';
import { usePromptLabStore } from '../../stores';

const blockConfig: Record<
  BlockType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  system: {
    icon: <Bot className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  user: {
    icon: <User className="w-4 h-4" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  assistant: {
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  variable: {
    icon: <Code2 className="w-4 h-4" />,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
  },
  template: {
    icon: <FileText className="w-4 h-4" />,
    color: 'text-pink-600',
    bg: 'bg-pink-50 border-pink-200',
  },
  condition: {
    icon: <GitBranch className="w-4 h-4" />,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
  },
  output: {
    icon: <Zap className="w-4 h-4" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
  },
};

type PromptBlockNodeData = PromptBlock & { isSelected: boolean };

export const PromptBlockNode = memo(({ data }: NodeProps<PromptBlockNodeData>) => {
  const config = blockConfig[data.type];
  const label = data.type.charAt(0).toUpperCase() + data.type.slice(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const { updateBlock, removeBlock, selectBlock } = usePromptLabStore();

  const handleSave = useCallback(() => {
    updateBlock(data.id, { content: editContent });
    setIsEditing(false);
  }, [data.id, editContent, updateBlock]);

  const handleCancel = useCallback(() => {
    setEditContent(data.content);
    setIsEditing(false);
  }, [data.content]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    removeBlock(data.id);
  }, [data.id, removeBlock]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  }, [handleCancel, handleSave]);

  return (
    <div
      className={clsx(
        'w-72 rounded-xl border-2 p-3 shadow-md transition-all',
        config.bg,
        data.isSelected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      onDoubleClick={handleDoubleClick}
    >
      {/* Input Handle */}
      {data.type !== 'system' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={clsx('p-1.5 rounded-lg', config.color, 'bg-white')}>
            {config.icon}
          </div>
          <span className={clsx('text-sm font-semibold', config.color)}>
            {label}
          </span>
        </div>

        {/* Action Buttons - only show when selected */}
        {data.isSelected && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded hover:bg-white/50 transition-colors text-gray-500 hover:text-primary-600"
              title="编辑内容"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-white/50 transition-colors text-gray-500 hover:text-red-600"
              title="删除节点"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content - Edit Mode */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-32 text-xs text-gray-700 bg-white/80 rounded-lg p-2 border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3 h-3" />
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <Check className="w-3 h-3" />
              保存
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Ctrl+Enter 保存 · Esc 取消
          </p>
        </div>
      ) : (
        /* Content Preview */
        <div className="text-xs text-gray-600 bg-white/50 rounded-lg p-2 min-h-[3rem]">
          {data.content || <span className="italic text-gray-400">双击编辑内容...</span>}
        </div>
      )}

      {/* Output Handle */}
      {data.type !== 'output' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary-500 border-2 border-white"
        />
      )}
    </div>
  );
});

PromptBlockNode.displayName = 'PromptBlockNode';
