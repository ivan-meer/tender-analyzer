import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  getUserAnalysesFromDb, 
  getUserCustomersFromDb,
  saveAnalysisToDb, 
  deleteAnalysisFromDb, 
  deleteCustomerFromDb,
  deleteSelectedAnalysesFromDb,
  deleteAllUserAnalysesFromDb,
  toggleFavoriteAnalysisInDb, 
  updateAnalysisInDb,
  SavedAnalysis,
  SavedCustomer,
  TenderParticipationStatus
} from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { 
  History, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Star, 
  Trash2, 
  X, 
  Edit3, 
  Sparkles, 
  Plus, 
  RefreshCw,
  FolderOpen,
  Search,
  ArrowRight,
  Building2,
  Calendar,
  Save,
  Layers,
  CheckCircle2,
  Filter,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Trophy,
  Clock,
  XCircle,
  Tag as TagIcon,
  ArrowRightLeft,
  List,
  FolderTree,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { TenderCompareModal } from './TenderCompareModal';
import { generateBatchSummaryPdfReport } from '../utils/pdfGenerator';

interface AuthAndHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAnalysisResult: any | null;
  onSelectAnalysis: (analysisResult: any) => void;
  onOpenCalendar?: () => void;
}

const PRESET_TAGS = ['Срочно', 'Малый объем', 'Строительство', 'Оборудование', 'ПП 1875', 'СИЗ', 'ИТ / Софт'];

export const AuthAndHistoryDrawer: React.FC<AuthAndHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentAnalysisResult,
  onSelectAnalysis,
  onOpenCalendar,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tenders' | 'customers'>('tenders');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string | null>(null);

  // Grouping & Tags & Compare & Batch Selection state
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [selectedTenderIds, setSelectedTenderIds] = useState<string[]>([]);
  const [isGeneratingBatchPdf, setIsGeneratingBatchPdf] = useState<boolean>(false);

  const handleToggleSelectTender = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTenderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllTenders = () => {
    const allIds = filteredAnalyses.map((a) => a.id!).filter(Boolean);
    setSelectedTenderIds(allIds);
  };

  const handleDeselectAllTenders = () => {
    setSelectedTenderIds([]);
  };

  const handleGenerateBatchReport = async () => {
    const selectedItems = analyses.filter((a) => a.id && selectedTenderIds.includes(a.id));
    if (selectedItems.length === 0) return;

    setIsGeneratingBatchPdf(true);
    try {
      await generateBatchSummaryPdfReport(selectedItems);
    } catch (err) {
      console.error('Batch PDF generation failed:', err);
    } finally {
      setIsGeneratingBatchPdf(false);
    }
  };

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SavedAnalysis | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAuctionDate, setEditAuctionDate] = useState('');
  const [editProcurementSum, setEditProcurementSum] = useState('');
  const [editStatus, setEditStatus] = useState('На рассмотрении');
  const [editParticipationStatus, setEditParticipationStatus] = useState<TenderParticipationStatus>('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchAnalysesAndCustomers(user.uid);
      } else {
        setAnalyses([]);
        setCustomers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAnalysesAndCustomers = async (userId: string) => {
    setIsLoading(true);
    try {
      const [dataAnalyses, dataCustomers] = await Promise.all([
        getUserAnalysesFromDb(userId),
        getUserCustomersFromDb(userId)
      ]);
      setAnalyses(dataAnalyses);
      setCustomers(dataCustomers);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      try {
        await signInAnonymously(auth);
      } catch (e) {
        alert('Не удалось войти через Google: ' + err.message);
      }
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      alert('Ошибка анонимного входа: ' + err.message);
    }
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
  };

  const handleSaveCurrentAnalysis = async () => {
    if (!currentAnalysisResult) return;
    if (!currentUser) {
      alert('Пожалуйста, войдите в систему для сохранения анализов в базу данных!');
      return;
    }

    setIsSaving(true);
    try {
      const titleToSave = saveTitle.trim() || currentAnalysisResult.summary?.procurementTitle || 'Анализ закупки 223-ФЗ';
      await saveAnalysisToDb(
        currentUser.uid, 
        currentUser.email || 'Анонимный юзер', 
        currentAnalysisResult, 
        titleToSave
      );
      setSaveTitle('');
      await fetchAnalysesAndCustomers(currentUser.uid);
      alert('Результат анализа успешно сохранен в облачную БД Firestore!');
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Ошибка при сохранении в базу данных: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Immediate optimistic local state update
    setAnalyses(prev => prev.filter(item => item.id !== id));
    setSelectedTenderIds(prev => prev.filter(i => i !== id));

    // Save to localStorage deleted IDs list
    try {
      const stored = localStorage.getItem('zakupki_deleted_tender_ids');
      const deletedList: string[] = stored ? JSON.parse(stored) : [];
      if (!deletedList.includes(id)) {
        localStorage.setItem('zakupki_deleted_tender_ids', JSON.stringify([...deletedList, id]));
      }
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    try {
      if (id && !id.startsWith('sample-')) {
        await deleteAnalysisFromDb(id);
      }
      if (currentUser) {
        fetchAnalysesAndCustomers(currentUser.uid);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDeleteSelectedTenders = async () => {
    if (selectedTenderIds.length === 0) return;

    const idsToDelete = [...selectedTenderIds];
    setAnalyses(prev => prev.filter(item => item.id && !idsToDelete.includes(item.id)));
    setSelectedTenderIds([]);

    // Save to localStorage deleted list
    try {
      const stored = localStorage.getItem('zakupki_deleted_tender_ids');
      const deletedList: string[] = stored ? JSON.parse(stored) : [];
      const updated = Array.from(new Set([...deletedList, ...idsToDelete]));
      localStorage.setItem('zakupki_deleted_tender_ids', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    try {
      await deleteSelectedAnalysesFromDb(idsToDelete);
      if (currentUser) {
        fetchAnalysesAndCustomers(currentUser.uid);
      }
    } catch (err) {
      console.error('Batch delete error:', err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (analyses.length === 0) return;

    const allIds = analyses.map(a => a.id).filter(Boolean) as string[];
    setAnalyses([]);
    setSelectedTenderIds([]);

    try {
      const stored = localStorage.getItem('zakupki_deleted_tender_ids');
      const deletedList: string[] = stored ? JSON.parse(stored) : [];
      const updated = Array.from(new Set([...deletedList, ...allIds]));
      localStorage.setItem('zakupki_deleted_tender_ids', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }

    try {
      if (currentUser) {
        await deleteAllUserAnalysesFromDb(currentUser.uid);
        fetchAnalysesAndCustomers(currentUser.uid);
      }
    } catch (err) {
      console.error('Delete all error:', err);
    }
  };

  const handleDeleteCustomer = async (cust: SavedCustomer, e: React.MouseEvent) => {
    e.stopPropagation();

    setCustomers(prev => prev.filter(c => c.id !== cust.id));

    try {
      if (cust.id && !cust.id.startsWith('sample-')) {
        await deleteCustomerFromDb(cust.id);
      }
      if (currentUser) {
        fetchAnalysesAndCustomers(currentUser.uid);
      }
    } catch (err) {
      console.error('Delete customer error:', err);
    }
  };

  const handleToggleFavorite = async (id: string, currentFav: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavoriteAnalysisInDb(id, !currentFav);
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  const handleToggleParticipate = async (item: SavedAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.id) return;
    const isCurrentlyParticipating = item.participationStatus === 'PARTICIPATING';
    const nextStatus: TenderParticipationStatus = isCurrentlyParticipating ? 'NEW' : 'PARTICIPATING';

    // Optimistic UI update
    setAnalyses(prev => prev.map(a => a.id === item.id ? { ...a, participationStatus: nextStatus } : a));

    try {
      await updateAnalysisInDb(item.id, { participationStatus: nextStatus });
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
    } catch (err) {
      console.error('Error updating participation status:', err);
    }
  };

  const handleStartEdit = (item: SavedAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditTitle(item.title || item.projectName || '');
    setEditCustomerName(item.customerName || item.analysisResult?.summary?.customerName || '');
    setEditAuctionDate(item.auctionDate || item.analysisResult?.summary?.auctionDate || '');
    setEditProcurementSum(item.procurementSum || item.analysisResult?.summary?.procurementSum || '');
    setEditStatus(item.status || 'На рассмотрении');
    setEditParticipationStatus(item.participationStatus || 'NEW');
    setEditNotes(item.notes || '');
    setEditTags(item.tags || []);
  };

  const handleToggleTagInEdit = (tag: string) => {
    setEditTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editingItem.id) return;
    setIsUpdating(true);
    try {
      await updateAnalysisInDb(editingItem.id, {
        title: editTitle,
        projectName: editTitle,
        customerName: editCustomerName,
        auctionDate: editAuctionDate,
        procurementSum: editProcurementSum,
        status: editStatus,
        participationStatus: editParticipationStatus,
        notes: editNotes,
        tags: editTags,
      });
      setEditingItem(null);
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
    } catch (err: any) {
      console.error('Update error:', err);
      alert('Ошибка при обновлении: ' + err?.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status?: string, participationStatus?: TenderParticipationStatus) => {
    if (participationStatus === 'WON' || status === 'Победа (Выигран)' || status === 'Победа') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500 text-white flex items-center gap-1 shadow-2xs">
          <Trophy className="w-3 h-3" />
          <span>Победа</span>
        </span>
      );
    }
    if (participationStatus === 'PARTICIPATING' || status === 'В работе' || status === 'Участвуем') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1 shadow-2xs">
          <Clock className="w-3 h-3" />
          <span>В работе</span>
        </span>
      );
    }
    if (participationStatus === 'SUBMITTED' || status === 'Заявка подана') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white flex items-center gap-1 shadow-2xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>Заявка подана</span>
        </span>
      );
    }
    if (participationStatus === 'REJECTED' || status === 'Отклонен') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow-2xs">
          <XCircle className="w-3 h-3" />
          <span>Отклонен</span>
        </span>
      );
    }
    if (participationStatus === 'ARCHIVED' || status === 'Архив') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-500 text-white flex items-center gap-1">
          <span>Архив</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
        {status || 'На рассмотрении'}
      </span>
    );
  };

  const getFormattedDateStrings = (item: SavedAnalysis): string[] => {
    const dates: string[] = [];
    if (item.auctionDate) dates.push(item.auctionDate);
    if (item.analysisResult?.summary?.auctionDate) dates.push(item.analysisResult.summary.auctionDate);
    
    if (item.createdAt) {
      let d: Date | null = null;
      if (item.createdAt?.toDate && typeof item.createdAt.toDate === 'function') {
        d = item.createdAt.toDate();
      } else if (item.createdAt?.seconds) {
        d = new Date(item.createdAt.seconds * 1000);
      } else if (typeof item.createdAt === 'string' || typeof item.createdAt === 'number') {
        d = new Date(item.createdAt);
      }
      if (d && !isNaN(d.getTime())) {
        dates.push(d.toLocaleDateString('ru-RU'));
        dates.push(d.toISOString().slice(0, 10));
        dates.push(d.getFullYear().toString());
      }
    }
    return dates;
  };

  const filteredAnalyses = analyses.filter((item) => {
    if (selectedCustomerFilter) {
      const custName = (item.customerName || item.analysisResult?.summary?.customerName || '').toLowerCase().trim();
      if (!custName.includes(selectedCustomerFilter.toLowerCase().trim())) {
        return false;
      }
    }
    if (selectedTagFilter) {
      if (!item.tags || !item.tags.includes(selectedTagFilter)) {
        return false;
      }
    }
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase().trim();

    // 1. Procurement title / project name / procurement number
    const titleMatch = (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.projectName && item.projectName.toLowerCase().includes(q)) ||
      (item.procurementNumber && item.procurementNumber.toLowerCase().includes(q)) ||
      (item.analysisResult?.summary?.procurementTitle && item.analysisResult.summary.procurementTitle.toLowerCase().includes(q)) ||
      (item.analysisResult?.summary?.procurementNumber && item.analysisResult.summary.procurementNumber.toLowerCase().includes(q))
    );

    // 2. Customer Name
    const customerMatch = (
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.analysisResult?.summary?.customerName && item.analysisResult.summary.customerName.toLowerCase().includes(q))
    );

    // 3. Date search (Auction date, Created date, year, month)
    const dateStrings = getFormattedDateStrings(item);
    const dateMatch = dateStrings.some(dStr => dStr.toLowerCase().includes(q));

    // 4. Procurement sum, status, notes, tags, takeaway
    const metaMatch = (
      (item.procurementSum && item.procurementSum.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q))) ||
      (item.analysisResult?.summary?.keyTakeaway && item.analysisResult.summary.keyTakeaway.toLowerCase().includes(q))
    );

    return titleMatch || customerMatch || dateMatch || metaMatch;
  });

  const groupedByCustomer = React.useMemo(() => {
    const map: Record<string, SavedAnalysis[]> = {};
    filteredAnalyses.forEach(item => {
      const cust = (item.customerName || item.analysisResult?.summary?.customerName || 'Заказчик 223-ФЗ').trim();
      if (!map[cust]) {
        map[cust] = [];
      }
      map[cust].push(item);
    });
    return map;
  }, [filteredAnalyses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Sleek Minimalist Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-tight">База данных результатов анализа</h3>
              <p className="text-[11px] text-slate-400 font-medium">Реестр проверок & Заказчики (Firestore)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Status */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-7 h-7 rounded-full border border-indigo-500 shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'A'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {currentUser.displayName || currentUser.email || 'Гость (Анонимно)'}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                    Синхронизировано с Firestore
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Войдите для сохранения истории:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGoogleSignIn}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google</span>
                </button>
                <button
                  onClick={handleAnonymousSignIn}
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Гость
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Switcher: Tenders vs Unique Customers vs Calendar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full">
            <button
              onClick={() => {
                setActiveTab('tenders');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'tenders'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Закупки ({analyses.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('customers');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Заказчики ({customers.length})</span>
            </button>

            {onOpenCalendar && (
              <button
                onClick={() => {
                  onOpenCalendar();
                  onClose();
                }}
                className="py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Открыть календарь дедлайнов на месяц вперед"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Календарь</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Customer Filter Banner */}
        {selectedCustomerFilter && (
          <div className="mx-4 mt-3 p-2.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
                Закупки заказчика: <span className="text-indigo-600 dark:text-indigo-400">{selectedCustomerFilter}</span>
              </span>
            </div>
            <button
              onClick={() => setSelectedCustomerFilter(null)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold text-[11px] shrink-0 ml-2"
            >
              Сбросить
            </button>
          </div>
        )}

        {/* Save Current Analysis Bar */}
        {currentAnalysisResult && currentUser && (
          <div className="mx-4 mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Сохранить текущий анализ в БД:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={currentAnalysisResult.summary?.procurementTitle || 'Название закупки...'}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSaveCurrentAnalysis}
                disabled={isSaving}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Control Tools Bar */}
        {currentUser && (
          <div className="p-4 space-y-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {/* View Mode & Compare Action */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => setViewMode('flat')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    viewMode === 'flat' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Списком"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Список</span>
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    viewMode === 'grouped' 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Сгруппировать по заказчикам"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>По заказчикам</span>
                </button>
              </div>

              <button
                onClick={() => setIsCompareOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Сравнить 2 закупки</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Поиск по названию закупки, заказчику, дате или тегам..."
                className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {historySearch.trim() !== '' && (
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between px-1">
                <span>Найдено отчетов: {filteredAnalyses.length} из {analyses.length}</span>
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="hover:underline text-[10px] text-slate-400 cursor-pointer"
                >
                  Сбросить поиск
                </button>
              </div>
            )}

            {/* Tag Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <span className="text-slate-400 font-bold text-[10px] uppercase shrink-0 flex items-center gap-0.5">
                <TagIcon className="w-3 h-3" /> Теги:
              </span>
              <button
                onClick={() => setSelectedTagFilter(null)}
                className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                  !selectedTagFilter 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Все
              </button>
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                  className={`px-2 py-0.5 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedTagFilter === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!currentUser ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <UserIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Авторизуйтесь, чтобы вести реестр сохраненных закупок.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
              <p className="text-xs">Загрузка из Firestore...</p>
            </div>
          ) : activeTab === 'tenders' ? (
            /* Tenders List View */
            filteredAnalyses.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">Сохраненных закупок пока нет.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Batch Actions Bar */}
                <div className="bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectedTenderIds.length === filteredAnalyses.length ? handleDeselectAllTenders : handleSelectAllTenders}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {selectedTenderIds.length === filteredAnalyses.length && filteredAnalyses.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{selectedTenderIds.length === filteredAnalyses.length ? 'Снять выбор' : 'Выбрать все'}</span>
                    </button>

                    <span className="text-slate-300 dark:text-slate-700 font-mono">|</span>

                    <span className="font-extrabold text-indigo-950 dark:text-indigo-200">
                      Выбрано: {selectedTenderIds.length} из {filteredAnalyses.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTenderIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteSelectedTenders}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        title="Удалить выбранные закупки из базы данных"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Удалить ({selectedTenderIds.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateBatchReport}
                      disabled={selectedTenderIds.length === 0 || isGeneratingBatchPdf}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedTenderIds.length > 0
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950 active:scale-95'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                      title="Сформировать единый сводный PDF-отчет по выбранным закупкам"
                    >
                      {isGeneratingBatchPdf ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isGeneratingBatchPdf ? 'Генерация PDF...' : `Сводный отчет (${selectedTenderIds.length})`}
                      </span>
                    </button>
                  </div>
                </div>

                {viewMode === 'grouped' ? (
                  /* GROUPED BY CUSTOMER ACCORDION VIEW */
                  <div className="space-y-3">
                    {Object.entries(groupedByCustomer).map(([custName, items]) => {
                      const isExpanded = expandedCustomers[custName] !== false; // expanded by default

                      return (
                        <div key={custName} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden transition-all">
                          {/* Customer Group Accordion Header */}
                          <div
                            onClick={() => setExpandedCustomers(prev => ({ ...prev, [custName]: !isExpanded }))}
                            className="p-3 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-200/80 dark:border-slate-700/80"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={custName}>
                                  {custName}
                                </h4>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {items.length} {items.length === 1 ? 'закупка' : 'закупок'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md text-[10px] font-bold">
                                {items.length} тенд.
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </div>

                          {/* Collapsible Tender Cards Body */}
                          {isExpanded && (
                            <div className="p-2.5 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/40">
                              {items.map(item => {
                                const isSelected = item.id ? selectedTenderIds.includes(item.id) : false;
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => {
                                      if (item.analysisResult) {
                                        onSelectAnalysis(item.analysisResult);
                                        onClose();
                                      }
                                    }}
                                    className={`bg-white dark:bg-slate-800 border ${
                                      isSelected
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20'
                                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400'
                                    } rounded-xl p-3 space-y-2 cursor-pointer transition-all shadow-2xs relative`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleToggleSelectTender(item.id!, e as any)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0 accent-indigo-600"
                                          title="Отметить закупку для пакетного отчета"
                                        />
                                        {getStatusBadge(item.status, item.participationStatus)}
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                          Риск: {item.riskScore}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={(e) => handleStartEdit(item, e)} className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg">
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={(e) => handleDelete(item.id!, e)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                      {item.projectName || item.title}
                                    </h5>

                                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/50">
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.procurementSum || 'По заявке'}</span>
                                      <span className="text-slate-400">{item.auctionDate || 'Уточняется'}</span>
                                    </div>

                                    {item.tags && item.tags.length > 0 && (
                                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                        {item.tags.map(t => (
                                          <span key={t} className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[9px] font-bold">
                                            #{t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* FLAT LIST VIEW */
                  filteredAnalyses.map((item) => {
                    const isParticipating = item.participationStatus === 'PARTICIPATING';
                    const isSelected = item.id ? selectedTenderIds.includes(item.id) : false;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.analysisResult) {
                            onSelectAnalysis(item.analysisResult);
                            onClose();
                          }
                        }}
                        className={`group bg-white dark:bg-slate-800/90 border ${
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/30'
                            : isParticipating 
                            ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/20' 
                            : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                        } rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectTender(item.id!, e as any)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0 accent-indigo-600"
                              title="Отметить закупку для пакетного отчета"
                            />
                            {getStatusBadge(item.status, item.participationStatus)}

                            {/* Risk level badge */}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              Индекс риска: {item.riskScore}
                            </span>
                          </div>

                          {/* EDIT AND DELETE BUTTONS */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleStartEdit(item, e)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Редактировать параметры закупки"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleToggleFavorite(item.id!, !!item.isFavorite, e)}
                              className="p-1 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="В избранное"
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id!, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="Удалить закупку"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {item.projectName || item.title}
                        </h4>

                    {/* Metadata Grid */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-200 truncate font-medium">
                          <strong>Заказчик:</strong> {item.customerName || item.analysisResult?.summary?.customerName || 'Организация 223-ФЗ'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const cust = item.customerName || item.analysisResult?.summary?.customerName;
                            if (cust) {
                              setSelectedCustomerFilter(cust);
                            }
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                          title="Показать все закупки этого заказчика"
                        >
                          Все закупки
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {item.procurementSum || item.analysisResult?.summary?.procurementSum || 'По заявке'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Аукцион: {item.auctionDate || item.analysisResult?.summary?.auctionDate || 'Уточняется'}
                        </span>
                      </div>
                    </div>

                    {/* Tags Pills */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {item.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Action Footer: Participate Button + Open Report */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleParticipate(item, e)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isParticipating
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isParticipating ? 'Участвуем ✓' : 'Участвовать'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.analysisResult) {
                            onSelectAnalysis(item.analysisResult);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Отчёт</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                        «{item.notes}»
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {/* Bottom Clear All History Option */}
            {analyses.length > 0 && (
              <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Всего сохраненных закупок: {analyses.length}
                </span>
                <button
                  type="button"
                  onClick={handleDeleteAllHistory}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Полностью очистить базу данных результатов"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Очистить всю историю</span>
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* Customers View Tab */
            customers.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">База заказчиков формируется автоматически.</p>
              </div>
            ) : (
              customers.map(cust => {
                const linkedTenders = analyses.filter(a => (a.customerName || '').toLowerCase().trim() === (cust.name || '').toLowerCase().trim() || a.customerId === cust.id);
                return (
                  <div key={cust.id} className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {cust.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Заказчик по 223-ФЗ
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerFilter(cust.name);
                            setActiveTab('tenders');
                          }}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          {linkedTenders.length || cust.tendersCount || 1} закупок
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomer(cust, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Удалить заказчика из базы"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Закупки организации:</span>
                      {linkedTenders.length > 0 ? (
                        linkedTenders.map(lt => (
                          <div 
                            key={lt.id}
                            onClick={() => {
                              if (lt.analysisResult) {
                                onSelectAnalysis(lt.analysisResult);
                                onClose();
                              }
                            }}
                            className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-indigo-400 cursor-pointer text-xs"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                              {lt.title || lt.projectName}
                            </span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                              {lt.procurementSum || 'По заявке'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Закупки в общей базе.</p>
                      )}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>

      {/* EDIT TENDER MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Редактирование закупки
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Название тендера / закупки:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Заказчик (223-ФЗ):
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Дата аукциона / подачи:
                  </label>
                  <input
                    type="text"
                    value={editAuctionDate}
                    onChange={(e) => setEditAuctionDate(e.target.value)}
                    placeholder="15.08.2026"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Сумма закупки:
                  </label>
                  <input
                    type="text"
                    value={editProcurementSum}
                    onChange={(e) => setEditProcurementSum(e.target.value)}
                    placeholder="12 450 000 ₽"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Статус процедуры в системе:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="На рассмотрении">На рассмотрении</option>
                  <option value="Заявка подана">Заявка подана</option>
                  <option value="Аудит пройден">Аудит пройден</option>
                  <option value="Победа (Выигран)">Победа (Выигран)</option>
                  <option value="Отклонен">Отклонен</option>
                  <option value="Архив">В архиве</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Статус участия нашей компании:
                </label>
                <select
                  value={editParticipationStatus}
                  onChange={(e) => setEditParticipationStatus(e.target.value as TenderParticipationStatus)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="NEW">Новая закупка (Не участвуем)</option>
                  <option value="PARTICIPATING">Участвуем</option>
                  <option value="SUBMITTED">Заявка официально подана</option>
                  <option value="WON">Победа в закупке</option>
                  <option value="REJECTED">Заявка отклонена</option>
                  <option value="ARCHIVED">Архив</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Теги и метки закупки:
                </label>
                <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {PRESET_TAGS.map((tag) => {
                    const active = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTagInEdit(tag)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                        }`}
                      >
                        #{tag} {active && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Заметки / Примечания:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Добавьте комментарий..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

