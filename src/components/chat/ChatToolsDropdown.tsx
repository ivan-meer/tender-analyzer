import React from 'react';
import { Wrench, Calculator, FileText, DownloadCloud, FileJson } from 'lucide-react';

interface ChatToolsDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenPenaltyCalc: () => void;
  onGenerateDisagreementTemplate: () => void;
  onExportChat: (format: 'md' | 'json') => void;
  hasMessages: boolean;
}

export const ChatToolsDropdown: React.FC<ChatToolsDropdownProps> = ({
  isOpen,
  onToggle,
  onOpenPenaltyCalc,
  onGenerateDisagreementTemplate,
  onExportChat,
  hasMessages,
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        title="Инструменты и экспорт"
      >
        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">Инструменты</span>
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-10 z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 space-y-1 text-xs animate-fade-in"
        >
          <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
            🛠️ Полезные утилиты
          </div>

          <button
            onClick={() => {
              onOpenPenaltyCalc();
              onToggle();
            }}
            className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-slate-200 font-medium"
          >
            <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Калькулятор пеней 223-ФЗ</div>
              <div className="text-[10px] text-slate-400">Расчет неустойки 1/300 ставки ЦБ</div>
            </div>
          </button>

          <button
            onClick={() => {
              onGenerateDisagreementTemplate();
              onToggle();
            }}
            className="w-full text-left px-2.5 py-2 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-slate-200 font-medium"
          >
            <FileText className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold">Протокол разногласий</div>
              <div className="text-[10px] text-slate-400">Генерация обращения к заказчику</div>
            </div>
          </button>

          <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800 pt-2">
            📥 Экспорт истории
          </div>

          <button
            onClick={() => {
              onExportChat('md');
              onToggle();
            }}
            disabled={!hasMessages}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-slate-300 disabled:opacity-40"
          >
            <DownloadCloud className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Скачать Markdown (.md)</span>
          </button>

          <button
            onClick={() => {
              onExportChat('json');
              onToggle();
            }}
            disabled={!hasMessages}
            className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 text-slate-300 disabled:opacity-40"
          >
            <FileJson className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Скачать JSON (.json)</span>
          </button>
        </div>
      )}
    </div>
  );
};
