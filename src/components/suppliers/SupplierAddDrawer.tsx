import React from 'react';
import { Database, Building2, Camera, Upload, Save } from 'lucide-react';
import { REALISTIC_PHOTO_PRESETS } from './ProductImageFallback';

interface SupplierAddItemDrawerProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  company: string;
  setCompany: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  dimensions: string;
  setDimensions: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  gispStatus: string;
  setGispStatus: (v: string) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  saving: boolean;
}

export const SupplierAddItemDrawer: React.FC<SupplierAddItemDrawerProps> = ({
  show,
  onClose,
  onSubmit,
  company,
  setCompany,
  model,
  setModel,
  dimensions,
  setDimensions,
  category,
  setCategory,
  price,
  setPrice,
  gispStatus,
  setGispStatus,
  imageUrl,
  setImageUrl,
  onFileUpload,
  saving,
}) => {
  if (!show) return null;

  return (
    <form onSubmit={onSubmit} className="p-4 bg-cyan-950/20 border-b border-cyan-800/40 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
          <Database className="w-4 h-4" />
          Новая карточка в Neon PostgreSQL (Каталог, Габариты, Прайс)
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
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
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder='ООО "Фабрика Офис-Мебель РФ"'
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Название модели / ТЗ:</label>
          <input
            type="text"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder='Стол рабочий "Серия Элит"'
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Размеры / Габариты (мм):</label>
          <input
            type="text"
            required
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            placeholder="1400х750х760 мм"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Категория:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="18500"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Статус ГИСП Минпромторг:</label>
          <input
            type="text"
            value={gispStatus}
            onChange={(e) => setGispStatus(e.target.value)}
            placeholder="Внесено в реестр Минпромторга (ПП 1875)"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
          />
        </div>

        <div className="col-span-1 sm:col-span-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 space-y-2">
          <label className="text-[10px] font-bold text-cyan-400 block flex items-center gap-1">
            <Camera className="w-3 h-3" />
            Фотография / Изображение товара (Ссылка или Загрузка файла):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... или выберите пресет ниже"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
            />
            <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>Загрузить фото</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFileUpload(e, (url) => setImageUrl(url))}
              />
            </label>
          </div>

          {/* Preset Photo Selector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-bold block w-full">Реалистичные пресеты фото:</span>
            {REALISTIC_PHOTO_PRESETS.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setImageUrl(preset.url)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                📷 {preset.name}
              </button>
            ))}
          </div>

          {imageUrl && (
            <div className="flex items-center gap-2 pt-1">
              <img src={imageUrl} alt="Превью" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
              <span className="text-[10px] text-emerald-400 font-bold">✓ Изображение готово к сохранению</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-cyan-900/50">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Сохранение...' : 'Сохранить товар в Neon DB'}</span>
        </button>
      </div>
    </form>
  );
};

interface SupplierAddSupplierDrawerProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  company: string;
  setCompany: (v: string) => void;
  region: string;
  setRegion: (v: string) => void;
  spec: string;
  setSpec: (v: string) => void;
  contacts: string;
  setContacts: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  gisp: boolean;
  setGisp: (v: boolean) => void;
  saving: boolean;
}

export const SupplierAddSupplierDrawer: React.FC<SupplierAddSupplierDrawerProps> = ({
  show,
  onClose,
  onSubmit,
  company,
  setCompany,
  region,
  setRegion,
  spec,
  setSpec,
  contacts,
  setContacts,
  website,
  setWebsite,
  gisp,
  setGisp,
  saving,
}) => {
  if (!show) return null;

  return (
    <form onSubmit={onSubmit} className="p-4 bg-emerald-950/30 border border-emerald-800/60 rounded-2xl space-y-3 animate-fadeIn">
      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
        <Building2 className="w-4 h-4" />
        Новая фабрика / поставщик в Neon PostgreSQL
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Название компании:</label>
          <input
            type="text"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder='ООО "Фабрика Офисной Мебели"'
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Регион / Город:</label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Москва / Московская обл."
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Специализация:</label>
          <input
            type="text"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="Офисная и школьная мебель"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Контакты (Тел / Email):</label>
          <input
            type="text"
            value={contacts}
            onChange={(e) => setContacts(e.target.value)}
            placeholder="+7 (495) 123-45-67 / info@factory.ru"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">Сайт:</label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://factory.ru"
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
          />
        </div>

        <div className="flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="drawerSupGisp"
            checked={gisp}
            onChange={(e) => setGisp(e.target.checked)}
            className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
          />
          <label htmlFor="drawerSupGisp" className="text-xs text-slate-300 font-bold cursor-pointer">
            Внесено в реестр Минпромторга (ПП 1875)
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-emerald-900/50">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Сохранение...' : 'Сохранить фабрику'}</span>
        </button>
      </div>
    </form>
  );
};
