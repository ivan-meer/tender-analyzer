import React from 'react';
import { ShieldCheck, MapPin, Globe, Check, Loader2, Plus } from 'lucide-react';
import { SupplierItem } from '../../types';

interface SupplierCardProps {
  supplier: SupplierItem;
  index: number;
  isSaving: boolean;
  isSaved: boolean;
  onSaveToNeon: (supplier: SupplierItem, index: number) => void;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  supplier: supp,
  index: sIdx,
  isSaving,
  isSaved,
  onSaveToNeon
}) => {
  const href = supp.websiteUrl || (supp.contactsOrWebsite && (supp.contactsOrWebsite.includes('http') || supp.contactsOrWebsite.includes('.ru') || supp.contactsOrWebsite.includes('.com'))
    ? (supp.contactsOrWebsite.startsWith('http') ? supp.contactsOrWebsite : `https://${supp.contactsOrWebsite}`)
    : null);

  return (
    <div 
      id={`supplier-card-${sIdx}`}
      className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
            {supp.companyName}
          </div>
          {supp.inGispRegistry && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              ГИСП Минпромторг
            </span>
          )}
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-medium">
          {supp.region && (
            <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <MapPin className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
              <span>{supp.region}</span>
            </p>
          )}
          <p><span className="text-slate-400 dark:text-slate-500 font-bold">Специализация:</span> {supp.specialization}</p>
          <p className="text-indigo-700 dark:text-indigo-300 font-semibold break-all">
            <span className="text-slate-400 dark:text-slate-500 font-bold">Контакты/Сайт:</span> {supp.contactsOrWebsite}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
        {href ? (
          <a
            id={`supplier-website-link-${sIdx}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Сайт ↗</span>
          </a>
        ) : <div />}

        <button
          id={`supplier-save-btn-${sIdx}`}
          type="button"
          disabled={isSaving || isSaved}
          onClick={() => onSaveToNeon(supp, sIdx)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>В базе поставщиков</span>
            </>
          ) : isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Добавление...</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>+ В базу поставщиков</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
