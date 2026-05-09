import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PromptLabState,
  PromptBlock,
  PromptTemplate,
  ModelConfig,
  ExecutionResult,
  ApiFormat,
} from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Preset model providers (like the screenshot: MiniMax, Volcengine, Youdao, etc.)
const presetModels: ModelConfig[] = [
  {
    id: 'preset-openai',
    name: 'OpenAI',
    provider: 'OpenAI',
    icon: '🟢',
    enabled: false,
    isCustom: false,
    apiKey: '',
    apiBase: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    apiFormat: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
  },
  {
    id: 'preset-anthropic',
    name: 'Anthropic',
    provider: 'Anthropic',
    icon: '🟠',
    enabled: false,
    isCustom: false,
    apiKey: '',
    apiBase: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
    apiFormat: 'anthropic',
    temperature: 0.7,
    maxTokens: 2048,
  },
  {
    id: 'preset-deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    icon: '🔵',
    enabled: false,
    isCustom: false,
    apiKey: '',
    apiBase: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    apiFormat: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
  },
  {
    id: 'preset-ollama',
    name: 'Ollama',
    provider: 'Ollama',
    icon: '🦙',
    enabled: false,
    isCustom: false,
    apiKey: '',
    apiBase: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    apiFormat: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
  },
  {
    id: 'preset-siliconflow',
    name: 'SiliconFlow',
    provider: '硅基流动',
    icon: '💠',
    enabled: false,
    isCustom: false,
    apiKey: '',
    apiBase: 'https://api.siliconflow.cn/v1',
    model: 'Qwen/Qwen2.5-72B-Instruct',
    apiFormat: 'openai',
    temperature: 0.7,
    maxTokens: 2048,
  },
];

// Sample templates
const sampleTemplates: PromptTemplate[] = [
  {
    id: 'code-review',
    name: 'Code Review Assistant',
    description: 'Review code for bugs, performance issues, and best practices',
    category: 'Development',
    blocks: [
      {
        id: 'sys-1',
        type: 'system',
        content:
          'You are an expert code reviewer. Focus on:\n- Bug detection\n- Performance optimization\n- Code readability\n- Best practices',
        position: { x: 100, y: 100 },
        connections: { input: [], output: ['user-1'] },
      },
      {
        id: 'user-1',
        type: 'user',
        content: 'Review this code:\n\n```\n{{code}}\n```',
        position: { x: 100, y: 250 },
        connections: { input: ['sys-1'], output: ['out-1'] },
        metadata: { variable: 'code' },
      },
      {
        id: 'out-1',
        type: 'output',
        content: 'Review the code and provide feedback',
        position: { x: 100, y: 400 },
        connections: { input: ['user-1'], output: [] },
      },
    ],
    variables: { code: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'blog-writer',
    name: 'Blog Post Writer',
    description: 'Generate engaging blog posts on any topic',
    category: 'Content',
    blocks: [
      {
        id: 'sys-2',
        type: 'system',
        content:
          'You are a professional content writer. Write engaging, SEO-friendly blog posts with:\n- Compelling headlines\n- Clear structure\n- Actionable insights\n- Natural tone',
        position: { x: 100, y: 100 },
        connections: { input: [], output: ['user-2'] },
      },
      {
        id: 'user-2',
        type: 'user',
        content:
          'Write a blog post about: {{topic}}\n\nTarget audience: {{audience}}\n\nTone: {{tone}}',
        position: { x: 100, y: 250 },
        connections: { input: ['sys-2'], output: ['out-2'] },
        metadata: { variable: 'topic,audience,tone' },
      },
      {
        id: 'out-2',
        type: 'output',
        content: 'Generate blog post',
        position: { x: 100, y: 400 },
        connections: { input: ['user-2'], output: [] },
      },
    ],
    variables: { topic: '', audience: 'general', tone: 'friendly' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Build messages array from blocks for API call
 */
function buildMessages(blocks: PromptBlock[]): Array<{ role: string; content: string }> {
  const sorted = [...blocks].sort((a, b) => a.position.y - b.position.y);
  return sorted
    .filter((b) => b.type !== 'output' && b.type !== 'condition')
    .map((b) => ({
      role: b.type === 'system' ? 'system' : b.type === 'assistant' ? 'assistant' : 'user',
      content: b.content,
    }));
}

/**
 * Call OpenAI-compatible API (including Ollama)
 */
async function callOpenAI(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>
): Promise<{ output: string; tokens: { prompt: number; completion: number; total: number } }> {
  const body = {
    model: model.model,
    messages,
    temperature: model.temperature,
    max_tokens: model.maxTokens,
  };

  // Ollama/本地模型不需要 Authorization header
  const isLocal = model.apiBase.includes('localhost') || model.apiBase.includes('127.0.0.1');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!isLocal && model.apiKey) {
    headers['Authorization'] = `Bearer ${model.apiKey}`;
  }

  const res = await fetch(`${model.apiBase}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    output: data.choices?.[0]?.message?.content || '(empty response)',
    tokens: {
      prompt: data.usage?.prompt_tokens ?? 0,
      completion: data.usage?.completion_tokens ?? 0,
      total: data.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  model: ModelConfig,
  messages: Array<{ role: string; content: string }>
): Promise<{ output: string; tokens: { prompt: number; completion: number; total: number } }> {
  // Extract system message
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const body = {
    model: model.model,
    messages: chatMessages,
    system: systemMsg?.content || '',
    max_tokens: model.maxTokens,
    temperature: model.temperature,
  };

  const res = await fetch(`${model.apiBase}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': model.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    output: data.content?.[0]?.text || '(empty response)',
    tokens: {
      prompt: data.usage?.input_tokens ?? 0,
      completion: data.usage?.output_tokens ?? 0,
      total: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };
}

export const usePromptLabStore = create<PromptLabState>()(
  persist(
    (set, get) => ({
      // Initial State
      blocks: [],
      selectedBlockId: null,
      templates: sampleTemplates,
      isExecuting: false,
      executionHistory: [],
      currentComparison: null,
      models: presetModels,
      activeModelId: null,
      showPreview: true,
      showTemplates: false,
      darkMode: false,
      showModelPanel: false,

      // Block Actions
      addBlock: (block) =>
        set((state) => ({
          blocks: [...state.blocks, block],
        })),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      removeBlock: (id) =>
        set((state) => ({
          blocks: state.blocks.filter((b) => b.id !== id),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        })),

      selectBlock: (id) => set({ selectedBlockId: id }),

      connectBlocks: (sourceId, targetId) =>
        set((state) => ({
          blocks: state.blocks.map((b) => {
            if (b.id === sourceId) {
              return {
                ...b,
                connections: {
                  ...b.connections,
                  output: [...b.connections.output, targetId],
                },
              };
            }
            if (b.id === targetId) {
              return {
                ...b,
                connections: {
                  ...b.connections,
                  input: [...b.connections.input, sourceId],
                },
              };
            }
            return b;
          }),
        })),

      // Template Actions
      loadTemplate: (template) =>
        set({
          blocks: JSON.parse(JSON.stringify(template.blocks)),
        }),

      saveAsTemplate: (name, description) => {
        const state = get();
        const template: PromptTemplate = {
          id: generateId(),
          name,
          description,
          category: 'Custom',
          blocks: state.blocks,
          variables: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          templates: [...s.templates, template],
        }));
      },

      // Execution — real API call
      executePrompt: async () => {
        const state = get();
        const { blocks, models, activeModelId } = state;

        if (!activeModelId) {
          throw new Error('请先选择一个模型');
        }

        const activeModel = models.find((m) => m.id === activeModelId);
        if (!activeModel) {
          throw new Error('未找到选中的模型配置');
        }

        // Ollama/本地模型不需要 API key
        const isLocalModel =
          activeModel.provider === 'Ollama' ||
          activeModel.apiBase.includes('localhost') ||
          activeModel.apiBase.includes('127.0.0.1');

        if (!isLocalModel && !activeModel.apiKey) {
          throw new Error('请先配置 API Key');
        }

        if (blocks.length === 0) {
          throw new Error('画布中没有 prompt 块');
        }

        set({ isExecuting: true });

        const startTime = Date.now();
        const messages = buildMessages(blocks);
        const inputPreview = messages.map((m) => m.content).join('\n');

        try {
          let result;
          if (activeModel.apiFormat === 'anthropic') {
            result = await callAnthropic(activeModel, messages);
          } else {
            result = await callOpenAI(activeModel, messages);
          }

          const latency = Date.now() - startTime;

          const executionResult: ExecutionResult = {
            id: generateId(),
            promptId: generateId(),
            modelId: activeModel.id,
            input: inputPreview,
            output: result.output,
            tokens: result.tokens,
            latency,
            timestamp: new Date().toISOString(),
          };

          set((s) => ({
            isExecuting: false,
            executionHistory: [executionResult, ...s.executionHistory].slice(0, 50),
          }));
        } catch (error) {
          set({ isExecuting: false });
          // Store error as execution result too
          const errResult: ExecutionResult = {
            id: generateId(),
            promptId: generateId(),
            modelId: activeModel.id,
            input: inputPreview,
            output: `❌ 错误: ${error instanceof Error ? error.message : String(error)}`,
            tokens: { prompt: 0, completion: 0, total: 0 },
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
          set((s) => ({
            executionHistory: [errResult, ...s.executionHistory].slice(0, 50),
          }));
          throw error;
        }
      },

      compareModels: async () => {
        set({ isExecuting: true });
        await new Promise((r) => setTimeout(r, 2000));
        set({ isExecuting: false });
      },

      // Model actions
      addModel: (model) =>
        set((state) => ({
          models: [...state.models, model],
        })),

      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),

      removeModel: (id) =>
        set((state) => ({
          models: state.models.filter((m) => m.id !== id),
          activeModelId: state.activeModelId === id ? null : state.activeModelId,
        })),

      toggleModelEnabled: (id) =>
        set((state) => ({
          models: state.models.map((m) =>
            m.id === id ? { ...m, enabled: !m.enabled } : m
          ),
        })),

      setActiveModel: (id) => set({ activeModelId: id }),

      testConnection: async (modelId) => {
        const state = get();
        const model = state.models.find((m) => m.id === modelId);
        if (!model) return { success: false, message: '模型不存在' };

        // Ollama/本地模型不需要 API key
        const isLocal =
          model.provider === 'Ollama' ||
          model.apiBase.includes('localhost') ||
          model.apiBase.includes('127.0.0.1');

        if (!isLocal && !model.apiKey) {
          return { success: false, message: '请先填写 API Key' };
        }

        try {
          const startTime = Date.now();
          if (model.apiFormat === 'anthropic') {
            const res = await fetch(`${model.apiBase}/v1/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': model.apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: model.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'hi' }],
              }),
            });
            if (!res.ok) {
              const err = await res.json();
              return { success: false, message: err.error?.message || `HTTP ${res.status}` };
            }
          } else {
            // Ollama/本地模型不需要 Authorization header
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };
            if (!isLocal && model.apiKey) {
              headers['Authorization'] = `Bearer ${model.apiKey}`;
            }
            const res = await fetch(`${model.apiBase}/chat/completions`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                model: model.model,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'hi' }],
              }),
            });
            if (!res.ok) {
              const err = await res.json();
              return { success: false, message: err.error?.message || `HTTP ${res.status}` };
            }
          }
          const latency = Date.now() - startTime;
          return { success: true, message: `连接成功 (${latency}ms)` };
        } catch (e) {
          return { success: false, message: e instanceof Error ? e.message : '连接失败' };
        }
      },

      // UI Actions
      togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
      toggleTemplates: () => set((state) => ({ showTemplates: !state.showTemplates })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleModelPanel: () => set((state) => ({ showModelPanel: !state.showModelPanel })),
    }),
    {
      name: 'promptlab-storage',
      partialize: (state) => ({
        blocks: state.blocks,
        templates: state.templates,
        models: state.models,
        activeModelId: state.activeModelId,
        executionHistory: state.executionHistory,
        darkMode: state.darkMode,
      }),
    }
  )
);
