import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Ruler, 
  Tag, 
  PhoneCall, 
  MapPin, 
  Package, 
  Filter, 
  Download,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/verifiedSuppliers';
import { ProductItem } from '../types';

interface SuppliersCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurementProducts?: ProductItem[];
  onSelectSupplierForProduct?: (productName: string, supplierName: string) => void;
}

export const SuppliersCatalogModal: React.FC<SuppliersCatalogModalProps> = ({
  isOpen,
  onClose,
  procurementProducts = [],
  onSelectSupplierForProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyDomestic, setOnlyDomestic] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'matching'>('catalog');

  if (!isOpen) return null;

  // Filter suppliers
  const filteredSuppliers = VERIFIED_SUPPLIERS.filter(sup => {
    const matchesSearch = 
      sup.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.region && sup.region.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDomestic = !onlyDomestic || sup.isDomesticProducer;

    return matchesSearch && matchesDomestic;
  });

  const exportSuppliersToCsv = () => {
    const headers = 'Бренд / Компания,Сайт,Отечественный производитель,Регион,Категория продукции,Контакты,Описание\n';
    const rows = VERIFIED_SUPPLIERS.map(s => 
      `"${s.brandName}","${s.website}","${s.isDomesticProducer ? 'Да (РФ/ЕАЭС)' : 'Импорт/ТМ'}","${s.region || ''}","${s.category}","${s.contacts}","${s.description.replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Реестр_Проверенных_Поставщиков_Мебели_223ФЗ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">База проверенных российских поставщиков и фабрик</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  223-ФЗ Нацрежим ПП 1875
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Подбор отечественных производителей с габаритами, ценовыми диапазонами и контактами
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportSuppliersToCsv}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              title="Экспортировать каталог в CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Экспорт CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 dark:bg-slate-950 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Реестр поставщиков ({VERIFIED_SUPPLIERS.length})</span>
            </button>

            {procurementProducts.length > 0 && (
              <button
                onClick={() => setActiveTab('matching')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'matching'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Привязка к позициям текущей закупки ({procurementProducts.length})</span>
              </button>
            )}
          </div>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Первично ищем среди наших фабрик, затем в сети
          </span>
        </div>

        {/* Search & Filter Bar */}
        {activeTab === 'catalog' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию бренда, региону, категории (напр. АЛВЕСТ, RIVA, Рязань, стулья)..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer self-center">
              <input
                type="checkbox"
                checked={onlyDomestic}
                onChange={(e) => setOnlyDomestic(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Только отечественные фабрики РФ</span>
            </label>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'catalog' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSuppliers.map((sup) => (
                <div
                  key={sup.id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {sup.brandName}
                          </h3>
                          {sup.isDomesticProducer ? (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Произведено в РФ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md">
                              ТМ / Дилер
                            </span>
                          )}
                        </div>
                        {sup.region && (
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {sup.region}
                          </span>
                        )}
                      </div>

                      <a
                        href={sup.website}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors text-xs font-bold flex items-center gap-1"
                        title="Перейти на сайт компании"
                      >
                        <span>Сайт</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {sup.description}
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        <span>Специализация:</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {sup.category}
                      </p>
                    </div>

                    {/* Sample Product Models */}
                    {sup.sampleProducts && sup.sampleProducts.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Примеры продукции и габариты:
                        </span>
                        <div className="space-y-1">
                          {sup.sampleProducts.map((p, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] bg-indigo-50/50 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-100/80 dark:border-indigo-900/50 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Ruler className="w-2.5 h-2.5 text-indigo-500" /> {p.dimensions}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                                {p.priceRange}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <PhoneCall className="w-3 h-3 text-indigo-500 shrink-0" />
                      {sup.contacts}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Matching View: Attach supplier to procurement specification product */
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 text-xs text-indigo-950 dark:text-indigo-200">
                <span className="font-bold block mb-1">Привязка проверенных поставщиков к позициям закупки:</span>
                Каждая позиция из Вашего ТЗ сопоставляется с моделями из реестра отечественных производителей. При отсутствии точного совпадения задействуется уникальный онлайн-поиск.
              </div>

              <div className="space-y-3">
                {procurementProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Позиция ТЗ ({product.quantity}):
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {product.name}
                        </h4>
                        {product.dimensions && (
                          <span className="text-xs font-mono text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 mt-0.5">
                            <Ruler className="w-3 h-3 text-indigo-500" />
                            Габариты по ТЗ: {product.dimensions}
                          </span>
                        )}
                      </div>

                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold self-start sm:self-auto">
                        Подходит под ПП 1875
                      </span>
                    </div>

                    {/* Recommended Matching Suppliers from database */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                        Рекомендуемые проверенные поставщики из нашей базы:
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {VERIFIED_SUPPLIERS.slice(0, 4).map((sup) => (
                          <div
                            key={sup.id}
                            className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 hover:border-indigo-400 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                                {sup.brandName} ({sup.region || 'РФ'})
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                                {sup.sampleProducts?.[0]?.priceRange || 'от 4 500 ₽'}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                if (onSelectSupplierForProduct) {
                                  onSelectSupplierForProduct(product.name, sup.brandName);
                                }
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>Выбрать</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
