import React, { useState, useMemo } from 'react';
import { 
  ContractRiskItem, 
  RiskSeverity, 
  AnalysisResult 
} from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Layers, 
  Scale,
  Truck,
  FileText,
  UserX,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';

interface RiskMapCardProps {
  summary: AnalysisResult['summary'];
  contractRisks: ContractRiskItem[];
  onSelectCategoryFilter?: (category: string | null) => void;
  onRiskSectorClick?: (filter: { category?: string | null; severity?: string | null }) => void;
}

const CATEGORY_MAP: Record<string, { label: string; shortLabel: string; icon: any }> = {
  PENALTIES: { label: 'Штрафы и неустойки', shortLabel: 'Штрафы и пени', icon: Scale },
  DELIVERY_TERMS: { label: 'Сроки и график поставки', shortLabel: 'Сроки поставки', icon: Truck },
  TERMINATION: { label: 'Односторонний отказ Заказчика', shortLabel: 'Отказ и РНП', icon: UserX },
  THIRD_PARTY_PURCHASE: { label: 'Закупка у 3-х лиц за счет Поставщика', shortLabel: 'Закупка у 3-х лиц', icon: AlertTriangle },
  DOCUMENTS: { label: 'Документооборот и акты приемки', shortLabel: 'Приемка и УПД', icon: FileText },
  OTHER: { label: 'Прочие договорные риски', shortLabel: 'Прочие условия', icon: Layers },
};

export const RiskMapCard: React.FC<RiskMapCardProps> = ({
  summary,
  contractRisks,
  onSelectCategoryFilter,
  onRiskSectorClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  const riskScore = summary.overallRiskScore;
  const riskZone = useMemo(() => {
    if (riskScore >= 70 || summary.riskLevel === 'CRITICAL' || summary.riskLevel === 'HIGH') {
      return {
        key: 'RED',
        title: 'КРАСНАЯ ЗОНА (Высокая критичность)',
        description: 'Высокая концентрация кабальных штрафов, рисков закупки у 3-х лиц или одностороннего расторжения.',
        bgColor: 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200',
        badgeBg: 'bg-rose-600 text-white',
        badgeBorder: 'border-rose-600',
      };
    } else if (riskScore >= 35 || summary.riskLevel === 'MEDIUM') {
      return {
        key: 'YELLOW',
        title: 'ЖЕЛТАЯ ЗОНА (Умеренный уровень риска)',
        description: 'Присутствуют стандартные пени за просрочку, регламентированные сроки приемки и требования нацрежима.',
        bgColor: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200',
        badgeBg: 'bg-amber-500 text-slate-950',
        badgeBorder: 'border-amber-500',
      };
    } else {
      return {
        key: 'GREEN',
        title: 'ЗЕЛЕНАЯ ЗОНА (Низкий / Безопасный уровень)',
        description: 'Условия договора сбалансированы и соответствуют стандартной деловой практике без скрытых ловушек.',
        bgColor: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200',
        badgeBg: 'bg-emerald-600 text-white',
        badgeBorder: 'border-emerald-600',
      };
    }
  }, [riskScore, summary.riskLevel]);

  const categoryBreakdown = useMemo(() => {
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
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({
        categoryKey: key,
        name: CATEGORY_MAP[key]?.shortLabel || key,
        fullName: CATEGORY_MAP[key]?.label || key,
        Icon: CATEGORY_MAP[key]?.icon || Layers,
        count: data.count,
        critical: data.criticalCount,
        high: data.highCount,
        medium: data.mediumCount,
        info: data.infoCount,
      }));
  }, [contractRisks]);

  const severityCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, INFO: 0 };
    contractRisks.forEach(r => {
      if (r.severity in counts) {
        counts[r.severity as RiskSeverity] += 1;
      } else {
        counts.MEDIUM += 1;
      }
    });
    return counts;
  }, [contractRisks]);

  const scrollToRisksTable = () => {
    setTimeout(() => {
      const el = document.getElementById('contract-risks-table');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCategoryClick = (catKey: string) => {
    const newSel = selectedCategory === catKey ? null : catKey;
    setSelectedCategory(newSel);
    setSelectedSeverity(null);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(newSel);
    }
    if (onRiskSectorClick) {
      onRiskSectorClick({ category: newSel, severity: null });
    }
    scrollToRisksTable();
  };

  const handleSeverityClick = (severityKey: string) => {
    const newSev = selectedSeverity === severityKey ? null : severityKey;
    setSelectedSeverity(newSev);
    setSelectedCategory(null);
    if (onRiskSectorClick) {
      onRiskSectorClick({ category: null, severity: newSev });
    }
    scrollToRisksTable();
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedSeverity(null);
    if (onSelectCategoryFilter) onSelectCategoryFilter(null);
    if (onRiskSectorClick) onRiskSectorClick({ category: null, severity: null });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden space-y-0 transition-colors duration-200"
    >
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-md">
                Экспертный аудит
              </span>
              <span className="text-xs text-slate-400 font-medium">• Анализ рисков и условий</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight">
              Сводная матрица рисков контракта
            </h2>
          </div>
        </div>

        {/* Action / Reset Filter Button */}
        {(selectedCategory || selectedSeverity) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Сбросить активный фильтр</span>
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Risk Score & Severity Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column: Risk Index Meter */}
          <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Индекс риска договора
              </span>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${riskZone.badgeBg}`}>
                {summary.riskLevel} RISK
              </span>
            </div>

            {/* Score Number + Color Bar Progress */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {riskScore}
                </span>
                <span className="text-base font-bold text-slate-400 dark:text-slate-500">/ 100</span>
              </div>

              {/* Tricolor Scale Meter */}
              <div className="space-y-1">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex p-0.5 relative">
                  <div className="w-[35%] bg-emerald-500 h-full rounded-l-full" title="Зеленая зона (0-34)" />
                  <div className="w-[35%] bg-amber-400 h-full" title="Желтая зона (35-69)" />
                  <div className="w-[30%] bg-rose-500 h-full rounded-r-full" title="Красная зона (70-100)" />

                  <div 
                    className="absolute top-0 bottom-0 w-2.5 bg-slate-950 dark:bg-white border-2 border-white dark:border-slate-950 rounded-full shadow-md transition-all duration-500"
                    style={{ left: `calc(${Math.min(96, Math.max(2, riskScore))}% - 5px)` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 px-1 pt-0.5">
                  <span className="text-emerald-700 dark:text-emerald-400">0 Безопасно</span>
                  <span className="text-amber-700 dark:text-amber-400">35 Внимание</span>
                  <span className="text-rose-700 dark:text-rose-400">70+ Критично</span>
                </div>
              </div>
            </div>

            {/* Risk Zone Description Badge */}
            <div className={`p-3.5 rounded-2xl border text-xs font-medium space-y-1 ${riskZone.bgColor}`}>
              <div className="font-extrabold flex items-center gap-1.5">
                {riskZone.key === 'RED' && <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                {riskZone.key === 'YELLOW' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                {riskZone.key === 'GREEN' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                <span>{riskZone.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                {riskZone.description}
              </p>
            </div>
          </div>

          {/* Right Column: Severity Level Pills */}
          <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Структура выявленных факторов ({contractRisks.length} поз.)
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  Кликните для фильтрации
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Critical */}
                <button
                  type="button"
                  onClick={() => handleSeverityClick('CRITICAL')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedSeverity === 'CRITICAL'
                      ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase mb-1">
                    Критические
                  </div>
                  <div className="text-2xl font-black text-rose-700 dark:text-rose-300">
                    {severityCounts.CRITICAL}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Кабальные штрафы
                  </div>
                </button>

                {/* High */}
                <button
                  type="button"
                  onClick={() => handleSeverityClick('HIGH')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedSeverity === 'HIGH'
                      ? 'bg-orange-100 dark:bg-orange-950/60 border-orange-500 ring-2 ring-orange-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase mb-1">
                    Высокие
                  </div>
                  <div className="text-2xl font-black text-orange-700 dark:text-orange-300">
                    {severityCounts.HIGH}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Жесткие условия
                  </div>
                </button>

                {/* Medium */}
                <button
                  type="button"
                  onClick={() => handleSeverityClick('MEDIUM')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedSeverity === 'MEDIUM'
                      ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">
                    Умеренные
                  </div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {severityCounts.MEDIUM}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Стандартные пени
                  </div>
                </button>

                {/* Info */}
                <button
                  type="button"
                  onClick={() => handleSeverityClick('INFO')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedSeverity === 'INFO'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                    Инфо
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                    {severityCounts.INFO}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-medium">
                    Справки и регламент
                  </div>
                </button>
              </div>
            </div>

            {/* Quick guidance note */}
            <div className="mt-4 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium">
                {summary.is223FZ 
                  ? 'По 223-ФЗ штрафы не подлежат обязательному списанию по ПП № 783. Направляйте протокол разногласий.'
                  : 'По 44-ФЗ действует правило законного списания начисленных неустоек по ПП РФ № 783 (до 5%).'}
              </span>
              <button
                type="button"
                onClick={scrollToRisksTable}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 ml-2 flex items-center gap-1 cursor-pointer"
              >
                <span>К таблице</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Breakdown Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Распределение рисков по правовым категориям
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Выберите категорию для мгновенного перехода
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => {
              const isSelected = selectedCategory === cat.categoryKey;
              const { Icon } = cat;
              return (
                <button
                  key={cat.categoryKey}
                  type="button"
                  onClick={() => handleCategoryClick(cat.categoryKey)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/30'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {cat.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {cat.fullName}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl shrink-0 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {cat.count}
                    </span>
                  </div>

                  {/* Mini severity distribution badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                    {cat.critical > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                        {cat.critical} крит.
                      </span>
                    )}
                    {cat.high > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-bold">
                        {cat.high} выс.
                      </span>
                    )}
                    {cat.medium > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                        {cat.medium} средн.
                      </span>
                    )}
                    {cat.info > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                        {cat.info} инфо
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </motion.div>
  );
};
