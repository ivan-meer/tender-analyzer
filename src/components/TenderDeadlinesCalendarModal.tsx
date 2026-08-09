import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  ShieldAlert, 
  Tag, 
  Bell, 
  ArrowRight,
  List,
  Grid
} from 'lucide-react';
import { SavedAnalysis, getUserAnalysesFromDb, auth } from '../lib/firebase';
import { AnalysisResult } from '../types';

interface TenderDeadlinesCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis?: (result: AnalysisResult) => void;
  initialAnalyses?: SavedAnalysis[];
}

export interface DeadlineEvent {
  id: string;
  analysisId?: string;
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // DD.MM.YYYY
  eventType: 'AUCTION_BID' | 'DELIVERY_DEADLINE' | 'ANALYSIS_DATE';
  eventTitle: string;
  projectName: string;
  customerName: string;
  procurementSum: string;
  riskScore: number;
  riskLevel: string;
  participationStatus?: string;
  procurementNumber?: string;
  analysisResult?: AnalysisResult;
}

// Russian Month and Day Names
const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAY_NAMES_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * Extracts normalized YYYY-MM-DD date strings from various raw text inputs
 */
function parseDateToISO(dateString?: string | any): string | null {
  if (!dateString) return null;

  // Handle Firestore Timestamp
  if (typeof dateString === 'object' && dateString.seconds) {
    const d = new Date(dateString.seconds * 1000);
    return d.toISOString().split('T')[0];
  }

  const str = String(dateString).trim();

  // Match DD.MM.YYYY or DD.MM.YY
  const dotMatch = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotMatch) {
    const day = dotMatch[1].padStart(2, '0');
    const month = dotMatch[2].padStart(2, '0');
    const year = dotMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match YYYY-MM-DD
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  // Try standard Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Formats YYYY-MM-DD into Russian friendly format "15 августа 2026"
 */
function formatRuFullDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const dayNum = parseInt(d, 10);
  if (monthIdx >= 0 && monthIdx < 12) {
    const monthsGenitive = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${dayNum} ${monthsGenitive[monthIdx]} ${y}`;
  }
  return isoDate;
}

export const TenderDeadlinesCalendarModal: React.FC<TenderDeadlinesCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
  initialAnalyses = [],
}) => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>(initialAnalyses);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'AUCTION' | 'DELIVERY' | 'PARTICIPATING'>('ALL');
  const [activeViewMode, setActiveViewMode] = useState<'CALENDAR' | 'HORIZON_30'>('HORIZON_30');

  // Month Grid state (Default to current month/year)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDayISO, setSelectedDayISO] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Sync / load analyses from Firestore when opened
  useEffect(() => {
    if (!isOpen) return;

    if (initialAnalyses && initialAnalyses.length > 0) {
      setAnalyses(initialAnalyses);
    } else {
      fetchAnalyses();
    }
  }, [isOpen, initialAnalyses]);

  const fetchAnalyses = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const dbItems = await getUserAnalysesFromDb(user.uid);
        setAnalyses(dbItems);
      } else {
        // Fallback demo or local storage items
        setAnalyses(initialAnalyses);
      }
    } catch (err) {
      console.error('Failed to load analyses for calendar:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert analyses into a structured list of DeadlineEvents
  const allEvents = useMemo<DeadlineEvent[]>(() => {
    const events: DeadlineEvent[] = [];

    analyses.forEach((item) => {
      const pTitle = item.projectName || item.title || item.analysisResult?.summary?.procurementTitle || 'Тендер 223-ФЗ';
      const cust = item.customerName || item.analysisResult?.summary?.customerName || 'Заказчик 223-ФЗ';
      const sum = item.procurementSum || item.analysisResult?.summary?.procurementSum || 'По заявке';
      const score = item.riskScore ?? item.analysisResult?.summary?.overallRiskScore ?? 0;
      const level = item.riskLevel || item.analysisResult?.summary?.riskLevel || 'MEDIUM';

      // 1. Auction / Submission deadline date
      const auctionIso = parseDateToISO(item.auctionDate || item.analysisResult?.summary?.auctionDate);
      if (auctionIso) {
        events.push({
          id: `auction_${item.id || Math.random()}`,
          analysisId: item.id,
          dateStr: auctionIso,
          displayDate: auctionIso.split('-').reverse().join('.'),
          eventType: 'AUCTION_BID',
          eventTitle: 'Аукцион / Окончание подачи заявок',
          projectName: pTitle,
          customerName: cust,
          procurementSum: sum,
          riskScore: score,
          riskLevel: level,
          participationStatus: item.participationStatus,
          procurementNumber: item.procurementNumber,
          analysisResult: item.analysisResult,
        });
      }

      // 2. Delivery deadlines from deliveryInfo or productList
      const deliveryPeriodText = item.analysisResult?.deliveryInfo?.deliveryPeriod;
      const deliveryIso = parseDateToISO(deliveryPeriodText);
      if (deliveryIso) {
        events.push({
          id: `deliv_${item.id || Math.random()}`,
          analysisId: item.id,
          dateStr: deliveryIso,
          displayDate: deliveryIso.split('-').reverse().join('.'),
          eventType: 'DELIVERY_DEADLINE',
          eventTitle: 'Предельный срок исполнения договора',
          projectName: pTitle,
          customerName: cust,
          procurementSum: sum,
          riskScore: score,
          riskLevel: level,
          participationStatus: item.participationStatus,
          procurementNumber: item.procurementNumber,
          analysisResult: item.analysisResult,
        });
      }

      // 3. Check individual product deadlines if distinct
      item.analysisResult?.productList?.forEach((prod: any, idx: number) => {
        const prodDeadIso = parseDateToISO(prod.deliveryDeadline);
        if (prodDeadIso && prodDeadIso !== deliveryIso && prodDeadIso !== auctionIso) {
          events.push({
            id: `prod_deliv_${item.id || Math.random()}_${idx}`,
            analysisId: item.id,
            dateStr: prodDeadIso,
            displayDate: prodDeadIso.split('-').reverse().join('.'),
            eventType: 'DELIVERY_DEADLINE',
            eventTitle: `Поставка позиции: ${prod.name}`,
            projectName: pTitle,
            customerName: cust,
            procurementSum: sum,
            riskScore: score,
            riskLevel: level,
            participationStatus: item.participationStatus,
            procurementNumber: item.procurementNumber,
            analysisResult: item.analysisResult,
          });
        }
      });

      // If no auction date was extracted, fallback to createdAt + 10 days for estimation
      if (!auctionIso && !deliveryIso && item.createdAt) {
        const createdIso = parseDateToISO(item.createdAt);
        if (createdIso) {
          events.push({
            id: `created_${item.id || Math.random()}`,
            analysisId: item.id,
            dateStr: createdIso,
            displayDate: createdIso.split('-').reverse().join('.'),
            eventType: 'ANALYSIS_DATE',
            eventTitle: 'Дата проведённого анализа',
            projectName: pTitle,
            customerName: cust,
            procurementSum: sum,
            riskScore: score,
            riskLevel: level,
            participationStatus: item.participationStatus,
            procurementNumber: item.procurementNumber,
            analysisResult: item.analysisResult,
          });
        }
      }
    });

    return events;
  }, [analyses]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Search
      const matchSearch =
        !searchQuery ||
        ev.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ev.procurementNumber && ev.procurementNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      // Filter
      if (filterType === 'AUCTION') return ev.eventType === 'AUCTION_BID';
      if (filterType === 'DELIVERY') return ev.eventType === 'DELIVERY_DEADLINE';
      if (filterType === 'PARTICIPATING') return ev.participationStatus === 'PARTICIPATING';

      return true;
    });
  }, [allEvents, searchQuery, filterType]);

  // Next 30 Days Deadlines Timeline (Month Ahead)
  const next30DaysEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    thirtyDaysLater.setHours(23, 59, 59, 999);

    return filteredEvents
      .filter((ev) => {
        const evDate = new Date(ev.dateStr);
        return evDate >= today && evDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
  }, [filteredEvents]);

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  // Convert to Monday = 0
  const startOffset = (firstDayOfWeek + 6) % 7;

  const calendarDays = useMemo(() => {
    const days: Array<{ dayNum: number; isoStr: string; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const pDay = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, pDay);
      days.push({
        dayNum: pDay,
        isoStr: prevDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cDate = new Date(year, month, d);
      // Ensure local timezone ISO
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        isoStr: iso,
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(year, month + 1, n);
      days.push({
        dayNum: n,
        isoStr: nextDate.toISOString().split('T')[0],
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, startOffset, daysInMonth]);

  // Events grouped by date YYYY-MM-DD
  const eventsByDateMap = useMemo(() => {
    const map: Record<string, DeadlineEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.dateStr]) map[ev.dateStr] = [];
      map[ev.dateStr].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Events on the currently selected day
  const selectedDayEvents = useMemo(() => {
    return eventsByDateMap[selectedDayISO] || [];
  }, [eventsByDateMap, selectedDayISO]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayMonth = () => {
    const t = new Date();
    setCurrentDate(t);
    setSelectedDayISO(t.toISOString().split('T')[0]);
  };

  // Export iCal / ICS Calendar File
  const handleExportIcs = (eventItem?: DeadlineEvent) => {
    const itemsToExport = eventItem ? [eventItem] : next30DaysEvents;
    if (itemsToExport.length === 0) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//223-FZ Procurement AI Analyzer//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ].join('\r\n');

    itemsToExport.forEach((ev) => {
      const dateFormatted = ev.dateStr.replace(/-/g, '');
      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:tender-deadline-${ev.id}@223fz-ai`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${dateFormatted}`,
        `DTEND;VALUE=DATE:${dateFormatted}`,
        `SUMMARY:[223-ФЗ] ${ev.eventTitle}: ${ev.projectName}`,
        `DESCRIPTION:Заказчик: ${ev.customerName}\\nНМЦК: ${ev.procurementSum}\\nИндекс риска: ${ev.riskScore}/100 (${ev.riskLevel})`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = eventItem
      ? `Дедлайн_223_ФЗ_${eventItem.dateStr}.ics`
      : `Дедлайны_223_ФЗ_на_30_дней_${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-indigo-600/90 text-white rounded-2xl shadow-lg shadow-indigo-600/30 shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-xl tracking-tight text-white truncate">
                  Календарь Сроков & Дедлайнов 223-ФЗ
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Firestore Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                Мониторинг окончаний подачи заявок, аукционов и графиков поставки по сохраненным закупкам
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchAnalyses}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
              title="Обновить данные из Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          
          {/* Main View Mode Selector */}
          <div className="p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl flex items-center gap-1 self-start md:self-auto">
            <button
              onClick={() => setActiveViewMode('HORIZON_30')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeViewMode === 'HORIZON_30'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Дедлайны на 30 дней вперед ({next30DaysEvents.length})</span>
            </button>
            <button
              onClick={() => setActiveViewMode('CALENDAR')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeViewMode === 'CALENDAR'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Сетка месяца</span>
            </button>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Search */}
            <div className="relative min-w-[180px] sm:min-w-[220px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Поиск по названию или заказчику..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Все события ({allEvents.length})</option>
              <option value="AUCTION">Подача заявок / Аукцион</option>
              <option value="DELIVERY">Сроки поставки</option>
              <option value="PARTICIPATING">Только с участием (PARTICIPATING)</option>
            </select>

            {/* Export iCal */}
            <button
              onClick={() => handleExportIcs()}
              disabled={next30DaysEvents.length === 0}
              className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Скачать все ближайшие дедлайны в формате .ics для Google / Outlook Календаря"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Экспорт .ics</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* VIEW MODE 1: HORIZON 30 DAYS (MONTH AHEAD TRACKER) */}
          {activeViewMode === 'HORIZON_30' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Оперативный горизонт дедлайнов (30 дней)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Отслеживание контрольных точек с {formatRuFullDate(todayISO)} по {formatRuFullDate(
                        new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {next30DaysEvents.length} ближайших дедлайнов
                  </span>
                </div>
              </div>

              {next30DaysEvents.length === 0 ? (
                <div className="text-center py-16 space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                  <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                    Нет активных дедлайнов на ближайшие 30 дней
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    В сохраненных анализах закупках нет дат окончания подачи или поставки, попадающих в диапазон следующих 30 дней.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {next30DaysEvents.map((ev) => {
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    const evDate = new Date(ev.dateStr);
                    const diffDays = Math.ceil((evDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

                    let relativeBadgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
                    let relativeText = `Через ${diffDays} дн.`;

                    if (diffDays === 0) {
                      relativeBadgeBg = 'bg-rose-500 text-white border-rose-600 animate-pulse';
                      relativeText = 'СЕГОДНЯ!';
                    } else if (diffDays === 1) {
                      relativeBadgeBg = 'bg-amber-500 text-white border-amber-600';
                      relativeText = 'ЗАВТРА';
                    } else if (diffDays <= 3) {
                      relativeBadgeBg = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
                      relativeText = `Через ${diffDays} дня`;
                    } else if (diffDays <= 7) {
                      relativeBadgeBg = 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200';
                      relativeText = `Через ${diffDays} дней`;
                    }

                    const isAuction = ev.eventType === 'AUCTION_BID';
                    const isParticipating = ev.participationStatus === 'PARTICIPATING';

                    return (
                      <div
                        key={ev.id}
                        className={`bg-white dark:bg-slate-800/90 border ${
                          isParticipating
                            ? 'border-indigo-500 ring-1 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-700/80 hover:border-indigo-400'
                        } rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                      >
                        {/* Date & Countdown Block */}
                        <div className="flex items-center gap-3.5 shrink-0">
                          <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center min-w-[70px] border border-slate-200 dark:border-slate-800">
                            <span className="block text-[10px] font-black uppercase text-slate-400">
                              {ev.dateStr.split('-')[1]}.{ev.dateStr.split('-')[0]}
                            </span>
                            <span className="block text-xl font-black text-slate-900 dark:text-white leading-tight">
                              {ev.dateStr.split('-')[2]}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${relativeBadgeBg}`}>
                              {relativeText}
                            </span>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                              {formatRuFullDate(ev.dateStr)}
                            </div>
                          </div>
                        </div>

                        {/* Tender Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isAuction 
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {ev.eventTitle}
                            </span>

                            {isParticipating && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white">
                                Участвуем
                              </span>
                            )}

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              ev.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                              ev.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              Риск: {ev.riskScore}/100
                            </span>
                          </div>

                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                            {ev.projectName}
                          </h4>

                          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span><b>Заказчик:</b> {ev.customerName}</span>
                            <span>•</span>
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400"><b>НМЦК:</b> {ev.procurementSum}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            onClick={() => handleExportIcs(ev)}
                            className="p-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            title="Экспорт в .ics календарь"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {ev.analysisResult && onSelectAnalysis && (
                            <button
                              onClick={() => {
                                onSelectAnalysis(ev.analysisResult!);
                                onClose();
                              }}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <span>Открыть</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: MONTH GRID CALENDAR */}
          {activeViewMode === 'CALENDAR' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Calendar Grid (8 cols) */}
              <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 space-y-4">
                
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                      {MONTH_NAMES_RU[month]} {year}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {allEvents.length} событий зарегистрировано
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleTodayMonth}
                      className="px-2.5 py-1 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Сегодня
                    </button>
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Labels Header */}
                <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-400 uppercase py-1">
                  {WEEKDAY_NAMES_RU.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((cell, idx) => {
                    const dayEvents = eventsByDateMap[cell.isoStr] || [];
                    const isToday = cell.isoStr === todayISO;
                    const isSelected = cell.isoStr === selectedDayISO;

                    const hasAuction = dayEvents.some((e) => e.eventType === 'AUCTION_BID');
                    const hasDelivery = dayEvents.some((e) => e.eventType === 'DELIVERY_DEADLINE');
                    const hasCritical = dayEvents.some((e) => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH');

                    return (
                      <div
                        key={cell.isoStr + '_' + idx}
                        onClick={() => setSelectedDayISO(cell.isoStr)}
                        className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                          !cell.isCurrentMonth
                            ? 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-400 border-transparent opacity-60'
                            : isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/30'
                            : isToday
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-slate-900 dark:text-white font-extrabold'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{cell.dayNum}</span>
                          {isToday && (
                            <span className={`text-[8px] px-1 py-0.2 rounded font-black uppercase ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'
                            }`}>
                              Сегодня
                            </span>
                          )}
                        </div>

                        {/* Event Dots & Counters */}
                        {dayEvents.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              {hasCritical && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Критический риск" />
                              )}
                              {hasAuction && (
                                <span className="w-2 h-2 rounded-full bg-indigo-500" title="Аукцион / Подача" />
                              )}
                              {hasDelivery && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Срок поставки" />
                              )}
                            </div>

                            <div className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md truncate ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              {dayEvents.length} {dayEvents.length === 1 ? 'соб.' : 'события'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    Подача заявок / Аукцион
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Срок исполнения поставки
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    Высокий / Критический риск
                  </span>
                </div>
              </div>

              {/* Right Column: Selected Day Agenda & Inspector (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
                
                <div>
                  {/* Selected Day Header */}
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        ПОВЕСТКА ДНЯ
                      </span>
                      <h4 className="font-black text-base text-slate-900 dark:text-white">
                        {formatRuFullDate(selectedDayISO)}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black">
                      {selectedDayEvents.length} собит.
                    </span>
                  </div>

                  {/* Day Events List */}
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-12 space-y-2 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                      <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-medium">На выбранный день нет запланированных сроков.</p>
                      <p className="text-[11px] text-slate-400">Выберите другой день на календарной сетке слева.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {selectedDayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md font-bold text-[10px]">
                              {ev.eventTitle}
                            </span>
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                              {ev.procurementSum}
                            </span>
                          </div>

                          <h5 className="font-bold text-slate-900 dark:text-white leading-snug">
                            {ev.projectName}
                          </h5>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            <b>Заказчик:</b> {ev.customerName}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800">
                            <button
                              onClick={() => handleExportIcs(ev)}
                              className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Экспорт .ics</span>
                            </button>

                            {ev.analysisResult && onSelectAnalysis && (
                              <button
                                onClick={() => {
                                  onSelectAnalysis(ev.analysisResult!);
                                  onClose();
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                Открыть анализ
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Box */}
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Автоматическая синхронизация с Firestore</span>
                  </div>
                  <p className="leading-normal">
                    Все даты извлекаются из результатов работы ИИ-Анализатора (поля аукциона, графика поставки и ТЗ) и обновляются при каждом заведении новой закупки.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
