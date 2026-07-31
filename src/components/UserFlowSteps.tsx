import React from 'react';
import { FileUp, ShieldAlert, Truck, FileCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface UserFlowStepsProps {
  currentStep: number;
  onStepClick?: (stepNumber: number) => void;
}

export const UserFlowSteps: React.FC<UserFlowStepsProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    {
      number: 1,
      title: 'Загрузка документов',
      subtitle: 'Файлы ТЗ, Архивы ZIP/RAR, Смета Excel',
      icon: <FileUp className="w-4 h-4" />,
    },
    {
      number: 2,
      title: 'ИИ-Аудит Рисков',
      subtitle: 'Штрафы 3%, закупка у 3-х лиц',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      number: 3,
      title: 'График & Логистика',
      subtitle: 'Интервал 5 дней, склады & подъем',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      number: 4,
      title: 'Подача & Шаблоны',
      subtitle: 'Чек-лист 223-ФЗ, УПД, Письма',
      icon: <FileCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Путь пользователя в системе (User Flow)
        </span>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <span>Этап {currentStep} из 4</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onStepClick && onStepClick(step.number)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                  : isCompleted
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100 hover:border-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    isActive ? 'text-indigo-200' : isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    Шаг {step.number}
                  </span>
                </div>
                <h4 className={`text-xs font-bold truncate leading-snug ${
                  isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  {step.title}
                </h4>
                <p className={`text-[11px] truncate mt-0.5 font-medium ${
                  isActive ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
