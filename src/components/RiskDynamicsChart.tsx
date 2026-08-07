import React, { useState, useMemo } from 'react';
import { 
  AnalysisResult, 
  ContractRiskItem 
} from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { 
  Sliders, 
  TrendingUp, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw, 
  Scale, 
  Clock, 
  DollarSign, 
  Zap,
  Info
} from 'lucide-react';

interface RiskDynamicsChartProps {
  summary: AnalysisResult['summary'];
  contractRisks?: ContractRiskItem[];
}

export const RiskDynamicsChart: React.FC<RiskDynamicsChartProps> = ({
  summary,
  contractRisks = []
}) => {
  // Check if 44-FZ or 223-FZ or initial features
  const is44FZ = summary.is223FZ === false;
  const initialThirdParty = contractRisks.some(r => 
    r.category === 'THIRD_PARTY_PURCHASE' || 
    (r.explanation && r.explanation.toLowerCase().includes('третьих лиц')) ||
    (r.title && r.title.toLowerCase().includes('третьих лиц'))
  );

  // Simulation State Variables
  const [penaltyRate, setPenaltyRate] = useState<number>(3.0); // % penalty
  const [deliveryDays, setDeliveryDays] = useState<number>(10); // days
  const [advancePercent, setAdvancePercent] = useState<number>(0); // % advance
  const [hasWriteOff, setHasWriteOff] = useState<boolean>(is44FZ); // ПП 783 write-off
  const [hasThirdPartyClause, setHasThirdPartyClause] = useState<boolean>(initialThirdParty); // 3rd party clause
  
  // Active Variable for X-Axis Dynamic Curve
  const [plotVariable, setPlotVariable] = useState<'penalty' | 'delivery' | 'advance'>('penalty');

  // Baseline Score from Analysis
  const baseScore = summary.overallRiskScore || 50;

  // Dynamic Risk Score Calculation Function
  const calculateRiskScore = (
    pRate: number,
    dDays: number,
    advPct: number,
    writeOff: boolean,
    thirdParty: boolean
  ): number => {
    let score = 30; // base standard score

    // Penalty Impact
    if (pRate >= 3.0) score += 32;
    else if (pRate >= 1.5) score += 20;
    else if (pRate >= 0.5) score += 12;
    else score += 4;

    // Delivery Impact (shorter = riskier)
    if (dDays <= 3) score += 28;
    else if (dDays <= 7) score += 18;
    else if (dDays <= 14) score += 10;
    else if (dDays <= 30) score += 4;
    else score += 0;

    // Advance Payment Impact (higher advance = lower risk)
    if (advPct >= 30) score -= 15;
    else if (advPct >= 10) score -= 8;

    // Write-off mechanism (ПП РФ № 783 for 44-FZ)
    if (writeOff) {
      score -= 16;
    } else {
      score += 10; // 223-FZ penalty strictly deducted
    }

    // Third party purchase clause
    if (thirdParty) {
      score += 18;
    }

    return Math.min(98, Math.max(8, Math.round(score)));
  };

  // Current Calculated Score
  const currentSimulatedScore = useMemo(() => {
    return calculateRiskScore(penaltyRate, deliveryDays, advancePercent, hasWriteOff, hasThirdPartyClause);
  }, [penaltyRate, deliveryDays, advancePercent, hasWriteOff, hasThirdPartyClause]);

  // Generate Data Points for Recharts Dynamic Curve
  const chartData = useMemo(() => {
    if (plotVariable === 'penalty') {
      const steps = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
      return steps.map(val => ({
        xVal: val,
        xLabel: `${val}% НМЦК`,
        riskScore: calculateRiskScore(val, deliveryDays, advancePercent, hasWriteOff, hasThirdPartyClause),
        isCurrent: val === penaltyRate
      }));
    } else if (plotVariable === 'delivery') {
      const steps = [3, 5, 7, 10, 14, 21, 30, 45, 60];
      return steps.map(val => ({
        xVal: val,
        xLabel: `${val} дн.`,
        riskScore: calculateRiskScore(penaltyRate, val, advancePercent, hasWriteOff, hasThirdPartyClause),
        isCurrent: val === deliveryDays
      }));
    } else {
      const steps = [0, 10, 20, 30, 40, 50];
      return steps.map(val => ({
        xVal: val,
        xLabel: `${val}%`,
        riskScore: calculateRiskScore(penaltyRate, deliveryDays, val, hasWriteOff, hasThirdPartyClause),
        isCurrent: val === advancePercent
      }));
    }
  }, [plotVariable, penaltyRate, deliveryDays, advancePercent, hasWriteOff, hasThirdPartyClause]);

  // Risk Level Helper
  const getRiskLevelBadge = (score: number) => {
    if (score >= 70) {
      return {
        label: 'КРИТИЧЕСКИЙ РИСК',
        bg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        icon: ShieldAlert,
        colorHex: '#ef4444'
      };
    } else if (score >= 35) {
      return {
        label: 'УМЕРЕННЫЙ РИСК',
        bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: AlertTriangle,
        colorHex: '#f59e0b'
      };
    } else {
      return {
        label: 'БЕЗОПАСНАЯ ЗОНА',
        bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: CheckCircle2,
        colorHex: '#10b981'
      };
    }
  };

  const currentBadge = getRiskLevelBadge(currentSimulatedScore);
  const CurrentIcon = currentBadge.icon;

  // Preset Scenarios
  const applyPreset = (type: 'original' | 'safe' | 'strict' | 'fz44') => {
    if (type === 'original') {
      setPenaltyRate(3.0);
      setDeliveryDays(10);
      setAdvancePercent(0);
      setHasWriteOff(is44FZ);
      setHasThirdPartyClause(initialThirdParty);
    } else if (type === 'safe') {
      setPenaltyRate(0.5);
      setDeliveryDays(30);
      setAdvancePercent(30);
      setHasWriteOff(true);
      setHasThirdPartyClause(false);
    } else if (type === 'strict') {
      setPenaltyRate(5.0);
      setDeliveryDays(3);
      setAdvancePercent(0);
      setHasWriteOff(false);
      setHasThirdPartyClause(true);
    } else if (type === 'fz44') {
      setPenaltyRate(1.0);
      setDeliveryDays(14);
      setAdvancePercent(20);
      setHasWriteOff(true);
      setHasThirdPartyClause(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-0 transition-colors duration-200">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-md">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-md flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400 fill-purple-400" />
                Интерактивный симулятор
              </span>
              <span className="text-xs text-slate-400 font-medium">• Аналитика & Риски</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              Динамика уровня риска от условий контракта
            </h2>
          </div>
        </div>

        {/* Dynamic Variable Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shrink-0">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase px-2">Ось графика:</span>
          <button
            type="button"
            onClick={() => setPlotVariable('penalty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              plotVariable === 'penalty'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚖️ Штрафы %
          </button>
          <button
            type="button"
            onClick={() => setPlotVariable('delivery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              plotVariable === 'delivery'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🚚 Срок поставки
          </button>
          <button
            type="button"
            onClick={() => setPlotVariable('advance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              plotVariable === 'advance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💰 Аванс %
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Preset Scenarios Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            Быстрые пресеты условий:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset('original')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Исходные из договора</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('safe')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Безопасный сценарий</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('strict')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Критический сценарий</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset('fz44')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Льготный режим 44-ФЗ</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Sliders Control Panel + Recharts Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Sliders Control Panel */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-3">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Параметры договора:</span>
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${currentBadge.bg} flex items-center gap-1`}>
                <CurrentIcon className="w-3 h-3" />
                {currentBadge.label}
              </span>
            </div>

            {/* Slider 1: Penalty Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-500" />
                  Размер штрафных санкций:
                </span>
                <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {penaltyRate}% НМЦК
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={penaltyRate}
                onChange={(e) => setPenaltyRate(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0.1% (Стандарт)</span>
                <span>3.0% (Кабальный)</span>
                <span>5.0% (Макс)</span>
              </div>
            </div>

            {/* Slider 2: Delivery Days */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Срок выполнения поставки:
                </span>
                <span className="font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  {deliveryDays} дн.
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>3 дн. (Экстремальный)</span>
                <span>14 дн.</span>
                <span>60 дн. (Комфортный)</span>
              </div>
            </div>

            {/* Slider 3: Advance Payment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Размер авансового платежа:
                </span>
                <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {advancePercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0% (Без аванса)</span>
                <span>20%</span>
                <span>50% (Предоплата)</span>
              </div>
            </div>

            {/* Checkboxes: Statutory Toggles */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasWriteOff}
                  onChange={(e) => setHasWriteOff(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span>Применение механизма списания штрафов (ПП РФ № 783, 44-ФЗ)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasThirdPartyClause}
                  onChange={(e) => setHasThirdPartyClause(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                />
                <span className="text-rose-700 dark:text-rose-300">Пункт о закупке у 3-х лиц за счет Поставщика</span>
              </label>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                    Моделирование риска:
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>
                      {plotVariable === 'penalty' && 'Зависимость риска от размера штрафных санкций'}
                      {plotVariable === 'delivery' && 'Зависимость риска от сроков поставки'}
                      {plotVariable === 'advance' && 'Зависимость риска от размера аванса'}
                    </span>
                  </h4>
                </div>

                {/* Score Big Display */}
                <div className="text-right bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="text-[9px] uppercase font-black text-slate-400">Прогноз Индекса</div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white flex items-baseline justify-end gap-1">
                    <span>{currentSimulatedScore}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              {/* RECHARTS AREA CHART */}
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentBadge.colorHex} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={currentBadge.colorHex} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="xLabel" 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const b = getRiskLevelBadge(data.riskScore);
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-700 text-xs space-y-1 shadow-xl">
                              <p className="font-extrabold text-indigo-300">Значение: {data.xLabel}</p>
                              <p className="flex items-center gap-1.5">
                                <span>Прогнозируемый риск:</span>
                                <span className="font-black font-mono text-amber-300">{data.riskScore} / 100</span>
                              </p>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${b.bg} mt-1`}>
                                {b.label}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Zone threshold areas */}
                    <ReferenceArea y1={70} y2={100} fill="#ef4444" fillOpacity={0.08} />
                    <ReferenceArea y1={35} y2={70} fill="#f59e0b" fillOpacity={0.06} />
                    <ReferenceArea y1={0} y2={35} fill="#10b981" fillOpacity={0.06} />

                    {/* Reference threshold lines */}
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Красная зона (70+)', fill: '#ef4444', fontSize: 10, fontWeight: 800 }} />
                    <ReferenceLine y={35} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Желтая зона (35)', fill: '#d97706', fontSize: 10, fontWeight: 800 }} />

                    <Area 
                      type="monotone" 
                      dataKey="riskScore" 
                      stroke={currentBadge.colorHex} 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#riskGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dynamic Analytical Summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>Аналитическое резюме модификации условий:</span>
              </div>
              <p className="leading-relaxed font-medium">
                {currentSimulatedScore >= 70 ? (
                  <span className="text-rose-700 dark:text-rose-300 font-semibold">
                    ⚠️ Контракт находится в КРАСНОЙ ЗОНЕ РИСКА ({currentSimulatedScore}/100). Рекомендуется снизить штрафные санкции до 0.1%/день и зафиксировать право на списание по ПП РФ № 783.
                  </span>
                ) : currentSimulatedScore >= 35 ? (
                  <span className="text-amber-700 dark:text-amber-300 font-semibold">
                    ⚡ Контракт находится в ЖЕЛТОЙ ЗОНЕ РИСКА ({currentSimulatedScore}/100). Риск умеренный, рекомендуется предусмотреть аванс от 20% для покрытия кассовых разрывов.
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✅ Контракт находится в ЗЕЛЕНОЙ ЗОНЕ РИСКА ({currentSimulatedScore}/100). Условия поставки и ответственность сбалансированы.
                  </span>
                )}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
