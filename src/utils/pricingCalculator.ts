import { LLMConfig, LLMProvider } from '../types';

export interface ModelPricing {
  inputPer1MUsd: number;
  outputPer1MUsd: number;
  providerDisplayName: string;
  modelDisplayName: string;
  isFreeOrLocal?: boolean;
}

export const USD_TO_RUB_EXCHANGE_RATE = 90.0;

// Pricing registry per 1M tokens in USD (as of 2025/2026 standard rates)
export const MODEL_PRICING_TABLE: Record<string, { input: number; output: number; name: string }> = {
  // Google Gemini
  'gemini-2.5-flash': { input: 0.075, output: 0.30, name: 'Gemini 2.5 Flash' },
  'gemini-2.5-pro': { input: 1.25, output: 5.00, name: 'Gemini 2.5 Pro' },
  'gemini-1.5-flash': { input: 0.075, output: 0.30, name: 'Gemini 1.5 Flash' },
  'gemini-1.5-pro': { input: 1.25, output: 5.00, name: 'Gemini 1.5 Pro' },

  // Mistral AI
  'mistral-large-latest': { input: 2.00, output: 6.00, name: 'Mistral Large' },
  'pixtral-large-latest': { input: 2.00, output: 6.00, name: 'Pixtral Large' },
  'codestral-latest': { input: 0.20, output: 0.60, name: 'Codestral' },
  'mistral-small-latest': { input: 0.20, output: 0.60, name: 'Mistral Small' },

  // OpenAI
  'gpt-4o': { input: 2.50, output: 10.00, name: 'GPT-4o (Omni)' },
  'gpt-4o-mini': { input: 0.15, output: 0.60, name: 'GPT-4o mini' },
  'o1': { input: 15.00, output: 60.00, name: 'OpenAI o1' },
  'o3-mini': { input: 1.10, output: 4.40, name: 'OpenAI o3-mini' },

  // Anthropic Claude
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, name: 'Claude 3.5 Sonnet' },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, name: 'Claude 3.5 Haiku' },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00, name: 'Claude 3 Opus' },

  // DeepSeek Direct
  'deepseek-chat': { input: 0.14, output: 0.28, name: 'DeepSeek-V3' },
  'deepseek-reasoner': { input: 0.55, output: 2.19, name: 'DeepSeek-R1' },

  // DeepInfra
  'meta-llama/Llama-3.3-70B-Instruct': { input: 0.13, output: 0.40, name: 'Llama 3.3 70B' },
  'deepseek-ai/DeepSeek-R1': { input: 0.55, output: 2.19, name: 'DeepSeek-R1 (DeepInfra)' },
  'deepseek-ai/DeepSeek-V3': { input: 0.14, output: 0.28, name: 'DeepSeek-V3 (DeepInfra)' },
  'Qwen/Qwen2.5-Coder-32B-Instruct': { input: 0.08, output: 0.16, name: 'Qwen 2.5 Coder 32B' },
  'mistralai/Mistral-7B-Instruct-v0.3': { input: 0.05, output: 0.10, name: 'Mistral 7B' },
  'microsoft/WizardLM-2-8x22B': { input: 0.50, output: 0.50, name: 'WizardLM-2 8x22B' },

  // Ollama / Local (Free compute)
  'llama3': { input: 0, output: 0, name: 'Llama 3 (Local)' },
  'qwen2.5': { input: 0, output: 0, name: 'Qwen 2.5 (Local)' },
  'deepseek-r1:8b': { input: 0, output: 0, name: 'DeepSeek R1 (Local)' },
};

/**
 * Get pricing per 1M tokens in USD for a given provider and model
 */
export function getPricingForModel(config: LLMConfig): ModelPricing {
  const provider = config.provider;
  const modelId = config.modelName || 'gemini-2.5-flash';

  if (provider === 'ollama') {
    return {
      inputPer1MUsd: 0,
      outputPer1MUsd: 0,
      providerDisplayName: 'Ollama (Локальный)',
      modelDisplayName: modelId,
      isFreeOrLocal: true,
    };
  }

  // Look up known model in dictionary
  const exact = MODEL_PRICING_TABLE[modelId];
  if (exact) {
    return {
      inputPer1MUsd: exact.input,
      outputPer1MUsd: exact.output,
      providerDisplayName: getProviderNameSimple(provider),
      modelDisplayName: exact.name,
      isFreeOrLocal: exact.input === 0 && exact.output === 0,
    };
  }

  // Default fallbacks based on provider type
  switch (provider) {
    case 'gemini':
      if (modelId.includes('pro')) {
        return { inputPer1MUsd: 1.25, outputPer1MUsd: 5.00, providerDisplayName: 'Google Gemini', modelDisplayName: modelId };
      }
      return { inputPer1MUsd: 0.075, outputPer1MUsd: 0.30, providerDisplayName: 'Google Gemini', modelDisplayName: modelId };
    
    case 'openai':
      if (modelId.includes('mini')) {
        return { inputPer1MUsd: 0.15, outputPer1MUsd: 0.60, providerDisplayName: 'OpenAI', modelDisplayName: modelId };
      }
      return { inputPer1MUsd: 2.50, outputPer1MUsd: 10.00, providerDisplayName: 'OpenAI', modelDisplayName: modelId };

    case 'anthropic':
      if (modelId.includes('haiku')) {
        return { inputPer1MUsd: 0.80, outputPer1MUsd: 4.00, providerDisplayName: 'Anthropic Claude', modelDisplayName: modelId };
      }
      return { inputPer1MUsd: 3.00, outputPer1MUsd: 15.00, providerDisplayName: 'Anthropic Claude', modelDisplayName: modelId };

    case 'deepseek':
      return { inputPer1MUsd: 0.20, outputPer1MUsd: 0.50, providerDisplayName: 'DeepSeek', modelDisplayName: modelId };

    case 'deepinfra':
    case 'zipinfra':
      return { inputPer1MUsd: 0.20, outputPer1MUsd: 0.50, providerDisplayName: 'DeepInfra', modelDisplayName: modelId };

    case 'mistral':
      return { inputPer1MUsd: 2.00, outputPer1MUsd: 6.00, providerDisplayName: 'Mistral AI', modelDisplayName: modelId };

    default:
      return { inputPer1MUsd: 0.50, outputPer1MUsd: 1.50, providerDisplayName: 'Пользовательский API', modelDisplayName: modelId };
  }
}

function getProviderNameSimple(provider: LLMProvider): string {
  switch (provider) {
    case 'gemini': return 'Google Gemini';
    case 'mistral': return 'Mistral AI';
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'deepseek': return 'DeepSeek';
    case 'deepinfra': return 'DeepInfra';
    case 'zipinfra': return 'Zipinfra';
    case 'ollama': return 'Ollama';
    default: return 'Custom';
  }
}

export interface CostEstimationResult {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  totalCostRub: number;
  pricing: ModelPricing;
}

/**
 * Calculate token counts and price estimates in real time
 */
export function estimateQueryCost(
  totalChars: number,
  config: LLMConfig,
  customExpectedOutputTokens: number = 2200
): CostEstimationResult {
  // Cyrillic and technical Russian procurement text averages ~2.8 characters per token
  const inputTokens = totalChars > 0 ? Math.max(80, Math.ceil(totalChars / 2.8)) : 0;
  const outputTokens = totalChars > 0 ? customExpectedOutputTokens : 0;
  const totalTokens = inputTokens + outputTokens;

  const pricing = getPricingForModel(config);

  const inputCostUsd = (inputTokens / 1_000_000) * pricing.inputPer1MUsd;
  const outputCostUsd = (outputTokens / 1_000_000) * pricing.outputPer1MUsd;
  const totalCostUsd = inputCostUsd + outputCostUsd;
  const totalCostRub = totalCostUsd * USD_TO_RUB_EXCHANGE_RATE;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd,
    totalCostRub,
    pricing,
  };
}
