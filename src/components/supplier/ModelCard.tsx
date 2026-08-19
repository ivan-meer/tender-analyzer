import React from 'react';
import { 
  Maximize2, 
  ImageIcon, 
  Ruler, 
  Layers, 
  Palette, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Loader2, 
  Database 
} from 'lucide-react';
import { SuggestedModel } from '../../types';

interface ModelCardProps {
  model: SuggestedModel;
  index: number;
  isSaving: boolean;
  isSaved: boolean;
  onSaveToNeon: (model: SuggestedModel, index: number) => void;
  onZoomImage: (image: { url: string; title: string }) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  index: mIdx,
  isSaving,
  isSaved,
  onSaveToNeon,
  onZoomImage
}) => {
  const directUrl = model.productUrl || (model.url 
    ? (model.url.startsWith('http') ? model.url : `https://${model.url}`)
    : null);

  const searchSearchQuery = encodeURIComponent(`${model.manufacturer} ${model.modelName}`);

  return (
    <div 
      id={`model-card-${mIdx}`}
      className="p-4 sm:p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl space-y-3 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col md:flex-row gap-4 items-start"
    >
      {/* Product Image Thumbnail */}
      <div 
        id={`model-image-preview-${mIdx}`}
        onClick={() => model.imageUrl && onZoomImage({ url: model.imageUrl, title: `${model.modelName} — ${model.manufacturer}` })}
        className="w-full md:w-44 h-36 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative group cursor-pointer"
      >
        {model.imageUrl ? (
          <>
            <img 
              src={model.imageUrl} 
              alt={model.modelName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-xs">
              <Maximize2 className="w-4 h-4" />
              <span>Увеличить</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
            <ImageIcon className="w-8 h-8 opacity-60" />
            <span className="text-[10px] font-bold">Фото товара</span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
          {model.country || 'РФ'}
        </div>

        {model.matchScore && (
          <div className="absolute bottom-2 left-2 bg-emerald-950/90 text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1">
            <span>{model.matchScore}% совпадение</span>
          </div>
        )}
      </div>

      {/* Model Specs & Links */}
      <div className="flex-1 space-y-2.5 min-w-0 w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-black text-slate-900 dark:text-white text-base leading-snug">
              {model.modelName}
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-bold mt-0.5">
              {model.manufacturer}
            </p>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 rounded-xl block">
              {model.estimatedPrice}
            </span>
          </div>
        </div>

        {/* 3 Main Search Parameters Badges: Dimensions, Materials, Color */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {/* Priority 1: Dimensions */}
          {model.dimensionsMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold rounded-lg" title="Приоритет №1: Размеры">
              <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{model.dimensionsMatch}</span>
            </span>
          )}

          {/* Priority 2: Materials */}
          {model.materialsMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold rounded-lg" title="Приоритет №2: Материалы">
              <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{model.materialsMatch}</span>
            </span>
          )}

          {/* Priority 3: Color */}
          {model.colorMatch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 font-bold rounded-lg" title="Приоритет №3: Цвет">
              <Palette className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>{model.colorMatch}</span>
            </span>
          )}

          {/* GISP Status */}
          {model.gispRegistryStatus && (
            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              {model.gispRegistryStatus}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          {model.description}
        </p>

        {/* Product Features Badges if present */}
        {model.productFeatures && model.productFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {model.productFeatures.map((feat: string, fIdx: number) => (
              <span key={fIdx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-bold">
                ✓ {feat}
              </span>
            ))}
          </div>
        )}

        {/* Direct Links & Save Action Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {directUrl && (
            <a
              id={`model-direct-link-${mIdx}`}
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>Открыть страницу товара ↗</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <a
            id={`model-yandex-link-${mIdx}`}
            href={`https://yandex.ru/search/?text=${searchSearchQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <span>Найти в Яндекс Маркете ↗</span>
          </a>

          <button
            id={`model-save-neon-btn-${mIdx}`}
            type="button"
            disabled={isSaving || isSaved}
            onClick={() => onSaveToNeon(model, mIdx)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>В каталоге Neon DB</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>+ В каталог Neon DB</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
