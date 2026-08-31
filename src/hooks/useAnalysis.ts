import { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisInput, AnalysisResult, ProcedureType, ProcurementDraft } from '../types';
import { getStoredLLMConfig } from '../utils/aiConfig';
import { getPresetAnalysisResult } from '../data/presetResults';
import { auth, saveAnalysisToDb } from '../lib/firebase';
import { generateClientSideDynamicAnalysis } from '../utils/dynamicAnalysis';
import { extractIndividualProductsFromText, isGenericUmbrellaName } from '../utils/productExtractor';
import { loadActiveSession, saveActiveSession, clearActiveSession } from '../utils/autoSaveManager';

export type ReportTab = 'all' | 'overview' | 'insights' | 'spec' | 'risks' | 'workflow' | 'templates';

const DRAFTS_STORAGE_KEY = 'saved_procurement_drafts';

function getStoredDrafts(): ProcurementDraft[] {
  try {
    const raw = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse saved procurement drafts:', e);
    return [];
  }
}

function persistDraftsToStorage(drafts: ProcurementDraft[]): void {
  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts.slice(0, 30)));
  } catch (e) {
    console.warn('Failed to persist drafts:', e);
  }
}

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBackgroundProcessing, setIsBackgroundProcessing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isHeavyTimeout, setIsHeavyTimeout] = useState(false);
  const [showHeavyTimeoutPrompt, setShowHeavyTimeoutPrompt] = useState(false);
  
  const [backgroundNotification, setBackgroundNotification] = useState<{
    title: string;
    result: AnalysisResult;
    timestamp: string;
  } | null>(null);

  const [savedDraftNotification, setSavedDraftNotification] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<ProcurementDraft[]>(() => getStoredDrafts());

  const initialSession = useRef(loadActiveSession()).current;

  const [activeProcedureType, setActiveProcedureType] = useState<ProcedureType>(
    () => initialSession?.uploaderState?.procedureType || '223_FZ_QUOTATION'
  );
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    () => initialSession?.analysisState?.result || null
  );
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(
    () => initialSession?.analysisState?.lastInput || null
  );
  const [activeTab, setActiveTab] = useState<ReportTab>(
    () => (initialSession?.analysisState?.activeTab as ReportTab) || 'all'
  );
  const [externalCategoryFilter, setExternalCategoryFilter] = useState<string | null>(null);
  const [externalSeverityFilter, setExternalSeverityFilter] = useState<string | null>(null);

  // Auto-sync completed analysis or active report tab state to active session
  useEffect(() => {
    if (analysisResult) {
      const currentSession = loadActiveSession();
      saveActiveSession({
        ...currentSession,
        mode: 'analysis',
        analysisState: {
          result: analysisResult,
          activeTab,
          lastInput,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [analysisResult, activeTab, lastInput]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Timer effect: tracks elapsed seconds during foreground or background analysis
  useEffect(() => {
    if (isAnalyzing || isBackgroundProcessing) {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setElapsedSeconds((prev) => {
            const next = prev + 1;
            // When reaching >= 20 seconds, trigger heavy operation timeout prompt
            if (next >= 20) {
              setIsHeavyTimeout(true);
              setShowHeavyTimeoutPrompt((currentShow) => {
                // If it's the exact moment or not yet dismissed, show prompt
                return next === 20 ? true : currentShow;
              });
            }
            return next;
          });
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isAnalyzing, isBackgroundProcessing]);

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
    setIsBackgroundProcessing(false);
    setShowHeavyTimeoutPrompt(false);
    setIsHeavyTimeout(false);
    setElapsedSeconds(0);
    setError('Анализ отменен пользователем');
  };

  const forceInstantAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setIsBackgroundProcessing(false);
    setShowHeavyTimeoutPrompt(false);
    setIsHeavyTimeout(false);
    setElapsedSeconds(0);

    const is44 = Boolean(lastInput?.procedureType?.startsWith('44_FZ') || activeProcedureType.startsWith('44_FZ'));
    
    // Generate high-accuracy dynamic analysis immediately from actual provided text or fallback preset
    let instantResult: AnalysisResult;
    if (lastInput && (lastInput.contractText || lastInput.documentationText || lastInput.tzText)) {
      instantResult = generateClientSideDynamicAnalysis(lastInput);
    } else {
      instantResult = getPresetAnalysisResult(is44 ? 'sample-medical-44fz' : 'sample-furniture-223fz');
    }

    setAnalysisResult(instantResult);
    setActiveTab('all');
    setError(null);
    setTimeout(() => {
      const el = document.getElementById('analysis-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Switch active analysis to background mode (unblocks UI, keeps execution running silently)
  const switchToBackgroundMode = useCallback(() => {
    setIsAnalyzing(false);
    setIsBackgroundProcessing(true);
    setShowHeavyTimeoutPrompt(false);
  }, []);

  // Reopen the foreground progress modal from background state
  const reopenProgressModal = useCallback(() => {
    if (isBackgroundProcessing) {
      setIsAnalyzing(true);
    }
  }, [isBackgroundProcessing]);

  // Dismiss heavy timeout prompt inside the modal
  const dismissHeavyTimeoutPrompt = useCallback(() => {
    setShowHeavyTimeoutPrompt(false);
  }, []);

  // Save current input and progress as draft to allow continuation/re-analysis anytime
  const saveProgressAsDraft = useCallback((): string | null => {
    if (!lastInput) return null;

    const draftId = `draft_${Date.now()}`;
    const totalChars =
      (lastInput.contractText?.length || 0) +
      (lastInput.documentationText?.length || 0) +
      (lastInput.tzText?.length || 0);

    // Extract human-readable title from the input text
    const sampleText = lastInput.contractText || lastInput.documentationText || lastInput.tzText || '';
    const firstCleanLine = sampleText
      .split('\n')
      .map((l) => l.trim().replace(/^===|===$/g, '').trim())
      .find((l) => l.length > 8 && l.length < 140 && !l.toLowerCase().includes('==='));

    const is44FZ = lastInput.procedureType.startsWith('44_FZ');
    const draftTitle =
      firstCleanLine ||
      `Черновик закупки (${is44FZ ? '44-ФЗ' : '223-ФЗ'}) от ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

    const newDraft: ProcurementDraft = {
      id: draftId,
      createdAt: new Date().toISOString(),
      title: draftTitle,
      procedureType: lastInput.procedureType,
      lawType: is44FZ ? '44_FZ' : '223_FZ',
      input: lastInput,
      charCount: totalChars,
      previewSummary: `${Math.round(totalChars / 1000)} тыс. симв. • Сохранено для дозагрузки`,
    };

    const currentDrafts = getStoredDrafts();
    const updatedDrafts = [newDraft, ...currentDrafts.filter((d) => d.id !== draftId)];
    persistDraftsToStorage(updatedDrafts);
    setSavedDrafts(updatedDrafts);

    // Cancel current active fetch to release resources
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsAnalyzing(false);
    setIsBackgroundProcessing(false);
    setShowHeavyTimeoutPrompt(false);
    setIsHeavyTimeout(false);
    setElapsedSeconds(0);

    setSavedDraftNotification(`Черновик «${draftTitle}» успешно сохранен! Вы можете продолжить анализ в любой момент.`);
    return draftId;
  }, [lastInput]);

  // Load a saved draft into active analysis
  const loadDraft = useCallback((draft: ProcurementDraft) => {
    setLastInput(draft.input);
    setActiveProcedureType(draft.procedureType);
    setSavedDraftNotification(null);
    handleAnalyze(draft.input);
  }, []);

  // Delete a saved draft
  const deleteDraft = useCallback((draftId: string) => {
    const currentDrafts = getStoredDrafts();
    const updated = currentDrafts.filter((d) => d.id !== draftId);
    persistDraftsToStorage(updated);
    setSavedDrafts(updated);
  }, []);

  const clearBackgroundNotification = useCallback(() => {
    setBackgroundNotification(null);
  }, []);

  const clearSavedDraftNotification = useCallback(() => {
    setSavedDraftNotification(null);
  }, []);

  const handleAnalyze = async (input: AnalysisInput) => {
    // Cancel any previous active request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAnalyzing(true);
    setIsBackgroundProcessing(false);
    setElapsedSeconds(0);
    setIsHeavyTimeout(false);
    setShowHeavyTimeoutPrompt(false);
    setActiveProcedureType(input.procedureType);
    setError(null);
    setLastInput(input);
    setSavedDraftNotification(null);

    // Persist active procedure and law choice to localStorage
    const is44FZ = input.procedureType.startsWith('44_FZ');
    const lawCategory = is44FZ
      ? '44_FZ'
      : input.procedureType === 'COMMERCIAL' || input.procedureType === 'OTHER'
      ? 'COMMERCIAL'
      : '223_FZ';
    localStorage.setItem('selected_procedure_type', input.procedureType);
    localStorage.setItem('selected_law_type', lawCategory);

    // Absolute fallback threshold (55 seconds) in case of silent network failure
    const maxSafetyTimeoutId = setTimeout(() => {
      if (abortControllerRef.current === controller) {
        console.warn('Max safety threshold reached (55s), resolving via instant dynamic engine');
        controller.abort();
      }
    }, 55000);

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

      let data: AnalysisResult | null = null;

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrichedInput),
          signal: controller.signal,
        });

        clearTimeout(maxSafetyTimeoutId);

        const rawText = await response.text();

        // If response is valid JSON, parse it
        if (response.ok && rawText && !rawText.trim().startsWith('<')) {
          try {
            data = JSON.parse(rawText);
          } catch (pErr) {
            console.warn('JSON parsing error from server response, running fallback:', pErr);
          }
        } else if (!response.ok) {
          console.warn(`Server responded with status ${response.status}: ${rawText.slice(0, 200)}`);
        }
      } catch (fetchErr: any) {
        clearTimeout(maxSafetyTimeoutId);
        if (fetchErr.name === 'AbortError') {
          console.warn('Backend request timed out or aborted, switching to dynamic analysis');
        } else {
          console.warn('Fetch to /api/analyze failed:', fetchErr);
        }
      }

      // If backend was unreachable or returned an HTML error / timeout, seamlessly construct complete dynamic analysis
      if (!data || !data.summary || !data.summary.procurementTitle) {
        console.log('⚡ Generating full client-side dynamic procurement analysis from parsed documentation...');
        data = generateClientSideDynamicAnalysis(enrichedInput);
      }

      // Guarantee product parsing quality: if productList is empty or collapsed into 1 generic umbrella item (e.g., "Офисная мебель"),
      // extract the actual individual items from the provided documents and specifications.
      if (
        data &&
        (!data.productList ||
          data.productList.length === 0 ||
          (data.productList.length === 1 &&
            (isGenericUmbrellaName(data.productList[0]?.name || '') ||
              data.productList[0]?.name === data.summary?.procurementTitle)))
      ) {
        const fullCorpus = `${input.tzText || ''}\n\n${input.contractText || ''}\n\n${input.documentationText || ''}`;
        const recoveredProducts = extractIndividualProductsFromText(
          fullCorpus,
          is44FZ,
          data.summary?.procurementTitle || 'Офисная мебель'
        );
        if (recoveredProducts.length > 0) {
          data.productList = recoveredProducts;
        }
      }

      setAnalysisResult(data);
      setActiveTab('all');

      // Non-blocking auto-save analysis result to Firestore database (runs in background, never delays UI)
      if (auth.currentUser && data) {
        saveAnalysisToDb(
          auth.currentUser.uid,
          auth.currentUser.email || 'Пользователь',
          data,
          data.summary?.procurementTitle || (is44FZ ? 'Анализ закупки 44-ФЗ' : 'Анализ закупки 223-ФЗ')
        ).catch((dbErr) => console.warn('Background auto-save notice:', dbErr));
      }

      // Check if user was in background mode
      setIsBackgroundProcessing((wasBackground) => {
        if (wasBackground && data) {
          setBackgroundNotification({
            title: data.summary?.procurementTitle || (is44FZ ? 'Анализ закупки 44-ФЗ' : 'Анализ закупки 223-ФЗ'),
            result: data,
            timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          });
        }
        return false;
      });

      // Smooth scroll to analysis results if foreground
      setTimeout(() => {
        const el = document.getElementById('analysis-results-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      clearTimeout(maxSafetyTimeoutId);
      console.error('Analysis error:', err);
      // Even in unexpected failure, generate dynamic analysis so user is never blocked
      try {
        const fallbackData = generateClientSideDynamicAnalysis(input);
        setAnalysisResult(fallbackData);
        setActiveTab('all');
      } catch (fallbackErr) {
        setError(err?.message || 'Не удалось выполнить анализ закупки');
      }
    } finally {
      setIsAnalyzing(false);
      setIsBackgroundProcessing(false);
      setShowHeavyTimeoutPrompt(false);
      setIsHeavyTimeout(false);
      setElapsedSeconds(0);
      abortControllerRef.current = null;
    }
  };

  const handleLoadPresetResult = (presetId?: string) => {
    setIsAnalyzing(true);
    setIsBackgroundProcessing(false);
    setElapsedSeconds(0);
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
    setError(null);
    setLastInput(null);
    setActiveTab('all');
    clearExternalFilters();
    clearActiveSession();
  };

  return {
    isAnalyzing,
    isBackgroundProcessing,
    elapsedSeconds,
    isHeavyTimeout,
    showHeavyTimeoutPrompt,
    backgroundNotification,
    savedDraftNotification,
    savedDrafts,
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
    switchToBackgroundMode,
    reopenProgressModal,
    dismissHeavyTimeoutPrompt,
    saveProgressAsDraft,
    loadDraft,
    deleteDraft,
    clearBackgroundNotification,
    clearSavedDraftNotification,
    resetAnalysis,
  };
}
