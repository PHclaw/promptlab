import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PromptLabState,
  PromptBlock,
  PromptTemplate,
  ModelConfig,
  ExecutionResult,
  ApiFormat,
  CollectedVariable,
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

// Sample templates — 12 个实用模板
const sampleTemplates: PromptTemplate[] = [
  {
    id: 'code-review',
    name: '代码审查助手',
    description: '审查代码中的 Bug、性能问题和最佳实践',
    category: 'Development',
    blocks: [
      { id: 'sys-1', type: 'system', content: '你是一位资深代码审查专家。重点关注：\n- Bug 检测\n- 性能优化\n- 代码可读性\n- 最佳实践\n\n请用中文回复，给出具体的修改建议和代码示例。', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-1'] } },
      { id: 'user-1', type: 'user', content: '请审查以下代码：\n\n```{{language}}\n{{code}}\n```', position: { x: 100, y: 250 }, connections: { input: ['sys-1'], output: ['out-1'] }, metadata: { variable: 'language,code' } },
      { id: 'out-1', type: 'output', content: '代码审查报告', position: { x: 100, y: 400 }, connections: { input: ['user-1'], output: [] } },
    ],
    variables: { language: 'python', code: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'blog-writer',
    name: '博客写手',
    description: '生成引人入胜的技术博客文章',
    category: 'Content',
    blocks: [
      { id: 'sys-2', type: 'system', content: '你是一位专业的技术写手。撰写引人入胜、SEO 友好的博客文章：\n- 吸引人的标题\n- 清晰的结构\n- 实用的要点\n- 自然的语气\n\n使用 Markdown 格式输出。', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-2'] } },
      { id: 'user-2', type: 'user', content: '写一篇关于 {{topic}} 的博客文章\n\n目标读者：{{audience}}\n风格：{{tone}}', position: { x: 100, y: 250 }, connections: { input: ['sys-2'], output: ['out-2'] }, metadata: { variable: 'topic,audience,tone' } },
      { id: 'out-2', type: 'output', content: '博客文章', position: { x: 100, y: 400 }, connections: { input: ['user-2'], output: [] } },
    ],
    variables: { topic: '', audience: '开发者', tone: '轻松专业' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'api-docs',
    name: 'API 文档生成器',
    description: '根据代码自动生成 API 文档',
    category: 'Development',
    blocks: [
      { id: 'sys-3', type: 'system', content: '你是一位 API 文档专家。根据提供的代码或接口描述，生成规范的 API 文档。\n\n文档格式要求：\n- 接口路径、方法、参数说明\n- 请求/响应示例（JSON）\n- 错误码说明\n- 使用注意事项', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-3'] } },
      { id: 'user-3', type: 'user', content: '为以下接口生成 API 文档：\n\n{{api_description}}', position: { x: 100, y: 250 }, connections: { input: ['sys-3'], output: ['out-3'] }, metadata: { variable: 'api_description' } },
      { id: 'out-3', type: 'output', content: 'API 文档', position: { x: 100, y: 400 }, connections: { input: ['user-3'], output: [] } },
    ],
    variables: { api_description: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'translator',
    name: '智能翻译器',
    description: '高质量多语言翻译，保留上下文和语气',
    category: 'Content',
    blocks: [
      { id: 'sys-4', type: 'system', content: '你是一位专业翻译。遵循以下原则：\n- 准确传达原文含义\n- 保持原文的语气和风格\n- 适当本地化，而非直译\n- 技术术语保留英文或提供双语对照\n- 翻译结果自然流畅', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-4'] } },
      { id: 'user-4', type: 'user', content: '将以下内容从 {{source_lang}} 翻译为 {{target_lang}}：\n\n{{text}}', position: { x: 100, y: 250 }, connections: { input: ['sys-4'], output: ['out-4'] }, metadata: { variable: 'source_lang,target_lang,text' } },
      { id: 'out-4', type: 'output', content: '翻译结果', position: { x: 100, y: 400 }, connections: { input: ['user-4'], output: [] } },
    ],
    variables: { source_lang: '英文', target_lang: '中文', text: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'data-analyst',
    name: '数据分析助手',
    description: '分析数据并生成洞察报告',
    category: 'Analysis',
    blocks: [
      { id: 'sys-5', type: 'system', content: '你是一位数据分析专家。分析提供的数据，给出：\n- 关键趋势和模式\n- 异常值识别\n- 统计摘要\n- 可视化建议\n- 业务洞察和建议', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-5'] } },
      { id: 'user-5', type: 'user', content: '分析以下数据：\n\n{{data}}\n\n分析目标：{{goal}}', position: { x: 100, y: 250 }, connections: { input: ['sys-5'], output: ['out-5'] }, metadata: { variable: 'data,goal' } },
      { id: 'out-5', type: 'output', content: '分析报告', position: { x: 100, y: 400 }, connections: { input: ['user-5'], output: [] } },
    ],
    variables: { data: '', goal: '发现关键趋势和异常' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'unit-test',
    name: '单元测试生成器',
    description: '为函数/类自动生成单元测试',
    category: 'Development',
    blocks: [
      { id: 'sys-6', type: 'system', content: '你是一位测试工程师。根据提供的代码生成全面的单元测试：\n- 正常路径测试\n- 边界条件测试\n- 异常处理测试\n- 使用 pytest 风格\n- 包含 mock 和 fixture', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-6'] } },
      { id: 'user-6', type: 'user', content: '为以下代码生成单元测试：\n\n```{{language}}\n{{code}}\n```', position: { x: 100, y: 250 }, connections: { input: ['sys-6'], output: ['out-6'] }, metadata: { variable: 'language,code' } },
      { id: 'out-6', type: 'output', content: '单元测试代码', position: { x: 100, y: 400 }, connections: { input: ['user-6'], output: [] } },
    ],
    variables: { language: 'python', code: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'email-writer',
    name: '邮件撰写助手',
    description: '撰写专业的商务邮件',
    category: 'Business',
    blocks: [
      { id: 'sys-7', type: 'system', content: '你是一位商务沟通专家。撰写专业、得体的邮件：\n- 礼貌但不冗余\n- 重点突出\n- 明确的 CTA\n- 适当的格式', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-7'] } },
      { id: 'user-7', type: 'user', content: '撰写一封邮件：\n\n收件人：{{recipient}}\n目的：{{purpose}}\n关键信息：{{key_info}}\n语气：{{tone}}', position: { x: 100, y: 250 }, connections: { input: ['sys-7'], output: ['out-7'] }, metadata: { variable: 'recipient,purpose,key_info,tone' } },
      { id: 'out-7', type: 'output', content: '邮件内容', position: { x: 100, y: 400 }, connections: { input: ['user-7'], output: [] } },
    ],
    variables: { recipient: '', purpose: '', key_info: '', tone: '专业友好' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sql-optimizer',
    name: 'SQL 优化器',
    description: '分析和优化 SQL 查询语句',
    category: 'Development',
    blocks: [
      { id: 'sys-8', type: 'system', content: '你是一位数据库专家。分析并优化 SQL 查询：\n- 执行计划分析\n- 索引建议\n- 查询重写\n- 性能对比\n- 最佳实践建议', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-8'] } },
      { id: 'user-8', type: 'user', content: '优化以下 SQL 查询：\n\n```sql\n{{sql}}\n```\n\n数据库类型：{{db_type}}\n表数据量级：{{data_size}}', position: { x: 100, y: 250 }, connections: { input: ['sys-8'], output: ['out-8'] }, metadata: { variable: 'sql,db_type,data_size' } },
      { id: 'out-8', type: 'output', content: '优化建议', position: { x: 100, y: 400 }, connections: { input: ['user-8'], output: [] } },
    ],
    variables: { sql: '', db_type: 'PostgreSQL', data_size: '百万级' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'product-prd',
    name: 'PRD 生成器',
    description: '根据需求描述生成产品需求文档',
    category: 'Product',
    blocks: [
      { id: 'sys-9', type: 'system', content: '你是一位产品经理。根据需求描述撰写 PRD：\n- 背景与目标\n- 用户故事\n- 功能需求（P0/P1/P2）\n- 非功能需求\n- 技术方案建议\n- 里程碑规划', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-9'] } },
      { id: 'user-9', type: 'user', content: '为以下需求撰写 PRD：\n\n产品名称：{{product_name}}\n需求描述：{{requirement}}\n目标用户：{{target_user}}', position: { x: 100, y: 250 }, connections: { input: ['sys-9'], output: ['out-9'] }, metadata: { variable: 'product_name,requirement,target_user' } },
      { id: 'out-9', type: 'output', content: 'PRD 文档', position: { x: 100, y: 400 }, connections: { input: ['user-9'], output: [] } },
    ],
    variables: { product_name: '', requirement: '', target_user: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'summarizer',
    name: '文章摘要器',
    description: '将长文提炼为结构化摘要',
    category: 'Analysis',
    blocks: [
      { id: 'sys-10', type: 'system', content: '你是一位内容分析师。将长文提炼为结构化摘要：\n- 核心观点（3-5 条）\n- 关键数据/论据\n- 结论\n- 行动建议（如有）\n\n摘要长度约为原文的 10-15%。', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-10'] } },
      { id: 'user-10', type: 'user', content: '请摘要以下文章：\n\n{{article}}', position: { x: 100, y: 250 }, connections: { input: ['sys-10'], output: ['out-10'] }, metadata: { variable: 'article' } },
      { id: 'out-10', type: 'output', content: '摘要结果', position: { x: 100, y: 400 }, connections: { input: ['user-10'], output: [] } },
    ],
    variables: { article: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'git-commit',
    name: 'Commit Message 生成器',
    description: '根据 diff 生成规范的 commit message',
    category: 'Development',
    blocks: [
      { id: 'sys-11', type: 'system', content: '你是一位 Git 专家。根据代码变更生成规范的 commit message：\n- 遵循 Conventional Commits 规范\n- type(scope): subject 格式\n- subject 不超过 50 字符\n- body 说明 why 而非 what\n- breaking changes 标注 BREAKING CHANGE', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-11'] } },
      { id: 'user-11', type: 'user', content: '为以下代码变更生成 commit message：\n\n```diff\n{{diff}}\n```', position: { x: 100, y: 250 }, connections: { input: ['sys-11'], output: ['out-11'] }, metadata: { variable: 'diff' } },
      { id: 'out-11', type: 'output', content: 'Commit message', position: { x: 100, y: 400 }, connections: { input: ['user-11'], output: [] } },
    ],
    variables: { diff: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'creative-story',
    name: '创意故事生成器',
    description: '根据设定生成短篇小说或故事片段',
    category: 'Creative',
    blocks: [
      { id: 'sys-12', type: 'system', content: '你是一位创意作家。根据设定创作引人入胜的故事：\n- 丰富的人物刻画\n- 紧凑的情节推进\n- 生动的场景描写\n- 出人意料的转折\n- 留白和悬念', position: { x: 100, y: 100 }, connections: { input: [], output: ['user-12'] } },
      { id: 'user-12', type: 'user', content: '创作一个故事：\n\n题材：{{genre}}\n主角：{{protagonist}}\n背景：{{setting}}\n核心冲突：{{conflict}}', position: { x: 100, y: 250 }, connections: { input: ['sys-12'], output: ['out-12'] }, metadata: { variable: 'genre,protagonist,setting,conflict' } },
      { id: 'out-12', type: 'output', content: '故事', position: { x: 100, y: 400 }, connections: { input: ['user-12'], output: [] } },
    ],
    variables: { genre: '科幻', protagonist: '', setting: '近未来地球', conflict: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Extract {{variable}} names from text
 */
function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
}

/**
 * Build messages array from blocks for API call
 * Replaces {{variable}} placeholders with provided values
 */
function buildMessages(
  blocks: PromptBlock[],
  variables?: Record<string, string>
): Array<{ role: string; content: string }> {
  const sorted = [...blocks].sort((a, b) => a.position.y - b.position.y);
  return sorted
    .filter((b) => b.type !== 'output' && b.type !== 'condition')
    .map((b) => {
      let content = b.content;
      if (variables) {
        Object.entries(variables).forEach(([key, val]) => {
          content = content.replaceAll(`{{${key}}}`, val);
        });
      }
      return {
        role: b.type === 'system' ? 'system' : b.type === 'assistant' ? 'assistant' : 'user',
        content,
      };
    });
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
      // Variable state
      collectedVariables: [],
      showVariableModal: false,
      pendingExecution: false,

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

      clearCanvas: () =>
        set({
          blocks: [],
          selectedBlockId: null,
          executionHistory: [],
          collectedVariables: [],
        }),

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

      // Variable Actions
      collectVariables: () => {
        const state = get();
        const allVars: CollectedVariable[] = [];
        const seen = new Set<string>();
        state.blocks.forEach((block) => {
          const vars = extractVariables(block.content);
          vars.forEach((name) => {
            if (!seen.has(name)) {
              seen.add(name);
              const existing = state.collectedVariables.find((v) => v.name === name);
              allVars.push({
                name,
                value: existing?.value || '',
                sourceBlockId: block.id,
              });
            }
          });
        });
        return allVars;
      },

      setVariableValue: (name, value) =>
        set((state) => ({
          collectedVariables: state.collectedVariables.map((v) =>
            v.name === name ? { ...v, value } : v
          ),
        })),

      toggleVariableModal: () =>
        set((state) => ({ showVariableModal: !state.showVariableModal })),

      // Execution — real API call (with variable substitution)
      executePrompt: async (variables?: Record<string, string>) => {
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
        const messages = buildMessages(blocks, variables);
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

      // Export functions
      exportAsJSON: () => {
        const state = get();
        const exportData = {
          version: '0.1.0',
          exportedAt: new Date().toISOString(),
          blocks: state.blocks,
          activeModel: state.activeModelId
            ? state.models.find((m) => m.id === state.activeModelId)?.name || null
            : null,
        };
        return JSON.stringify(exportData, null, 2);
      },

      exportAsMarkdown: () => {
        const state = get();
        const sorted = [...state.blocks].sort((a, b) => a.position.y - b.position.y);
        const lines: string[] = ['# PromptLab Export', ''];
        sorted.forEach((block) => {
          const label = block.type.charAt(0).toUpperCase() + block.type.slice(1);
          lines.push(`## ${label}`, '');
          lines.push(block.content, '');
        });
        if (state.executionHistory.length > 0) {
          const last = state.executionHistory[0];
          lines.push('---', '', '## Last Result', '');
          lines.push(last.output, '');
          if (last.tokens.total > 0) {
            lines.push(`> Tokens: ${last.tokens.total} | Latency: ${last.latency}ms`);
          }
        }
        return lines.join('\n');
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
        collectedVariables: state.collectedVariables,
      }),
    }
  )
);
