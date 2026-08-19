import React from 'react';
import { FileText, Bot } from 'lucide-react';

interface ChatDetailsTabProps {
  activeAnalysisContext?: any;
  onGenerateDisagreementProtocol: () => void;
}

export const ChatDetailsTab: React.FC<ChatDetailsTabProps> = ({
  activeAnalysisContext,
  onGenerateDisagreementProtocol,
}) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {activeAnalysisContext?.summary?.procurementTitle || 'Поставки кресел и офисной мебели для нужд ГУП'}
              </h3>
              <p className="text-xs text-slate-400">Паспорт закупки 223-ФЗ / Извлеченные параметры</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Индекс риска: {activeAnalysisContext?.riskAssessment?.riskIndex || 15} / 100
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Заказчик</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
              {activeAnalysisContext?.summary?.customerName || 'ГУП «Мосгортранс»'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Сумма НМЦК</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
              {activeAnalysisContext?.summary?.procurementSum || '12 450 000 ₽'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Дата аукциона</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              {activeAnalysisContext?.summary?.auctionDate || '15.08.2026'}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Статус аудита</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block">
              {activeAnalysisContext?.summary?.status || 'Проверено ИИ'}
            </span>
          </div>
        </div>

        {activeAnalysisContext?.requirements && activeAnalysisContext.requirements.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              📋 Позиции спецификации ТЗ ({activeAnalysisContext.requirements.length}):
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {activeAnalysisContext.requirements.map((req: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">{req.name || req.title}</span>
                    <span className="text-[11px] text-slate-500">{req.specs || req.description}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-300 text-[11px] shrink-0 ml-2">
                    {req.quantity ? `${req.quantity} шт.` : '100 шт.'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={onGenerateDisagreementProtocol}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Сгенерировать Протокол разногласий в чате</span>
          </button>
        </div>
      </div>
    </div>
  );
};
