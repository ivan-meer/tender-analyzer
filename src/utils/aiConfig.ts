import { LLMConfig } from '../types';

const STORAGE_KEY = 'llm_user_config_v1';

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'gemini',
  modelName: 'gemini-2.5-flash',
  temperature: 0.2,
  useMistralOcrForPdf: true,
};

export function getStoredLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LLM_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse stored LLM config:', err);
  }
  return DEFAULT_LLM_CONFIG;
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch custom event for real-time reactivity in other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('llm_config_changed', { detail: config }));
    }
  } catch (err) {
    console.warn('Failed to save LLM config:', err);
  }
}

export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'gemini': return 'Google Gemini';
    case 'mistral': return 'Mistral AI';
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic Claude';
    case 'deepseek': return 'DeepSeek AI';
    case 'deepinfra': 
    case 'zipinfra': return 'DeepInfra / Zipinfra (Llama 3.3 / DeepSeek / Qwen)';
    case 'ollama': return 'Ollama / Local LLM';
    case 'custom': return 'Пользовательский API';
    default: return provider;
  }
}
