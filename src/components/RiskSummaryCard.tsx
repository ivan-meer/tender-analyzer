import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Ban, Sparkles } from 'lucide-react';
import { AnalysisResult } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface RiskSummaryCardProps {
  summary: AnalysisResult['summary'];
  onOpenCustomerVerification?: (inn?: string, customerName?: string) => void;
}

export const RiskSummaryCard: React.FC<RiskSummaryCardProps> = ({ summary, onOpenCustomerVerification }) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'HIGH':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30';
    if (score >= 45) return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30';
    return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30';
  };

  return (
    <div className="space-y-4">
      {/* Visual Live Countdown Timer to Auction / Submission Deadline */}
      <CountdownTimer 
        targetDateStr={summary.auctionDate} 
        variant="full" 
        title="Обратный отсчет до окончания приема заявок"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Title & Risk Score Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getBadgeStyle(summary.riskLevel)}`}>
                  Уровень риска: {summary.riskLevel}
                </span>
                {summary.is223FZ && (
                  <span className="text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-full">
                    Регламент 223-ФЗ
                  </span>
                )}
                {onOpenCustomerVerification && (
                  <button
                    type="button"
                    onClick={() => onOpenCustomerVerification(summary.customerInn, summary.customerName)}
                    className="text-[11px] font-extrabold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs truncate max-w-full"
                  >
                    <span className="shrink-0">🏢 Проверить ИНН заказчика</span>
                    {summary.customerName && <span className="font-semibold opacity-80 truncate">({summary.customerName})</span>}
                  </button>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
                {summary.procurementTitle || 'Результат комплексного анализа закупки'}
              </h2>
            </div>

            {/* Risk Score Display */}
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getScoreColor(summary.overallRiskScore)} shrink-0 shadow-2xs`}>
              <div className="text-right">
                <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-80">Индекс риска</div>
                <div className="text-2xl font-black font-mono leading-none mt-0.5">{summary.overallRiskScore} / 100</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-900/80 flex items-center justify-center shadow-xs">
                {summary.overallRiskScore >= 75 ? (
                  <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
                ) : summary.overallRiskScore >= 45 ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* Key Takeaway / Analytical Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Краткий вывод и резюме аналитика:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {summary.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Bento Grid: Dark Agent Advice Card (Matching Design Theme) */}
        <div className="lg:col-span-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden space-y-4">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold uppercase text-xs tracking-widest text-indigo-300">
                Совет Агента по 223-ФЗ
              </h3>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/60 p-3.5 rounded-2xl">
              <div className="flex items-start gap-2.5 text-xs text-amber-300 leading-relaxed font-medium">
                <Ban className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-200 font-bold mb-0.5 uppercase tracking-wide text-[10px]">Важно по 223-ФЗ:</strong>
                  По закону 223-ФЗ штрафы не списываются автоматически. Неустойки вычитаются из оплаты или взыскиваются напрямую!
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Подготавливайте письменные уведомления о готовности товара и акты сразу после заключения договора.
            </p>
          </div>

          <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
            <ShieldAlert className="w-36 h-36 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

