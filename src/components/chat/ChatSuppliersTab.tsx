import React from 'react';
import { Building2, Search, CheckCircle, MapPin, Globe, Bot } from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../../data/verifiedSuppliers';

interface ChatSuppliersTabProps {
  supplierSearch: string;
  setSupplierSearch: (val: string) => void;
  onAskAiAboutSupplier: (supplierName: string) => void;
}

export const ChatSuppliersTab: React.FC<ChatSuppliersTabProps> = ({
  supplierSearch,
  setSupplierSearch,
  onAskAiAboutSupplier,
}) => {
  const filteredSuppliers = VERIFIED_SUPPLIERS.filter(sup => {
    if (!supplierSearch.trim()) return true;
    const q = supplierSearch.toLowerCase();
    return (
      sup.brandName.toLowerCase().includes(q) ||
      sup.category.toLowerCase().includes(q) ||
      sup.region.toLowerCase().includes(q) ||
      sup.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            Реестр проверенных отечественных поставщиков (ГИСП / Минпромторг)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Фабрики полного цикла с локализацией производства в РФ и ЕАЭС
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            placeholder="Поиск по бренду, региону, специализации..."
            className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSuppliers.map(sup => (
          <div key={sup.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-indigo-400 transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{sup.brandName}</h4>
                  {sup.isDomesticProducer ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      ГИСП / Минпромторг РФ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      ЕАЭС / Импорт
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {sup.region}
                </span>
              </div>

              {sup.website && (
                <a
                  href={sup.website}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                  title="Официальный сайт"
                >
                  <Globe className="w-4 h-4 text-indigo-500" />
                </a>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{sup.description}</p>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-700 dark:text-slate-200 font-semibold">
                🏷️ <strong>Профиль:</strong> {sup.category}
              </div>
              <div className="text-slate-500 dark:text-slate-400 font-mono">
                📞 <strong>Контакты:</strong> {sup.contacts}
              </div>
            </div>

            {sup.sampleProducts && sup.sampleProducts.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Популярные серии:</div>
                <div className="flex flex-wrap gap-1">
                  {sup.sampleProducts.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => onAskAiAboutSupplier(sup.brandName)}
              className="w-full py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>Запросить подбор моделей в ИИ-чате</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
