import React, { useState } from 'react';
import { AlertCircle, FileText, CheckCircle2, Filter, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ContractRiskItem, RiskSeverity } from '../types';

interface ContractRisksTableProps {
  risks: ContractRiskItem[];
}

export const ContractRisksTable: React.FC<ContractRisksTableProps> = ({ risks }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredRisks = risks.filter(r => {
    const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchSeverity = selectedSeverity === 'ALL' || r.severity === selectedSeverity;
    return matchCategory && matchSeverity;
  });

  const getSeverityBadge = (severity: RiskSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full uppercase">
            <ShieldAlert className="w-3 h-3" />
            Критический риск
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">
            <AlertTriangle className="w-3 h-3" />
            Высокий риск
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-0.5 rounded-full uppercase">
            <AlertCircle className="w-3 h-3" />
            Средний риск
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
            Информация
          </span>
        );
    }
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'PENALTIES': return 'Штрафы и неустойки';
      case 'DELIVERY_TERMS': return 'Сроки и условия поставки';
      case 'TERMINATION': return 'Расторжение и отказ';
      case 'THIRD_PARTY_PURCHASE': return 'Закупка у 3-х лиц / Разница цен';
      case 'DOCUMENTS': return 'Приемка и закрывашки';
      default: return 'Прочие условия';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span>Реестр рисков проекта договора ({risks.length})</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Детальный аудит спорных, кабальных и повышенных условий договора по регламенту
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Все категории</option>
            <option value="PENALTIES">Штрафы и неустойки</option>
            <option value="DELIVERY_TERMS">Сроки поставки</option>
            <option value="TERMINATION">Расторжение</option>
            <option value="THIRD_PARTY_PURCHASE">Покупка у 3-х лиц</option>
            <option value="DOCUMENTS">Приемка и документы</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Все уровни</option>
            <option value="CRITICAL">Критический</option>
            <option value="HIGH">Высокий</option>
            <option value="MEDIUM">Средний</option>
          </select>
        </div>
      </div>

      {filteredRisks.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 font-medium">
          По выбранным фильтрам рисков не найдено.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRisks.map((item) => (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 space-y-3 transition-all ${
                item.severity === 'CRITICAL'
                  ? 'bg-red-50/40 border-red-200'
                  : item.severity === 'HIGH'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-indigo-700 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {item.clauseNumber || 'Пункт договора'}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {getCategoryTitle(item.category)}
                  </span>
                  {getSeverityBadge(item.severity)}
                </div>
              </div>

              {/* Quote from contract */}
              {item.clauseQuote && (
                <div className="bg-white border-l-4 border-indigo-500 pl-3.5 py-2 pr-3 text-xs italic text-slate-700 font-serif rounded-r-xl border-y border-r border-slate-200 shadow-2xs">
                  «{item.clauseQuote}»
                </div>
              )}

              {/* Explanation & Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-2xs">
                  <div className="font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Правовые и финансовые риски:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{item.explanation}</p>
                </div>

                <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-1 shadow-2xs">
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Рекомендация и защитные шаги:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{item.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

