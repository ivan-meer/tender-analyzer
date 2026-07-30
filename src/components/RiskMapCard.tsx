import React, { useState, useMemo } from 'react';
import { 
  ContractRiskItem, 
  RiskSeverity, 
  AnalysisResult 
} from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Layers, 
  Sparkles, 
  Filter, 
  TrendingUp, 
  Target
} from 'lucide-react';

interface RiskMapCardProps {
  summary: AnalysisResult['summary'];
  contractRisks: ContractRiskItem[];
  onSelectCategoryFilter?: (category: string | null) => void;
}

// Category Human Translation & Config
const CATEGORY_MAP: Record<string, { label: string; shortLabel: string; icon: string }> = {
  PENALTIES: { label: 'Штрафы и неустойки (3%)', shortLabel: 'Штрафы', icon: '⚖️' },
  DELIVERY_TERMS: { label: 'Сроки и график поставки', shortLabel: 'Поставка', icon: '🚚' },
  TERMINATION: { label: 'Односторонний отказ Заказчика', shortLabel: 'Отказ', icon: '⛔' },
  THIRD_PARTY_PURCHASE: { label: 'Закупка у 3-х лиц за счет Поставщика', shortLabel: '3-и лица', icon: '💸' },
  DOCUMENTS: { label: 'Документооборот и акты приемки', shortLabel: 'Акты', icon: '📄' },
  OTHER: { label: 'Прочие договорные риски', shortLabel: 'Прочие', icon: '🔍' },
};

export const RiskMapCard: React.FC<RiskMapCardProps> = ({
  summary,
  contractRisks,
  onSelectCategoryFilter,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'categories' | 'severity' | 'matrix'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Determine overall risk zone color & text
  const riskScore = summary.overallRiskScore;
  const riskZone = useMemo(() => {
    if (riskScore >= 70 || summary.riskLevel === 'CRITICAL' || summary.riskLevel === 'HIGH') {
      return {
        key: 'RED',
        title: 'КРАСНАЯ ЗОНА (Высокая критичность)',
        description: 'Высокая концентрация кабальных штрафов (3%), закупок у 3-х лиц или риска расторжения.',
        bgColor: 'bg-rose-50 border-rose-200 text-rose-900',
        badgeBg: 'bg-rose-600 text-white',
        strokeColor: '#ef4444',
        accentHex: '#dc2626',
      };
    } else if (riskScore >= 35 || summary.riskLevel === 'MEDIUM') {
      return {
        key: 'YELLOW',
        title: 'ЖЕЛТАЯ ЗОНА (Умеренный уровень риска)',
        description: 'Присутствуют стандартные пени за просрочку и жесткий регламент приемки.',
        bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
        badgeBg: 'bg-amber-500 text-slate-950',
        strokeColor: '#f59e0b',
        accentHex: '#d97706',
      };
    } else {
      return {
        key: 'GREEN',
        title: 'ЗЕЛЕНАЯ ЗОНА (Низкий / Безопасный уровень)',
        description: 'Условия договора сбалансированы и соответствуют стандартной деловой практике.',
        bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        badgeBg: 'bg-emerald-600 text-white',
        strokeColor: '#10b981',
        accentHex: '#059669',
      };
    }
  }, [riskScore, summary.riskLevel]);

  // Aggregate stats by risk category
  const categoryChartData = useMemo(() => {
    const counts: Record<string, { count: number; criticalCount: number; highCount: number; mediumCount: number; infoCount: number }> = {
      PENALTIES: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
      DELIVERY_TERMS: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
      THIRD_PARTY_PURCHASE: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
      TERMINATION: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
      DOCUMENTS: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
      OTHER: { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 },
    };

    contractRisks.forEach(item => {
      const catKey = item.category || 'OTHER';
      if (!counts[catKey]) {
        counts[catKey] = { count: 0, criticalCount: 0, highCount: 0, mediumCount: 0, infoCount: 0 };
      }
      counts[catKey].count += 1;
      if (item.severity === 'CRITICAL') counts[catKey].criticalCount += 1;
      else if (item.severity === 'HIGH') counts[catKey].highCount += 1;
      else if (item.severity === 'MEDIUM') counts[catKey].mediumCount += 1;
      else counts[catKey].infoCount += 1;
    });

    return Object.entries(counts)
      .map(([key, data]) => ({
        categoryKey: key,
        name: CATEGORY_MAP[key]?.shortLabel || key,
        fullName: CATEGORY_MAP[key]?.label || key,
        count: data.count,
        critical: data.criticalCount,
        high: data.highCount,
        medium: data.mediumCount,
        info: data.infoCount,
        weight: data.criticalCount * 3 + data.highCount * 2 + data.mediumCount * 1,
      }))
      .filter(item => item.count > 0 || true); // keep all for complete map
  }, [contractRisks]);

  // Severity Distribution Data
  const severityPieData = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, INFO: 0 };
    contractRisks.forEach(r => {
      if (r.severity in counts) {
        counts[r.severity as RiskSeverity] += 1;
      } else {
        counts.MEDIUM += 1;
      }
    });

    return [
      { name: 'Критический (CRITICAL)', value: counts.CRITICAL, color: '#ef4444', key: 'CRITICAL' },
      { name: 'Высокий (HIGH)', value: counts.HIGH, color: '#f97316', key: 'HIGH' },
      { name: 'Умеренный (MEDIUM)', value: counts.MEDIUM, color: '#f59e0b', key: 'MEDIUM' },
      { name: 'Информационный (INFO)', value: counts.INFO, color: '#10b981', key: 'INFO' },
    ].filter(d => d.value > 0);
  }, [contractRisks]);

  // Handle Category Filter Selection
  const handleCategoryClick = (catKey: string) => {
    const newSel = selectedCategory === catKey ? null : catKey;
    setSelectedCategory(newSel);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(newSel);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden space-y-0 animate-fade-in">
      
      {/* Card Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl text-white shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-md">
                Визуализация аудита 223-ФЗ
              </span>
              <span className="text-xs text-slate-400 font-medium">• Карта и Распределение Рисков</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              Интерактивная Карта Рисков и Индекс Безопасности
            </h2>
          </div>
        </div>

        {/* Tab Switcher for Chart Views */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1.5 rounded-2xl border border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveChartTab('categories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>По категориям</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('severity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'severity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Структура угроз</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Матрица рисков</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Risk Score & Color Zone Indicator Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Risk Score Gauge Display */}
          <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Индекс риска договора
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${riskZone.badgeBg}`}>
                {summary.riskLevel} RISK
              </span>
            </div>

            {/* Score Number + Color Bar Progress */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {riskScore}
                </span>
                <span className="text-base font-bold text-slate-400">/ 100</span>
              </div>

              {/* Tricolor Scale Meter */}
              <div className="space-y-1">
                <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex p-0.5 relative">
                  {/* Green segment */}
                  <div className="w-[35%] bg-emerald-500 h-full rounded-l-full" title="Зеленая зона (0-34)" />
                  {/* Yellow segment */}
                  <div className="w-[35%] bg-amber-400 h-full" title="Желтая зона (35-69)" />
                  {/* Red segment */}
                  <div className="w-[30%] bg-rose-500 h-full rounded-r-full" title="Красная зона (70-100)" />

                  {/* Indicator Marker */}
                  <div 
                    className="absolute top-0 bottom-0 w-2.5 bg-slate-950 border-2 border-white rounded-full shadow-md transition-all duration-500"
                    style={{ left: `calc(${Math.min(96, Math.max(2, riskScore))}% - 5px)` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 px-1 pt-0.5">
                  <span className="text-emerald-700">0 Безопасно</span>
                  <span className="text-amber-700">35 Внимание</span>
                  <span className="text-rose-700">70+ Критично</span>
                </div>
              </div>
            </div>

            {/* Risk Zone Description Badge */}
            <div className={`p-3.5 rounded-2xl border text-xs font-medium space-y-1 ${riskZone.bgColor}`}>
              <div className="font-extrabold flex items-center gap-1.5">
                {riskZone.key === 'RED' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
                {riskZone.key === 'YELLOW' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {riskZone.key === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>{riskZone.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {riskZone.description}
              </p>
            </div>
          </div>

          {/* Recharts Chart Canvas Container */}
          <div className="md:col-span-7 bg-slate-50 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between min-h-[280px]">
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {activeChartTab === 'categories' && 'Распределение факторов риска по категориям'}
                {activeChartTab === 'severity' && 'Соотношение уровней критичности'}
                {activeChartTab === 'matrix' && 'Профиль концентрации рисков'}
              </h3>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleCategoryClick(selectedCategory)}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Сбросить фильтр</span>
                </button>
              )}
            </div>

            {/* RECHARTS VIEW 1: BAR CHART BY CATEGORY */}
            {activeChartTab === 'categories' && (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
                              <p className="font-extrabold text-indigo-300">{data.fullName}</p>
                              <p>Всего условий с риском: <span className="font-bold text-amber-300">{data.count}</span></p>
                              <div className="text-[10px] text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
                                {data.critical > 0 && <p className="text-rose-400">🔴 Критических: {data.critical}</p>}
                                {data.high > 0 && <p className="text-orange-400">🟧 Высоких: {data.high}</p>}
                                {data.medium > 0 && <p className="text-amber-400">🟨 Умеренных: {data.medium}</p>}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[8, 8, 0, 0]}
                      onClick={(barData) => handleCategoryClick(barData.categoryKey)}
                      className="cursor-pointer"
                    >
                      {categoryChartData.map((entry, index) => {
                        const isSelected = selectedCategory === entry.categoryKey;
                        let barColor = '#6366f1'; // Indigo default
                        if (entry.critical > 0) barColor = '#ef4444'; // Red if has critical
                        else if (entry.high > 0) barColor = '#f97316'; // Orange
                        else if (entry.medium > 0) barColor = '#f59e0b'; // Amber

                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isSelected ? '#312e81' : barColor} 
                            opacity={selectedCategory && !isSelected ? 0.35 : 1}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RECHARTS VIEW 2: PIE CHART BY SEVERITY */}
            {activeChartTab === 'severity' && (
              <div className="w-full h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      {severityPieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs">
                              <p className="font-extrabold">{data.name}</p>
                              <p className="text-slate-300">Количество пунктов: <span className="font-bold text-white">{data.value}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
                      formatter={(value) => <span className="text-slate-700 font-bold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* RECHARTS VIEW 3: RADAR PROFILE MATRIX */}
            {activeChartTab === 'matrix' && (
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryChartData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#334155' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                    <Radar name="Индекс риска" dataKey="weight" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            <p className="text-[11px] text-slate-400 font-medium text-center mt-2">
              💡 Нажмите на любой столбец диаграммы для быстрой фильтрации кабальных условий в реестре ниже.
            </p>

          </div>

        </div>

        {/* Category Quick Badges Filter Bar */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Быстрая выборка факторов риска по разделам договора:
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                !selectedCategory
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Все риски ({contractRisks.length})
            </button>

            {categoryChartData.map(cat => {
              const isSel = selectedCategory === cat.categoryKey;
              const catInfo = CATEGORY_MAP[cat.categoryKey];

              return (
                <button
                  key={cat.categoryKey}
                  type="button"
                  onClick={() => handleCategoryClick(cat.categoryKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isSel
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                  }`}
                >
                  <span>{catInfo?.icon || '📌'}</span>
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
