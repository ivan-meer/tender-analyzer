import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, Plus, Check, X } from 'lucide-react';
import { PRESET_TAG_DEFINITIONS, normalizeTagName } from '../../utils/tagUtils';
import { TagBadge } from './TagBadge';

interface QuickTagPickerProps {
  currentTags?: string[];
  selectedTags?: string[];
  onTagsChange: (newTags: string[]) => void;
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  triggerRef?: React.RefObject<HTMLElement>;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const QuickTagPicker: React.FC<QuickTagPickerProps> = ({
  currentTags,
  selectedTags,
  onTagsChange,
  isOpen = true,
  onClose,
  title = 'Управление тегами закупки',
  position = 'bottom-left',
}) => {
  const [customTagInput, setCustomTagInput] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const activeTags = selectedTags || currentTags || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    const normalized = normalizeTagName(tag);
    if (activeTags.includes(normalized)) {
      onTagsChange(activeTags.filter((t) => t !== normalized));
    } else {
      onTagsChange([...activeTags, normalized]);
    }
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeTagName(customTagInput);
    if (!clean) return;

    if (!activeTags.includes(clean)) {
      onTagsChange([...activeTags, clean]);
    }
    setCustomTagInput('');
  };

  const positionClass = {
    'bottom-left': 'left-0 top-full mt-1.5',
    'bottom-right': 'right-0 top-full mt-1.5',
    'top-left': 'left-0 bottom-full mb-1.5',
    'top-right': 'right-0 bottom-full mb-1.5',
  }[position] || 'right-0 top-full mt-1.5';

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className={`absolute ${positionClass} w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-fade-in text-xs`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
          <TagIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected Tags Preview */}
      {activeTags.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Примененные теги ({activeTags.length}):
          </span>
          <div className="flex flex-wrap gap-1">
            {activeTags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                size="xs"
                onRemove={() => handleToggleTag(tag)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Fast Tags */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-bold text-slate-400 block">
          Рекомендуемые теги:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_TAG_DEFINITIONS.map((preset) => {
            const isApplied = activeTags.includes(preset.name) || activeTags.includes(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleToggleTag(preset.name)}
                className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                  isApplied
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="truncate">#{preset.name}</span>
                {isApplied ? (
                  <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                ) : (
                  <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleAddCustomTag} className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
        <input
          type="text"
          value={customTagInput}
          onChange={(e) => setCustomTagInput(e.target.value)}
          placeholder="Свой тег (напр. Спецзаказ)..."
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!customTagInput.trim()}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shrink-0 font-bold"
          title="Добавить тег"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
