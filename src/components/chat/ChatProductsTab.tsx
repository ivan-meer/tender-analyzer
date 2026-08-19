import React from 'react';
import { LayoutGrid, Search, Bot } from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../../data/verifiedSuppliers';
import { MOCK_CHAIR_IMAGES } from '../TenderChatModal';

interface ChatProductsTabProps {
  productSearch: string;
  setProductSearch: (val: string) => void;
  onCompareWithTz: (productName: string) => void;
}

export const ChatProductsTab: React.FC<ChatProductsTabProps> = ({
  productSearch,
  setProductSearch,
  onCompareWithTz,
}) => {
  const allProducts = VERIFIED_SUPPLIERS.flatMap(s => (s.sampleProducts || []).map(p => ({ ...p, supplier: s.brandName })));

  const filteredProducts = allProducts.filter(p => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.supplier.toLowerCase().includes(q) ||
      (p.okpd2 && p.okpd2.includes(q))
    );
  });

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-950 space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-cyan-500" />
            Каталог позиций мебели и оборудования (ГОСТ 19917-2014)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Базовые образцы с кодами ОКПД2 и диапазонами габаритов
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Поиск товара по наименованию, ОКПД2..."
            className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredProducts.map((prod, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-2xs hover:border-indigo-400 transition-all flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
                <img 
                  src={MOCK_CHAIR_IMAGES[idx % MOCK_CHAIR_IMAGES.length].url} 
                  alt={prod.name} 
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white font-mono text-[10px] font-bold rounded-md backdrop-blur-xs">
                  ОКПД2 {prod.okpd2 || '31.01.12'}
                </span>
              </div>

              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white leading-snug">
                {prod.name}
              </h4>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>🏭 <strong>Фабрика:</strong> {prod.supplier}</div>
                <div>📐 <strong>Габариты:</strong> {prod.dimensions}</div>
                <div className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  💰 <strong>Цена:</strong> {prod.priceRange}
                </div>
              </div>
            </div>

            <button
              onClick={() => onCompareWithTz(prod.name)}
              className="w-full py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-500" />
              <span>Сравнить с ТЗ в чате</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
