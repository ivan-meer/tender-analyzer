import React, { useState } from 'react';
import { ProductItem } from '../types';
import { SupplierSearchModal } from './SupplierSearchModal';
import { ProductSearchAgentModal } from './ProductSearchAgentModal';
import { getParameterIconConfig } from '../utils/paramIconSystem';
import { 
  Package, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Copy,
  Check,
  FileSpreadsheet,
  Ruler,
  Sliders,
  Globe,
  MapPin,
  Calendar,
  Bot,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProductListTableProps {
  products: ProductItem[];
}

type ProductSortField = 'name' | 'quantity' | 'status' | 'okpd';
type SortOrder = 'asc' | 'desc';

export const ProductListTable: React.FC<ProductListTableProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<ProductSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedProductForSearch, setSelectedProductForSearch] = useState<ProductItem | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // AI Agent Search Modal state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [selectedProductForAgent, setSelectedProductForAgent] = useState<ProductItem | null>(null);

  const handleSortToggle = (field: ProductSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenSearch = (product: ProductItem) => {
    setSelectedProductForSearch(product);
    setIsSearchModalOpen(true);
  };

  const handleOpenAgentSearch = (product?: ProductItem) => {
    setSelectedProductForAgent(product || null);
    setIsAgentModalOpen(true);
  };

  if (!products || products.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3 shadow-xs"
      >
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Package className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Спецификация и список продукции не обнаружены</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
          В загруженных файлах не найден явный перечень номенклатурных позиций. Загрузите файлы ТЗ или сметы в формате Excel (.xlsx) или таблицы Word.
        </p>
      </motion.div>
    );
  }

  const filteredProducts = products.filter(p => {
    const paramsText = p.parameters ? p.parameters.map(param => `${param.name} ${param.value}`).join(' ') : '';
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.dimensions && p.dimensions.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paramsText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.okpd2OrGvin && p.okpd2OrGvin.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && p.pp1875Status === statusFilter;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name, 'ru');
    } else if (sortField === 'quantity') {
      const numA = parseFloat(a.quantity) || 0;
      const numB = parseFloat(b.quantity) || 0;
      comparison = numA - numB;
    } else if (sortField === 'status') {
      comparison = (a.pp1875Status || '').localeCompare(b.pp1875Status || '', 'ru');
    } else if (sortField === 'okpd') {
      comparison = (a.okpd2OrGvin || '').localeCompare(b.okpd2OrGvin || '', 'ru');
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const [isCopiedAll, setIsCopiedAll] = useState(false);

  const handleCopyAllProducts = () => {
    if (!products || products.length === 0) return;
    const lines = products.map((p, idx) => {
      const params = p.parameters ? p.parameters.map(param => `${param.name}: ${param.value}`).join('; ') : '';
      return `${idx + 1}. ${p.name} | Кол-во: ${p.quantity} | Габариты: ${p.dimensions || 'По ТЗ'} | ОКПД2: ${p.okpd2OrGvin || '—'} | Нацрежим: ${p.pp1875Status === 'RUSSIAN_REQUIRED' ? 'Требуется РФ' : p.pp1875Status === 'RESTRICTED' ? 'Ограничение' : 'Без ограничений'}\nПараметры: ${params}\nОписание: ${p.specification}\n`;
    });
    navigator.clipboard.writeText(lines.join('\n---\n\n'));
    setIsCopiedAll(true);
    setTimeout(() => setIsCopiedAll(false), 2500);
  };

  const handleExportCsv = () => {
    if (!products || products.length === 0) return;
    const headers = ['№', 'Наименование', 'Количество', 'Габариты', 'Характеристики и параметры ТЗ', 'ОКПД2 / КТРУ', 'Статус ПП 1875'];
    const rows = products.map((p, idx) => {
      const params = p.parameters ? p.parameters.map(param => `${param.name}: ${param.value}`).join('; ') : '';
      const fullSpec = `"${(p.specification + (params ? ' | ' + params : '')).replace(/"/g, '""')}"`;
      return [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.quantity.replace(/"/g, '""')}"`,
        `"${(p.dimensions || '').replace(/"/g, '""')}"`,
        fullSpec,
        `"${(p.okpd2OrGvin || '').replace(/"/g, '""')}"`,
        `"${p.pp1875Status === 'RUSSIAN_REQUIRED' ? 'Требуется РФ' : p.pp1875Status === 'RESTRICTED' ? 'Ограничение' : 'Без ограничений'}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Спецификация_товаров_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyProduct = (product: ProductItem) => {
    let text = `Наименование: ${product.name}\nКоличество: ${product.quantity}\n`;
    if (product.dimensions) {
      text += `Габариты/Размеры: ${product.dimensions}\n`;
    }
    text += `Характеристики: ${product.specification}\n`;
    if (product.parameters && product.parameters.length > 0) {
      text += `Параметры из ТЗ:\n` + product.parameters.map(param => ` - ${param.name}: ${param.value}`).join('\n') + '\n';
    }
    if (product.okpd2OrGvin) {
      text += `ОКПД2/КТРУ: ${product.okpd2OrGvin}\n`;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(product.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: ProductItem['pp1875Status']) => {
    switch (status) {
      case 'RUSSIAN_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 px-2.5 py-1 rounded-lg shadow-2xs">
            <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            ПП РФ 1875: Требуется РФ
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 px-2.5 py-1 rounded-lg shadow-2xs">
            <Layers className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            ПП РФ 1875: Ограничение
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-lg shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Без ограничений
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            <HelpCircle className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            Не определено
          </span>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden space-y-0 transition-colors duration-200"
    >
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              Спецификация и Параметры Продукции ({products.length} позиций)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              Автоматическое извлечение наименований, габаритов, размеров и физико-технических параметров из ТЗ
            </p>
          </div>
        </div>

        {/* Filter & Search controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenAgentSearch()}
            className="flex items-center gap-1.5 text-xs font-extrabold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-cyan-950/20"
            title="Запустить ИИ-Агент для генерации промптов и поиска в сети по всей продукции"
          >
            <Bot className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>🤖 ИИ-Агент Поиска</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Экспортировать спецификацию в формате CSV (Excel)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Экспорт CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllProducts}
            className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Скопировать весь перечень позиций со спецификациями и параметрами в буфер обмена"
          >
            {isCopiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Скопировать всё</span>
              </>
            )}
          </button>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по наименованию, габаритам, ТЗ..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs transition-colors"
          >
            <option value="ALL">Все статусы ПП 1875</option>
            <option value="RUSSIAN_REQUIRED">Требуется РФ</option>
            <option value="RESTRICTED">Ограничение</option>
            <option value="NOT_APPLICABLE">Без ограничений</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 w-12 text-center">№</th>
              
              <th className="py-3 px-4 min-w-[200px]">
                <button
                  type="button"
                  onClick={() => handleSortToggle('name')}
                  className="flex items-center gap-1.5 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
                >
                  <span>Наименование продукции</span>
                  {sortField === 'name' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 w-28">
                <button
                  type="button"
                  onClick={() => handleSortToggle('quantity')}
                  className="flex items-center gap-1.5 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
                >
                  <span>Количество</span>
                  {sortField === 'quantity' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 min-w-[320px]">Размеры и Технические Параметры из ТЗ</th>

              <th className="py-3 px-4 w-32">
                <button
                  type="button"
                  onClick={() => handleSortToggle('okpd')}
                  className="flex items-center gap-1.5 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
                >
                  <span>ОКПД2 / КТРУ</span>
                  {sortField === 'okpd' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleSortToggle('status')}
                  className="flex items-center gap-1.5 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer group"
                >
                  <span>Нац. режим (ПП 1875)</span>
                  {sortField === 'status' ? (
                    sortOrder === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-50 group-hover:opacity-100" />
                  )}
                </button>
              </th>

              <th className="py-3 px-4 w-14 text-center">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                  По заданным фильтрам позиции не найдены.
                </td>
              </tr>
            ) : (
              sortedProducts.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-colors align-top">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 text-center">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white leading-snug">
                    {item.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold rounded-lg shadow-2xs">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 space-y-2">
                    {/* Item-level Delivery Address & Deadline callouts if present */}
                    {(item.deliveryAddress || item.deliveryDeadline) && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {item.deliveryAddress && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-lg text-[11px] font-bold">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>Адрес поставки: {item.deliveryAddress}</span>
                          </div>
                        )}
                        {item.deliveryDeadline && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-lg text-[11px] font-bold">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span>Срок поставки: {item.deliveryDeadline}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Highlighted Dimensions / Габариты Badge */}
                    {item.dimensions && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-lg text-[11px] font-extrabold">
                        <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Размеры/Габариты: {item.dimensions}</span>
                      </div>
                    )}

                    {/* Main specification text */}
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {item.specification}
                    </p>

                    {/* Extracted Structured Parameters Grid with Visual Icon System */}
                    {item.parameters && item.parameters.length > 0 && (
                      <div className="pt-1.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                          <Sliders className="w-3 h-3 text-indigo-500" />
                          <span>Параметры и требования ТЗ (система иконок):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.parameters.map((param, pIdx) => {
                            const iconConfig = getParameterIconConfig(param.name, param.value);
                            return (
                              <div 
                                key={pIdx} 
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border font-medium shadow-2xs transition-all hover:scale-102 ${iconConfig.bgClass} ${iconConfig.borderClass} ${iconConfig.textClass}`}
                              >
                                {iconConfig.icon}
                                <span className="font-bold opacity-80">{param.name}:</span>
                                <span className="font-extrabold">{param.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {item.okpd2OrGvin || '—'}
                  </td>
                  <td className="py-3.5 px-4 space-y-1">
                    <div>{getStatusBadge(item.pp1875Status)}</div>
                    {item.registryNumberNote && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                        {item.registryNumberNote}
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAgentSearch(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-95 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs"
                        title="Сгенерировать точечные ИИ-промпты и запустить Агент Поиска"
                      >
                        <Bot className="w-3.5 h-3.5 text-amber-300" />
                        <span className="hidden sm:inline">ИИ-Агент</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSearch(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
                        title="Найти заводские аналоги и поставщиков в РФ по параметрам ТЗ"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Поставщики</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyProduct(item)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition-all cursor-pointer"
                        title="Скопировать позицию со всеми параметрами"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Supplier Search Modal */}
      <SupplierSearchModal
        key={selectedProductForSearch?.id || selectedProductForSearch?.name || 'search-modal'}
        product={selectedProductForSearch}
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* AI Product Search Agent Modal */}
      <ProductSearchAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        procurementProducts={products}
        initialSelectedProduct={selectedProductForAgent}
      />
    </motion.div>
  );
};
