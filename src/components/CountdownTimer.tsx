import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Zap, Calendar } from 'lucide-react';

interface CountdownTimerProps {
  targetDateStr?: string;
  variant?: 'full' | 'compact' | 'card' | 'minimal';
  title?: string;
  showDetails?: boolean;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  isUnspecified: boolean;
  targetDateObj: Date | null;
}

// Helper to pluralize Russian words correctly
export function getPlural(number: number, one: string, two: string, five: string): string {
  let n = Math.abs(number);
  n %= 100;
  if (n >= 5 && n <= 20) return five;
  n %= 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return two;
  return five;
}

// Parses string like "15.08.2026", "15.08.2026 10:00", "2026-08-22", etc.
export function parseAuctionDeadline(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.trim().toLowerCase();
  if (
    clean === 'не указана' || 
    clean === 'не указано' || 
    clean === 'не указан' || 
    clean.includes('не указ') || 
    clean === 'в соответствии с извещением' ||
    clean === 'в соответствии с тз'
  ) {
    return null;
  }

  // Try matching DD.MM.YYYY [HH:mm] or DD.MM.YYYY, HH:mm
  const ddmmyyyyRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/;
  const match = dateStr.trim().match(ddmmyyyyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const year = parseInt(match[3], 10);
    const hours = match[4] ? parseInt(match[4], 10) : 18; // default to 18:00
    const minutes = match[5] ? parseInt(match[5], 10) : 0;
    return new Date(year, month, day, hours, minutes, 0);
  }

  // Try standard Date parsing
  const parsed = new Date(dateStr.trim());
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

function calculateTimeLeft(targetDateStr?: string): TimeLeft {
  const targetDate = parseAuctionDeadline(targetDateStr);

  if (!targetDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: false,
      isUnspecified: true,
      targetDateObj: null,
    };
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
      isExpired: true,
      isUnspecified: false,
      targetDateObj: targetDate,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
    isExpired: false,
    isUnspecified: false,
    targetDateObj: targetDate,
  };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDateStr,
  variant = 'full',
  title = 'До окончания приема заявок',
  showDetails = true,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDateStr));

  useEffect(() => {
    // Immediate initial calculation
    setTimeLeft(calculateTimeLeft(targetDateStr));

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDateStr));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDateStr]);

  const { days, hours, minutes, seconds, isExpired, isUnspecified, targetDateObj } = timeLeft;

  // Format date display for subtitle
  const formattedTargetDate = targetDateObj
    ? targetDateObj.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }) +
      ' в ' +
      targetDateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) +
      ' МСК'
    : targetDateStr || 'Срок не указан';

  // Determine urgency level
  let urgencyTheme = 'emerald'; // Default safe (> 5 days)
  if (isExpired) {
    urgencyTheme = 'slate';
  } else if (days < 1) {
    urgencyTheme = 'rose'; // Critical (< 24 hours)
  } else if (days < 3) {
    urgencyTheme = 'amber'; // Urgent (< 3 days)
  }

  // --- COMPACT VARIANT ---
  if (variant === 'compact') {
    if (isUnspecified) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap ${className}`}>
          <Clock className="w-3 h-3 text-slate-400" />
          Срок не указан
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0 whitespace-nowrap ${className}`}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Прием завершен
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all shadow-2xs shrink-0 whitespace-nowrap ${
        days < 1
          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse'
          : days < 3
          ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          : 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
      } ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            days < 1 ? 'bg-rose-400' : days < 3 ? 'bg-amber-400' : 'bg-indigo-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            days < 1 ? 'bg-rose-500' : days < 3 ? 'bg-amber-500' : 'bg-indigo-500'
          }`} />
        </span>
        <span>
          Осталось: {days > 0 ? `${days}д ` : ''}{String(hours).padStart(2, '0')}ч {String(minutes).padStart(2, '0')}м {String(seconds).padStart(2, '0')}с
        </span>
      </span>
    );
  }

  // --- MINIMAL BADGE VARIANT ---
  if (variant === 'minimal') {
    if (isUnspecified) {
      return <span className="text-[11px] text-slate-400 font-bold">Срок не указан</span>;
    }
    if (isExpired) {
      return <span className="text-[11px] text-slate-400 font-bold">Срок истек</span>;
    }
    return (
      <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
        {days}д {String(hours).padStart(2, '0')}ч {String(minutes).padStart(2, '0')}м {String(seconds).padStart(2, '0')}с
      </span>
    );
  }

  // --- CARD VARIANT (For Dashboards & Deadline Strips) ---
  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 border border-indigo-500/30 shadow-lg relative overflow-hidden space-y-3 ${className}`}>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
            </span>
            <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Таймер подачи заявок
            </span>
          </div>

          <span className="text-[10px] font-bold bg-white/10 text-slate-200 px-2 py-0.5 rounded-full border border-white/10 truncate max-w-[200px]">
            {formattedTargetDate}
          </span>
        </div>

        {/* Counter Boxes */}
        {isUnspecified ? (
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-center text-slate-300 text-xs font-bold">
            ℹ️ Срок окончания приема заявок не указан в извещении
          </div>
        ) : isExpired ? (
          <div className="p-3 bg-rose-950/60 border border-rose-800/60 rounded-xl text-center text-rose-300 text-xs font-bold">
            ⚠️ Прием заявок официально завершен
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10">
              <div className="text-xl sm:text-2xl font-black font-mono leading-none text-white">{days}</div>
              <div className="text-[9px] uppercase font-bold text-slate-300 mt-1">{getPlural(days, 'день', 'дня', 'дней')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10">
              <div className="text-xl sm:text-2xl font-black font-mono leading-none text-amber-300">{String(hours).padStart(2, '0')}</div>
              <div className="text-[9px] uppercase font-bold text-slate-300 mt-1">{getPlural(hours, 'час', 'часа', 'часов')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10">
              <div className="text-xl sm:text-2xl font-black font-mono leading-none text-indigo-300">{String(minutes).padStart(2, '0')}</div>
              <div className="text-[9px] uppercase font-bold text-slate-300 mt-1">{getPlural(minutes, 'минута', 'минуты', 'минут')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/10 relative overflow-hidden">
              <div className="text-xl sm:text-2xl font-black font-mono leading-none text-emerald-400 animate-pulse">{String(seconds).padStart(2, '0')}</div>
              <div className="text-[9px] uppercase font-bold text-slate-300 mt-1">{getPlural(seconds, 'секунда', 'секунды', 'секунд')}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- FULL HERO VARIANT (For Risk Summary Card) ---
  return (
    <div className={`bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden space-y-4 ${className}`}>
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/80 text-white rounded-2xl shadow-inner border border-indigo-400/30">
            <Clock className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">
                {title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Срок окончания: <strong className="text-white font-bold">{formattedTargetDate}</strong>
            </p>
          </div>
        </div>

        {/* Urgency Badge */}
        <div className="shrink-0">
          {isUnspecified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              Срок не указан
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Прием заявок окончен
            </span>
          ) : days < 1 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-rose-500 text-white shadow-sm animate-bounce">
              <AlertTriangle className="w-4 h-4 text-white" />
              Срочно! Осталось меньше 24 часов
            </span>
          ) : days < 3 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Zap className="w-4 h-4 text-amber-400" />
              Внимание: До окончания менее 3 дней
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Время на подготовку есть
            </span>
          )}
        </div>
      </div>

      {/* Counter Digits */}
      {isUnspecified ? (
        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center text-slate-300 text-xs font-bold">
          ℹ️ Точная дата и время окончания приема заявок не указаны в извещении или документации закупки.
        </div>
      ) : isExpired ? (
        <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl text-center text-slate-300 text-xs font-bold">
          Закупка перешла в стадию работы комиссии / проведения аукциона.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          {/* Days */}
          <div className="bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-center shadow-inner group hover:border-indigo-500/50 transition-all">
            <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight leading-none">
              {days}
            </div>
            <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-2 tracking-wider">
              {getPlural(days, 'день', 'дня', 'дней')}
            </div>
          </div>

          {/* Hours */}
          <div className="bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-center shadow-inner group hover:border-amber-500/50 transition-all">
            <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 tracking-tight leading-none">
              {String(hours).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-2 tracking-wider">
              {getPlural(hours, 'час', 'часа', 'часов')}
            </div>
          </div>

          {/* Minutes */}
          <div className="bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 text-center shadow-inner group hover:border-indigo-500/50 transition-all">
            <div className="text-3xl sm:text-4xl font-black font-mono text-indigo-300 tracking-tight leading-none">
              {String(minutes).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-extrabold text-slate-400 mt-2 tracking-wider">
              {getPlural(minutes, 'минута', 'минуты', 'минут')}
            </div>
          </div>

          {/* Seconds with glowing tick */}
          <div className="bg-slate-800/90 dark:bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-3.5 text-center shadow-inner relative overflow-hidden group">
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight leading-none animate-pulse">
              {String(seconds).padStart(2, '0')}
            </div>
            <div className="text-[10px] uppercase font-extrabold text-emerald-400 mt-2 tracking-wider flex items-center justify-center gap-1">
              <span>{getPlural(seconds, 'секунда', 'секунды', 'секунд')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-note */}
      {showDetails && !isExpired && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 relative z-10 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Автоматическая синхронизация таймера ЕИС в реальном времени
          </span>
          <span className="hidden sm:inline text-slate-500 font-mono">
            {targetDateStr ? `Дата закупки: ${targetDateStr}` : 'Срок рассчитан из ТЗ/извещения'}
          </span>
        </div>
      )}
    </div>
  );
};
