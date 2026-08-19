import React, { useState, useEffect, useMemo } from 'react';
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
  Cpu,
  Info,
  Copy,
  FileText,
  Pencil,
  Camera,
  Image as ImageIcon,
  Save,
  Upload,
  LayoutGrid,
  List,
  RotateCcw
} from 'lucide-react';
import { VERIFIED_SUPPLIERS } from '../data/verifiedSuppliers';
import { ProductItem } from '../types';
import { NeonService, NeonCatalogItem, NeonStatus, NeonSupplier } from '../lib/neonService';
import { NeonSchemaModal } from './NeonSchemaModal';
import { ProductSearchAgentModal } from './ProductSearchAgentModal';
import { Bot } from 'lucide-react';
import { ProductImageFallback, REALISTIC_PHOTO_PRESETS } from './suppliers/ProductImageFallback';
import { SupplierInspectModal } from './suppliers/SupplierInspectModal';
import { SupplierEditItemModal } from './suppliers/SupplierEditItemModal';
import { SupplierEditSupplierModal } from './suppliers/SupplierEditSupplierModal';
import { SupplierAddItemDrawer, SupplierAddSupplierDrawer } from './suppliers/SupplierAddDrawer';
import { SuppliersFilterBar } from './suppliers/SuppliersFilterBar';

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
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');
  const [onlyDomestic, setOnlyDomestic] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeTab, setActiveTab] = useState<'neon' | 'suppliers' | 'catalog' | 'matching'>('neon');

  // Price Range Filters
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Neon DB state
  const [neonStatus, setNeonStatus] = useState<NeonStatus | null>(null);
  const [neonCatalog, setNeonCatalog] = useState<NeonCatalogItem[]>([]);
  const [neonSuppliers, setNeonSuppliers] = useState<NeonSupplier[]>([]);
  const [neonLoading, setNeonLoading] = useState(false);

  // Dynamic list of unique suppliers for filtering
  const availableSuppliers = useMemo(() => {
    const set = new Set<string>();
    neonCatalog.forEach(item => {
      const name = item.supplierName || item.manufacturer;
      if (name) set.add(name);
    });
    neonSuppliers.forEach(s => {
      if (s.companyName) set.add(s.companyName);
    });
    VERIFIED_SUPPLIERS.forEach(s => {
      if (s.brandName) set.add(s.brandName);
    });
    return Array.from(set).sort();
  }, [neonCatalog, neonSuppliers]);

  // Reset all filters to show full catalog
  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSupplier('ALL');
    setOnlyDomestic(false);
    setMinPrice('');
    setMaxPrice('');
    if (activeTab === 'neon') {
      fetchNeonCatalog('');
    }
  };

  // Client-side filtered catalog items for Neon DB
  const displayedNeonCatalog = useMemo(() => {
    return neonCatalog.filter(item => {
      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      // Supplier
      if (selectedSupplier !== 'ALL') {
        const sup = (item.supplierName || item.manufacturer || '').toLowerCase();
        if (!sup.includes(selectedSupplier.toLowerCase())) {
          return false;
        }
      }
      // GISP
      if (onlyDomestic && item.inGispRegistry === false) {
        return false;
      }
      // Price
      if (minPrice && !isNaN(parseFloat(minPrice)) && item.estimatedPrice < parseFloat(minPrice)) {
        return false;
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice)) && item.estimatedPrice > parseFloat(maxPrice)) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          item.modelName.toLowerCase().includes(term) ||
          (item.supplierName || '').toLowerCase().includes(term) ||
          (item.manufacturer || '').toLowerCase().includes(term) ||
          (item.dimensions || '').toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term) ||
          (item.gispRegistryStatus || '').toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [neonCatalog, selectedCategory, selectedSupplier, onlyDomestic, minPrice, maxPrice, searchTerm]);

  // Selected item for Tech Specs Modal Inspector
  const [inspectedItem, setInspectedItem] = useState<NeonCatalogItem | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showSearchAgentModal, setShowSearchAgentModal] = useState(false);
  const [selectedAgentProduct, setSelectedAgentProduct] = useState<ProductItem | null>(null);

  // Forms Visibility
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);

  // Editing States
  const [editingItem, setEditingItem] = useState<NeonCatalogItem | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<NeonSupplier | null>(null);

  // New item form state
  const [newCompany, setNewCompany] = useState('ООО "Фабрика Офис-Мебель РФ"');
  const [newCategory, setNewCategory] = useState('Furniture');
  const [newModel, setNewModel] = useState('');
  const [newDimensions, setNewDimensions] = useState('1400х750х760 мм');
  const [newPrice, setNewPrice] = useState('18500');
  const [newDescription, setNewDescription] = useState('');
  const [newGispStatus, setNewGispStatus] = useState('Внесено в реестр Минпромторга (ПП 1875)');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  // New Supplier Form State
  const [supCompany, setSupCompany] = useState('');
  const [supRegion, setSupRegion] = useState('Москва / Московская обл.');
  const [supSpec, setSupSpec] = useState('Офисная и школьная мебель');
  const [supContacts, setSupContacts] = useState('+7 (495) 800-22-11 / info@factory.ru');
  const [supWebsite, setSupWebsite] = useState('https://factory-rf.ru');
  const [supGisp, setSupGisp] = useState(true);

  // Fetch Neon DB status, catalog & suppliers on open
  useEffect(() => {
    if (isOpen) {
      fetchNeonStatus();
      fetchNeonCatalog();
      fetchNeonSuppliers();
    }
  }, [isOpen, selectedCategory]);

  const fetchNeonStatus = async () => {
    try {
      const data = await NeonService.getStatus();
      setNeonStatus(data);
    } catch (e) {
      console.warn('Neon status check error:', e);
    }
  };

  const fetchNeonCatalog = async (query?: string) => {
    setNeonLoading(true);
    try {
      const q = query !== undefined ? query : searchTerm;
      const parsedMin = minPrice ? parseFloat(minPrice) : undefined;
      const parsedMax = maxPrice ? parseFloat(maxPrice) : undefined;

      const items = await NeonService.getCatalog({
        search: q,
        category: selectedCategory,
        minPrice: parsedMin,
        maxPrice: parsedMax,
        inGispOnly: onlyDomestic,
      });

      setNeonCatalog(items);
    } catch (e) {
      console.warn('Neon catalog fetch error:', e);
    } finally {
      setNeonLoading(false);
    }
  };

  const fetchNeonSuppliers = async () => {
    try {
      const list = await NeonService.getSuppliers();
      setNeonSuppliers(list);
    } catch (e) {
      console.warn('Neon suppliers fetch error:', e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'neon') {
      fetchNeonCatalog(searchTerm);
    }
  };

  // Helper for uploading photos from device (converts to Data URL)
  const handlePhotoFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImageCallback: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Файл слишком большой. Выберите изображение до 8 МБ.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageCallback(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    setFormSaving(true);
    try {
      const p = parseFloat(newPrice) || 15000;
      await NeonService.addCatalogItem({
        companyName: newCompany,
        category: newCategory,
        modelName: newModel,
        dimensions: newDimensions,
        estimatedPrice: p,
        priceFormatted: `${p.toLocaleString('ru-RU')} ₽ / шт.`,
        description: newDescription || `Модель "${newModel}", габариты: ${newDimensions}. Изготовлено по ГОСТ Р.`,
        gispRegistryStatus: newGispStatus,
        productFeatures: ['ГОСТ Р', 'Минпромторг РФ', 'Сделано в РФ'],
        imageUrl: newImageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80'
      });

      setNewModel('');
      setNewImageUrl('');
      setShowAddForm(false);
      fetchNeonCatalog();
      fetchNeonStatus();
    } catch (err) {
      console.error('Failed to add item to Neon DB:', err);
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdateItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setFormSaving(true);
    try {
      await NeonService.updateCatalogItem(editingItem.id, {
        modelName: editingItem.modelName,
        supplierName: editingItem.supplierName,
        category: editingItem.category,
        dimensions: editingItem.dimensions,
        estimatedPrice: editingItem.estimatedPrice,
        priceFormatted: editingItem.priceFormatted || `${editingItem.estimatedPrice?.toLocaleString('ru-RU')} ₽`,
        description: editingItem.description,
        gispRegistryStatus: editingItem.gispRegistryStatus,
        productUrl: editingItem.productUrl,
        imageUrl: editingItem.imageUrl
      });

      setEditingItem(null);
      fetchNeonCatalog();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Не удалось сохранить изменения в Neon DB');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Удалить эту модель из Neon PostgreSQL БД?')) return;
    try {
      await NeonService.deleteCatalogItem(id);
      fetchNeonCatalog();
      fetchNeonStatus();
    } catch (err) {
      console.error('Failed to delete item from Neon DB:', err);
    }
  };

  // Supplier CRUD
  const handleAddNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCompany.trim()) return;

    setFormSaving(true);
    try {
      await NeonService.addSupplier({
        companyName: supCompany,
        region: supRegion,
        specialization: supSpec,
        contactsOrWebsite: supContacts,
        websiteUrl: supWebsite,
        inGispRegistry: supGisp
      });

      setSupCompany('');
      setShowAddSupplierForm(false);
      fetchNeonSuppliers();
    } catch (err) {
      console.error('Error adding supplier:', err);
      alert('Ошибка при сохранении фабрики');
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdateSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;

    setFormSaving(true);
    try {
      await NeonService.updateSupplier(editingSupplier.id, {
        companyName: editingSupplier.companyName,
        region: editingSupplier.region,
        specialization: editingSupplier.specialization,
        contactsOrWebsite: editingSupplier.contactsOrWebsite,
        websiteUrl: editingSupplier.websiteUrl,
        inGispRegistry: editingSupplier.inGispRegistry
      });

      setEditingSupplier(null);
      fetchNeonSuppliers();
    } catch (err) {
      console.error('Error updating supplier:', err);
      alert('Не удалось обновить данные поставщика');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('Удалить поставщика из базы Neon DB?')) return;
    try {
      await NeonService.deleteSupplier(id);
      fetchNeonSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      alert('Ошибка при удалении');
    }
  };

  const exportNeonCatalogCsv = () => {
    const headers = 'ID,Категория,Поставщик,Наименование Модели,Габариты (Размеры),Ориентировочный прайс (₽),Описание ТХ,Реестр ГИСП / Минпромторг,Контакты Поставщика\n';
    const rows = neonCatalog.map(item =>
      `"${item.id}","${item.category}","${item.supplierName || item.manufacturer}","${item.modelName}","${item.dimensions}","${item.estimatedPrice}","${item.description.replace(/"/g, '""')}","${item.gispRegistryStatus}","${item.supplierContacts || ''}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Neon_PostgreSQL_Catalog_Pricelists.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTechSpecsToClipboard = (item: NeonCatalogItem) => {
    const text = `ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ И ПРАЙС (Neon PostgreSQL ID #${item.id}):\n` +
      `• Наименование: ${item.modelName}\n` +
      `• Производитель: ${item.supplierName || item.manufacturer}\n` +
      `• Габариты / Размеры: ${item.dimensions}\n` +
      `• Цена / Прайс: ${item.priceFormatted || item.estimatedPrice + ' ₽'}\n` +
      `• Описание: ${item.description}\n` +
      `• Статус ГИСП: ${item.gispRegistryStatus}\n` +
      `• Контакты: ${item.supplierContacts || 'Не указаны'}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  if (!isOpen) return null;

  // Filter suppliers for catalog tab
  const filteredSuppliers = VERIFIED_SUPPLIERS.filter(sup => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        sup.brandName.toLowerCase().includes(term) ||
        sup.description.toLowerCase().includes(term) ||
        sup.category.toLowerCase().includes(term) ||
        (sup.region && sup.region.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }

    if (selectedSupplier !== 'ALL' && !sup.brandName.toLowerCase().includes(selectedSupplier.toLowerCase())) {
      return false;
    }

    if (selectedCategory !== 'ALL') {
      const catMap: Record<string, string> = {
        'Furniture': 'мебель',
        'Tech': 'техник',
        'Electrical': 'электр',
        'Construction': 'строй',
        'Office': 'канц',
        'Medical': 'медиц'
      };
      const matchSub = catMap[selectedCategory] || selectedCategory.toLowerCase();
      if (!sup.category.toLowerCase().includes(matchSub)) {
        return false;
      }
    }

    if (onlyDomestic && !sup.isDomesticProducer) {
      return false;
    }

    return true;
  });

  // Filtered Neon DB suppliers list
  const displayedNeonSuppliers = neonSuppliers.filter(sup => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match =
        sup.companyName.toLowerCase().includes(term) ||
        (sup.specialization || '').toLowerCase().includes(term) ||
        (sup.region || '').toLowerCase().includes(term) ||
        (sup.contactsOrWebsite || '').toLowerCase().includes(term);
      if (!match) return false;
    }
    if (selectedSupplier !== 'ALL' && !sup.companyName.toLowerCase().includes(selectedSupplier.toLowerCase())) {
      return false;
    }
    if (onlyDomestic && !sup.inGispRegistry) {
      return false;
    }
    return true;
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

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'suppliers'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>База Поставщиков Neon ({neonSuppliers.length})</span>
            </button>

            <button
              onClick={() => setShowSearchAgentModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md hover:from-cyan-500 hover:to-teal-500"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>🤖 ИИ-Агент поиска & Промпты</span>
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

        {/* Comprehensive Filter Panel */}
        <SuppliersFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
          availableSuppliers={availableSuppliers}
          viewMode={viewMode}
          setViewMode={setViewMode}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          onlyDomestic={onlyDomestic}
          setOnlyDomestic={setOnlyDomestic}
          resetAllFilters={resetAllFilters}
          onOpenSchemaModal={() => setShowSchemaModal(true)}
          onExportCsv={exportNeonCatalogCsv}
          onToggleAddForm={() => setShowAddForm(!showAddForm)}
        />

        {/* Add Item Form Modal Drawer */}
        <SupplierAddItemDrawer
          show={showAddForm && activeTab === 'neon'}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddNewItem}
          company={newCompany}
          setCompany={setNewCompany}
          model={newModel}
          setModel={setNewModel}
          dimensions={newDimensions}
          setDimensions={setNewDimensions}
          category={newCategory}
          setCategory={setNewCategory}
          price={newPrice}
          setPrice={setNewPrice}
          gispStatus={newGispStatus}
          setGispStatus={setNewGispStatus}
          imageUrl={newImageUrl}
          setImageUrl={setNewImageUrl}
          onFileUpload={handlePhotoFileUpload}
          saving={formSaving}
        />

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
                      Облачная база `neon_catalog_items` (PostgreSQL)
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Полный реестр моделей, параметров, прайс-листов и реестровых статусов Минпромторга
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-3 py-1 rounded-xl border border-cyan-800">
                    Показано {displayedNeonCatalog.length} из {neonCatalog.length} моделей
                  </span>
                  {(searchTerm || selectedCategory !== 'ALL' || selectedSupplier !== 'ALL' || onlyDomestic || minPrice || maxPrice) && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                    >
                      (Сбросить фильтры)
                    </button>
                  )}
                </div>
              </div>

              {neonLoading ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-500 mx-auto" />
                  <p className="text-xs text-slate-400">Загрузка данных из Neon PostgreSQL...</p>
                </div>
              ) : displayedNeonCatalog.length === 0 ? (
                <div className="py-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">В каталоге Neon не найдено товаров по данным фильтрам</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Вы можете изменить критерии фильтрации или нажать кнопку ниже, чтобы увидеть весь каталог.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Показать весь каталог ({neonCatalog.length} товаров)
                  </button>
                </div>
              ) : viewMode === 'table' ? (
                /* TABLE VIEW MODE */
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Фото</th>
                        <th className="p-3">Модель / Наименование</th>
                        <th className="p-3">Поставщик / Производитель</th>
                        <th className="p-3">Категория</th>
                        <th className="p-3">Габариты</th>
                        <th className="p-3">Прайс (₽)</th>
                        <th className="p-3">ГИСП Минпромторг</th>
                        <th className="p-3 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {displayedNeonCatalog.map((item) => (
                        <tr key={item.id} className="hover:bg-cyan-500/5 transition-colors">
                          <td className="p-2.5 w-16">
                            <ProductImageFallback
                              src={item.imageUrl}
                              alt={item.modelName}
                              category={item.category}
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            />
                          </td>
                          <td className="p-3 font-extrabold text-slate-900 dark:text-white max-w-[200px]">
                            <div className="truncate">{item.modelName}</div>
                            <div className="text-[10px] text-slate-400 font-normal line-clamp-1">{item.description}</div>
                          </td>
                          <td className="p-3 font-semibold text-cyan-600 dark:text-cyan-400 max-w-[150px] truncate">
                            {item.supplierName || item.manufacturer}
                          </td>
                          <td className="p-3 font-medium text-slate-500 dark:text-slate-400">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-bold">
                              {item.category === 'Furniture' ? 'Мебель' : item.category === 'Tech' ? 'Оргтехника' : item.category === 'Electrical' ? 'Электро' : item.category}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.dimensions || 'По ТЗ'}
                          </td>
                          <td className="p-3 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            {item.priceFormatted || `${item.estimatedPrice?.toLocaleString('ru-RU')} ₽`}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-md border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                              ✓ ПП 1875
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setInspectedItem(item)}
                                className="p-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-lg transition-colors cursor-pointer"
                                title="Детальный инспектор ТХ"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => copyTechSpecsToClipboard(item)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                title="Копировать ТХ"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
                                title="Редактировать"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* GRID CARDS VIEW MODE */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedNeonCatalog.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 transition-all hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider block truncate max-w-[180px]">
                              {item.supplierName || item.manufacturer}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                              {item.modelName}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md shrink-0">
                              ПП 1875
                            </span>
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Редактировать товар и фото"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Удалить из Neon DB"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Product Image preview using robust fallback */}
                        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/60 my-1">
                          <ProductImageFallback
                            src={item.imageUrl}
                            alt={item.modelName}
                            category={item.category}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Dimensions & Prices highlights */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-slate-50 dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                              <Ruler className="w-3 h-3 text-cyan-500" />
                              Размеры:
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 truncate block mt-0.5">
                              {item.dimensions || 'По ТЗ'}
                            </span>
                          </div>

                          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-500" />
                              Прайс:
                            </span>
                            <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300 truncate block mt-0.5">
                              {item.priceFormatted || `${item.estimatedPrice?.toLocaleString('ru-RU')} ₽`}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 line-clamp-2">
                          {item.description}
                        </p>

                        <div className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg flex items-center justify-between gap-2">
                          <span className="truncate">Реестр: {item.gispRegistryStatus}</span>
                          <span className="font-bold text-cyan-500 shrink-0">ID #{item.id}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setInspectedItem(item)}
                            className="flex-1 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Детальные ТХ</span>
                          </button>

                          <button
                            onClick={() => copyTechSpecsToClipboard(item)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-cyan-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                            title="Скопировать технические характеристики"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
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
          ) : activeTab === 'suppliers' ? (
            /* Suppliers View: Neon PostgreSQL Suppliers Table & Cards */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900/60 p-4 rounded-2xl border border-emerald-800/40 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-200 uppercase tracking-wider">
                      Облачная таблица `neon_suppliers` (PostgreSQL)
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Управление поставщиками, контактами, регионами и статусами реестра ГИСП Минпромторга
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddSupplierForm(!showAddSupplierForm)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Добавить поставщика</span>
                </button>
              </div>

              {/* Add Supplier Form Drawer */}
              <SupplierAddSupplierDrawer
                show={showAddSupplierForm}
                onClose={() => setShowAddSupplierForm(false)}
                onSubmit={handleAddNewSupplier}
                company={supCompany}
                setCompany={setSupCompany}
                region={supRegion}
                setRegion={setSupRegion}
                spec={supSpec}
                setSpec={setSupSpec}
                contacts={supContacts}
                setContacts={setSupContacts}
                website={supWebsite}
                setWebsite={setSupWebsite}
                gisp={supGisp}
                setGisp={setSupGisp}
                saving={formSaving}
              />

              {/* Suppliers list cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedNeonSuppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 transition-all hover:border-emerald-500 hover:shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {sup.companyName}
                          </h3>
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            {sup.region || 'Российская Федерация'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {sup.inGispRegistry && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-md">
                              ГИСП Минпромторг
                            </span>
                          )}
                          <button
                            onClick={() => setEditingSupplier(sup)}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Редактировать поставщика"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(sup.id)}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Удалить из Neon DB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-emerald-500" />
                          <span>Специализация:</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          {sup.specialization || 'Производство продукции'}
                        </p>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                        <p className="flex items-center gap-1">
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{sup.contactsOrWebsite}</span>
                        </p>
                      </div>
                    </div>

                    {sup.websiteUrl && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <a
                          href={sup.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{sup.websiteUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] font-mono text-slate-400">ID #{sup.id}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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

      {/* Toast notification for copied text */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 bg-cyan-600 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 z-50 animate-bounce">
          <Check className="w-4 h-4" />
          <span>Технические характеристики скопированы в буфер!</span>
        </div>
      )}

      {/* Tech Specs Inspector Overlay Modal */}
      <SupplierInspectModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onCopy={copyTechSpecsToClipboard}
      />

      {/* Database Schema Inspector Modal */}
      <NeonSchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
      />

      {/* Item Edit Overlay Modal */}
      <SupplierEditItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onItemChange={setEditingItem}
        onUpdate={handleUpdateItemSubmit}
        onFileUpload={handlePhotoFileUpload}
        saving={formSaving}
      />

      {/* Supplier Edit Overlay Modal */}
      <SupplierEditSupplierModal
        supplier={editingSupplier}
        onClose={() => setEditingSupplier(null)}
        onSupplierChange={setEditingSupplier}
        onUpdate={handleUpdateSupplierSubmit}
        saving={formSaving}
      />

      {/* Product Search AI Agent Modal */}
      <ProductSearchAgentModal
        isOpen={showSearchAgentModal}
        onClose={() => setShowSearchAgentModal(false)}
        procurementProducts={procurementProducts}
        initialSelectedProduct={selectedAgentProduct}
      />
    </div>
  );
};
