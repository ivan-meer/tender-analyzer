import React from 'react';
import { MessageSquare, X } from 'lucide-react';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  pastedText: string;
  setPastedText: (text: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  additionalNotes,
  setAdditionalNotes,
  pastedText,
  setPastedText,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="notes-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div 
        id="notes-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Инструкция и дополнительный текст
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Укажите комментарий эксперту ИИ или вставьте фрагмент вручную
              </p>
            </div>
          </div>
          <button
            id="notes-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Примечания и особые указания тендерному эксперту:
            </label>
            <textarea
              id="notes-textarea"
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Укажите особые условия: например, проверить аванс, штрафы ПП 1875 или спецификацию..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Вставьте фрагменты текста вручную (если нет файла):
            </label>
            <textarea
              id="pasted-text-textarea"
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Вставьте пункт о штрафах, ТЗ или извещение..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            id="notes-modal-save-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            Сохранить и закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
