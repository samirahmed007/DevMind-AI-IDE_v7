import { ModelConfig, ProviderType, AppTheme } from './types';

export const DEFAULT_MODELS: ModelConfig[] = [
  // Google
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'google', contextWindow: 2000000, vision: true },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google', contextWindow: 1000000, vision: true },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite', provider: 'google', contextWindow: 1000000, vision: true },
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, vision: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextWindow: 128000, vision: true },
  { id: 'o1-preview', name: 'OpenAI o1 Preview', provider: 'openai', contextWindow: 128000, vision: false },
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000, vision: true },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: 200000, vision: false },
  // OpenRouter
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (OR)', provider: 'openrouter', contextWindow: 200000, vision: true },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B (OR)', provider: 'openrouter', contextWindow: 128000, vision: false },
  { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (OR)', provider: 'openrouter', contextWindow: 2000000, vision: true },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (OR)', provider: 'openrouter', contextWindow: 64000, vision: false },
];

export const THEMES: { id: AppTheme, name: string }[] = [
  { id: 'dark', name: 'Default Dark' },
  { id: 'light', name: 'Light' },
  { id: 'midnight', name: 'Midnight Blue' },
  { id: 'solarized', name: 'Solarized Dark' },
];

export const DEFAULT_SETTINGS = {
  activeProvider: 'google' as ProviderType,
  activeModelId: 'gemini-3-flash-preview',
  apiKeys: {
    google: '', 
    openai: '',
    anthropic: '',
    openrouter: '',
    local: '',
  },
  customModels: [],
  customEndpoints: {
    google: '',
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    local: 'http://localhost:11434/v1',
  },
  editorFontSize: 14,
  editorWordWrap: 'on' as 'on' | 'off',
  theme: 'dark' as AppTheme,
};

export const SYSTEM_INSTRUCTION_AGENT = `
You are DevMind, an expert AI Software Engineer.
When requested to perform changes, you MUST use the following XML action protocol.
Always wrap multiple actions in an <actions> tag.
Always wrap code content in <![CDATA[ ]]> to preserve formatting and handle special characters.

### ACTION PROTOCOL:

1. **CREATE A NEW FILE:**
<create>
  <path>path/to/file.ext</path>
  <content><![CDATA[FULL_FILE_CONTENT_HERE]]></content>
</create>

2. **EDIT EXISTING FILE:**
Provide the EXACT code to find in <search> and the new version in <replace>. 
Be very careful with indentation and symbols.
<edit>
  <path>path/to/file.ext</path>
  <search><![CDATA[EXACT_CODE_BLOCK_TO_FIND]]></search>
  <replace><![CDATA[NEW_CODE_BLOCK_TO_INSERT]]></replace>
</edit>

### RULES:
- Use relative paths from the project root.
- The <search> block must be unique and large enough to be unambiguous.
- Explain the logic of your changes briefly before the XML block.
- If you are creating multiple files, include them all in one <actions> wrapper.
`;