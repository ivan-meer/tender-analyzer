import React from 'react';
import { 
  Search, 
  X, 
  Filter, 
  Building2, 
  LayoutGrid, 
  List, 
  DollarSign, 
  ShieldCheck, 
  RotateCcw, 
  Database, 
  Download, 
  Plus 
} from 'lucide-react';

interface SuppliersFilterBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (v: string) => void;
  availableSuppliers: string[];
  viewMode: 'grid' | 'table';
  setViewMode: (v: 'grid' | 'table') => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  onlyDomestic: boolean;
  setOnlyDomestic: (v: boolean) => void;
  resetAllFilters: () => void;
  onOpenSchemaModal: () => void;
  onExportCsv: () => void;
  onToggleAddForm: () => void;
}

export const SuppliersFilterBar: React.FC<SuppliersFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSupplier,
  setSelectedSupplier,
  availableSuppliers,
  viewMode,
  setViewMode,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onlyDomestic,
  setOnlyDomestic,
  resetAllFilters,
  onOpenSchemaModal,
  onExportCsv,
  onToggleAddForm,
}) => {
  const hasActiveFilters = Boolean(
    searchTerm || 
    selectedCategory !== 'ALL' || 
    selectedSupplier !== 'ALL' || 
    onlyDomestic || 
    minPrice || 
    maxPrice
  );

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию модели, габаритам (1400х750), ОКПД2, ГОСТ, фабрике или бренду..."
            className="w-full pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-cyan-500 shrink-0 hidden sm:inline" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none shadow-2xs shrink-0 cursor-pointer"
          >
            <option value="ALL">📦 Все категории продукции</option>
            <option value="Furniture">Мебель, столы и кресла</option>
            <option value="Tech">Оргтехника, ПК и Мониторы</option>
            <option value="Electrical">Электротехника и кабель</option>
            <option value="Construction">Стройматериалы</option>
            <option value="Office">Канцелярия</option>
            <option value="Medical">Медицинская мебель</option>
          </select>
        </div>

        {/* Supplier / Manufacturer Dropdown Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 hidden sm:inline" />
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none shadow-2xs shrink-0 cursor-pointer max-w-[210px] truncate"
          >
            <option value="ALL">🏭 Все поставщики ({availableSuppliers.length})</option>
            {availableSuppliers.map((supName, idx) => (
              <option key={idx} value={supName}>
                {supName}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher (Grid / Table) */}
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'grid'
                ? 'bg-cyan-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Отображение карточками с фото"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Сетка</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'table'
                ? 'bg-cyan-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Отображение компактной реестровой таблицей"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Таблица</span>
          </button>
        </div>
      </div>

      {/* Secondary filter bar: Price Range + GISP toggle + Reset Button */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Price range */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] text-slate-400 font-bold">Прайс ₽:</span>
            <input
              type="number"
              placeholder="от"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-14 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-xs"
            />
            <span className="text-slate-400">—</span>
            <input
              type="number"
              placeholder="до"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-16 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none text-xs"
            />
          </div>

          {/* GISP / Domestic check pill */}
          <button
            type="button"
            onClick={() => setOnlyDomestic(!onlyDomestic)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              onlyDomestic
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Только ГИСП Минпромторг (ПП 1875)</span>
          </button>

          {/* Reset Filters / View Full Catalog Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Показать весь каталог без каких-либо ограничений"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Показать весь каталог (Сброс)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSchemaModal}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            title="Инспектор структуры данных таблиц Neon PostgreSQL"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Структура БД</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            title="Экспорт выгрузки Neon DB в CSV/Excel"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Прайс CSV</span>
          </button>

          <button
            type="button"
            onClick={onToggleAddForm}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Добавить товар</span>
          </button>
        </div>
      </div>
    </div>
  );
};
