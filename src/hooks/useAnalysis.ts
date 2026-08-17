import { useState, useRef } from 'react';
import { AnalysisInput, AnalysisResult, ProcedureType } from '../types';
import { getStoredLLMConfig } from '../utils/aiConfig';
import { getPresetAnalysisResult } from '../data/presetResults';
import { auth, saveAnalysisToDb } from '../lib/firebase';

export type ReportTab = 'all' | 'overview' | 'spec' | 'risks' | 'workflow' | 'templates';

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeProcedureType, setActiveProcedureType] = useState<ProcedureType>('223_FZ_QUOTATION');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('all');
  const [externalCategoryFilter, setExternalCategoryFilter] = useState<string | null>(null);
  const [externalSeverityFilter, setExternalSeverityFilter] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleRiskSectorClick = (filter: { category?: string | null; severity?: string | null }) => {
    if (activeTab !== 'all' && activeTab !== 'risks') {
      setActiveTab('all');
    }
    setExternalCategoryFilter(filter.category || null);
    setExternalSeverityFilter(filter.severity || null);
  };

  const clearExternalFilters = () => {
    setExternalCategoryFilter(null);
    setExternalSeverityFilter(null);
  };

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setError('Анализ отменен пользователем');
  };

  const forceInstantAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    const is44 = Boolean(lastInput?.procedureType?.startsWith('44_FZ') || activeProcedureType.startsWith('44_FZ'));
    const fallbackPreset = getPresetAnalysisResult(is44 ? 'sample-medical-44fz' : 'sample-furniture-223fz');
    setAnalysisResult(fallbackPreset);
    setActiveTab('all');
    setError(null);
    setTimeout(() => {
      const el = document.getElementById('analysis-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAnalyze = async (input: AnalysisInput) => {
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setActiveProcedureType(input.procedureType);
    setError(null);
    setLastInput(input);

    // Persist active procedure and law choice to localStorage
    const is44FZ = input.procedureType.startsWith('44_FZ');
    const lawCategory = is44FZ
      ? '44_FZ'
      : input.procedureType === 'COMMERCIAL' || input.procedureType === 'OTHER'
      ? 'COMMERCIAL'
      : '223_FZ';
    localStorage.setItem('selected_procedure_type', input.procedureType);
    localStorage.setItem('selected_law_type', lawCategory);

    // Client-side safety timeout: 120 seconds max for large documents
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        console.warn("Analysis timeout reached (120s)");
        controller.abort();
      }
    }, 120000);

    try {
      // Load saved law-specific regulations and guidelines from localStorage
      const saved44FZ = localStorage.getItem('regulations_44fz');
      const saved223FZ = localStorage.getItem('regulations_223fz');
      const savedCore = localStorage.getItem('regulations_core');
      const customGuidelines = localStorage.getItem('custom_tender_guidelines');

      let combinedGuidelines = is44FZ ? saved44FZ || '' : saved223FZ || '';
      if (savedCore) {
        combinedGuidelines += `\n\n[Базовые Инструкции]:\n${savedCore}`;
      }
      if (customGuidelines) {
        combinedGuidelines += `\n\n[Дополнительный Регламент]:\n${customGuidelines}`;
      }

      // Directives for statutory deadline controls and national mode (44-FZ vs 223-FZ)
      let statutoryNotes = '';
      if (is44FZ) {
        statutoryNotes = `
[ТРЕБОВАНИЯ И ЖЕСТКИЙ КОНТРОЛЬ СРОКОВ ПО 44-ФЗ]:
1. Срок оплаты Заказчиком: НЕ БОЛЕЕ 7 РАБОЧИХ ДНЕЙ со дня подписания электронного УПД в ЕИС (ч. 13.1 ст. 34 ФЗ № 44).
2. Срок заключения контракта: не ранее 10 дней с даты итогового протокола и не более 5 дней на подписание победителем на ЭТП.
3. Протокол разногласий: направляется не более 1 раза в течение 5 дней.
4. Национальный режим: проверка запретов ПП РФ № 616, правил ограничения ПП РФ № 617 ("Третий лишний") и минимальной доли по ПП РФ № 1875.
5. Расчет пеней (1/300 ключевой ставки ЦБ) и ОБЯЗАТЕЛЬНОЕ списание штрафов/пеней по ПП РФ № 783 при сумме до 5% от ЦК.
`;
      } else {
        statutoryNotes = `
[СПЕЦИФИКА 223-ФЗ И КОММЕРЧЕСКИХ ТОРГОВ]:
1. Штрафы и пени по 223-ФЗ НЕ СПИСЫВАЮТСЯ! Оценивать риски задержек поставки как критические.
2. Проверка условий одностороннего отказа Заказчика и права закупки у 3-х лиц за счет Поставщика.
3. Проверка сроков поставки по заявкам (риск сжатых сроков менее 5 рабочих дней).
`;
      }

      const enrichedInput = {
        ...input,
        additionalNotes: `${input.additionalNotes || ''}\n${statutoryNotes}\n${
          combinedGuidelines ? `\n[Официальный Регламент Проверки]:\n${combinedGuidelines}` : ''
        }`.trim(),
        llmConfig: getStoredLLMConfig(),
        bypassCache: true, // Force fresh real analysis of the user's specific files
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedInput),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Ошибка сервера: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
      setActiveTab('all');

      // Auto-save analysis result to Firestore database
      if (auth.currentUser) {
        try {
          await saveAnalysisToDb(
            auth.currentUser.uid,
            auth.currentUser.email || 'Пользователь',
            data,
            data.summary?.procurementTitle || (is44FZ ? 'Анализ закупки 44-ФЗ' : 'Анализ закупки 223-ФЗ')
          );
        } catch (dbErr) {
          console.warn('Auto-save notice:', dbErr);
        }
      }

      // Smooth scroll to analysis results
      setTimeout(() => {
        const el = document.getElementById('analysis-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Превышено время ожидания ответа ИИ или запрос был отменен. Пожалуйста, проверьте подключение или выберите другую модель ИИ в настройках.');
      } else {
        console.error('Analysis error:', err);
        setError(err?.message || 'Не удалось выполнить анализ закупки');
      }
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleLoadPresetResult = (presetId?: string) => {
    setIsAnalyzing(true);
    setError(null);
    setTimeout(() => {
      const data = getPresetAnalysisResult(presetId || 'sample-furniture-223fz');
      setAnalysisResult(data);
      setActiveTab('all');
      setIsAnalyzing(false);
      setTimeout(() => {
        const el = document.getElementById('analysis-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 200);
  };

  const handleRetryAnalysis = () => {
    if (lastInput) {
      handleAnalyze(lastInput);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
  };

  return {
    isAnalyzing,
    activeProcedureType,
    analysisResult,
    setAnalysisResult,
    error,
    setError,
    lastInput,
    handleRetryAnalysis,
    activeTab,
    setActiveTab,
    externalCategoryFilter,
    externalSeverityFilter,
    handleRiskSectorClick,
    clearExternalFilters,
    handleAnalyze,
    handleLoadPresetResult,
    cancelAnalysis,
    forceInstantAudit,
    resetAnalysis,
  };
}
