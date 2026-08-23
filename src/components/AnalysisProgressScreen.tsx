import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileSearch, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Building2, 
  Zap, 
  Archive, 
  Clock, 
  Layers, 
  Bookmark, 
  AlertTriangle,
  ArrowRight,
  X
} from 'lucide-react';
import { ProcedureType } from '../types';

interface AnalysisProgressScreenProps {
  procedureType?: ProcedureType;
  elapsedSeconds?: number;
  isHeavyTimeout?: boolean;
  showHeavyTimeoutPrompt?: boolean;
  onSwitchToBackground?: () => void;
  onSaveDraft?: () => void;
  onDismissHeavyPrompt?: () => void;
  onCancel?: () => void;
  onForceInstant?: () => void;
}

export const AnalysisProgressScreen: React.FC<AnalysisProgressScreenProps> = ({ 
  procedureType, 
  elapsedSeconds: parentElapsedSeconds,
  isHeavyTimeout = false,
  showHeavyTimeoutPrompt = false,
  onSwitchToBackground,
  onSaveDraft,
  onDismissHeavyPrompt,
  onCancel, 
  onForceInstant 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);
  const [localElapsed, setLocalElapsed] = useState(0);

  const elapsed = typeof parentElapsedSeconds === 'number' ? parentElapsedSeconds : localElapsed;
  const isHeavy = isHeavyTimeout || elapsed >= 20;

  const is44FZ = Boolean(procedureType && procedureType.startsWith('44_FZ'));
  const isCommercial = procedureType === 'COMMERCIAL' || procedureType === 'OTHER';

  const steps = [
    {
      id: 'unarchive',
      title: 'Разархивирование и распаковка ZIP/RAR закупочных файлов',
      subtitle: 'Извлечение проектов контрактов, спец-ТЗ, смет и чертежей',
      icon: Archive,
    },
    {
      id: 'ocr',
      title: is44FZ 
        ? 'Парсинг структуры и нормативная проверка по 44-ФЗ (ЕИС Закупки)'
        : isCommercial
        ? 'Парсинг структуры коммерческого тендера и условий поставки'
        : 'Парсинг структуры и извлечение юридических формулировок 223-ФЗ',
      subtitle: 'Обработка проекта договора, технического задания и требований к заявке',
      icon: FileSearch,
    },
    {
      id: 'risks',
      title: is44FZ
        ? 'Расчет неустоек (ПП РФ № 1042) и права на списание штрафов (ПП РФ № 783)'
        : 'Анализ рисков договора и кабальных штрафов (3% НМЦК без списания)',
      subtitle: is44FZ
        ? 'Оценка условий одностороннего расторжения, ЕРУЗ и риска попасть в РНП'
        : 'Проверка прав закупки у 3-х лиц, коротких сроков поставки и неустоек',
      icon: ShieldCheck,
    },
    {
      id: 'pp1875',
      title: is44FZ
        ? 'Проверка Нацрежима (ПП РФ № 616/617, ПП № 1875) и реестра ГИСП'
        : 'Проверка Нацрежима ПП РФ № 1875 и реестра ГИСП / Минпромторга',
      subtitle: is44FZ
        ? 'Контроль запретов (ПП 616), ограничений "3-й лишний" (ПП 617) и реестровых номеров ГИСП/РЭП'
        : 'Автоматическое определение ОКПД2 и требований к стране происхождения',
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
    // Local fallback timer if parent doesn't provide elapsedSeconds
    const timerInterval = setInterval(() => {
      setLocalElapsed((sec) => sec + 1);
    }, 1000);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 80) {
          return prev + Math.floor(Math.random() * 8) + 4;
        } else if (prev < 92) {
          return prev + Math.floor(Math.random() * 2) + 1;
        } else if (prev < 97) {
          return prev + (Math.random() > 0.7 ? 1 : 0);
        }
        return 98;
      });
    }, 500);

    return () => {
      clearInterval(timerInterval);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 w-full max-w-xl space-y-5 text-slate-100 relative overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Top Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse" />

        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {is44FZ 
                    ? 'ИИ-Экспертиза 44-ФЗ' 
                    : isCommercial 
                    ? 'ИИ-Экспертиза коммерческой закупки' 
                    : 'ИИ-Экспертиза 223-ФЗ'}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md flex items-center gap-1">
                  <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                  Gemini 3.1 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {is44FZ 
                  ? 'Глубокая проверка контракта, ПП РФ № 1042, ЕИС и Нацрежима' 
                  : 'Глубокая проверка контракта, штрафных рисков и требований ПП РФ № 1875'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800 shrink-0">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className={elapsed >= 20 ? 'text-amber-400 font-bold' : ''}>
              {elapsed} сек.
            </span>
          </div>
        </div>

        {/* Heavy Operation Timeout Prompt (>20s) */}
        {isHeavy && (
          <div className="p-4 bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/40 border-2 border-amber-500/50 rounded-2xl text-slate-200 shadow-xl space-y-3 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>Таймаут тяжелой операции ({elapsed} сек.)</span>
              </div>
              {onDismissHeavyPrompt && (
                <button
                  type="button"
                  onClick={onDismissHeavyPrompt}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Скрыть подсказку"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Анализ объемной документации и приложений требует дополнительного времени. Чтобы интерфейс не блокировался, выберите удобное действие:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onSwitchToBackground && (
                <button
                  type="button"
                  onClick={onSwitchToBackground}
                  className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-200 group-hover:scale-110 transition-transform" />
                  <span>Работать в фоне</span>
                </button>
              )}

              {onSaveDraft && (
                <button
                  type="button"
                  onClick={onSaveDraft}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-200 hover:text-white font-bold text-xs rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Сохранить черновик</span>
                </button>
              )}

              {onForceInstant && (
                <button
                  type="button"
                  onClick={onForceInstant}
                  className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 hover:text-white font-bold text-xs rounded-xl border border-emerald-500/40 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer sm:col-span-2"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Показать мгновенный отчет (Dynamic AI Engine)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar & Percentage Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Прогресс выполнения:</span>
              <span className="text-slate-500 text-[11px] font-normal">
                (Шаг {currentStep + 1} из {steps.length})
              </span>
            </span>
            <span className="text-indigo-400 font-extrabold">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Progress List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[36vh] pr-1 scrollbar-thin">
          {steps.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl shrink-0 ${
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

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold block truncate">
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-mono text-indigo-400 font-extrabold animate-pulse shrink-0">
                        ОБРАБОТКА...
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

        {/* Bottom Actions & Security Note */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {is44FZ ? 'Проверка согласно 44-ФЗ и ПП РФ № 1875' : 'Проверка согласно 223-ФЗ и ПП РФ № 1875'}
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              Потоковая проверка
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {onCancel && (
              <button
                type="button"
                id="cancel-analysis-btn"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/60 cursor-pointer"
              >
                Отменить
              </button>
            )}

            {onSwitchToBackground && (
              <button
                type="button"
                onClick={onSwitchToBackground}
                className="px-3 py-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-xl transition-all border border-indigo-500/40 flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>В фон</span>
              </button>
            )}

            {onForceInstant && (
              <button
                type="button"
                id="force-instant-analysis-btn"
                onClick={onForceInstant}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Мгновенный результат</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
