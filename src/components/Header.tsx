import React from 'react';
import { ShieldAlert, FileSearch, BookOpen, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  isAnalyzing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide, isAnalyzing }) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                Анализатор 223-ФЗ <span className="text-indigo-600">AI</span>
              </h1>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Регламент 223-ФЗ
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
              Интеллектуальный анализ закупочной документации и правовых рисков
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="open-guide-btn"
            onClick={onOpenGuide}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Памятка / Регламент</span>
          </button>

          <div className="flex items-center gap-2 text-xs bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100 text-slate-600">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="hidden sm:inline text-slate-500 font-medium">Статус ИИ:</span>
            <span className="text-indigo-700 font-bold font-mono text-[11px]">Gemini 3.6 Flash</span>
          </div>
        </div>
      </div>
    </header>
  );
};

