import React, { useState, useRef, useEffect } from 'react';
import { Tag as TagIcon, Plus, X, Sparkles, Check, ChevronDown } from 'lucide-react';
import { PRESET_TAG_DEFINITIONS, getTagStyle, normalizeTagName } from '../../utils/tagUtils';
import { TagBadge } from './TagBadge';

export interface TagManagerProps {
  tags?: string[];
  onChange: (newTags: string[]) => void;
  variant?: 'compact' | 'expanded' | 'toolbar';
  label?: string;
  readOnly?: boolean;
  className?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({
  tags = [],
  onChange,
  variant = 'compact',
  label = 'Теги закупки',
  readOnly = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsInputExpanded(false);
      }
    };

    if (isOpen || isInputExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isInputExpanded]);

  const handleAddTag = (tagToAdd: string) => {
    const clean = normalizeTagName(tagToAdd);
    if (!clean) return;

    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      onChange([...tags, clean]);
    }
    setCustomInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const clean = normalizeTagName(tagToRemove).toLowerCase();
    onChange(tags.filter((t) => normalizeTagName(t).toLowerCase() !== clean));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(customInput);
    } else if (e.key === 'Escape') {
      setIsInputExpanded(false);
      setIsOpen(false);
    }
  };

  // Compact Variant (Ideal for Header and Quick View)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap relative ${className}`} ref={popoverRef}>
        {/* Render Active Badges */}
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            size="xs"
            onRemove={readOnly ? undefined : () => handleRemoveTag(tag)}
          />
        ))}

        {/* Add Tag Trigger */}
        {!readOnly && (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
              title="Добавить или изменить теги закупки"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>{tags.length === 0 ? 'Добавить теги' : 'Тег'}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
            </button>

            {/* Popover Menu */}
            {isOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                    <TagIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Fast Tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Рекомендуемые пресеты:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_TAG_DEFINITIONS.map((preset) => {
                      const isApplied = tags.some(
                        (t) => normalizeTagName(t).toLowerCase() === preset.name.toLowerCase()
                      );
                      const style = preset.color;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (isApplied) {
                              handleRemoveTag(preset.name);
                            } else {
                              handleAddTag(preset.name);
                            }
                          }}
                          className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                            isApplied
                              ? `${style.bg} ${style.border} ${style.text} ${style.darkBg} ${style.darkText} ${style.darkBorder} ring-1 ring-indigo-400`
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
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Свой тег (напр. Спецзаказ)..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(customInput)}
                    disabled={!customInput.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-all shrink-0 font-bold"
                    title="Добавить тег"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded Variant (Full Card/Section Mode)
  return (
    <div
      className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5 shadow-xs ${className}`}
      ref={popoverRef}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <TagIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              {label}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Цветовая маркировка и категоризация для быстрого поиска и фильтрации
            </p>
          </div>
        </div>

        {tags.length > 0 && !readOnly && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            Очистить все
          </button>
        )}
      </div>

      {/* Active Badges List */}
      <div className="flex items-center gap-1.5 flex-wrap min-h-[32px] p-2 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
        {tags.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Теги пока не присвоены. Выберите пресет ниже или введите свой тег.
          </span>
        ) : (
          tags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              size="md"
              onRemove={readOnly ? undefined : () => handleRemoveTag(tag)}
            />
          ))
        )}
      </div>

      {/* Quick Preset Selector & Custom Input */}
      {!readOnly && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Быстрые пресеты:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAG_DEFINITIONS.map((preset) => {
              const isApplied = tags.some(
                (t) => normalizeTagName(t).toLowerCase() === preset.name.toLowerCase()
              );
              const style = preset.color;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (isApplied) {
                      handleRemoveTag(preset.name);
                    } else {
                      handleAddTag(preset.name);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    isApplied
                      ? `${style.bg} ${style.border} ${style.text} ${style.darkBg} ${style.darkText} ${style.darkBorder} shadow-2xs ring-1 ring-indigo-400`
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span>#{preset.name}</span>
                  {isApplied ? (
                    <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Add custom tag input */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить свой уникальный тег..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddTag(customInput)}
              disabled={!customInput.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
