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
  SavedCustomer
} from '../lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { 
  History, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Star, 
  Trash2, 
  Download, 
  ExternalLink, 
  X, 
  Bookmark, 
  Edit3, 
  Check, 
  Sparkles, 
  Plus, 
  RefreshCw,
  FolderOpen,
  Search,
  ArrowRight,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  Save,
  Layers,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface AuthAndHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAnalysisResult: any | null;
  onSelectAnalysis: (analysisResult: any) => void;
}

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

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SavedAnalysis | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editAuctionDate, setEditAuctionDate] = useState('');
  const [editProcurementSum, setEditProcurementSum] = useState('');
  const [editStatus, setEditStatus] = useState('На рассмотрении');
  const [editNotes, setEditNotes] = useState('');
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
      alert('Результат анализа успешно сохранен в облачную БД Firestore с автоматически привязанным аккаунтом заказчика!');
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Ошибка при сохранении в базу данных: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить эту запись из истории БД?')) return;
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
      await toggleFavoriteAnalysisInDb(id, !!currentFav);
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
    } catch (err) {
      console.error('Favorite toggle error:', err);
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
    setEditNotes(item.notes || '');
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
        notes: editNotes,
      });
      setEditingItem(null);
      if (currentUser) fetchAnalysesAndCustomers(currentUser.uid);
      alert('Изменения успешно сохранены в Firestore!');
    } catch (err: any) {
      console.error('Update error:', err);
      alert('Ошибка при обновлении: ' + err?.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">База данных результатов анализа</h3>
              <p className="text-xs text-slate-400">История закупок & Аккаунты заказчиков (Firestore)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Auth Info Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-indigo-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'A'}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[180px]">
                    {currentUser.displayName || currentUser.email || 'Гость (Анонимно)'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                    Подключено к Firestore DB
                  </span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Выйти из аккаунта"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Войдите, чтобы автоматически сохранять историю всех проверок в облачную БД:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGoogleSignIn}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google Вход</span>
                </button>
                <button
                  onClick={handleAnonymousSignIn}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Быстрый Гость</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Switcher: Tenders vs Unique Customers */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
            <button
              onClick={() => setActiveTab('tenders')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'tenders'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Все закупки ({analyses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Заказчики ({customers.length})</span>
            </button>
          </div>
        </div>

        {/* Save Current Analysis Section */}
        {currentAnalysisResult && currentUser && (
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Сохранить результат текущего анализа:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={currentAnalysisResult.summary?.procurementTitle || 'Название закупки...'}
                className="flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveCurrentAnalysis}
                disabled={isSaving}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* Search bar */}
          {currentUser && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Поиск по названию закупки, заказчику, дате или сумме..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {!currentUser ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <UserIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Авторизуйтесь, чтобы хранить и редактировать данные закупок.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
              <p className="text-xs">Загрузка из Firestore...</p>
            </div>
          ) : activeTab === 'tenders' ? (
            /* Tenders List View */
            analyses.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">Сохраненных анализов пока нет.</p>
                <p className="text-[11px] text-slate-500">Загрузите документацию и нажмите "Сохранить".</p>
              </div>
            ) : (
              analyses
                .filter((item) => {
                  if (!historySearch.trim()) return true;
                  const q = historySearch.toLowerCase();
                  return (
                    (item.projectName && item.projectName.toLowerCase().includes(q)) ||
                    (item.title && item.title.toLowerCase().includes(q)) ||
                    (item.customerName && item.customerName.toLowerCase().includes(q)) ||
                    (item.procurementSum && item.procurementSum.toLowerCase().includes(q)) ||
                    (item.status && item.status.toLowerCase().includes(q))
                  );
                })
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.analysisResult) {
                        onSelectAnalysis(item.analysisResult);
                        onClose();
                      }
                    }}
                    className="group bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-3.5 space-y-2.5 transition-all cursor-pointer shadow-2xs hover:shadow-md relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase shrink-0 ${
                            item.riskScore > 60
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : item.riskScore > 30
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          Индекс {item.riskScore}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0 border border-indigo-200 dark:border-indigo-800">
                          {item.status || 'На рассмотрении'}
                        </span>
                      </div>

                      {/* EDIT AND DELETE BUTTONS */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleStartEdit(item, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Редактировать закупку (Название, Дата, Сумма, Статус, Заказчик)"
                        >
                          <Edit3 className="w-4 h-4 text-indigo-500" />
                        </button>
                        <button
                          onClick={(e) => handleToggleFavorite(item.id!, !!item.isFavorite, e)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors cursor-pointer"
                          title="В избранное"
                        >
                          <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id!, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                          title="Удалить из истории БД"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                      {item.projectName || item.title}
                    </h4>

                    {/* Extracted Project Metadata Badges: Customer, Sum, Auction Date */}
                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-200 truncate font-semibold">
                          🏛️ <strong>Заказчик:</strong> {item.customerName || item.analysisResult?.summary?.customerName || 'Организация 223-ФЗ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          💰 <strong>Сумма:</strong> {item.procurementSum || item.analysisResult?.summary?.procurementSum || 'По заявке'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          📅 <strong>Дата:</strong> {item.auctionDate || item.analysisResult?.summary?.auctionDate || 'Уточняется'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        Сохранено: {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('ru-RU') : 'Сегодня'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.analysisResult) {
                            onSelectAnalysis(item.analysisResult);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Открыть отчёт</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Notes section */}
                    {item.notes && (
                      <p className="text-[11px] bg-slate-50 dark:bg-slate-900 p-2 rounded-xl text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                        «{item.notes}»
                      </p>
                    )}
                  </div>
                ))
            )
          ) : (
            /* Customers View Tab */
            customers.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-medium">Аккаунты заказчиков формируются автоматически.</p>
                <p className="text-[11px] text-slate-500">При повторных тендерах от одного заказчика они автоматически объединяются!</p>
              </div>
            ) : (
              customers.map(cust => {
                const linkedTenders = analyses.filter(a => (a.customerName || '').toLowerCase().trim() === (cust.name || '').toLowerCase().trim() || a.customerId === cust.id);
                return (
                  <div key={cust.id} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {cust.name}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            Заказчик по 223-ФЗ / ЕИС
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-mono font-extrabold text-xs rounded-lg border border-amber-200 dark:border-amber-800">
                        {linkedTenders.length || cust.tendersCount || 1} тендеров
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Привязанные закупки:</span>
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
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                              {lt.procurementSum || 'По заявке'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Тендеры сохранены в общей базе.</p>
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
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Tender Name */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Название тендера / предмета закупки:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Заказчик (Организация 223-ФЗ):
                </label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Date & Sum Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Дата подачи / аукциона:
                  </label>
                  <input
                    type="text"
                    value={editAuctionDate}
                    onChange={(e) => setEditAuctionDate(e.target.value)}
                    placeholder="15.08.2026"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium font-mono"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Статус процедуры:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="На рассмотрении">⏳ На рассмотрении</option>
                  <option value="Заявка подана">📩 Заявка подана</option>
                  <option value="Аудит пройден">🛡️ Аудит пройден</option>
                  <option value="Победа (Выигран)">🏆 Победа (Выигран)</option>
                  <option value="Отклонен">❌ Отклонен</option>
                  <option value="Архив">📦 В архиве</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Заметки / Примечания тендерного отдела:
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  placeholder="Добавьте комментарий..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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

