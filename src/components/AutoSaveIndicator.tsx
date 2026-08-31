import React, { useState, useEffect } from 'react';
import { Check, RefreshCw, Save, Trash2, Clock, Sparkles } from 'lucide-react';
import { formatAutoSaveTime } from '../utils/autoSaveManager';
import { Tooltip } from './Tooltip';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: string | null;
  onSaveNow?: () => void;
  onClearDraft?: () => void;
  compact?: boolean;
  className?: string;
  hasContent?: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  isSaving,
  lastSavedAt,
  onSaveNow,
  onClearDraft,
  compact = false,
  className = '',
  hasContent = true,
}) => {
  const [, setTick] = useState(0);

  // Update relative time display every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!hasContent && !lastSavedAt) {
    return null;
  }

  const relativeTime = formatAutoSaveTime(lastSavedAt);

  if (compact) {
    return (
      <Tooltip
        content={
          isSaving
            ? 'Идет сохранение изменений...'
            : lastSavedAt
            ? `Автосохранение активно • Сохранено ${relativeTime} (${new Date(lastSavedAt).toLocaleTimeString('ru-RU')})`
            : 'Автосохранение включено'
        }
        position="bottom"
      >
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
            isSaving
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          } ${className}`}
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400" />
              <span>Сохранение...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{relativeTime ? `Сохранено ${relativeTime}` : 'Автосохранено'}</span>
            </>
          )}
        </div>
      </Tooltip>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all border ${
        isSaving
          ? 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/80'
          : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
      } ${className}`}
    >
      <div className="flex items-center gap-1.5">
        {isSaving ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 text-[11px] leading-tight">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {isSaving ? 'Сохранение черновика...' : 'Автосохранение'}
          </span>
          {!isSaving && relativeTime && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              ({relativeTime})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-1 border-l border-slate-200 dark:border-slate-700 pl-2">
        {onSaveNow && (
          <Tooltip content="Принудительно сохранить состояние сейчас" position="top">
            <button
              type="button"
              onClick={onSaveNow}
              disabled={isSaving}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Сохранить немедленно"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        {onClearDraft && (
          <Tooltip content="Сбросить несохраненный автосохраненный черновик" position="top">
            <button
              type="button"
              onClick={onClearDraft}
              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              title="Очистить черновик"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
