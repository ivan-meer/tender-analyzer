import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Database,
  Plus,
  Trash2,
  RefreshCw,
  DollarSign,
  Globe,
  Check,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/verifiedSuppliers';
import { ProductItem } from '../types';

interface NeonCatalogItem {
  id: number;
  category: string;
  modelName: string;
  manufacturer: string;
  country: string;
  dimensions: string;
  estimatedPrice: number;
  priceFormatted: string;
  description: string;
  gispRegistryStatus: string;
  productUrl: string;
  imageUrl: string;
  productFeatures: string[];
  supplierName: string;
  supplierContacts?: string;
  supplierWebsite?: string;
  inGispRegistry?: boolean;
}

interface NeonStatus {
  status: string;
  database: string;
  host: string;
  suppliersCount: number;
  itemsCount: number;
  currentTime?: string;
}

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
  const [activeTab, setActiveTab] = useState<'neon' | 'catalog' | 'matching'>('neon');

  // Neon DB state
  const [neonStatus, setNeonStatus] = useState<NeonStatus | null>(null);
  const [neonCatalog, setNeonCatalog] = useState<NeonCatalogItem[]>([]);
  const [neonLoading, setNeonLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New item form state
  const [newCompany, setNewCompany] = useState('ООО "Фабрика Офис-Мебель РФ"');
  const [newCategory, setNewCategory] = useState('Furniture');
  const [newModel, setNewModel] = useState('');
  const [newDimensions, setNewDimensions] = useState('1400х750х760 мм');
  const [newPrice, setNewPrice] = useState('18500');
  const [newDescription, setNewDescription] = useState('');
  const [newGispStatus, setNewGispStatus] = useState('Внесено в реестр Минпромторга (ПП 1875)');
  const [formSaving, setFormSaving] = useState(false);

  // Fetch Neon DB status & catalog on open
  useEffect(() => {
    if (isOpen) {
      fetchNeonStatus();
      fetchNeonCatalog();
    }
  }, [isOpen, selectedCategory]);

  const fetchNeonStatus = async () => {
    try {
      const res = await fetch('/api/neon/status');
      if (res.ok) {
        const data = await res.json();
        setNeonStatus(data);
      }
    } catch (e) {
      console.warn('Neon status check error:', e);
    }
  };

  const fetchNeonCatalog = async (query?: string) => {
    setNeonLoading(true);
    try {
      const q = query !== undefined ? query : searchTerm;
      const url = new URL('/api/neon/catalog', window.location.origin);
      if (q) url.searchParams.set('search', q);
      if (selectedCategory !== 'ALL') url.searchParams.set('category', selectedCategory);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNeonCatalog(data);
      }
    } catch (e) {
      console.warn('Neon catalog fetch error:', e);
    } finally {
      setNeonLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'neon') {
      fetchNeonCatalog(searchTerm);
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    setFormSaving(true);
    try {
      const res = await fetch('/api/neon/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newCompany,
          category: newCategory,
          modelName: newModel,
          dimensions: newDimensions,
          estimatedPrice: parseFloat(newPrice) || 15000,
          priceFormatted: `${(parseFloat(newPrice) || 15000).toLocaleString('ru-RU')} ₽ / шт.`,
          description: newDescription || `Модель "${newModel}", размеры: ${newDimensions}. Изготовлено по ГОСТ Р.`,
          gispRegistryStatus: newGispStatus,
          productFeatures: ['ГОСТ Р', 'Минпромторг РФ', 'Сделано в РФ']
        }),
      });

      if (res.ok) {
        setNewModel('');
        setShowAddForm(false);
        fetchNeonCatalog();
        fetchNeonStatus();
      }
    } catch (err) {
      console.error('Failed to add item to Neon DB:', err);
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Удалить эту модель из Neon PostgreSQL БД?')) return;
    try {
      const res = await fetch(`/api/neon/catalog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchNeonCatalog();
        fetchNeonStatus();
      }
    } catch (err) {
      console.error('Failed to delete item from Neon DB:', err);
    }
  };

  if (!isOpen) return null;

  // Filter suppliers for catalog tab
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
            <div className="p-2.5 bg-cyan-500/20 rounded-2xl border border-cyan-500/30 text-cyan-400">
              <Database className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">База поставщиков, размеры и прайсы (Neon PostgreSQL)</h2>
                {neonStatus?.status === 'connected' ? (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Neon DB Подключена ({neonStatus.itemsCount} каталогов)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                    Подключение...
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Интеграция облачной базы данных Neon PostgreSQL с размерами, прайс-листами и фасонными чертежами
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

        {/* Tab Switcher & Status Pill */}
        <div className="bg-slate-100 dark:bg-slate-950 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('neon')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'neon'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-cyan-300" />
              <span>Neon PostgreSQL БД ({neonCatalog.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Реестр фабрик РФ ({VERIFIED_SUPPLIERS.length})</span>
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
                <span>Привязка к ТЗ ({procurementProducts.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline">Host: neondb-pooler.us-east-1.aws</span>
            <button
              onClick={() => { fetchNeonStatus(); fetchNeonCatalog(); }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-indigo-500 transition-colors cursor-pointer"
              title="Обновить данные из Neon DB"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${neonLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar & Action buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeTab === 'neon') fetchNeonCatalog(e.target.value);
                }}
                placeholder="Поиск в Neon БД по названию, размерам (1400х750), цене, ГОСТ или бренду..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </form>

          {activeTab === 'neon' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="ALL">Все категории</option>
                <option value="Furniture">Мебель и столы</option>
                <option value="Tech">Оргтехника и ПК</option>
                <option value="Electrical">Электротехника</option>
                <option value="Construction">Стройматериалы</option>
                <option value="Office">Канцелярия</option>
                <option value="Medical">Медицина</option>
              </select>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить товар в Neon БД</span>
              </button>
            </div>
          )}
        </div>

        {/* Add Item Form Modal Drawer */}
        {showAddForm && activeTab === 'neon' && (
          <form onSubmit={handleAddNewItem} className="p-4 bg-cyan-950/20 border-b border-cyan-800/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Database className="w-4 h-4" />
                Новая карточка в Neon PostgreSQL (Каталог, Габариты, Прайс)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Отмена
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Компания / Поставщик:</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder='ООО "Фабрика Офис-Мебель РФ"'
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Название модели / ТЗ:</label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder='Стол рабочий "Серия Элит"'
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Размеры / Габариты (мм):</label>
                <input
                  type="text"
                  required
                  value={newDimensions}
                  onChange={(e) => setNewDimensions(e.target.value)}
                  placeholder="1400х750х760 мм"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Категория:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="Furniture">Мебель</option>
                  <option value="Tech">Оргтехника</option>
                  <option value="Electrical">Электротехника</option>
                  <option value="Construction">Стройматериалы</option>
                  <option value="Office">Канцелярия</option>
                  <option value="Medical">Медицина</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Ориентировочная цена (₽):</label>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="18500"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Статус ГИСП Минпромторг:</label>
                <input
                  type="text"
                  value={newGispStatus}
                  onChange={(e) => setNewGispStatus(e.target.value)}
                  placeholder="Внесено в реестр Минпромторга (ПП 1875)"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={formSaving}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{formSaving ? 'Сохранение в Neon DB...' : 'Сохранить в Neon PostgreSQL'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'neon' ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900/60 p-4 rounded-2xl border border-cyan-800/40 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-cyan-200 uppercase tracking-wider">
                      Облачная таблица `neon_catalog_items` (PostgreSQL)
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Хранение габаритов, описаний, прайс-листов и реестровых статусов с мгновенным подбором для 223-ФЗ
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-xl border border-cyan-800">
                  Всего моделей: {neonCatalog.length}
                </span>
              </div>

              {neonLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-500 mx-auto" />
                  <p className="text-xs text-slate-400">Загрузка данных из Neon PostgreSQL...</p>
                </div>
              ) : neonCatalog.length === 0 ? (
                <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">В Neon PostgreSQL не найдено позиций по запросу</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Вы можете добавить новую позицию или нажать кнопку сброса поиска.
                  </p>
                  <button
                    onClick={() => { setSearchTerm(''); setSelectedCategory('ALL'); fetchNeonCatalog(''); }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Показать весь каталог Neon DB
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {neonCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 transition-all hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider block">
                              Поставщик: {item.supplierName || item.manufacturer}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {item.modelName}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md shrink-0">
                              ПП 1875
                            </span>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Удалить из Neon DB"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Dimensions & Prices highlights */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-slate-50 dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                              <Ruler className="w-3 h-3 text-cyan-500" />
                              Габариты / Размеры:
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                              {item.dimensions || 'По ТЗ'}
                            </span>
                          </div>

                          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-500" />
                              Прайс / Стоимость:
                            </span>
                            <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300 truncate block mt-0.5">
                              {item.priceFormatted || `${item.estimatedPrice?.toLocaleString('ru-RU')} ₽`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                          {item.description}
                        </p>

                        <div className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg flex items-center justify-between gap-2">
                          <span className="truncate">Реестр: {item.gispRegistryStatus}</span>
                          <span className="font-bold text-cyan-500 shrink-0">Neon DB ID #{item.id}</span>
                        </div>
                      </div>

                      {item.supplierContacts && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 truncate">
                            <PhoneCall className="w-3 h-3 text-cyan-500 shrink-0" />
                            {item.supplierContacts}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'catalog' ? (
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
                Каждая позиция из Вашего ТЗ сопоставляется с моделями из реестра отечественных производителей и облачной базы Neon PostgreSQL.
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
                        Рекомендуемые проверенные поставщики из нашей базы и Neon DB:
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
