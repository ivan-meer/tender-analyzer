import React from 'react';
import { X, Pencil, Save } from 'lucide-react';
import { NeonSupplier } from '../../lib/neonService';

interface SupplierEditSupplierModalProps {
  supplier: NeonSupplier | null;
  onClose: () => void;
  onUpdate: (e: React.FormEvent) => void;
  onSupplierChange: (updated: NeonSupplier) => void;
  saving: boolean;
}

export const SupplierEditSupplierModal: React.FC<SupplierEditSupplierModalProps> = ({
  supplier,
  onClose,
  onUpdate,
  onSupplierChange,
  saving,
}) => {
  if (!supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <form
        onSubmit={onUpdate}
        className="bg-slate-900 border border-emerald-700 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden p-6 space-y-4 text-white"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Редактирование поставщика (Neon DB #{supplier.id})</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Название компании:</label>
            <input
              type="text"
              required
              value={supplier.companyName}
              onChange={(e) => onSupplierChange({ ...supplier, companyName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Регион / Город:</label>
              <input
                type="text"
                value={supplier.region || ''}
                onChange={(e) => onSupplierChange({ ...supplier, region: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Специализация:</label>
              <input
                type="text"
                value={supplier.specialization || ''}
                onChange={(e) => onSupplierChange({ ...supplier, specialization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Контакты (Тел / Email):</label>
            <input
              type="text"
              value={supplier.contactsOrWebsite || ''}
              onChange={(e) => onSupplierChange({ ...supplier, contactsOrWebsite: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">URL Сайта:</label>
            <input
              type="text"
              value={supplier.websiteUrl || ''}
              onChange={(e) => onSupplierChange({ ...supplier, websiteUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="editSupGisp"
              checked={supplier.inGispRegistry || false}
              onChange={(e) => onSupplierChange({ ...supplier, inGispRegistry: e.target.checked })}
              className="w-4 h-4 rounded-md accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="editSupGisp" className="text-xs text-slate-300 font-bold cursor-pointer">
              Внесено в реестр Минпромторга (ПП 1875)
            </label>
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
