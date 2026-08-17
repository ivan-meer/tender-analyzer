import { LLMConfig, LLMProvider } from '../types';

const STORAGE_KEY = 'llm_user_config_v3';

export interface ServerLLMStatus {
  defaultProvider: LLMProvider;
  defaultModel: string;
  defaultBaseUrl?: string;
  hasGemini?: boolean;
  hasDeepinfra?: boolean;
  hasDeepInfra?: boolean;
  hasMistral?: boolean;
  hasMistralOcr?: boolean;
  hasOpenai?: boolean;
  hasOpenAI?: boolean;
  serverConfigured?: boolean;
  note?: string;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'gemini',
  modelName: 'gemini-2.5-flash',
  temperature: 0.2,
  useMistralOcrForPdf: true,
};

let cachedServerStatus: ServerLLMStatus | null = null;

export async function fetchServerLLMStatus(): Promise<ServerLLMStatus> {
  try {
    const res = await fetch('/api/llm/server-status');
    if (res.ok) {
      const data = await res.json();
      cachedServerStatus = data;
      return data;
    }
  } catch (err) {
    console.warn('Could not fetch server LLM status, using defaults:', err);
  }

  return {
    defaultProvider: 'gemini',
    defaultModel: 'gemini-2.5-flash',
    hasGemini: true,
    hasDeepinfra: true,
    hasMistral: true,
    hasMistralOcr: true,
    hasOpenai: false,
    serverConfigured: true,
  };
}

export function getServerLLMStatusSync(): ServerLLMStatus | null {
  return cachedServerStatus;
}

export function getStoredLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate provider is one of allowed
      if (['gemini', 'deepinfra', 'mistral', 'openai'].includes(parsed.provider)) {
        return { ...DEFAULT_LLM_CONFIG, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored LLM config:', err);
  }
  return DEFAULT_LLM_CONFIG;
}

export function saveLLMConfig(config: LLMConfig): void {
  try {
    // Keep provider, model selection, temperature and ocr preference in local state
    const cleanConfig: LLMConfig = {
      provider: config.provider,
      modelName: config.modelName,
      temperature: config.temperature,
      useMistralOcrForPdf: config.useMistralOcrForPdf,
      baseUrl: config.baseUrl || undefined,
      // Only keep optional user override keys if explicitly provided
      apiKey: config.apiKey ? config.apiKey : undefined,
      mistralApiKey: config.mistralApiKey ? config.mistralApiKey : undefined,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanConfig));
    // Dispatch custom event for real-time reactivity in other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('llm_config_changed', { detail: cleanConfig }));
    }
  } catch (err) {
    console.warn('Failed to save LLM config:', err);
  }
}

export function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'gemini': return 'Google Gemini (По умолчанию)';
    case 'deepinfra': 
    case 'zipinfra': return 'DeepInfra (Llama 3.3 / DeepSeek / Фоллбэк)';
    case 'mistral': return 'Mistral AI (+ OCR)';
    case 'openai': return 'OpenAI (GPT-4o / o1 / o3-mini)';
    default: return provider;
  }
}

