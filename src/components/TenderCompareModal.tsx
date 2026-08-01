import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Tag,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { SavedAnalysis } from '../lib/firebase';

interface TenderCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  analyses: SavedAnalysis[];
  initialTenderA?: SavedAnalysis | null;
  initialTenderB?: SavedAnalysis | null;
}

export const TenderCompareModal: React.FC<TenderCompareModalProps> = ({
  isOpen,
  onClose,
  analyses,
  initialTenderA,
  initialTenderB
}) => {
  const [selectedIdA, setSelectedIdA] = useState<string>(
    initialTenderA?.id || (analyses[0]?.id || '')
  );
  const [selectedIdB, setSelectedIdB] = useState<string>(
    initialTenderB?.id || (analyses[1]?.id || analyses[0]?.id || '')
  );

  if (!isOpen) return null;

  const tenderA = analyses.find(a => a.id === selectedIdA) || analyses[0];
  const tenderB = analyses.find(a => a.id === selectedIdB) || (analyses[1] || analyses[0]);

  const renderTenderDetails = (item: SavedAnalysis | undefined, label: string) => {
    if (!item) {
      return (
        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          Выберите тендер для сравнения
        </div>
      );
    }

    const res = item.analysisResult || {};
    const summary = res.summary || {};
    const risks = res.risksCheck?.risks || [];
    const pp1875 = res.pp1875Check || {};

    return (
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-4">
        <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
            {label}
          </span>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
            {item.projectName || item.title}
          </h4>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Заказчик:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
              {item.customerName || summary.customerName || 'Заказчик 223-ФЗ'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Сумма НМЦК:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
              {item.procurementSum || summary.procurementSum || 'По заявке'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Индекс риска:</span>
            <span className={`font-mono font-bold text-xs ${
              item.riskScore > 60 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {item.riskScore} / 100 ({item.riskLevel})
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Дата аукциона:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 block">
              {item.auctionDate || summary.auctionDate || 'Уточняется'}
            </span>
          </div>
        </div>

        {/* National Regime */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
            Национальный режим (ПП 1875):
          </span>
          <div className="text-slate-600 dark:text-slate-300 font-medium">
            {pp1875.status || summary.pp1875Status || 'Запрет / Ограничение согласно ПП 1875'}
          </div>
        </div>

        {/* Risks Summary */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
              Выявленные риски контракта ({risks.length}):
            </span>
          </div>
          {risks.length > 0 ? (
            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {risks.slice(0, 4).map((r: any, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{r.title || r.clauseText || r.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Критический рисков в условиях не обнаружено.
            </p>
          )}
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {item.tags.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Сравнение условий двух тендеров</h3>
              <p className="text-[11px] text-slate-400 font-medium">Визуальное сопоставление рисков, сумм и условий 223-ФЗ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selectors Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Первая закупка (A):
            </label>
            <select
              value={selectedIdA}
              onChange={(e) => setSelectedIdA(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {analyses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.projectName || a.title} ({a.procurementSum || 'По заявке'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Вторая закупка (B):
            </label>
            <select
              value={selectedIdB}
              onChange={(e) => setSelectedIdB(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {analyses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.projectName || a.title} ({a.procurementSum || 'По заявке'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTenderDetails(tenderA, 'Закупка A')}
          {renderTenderDetails(tenderB, 'Закупка B')}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Закрыть сравнение
          </button>
        </div>

      </div>
    </div>
  );
};
