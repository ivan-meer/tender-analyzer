import React, { useState } from 'react';
import { Package } from 'lucide-react';

// Curated bank of realistic photo presets for Russian procurement categories
export const REALISTIC_PHOTO_PRESETS = [
  {
    name: 'Стол рабочий (ЛДСП/Металл)',
    category: 'Furniture',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Кресло операторское (Сетка)',
    category: 'Furniture',
    url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Шкаф архивный / Стеллаж',
    category: 'Furniture',
    url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Компьютер ПК / Монитор',
    category: 'Tech',
    url: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Силовой кабель / Электро',
    category: 'Electrical',
    url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80'
  },
  {
    name: 'Медицинская лаборатория',
    category: 'Medical',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80'
  }
];

// Robust product image component with error handling fallback
export const ProductImageFallback: React.FC<{
  src?: string;
  alt: string;
  category?: string;
  className?: string;
}> = ({ src, alt, category, className = "w-full h-36 object-cover" }) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-3 text-slate-400 text-center ${className}`}>
        <Package className="w-8 h-8 text-cyan-500/80 mb-1 animate-pulse" />
        <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
          {alt || category || 'Чертеж ТЗ / ГОСТ'}
        </span>
        <span className="text-[9px] text-slate-400 font-mono mt-0.5">Фото по запросу</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
