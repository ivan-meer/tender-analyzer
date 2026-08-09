import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
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
  Bot
} from 'lucide-react';
import { LLMConfig, LLMProvider } from '../types';
import { getStoredLLMConfig, saveLLMConfig, getProviderDisplayName } from '../utils/aiConfig';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: (config: LLMConfig) => void;
}

const PROVIDER_MODELS: Record<LLMProvider, { name: string; id: string; desc: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Высокая скорость, оптимизирован для аналитики и 223-ФЗ' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Углубленный юридический анализ и рассуждения' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Быстрый легкий вариант' },
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', desc: 'Флагманская модель Mistral для сложных юридических задач' },
    { id: 'pixtral-large-latest', name: 'Pixtral Large (Vision)', desc: 'Мультимодальная модель с распознаванием сканов и таблиц' },
    { id: 'codestral-latest', name: 'Codestral', desc: 'Анализ структурированных JSON/SQL данных' },
    { id: 'mistral-small-latest', name: 'Mistral Small', desc: 'Быстрая экономичная модель' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni)', desc: 'Флагманская мультимодальная модель OpenAI' },
    { id: 'gpt-4o-mini', name: 'GPT-4o mini', desc: 'Быстрая компактная модель' },
    { id: 'o1', name: 'OpenAI o1', desc: 'Модель с глубокими цепями рассуждений' },
    { id: 'o3-mini', name: 'OpenAI o3-mini', desc: 'Компактная логическая модель' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Эталон качества для юриспруденции и логики' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Сверхбыстрый и точный помощник' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Максимальная глубина юридического аудита' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek-V3 (Chat)', desc: 'Производительная китайская модель с открытым весом' },
    { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (Reasoner)', desc: 'Модель глубоких логических рассуждений R1' },
  ],
  ollama: [
    { id: 'llama3', name: 'Llama 3 (Local)', desc: 'Локальная модель в вашей сети' },
    { id: 'qwen2.5', name: 'Qwen 2.5', desc: 'Локальная модель с поддержкой русского языка' },
    { id: 'deepseek-r1:8b', name: 'DeepSeek R1 Local', desc: 'Локальный Reasoner через Ollama' },
  ],
  custom: [
    { id: 'custom-model', name: 'Пользовательская модель', desc: 'Укажите наименование любой модели REST API' },
  ]
};

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<LLMConfig>(getStoredLLMConfig());
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
                <span>Настройка провайдера ИИ и моделей</span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-bold">
                  Мульти-провайдер
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Подходит любая модель: Gemini, Mistral AI, OpenAI, Claude, DeepSeek, Ollama или ваш REST API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar text-xs">
          
          {/* Provider Selection Grid */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs">
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>Выберите нейросетевого провайдера:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'gemini', name: 'Google Gemini', icon: '♊', badge: 'По умолчанию' },
                { id: 'mistral', name: 'Mistral AI', icon: '🌪️', badge: '+ OCR' },
                { id: 'openai', name: 'OpenAI', icon: '🟢', badge: 'GPT-4o' },
                { id: 'anthropic', name: 'Anthropic', icon: '🟣', badge: 'Claude 3.5' },
                { id: 'deepseek', name: 'DeepSeek', icon: '🐋', badge: 'R1 / V3' },
                { id: 'ollama', name: 'Ollama / Local', icon: '🦙', badge: 'Локальный' },
                { id: 'custom', name: 'Пользовательский', icon: '🔌', badge: 'OpenAI API' },
              ].map(p => {
                const isSelected = config.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id as LLMProvider)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
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

          {/* Model Selection & Custom Name */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-500" />
                <span>Модель провайдера {getProviderDisplayName(config.provider)}:</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Используемая модель: {config.modelName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(PROVIDER_MODELS[config.provider] || []).map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, modelName: m.id }))}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-0.5 ${
                    config.modelName === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-extrabold text-xs flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="font-mono text-[10px] opacity-75">{m.id}</span>
                  </div>
                  <p className={`text-[10px] leading-relaxed line-clamp-1 ${
                    config.modelName === m.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {m.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Model Name Input Override */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Или введите свой код модели (напр. mistral-ocr-latest, gpt-4o, llama3:70b):
              </label>
              <input
                type="text"
                value={config.modelName}
                onChange={(e) => setConfig(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="Идентификатор модели"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* API Key & Base URL Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* API Key */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>API Ключ {getProviderDisplayName(config.provider)}:</span>
              </label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={
                  config.provider === 'gemini' ? 'Оставьте пустым (берётся из secrets AI Studio)' :
                  config.provider === 'mistral' ? 'sk-... или nvapi-...' :
                  config.provider === 'openai' ? 'sk-...' :
                  config.provider === 'anthropic' ? 'sk-ant-...' :
                  'Вставьте ваш API ключ'
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                {config.provider === 'gemini' 
                  ? 'Если поле пустое, автоматически используется серверный GEMINI_API_KEY.' 
                  : 'Ключ безопасно передается в серверные запросы.'}
              </p>
            </div>

            {/* Custom Base URL (For Ollama, DeepSeek proxy or custom REST endpoints) */}
            <div className="space-y-1">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-500" />
                <span>Базовый URL / Конечная точка API:</span>
              </label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder={
                  config.provider === 'mistral' ? 'https://api.mistral.ai/v1' :
                  config.provider === 'openai' ? 'https://api.openai.com/v1' :
                  config.provider === 'deepseek' ? 'https://api.deepseek.com/v1' :
                  config.provider === 'ollama' ? 'http://localhost:11434/v1' :
                  'https://your-api-endpoint.com/v1'
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-400">
                Заполняется для локальных сервисов (Ollama) или прокси.
              </p>
            </div>

          </div>

          {/* MISTRAL OCR SPECIAL INTEGRATION SECTION */}
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

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.useMistralOcrForPdf !== false}
                  onChange={(e) => setConfig(prev => ({ ...prev, useMistralOcrForPdf: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {config.useMistralOcrForPdf !== false && (
              <div className="pt-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Отдельный API Ключ Mistral AI для OCR (если отличается от основного):
                </label>
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

          {/* Temperature Parameter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between font-extrabold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Температура ответов (Креативность / Строгость):</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
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
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.0 (Строгий юридический анализ)</span>
              <span>0.5</span>
              <span>1.0 (Креативные формулировки)</span>
            </div>
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
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus.testing}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Проверить связь</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
