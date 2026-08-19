import React from 'react';
import { 
  X, Image as ImageIcon, Camera, Link, Trash2, Save, Copy, Pencil 
} from 'lucide-react';
import { DetailedProduct, MOCK_CHAIR_IMAGES } from '../TenderChatModal';

interface ChatProductDetailModalProps {
  selectedProduct: DetailedProduct;
  isEditingProduct: boolean;
  setIsEditingProduct: (val: boolean) => void;
  showMockGallery: boolean;
  setShowMockGallery: (val: boolean) => void;
  productEditForm: {
    modelName: string;
    supplierName: string;
    matchStatus: string;
    priceText: string;
    imageUrl: string;
    seatHeightTop: string;
    seatWidth: string;
    seatDepth: string;
    overallHeight: string;
    loadMax: string;
  };
  setProductEditForm: React.Dispatch<React.SetStateAction<{
    modelName: string;
    supplierName: string;
    matchStatus: string;
    priceText: string;
    imageUrl: string;
    seatHeightTop: string;
    seatWidth: string;
    seatDepth: string;
    overallHeight: string;
    loadMax: string;
  }>>;
  onClose: () => void;
  onSave: () => void;
  onSelectMockImage: (url: string) => void;
  onReplacePhotoUrl: () => void;
  onDeletePhoto: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onCopy: (id: string, text: string) => void;
}

export const ChatProductDetailModal: React.FC<ChatProductDetailModalProps> = ({
  selectedProduct,
  isEditingProduct,
  setIsEditingProduct,
  showMockGallery,
  setShowMockGallery,
  productEditForm,
  setProductEditForm,
  onClose,
  onSave,
  onSelectMockImage,
  onReplacePhotoUrl,
  onDeletePhoto,
  onFileSelect,
  fileInputRef,
  onCopy
}) => {
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Карточка позиции в базе Neon DB
              </h3>
              <p className="text-xs text-slate-400">Просмотр и редактирование данных в реальном времени</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Image & Controls */}
        <div className="space-y-3">
          <div className="h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative group flex items-center justify-center p-2">
            <img 
              src={selectedProduct.imageUrl} 
              alt={selectedProduct.modelName}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain rounded-xl"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-900/90 text-cyan-300 font-mono text-xs font-bold rounded-lg border border-slate-700">
              {selectedProduct.matchStatus}
            </div>
          </div>

          {/* Photo Management Actions */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Управление изображением позиции:
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={onFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-400" />
                <span>Загрузить с диска</span>
              </button>

              <button
                type="button"
                onClick={onReplacePhotoUrl}
                className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Link className="w-3.5 h-3.5 text-cyan-400" />
                <span>Заменить по URL</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMockGallery(!showMockGallery)}
                className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Галерея ИИ-моделей</span>
              </button>

              <button
                type="button"
                onClick={onDeletePhoto}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Удалить фото</span>
              </button>
            </div>

            {/* AI Mock Images Gallery Drawer */}
            {showMockGallery && (
              <div className="pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Выбрать из сгенерированных моделей:</div>
                <div className="grid grid-cols-3 gap-2">
                  {MOCK_CHAIR_IMAGES.map((mockImg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectMockImage(mockImg.url)}
                      className="group relative h-20 bg-slate-900 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all cursor-pointer p-1"
                    >
                      <img src={mockImg.url} alt={mockImg.title} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-[9px] font-bold text-cyan-300 text-center">
                        Выбрать
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editable or View Specifications */}
        {isEditingProduct ? (
          <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
              Редактирование параметров в базе:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Модель товара:</label>
                <input 
                  type="text" 
                  value={productEditForm.modelName}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, modelName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Поставщик / Производитель:</label>
                <input 
                  type="text" 
                  value={productEditForm.supplierName}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Статус соответствия ТЗ:</label>
                <input 
                  type="text" 
                  value={productEditForm.matchStatus}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, matchStatus: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Цена (ориентировочно):</label>
                <input 
                  type="text" 
                  value={productEditForm.priceText}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, priceText: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Высота сиденья до верха (мм):</label>
                <input 
                  type="text" 
                  value={productEditForm.seatHeightTop}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, seatHeightTop: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ширина сиденья (мм):</label>
                <input 
                  type="text" 
                  value={productEditForm.seatWidth}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, seatWidth: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Глубина сиденья (мм):</label>
                <input 
                  type="text" 
                  value={productEditForm.seatDepth}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, seatDepth: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Габаритная высота (мм):</label>
                <input 
                  type="text" 
                  value={productEditForm.overallHeight}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, overallHeight: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Максимальная нагрузка (кг):</label>
                <input 
                  type="text" 
                  value={productEditForm.loadMax}
                  onChange={(e) => setProductEditForm(prev => ({ ...prev, loadMax: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onSave}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="font-bold text-slate-300 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Технические характеристики (ГОСТ 19917-2014):</span>
              <span className="text-emerald-400 font-mono font-extrabold text-sm">{selectedProduct.priceText}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Модель:</span>
                <span className="font-bold text-white text-right">{selectedProduct.modelName}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Поставщик:</span>
                <span className="font-bold text-cyan-300 text-right">{selectedProduct.supplierName}</span>
              </div>

              {selectedProduct.rawRow.seat_height_top && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Высота сиденья до верха:</span>
                  <span className="font-bold font-mono text-emerald-400">{selectedProduct.rawRow.seat_height_top} мм</span>
                </div>
              )}

              {selectedProduct.rawRow.seat_width && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Ширина сиденья:</span>
                  <span className="font-bold font-mono text-emerald-400">{selectedProduct.rawRow.seat_width} мм</span>
                </div>
              )}

              {selectedProduct.rawRow.seat_depth && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Глубина сиденья:</span>
                  <span className="font-bold font-mono text-emerald-400">{selectedProduct.rawRow.seat_depth} мм</span>
                </div>
              )}

              {selectedProduct.rawRow.overall_height && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Габаритная высота:</span>
                  <span className="font-bold font-mono text-emerald-400">{selectedProduct.rawRow.overall_height} мм</span>
                </div>
              )}

              {selectedProduct.rawRow.load_max && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Максимальная нагрузка:</span>
                  <span className="font-bold font-mono text-amber-400">{selectedProduct.rawRow.load_max} кг</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onCopy(`detail_${selectedProduct.modelName}`, `${selectedProduct.modelName} — Поставщик: ${selectedProduct.supplierName}, Цена: ${selectedProduct.priceText}`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать ТХ позиции</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingProduct(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span>Редактировать параметры</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
