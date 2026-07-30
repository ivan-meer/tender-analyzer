import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileSearch, Sparkles, CheckCircle2, Cpu, Building2, Zap, AlertTriangle } from 'lucide-react';

interface AnalysisProgressScreenProps {
  onCancel?: () => void;
}

export const AnalysisProgressScreen: React.FC<AnalysisProgressScreenProps> = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(12);

  const steps = [
    {
      id: 'ocr',
      title: 'Парсинг структуры и извлечение юридических формулировок 223-ФЗ',
      subtitle: 'Обработка проекта договора, технического задания и требований к заявке',
      icon: FileSearch,
    },
    {
      id: 'risks',
      title: 'Анализ рисков договора и кабальных штрафов (3% НМЦК)',
      subtitle: 'Проверка прав закупки у 3-х лиц, коротких сроков поставки и неустоек',
      icon: ShieldCheck,
    },
    {
      id: 'pp1875',
      title: 'Проверка Нацрежима ПП РФ № 1875 и реестра ГИСП / Минпромторга',
      subtitle: 'Автоматическое определение ОКПД2 и требований к стране происхождения',
      icon: Building2,
    },
    {
      id: 'suppliers',
      title: 'Сверка с нашей базой отечественных фабрик (АЛВЕСТ, RIVA, Метта)',
      subtitle: 'Подбор аналогов с габаритами и диапазоном цен от производителей',
      icon: Sparkles,
    },
    {
      id: 'finalizing',
      title: 'Расчет токенов, калькуляция и формирование отчета',
      subtitle: 'Генерация структурированных рекомендаций и чек-листа подачи',
      icon: Cpu,
    },
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 8) + 3;
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-xl space-y-6 text-slate-100 relative overflow-hidden">
        
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse" />

        {/* Title Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 animate-spin-slow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">ИИ-Экспертиза 223-ФЗ в процессе...</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md flex items-center gap-1">
                <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                Gemini 3.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Глубокая проверка контракта, штрафных рисков и требований ПП РФ № 1875
            </p>
          </div>
        </div>

        {/* Progress Bar & Percentage Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-400">Прогресс выполнения:</span>
            <span className="text-indigo-400">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Progress List */}
        <div className="space-y-3 pt-2">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/30 scale-[1.01]'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isCurrent
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold block truncate">
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-indigo-400 font-extrabold animate-pulse shrink-0">
                        В РАБОТЕ...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Security Note */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Проверка согласно регламенту 223-ФЗ и ПП РФ № 1875
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            ~3-5 сек.
          </span>
        </div>

      </div>
    </div>
  );
};
