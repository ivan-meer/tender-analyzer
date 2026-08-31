import React from 'react';
import { X } from 'lucide-react';
import { getTagStyle, normalizeTagName } from '../../utils/tagUtils';

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
  onClick?: (e?: React.MouseEvent) => void;
  size?: 'xs' | 'sm' | 'md';
  isActive?: boolean;
  count?: number;
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  onRemove,
  onClick,
  size = 'sm',
  isActive,
  count,
  className = '',
}) => {
  const cleanName = normalizeTagName(tag);
  const style = getTagStyle(cleanName);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const activeClasses = isActive
    ? 'ring-2 ring-indigo-500 shadow-xs font-black'
    : 'font-bold';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-lg border transition-all select-none ${style.bg} ${style.text} ${style.border} ${style.darkBg} ${style.darkText} ${style.darkBorder} ${sizeClasses} ${activeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
      <span className="truncate">#{cleanName}</span>

      {typeof count === 'number' && (
        <span className="px-1 py-0.2 rounded-md bg-black/10 dark:bg-white/10 text-[9px] font-extrabold ml-0.5">
          {count}
        </span>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 -mr-0.5 transition-colors cursor-pointer"
          title={`Удалить тег #${cleanName}`}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};
