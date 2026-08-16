import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  DollarSign, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Coins, 
  SlidersHorizontal,
  Wallet,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Server
} from 'lucide-react';
import { LLMConfig } from '../types';
import { getStoredLLMConfig, getProviderDisplayName } from '../utils/aiConfig';
import { estimateQueryCost, USD_TO_RUB_EXCHANGE_RATE, ModelPricing } from '../utils/pricingCalculator';
import { Tooltip } from './Tooltip';

interface TokenPriceEstimatorProps {
  totalChars: number;
  onOpenAISettings?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const TokenPriceEstimator: React.FC<TokenPriceEstimatorProps> = ({
  totalChars,
  onOpenAISettings,
  className = '',
  isCompact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig());

  // Listen for config changes
  useEffect(() => {
    const handleConfigChange = () => {
      setLlmConfig(getStoredLLMConfig());
    };
    window.addEventListener('llm_config_changed', handleConfigChange);
    window.addEventListener('storage', handleConfigChange);
    return () => {
      window.removeEventListener('llm_config_changed', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);

  const estimation = estimateQueryCost(totalChars, llmConfig);

  // Format currency
  const formatRub = (rub: number, isFree?: boolean) => {
    if (isFree) return '0.00 ₽ (Free/Local)';
    if (rub === 0 && totalChars === 0) return '0.00 ₽';
    if (rub < 0.01) return '< 0.01 ₽';
    return `${rub.toFixed(2)} ₽`;
  };

  const formatUsd = (usd: number, isFree?: boolean) => {
    if (isFree) return '$0.00';
    if (usd === 0 && totalChars === 0) return '$0.00';
    if (usd < 0.0001) return '< $0.0001';
    return `$${usd.toFixed(4)}`;
  };

  const isFree = estimation.pricing.isFreeOrLocal;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      isFree 
        ? 'bg-slate-900/90 text-slate-100 border-emerald-500/30 shadow-xs'
        : 'bg-slate-900 text-slate-100 border-slate-800 shadow-md'
    } p-3.5 sm:p-4 text-xs space-y-3 ${className}`}>
      
      {/* Top Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Indicator & Model Details */}
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border shrink-0 ${
            isFree
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
          }`}>
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-100 text-xs sm:text-sm">
                Бюджет & расчёт токенов запроса
              </span>

              {/* Active Model Badge with Link to Settings */}
              <Tooltip content="Нажмите для смены модели или провайдера нейросети" position="top">
                <button
                  type="button"
                  onClick={onOpenAISettings}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md flex items-center gap-1 border transition-colors cursor-pointer ${
                    isFree
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5" />
                  <span>{estimation.pricing.modelDisplayName}</span>
                </button>
              </Tooltip>

              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                ({getProviderDisplayName(llmConfig.provider)})
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Прямой расчёт затрат на анализ документов в реальном времени</span>
              {totalChars > 0 && (
                <span className="text-indigo-400 font-bold font-mono">
                  • {totalChars.toLocaleString('ru-RU')} симв.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Live Price & Token Badges */}
        <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 self-start sm:self-auto shrink-0 shadow-inner">
          
          {/* Tokens Metric */}
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Токены</span>
              <Tooltip content="Ориентировочное количество токенов (входные документы + итоговый отчет)" position="top">
                <Info className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
              </Tooltip>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300 block">
              ~{estimation.totalTokens.toLocaleString('ru-RU')}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Price Metric */}
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Стоимость</span>
              <Tooltip content={`Тариф модели ${estimation.pricing.modelDisplayName}: $${estimation.pricing.inputPer1MUsd}/1M вход, $${estimation.pricing.outputPer1MUsd}/1M выход`} position="top">
                <Info className="w-2.5 h-2.5 text-slate-500 hover:text-slate-300" />
              </Tooltip>
            </div>
            <span className={`text-xs font-mono font-extrabold block ${
              isFree ? 'text-emerald-400' : 'text-emerald-400'
            }`}>
              {formatRub(estimation.totalCostRub, isFree)}
              {!isFree && (
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({formatUsd(estimation.totalCostUsd)})
                </span>
              )}
            </span>
          </div>

          {/* Expand Details Button */}
          <Tooltip content={isExpanded ? 'Скрыть детализацию' : 'Показать тариф и детализацию стоимости'} position="top">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ml-0.5 cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </Tooltip>

        </div>
      </div>

      {/* Expanded Breakdown Table */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/90 space-y-3 text-[11px] animate-fadeIn">
          
          {/* 4-Column Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Объем документации:</span>
              <span className="font-mono font-bold text-slate-200 text-xs">
                {totalChars.toLocaleString('ru-RU')} <span className="text-[10px] font-normal text-slate-400">символов</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Входной промпт (Input):</span>
              <span className="font-mono font-bold text-indigo-300 text-xs">
                ~{estimation.inputTokens.toLocaleString('ru-RU')} <span className="text-[10px] font-normal text-slate-400">токенов</span>
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">
                (${estimation.inputCostUsd.toFixed(5)})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Генерация отчета (Output):</span>
              <span className="font-mono font-bold text-emerald-300 text-xs">
                ~{estimation.outputTokens.toLocaleString('ru-RU')} <span className="text-[10px] font-normal text-slate-400">токенов</span>
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">
                (${estimation.outputCostUsd.toFixed(5)})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Тариф выбранной модели:</span>
              <span className="font-mono font-bold text-amber-300 text-xs block truncate">
                {isFree ? '0.00 $ (Локально)' : `$${estimation.pricing.inputPer1MUsd} / $${estimation.pricing.outputPer1MUsd}`}
              </span>
              <span className="text-[9px] text-slate-500 block font-mono">
                за 1 млн токенов (1 USD = {USD_TO_RUB_EXCHANGE_RATE} ₽)
              </span>
            </div>
          </div>

          {/* Pricing Tips & Advice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-slate-800/40 border border-slate-800/60 rounded-xl text-[10px] text-slate-400">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                1 кириллический токен ≈ 2.8 символов русскоязычной юридической документации. 
                Расчёт автоматически подстраивается под модель в настройках.
              </span>
            </div>

            {onOpenAISettings && (
              <button
                type="button"
                onClick={onOpenAISettings}
                className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Сменить модель или провайдера</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
