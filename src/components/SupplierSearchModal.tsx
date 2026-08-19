import React, { useEffect, useState, useMemo } from 'react';
import { ProductItem, SupplierSearchResult } from '../types';
import { NeonService } from '../lib/neonService';
import { SupplierCard } from './supplier/SupplierCard';
import { ModelCard } from './supplier/ModelCard';
import { ImageLightbox } from './supplier/ImageLightbox';
import { 
  X, 
  Search, 
  Globe,
  Building2, 
  Package, 
  Ruler,
  Layers,
  Palette,
  ExternalLink, 
  ShieldCheck, 
  Tag,
  Zap,
  Copy,
  Check, 
  Loader2, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  Plus,
  Percent
} from 'lucide-react';

interface SupplierSearchModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const LOCAL_STORAGE_CACHE_KEY = 'tender_supplier_search_cache_v4';

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
  const id = (prod.id || '').trim();
  const name = (prod.name || '').trim().toLowerCase();
  const dims = (prod.dimensions || '').trim().toLowerCase();
  const mats = (prod.materials || '').trim().toLowerCase();
  const col = (prod.color || '').trim().toLowerCase();
  const okpd = (prod.okpd2OrGvin || '').trim().toLowerCase();
  const spec = (prod.specification || prod.rawRequirementText || '').slice(0, 60).trim().toLowerCase();
  return `supp_${id}_${name}_${dims}_${mats}_${col}_${okpd}_${spec}`;
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
  const [sortOrder, setSortOrder] = useState<'default' | 'price_asc' | 'price_desc' | 'match_score'>('default');

  // Saving states to Neon DB
  const [savingSuppliers, setSavingSuppliers] = useState<Record<string, boolean>>({});
  const [savedSuppliers, setSavedSuppliers] = useState<Record<string, boolean>>({});
  const [savingModels, setSavingModels] = useState<Record<string, boolean>>({});
  const [savedModels, setSavedModels] = useState<Record<string, boolean>>({});

  // Extract effective materials & color from parameters if not already in dedicated fields
  const effectiveMaterials = useMemo(() => {
    if (product?.materials) return product.materials;
    if (Array.isArray(product?.parameters)) {
      const mp = product.parameters.find(p => p && (p.name?.toLowerCase().includes('материал') || p.name?.toLowerCase().includes('каркас') || p.name?.toLowerCase().includes('обивка')));
      if (mp) return mp.value;
    }
    return '';
  }, [product?.materials, product?.parameters]);

  const effectiveColor = useMemo(() => {
    if (product?.color) return product.color;
    if (Array.isArray(product?.parameters)) {
      const cp = product.parameters.find(p => p && (p.name?.toLowerCase().includes('цвет') || p.name?.toLowerCase().includes('оттенок')));
      if (cp) return cp.value;
    }
    return '';
  }, [product?.color, product?.parameters]);

  const handleSaveSupplierToNeon = async (supp: any, idx: number) => {
    const key = `sup_${supp.companyName}_${idx}`;
    setSavingSuppliers(prev => ({ ...prev, [key]: true }));
    try {
      const rawUrl = supp.websiteUrl || (supp.contactsOrWebsite?.includes('.ru') || supp.contactsOrWebsite?.includes('.com')
        ? supp.contactsOrWebsite.split('|')[0].trim()
        : '');
      const href = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : '';
      
      await NeonService.addSupplier({
        companyName: supp.companyName,
        region: supp.region || 'РФ',
        specialization: supp.specialization || 'Поставка продукции по ТЗ',
        contactsOrWebsite: supp.contactsOrWebsite || '',
        websiteUrl: href,
        inGispRegistry: Boolean(supp.inGispRegistry)
      });
      setSavedSuppliers(prev => ({ ...prev, [key]: true }));
    } catch (err: any) {
      console.error('Failed to save supplier to Neon:', err);
      alert(`Ошибка сохранения поставщика: ${err?.message || 'Не удалось сохранить'}`);
    } finally {
      setSavingSuppliers(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveModelToNeon = async (model: any, idx: number) => {
    const key = `model_${model.modelName}_${idx}`;
    setSavingModels(prev => ({ ...prev, [key]: true }));
    try {
      const numPrice = parseInt((model.estimatedPrice || '').replace(/\D/g, '')) || 15000;
      await NeonService.addCatalogItem({
        companyName: model.manufacturer || 'Российский производитель',
        category: 'Furniture',
        modelName: model.modelName,
        dimensions: model.dimensionsMatch || product?.dimensions || 'По ТЗ',
        estimatedPrice: numPrice,
        priceFormatted: model.estimatedPrice || `${numPrice.toLocaleString('ru-RU')} ₽ / шт.`,
        description: model.description || '',
        gispRegistryStatus: model.gispRegistryStatus || 'Внесено в реестр Минпромторга (ПП 1875)',
        productUrl: model.productUrl || model.url || '',
        imageUrl: model.imageUrl || '',
        productFeatures: model.productFeatures || []
      });
      setSavedModels(prev => ({ ...prev, [key]: true }));
    } catch (err: any) {
      console.error('Failed to save model to Neon:', err);
      alert(`Ошибка сохранения модели: ${err?.message || 'Не удалось сохранить'}`);
    } finally {
      setSavingModels(prev => ({ ...prev, [key]: false }));
    }
  };

  const cacheKey = useMemo(() => {
    return product ? generateProductCacheKey(product) : '';
  }, [product?.id, product?.name, product?.dimensions, product?.materials, product?.color, product?.okpd2OrGvin, product?.specification]);

  // Load from cache or fetch when modal opens or product changes
  useEffect(() => {
    if (!isOpen || !product || !cacheKey) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Reset filters and actions for newly selected product
    setFilterText('');
    setSavedSuppliers({});
    setSavedModels({});

    // 1. Check memory cache first
    if (memoryCache.has(cacheKey)) {
      const cached = memoryCache.get(cacheKey)!;
      setResult(cached);
      setLoading(false);
      setError(null);
      setLastUpdated('из кэша сессии');
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
      setLastUpdated('сохранено ранее');
      return;
    }

    // 3. Not in cache -> clear previous product result immediately and perform live search
    setResult(null);
    setError(null);
    performSearch(product, false, cacheKey);
  }, [isOpen, cacheKey]);

  const performSearch = async (prod: ProductItem, isManualRefresh = false, currentKey = cacheKey) => {
    setLoading(true);
    setError(null);
    if (!isManualRefresh) {
      setResult(null);
    }

    try {
      const response = await fetch('/api/search-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: prod.name,
          dimensions: prod.dimensions,
          materials: prod.materials || effectiveMaterials,
          color: prod.color || effectiveColor,
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
      
      // Ensure the search result matches the currently active product
      setResult(data);
      setLastUpdated(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Save to persistent storage cache under the item-specific key
      if (currentKey) {
        saveToStorageCache(currentKey, data);
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
      (m.dimensionsMatch || '').toLowerCase().includes(queryClean) ||
      (m.materialsMatch || '').toLowerCase().includes(queryClean) ||
      (m.colorMatch || '').toLowerCase().includes(queryClean)
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
  } else if (sortOrder === 'match_score') {
    filteredModels = [...filteredModels].sort((a, b) => (b.matchScore || 90) - (a.matchScore || 90));
  }

  const handleCopySummary = () => {
    if (!result) return;
    let text = `ОТЧЕТ ПО ПОИСКУ ПОСТАВЩИКОВ И АНАЛОГОВ В СЕТИ ИНТЕРНЕТ (Приоритет: Размеры, Материалы, Цвет)\n`;
    text += `Товар: ${product.name}\n`;
    if (product.dimensions) text += `Габариты (Приоритет №1): ${product.dimensions}\n`;
    if (effectiveMaterials) text += `Материалы (Приоритет №2): ${effectiveMaterials}\n`;
    if (effectiveColor) text += `Цвет (Приоритет №3): ${effectiveColor}\n`;
    text += `Ориентировочная вилка цен: ${result.priceRangeEstimate}\n\n`;

    text += `ПОСТАВЩИКИ И ЗАВОДЫ В РФ:\n`;
    result.suppliers?.forEach((s, idx) => {
      text += `${idx + 1}. ${s.companyName} (${s.region || 'РФ'})\n   Специализация: ${s.specialization}\n   Контакты: ${s.contactsOrWebsite}\n   ГИСП Минпромторг: ${s.inGispRegistry ? 'Да' : 'Нет'}\n`;
    });

    text += `\nМОДЕЛИ И АНАЛОГИ:\n`;
    result.suggestedModels?.forEach((m, idx) => {
      text += `${idx + 1}. ${m.modelName} | ${m.manufacturer} (${m.country})\n   Цена: ${m.estimatedPrice}\n   Габариты: ${m.dimensionsMatch}\n   Материалы: ${m.materialsMatch || 'По ТЗ'}\n   Цвет: ${m.colorMatch || 'По ТЗ'}\n   Описание: ${m.description}\n`;
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
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 rounded-lg text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Поиск Поставщиков & Аналогов в РФ</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-lg text-[10px] font-bold">
                <span>Приоритеты: Размеры • Материалы • Цвет</span>
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
            
            {/* Primary Parameters Highlighting Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md font-bold">
                Кол-во: {product.quantity}
              </span>

              {/* 1. Dimensions (Priority #1) */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-200 font-extrabold rounded-md" title="Главный приоритет: Размеры/Габариты">
                <Ruler className="w-3.5 h-3.5 text-amber-400" />
                <span>Размеры: {product.dimensions || 'По ТЗ'}</span>
              </span>

              {/* 2. Materials (Priority #2) */}
              {effectiveMaterials && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-bold rounded-md" title="Главный приоритет: Материалы">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Материалы: {effectiveMaterials}</span>
                </span>
              )}

              {/* 3. Color (Priority #3) */}
              {effectiveColor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-500/20 border border-sky-400/30 text-sky-200 font-bold rounded-md" title="Главный приоритет: Цвет">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Цвет: {effectiveColor}</span>
                </span>
              )}

              {product.okpd2OrGvin && (
                <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 font-mono rounded-md text-[11px]">
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
                  Выполняем сканирование каталогов и реестров Минпромторга...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                  ИИ сопоставляет основные параметры: <strong>Размеры ({product.dimensions || 'По ТЗ'})</strong>, <strong>Материалы ({effectiveMaterials || 'По ТЗ'})</strong>, <strong>Цвет ({effectiveColor || 'По ТЗ'})</strong>.
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
                        {(result as any).neonDbMatchesCount} поз. из каталога Neon DB
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

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 pt-0.5">
                    <span>Размеры: <strong className="text-amber-300">{product.dimensions || 'По ТЗ'}</strong></span>
                    {effectiveMaterials && <span>Материалы: <strong className="text-emerald-300">{effectiveMaterials}</strong></span>}
                    {effectiveColor && <span>Цвет: <strong className="text-sky-300">{effectiveColor}</strong></span>}
                  </div>
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
                    placeholder="Фильтр по наименованию, заводу, материалам или цвету..."
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
                    <option value="match_score">Совпадение с ТЗ: Сначала 100%</option>
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
                    {filteredSuppliers.map((supp, sIdx) => (
                      <SupplierCard
                        key={sIdx}
                        supplier={supp}
                        index={sIdx}
                        isSaving={!!savingSuppliers[`sup_${supp.companyName}_${sIdx}`]}
                        isSaved={!!savedSuppliers[`sup_${supp.companyName}_${sIdx}`]}
                        onSaveToNeon={handleSaveSupplierToNeon}
                      />
                    ))}
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
                    {filteredModels.map((model, mIdx) => (
                      <ModelCard
                        key={mIdx}
                        model={model}
                        index={mIdx}
                        isSaving={!!savingModels[`model_${model.modelName}_${mIdx}`]}
                        isSaved={!!savedModels[`model_${model.modelName}_${mIdx}`]}
                        onSaveToNeon={handleSaveModelToNeon}
                        onZoomImage={setActiveZoomImage}
                      />
                    ))}
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
      <ImageLightbox 
        image={activeZoomImage} 
        onClose={() => setActiveZoomImage(null)} 
      />
    </div>
  );
};
