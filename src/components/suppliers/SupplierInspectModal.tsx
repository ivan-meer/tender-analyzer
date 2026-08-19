import React from 'react';
import { X, Cpu, Copy } from 'lucide-react';
import { NeonCatalogItem } from '../../lib/neonService';

interface SupplierInspectModalProps {
  item: NeonCatalogItem | null;
  onClose: () => void;
  onCopy: (item: NeonCatalogItem) => void;
}

export const SupplierInspectModal: React.FC<SupplierInspectModalProps> = ({
  item,
  onClose,
  onCopy,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden p-6 space-y-5 text-white">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400 border border-cyan-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest block">
                Neon PostgreSQL • Запись #{item.id}
              </span>
              <h3 className="text-lg font-extrabold text-white">
                {item.modelName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Spec details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Изготовитель / Бренд</span>
            <span className="font-extrabold text-cyan-300">{item.supplierName || item.manufacturer}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Страна производства</span>
            <span className="font-extrabold text-emerald-400">{item.country}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase">Габариты / Размеры</span>
            <span className="font-mono font-extrabold text-white">{item.dimensions || 'По ТЗ'}</span>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/60 space-y-1">
            <span className="text-emerald-400 font-bold block text-[10px] uppercase">Прайс / Ориентировочная стоимость</span>
            <span className="font-mono font-extrabold text-emerald-300 text-sm">
              {item.priceFormatted || `${item.estimatedPrice?.toLocaleString('ru-RU')} ₽`}
            </span>
          </div>
        </div>

        {/* Full description */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-slate-400 font-bold block text-[10px] uppercase">Полное описание ТХ и соответствие ГОСТ</span>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {item.description}
          </p>
        </div>

        {/* GISP Registry Status */}
        <div className="bg-cyan-950/40 p-3 rounded-2xl border border-cyan-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold">Статус реестра Минпромторга РФ:</span>
          <span className="font-extrabold text-cyan-300 bg-cyan-900/60 px-3 py-1 rounded-xl border border-cyan-700">
            {item.gispRegistryStatus}
          </span>
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onCopy(item)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4 text-cyan-400" />
            <span>Скопировать ТХ</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
