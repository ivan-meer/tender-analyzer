import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, Ban, Sparkles } from 'lucide-react';
import { AnalysisResult } from '../types';

interface RiskSummaryCardProps {
  summary: AnalysisResult['summary'];
}

export const RiskSummaryCard: React.FC<RiskSummaryCardProps> = ({ summary }) => {
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 border-red-200 bg-red-50';
    if (score >= 45) return 'text-amber-600 border-amber-200 bg-amber-50';
    return 'text-emerald-600 border-emerald-200 bg-emerald-50';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main Title & Risk Score Card */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getBadgeStyle(summary.riskLevel)}`}>
                Уровень риска: {summary.riskLevel}
              </span>
              {summary.is223FZ && (
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                  Регламент 223-ФЗ
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {summary.procurementTitle || 'Результат комплексного анализа закупки'}
            </h2>
          </div>

          {/* Risk Score Display */}
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${getScoreColor(summary.overallRiskScore)} shrink-0 shadow-2xs`}>
            <div className="text-right">
              <div className="text-[10px] uppercase font-extrabold tracking-wider opacity-80">Индекс риска</div>
              <div className="text-2xl font-black font-mono leading-none mt-0.5">{summary.overallRiskScore} / 100</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shadow-xs">
              {summary.overallRiskScore >= 75 ? (
                <ShieldAlert className="w-6 h-6 text-red-600" />
              ) : summary.overallRiskScore >= 45 ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              )}
            </div>
          </div>
        </div>

        {/* Key Takeaway / Analytical Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Краткий вывод и резюме аналитика:</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {summary.keyTakeaway}
          </p>
        </div>
      </div>

      {/* Bento Grid: Dark Agent Advice Card (Matching Design Theme) */}
      <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between relative overflow-hidden space-y-4">
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
  );
};

