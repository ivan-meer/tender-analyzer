import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  getUserAnalysesFromDb, 
  getUserCustomersFromDb,
  saveAnalysisToDb, 
  deleteAnalysisFromDb, 
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
  FolderTree
} from 'lucide-react';
import { TenderCompareModal } from './TenderCompareModal';

interface AuthAndHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAnalysisResult: any | null;
  onSelectAnalysis: (analysisResult: any) => void;
}

const PRESET_TAGS = ['Срочно', 'Малый объем', 'Строительство', 'Оборудование', 'ПП 1875', 'СИЗ', 'ИТ / Софт'];

export const AuthAndHistoryDrawer: React.FC<AuthAndHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentAnalysisResult,
  onSelectAnalysis,
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

  // Grouping & Tags & Compare state
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

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
    if (!confirm('Вы уверены, что хотите удалить эту запись из базы данных?')) return;
    try {
      await deleteAnalysisFromDb(id);
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Ошибка при удалении из Firestore');
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

  if (!isOpen) return null;

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
    const q = historySearch.toLowerCase();
    return (
      (item.projectName && item.projectName.toLowerCase().includes(q)) ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.procurementSum && item.procurementSum.toLowerCase().includes(q)) ||
      (item.status && item.status.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
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

        {/* View Mode Switcher: Tenders vs Unique Customers */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full">
            <button
              onClick={() => {
                setActiveTab('tenders');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'tenders'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Все закупки ({analyses.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('customers');
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Заказчики ({customers.length})</span>
            </button>
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
                placeholder="Поиск по закупке, заказчику, тегам или дате..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

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
            ) : viewMode === 'grouped' ? (
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
                          {items.map(item => (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (item.analysisResult) {
                                  onSelectAnalysis(item.analysisResult);
                                  onClose();
                                }
                              }}
                              className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 space-y-2 cursor-pointer hover:border-indigo-400 transition-all shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
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
                          ))}
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
                      isParticipating 
                        ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500/20' 
                        : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                    } rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
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

