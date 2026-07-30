import React, { useState } from 'react';
import { Search, Globe, ExternalLink, X, ShieldCheck, Sparkles, RefreshCw, FileCheck } from 'lucide-react';

interface LegalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalSearchModal: React.FC<LegalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    answer?: string;
    sources?: any[];
    queries?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || query).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      setSearchResult(data);
    } catch (err: any) {
      console.error('Search grounding error:', err);
      setSearchResult({
        answer: `Ошибка выполнения поиска: ${err?.message || 'Неизвестная ошибка'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
              <Globe className="w-6 h-6 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Онлайн Поиск Законов и Практики ФАС (Search Grounding)</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Google Search
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">Поиск сведений о законах 223-ФЗ, постановлениях ПП 1875 и решении ФАС</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например: Списание штрафов 223-ФЗ практика ФАС 2025..."
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Найти в законах</span>
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-xs">
            <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0">Частые запросы:</span>
            {[
              'Штраф 3% по 223-ФЗ правомерность',
              'Постановление 1875 реестр российской продукции',
              'Односторонний отказ заказчика 223-ФЗ',
              'Сроки оплаты по 223-ФЗ 7 дней',
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
                disabled={isLoading}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium shrink-0 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Search Result */}
          {isLoading && (
            <div className="p-8 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                ИИ обращается к реестрам Консультант+, ФАС и ЕИС Закупки в реальном времени...
              </p>
            </div>
          )}

          {searchResult && !isLoading && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-3 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <FileCheck className="w-4 h-4" />
                  <span>Ответ со ссылкой на нормативно-правовую базу РФ:</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                  {searchResult.answer}
                </div>
              </div>

              {/* Grounded sources */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Подтвержденные веб-источники и судебные решения:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.web?.uri || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl flex items-center justify-between text-xs transition-all hover:shadow-xs group"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                          {src.web?.title || 'Правовой источник'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
