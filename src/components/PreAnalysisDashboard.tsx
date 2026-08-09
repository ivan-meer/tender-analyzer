import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Layers, 
  Calendar, 
  ShieldCheck,
  Coins,
  Sparkles,
  ArrowUpRight,
  Clock,
  FileCheck2,
  Award,
  Trash2,
  Search,
  CheckCircle2,
  Trophy,
  XCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
  Undo2,
  Check,
  BarChart3
} from 'lucide-react';
import { 
  auth, 
  getUserAnalysesFromDb, 
  getUserCustomersFromDb, 
  deleteAnalysisFromDb, 
  updateAnalysisInDb,
  SavedAnalysis, 
  SavedCustomer,
  TenderParticipationStatus
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CountdownTimer } from './CountdownTimer';

interface PreAnalysisDashboardProps {
  onOpenHistory?: () => void;
  onSelectAnalysis?: (analysisResult: any) => void;
}

// Initial default sample procurements for rich demo dashboard
const DEFAULT_SAMPLE_ANALYSES: SavedAnalysis[] = [
  {
    id: 'sample-1',
    userId: 'demo',
    userEmail: 'demo@zakupki223.ru',
    title: 'Поставка офисной мебели и кресел для филиальной сети',
    projectName: 'Поставка офисной мебели и кресел для филиальной сети',
    customerName: 'ГУП «Мосгортранс»',
    procurementSum: '14 200 000 ₽',
    auctionDate: '15.08.2026',
    procurementNumber: '32412345678',
    status: 'На рассмотрении',
    participationStatus: 'PARTICIPATING',
    riskScore: 35,
    riskLevel: 'LOW',
    createdAt: new Date().toISOString(),
    analysisResult: {
      summary: {
        projectName: 'Поставка офисной мебели и кресел по 223-ФЗ',
        customerName: 'ГУП «Мосгортранс»',
        procurementSum: '14 200 000 ₽',
        auctionDate: '15.08.2026',
        procurementNumber: '32412345678',
        procurementTitle: 'Поставка офисной мебели и эргономичных кресел',
        overallRiskScore: 35,
        riskLevel: 'LOW'
      }
    }
  },
  {
    id: 'sample-2',
    userId: 'demo',
    userEmail: 'demo@zakupki223.ru',
    title: 'Серверное оборудование, системы хранения данных и ИБП',
    projectName: 'Серверное оборудование, системы хранения данных и ИБП',
    customerName: 'ПАО «Россети»',
    procurementSum: '45 000 000 ₽',
    auctionDate: '22.08.2026',
    procurementNumber: '32498765432',
    status: 'Заявка подана',
    participationStatus: 'SUBMITTED',
    riskScore: 68,
    riskLevel: 'MEDIUM',
    createdAt: new Date().toISOString(),
    analysisResult: {
      summary: {
        projectName: 'Серверное оборудование и СХД по 223-ФЗ',
        customerName: 'ПАО «Россети»',
        procurementSum: '45 000 000 ₽',
        auctionDate: '22.08.2026',
        procurementNumber: '32498765432',
        procurementTitle: 'Серверное оборудование и СХД',
        overallRiskScore: 68,
        riskLevel: 'MEDIUM'
      }
    }
  },
  {
    id: 'sample-3',
    userId: 'demo',
    userEmail: 'demo@zakupki223.ru',
    title: 'Выполнение работ по капитальному ремонту фасада',
    projectName: 'Выполнение работ по капитальному ремонту фасада',
    customerName: 'АО «Атомэнергопром»',
    procurementSum: '8 900 000 ₽',
    auctionDate: '28.08.2026',
    procurementNumber: '017310000452400012',
    status: 'Победа',
    participationStatus: 'WON',
    riskScore: 20,
    riskLevel: 'LOW',
    createdAt: new Date().toISOString(),
    analysisResult: {
      summary: {
        projectName: 'Капитальный ремонт фасада здания по 44-ФЗ',
        customerName: 'АО «Атомэнергопром»',
        procurementSum: '8 900 000 ₽',
        auctionDate: '28.08.2026',
        procurementNumber: '017310000452400012',
        procurementTitle: 'Капитальный ремонт фасада',
        overallRiskScore: 20,
        riskLevel: 'LOW'
      }
    }
  }
];

const LOCAL_DELETED_KEY = 'zakupki_deleted_tender_ids';

export const PreAnalysisDashboard: React.FC<PreAnalysisDashboardProps> = ({ 
  onSelectAnalysis 
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'summary' | 'applications' | 'customers' | 'deadlines'>('summary');
  const [isLoading, setIsLoading] = useState(true);
  
  // Action Progress & Notification States
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'deleted'; lastDeletedItem?: SavedAnalysis } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Load deleted IDs from localStorage
  const getDeletedIds = (): string[] => {
    try {
      const stored = localStorage.getItem(LOCAL_DELETED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const addDeletedId = (id: string) => {
    try {
      const current = getDeletedIds();
      if (!current.includes(id)) {
        const updated = [...current, id];
        localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  const removeDeletedId = (id: string) => {
    try {
      const current = getDeletedIds();
      const updated = current.filter(i => i !== id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage update error:', e);
    }
  };

  // Auth Listener & Data Fetching
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      loadDashboardData(user);
    });
    return () => unsub();
  }, []);

  const loadDashboardData = async (user: User | null) => {
    setIsLoading(true);
    const deletedIds = getDeletedIds();

    try {
      if (user) {
        const [dbAnalyses, dbCustomers] = await Promise.all([
          getUserAnalysesFromDb(user.uid),
          getUserCustomersFromDb(user.uid)
        ]);

        const filteredDb = dbAnalyses.filter(a => a.id && !deletedIds.includes(a.id));
        
        // If user has no DB analyses yet, fallback to default sample items (filtering out deleted)
        if (filteredDb.length === 0) {
          const filteredSamples = DEFAULT_SAMPLE_ANALYSES.filter(s => s.id && !deletedIds.includes(s.id));
          setAnalyses(filteredSamples);
        } else {
          setAnalyses(filteredDb);
        }
        setCustomers(dbCustomers);
      } else {
        // Guest user: use sample items minus deleted ones
        const filteredSamples = DEFAULT_SAMPLE_ANALYSES.filter(s => s.id && !deletedIds.includes(s.id));
        setAnalyses(filteredSamples);
        setCustomers([]);
      }
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
      const filteredSamples = DEFAULT_SAMPLE_ANALYSES.filter(s => s.id && !deletedIds.includes(s.id));
      setAnalyses(filteredSamples);
    } finally {
      setIsLoading(false);
    }
  };

  // Toast Notification Auto-Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // DELETE TENDER HANDLER WITH VISUAL PROGRESS & UNDO
  const handleDeleteTender = async (id: string | undefined, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id) return;

    const itemToDelete = analyses.find(a => a.id === id);
    if (!itemToDelete) return;

    // Immediate Optimistic UI Removal & LocalStorage persisting (No window.confirm to avoid iframe sandbox block)
    setDeletingIds(prev => new Set(prev).add(id));
    setAnalyses(prev => prev.filter(item => item.id !== id));
    addDeletedId(id);

    // Firestore sync if logged in and not sample ID
    if (currentUser && !id.startsWith('sample-')) {
      try {
        await deleteAnalysisFromDb(id);
      } catch (err) {
        console.error('Firestore deletion error:', err);
      }
    }

    setDeletingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    // Display Action Confirmation Toast with Restore option
    setToastMessage({
      text: `Закупка «${(itemToDelete.title || itemToDelete.projectName || '').slice(0, 35)}...» удалена`,
      type: 'deleted',
      lastDeletedItem: itemToDelete
    });
  };

  // UNDO DELETION HANDLER
  const handleUndoDelete = () => {
    if (!toastMessage?.lastDeletedItem) return;
    const restored = toastMessage.lastDeletedItem;
    if (!restored.id) return;

    removeDeletedId(restored.id);
    setAnalyses(prev => [restored, ...prev]);
    setToastMessage({
      text: 'Закупка успешно восстановлена в систему',
      type: 'success'
    });
  };

  // UPDATE PARTICIPATION STATUS WITH VISUAL PROGRESS
  const handleUpdateStatus = async (id: string | undefined, newStatus: TenderParticipationStatus, e?: React.ChangeEvent<HTMLSelectElement>) => {
    if (e) e.stopPropagation();
    if (!id) return;

    setUpdatingIds(prev => new Set(prev).add(id));

    // Optimistic UI state update
    setAnalyses(prev => prev.map(a => a.id === id ? { ...a, participationStatus: newStatus } : a));

    if (currentUser && !id.startsWith('sample-')) {
      try {
        await updateAnalysisInDb(id, { participationStatus: newStatus });
      } catch (err) {
        console.error('Status update error:', err);
      }
    }

    setTimeout(() => {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);

    const statusNames: Record<string, string> = {
      NEW: 'Новый анализ',
      PARTICIPATING: 'В работе (Участвуем)',
      SUBMITTED: 'Заявка подана',
      WON: 'Победа (Выигран)',
      REJECTED: 'Отклонен',
      ARCHIVED: 'В архиве'
    };

    setToastMessage({
      text: `Статус закупки сохранен: «${statusNames[newStatus] || newStatus}»`,
      type: 'info'
    });
  };

  // Calculated Metrics & Pipeline Breakdown
  const totalCount = analyses.length;
  const countWon = analyses.filter(a => a.participationStatus === 'WON').length;
  const countParticipating = analyses.filter(a => a.participationStatus === 'PARTICIPATING').length;
  const countSubmitted = analyses.filter(a => a.participationStatus === 'SUBMITTED').length;
  const countNew = analyses.filter(a => !a.participationStatus || a.participationStatus === 'NEW').length;

  const topCustomers = React.useMemo(() => {
    if (customers.length > 0) {
      return [...customers]
        .sort((a, b) => (b.tendersCount || 0) - (a.tendersCount || 0))
        .slice(0, 5);
    }
    return [
      { id: 'c1', name: 'ГУП «Мосгортранс»', tendersCount: 5, totalProcurementSum: '45 000 000 ₽' },
      { id: 'c2', name: 'ПАО «Россети»', tendersCount: 3, totalProcurementSum: '28 500 000 ₽' },
      { id: 'c3', name: 'АО «Атомэнергопром»', tendersCount: 2, totalProcurementSum: '12 000 000 ₽' }
    ];
  }, [customers]);

  const totalSumCurrentMonth = React.useMemo(() => {
    let numericSum = 0;
    if (analyses.length > 0) {
      analyses.forEach(item => {
        const sumStr = item.procurementSum || item.analysisResult?.summary?.procurementSum || '';
        const digits = sumStr.replace(/[^\d]/g, '');
        if (digits) {
          numericSum += parseInt(digits, 10);
        }
      });
    }
    if (numericSum > 0) {
      return new Intl.NumberFormat('ru-RU').format(numericSum) + ' ₽';
    }
    return '68 100 000 ₽';
  }, [analyses]);

  const upcomingDeadlines = React.useMemo(() => {
    return analyses.map(a => ({
      id: a.id,
      title: a.projectName || a.title || 'Закупка',
      customer: a.customerName || 'Заказчик',
      dateStr: a.auctionDate || a.analysisResult?.summary?.auctionDate || '15.08.2026',
      sum: a.procurementSum || 'По заявке',
      status: a.participationStatus || 'NEW',
      rawItem: a
    }));
  }, [analyses]);

  const filteredApplications = React.useMemo(() => {
    return analyses.filter(item => {
      const matchSearch = 
        (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.projectName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = 
        statusFilter === 'ALL' || 
        item.participationStatus === statusFilter ||
        (statusFilter === 'NEW' && (!item.participationStatus || item.participationStatus === 'NEW'));

      return matchSearch && matchStatus;
    });
  }, [analyses, searchQuery, statusFilter]);

  const currentMonthName = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const getStatusBadge = (status?: TenderParticipationStatus) => {
    switch (status) {
      case 'WON':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white flex items-center gap-1 shadow-2xs"><Trophy className="w-3 h-3" /> Победа</span>;
      case 'PARTICIPATING':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1 shadow-2xs"><Clock className="w-3 h-3" /> В работе</span>;
      case 'SUBMITTED':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white flex items-center gap-1 shadow-2xs"><CheckCircle2 className="w-3 h-3" /> Заявка подана</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow-2xs"><XCircle className="w-3 h-3" /> Отклонен</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Новый анализ</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs transition-colors space-y-4 relative">
      
      {/* ACTION CONFIRMATION TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 text-xs font-bold animate-fade-in max-w-md">
          <div className="p-1.5 bg-emerald-500 text-white rounded-xl shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="line-clamp-2">{toastMessage.text}</p>
          </div>
          {toastMessage.type === 'deleted' && toastMessage.lastDeletedItem && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              <Undo2 className="w-3 h-3" />
              <span>Отменить</span>
            </button>
          )}
        </div>
      )}

      {/* Header Bar & Main Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-sm shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span className="truncate">Дашборд закупок & Управление базой</span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shrink-0">
                44-ФЗ / 223-ФЗ
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Центр аналитики, реестра заявок, заказчиков и дедлайнов
            </p>
          </div>
        </div>

        {/* TOP SUB-NAVIGATION TABS */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setDashboardTab('summary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              dashboardTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Сводка</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardTab('applications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              dashboardTab === 'applications'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Заявки ({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardTab('customers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              dashboardTab === 'customers'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Заказчики ({topCustomers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDashboardTab('deadlines')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap min-h-[36px] ${
              dashboardTab === 'deadlines'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Дедлайны ({upcomingDeadlines.length})</span>
          </button>
        </div>
      </div>

      {/* PIPELINE PROGRESS BAR VISUALIZER */}
      {totalCount > 0 && (
        <div className="bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Воронка статусов участия в закупках:</span>
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {countWon} побед из {totalCount} анализов
            </span>
          </div>

          {/* Visual Multi-Color Progress Segment */}
          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${(countWon / totalCount) * 100}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
              title={`Победы: ${countWon}`} 
            />
            <div 
              style={{ width: `${(countSubmitted / totalCount) * 100}%` }} 
              className="bg-indigo-600 h-full transition-all duration-500" 
              title={`Заявка подана: ${countSubmitted}`} 
            />
            <div 
              style={{ width: `${(countParticipating / totalCount) * 100}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`В работе: ${countParticipating}`} 
            />
            <div 
              style={{ width: `${(countNew / totalCount) * 100}%` }} 
              className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-500" 
              title={`Новые: ${countNew}`} 
            />
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Победы ({countWon})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Подана ({countSubmitted})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> В работе ({countParticipating})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Новые ({countNew})</span>
          </div>
        </div>
      )}

      {/* TAB 1: SUMMARY (METRICS + DEADLINES STRIP) */}
      {dashboardTab === 'summary' && (
        <div className="space-y-4 animate-fade-in">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Metric 1 */}
            <div 
              onClick={() => setDashboardTab('applications')}
              className="group relative bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  Всего проверок
                </span>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform shadow-2xs border border-indigo-200/50 dark:border-indigo-800/50">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>

              <div className="pt-3 relative z-10">
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2">
                  <span>{totalCount}</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">закупок</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Проиндексировано с картами рисков</span>
                </p>
              </div>
            </div>

            {/* Metric 2 */}
            <div 
              onClick={() => setDashboardTab('customers')}
              className="group relative bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  Ключевые заказчики
                </span>
                <div className="p-2 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform shadow-2xs border border-amber-200/50 dark:border-amber-800/50">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5 pt-2 relative z-10">
                {topCustomers.slice(0, 3).map((cust, idx) => (
                  <div key={cust.id || idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={cust.name}>
                      {idx + 1}. {cust.name}
                    </span>
                    <span className="font-mono text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/80 shrink-0">
                      {cust.tendersCount || 1} тенд.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric 3 */}
            <div 
              onClick={() => setDashboardTab('applications')}
              className="group relative bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-500" />
                  Объем НМЦК ({currentMonthName})
                </span>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform shadow-2xs border border-emerald-200/50 dark:border-emerald-800/50">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="pt-3 relative z-10">
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {totalSumCurrentMonth}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Совокупная сумма обработанных смет</span>
                </p>
              </div>
            </div>
          </div>

          {/* Deadlines Calendar Strip */}
          <div className="bg-slate-50/60 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Календарь ближайших дедлайнов
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDashboardTab('deadlines')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Открыть полный календарь</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">
                Нет запланированных дедлайнов. Добавьте закупки через форму загрузки.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {upcomingDeadlines.slice(0, 6).map((dl) => (
                  <div
                    key={dl.id}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-3.5 rounded-xl flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500 transition-all space-y-2.5 shadow-2xs relative group min-w-0"
                  >
                    {/* Header: Title + Trash delete button */}
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <span 
                        onClick={() => dl.rawItem && onSelectAnalysis?.(dl.rawItem.analysisResult)}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer flex-1 min-w-0 leading-snug" 
                        title={dl.title}
                      >
                        {dl.title}
                      </span>

                      {/* TRASH DELETE BUTTON WITH SPINNER STATE */}
                      <button
                        type="button"
                        disabled={deletingIds.has(dl.id!)}
                        onClick={(e) => handleDeleteTender(dl.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Удалить закупку из системы"
                      >
                        {deletingIds.has(dl.id!) ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Middle: Live Countdown Timer & Date Pill */}
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <CountdownTimer targetDateStr={dl.dateStr} variant="compact" />
                      {dl.dateStr && dl.dateStr !== 'Не указана' && dl.dateStr !== 'Не указано' && !dl.dateStr.toLowerCase().includes('не указ') && (
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0 whitespace-nowrap">
                          {dl.dateStr}
                        </span>
                      )}
                    </div>

                    {/* Footer: Customer & Sum */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1.5 border-t border-slate-100 dark:border-slate-700/60 min-w-0">
                      <span className="truncate flex-1 min-w-0 pr-2">{dl.customer}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono shrink-0">{dl.sum}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS REGISTRY (ЗАЯВКИ & АНАЛИЗЫ) */}
      {dashboardTab === 'applications' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию закупки, номеру или заказчику..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0">
              {['ALL', 'NEW', 'PARTICIPATING', 'SUBMITTED', 'WON', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap min-h-[32px] ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' && 'Все'}
                  {st === 'NEW' && 'Новые'}
                  {st === 'PARTICIPATING' && 'В работе'}
                  {st === 'SUBMITTED' && 'Подана'}
                  {st === 'WON' && 'Победа'}
                  {st === 'REJECTED' && 'Отклонен'}
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Закупки не найдены</p>
              <p className="text-[11px] text-slate-400">Загрузите документацию для проведения первого анализа закупки</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {getStatusBadge(app.participationStatus)}
                      <CountdownTimer targetDateStr={app.auctionDate} variant="compact" />
                      {app.auctionDate && !app.auctionDate.toLowerCase().includes('не указ') && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
                          Дедлайн: {app.auctionDate}
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0 truncate max-w-[160px]">
                        {app.procurementNumber || '№ закупки'}
                      </span>
                    </div>

                    <h4 
                      onClick={() => app.analysisResult && onSelectAnalysis?.(app.analysisResult)}
                      className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      {app.title || app.projectName}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {app.customerName || 'Заказчик'}
                      </span>
                      <span>•</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {app.procurementSum || 'Сумма не указана'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown & TRASH DELETE BUTTON */}
                  <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0 justify-between sm:justify-end">
                    <div className="relative">
                      <select
                        value={app.participationStatus || 'NEW'}
                        disabled={updatingIds.has(app.id!)}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value as TenderParticipationStatus, e)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer min-h-[36px]"
                      >
                        <option value="NEW">Новый анализ</option>
                        <option value="PARTICIPATING">В работе (Участвуем)</option>
                        <option value="SUBMITTED">Заявка подана</option>
                        <option value="WON">Победа (Выигран)</option>
                        <option value="REJECTED">Отклонен</option>
                        <option value="ARCHIVED">Архив</option>
                      </select>
                      {updatingIds.has(app.id!) && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => app.analysisResult && onSelectAnalysis?.(app.analysisResult)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1 shadow-2xs"
                    >
                      <span>Отчет</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* TRASH DELETE BUTTON WITH SPINNER STATE */}
                    <button
                      type="button"
                      disabled={deletingIds.has(app.id!)}
                      onClick={(e) => handleDeleteTender(app.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
                      title="Удалить закупку из системы"
                    >
                      {deletingIds.has(app.id!) ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMERS & ORGANIZERS */}
      {dashboardTab === 'customers' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topCustomers.map((cust, idx) => (
              <div
                key={cust.id || idx}
                className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1" title={cust.name}>
                        {cust.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {cust.inn ? `ИНН: ${cust.inn}` : 'Организатор закупки'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Закупок</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">{cust.tendersCount || 1} тендеров</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Общий бюджет</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-[11px] truncate block">
                      {cust.totalProcurementSum || '15 000 000 ₽'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(cust.name);
                    setDashboardTab('applications');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-slate-700 dark:hover:bg-amber-500 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Показать закупки заказчика</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEADLINES CALENDAR PAGE */}
      {dashboardTab === 'deadlines' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Календарь временных меток дедлайнов и аукционов с быстрым удалением и отслеживанием</span>
            </div>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              В календаре нет активных дедлайнов.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingDeadlines.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-indigo-400 transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2.5 bg-indigo-600 text-white font-mono text-xs font-black rounded-2xl text-center shrink-0 shadow-2xs">
                      <Clock className="w-4 h-4 mb-0.5 mx-auto" />
                      <span>{item.dateStr.slice(0, 5)}</span>
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {item.dateStr && !item.dateStr.toLowerCase().includes('не указ') && (
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-extrabold rounded-md shrink-0">
                            Дедлайн: {item.dateStr}
                          </span>
                        )}
                        <CountdownTimer targetDateStr={item.dateStr} variant="compact" />
                        {getStatusBadge(item.status as TenderParticipationStatus)}
                      </div>

                      <h4 
                        onClick={() => item.rawItem && onSelectAnalysis?.(item.rawItem.analysisResult)}
                        className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                      >
                        {item.title}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Заказчик: <strong className="text-slate-700 dark:text-slate-200">{item.customer}</strong> | НМЦК: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{item.sum}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 border-slate-200 dark:border-slate-700 pt-2 sm:pt-0">
                    {item.rawItem && (
                      <button
                        type="button"
                        onClick={() => onSelectAnalysis?.(item.rawItem.analysisResult)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs min-h-[36px]"
                      >
                        <span>Открыть отчет</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* TRASH DELETE BUTTON WITH SPINNER STATE */}
                    <button
                      type="button"
                      disabled={deletingIds.has(item.id!)}
                      onClick={(e) => handleDeleteTender(item.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center border border-slate-200/60 dark:border-slate-700/60"
                      title="Удалить закупку из системы"
                    >
                      {deletingIds.has(item.id!) ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
