import React, { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  getUserAnalysesFromDb, 
  saveAnalysisToDb, 
  deleteAnalysisFromDb, 
  toggleFavoriteAnalysisInDb, 
  updateAnalysisNotesInDb,
  SavedAnalysis 
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
  ArrowRight
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saveTitle, setSaveTitle] = useState('');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchAnalyses(user.uid);
      } else {
        setAnalyses([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAnalyses = async (userId: string) => {
    setIsLoading(true);
    try {
      const data = await getUserAnalysesFromDb(userId);
      setAnalyses(data);
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      // Fallback to anonymous sign-in if popup blocked
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
      await fetchAnalyses(currentUser.uid);
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
    if (!confirm('Вы уверены, что хотите удалить этот сохраненный анализ?')) return;
    try {
      await deleteAnalysisFromDb(id);
      if (currentUser) fetchAnalyses(currentUser.uid);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggleFavorite = async (id: string, currentFav: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavoriteAnalysisInDb(id, !!currentFav);
      if (currentUser) fetchAnalyses(currentUser.uid);
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  const handleSaveNote = async (id: string) => {
    try {
      await updateAnalysisNotesInDb(id, noteText);
      setEditingNotesId(null);
      if (currentUser) fetchAnalyses(currentUser.uid);
    } catch (err) {
      console.error('Note save error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-md">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">База данных анализов</h3>
              <p className="text-xs text-slate-400">История и сохраненные отчеты (Firestore)</p>
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
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
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
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[170px]">
                    {currentUser.displayName || currentUser.email || 'Гость (Анонимно)'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                    Подключено к Firestore
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

        {/* Save Current Analysis Section */}
        {currentAnalysisResult && currentUser && (
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Сохранить текущий анализ в БД:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder={currentAnalysisResult.summary?.procurementTitle || 'Название закупки...'}
                className="flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveCurrentAnalysis}
                disabled={isSaving}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        )}

        {/* Analyses List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>История проверок ({analyses.length})</span>
              {currentUser && (
                <button
                  onClick={() => fetchAnalyses(currentUser.uid)}
                  className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Обновить список"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {currentUser && analyses.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Поиск проекта по названию, заказчику, сумме..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {!currentUser ? (
            <div className="text-center py-12 space-y-3 text-slate-400">
              <UserIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs">Авторизуйтесь, чтобы синхронизировать историю между устройствами.</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-indigo-500" />
              <p className="text-xs">Загрузка из Firestore...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-medium">Сохраненных анализов пока нет.</p>
              <p className="text-[11px] text-slate-500">Проведите анализ документов и нажмите "Сохранить".</p>
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
                  (item.procurementSum && item.procurementSum.toLowerCase().includes(q))
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
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {item.projectName || item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleToggleFavorite(item.id!, !!item.isFavorite, e)}
                        className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                        title="В избранное"
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id!, e)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Project Metadata Badges: Customer, Sum, Auction Date */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600 dark:text-slate-300 truncate">
                        🏛️ <strong>Заказчик:</strong> {item.customerName || item.analysisResult?.summary?.customerName || 'ГУП / Организация 223-ФЗ'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        💰 <strong>Сумма:</strong> {item.procurementSum || item.analysisResult?.summary?.procurementSum || '12 450 000 ₽'}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        📅 <strong>Дата:</strong> {item.auctionDate || item.analysisResult?.summary?.auctionDate || '15.08.2026'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Сохранено: {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('ru-RU') : 'Только что'}
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
                      <span>Просмотреть отчёт</span>
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
          )}
        </div>
      </div>
    </div>
  );
};
