// Prompt Block Types
export type BlockType =
  | 'system'
  | 'user'
  | 'assistant'
  | 'variable'
  | 'template'
  | 'condition'
  | 'output';

export interface PromptBlock {
  id: string;
  type: BlockType;
  content: string;
  position: { x: number; y: number };
  connections: {
    input: string[];
    output: string[];
  };
  metadata?: {
    label?: string;
    description?: string;
    variable?: string;
    template?: string;
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: PromptBlock[];
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export type ApiFormat = 'openai' | 'anthropic';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string; // display name like 'OpenAI', 'Ollama', 'Custom'
  icon?: string; // emoji or icon identifier
  enabled: boolean;
  isCustom: boolean; // user-added custom model
  // API config
  apiKey: string;
  apiBase: string;
  model: string; // actual model name sent to API
  apiFormat: ApiFormat; // request format
  // generation params
  temperature: number;
  maxTokens: number;
}

export interface ExecutionResult {
  id: string;
  promptId: string;
  modelId: string;
  input: string;
  output: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency: number;
  timestamp: string;
}

export interface ComparisonResult {
  id: string;
  inputs: string[];
  results: ExecutionResult[];
  createdAt: string;
}

// Variable collected from blocks
export interface CollectedVariable {
  name: string;
  value: string;
  sourceBlockId: string;
}

// Store Types
export interface PromptLabState {
  // Current Prompt
  blocks: PromptBlock[];
  selectedBlockId: string | null;

  // Templates
  templates: PromptTemplate[];

  // Execution
  isExecuting: boolean;
  executionHistory: ExecutionResult[];
  currentComparison: ComparisonResult | null;

  // Models
  models: ModelConfig[];
  activeModelId: string | null; // single active model for execution

  // UI State
  showPreview: boolean;
  showTemplates: boolean;
  darkMode: boolean;
  showModelPanel: boolean; // model config panel visibility

  // Variable state
  collectedVariables: CollectedVariable[];
  showVariableModal: boolean;
  pendingExecution: boolean;

  // Actions
  addBlock: (block: PromptBlock) => void;
  updateBlock: (id: string, updates: Partial<PromptBlock>) => void;
  removeBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  connectBlocks: (sourceId: string, targetId: string) => void;
  clearCanvas: () => void;

  loadTemplate: (template: PromptTemplate) => void;
  saveAsTemplate: (name: string, description: string) => void;

  collectVariables: () => CollectedVariable[];
  setVariableValue: (name: string, value: string) => void;
  toggleVariableModal: () => void;
  executePrompt: (variables?: Record<string, string>) => Promise<void>;
  compareModels: () => Promise<void>;

  exportAsJSON: () => string;
  exportAsMarkdown: () => string;

  // Model actions
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  toggleModelEnabled: (id: string) => void;
  setActiveModel: (id: string) => void;
  testConnection: (modelId: string) => Promise<{ success: boolean; message: string }>; // 测试连接

  togglePreview: () => void;
  toggleTemplates: () => void;
  toggleDarkMode: () => void;
  toggleModelPanel: () => void;
}
