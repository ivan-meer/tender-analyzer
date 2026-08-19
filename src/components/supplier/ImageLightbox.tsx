import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  image: { url: string; title: string } | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div 
      id="lightbox-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
    >
      <div 
        id="lightbox-container"
        onClick={(e) => e.stopPropagation()} 
        className="relative max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-3 flex flex-col items-center"
      >
        <div className="w-full flex items-center justify-between px-2 pt-1 text-white text-xs font-bold">
          <span className="truncate pr-4">{image.title}</span>
          <button 
            id="lightbox-close-button"
            type="button" 
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <img 
          src={image.url} 
          alt={image.title}
          referrerPolicy="no-referrer"
          className="max-w-full max-h-[75vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
};
