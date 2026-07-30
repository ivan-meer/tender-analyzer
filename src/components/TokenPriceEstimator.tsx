import React, { useState } from 'react';
import { Cpu, DollarSign, Calculator, Info, ShieldCheck, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface TokenPriceEstimatorProps {
  totalChars: number;
  contractChars?: number;
  tzChars?: number;
  docsChars?: number;
}

export const TokenPriceEstimator: React.FC<TokenPriceEstimatorProps> = ({
  totalChars,
  contractChars = 0,
  tzChars = 0,
  docsChars = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Gemini token estimation: ~2.8 characters per token for Cyrillic/Russian technical text
  const estimatedInputTokens = Math.max(100, Math.ceil(totalChars / 2.8));
  // Gemini 3.5/3.6 Flash outputs structured 223-FZ JSON result (~2,200 tokens)
  const estimatedOutputTokens = 2200;

  // Gemini Flash Rates (USD / 1M tokens)
  const INPUT_COST_PER_1M_USD = 0.075;
  const OUTPUT_COST_PER_1M_USD = 0.300;
  const USD_TO_RUB_RATE = 90.0; // Current average exchange rate

  const inputCostUsd = (estimatedInputTokens / 1_000_000) * INPUT_COST_PER_1M_USD;
  const outputCostUsd = (estimatedOutputTokens / 1_000_000) * OUTPUT_COST_PER_1M_USD;
  const totalCostUsd = inputCostUsd + outputCostUsd;
  const totalCostRub = totalCostUsd * USD_TO_RUB_RATE;

  // Format price nicely
  const formattedRub = totalCostRub < 0.01 
    ? '< 0.01 ₽' 
    : `${totalCostRub.toFixed(2)} ₽`;

  const formattedUsd = totalCostUsd < 0.0001
    ? '< $0.0001'
    : `$${totalCostUsd.toFixed(4)}`;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-3.5 sm:p-4 text-xs space-y-3 shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Cpu className="w-4 h-4 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-xs">Анализатор токенов и стоимости ИИ-запроса</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Предварительный расчёт нагрузки до отправки на ИИ-сервер
            </p>
          </div>
        </div>

        {/* Price & Token Metric Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 self-start sm:self-auto">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Токены</span>
            <span className="text-xs font-mono font-bold text-indigo-300">
              ~{(estimatedInputTokens + estimatedOutputTokens).toLocaleString('ru-RU')}
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Расчёт цены</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {formattedRub} <span className="text-[10px] text-slate-400 font-normal">({formattedUsd})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ml-1 cursor-pointer"
            title="Показать детализацию расчёта"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block">Объем символов:</span>
              <span className="font-mono font-bold text-slate-200">{totalChars.toLocaleString('ru-RU')} симв.</span>
            </div>
            <div>
              <span className="text-slate-400 block">Промпт (Вход):</span>
              <span className="font-mono font-bold text-indigo-300">~{estimatedInputTokens.toLocaleString('ru-RU')} токенов</span>
            </div>
            <div>
              <span className="text-slate-400 block">Отчет (Выход):</span>
              <span className="font-mono font-bold text-emerald-300">~{estimatedOutputTokens.toLocaleString('ru-RU')} токенов</span>
            </div>
            <div>
              <span className="text-slate-400 block">Курс пересчёта:</span>
              <span className="font-mono font-bold text-amber-300">1 USD = {USD_TO_RUB_RATE} ₽</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-slate-800/40 p-2 rounded-lg">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              1 кириллический токен ≈ 2.8 символа русской юридической терминологии. Расчет выполнен по тарифу Google Gemini API: $0.075 / 1M входных токенов и $0.30 / 1M выходных токенов. Выполняется автоматическая кэш-оптимизация.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
