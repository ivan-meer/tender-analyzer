import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  FileSearch, 
  Zap, 
  Sliders, 
  Database,
  Bot,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  ShieldCheck,
  Flame,
  Info
} from 'lucide-react';
import { LLMConfig, LLMProvider } from '../types';
import { getStoredLLMConfig, saveLLMConfig, getProviderDisplayName } from '../utils/aiConfig';
import { Tooltip } from './Tooltip';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: LLMConfig) => void;
}

const PROVIDER_MODELS: Record<LLMProvider, { name: string; id: string; desc: string; isRecommended?: boolean }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Высокая скорость, оптимизирован для аналитики и 223-ФЗ/44-ФЗ', isRecommended: true },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Углубленный юридический анализ, аудит рисков и рассуждения' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Быстрый легковесный вариант' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', desc: 'Флагманская модель Mistral для сложных юридических задач', isRecommended: true },
    { id: 'pixtral-large-latest', name: 'Pixtral Large (Vision)', desc: 'Мультимодальная модель с распознаванием сканов и таблиц' },
    { id: 'codestral-latest', name: 'Codestral', desc: 'Анализ структурированных JSON/SQL данных и спецификаций' },
    { id: 'mistral-small-latest', name: 'Mistral Small', desc: 'Быстрая экономичная модель' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni)', desc: 'Флагманская мультимодальная модель OpenAI', isRecommended: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: 'Быстрая компактная модель для регулярных задач' },
    { id: 'o1', name: 'OpenAI o1', desc: 'Модель с глубокими пошаговыми цепями рассуждений' },
    { id: 'o3-mini', name: 'OpenAI o3-mini', desc: 'Компактная логическая модель' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Эталон качества для юриспруденции и логического анализа', isRecommended: true },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Сверхбыстрый и точный помощник' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Максимальная глубина юридического аудита' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', desc: 'Производительная китайская модель с открытым весом', isRecommended: true },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoner)', desc: 'Модель глубоких логических рассуждений R1' },
  ],
  deepinfra: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B Instruct', desc: 'Флагманская модель Meta на серверах DeepInfra', isRecommended: true },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1 (Reasoner)', desc: 'Глубокие логические рассуждения и логика закупки' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', desc: 'Быстрая производительная модель DeepSeek' },
    { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', desc: 'Специализированная модель для кода и строгого JSON' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B Instruct', desc: 'Легкий и быстрый инференс Mistral' },
    { id: 'microsoft/WizardLM-2-8x22B', name: 'WizardLM-2 8x22B', desc: 'Мощный MoE от Microsoft с высоким качеством' },
  ],
  zipinfra: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B Instruct', desc: 'Флагманская модель Meta на серверах DeepInfra/Zipinfra', isRecommended: true },
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek-R1 (Reasoner)', desc: 'Глубокие логические рассуждения и логика закупки' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', desc: 'Быстрая производительная модель DeepSeek' },
    { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', desc: 'Специализированная модель для кода и строгого JSON' },
  ],
  ollama: [
    { id: 'llama3', name: 'Llama 3 (Local)', desc: 'Локальная модель в вашей сети без интернета', isRecommended: true },
    { id: 'qwen2.5', name: 'Qwen 2.5', desc: 'Локальная модель с отличной поддержкой русского языка' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 Local', desc: 'Локальный Reasoner через Ollama' },
  ],
  custom: [
    { id: 'custom-model', name: 'Пользовательская модель', desc: 'Укажите наименование любой модели совместимого REST API' },
  ]
};

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<LLMConfig>(getStoredLLMConfig());
  const [fetchedModels, setFetchedModels] = useState<Array<{ id: string; name: string; desc?: string }> | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  
  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState<{
    model: boolean;
    parameters: boolean;
    integrations: boolean;
  }>({
    model: true,
    parameters: false,
    integrations: false,
  });

  const toggleSection = (section: 'model' | 'parameters' | 'integrations') => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
    modelUsed?: string;
    latencyMs?: number;
  }>({ testing: false });

  useEffect(() => {
    if (isOpen) {
      setConfig(getStoredLLMConfig());
      setFetchedModels(null);
      setFetchModelsError(null);
      setModelSearchQuery('');
      setTestStatus({ testing: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: LLMProvider) => {
    const defaultModel = PROVIDER_MODELS[newProvider]?.[0]?.id || 'custom-model';
    setConfig(prev => ({
      ...prev,
      provider: newProvider,
      modelName: defaultModel
    }));
    setFetchedModels(null);
    setFetchModelsError(null);
    setModelSearchQuery('');
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchModelsError(null);
    try {
      const res = await fetch('/api/llm/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llmConfig: config })
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models)) {
        setFetchedModels(data.models);
      } else {
        setFetchModelsError(data.error || 'Не удалось получить список моделей с сервера провайдера.');
      }
    } catch (err: any) {
      setFetchModelsError(err?.message || 'Ошибка сети при запросе моделей.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = () => {
    saveLLMConfig(config);
    if (onConfigSaved) onConfigSaved(config);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    const startTime = Date.now();
    try {
      const res = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llmConfig: config })
      });
      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (res.ok && data.success) {
        setTestStatus({
          testing: false,
          success: true,
          message: data.reply || 'Подключение успешно установлено!',
          modelUsed: data.modelUsed,
          latencyMs
        });
      } else {
        setTestStatus({
          testing: false,
          success: false,
          message: data.error || 'Не удалось подключиться к провайдеру ИИ.',
          latencyMs
        });
      }
    } catch (err: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: err?.message || 'Ошибка сети при проверке подключения.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in text-slate-900 dark:text-white">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>Параметры ИИ и провайдеров</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-bold">
                  {getProviderDisplayName(config.provider)}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Гибкая конфигурация нейросетевых моделей, параметров аудита и внешних интеграций
              </p>
            </div>
          </div>
          <Tooltip content="Закрыть окно настроек" position="bottom">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Modal Content Area with Accordions */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar text-xs">
          
          {/* GROUP 1: МОДЕЛЬ И ПРОВАЙДЕР (АККОРДЕОН) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('model')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    1. Модель и провайдер нейросети
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Текущая: <strong className="text-indigo-600 dark:text-indigo-400">{getProviderDisplayName(config.provider)}</strong> ({config.modelName})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hidden sm:inline-block">
                  Основное
                </span>
                {openSections.model ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.model && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                {/* Provider Selection Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <span>Выберите платформу провайдера:</span>
                      <Tooltip content="Вы можете переключаться между облачными LLM или подключать локальный Ollama без передачи данных в сеть" position="right">
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 cursor-help" />
                      </Tooltip>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'gemini', name: 'Google Gemini', icon: '♊', badge: 'По умолчанию' },
                      { id: 'mistral', name: 'Mistral AI', icon: '🌪️', badge: '+ OCR' },
                      { id: 'openai', name: 'OpenAI', icon: '🟢', badge: 'GPT-4o' },
                      { id: 'anthropic', name: 'Anthropic', icon: '🟣', badge: 'Claude 3.5' },
                      { id: 'deepseek', name: 'DeepSeek', icon: '🐋', badge: 'R1 / V3' },
                      { id: 'deepinfra', name: 'DeepInfra', icon: '⚡', badge: 'Fast / Llama' },
                      { id: 'ollama', name: 'Ollama / Local', icon: '🦙', badge: 'Локальный' },
                      { id: 'custom', name: 'Пользовательский', icon: '🔌', badge: 'OpenAI API' },
                    ].map(p => {
                      const isSelected = config.provider === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProviderChange(p.id as LLMProvider)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/50 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-base">{p.icon}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {p.badge}
                            </span>
                          </div>
                          <span className="font-extrabold text-xs block leading-tight">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Model Selection & Live Provider Models */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span>Модели для {getProviderDisplayName(config.provider)}:</span>
                    </label>
                    
                    <Tooltip content="Сделать сетевой запрос к API выбранного провайдера для получения актуального списка моделей" position="top">
                      <button
                        type="button"
                        onClick={handleFetchModels}
                        disabled={isFetchingModels}
                        className="flex items-center justify-center gap-1.5 text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin text-indigo-500' : ''}`} />
                        <span>{isFetchingModels ? 'Загрузка...' : 'Запросить модели с сервера'}</span>
                      </button>
                    </Tooltip>
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span>Выбранная модель:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{config.modelName}</span>
                  </div>

                  {fetchModelsError && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold">Не удалось загрузить список моделей:</p>
                        <p className="text-[11px]">{fetchModelsError}</p>
                      </div>
                    </div>
                  )}

                  {/* Display Fetched Models or Preset Models */}
                  {fetchedModels ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Загружено {fetchedModels.length} моделей:
                        </span>
                        {fetchedModels.length > 4 && (
                          <input
                            type="text"
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            placeholder="Фильтр по названию..."
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] w-40 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                        {fetchedModels
                          .filter(m => !modelSearchQuery || m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) || m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                          .map(m => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, modelName: m.id }))}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                                config.modelName === m.id
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                              }`}
                            >
                              <div className="font-extrabold text-xs flex items-center justify-between gap-1">
                                <span className="truncate">{m.name}</span>
                                <span className={`text-[9px] font-mono px-1 py-0.2 rounded shrink-0 ${
                                  config.modelName === m.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  Live API
                                </span>
                              </div>
                              {m.desc && (
                                <p className={`text-[10px] leading-tight line-clamp-1 ${
                                  config.modelName === m.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {m.desc}
                                </p>
                              )}
                              <p className={`text-[9px] font-mono line-clamp-1 opacity-75 ${
                                config.modelName === m.id ? 'text-indigo-200' : 'text-slate-400'
                              }`}>
                                {m.id}
                              </p>
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(PROVIDER_MODELS[config.provider] || []).map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setConfig(prev => ({ ...prev, modelName: m.id }))}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                              config.modelName === m.id
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                            }`}
                          >
                            <div className="font-extrabold text-xs flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                {m.name}
                                {m.isRecommended && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                    config.modelName === m.id ? 'bg-indigo-700 text-amber-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                  }`}>
                                    ★ Топ
                                  </span>
                                )}
                              </span>
                              <span className="font-mono text-[9px] opacity-75">{m.id}</span>
                            </div>
                            <p className={`text-[10px] leading-tight line-clamp-1 ${
                              config.modelName === m.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              {m.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Model Name Input Override */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Ручной ввод точного ID модели:
                      </label>
                      <Tooltip content="Вы можете указать любой произвольный ID модели, доступный в вашем аккаунте или на endpoint" position="left">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={config.modelName}
                      onChange={(e) => setConfig(prev => ({ ...prev, modelName: e.target.value }))}
                      placeholder="Идентификатор модели (напр. meta-llama/Llama-3.3-70B-Instruct)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* API Key & Base URL Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  
                  {/* API Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        <span>API Ключ {getProviderDisplayName(config.provider)}:</span>
                      </label>
                      <Tooltip content="Ключ хранится локально в браузере и используется для отправки запросов" position="top">
                        <Info className="w-3 h-3 text-slate-400" />
                      </Tooltip>
                    </div>
                    <input
                      type="password"
                      value={config.apiKey || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={
                        config.provider === 'gemini' ? 'Оставьте пустым (встроенный ключ AI Studio)' :
                        config.provider === 'mistral' ? 'sk-... или nvapi-...' :
                        config.provider === 'openai' ? 'sk-...' :
                        config.provider === 'anthropic' ? 'sk-ant-...' :
                        config.provider === 'deepinfra' ? 'sk-... (DeepInfra Key)' :
                        'Вставьте ваш API ключ'
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      {config.provider === 'gemini' 
                        ? 'По умолчанию автоматически используется серверный GEMINI_API_KEY.' 
                        : 'Ключ безопасно используется сервером для проксирования.'}
                    </p>
                  </div>

                  {/* Custom Base URL */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-xs">
                        <Globe className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Базовый URL (Endpoint):</span>
                      </label>
                      <Tooltip content="Укажите URL для локального Ollama или кастомного OpenAI-совместимого прокси" position="top">
                        <Info className="w-3 h-3 text-slate-400" />
                      </Tooltip>
                    </div>
                    <input
                      type="text"
                      value={config.baseUrl || ''}
                      onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder={
                        config.provider === 'mistral' ? 'https://api.mistral.ai/v1' :
                        config.provider === 'openai' ? 'https://api.openai.com/v1' :
                        config.provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
                        config.provider === 'deepinfra' ? 'https://api.deepinfra.com/v1/openai' :
                        config.provider === 'ollama' ? 'http://localhost:11434/v1' :
                        'https://your-api-endpoint.com/v1'
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      Заполняется для локальных сервисов (Ollama) или корпоративных шлюзов.
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* GROUP 2: ПАРАМЕТРЫ АНАЛИЗА И ГЛУБИНЫ АУДИТА (АККОРДЕОН) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('parameters')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    2. Параметры анализа и строгости (Temperature)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Температура: <strong className="text-emerald-600 dark:text-emerald-400">{config.temperature ?? 0.2}</strong> (Строгий юридический аудит)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {openSections.parameters ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.parameters && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                {/* Temperature Parameter */}
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between font-extrabold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Температура генерации (Креативность vs Строгость):</span>
                      <Tooltip content="Низкие значения (0.0-0.2) рекомендуются для точного юридического анализа и поиска скрытых штрафов. Высокие значения увеличивают вариативность формулировок." position="top">
                        <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 cursor-help" />
                      </Tooltip>
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700">
                      {config.temperature ?? 0.2}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature ?? 0.2}
                    onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">0.0 (Строгий юридический факт)</span>
                    <span>0.2 (Рекомендуется для 223/44-ФЗ)</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">1.0 (Творческие формулировки)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 block">Нормативный контроль</span>
                      <span>Автоматическая сверка условий договора с нормами 223-ФЗ, 44-ФЗ и ГК РФ.</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-200 block">Рекомендации протокола разногласий</span>
                      <span>Генерация готовых формулировок для защиты интересов поставщика.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GROUP 3: ИНТЕГРАЦИИ И РАСШИРЕНИЯ (MISTRAL OCR И ДОКУМЕНТЫ) (АККОРДЕОН) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xs">
            <button
              type="button"
              onClick={() => toggleSection('integrations')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <FileSearch className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white block">
                    3. Внешние интеграции (Mistral OCR, распознавание сканов)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Статус OCR: <strong className={config.useMistralOcrForPdf !== false ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                      {config.useMistralOcrForPdf !== false ? 'Включено (mistral-ocr-latest)' : 'Выключено'}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {openSections.integrations ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {openSections.integrations && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                {/* MISTRAL OCR SPECIAL INTEGRATION */}
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 dark:from-amber-950/40 dark:to-slate-900 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-xl shadow-2xs">
                        <FileSearch className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          <span>Интеграция Mistral OCR (Сканер документации)</span>
                          <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-md">
                            mistral-ocr-latest
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                          Автоматическое извлечение таблиц, параграфов и текста из PDF-файлов и сканов ТЗ/договоров
                        </p>
                      </div>
                    </div>

                    <Tooltip content="Включить или отключить глубокое распознавание PDF и сканов через Mistral OCR" position="left">
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={config.useMistralOcrForPdf !== false}
                          onChange={(e) => setConfig(prev => ({ ...prev, useMistralOcrForPdf: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                      </label>
                    </Tooltip>
                  </div>

                  {config.useMistralOcrForPdf !== false && (
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Отдельный API Ключ Mistral AI для OCR (если отличается от основного):
                        </label>
                        <Tooltip content="Если у вас отдельный ключ для OCR Mistral, введите его здесь" position="top">
                          <Info className="w-3 h-3 text-slate-400" />
                        </Tooltip>
                      </div>
                      <input
                        type="password"
                        value={config.mistralApiKey || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, mistralApiKey: e.target.value }))}
                        placeholder={config.provider === 'mistral' && config.apiKey ? 'Используется основной ключ Mistral выше' : 'Вставьте ключ Mistral API'}
                        className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/60 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Status Banner */}
          {testStatus.testing && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-2 text-indigo-700 dark:text-indigo-300 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="font-extrabold">Тестирование соединения с {getProviderDisplayName(config.provider)} ({config.modelName})...</span>
            </div>
          )}

          {testStatus.success !== undefined && !testStatus.testing && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              testStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}>
              {testStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-black text-xs">{testStatus.message}</p>
                {testStatus.latencyMs && (
                  <p className="font-mono text-[10px] opacity-80">
                    Задержка ответа: {testStatus.latencyMs} мс | Модель: {testStatus.modelUsed || config.modelName}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80">
          <Tooltip content="Отправить тестовый запрос к выбранной модели для проверки доступности и задержки" position="top">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.testing}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Проверить связь</span>
            </button>
          </Tooltip>

          <div className="flex items-center gap-2">
            <Tooltip content="Закрыть без сохранения изменений" position="top">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
            </Tooltip>
            
            <Tooltip content="Сохранить настройки нейросети и применить для всех последующих анализов" position="top">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Сохранить настройки</span>
              </button>
            </Tooltip>
          </div>
        </div>

      </div>
    </div>
  );
};
