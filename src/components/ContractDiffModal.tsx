import React, { useState } from 'react';
import {
  X,
  FileDiff,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  FileText,
  Scale,
  RefreshCw
} from 'lucide-react';

interface ChangedClause {
  id: string;
  clauseNumber: string;
  changeType: 'PENALTY_INCREASED' | 'DEADLINE_SHORTENED' | 'ADDED_OBLIGATION' | 'REMOVED_RIGHT' | 'MODIFIED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  title: string;
  originalQuote: string;
  revisedQuote: string;
  riskExplanation: string;
  protocolRecommendation: string;
}

interface ContractDiffResult {
  overallVerdict: 'SAFE_TO_SIGN' | 'WARNING_CHANGES_FOUND' | 'CRITICAL_DISAGREEMENT_REQUIRED';
  verdictTitle: string;
  verdictDescription: string;
  riskScoreDelta: number;
  changedClauses: ChangedClause[];
  disagreementProtocolText: string;
}

interface ContractDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOriginalContractText?: string;
  initialOriginalText?: string;
}

export const ContractDiffModal: React.FC<ContractDiffModalProps> = ({
  isOpen,
  onClose,
  initialOriginalContractText = '',
  initialOriginalText = ''
}) => {
  const initialText = initialOriginalText || initialOriginalContractText || '';
  const [originalText, setOriginalText] = useState(initialText);
  const [revisedText, setRevisedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diffResult, setDiffResult] = useState<ContractDiffResult | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'protocol'>('input');

  React.useEffect(() => {
    if (initialText) {
      setOriginalText(initialText);
    }
  }, [initialText]);

  if (!isOpen) return null;

  const handleCompare = async () => {
    if (!originalText.trim() || !revisedText.trim()) {
      alert('Пожалуйста, вставьте обе редакции договора (исходную из извещения и полученную на подписание).');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/procurement/compare-contract-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContractText: originalText,
          revisedContractText: revisedText,
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка сервера при сопоставлении версий');
      }

      const data = await response.json();
      setDiffResult(data);
      setActiveTab('results');
    } catch (err: any) {
      console.error('Diff error:', err);
      alert('Не удалось сопоставить редакции: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyProtocol = () => {
    if (diffResult?.disagreementProtocolText) {
      navigator.clipboard.writeText(diffResult.disagreementProtocolText);
      setCopiedProtocol(true);
      setTimeout(() => setCopiedProtocol(false), 2000);
    }
  };

  const loadSampleData = () => {
    setOriginalText(`ПРОЕКТ ДОГОВОРА (ИЗ ИЗВЕЩЕНИЯ О ЗАКУПКЕ)
п. 4.1. Поставка осуществляется в течение 20 календарных дней с момента подписания договора.
п. 5.1. За ненадлежащее исполнение обязательств Поставщик уплачивает фиксированный штраф в размере 2 000 руб.
п. 6.2. Оплата производится в течение 7 рабочих дней после подписания акта приемки без удержаний.`);

    setRevisedText(`ПРОЕКТ ДОГОВОРА (НАПРАВЛЕННЫЙ ЗАКАЗЧИКОМ НА ПОДПИСАНИЕ)
п. 4.1. Поставка осуществляется партиями по заявкам в течение 5 рабочих дней с момента получения заявки.
п. 5.1. За любой факт ненадлежащего исполнения обязательств Поставщик уплачивает штраф в размере 3% от цены всего Договора за каждый случай.
п. 5.4. Покупатель вправе приобрести непоставленный товар у третьих лиц за счет Поставщика.
п. 6.2. Оплата производится в течение 30 календарных дней. Заказчик вправе удержать сумму штрафов из оплаты.`);
  };

  return (
    <div id="contract-diff-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileDiff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Сравнение редакций договора (Contract Diff)
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Анти-ловушка
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Автоматическое выявление скрытых правок Заказчика перед подписанием контракта
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {diffResult && (
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('input')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'input' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Исходные тексты
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'results' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Отчет изменений ({diffResult.changedClauses.length})
                </button>
                <button
                  onClick={() => setActiveTab('protocol')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'protocol' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Протокол разногласий
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* INPUT TAB */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Вставьте исходный текст проекта контракта (из извещения) и финальный текст, полученный от Заказчика на подписание:
                </p>
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Загрузить пример с изменениями
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Version */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Редакция 1: Проект из извещения
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {originalText.length} симв.
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Вставьте сюда текст проекта контракта из извещения о закупке..."
                    className="w-full text-xs font-mono p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none leading-relaxed resize-none text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Revised Version */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <FileDiff className="w-4 h-4 text-amber-500" />
                      Редакция 2: Проект на подписание
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {revisedText.length} симв.
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    value={revisedText}
                    onChange={(e) => setRevisedText(e.target.value)}
                    placeholder="Вставьте сюда текст проекта контракта, присланный Заказчиком на подписание..."
                    className="w-full text-xs font-mono p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none leading-relaxed resize-none text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isLoading || !originalText.trim() || !revisedText.trim()}
                  onClick={handleCompare}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ИИ сопоставляет редакции и ищет ловушки...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Сравнить редакции и выявить изменения</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && diffResult && (
            <div className="space-y-6 animate-fadeIn">
              {/* Overall Verdict Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                diffResult.overallVerdict === 'CRITICAL_DISAGREEMENT_REQUIRED'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                  : diffResult.overallVerdict === 'WARNING_CHANGES_FOUND'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
                  {diffResult.overallVerdict === 'SAFE_TO_SIGN' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base">
                      {diffResult.verdictTitle}
                    </h4>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border">
                      Дельта рисков: +{diffResult.riskScoreDelta} п.п.
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {diffResult.verdictDescription}
                  </p>
                </div>
              </div>

              {/* Changed Clauses List */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Обнаруженные изменения и расхождения ({diffResult.changedClauses.length}):</span>
                  <button
                    onClick={() => setActiveTab('protocol')}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>Сформировать Протокол разногласий</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </h4>

                <div className="space-y-3">
                  {diffResult.changedClauses.map((clause, idx) => (
                    <div
                      key={clause.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            {clause.clauseNumber}
                          </span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {clause.title}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          clause.severity === 'CRITICAL'
                            ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : clause.severity === 'HIGH'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {clause.changeType}
                        </span>
                      </div>

                      {/* Side-by-side Quotes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-1">
                            Было в извещении:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 italic font-mono text-[11px]">
                            «{clause.originalQuote}»
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
                            Стало в проекте на подписание:
                          </span>
                          <p className="text-slate-900 dark:text-white font-mono text-[11px] font-medium">
                            «{clause.revisedQuote}»
                          </p>
                        </div>
                      </div>

                      {/* Risk & Recommendation */}
                      <div className="space-y-1.5 pt-1 text-xs">
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong className="text-red-600 dark:text-red-400">Опасность: </strong>
                          {clause.riskExplanation}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                          <strong className="text-indigo-600 dark:text-indigo-400">Предложение для Протокола: </strong>
                          {clause.protocolRecommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROTOCOL TAB */}
          {activeTab === 'protocol' && diffResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Готовый Протокол Разногласий к Договору
                  </h4>
                  <p className="text-xs text-slate-500">
                    Сформирован в строгом соответствии с положениями ст. 83.2 / 51 44-ФЗ и ст. 445 ГК РФ
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyProtocol}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  {copiedProtocol ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Скопировано в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Копировать весь протокол</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={16}
                value={diffResult.disagreementProtocolText}
                className="w-full text-xs font-mono p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed outline-none resize-none shadow-inner"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>Срок подачи протокола разногласий: не позднее 5 календарных дней с даты размещения проекта контракта Заказчиком на ЭТП.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
