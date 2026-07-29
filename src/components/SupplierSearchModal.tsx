import React, { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface SupplierSearchModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
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

  useEffect(() => {
    if (isOpen && product) {
      performSearch(product);
    } else {
      setResult(null);
      setError(null);
    }
  }, [isOpen, product]);

  const performSearch = async (prod: ProductItem) => {
    setLoading(true);
    setError(null);
    setResult(null);

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
    } catch (err: any) {
      console.error('Supplier search error:', err);
      setError(err?.message || 'Не удалось выполнить поиск поставщиков в сети.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 rounded-lg text-xs font-bold">
              <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Поиск Поставщиков & Аналогов в Сети (Google Search)</span>
            </div>
            <h2 className="text-xl font-bold leading-tight text-white">
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

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">

          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Выполняем сканирование сети и реестров Минпромторга...
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  ИИ сопоставляет габариты ({product.dimensions || 'из ТЗ'}), проверяет отечественных производителей и актуальные цены в РФ.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-900">Ошибка при поиске поставщиков</p>
                <p className="text-xs text-rose-700 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => performSearch(product)}
                  className="mt-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Повторить поиск
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          {result && !loading && (
            <div className="space-y-6">

              {/* Top Banner: Price Range & Query */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-bold uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    Ориентировочная вилка цен по РФ
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
                  <span>{copied ? 'Скопировано!' : 'Скопировать отчет по поставщикам'}</span>
                </button>
              </div>

              {/* Section 1: Suppliers & Manufacturers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    1. Заводы-производители и поставщики в РФ ({result.suppliers?.length || 0})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suppliers?.map((supp, sIdx) => (
                    <div 
                      key={sIdx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-slate-900 leading-snug">
                          {supp.companyName}
                        </div>
                        {supp.inGispRegistry && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ГИСП Минпромторг
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 font-medium">
                        {supp.region && (
                          <p className="flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{supp.region}</span>
                          </p>
                        )}
                        <p><span className="text-slate-400 font-bold">Специализация:</span> {supp.specialization}</p>
                        <p className="text-indigo-700 font-semibold break-all">
                          <span className="text-slate-400 font-bold">Контакты/Сайт:</span> {supp.contactsOrWebsite}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Product Models & Analogs */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Package className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    2. Рекомендуемые модели и заводские аналоги ({result.suggestedModels?.length || 0})
                  </h3>
                </div>

                <div className="space-y-3">
                  {result.suggestedModels?.map((model, mIdx) => (
                    <div 
                      key={mIdx}
                      className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs hover:border-indigo-400 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {model.modelName}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {model.manufacturer} • {model.country || 'РФ'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
                            {model.estimatedPrice}
                          </span>
                        </div>
                      </div>

                      {/* Dimensions & Gisp status */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {model.dimensionsMatch && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded-lg">
                            <Ruler className="w-3.5 h-3.5 text-amber-600" />
                            {model.dimensionsMatch}
                          </span>
                        )}
                        {model.gispRegistryStatus && (
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg">
                            {model.gispRegistryStatus}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {model.description}
                      </p>

                      {model.url && (
                        <div className="pt-1">
                          <a
                            href={model.url.startsWith('http') ? model.url : `https://${model.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <span>Перейти к источнику ({model.url})</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Compliance & Expert Note */}
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Заключение по соответствию ТЗ и ПП РФ 1875</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {result.complianceNote}
                </p>
              </div>

              {/* Grounding Sources */}
              {result.groundingSources && result.groundingSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-[11px] font-medium text-slate-600 hover:text-indigo-700 rounded-lg transition-colors"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Поиск производится с помощью Google Search Grounding и ИИ</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
