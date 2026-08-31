import React, { useState, useEffect } from 'react';
import { AnalysisResult, SmartInsightQuestion } from '../types';
import { 
  fetchSmartInsights, 
  generateClientSideSmartInsights,
  formatFullClarificationLetter 
} from '../utils/smartInsightsGenerator';
import {
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  FileQuestion,
  ShieldAlert,
  Truck,
  Scale,
  FileText,
  Coins,
  CheckCircle2,
  Filter,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  FileCheck2,
  Building,
  AlertTriangle
} from 'lucide-react';
import { Tooltip } from './Tooltip';

interface SmartInsightsSectionProps {
  analysis: AnalysisResult;
}

export const SmartInsightsSection: React.FC<SmartInsightsSectionProps> = ({ analysis }) => {
  const [questions, setQuestions] = useState<SmartInsightQuestion[]>(() => {
    return generateClientSideSmartInsights(analysis);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('Gemini AI');
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null);

  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Copy feedback states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedWithRationaleId, setCopiedWithRationaleId] = useState<string | null>(null);
  const [isFullLetterCopied, setIsFullLetterCopied] = useState(false);

  // Auto-fetch richer Gemini questions on mount
  useEffect(() => {
    let isMounted = true;
    const loadInsights = async () => {
      setIsLoading(true);
      try {
        const response = await fetchSmartInsights(analysis);
        if (isMounted && response.questions && response.questions.length > 0) {
          setQuestions(response.questions);
          if (response.modelUsed) setModelUsed(response.modelUsed);
          if (response.generatedAt) setLastGeneratedAt(response.generatedAt);
        }
      } catch (err) {
        console.warn('[Smart Insights] Auto-fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadInsights();
    return () => {
      isMounted = false;
    };
  }, [analysis]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetchSmartInsights(analysis, { forceRefresh: true });
      if (response.questions && response.questions.length > 0) {
        setQuestions(response.questions);
        if (response.modelUsed) setModelUsed(response.modelUsed);
        setLastGeneratedAt(new Date().toISOString());
      }
    } catch (err) {
      console.error('[Smart Insights] Refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyQuestion = (q: SmartInsightQuestion) => {
    navigator.clipboard.writeText(q.questionText);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyWithRationale = (q: SmartInsightQuestion) => {
    const fullText = `Вопрос Заказчику: ${q.title}
Относительно: ${q.relatedRiskOrClause || 'Положений документации'}
${q.legalBasis ? `Нормативное основание: ${q.legalBasis}\n` : ''}
Обоснование риска:
${q.rationale}

Текст запроса на разъяснение:
${q.questionText}
${q.expectedOutcome ? `\nОжидаемый ответ: ${q.expectedOutcome}` : ''}`;

    navigator.clipboard.writeText(fullText);
    setCopiedWithRationaleId(q.id);
    setTimeout(() => setCopiedWithRationaleId(null), 2500);
  };

  const handleCopyFullLetter = () => {
    const letter = formatFullClarificationLetter(analysis, questions);
    navigator.clipboard.writeText(letter);
    setIsFullLetterCopied(true);
    setTimeout(() => setIsFullLetterCopied(false), 3000);
  };

  const toggleExpand = (id: string) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (categoryFilter !== 'ALL' && q.category !== categoryFilter) {
      return false;
    }
    if (priorityFilter !== 'ALL' && q.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PENALTIES':
        return <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'DELIVERY_LOGISTICS':
        return <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ACCEPTANCE_EIS':
        return <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'PAYMENT_TERMS':
        return <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'TECHNICAL_SPEC':
        return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'NATIONAL_REGIME':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Высокий приоритет
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Важный вопрос
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Рекомендация
          </span>
        );
    }
  };

  const highPriorityCount = questions.filter((q) => q.priority === 'HIGH').length;

  return (
    <div id="smart-insights-section" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5 animate-fade-in">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/80 dark:border-indigo-800/80 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Smart Insights: Вопросы Заказчику</span>
              <span className="text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80">
                {questions.length} вопроса
              </span>
            </h3>

            {/* AI Model Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70 rounded-xl text-[11px] font-bold shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Gemini AI Insights</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Искусственный интеллект Gemini проанализировал выявленные риски договора, логистику и ТЗ и сформировал 
            готовые вопросы для официального <strong className="text-slate-700 dark:text-slate-200">запроса на разъяснение положений извещения</strong> на ЭТП/ЕИС.
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Copy Full Clarification Request Letter */}
          <button
            type="button"
            onClick={handleCopyFullLetter}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Скопировать все вопросы в виде готового официального запроса на разъяснение"
          >
            {isFullLetterCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Письмо скопировано!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Скопировать запрос целиком</span>
              </>
            )}
          </button>

          {/* Regenerate / Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Сгенерировать обновленный список вопросов через Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{isLoading ? 'Генерация...' : 'Обновить'}</span>
          </button>
        </div>
      </div>

      {/* QUICK HIGHLIGHT BANNER */}
      <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/40 to-slate-50 dark:from-amber-950/30 dark:via-indigo-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Задайте эти вопросы Заказчику до окончания срока подачи заявок!
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Официальный ответ Заказчика в ЕИС имеет обязательную юридическую силу и защищает поставщика от штрафов и отказа в приемке.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {highPriorityCount > 0 && (
            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold rounded-lg text-[11px] border border-rose-200 dark:border-rose-900">
              {highPriorityCount} критичных запроса
            </span>
          )}
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-semibold text-[11px] mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Категория:</span>
        </div>

        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            categoryFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Все ({questions.length})
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('PENALTIES')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            categoryFilter === 'PENALTIES'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Штрафы и неустойки</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('DELIVERY_LOGISTICS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            categoryFilter === 'DELIVERY_LOGISTICS'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Логистика и сдача</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('ACCEPTANCE_EIS')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            categoryFilter === 'ACCEPTANCE_EIS'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Электронное актирование</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('TECHNICAL_SPEC')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            categoryFilter === 'TECHNICAL_SPEC'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Техзадание & Эквиваленты</span>
        </button>

        <button
          type="button"
          onClick={() => setCategoryFilter('NATIONAL_REGIME')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            categoryFilter === 'NATIONAL_REGIME'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Нацрежим (ПП 1875)</span>
        </button>
      </div>

      {/* QUESTION CARDS LIST */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              В выбранной категории вопросов нет
            </p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="mt-3 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isExpanded = expandedDetails[q.id] ?? false;
            const isCopied = copiedId === q.id;
            const isCopiedWithRationale = copiedWithRationaleId === q.id;

            return (
              <div
                key={q.id}
                id={`smart-insight-card-${q.id}`}
                className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 space-y-3.5"
              >
                {/* CARD HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {getPriorityBadge(q.priority)}

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                      {getCategoryIcon(q.category)}
                      <span>{q.categoryLabel}</span>
                    </span>

                    {q.relatedRiskOrClause && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-900 px-2 py-0.5 rounded-md truncate max-w-xs" title={q.relatedRiskOrClause}>
                        {q.relatedRiskOrClause}
                      </span>
                    )}
                  </div>

                  {/* Top Right Copy Button */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                    <Tooltip content="Скопировать официальный текст вопроса для отправки Заказчику">
                      <button
                        type="button"
                        onClick={() => handleCopyQuestion(q)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            <span>Скопировать вопрос</span>
                          </>
                        )}
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* QUESTION TITLE */}
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  {q.title}
                </h4>

                {/* RATIONALE BOX (WHY ASK) */}
                <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-3 text-xs text-amber-950 dark:text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Обоснование риска (Зачем задавать вопрос):</span>
                  </div>
                  <p className="leading-relaxed text-[12px] pl-5 text-amber-900/90 dark:text-amber-200/90">
                    {q.rationale}
                  </p>
                </div>

                {/* QUESTION FORMAL TEXT BOX */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/90 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                      <FileText className="w-3.5 h-3.5" />
                      Текст официального запроса на разъяснение:
                    </span>
                    <span className="text-[10px] text-slate-400">Формулировка для ЭТП/ЕИС</span>
                  </div>
                  <blockquote className="text-slate-800 dark:text-slate-200 font-medium text-xs sm:text-[13px] leading-relaxed italic pl-3 border-l-2 border-indigo-500 bg-slate-50/50 dark:bg-slate-950/40 py-2 rounded-r-lg">
                    «{q.questionText}»
                  </blockquote>
                </div>

                {/* EXPANDABLE LEGAL BASIS & EXPECTED OUTCOME */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
                    {q.legalBasis && (
                      <div className="bg-slate-100/80 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          ⚖️ Правовое основание
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5 block">
                          {q.legalBasis}
                        </span>
                      </div>
                    )}

                    {q.expectedOutcome && (
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">
                          🎯 Ожидаемый результат для поставщика
                        </span>
                        <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                          {q.expectedOutcome}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* CARD FOOTER BUTTONS */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(q.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? 'Скрыть детали' : 'Правовое основание и цель'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyWithRationale(q)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isCopiedWithRationale
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-900'
                      }`}
                      title="Скопировать вопрос вместе с обоснованием риска и правовой базой"
                    >
                      {isCopiedWithRationale ? 'Обоснование скопировано' : 'Скопировать с обоснованием'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
