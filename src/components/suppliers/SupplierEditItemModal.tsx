import React from 'react';
import { X, Pencil, Camera, Upload, Save } from 'lucide-react';
import { NeonCatalogItem } from '../../lib/neonService';

interface SupplierEditItemModalProps {
  item: NeonCatalogItem | null;
  onClose: () => void;
  onUpdate: (e: React.FormEvent) => void;
  onItemChange: (updated: NeonCatalogItem) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  saving: boolean;
}

export const SupplierEditItemModal: React.FC<SupplierEditItemModalProps> = ({
  item,
  onClose,
  onUpdate,
  onItemChange,
  onFileUpload,
  saving,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <form
        onSubmit={onUpdate}
        className="bg-slate-900 border border-cyan-700 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 space-y-4 text-white"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Редактирование товара (Neon DB #{item.id})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Наименование модели:</label>
            <input
              type="text"
              required
              value={item.modelName}
              onChange={(e) => onItemChange({ ...item, modelName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Поставщик / Производитель:</label>
            <input
              type="text"
              value={item.supplierName || ''}
              onChange={(e) => onItemChange({ ...item, supplierName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Габариты / Размеры:</label>
            <input
              type="text"
              value={item.dimensions || ''}
              onChange={(e) => onItemChange({ ...item, dimensions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Цена (₽):</label>
            <input
              type="number"
              value={item.estimatedPrice || 0}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onItemChange({
                  ...item,
                  estimatedPrice: val,
                  priceFormatted: `${val.toLocaleString('ru-RU')} ₽`
                });
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Описание ТХ и ГОСТ:</label>
            <textarea
              rows={3}
              value={item.description || ''}
              onChange={(e) => onItemChange({ ...item, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Статус ГИСП Минпромторга:</label>
            <input
              type="text"
              value={item.gispRegistryStatus || ''}
              onChange={(e) => onItemChange({ ...item, gispRegistryStatus: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          {/* Photo Upload for Editing */}
          <div className="sm:col-span-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-[10px] font-bold text-cyan-400 block flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Изображение товара (Загрузить новое фото или вставить URL):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={item.imageUrl || ''}
                onChange={(e) => onItemChange({ ...item, imageUrl: e.target.value })}
                placeholder="https://... или выберите файл"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
              <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Загрузить фото</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFileUpload(e, (url) => onItemChange({ ...item, imageUrl: url }))}
                />
              </label>
            </div>

            {item.imageUrl && (
              <div className="flex items-center gap-3 pt-1">
                <img src={item.imageUrl} alt="Предпросмотр" className="w-16 h-16 object-cover rounded-xl border border-slate-700" />
                <span className="text-[11px] text-emerald-400 font-bold">✓ Фото загружено</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            Отмена
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
