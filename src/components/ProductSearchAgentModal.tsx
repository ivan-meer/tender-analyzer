import React, { useState, useEffect } from 'react';
import {
  X,
  Bot,
  Search,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Tag,
  ShieldCheck,
  Globe,
  Camera,
  Maximize2,
  ChevronRight,
  Cpu,
  Terminal,
  FileText,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProductItem } from '../types';

interface AgentPromptData {
  gispRegistryPrompt: string;
  techSpecsPrompt: string;
  marketPricePrompt: string;
  agentSearchInstruction: string;
}

interface AgentLog {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface AgentItemResult {
  itemId: string;
  productName: string;
  dimensions?: string;
  specification?: string;
  okpd2OrGvin?: string;
  generatedPrompts: AgentPromptData;
  agentThoughtLogs: AgentLog[];
  suggestedModels: any[];
  suppliers: any[];
  complianceNote: string;
  priceRangeEstimate: string;
  neonDbMatchesCount: number;
  groundingSources?: any[];
  webSearchQueries?: string[];
}

interface ProductSearchAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurementProducts?: ProductItem[];
  initialSelectedProduct?: ProductItem | null;
}

export const ProductSearchAgentModal: React.FC<ProductSearchAgentModalProps> = ({
  isOpen,
  onClose,
  procurementProducts = [],
  initialSelectedProduct = null
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('custom');
  
  // Custom input state if not selecting from procurement items
  const [customName, setCustomName] = useState('Кресло офисное эргономичное с сетчатой спинкой');
  const [customDims, setCustomDims] = useState('650х650х1150..1280 мм');
  const [customSpecs, setCustomSpecs] = useState('Подголовник, регулируемые подлокотники, механизм качания мультиблок, ГОСТ 19917-2014');

  const [loading, setLoading] = useState(false);
  const [agentOutput, setAgentOutput] = useState<{
    agentName: string;
    agentVersion: string;
    executionTimeMs: number;
    results: AgentItemResult[];
  } | null>(() => {
    try {
      const saved = localStorage.getItem('tender_agent_search_cache_v2');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [copiedPromptKey, setCopiedPromptKey] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  // Initialize selected product when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedProduct) {
        setSelectedProductId(initialSelectedProduct.id);
      } else if (procurementProducts.length > 0) {
        setSelectedProductId(procurementProducts[0].id);
      } else {
        setSelectedProductId('custom');
      }
    }
  }, [isOpen, initialSelectedProduct, procurementProducts]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptKey(key);
    setTimeout(() => setCopiedPromptKey(null), 2000);
  };

  const runAgentSearch = async (mode: 'single' | 'all') => {
    setLoading(true);

    let payloadItems: any[] = [];

    if (mode === 'all' && procurementProducts.length > 0) {
      payloadItems = procurementProducts.map((p) => ({
        id: p.id,
        productName: p.name,
        dimensions: p.dimensions || '',
        specification: p.specification || p.rawRequirementText || '',
        okpd2OrGvin: p.okpd2 || '',
        parameters: p.parameters || []
      }));
    } else {
      if (selectedProductId !== 'custom' && procurementProducts.length > 0) {
        const found = procurementProducts.find((p) => p.id === selectedProductId);
        if (found) {
          payloadItems = [{
            id: found.id,
            productName: found.name,
            dimensions: found.dimensions || '',
            specification: found.specification || found.rawRequirementText || '',
            okpd2OrGvin: found.okpd2 || '',
            parameters: found.parameters || []
          }];
        }
      }

      if (payloadItems.length === 0) {
        payloadItems = [{
          id: 'custom_1',
          productName: customName,
          dimensions: customDims,
          specification: customSpecs,
          okpd2OrGvin: '31.01.11',
          parameters: []
        }];
      }
    }

    try {
      const res = await fetch('/api/search-suppliers-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloadItems })
      });

      if (!res.ok) throw new Error('Ошибка запуска ИИ-агента поиска');

      const data = await res.json();
      setAgentOutput(data);
      setActiveItemIndex(0);
      try {
        localStorage.setItem('tender_agent_search_cache_v2', JSON.stringify(data));
      } catch (e) {
        console.warn('Could not save agent search to localStorage', e);
      }
    } catch (err) {
      console.error('Error in agent search:', err);
      alert('Произошла ошибка при выполнении поискового агента.');
    } finally {
      setLoading(false);
    }
  };

  const currentResult: AgentItemResult | null =
    agentOutput && agentOutput.results && agentOutput.results[activeItemIndex]
      ? agentOutput.results[activeItemIndex]
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden my-auto flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/80 border-b border-cyan-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 rounded-2xl text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-950">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  ИИ-Агент поиска в сети & Генератор промптов
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md">
                  Gemini 2.5 Grounded Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Автоматическое формирование точечных промптов под каждый товар, запуск глубинного поиска в ГИСП, ГОСТ и каталогах заводов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Area */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Controls Bar: Product Selection & Launch Buttons */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                Выберите позицию для генерации промптов и поиска:
              </label>

              {procurementProducts.length > 0 && (
                <button
                  onClick={() => runAgentSearch('all')}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Запустить Агент для ВСЕХ товаров ({procurementProducts.length})</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-medium focus:border-cyan-500 outline-none"
                >
                  {procurementProducts.length > 0 && (
                    <optgroup label="Товары из текущей закупки / ТЗ">
                      {procurementProducts.map((p, idx) => (
                        <option key={p.id} value={p.id}>
                          #{idx + 1}. {p.name} {p.dimensions ? `(${p.dimensions})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="custom">✏️ Произвольный товар (Ввести вручную)</option>
                </select>
              </div>

              <button
                onClick={() => runAgentSearch('single')}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ИИ-Агент ищет в сети...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Сгенерировать промпты & Найти</span>
                  </>
                )}
              </button>
            </div>

            {/* Custom Input Fields if selectedProductId === 'custom' */}
            {selectedProductId === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Наименование товара:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Габариты / Размеры:</label>
                  <input
                    type="text"
                    value={customDims}
                    onChange={(e) => setCustomDims(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Спецификация ТЗ / ГОСТ:</label>
                  <input
                    type="text"
                    value={customSpecs}
                    onChange={(e) => setCustomSpecs(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Initial State before agent runs */}
          {!agentOutput && !loading && (
            <div className="p-8 bg-slate-950/40 border border-slate-800 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-cyan-950/60 rounded-3xl border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-8 h-8" />
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  ИИ-Агент готов к работе
                </h3>
                <p className="text-xs text-slate-400">
                  Выберите товар из списка закупки или введите наименование вручную. Агент сгенерирует 3 индивидуальных поисковых промпта (ГИСП Минпромторга, ГОСТ/ТХ и Рыночные цены) и выполнит глубинное сканирование.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2 text-left">
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">1. ГИСП Минпромторг</span>
                  <p className="text-[11px] text-slate-300">Промпт с привязкой к реестру российской продукции и требованиям ПП 1875.</p>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">2. ГОСТ & Технические ТХ</span>
                  <p className="text-[11px] text-slate-300">Точечный промпт по интервальным габаритам, паспортам качества и нормативам.</p>
                </div>
                <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">3. Рынок & Оптовые Цены</span>
                  <p className="text-[11px] text-slate-300">Поиск ТКП, агрегаторов ЕАТ Березка и официальных дилеров заводов РФ.</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-12 bg-slate-950/60 border border-cyan-800/40 rounded-3xl text-center space-y-4 animate-pulse">
              <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <div>
                <h3 className="text-base font-bold text-cyan-300">
                  ИИ-Агент генерирует промпты и выполняет поиск...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Сканирование каталогов заводов РФ, реестра ГИСП и базы Neon PostgreSQL
                </p>
              </div>
            </div>
          )}

          {/* Agent Results Display */}
          {agentOutput && currentResult && !loading && (
            <div className="space-y-6">

              {/* Multi-Item Tabs if agent ran for multiple items */}
              {agentOutput.results.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">Результаты по товарам:</span>
                  {agentOutput.results.map((resItem, idx) => (
                    <button
                      key={resItem.itemId}
                      onClick={() => setActiveItemIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        activeItemIndex === idx
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>#{idx + 1}. {resItem.productName.slice(0, 22)}...</span>
                      <span className="px-1.5 py-0.2 bg-slate-950/60 text-[10px] rounded-md">
                        {resItem.suggestedModels?.length || 0}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Item Info Banner & Execution Time */}
              <div className="bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-900 p-4 rounded-2xl border border-cyan-800/40 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">
                    Выбранный товар (#{activeItemIndex + 1} из {agentOutput.results.length})
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {currentResult.productName}
                  </h3>
                  {currentResult.dimensions && (
                    <span className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3 text-cyan-400" />
                      Габариты ТЗ: {currentResult.dimensions}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    {agentOutput.executionTimeMs} ms
                  </span>
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-700 rounded-xl text-xs font-bold text-emerald-300">
                    Найдено аналогов: {currentResult.suggestedModels?.length || 0}
                  </span>
                </div>
              </div>

              {/* Section 1: Generated Custom Prompts for this Product */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Сгенерированные ИИ-Промпты для товара:
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Нажмите «Копировать» для использования в любых внешних системах
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Prompt 1: ГИСП */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-800/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          1. ГИСП Минпромторг Промпт
                        </span>
                        <button
                          onClick={() => handleCopy(currentResult.generatedPrompts.gispRegistryPrompt, 'gisp')}
                          className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPromptKey === 'gisp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPromptKey === 'gisp' ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 break-words">
                        {currentResult.generatedPrompts.gispRegistryPrompt}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 pt-1">
                      Для поиска в реестрах промышленной продукции и ПП 1875
                    </span>
                  </div>

                  {/* Prompt 2: ГОСТ & ТХ */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-800/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          2. ГОСТ & Габариты Промпт
                        </span>
                        <button
                          onClick={() => handleCopy(currentResult.generatedPrompts.techSpecsPrompt, 'tech')}
                          className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPromptKey === 'tech' ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPromptKey === 'tech' ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 break-words">
                        {currentResult.generatedPrompts.techSpecsPrompt}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 pt-1">
                      Точечные размеры и ГОСТ нормативы изделия
                    </span>
                  </div>

                  {/* Prompt 3: Рынок & Цены */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-800/60 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          3. Рынок & Прайсы Промпт
                        </span>
                        <button
                          onClick={() => handleCopy(currentResult.generatedPrompts.marketPricePrompt, 'market')}
                          className="px-2 py-0.5 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedPromptKey === 'market' ? <Check className="w-3 h-3 text-purple-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPromptKey === 'market' ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                      <p className="text-xs font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 break-words">
                        {currentResult.generatedPrompts.marketPricePrompt}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 pt-1">
                      Оптовые коммерческие предложения и дилеры
                    </span>
                  </div>

                </div>
              </div>

              {/* Section 2: Agent Thought Process & Log Steps */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  Ход выполнения ИИ-Агента (Agent Thought Logs):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {currentResult.agentThoughtLogs.map((log) => (
                    <div key={log.step} className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-cyan-400">Шаг {log.step}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded-md">
                          ✓ Выполнено
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{log.title}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{log.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Compliance Note & Price Estimate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 p-4 rounded-2xl border border-cyan-800/40 space-y-1">
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">
                    📋 Экспертный вывод Агента по позиции:
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {currentResult.complianceNote}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-4 rounded-2xl border border-emerald-800/40 space-y-1 flex flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                    💰 Ориентировочная вилка стоимости:
                  </span>
                  <p className="text-sm font-extrabold text-white">
                    {currentResult.priceRangeEstimate}
                  </p>
                </div>
              </div>

              {/* Section 4: Found Products (1 Product = 1 Rich Detailed Card) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Найденные модели и аналоги ({currentResult.suggestedModels?.length || 0}):
                  </h4>
                  {currentResult.neonDbMatchesCount > 0 && (
                    <span className="text-xs text-cyan-300 font-bold bg-cyan-950 px-2.5 py-1 rounded-xl border border-cyan-800">
                      Включая совпадения из Neon DB: {currentResult.neonDbMatchesCount}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentResult.suggestedModels?.map((model: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-cyan-500 hover:shadow-xl transition-all group"
                    >
                      <div className="space-y-3">
                        {/* Header info */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block">
                              {model.manufacturer || 'Завод РФ'}
                            </span>
                            <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                              {model.modelName}
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-950 text-slate-300 text-[10px] font-bold rounded-md shrink-0 border border-slate-800">
                            {model.country || 'Россия'}
                          </span>
                        </div>

                        {/* Image Preview with Zoom */}
                        {model.imageUrl && (
                          <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group/img">
                            <img
                              src={model.imageUrl}
                              alt={model.modelName}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            />
                            <button
                              onClick={() => setZoomImage({ url: model.imageUrl, title: model.modelName })}
                              className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 hover:bg-cyan-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Увеличить</span>
                            </button>
                          </div>
                        )}

                        {/* Badges: Dimensions & Price */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block">Соответствие габаритам:</span>
                            <span className="text-[11px] font-bold text-emerald-400 block truncate">
                              {model.dimensionsMatch || 'Полное совпадение'}
                            </span>
                          </div>

                          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-[9px] font-bold text-slate-400 block">Ориентировочная цена:</span>
                            <span className="text-[11px] font-extrabold text-amber-300 block">
                              {model.estimatedPrice || 'По запросу'}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          {model.description}
                        </p>

                        {/* GISP Status */}
                        {model.gispRegistryStatus && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/60">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{model.gispRegistryStatus}</span>
                          </div>
                        )}
                      </div>

                      {/* Links */}
                      {(model.productUrl || model.url) && (
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <a
                            href={model.productUrl || (model.url.startsWith('http') ? model.url : `https://${model.url}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>Страница товара</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Grounding Sources from Real Google Search */}
              {currentResult.groundingSources && currentResult.groundingSources.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    Источники верификации (Google Search Grounding):
                  </h4>

                  <div className="flex items-center gap-2 flex-wrap">
                    {currentResult.groundingSources.map((chunk: any, cIdx: number) => {
                      const title = chunk?.web?.title || chunk?.title || `Источник #${cIdx + 1}`;
                      const uri = chunk?.web?.uri || chunk?.uri || '#';
                      return (
                        <a
                          key={cIdx}
                          href={uri}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <span>{title}</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>AI Search Agent v2.5 • Готов к повторному запуску</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Закрыть окно
          </button>
        </div>

      </div>

      {/* Lightbox Modal for Photo Zoom */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden p-2 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-1 border-b border-slate-800">
              <span className="text-xs font-bold text-white truncate">{zoomImage.title}</span>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-hidden flex items-center justify-center rounded-2xl bg-black">
              <img src={zoomImage.url} alt={zoomImage.title} className="max-h-[78vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
