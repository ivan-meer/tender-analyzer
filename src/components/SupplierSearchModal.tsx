import React, { useEffect, useState, useMemo } from 'react';
import { ProductItem, SupplierSearchResult } from '../types';
import { 
  X, 
  Search, 
  Globe, 
  Building2, 
  Package, 
  Ruler, 
  ExternalLink, 
  ShieldCheck, 
  Tag, 
  Copy, 
  Check, 
  Loader2, 
  MapPin, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  Database,
  Cpu,
  Zap,
  Maximize2,
  RefreshCw,
  Clock
} from 'lucide-react';

interface SupplierSearchModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const LOCAL_STORAGE_CACHE_KEY = 'tender_supplier_search_cache_v3';

// In-memory cache across modal open/close during session
const memoryCache = new Map<string, SupplierSearchResult>();

function getStorageCache(): Record<string, SupplierSearchResult> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveToStorageCache(key: string, data: SupplierSearchResult) {
  try {
    memoryCache.set(key, data);
    const store = getStorageCache();
    store[key] = {
      ...data,
      fromCache: true,
    };
    // keep maximum 100 searches to avoid storage bloat
    const keys = Object.keys(store);
    if (keys.length > 100) {
      delete store[keys[0]];
    }
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Failed to save supplier search to localStorage:', e);
  }
}

function generateProductCacheKey(prod: ProductItem): string {
  const name = (prod.name || '').trim().toLowerCase();
  const dims = (prod.dimensions || '').trim().toLowerCase();
  const okpd = (prod.okpd2OrGvin || '').trim().toLowerCase();
  return `supp_${name}_${dims}_${okpd}`;
}

export const SupplierSearchModal: React.FC<SupplierSearchModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SupplierSearchResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeZoomImage, setActiveZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Interactive Filter & Search Controls
  const [filterText, setFilterText] = useState<string>('');
  const [onlyGisp, setOnlyGisp] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  const cacheKey = useMemo(() => {
    return product ? generateProductCacheKey(product) : '';
  }, [product?.name, product?.dimensions, product?.okpd2OrGvin]);

  // Load from cache or fetch when modal opens
  useEffect(() => {
    if (!isOpen || !product || !cacheKey) {
      return;
    }

    // 1. Check memory cache first
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      setResult(cached);
      setLoading(false);
      setError(null);
      return;
    }

    // 2. Check local storage cache
    const store = getStorageCache();
    if (store[cacheKey]) {
      const cached = store[cacheKey];
      memoryCache.set(cacheKey, cached);
      setResult(cached);
      setLoading(false);
      setError(null);
      return;
    }

    // 3. Not in cache -> perform live search
    performSearch(product, false);
  }, [isOpen, cacheKey]);

  const performSearch = async (prod: ProductItem, isManualRefresh = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    // If not manual refresh and we have no cached result, clear to show loader
    if (!isManualRefresh && !result) {
      setResult(null);
    }

    try {
      const response = await fetch('/api/search-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: prod.name,
          dimensions: prod.dimensions,
          specification: prod.specification,
          parameters: prod.parameters,
          okpd2OrGvin: prod.okpd2OrGvin,
          pp1875Status: prod.pp1875Status,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка сети при поиске поставщиков');
      }

      const data: SupplierSearchResult = await response.json();
      setResult(data);
      setLastUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Save to persistent storage cache
      if (cacheKey) {
        saveToStorageCache(cacheKey, data);
      }
    } catch (err: any) {
      console.error('Supplier search error:', err);
      setError(err?.message || 'Не удалось выполнить поиск поставщиков в сети.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  const queryClean = filterText.trim().toLowerCase();

  const filteredSuppliers = (result?.suppliers || []).filter((s) => {
    if (onlyGisp && !s.inGispRegistry) return false;
    if (!queryClean) return true;
    return (
      (s.companyName || '').toLowerCase().includes(queryClean) ||
      (s.specialization || '').toLowerCase().includes(queryClean) ||
      (s.region || '').toLowerCase().includes(queryClean) ||
      (s.contactsOrWebsite || '').toLowerCase().includes(queryClean)
    );
  });

  let filteredModels = (result?.suggestedModels || []).filter((m) => {
    if (onlyGisp && !(m.gispRegistryStatus || '').toLowerCase().includes('реестр') && !(m.gispRegistryStatus || '').toLowerCase().includes('минпромторг') && !(m.gispRegistryStatus || '').toLowerCase().includes('пп 1875')) return false;
    if (!queryClean) return true;
    return (
      (m.modelName || '').toLowerCase().includes(queryClean) ||
      (m.manufacturer || '').toLowerCase().includes(queryClean) ||
      (m.description || '').toLowerCase().includes(queryClean) ||
      (m.dimensionsMatch || '').toLowerCase().includes(queryClean)
    );
  });

  if (sortOrder === 'price_asc') {
    filteredModels = [...filteredModels].sort((a, b) => {
      const pA = parseInt((a.estimatedPrice || '').replace(/\D/g, '')) || 0;
      const pB = parseInt((b.estimatedPrice || '').replace(/\D/g, '')) || 0;
      return pA - pB;
    });
  } else if (sortOrder === 'price_desc') {
    filteredModels = [...filteredModels].sort((a, b) => {
      const pA = parseInt((a.estimatedPrice || '').replace(/\D/g, '')) || 0;
      const pB = parseInt((b.estimatedPrice || '').replace(/\D/g, '')) || 0;
      return pB - pA;
    });
  }

  const handleCopySummary = () => {
    if (!result) return;
    let text = `ОТЧЕТ ПО ПОИСКУ ПОСТАВЩИКОВ И АНАЛОГОВ В СЕТИ ИНТЕРНЕТ\n`;
    text += `Товар: ${product.name}\n`;
    if (product.dimensions) text += `Габариты: ${product.dimensions}\n`;
    text += `Ориентировочная вилка цен: ${result.priceRangeEstimate}\n\n`;

    text += `ПОСТАВЩИКИ И ЗАВОДЫ В РФ:\n`;
    result.suppliers?.forEach((s, idx) => {
      text += `${idx + 1}. ${s.companyName} (${s.region || 'РФ'})\n   Специализация: ${s.specialization}\n   Контакты: ${s.contactsOrWebsite}\n   ГИСП Минпромторг: ${s.inGispRegistry ? 'Да' : 'Нет'}\n`;
    });

    text += `\nМОДЕЛИ И АНАЛОГИ:\n`;
    result.suggestedModels?.forEach((m, idx) => {
      text += `${idx + 1}. ${m.modelName} | ${m.manufacturer} (${m.country})\n   Цена: ${m.estimatedPrice}\n   Габариты: ${m.dimensionsMatch}\n   Описание: ${m.description}\n`;
    });

    text += `\nЗаключение по ПП 1875: ${result.complianceNote}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 rounded-lg text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Поиск Поставщиков & Аналогов в РФ (Google Search & ГИСП)</span>
              </div>

              {result && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-lg text-[10px] font-extrabold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Данные сохранены</span>
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold leading-tight text-white truncate pr-2">
              {product.name}
            </h2>
            
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md font-bold">
                Кол-во: {product.quantity}
              </span>
              {product.dimensions && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 font-extrabold rounded-md">
                  <Ruler className="w-3 h-3 text-amber-400" />
                  {product.dimensions}
                </span>
              )}
              {product.okpd2OrGvin && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-mono rounded-md">
                  ОКПД2: {product.okpd2OrGvin}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => performSearch(product, true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              title="Перепроверить и обновить поиск"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Обновить</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

          {/* Loading State (when no result yet) */}
          {loading && !result && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto animate-bounce border border-indigo-100 dark:border-indigo-800 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Выполняем сканирование сети и реестров Минпромторга...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                  ИИ сопоставляет габариты ({product.dimensions || 'из ТЗ'}), проверяет отечественных производителей и актуальные цены в РФ.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">Ошибка при поиске поставщиков</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => performSearch(product, true)}
                  className="mt-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Повторить поиск
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6">

              {/* Top Banner: Price Range & Query */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-800/50">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold uppercase tracking-wider">
                      <Tag className="w-3.5 h-3.5" />
                      Ориентировочная вилка цен по РФ
                    </div>

                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Сохранено в кэше
                    </span>

                    {(result as any).neonDbMatchesCount > 0 && (
                      <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                        <Database className="w-3 h-3 text-cyan-400" />
                        {(result as any).neonDbMatchesCount} поз. из базы Neon DB
                      </span>
                    )}

                    {loading && (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Обновление...
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-extrabold text-amber-300">
                    {result.priceRangeEstimate || 'По запросу'}
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Поисковый запрос: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-200">{result.searchQueryUsed}</code>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start md:self-center"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Скопировано!' : 'Скопировать отчет'}</span>
                </button>
              </div>

              {/* Interactive Search & Filter Toolbar */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Фильтр по наименованию, заводу, ГОСТ или городу..."
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {filterText && (
                    <button
                      onClick={() => setFilterText('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlyGisp(!onlyGisp)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      onlyGisp
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${onlyGisp ? 'text-white' : 'text-emerald-500'}`} />
                    <span>Только ГИСП Минпромторг</span>
                  </button>

                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="default">Сортировка: Сначала релевантные</option>
                    <option value="price_asc">Цена: Сначала недорогие</option>
                    <option value="price_desc">Цена: Сначала дорогие</option>
                  </select>
                </div>
              </div>

              {/* Section 1: Suppliers & Manufacturers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    1. Заводы-производители и поставщики в РФ ({filteredSuppliers.length})
                  </h3>
                </div>

                {filteredSuppliers.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    Поставщики по заданному фильтру не найдены.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredSuppliers.map((supp, sIdx) => {
                      const rawUrl = supp.websiteUrl || (supp.contactsOrWebsite.includes('.ru') || supp.contactsOrWebsite.includes('.com')
                        ? supp.contactsOrWebsite.split('|')[0].trim()
                        : null);
                      const href = rawUrl
                        ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
                        : null;

                      return (
                        <div 
                          key={sIdx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {supp.companyName}
                              </div>
                              {supp.inGispRegistry && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  ГИСП Минпромторг
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
                              {supp.region && (
                                <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                  <MapPin className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
                                  <span>{supp.region}</span>
                                </p>
                              )}
                              <p><span className="text-slate-400 dark:text-slate-500 font-bold">Специализация:</span> {supp.specialization}</p>
                              <p className="text-indigo-700 dark:text-indigo-300 font-semibold break-all">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">Контакты/Сайт:</span> {supp.contactsOrWebsite}
                              </p>
                            </div>
                          </div>

                          {href && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                              >
                                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                <span>Перейти на сайт поставщика ↗</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Product Models & Analogs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                    2. Рекомендуемые модели, карточки и фото товаров ({filteredModels.length})
                  </h3>
                </div>

                {filteredModels.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                    Модели товаров по заданному фильтру не найдены.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredModels.map((model, mIdx) => {
                      const directUrl = model.productUrl || (model.url 
                        ? (model.url.startsWith('http') ? model.url : `https://${model.url}`)
                        : null);

                      const searchSearchQuery = encodeURIComponent(`${model.manufacturer} ${model.modelName}`);

                      return (
                        <div 
                          key={mIdx}
                          className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl space-y-3 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col md:flex-row gap-4 items-start"
                        >
                          {/* Product Image Thumbnail */}
                          <div 
                            onClick={() => model.imageUrl && setActiveZoomImage({ url: model.imageUrl, title: `${model.modelName} — ${model.manufacturer}` })}
                            className="w-full md:w-44 h-36 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
                          >
                            {model.imageUrl ? (
                              <>
                                <img 
                                  src={model.imageUrl} 
                                  alt={model.modelName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
                                  }}
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-xs">
                                  <Maximize2 className="w-4 h-4" />
                                  <span>Увеличить</span>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
                                <ImageIcon className="w-8 h-8 opacity-60" />
                                <span className="text-[10px] font-bold">Фото товара</span>
                              </div>
                            )}

                            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {model.country || 'РФ'}
                            </div>
                          </div>

                          {/* Model Specs & Links */}
                          <div className="flex-1 space-y-2.5 min-w-0 w-full">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="font-black text-slate-900 dark:text-white text-base leading-snug">
                                  {model.modelName}
                                </h4>
                                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-bold mt-0.5">
                                  {model.manufacturer}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-xl block">
                                  {model.estimatedPrice}
                                </span>
                              </div>
                            </div>

                            {/* Dimensions & Gisp status */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {model.dimensionsMatch && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold rounded-lg">
                                  <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  {model.dimensionsMatch}
                                </span>
                              )}
                              {model.gispRegistryStatus && (
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold rounded-lg flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  {model.gispRegistryStatus}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                              {model.description}
                            </p>

                            {/* Product Features Badges if present */}
                            {model.productFeatures && model.productFeatures.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {model.productFeatures.map((feat: string, fIdx: number) => (
                                  <span key={fIdx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-bold">
                                    ✓ {feat}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Direct Links Action Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                              {directUrl && (
                                <a
                                  href={directUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                                >
                                  <span>Открыть страницу товара ↗</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <a
                                href={`https://yandex.ru/search/?text=${searchSearchQuery}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                              >
                                <span>Найти в Яндекс Маркете ↗</span>
                              </a>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Compliance & Expert Note */}
              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Заключение по соответствию ТЗ и ПП РФ 1875</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {result.complianceNote}
                </p>
              </div>

              {/* Grounding Sources */}
              {result.groundingSources && result.groundingSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Источники данных в Google Search:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.groundingSources.map((source, gIdx) => (
                      source.web?.uri && (
                        <a
                          key={gIdx}
                          href={source.web.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>{source.web.title || source.web.uri}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Данные сохраняются автоматически для мгновенного доступа без повторной загрузки</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>

      {/* Lightbox Zoom Image Modal */}
      {activeZoomImage && (
        <div 
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-3 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between px-2 pt-1 text-white text-xs font-bold">
              <span className="truncate pr-4">{activeZoomImage.title}</span>
              <button 
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={activeZoomImage.url} 
              alt={activeZoomImage.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
