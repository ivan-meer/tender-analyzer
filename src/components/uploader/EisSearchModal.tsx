import React from 'react';
import { Globe, X, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface EisSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  eisQuery: string;
  setEisQuery: (query: string) => void;
  eisError: string | null;
  isEisFetching: boolean;
  onFetchEis: (presetQuery?: string) => void;
}

export const EisSearchModal: React.FC<EisSearchModalProps> = ({
  isOpen,
  onClose,
  eisQuery,
  setEisQuery,
  eisError,
  isEisFetching,
  onFetchEis,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="eis-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div 
        id="eis-modal-container"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Загрузка закупки из ЕИС (zakupki.gov.ru)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Автоматическое скачивание извещения, проекта контракта и ТЗ
              </p>
            </div>
          </div>
          <button
            id="eis-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              Номер закупки (ЕИС) или прямая ссылка:
            </label>
            <div className="relative">
              <input
                id="eis-query-input"
                type="text"
                value={eisQuery}
                onChange={(e) => setEisQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onFetchEis();
                  }
                }}
                placeholder="Например: 0373200002824000001 или 32412345678"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          {eisError && (
            <div id="eis-error-alert" className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{eisError}</span>
            </div>
          )}

          {/* Quick Presets for 1-click loading */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Быстрый выбор из реестра ЕИС:
            </span>

            <div className="space-y-1.5">
              <button
                id="eis-preset-1"
                type="button"
                onClick={() => onFetchEis('0373200002824000001')}
                disabled={isEisFetching}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    № 0373200002824000001 (44-ФЗ)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Поставка компьютерной техники и рабочих мест ГБУ • 4,25 млн ₽
                  </span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                id="eis-preset-2"
                type="button"
                onClick={() => onFetchEis('32412345678')}
                disabled={isEisFetching}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    № 32412345678 (223-ФЗ)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Закупка офисной мебели и оборудования • 2,85 млн ₽
                  </span>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            id="eis-modal-cancel-btn"
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            id="eis-modal-submit-btn"
            type="button"
            disabled={isEisFetching}
            onClick={() => onFetchEis()}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isEisFetching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Скачивание из ЕИС...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Импортировать пакет закупки</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
