import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PromptBlockNode } from './PromptBlockNode';
import { usePromptLabStore } from '../../stores';
import type { PromptBlock, BlockType } from '../../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  promptBlock: PromptBlockNode,
};

const blockTypeColors: Record<BlockType, string> = {
  system: 'bg-purple-500',
  user: 'bg-blue-500',
  assistant: 'bg-green-500',
  variable: 'bg-yellow-500',
  template: 'bg-pink-500',
  condition: 'bg-orange-500',
  output: 'bg-indigo-500',
};

const blockTypeLabels: Record<BlockType, string> = {
  system: 'System',
  user: 'User',
  assistant: 'Assistant',
  variable: 'Variable',
  template: 'Template',
  condition: 'Condition',
  output: 'Output',
};

export function PromptBuilder() {
  const { blocks, addBlock, selectBlock, selectedBlockId } = usePromptLabStore();

  const [nodesState, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);

  // Keep ReactFlow state in sync with Zustand store
  const prevBlocksRef = useRef<string>('');
  useEffect(() => {
    const blockIds = blocks.map((b) => b.id).join(',');
    if (blockIds === prevBlocksRef.current) return;
    prevBlocksRef.current = blockIds;

    const newNodes: Node[] = blocks.map((block) => ({
      id: block.id,
      type: 'promptBlock',
      position: block.position,
      data: {
        ...block,
        isSelected: selectedBlockId === block.id,
      },
    }));

    const newEdges: Edge[] = blocks.flatMap((block) =>
      block.connections.output.map((targetId) => ({
        id: `${block.id}-${targetId}`,
        source: block.id,
        target: targetId,
        animated: true,
        style: { stroke: '#6366f1' },
      }))
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [blocks, selectedBlockId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      // Update store connection
      if (params.source && params.target) {
        usePromptLabStore.getState().connectBlocks(params.source, params.target);
      }
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectBlock(node.id);
    },
    [selectBlock]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as BlockType;
      if (!type) return;

      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      const newBlock: PromptBlock = {
        id: `block-${Date.now()}`,
        type,
        content: getDefaultContent(type),
        position,
        connections: { input: [], output: [] },
      };

      addBlock(newBlock);
    },
    [addBlock]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-50 dark:bg-gray-900"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function getDefaultContent(type: BlockType): string {
  switch (type) {
    case 'system':
      return 'You are a helpful assistant...';
    case 'user':
      return 'Your question or input here...';
    case 'assistant':
      return 'Assistant response template...';
    case 'variable':
      return '{{variable_name}}';
    case 'template':
      return 'Template content with {{variables}}...';
    case 'condition':
      return 'if {{condition}} then ...';
    case 'output':
      return 'Expected output format...';
    default:
      return '';
  }
}
