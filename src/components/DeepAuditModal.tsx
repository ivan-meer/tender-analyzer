import React, { useState } from 'react';
import { BrainCircuit, X, Sparkles, AlertTriangle, ShieldCheck, FileText, Check, Copy, RefreshCw, Layers } from 'lucide-react';

interface DeepAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClauseQuote?: string;
  procurementContext?: string;
}

export const DeepAuditModal: React.FC<DeepAuditModalProps> = ({
  isOpen,
  onClose,
  initialClauseQuote,
  procurementContext,
}) => {
  const [clauseText, setClauseText] = useState(initialClauseQuote || '');
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunDeepAudit = async () => {
    if (!clauseText.trim() || isLoading) return;

    setIsLoading(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/deep-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clauseText,
          procurementContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      setAuditResult(data.auditResult || 'Анализ завершен без вывода.');
    } catch (err: any) {
      console.error('Deep audit error:', err);
      setAuditResult(`Ошибка глубокого анализа: ${err?.message || 'Попробуйте еще раз.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!auditResult) return;
    navigator.clipboard.writeText(auditResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-purple-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300">
              <BrainCircuit className="w-6 h-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Режим глубокого мышления (High Thinking)</h3>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Gemini 3.1 Pro
                </span>
              </div>
              <p className="text-xs text-purple-200/80">Многоуровневый юр. аудит спорных условий договора и практики ФАС</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Clause Input Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Текст спорного пункта договора / условия закупки для анализа:
            </label>
            <textarea
              rows={4}
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              placeholder="Вставьте сюда неоднозначный пункт о штрафах, сроках приемки, одностороннем отказе или закупках у 3-х лиц..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-3.5 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRunDeepAudit}
                disabled={!clauseText.trim() || isLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Включено глубинное юридическое мышление...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Запустить deep-аудит условия</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-8 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-3xl text-center space-y-3 animate-pulse">
              <div className="w-10 h-10 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin mx-auto"></div>
              <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
                ИИ сопоставляет пункт с практикой Арбитражных судов и ФАС РФ...
              </h4>
              <p className="text-xs text-purple-700/80 dark:text-purple-300/80 max-w-md mx-auto">
                Вычисляются скрытые финансовые риски, двойное толкование и оптимальная формулировка протокола разногласий.
              </p>
            </div>
          )}

          {/* Audit Results Display */}
          {auditResult && !isLoading && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Результат многоуровневого юридического аудита:</span>
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                </button>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans shadow-inner">
                {auditResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
