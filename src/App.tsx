import React from 'react';
import { Header } from './components/Header';
import { DocumentUploader } from './components/DocumentUploader';
import { AnalysisProgressScreen } from './components/AnalysisProgressScreen';
import { PreAnalysisDashboard } from './components/PreAnalysisDashboard';
import { AnalysisReportView } from './components/AnalysisReportView';
import { AppModals } from './components/AppModals';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useTheme } from './hooks/useTheme';
import { useAuthUser } from './hooks/useAuthUser';
import { useModals } from './hooks/useModals';
import { useAnalysis } from './hooks/useAnalysis';
import { useExports } from './hooks/useExports';
import { 
  AlertCircle, 
  RotateCcw, 
  Sparkles, 
  Settings, 
  X, 
  FileText, 
  Layers, 
  Clock, 
  Bookmark, 
  Zap, 
  CheckCircle2,
  Maximize2
} from 'lucide-react';

export default function App() {
  // 1. Theme Management (Logic hook)
  const { isDarkMode, toggleDarkMode } = useTheme();

  // 2. Authentication Management (Logic hook)
  const {
    currentUser,
    isAuthGateOpen,
    openAuthModal,
    closeAuthModal,
    handleSignOut,
  } = useAuthUser();

  // 3. Modals State Management (Logic hook)
  const modals = useModals();

  // 4. Procurement Analysis Engine & State (Logic hook)
  const {
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
  } = useAnalysis();

  // 5. Multi-format Document Exports (Logic hook)
  const {
    isExportingPdf,
    isExportingGoogleDocs,
    isExportingGoogleSheets,
    googleDocsSuccessUrl,
    googleSheetsSuccessUrl,
    exportError,
    setExportError,
    handleExportPdf,
    handleExportGoogleDocs,
    handleExportGoogleSheets,
    handleExportTxt,
  } = useExports(analysisResult);

  // Helper to select and view a saved analysis
  const handleSelectSavedAnalysis = (savedResult: any) => {
    setAnalysisResult(savedResult);
    setActiveTab('all');
    setTimeout(() => {
      const el = document.getElementById('analysis-results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleScanAnalyze = (extractedText: string) => {
    handleAnalyze({
      procedureType: '223_FZ_QUOTATION',
      contractText: extractedText,
      documentationText: '',
      tzText: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200 pb-20 md:pb-0">
      {/* Top Application Header */}
      <Header
        onOpenGuide={() => modals.setIsGuideOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAnalyzing={isAnalyzing || isBackgroundProcessing}
        onOpenChat={() => modals.setIsChatOpen(true)}
        onOpenSearch={() => modals.setIsSearchOpen(true)}
        onOpenDeepAudit={() => modals.setIsDeepAuditOpen(true)}
        onOpenHistory={() => modals.setIsHistoryOpen(true)}
        onOpenSuppliersCatalog={() => modals.setIsSuppliersCatalogOpen(true)}
        onOpenCalendar={() => modals.setIsCalendarOpen(true)}
        onOpenCustomerVerification={() => modals.openCustomerVerification()}
        onOpenAISettings={() => modals.setIsAISettingsOpen(true)}
        onOpenContractDiff={() => modals.openContractDiff()}
        onOpenFasComplaint={() => modals.setIsFasComplaintOpen(true)}
        onOpenBankGuarantee={() => modals.setIsBankGuaranteeOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={openAuthModal}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex-1 w-full">
        
        {/* Background Analysis Completed Interactive Banner */}
        {backgroundNotification && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-2 border-emerald-500/60 rounded-3xl p-4 sm:p-5 text-slate-100 shadow-xl space-y-2 animate-fadeIn flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-emerald-200 flex items-center gap-2">
                  <span>Фоновый анализ закупки успешно завершен!</span>
                  <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {backgroundNotification.timestamp}
                  </span>
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                  {backgroundNotification.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAnalysisResult(backgroundNotification.result);
                  setActiveTab('all');
                  clearBackgroundNotification();
                  setTimeout(() => {
                    const el = document.getElementById('analysis-results-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Открыть отчет</span>
              </button>
              <button
                type="button"
                onClick={clearBackgroundNotification}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Saved Draft Success Banner */}
        {savedDraftNotification && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 text-amber-200 text-xs sm:text-sm shadow-md flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{savedDraftNotification}</span>
            </div>
            <button
              type="button"
              onClick={clearSavedDraftNotification}
              className="p-1 text-amber-400 hover:text-white rounded-lg hover:bg-amber-900/40 transition-colors cursor-pointer"
              title="Скрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Error & Recovery Action Banner */}
        {(error || exportError) && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/70 rounded-3xl p-5 sm:p-6 text-rose-900 dark:text-rose-200 text-sm shadow-md space-y-4 animate-shake">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 rounded-2xl text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-rose-950 dark:text-rose-100">
                    {error ? 'Не удалось завершить анализ закупки' : 'Уведомление экспорта'}
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-850 dark:text-rose-300/90 mt-0.5 leading-relaxed">
                    {error || exportError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                title="Скрыть ошибку"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Recovery Actions Bar */}
            <div className="pt-3 border-t border-rose-200/80 dark:border-rose-900/60 flex flex-wrap items-center gap-2.5">
              {lastInput && (
                <button
                  type="button"
                  onClick={handleRetryAnalysis}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Повторить запрос</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  handleLoadPresetResult('sample-furniture-223fz');
                }}
                className="px-3.5 py-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Запустить демо-отчет (223-ФЗ Мебель)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  handleLoadPresetResult('sample-medical-44fz');
                }}
                className="px-3.5 py-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Запустить демо 44-ФЗ (Медицина)</span>
              </button>

              <button
                type="button"
                onClick={() => modals.setIsAISettingsOpen(true)}
                className="px-3.5 py-2 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Настройки ИИ / Модель</span>
              </button>
            </div>
          </div>
        )}

        {/* Screen 1: Dashboard & Document Uploader */}
        {!isAnalyzing && !analysisResult && (
          <>
            <PreAnalysisDashboard
              onOpenHistory={() => modals.setIsHistoryOpen(true)}
              onSelectAnalysis={handleSelectSavedAnalysis}
              onOpenSuppliersCatalog={() => modals.setIsSuppliersCatalogOpen(true)}
            />
            <div id="uploader-section">
              <DocumentUploader
                onAnalyze={handleAnalyze}
                onLoadPresetResult={handleLoadPresetResult}
                isAnalyzing={isAnalyzing || isBackgroundProcessing}
                savedDrafts={savedDrafts}
                onLoadDraft={loadDraft}
                onDeleteDraft={deleteDraft}
                onOpenScanModal={() => modals.setIsScanOpen(true)}
                onOpenHistory={() => modals.setIsHistoryOpen(true)}
                onOpenContractDiff={(text) => modals.openContractDiff(text)}
                onOpenFasComplaint={() => modals.setIsFasComplaintOpen(true)}
                onOpenBankGuarantee={() => modals.setIsBankGuaranteeOpen(true)}
                onOpenAISettings={() => modals.setIsAISettingsOpen(true)}
              />
            </div>
          </>
        )}

        {/* Screen 2: Foreground Loading State Progress Screen */}
        {isAnalyzing && (
          <AnalysisProgressScreen
            procedureType={activeProcedureType}
            elapsedSeconds={elapsedSeconds}
            isHeavyTimeout={isHeavyTimeout}
            showHeavyTimeoutPrompt={showHeavyTimeoutPrompt}
            onSwitchToBackground={switchToBackgroundMode}
            onSaveDraft={saveProgressAsDraft}
            onDismissHeavyPrompt={dismissHeavyTimeoutPrompt}
            onCancel={cancelAnalysis}
            onForceInstant={forceInstantAudit}
          />
        )}

        {/* Screen 3: Analysis Results Report View */}
        {analysisResult && !isAnalyzing && (
          <AnalysisReportView
            analysisResult={analysisResult}
            onReset={resetAnalysis}
            onOpenHistory={() => modals.setIsHistoryOpen(true)}
            onOpenGuide={() => modals.setIsGuideOpen(true)}
            onOpenPdfPreview={() => modals.setIsPdfPreviewOpen(true)}
            onOpenCustomerVerification={modals.openCustomerVerification}
            onUpdateAnalysisVersion={(updated) => setAnalysisResult(updated)}
            onOpenContractDiff={() => modals.openContractDiff(lastInput?.contractText)}
            onOpenFasComplaint={() => modals.setIsFasComplaintOpen(true)}
            onOpenBankGuarantee={() => modals.setIsBankGuaranteeOpen(true)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            externalCategoryFilter={externalCategoryFilter}
            externalSeverityFilter={externalSeverityFilter}
            onRiskSectorClick={handleRiskSectorClick}
            onClearExternalFilter={clearExternalFilters}
            isExportingPdf={isExportingPdf}
            isExportingGoogleDocs={isExportingGoogleDocs}
            isExportingGoogleSheets={isExportingGoogleSheets}
            googleDocsSuccessUrl={googleDocsSuccessUrl}
            googleSheetsSuccessUrl={googleSheetsSuccessUrl}
            exportError={exportError}
            onClearExportError={() => setExportError(null)}
            onExportGoogleDocs={handleExportGoogleDocs}
            onExportGoogleSheets={handleExportGoogleSheets}
            onExportTxt={handleExportTxt}
          />
        )}
      </main>

      {/* Persistent Floating Background Progress Widget (when working in background) */}
      {isBackgroundProcessing && (
        <aside aria-label="Фоновый анализ закупки" className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 animate-slideUp">
          <div className="bg-slate-900/95 border-2 border-indigo-500/60 backdrop-blur-md rounded-2xl shadow-2xl p-3.5 text-slate-100 max-w-sm sm:max-w-md space-y-2.5 ring-1 ring-indigo-500/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping absolute inset-0" />
                  <div className="w-3 h-3 rounded-full bg-indigo-400 relative" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Фоновый анализ закупки</span>
                  </h5>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{elapsedSeconds} сек. в работе</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reopenProgressModal}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Развернуть окно прогресса"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelAnalysis}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Отменить"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full animate-pulse w-full" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={saveProgressAsDraft}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold rounded-lg border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3 h-3" />
                <span>В черновик</span>
              </button>

              <button
                type="button"
                onClick={forceInstantAudit}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Открыть сейчас</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Unified Modals & Overlays Container */}
      <AppModals
        currentUser={currentUser}
        isAuthGateOpen={isAuthGateOpen}
        onCloseAuthGate={closeAuthModal}
        analysisResult={analysisResult}
        onSelectSavedAnalysis={handleSelectSavedAnalysis}
        activeProcedureType={activeProcedureType}
        onScanAnalyze={handleScanAnalyze}
        isGuideOpen={modals.isGuideOpen}
        onCloseGuide={() => modals.setIsGuideOpen(false)}
        isChatOpen={modals.isChatOpen}
        onCloseChat={() => modals.setIsChatOpen(false)}
        isSearchOpen={modals.isSearchOpen}
        onCloseSearch={() => modals.setIsSearchOpen(false)}
        isDeepAuditOpen={modals.isDeepAuditOpen}
        onCloseDeepAudit={() => modals.setIsDeepAuditOpen(false)}
        isScanOpen={modals.isScanOpen}
        onCloseScan={() => modals.setIsScanOpen(false)}
        isHistoryOpen={modals.isHistoryOpen}
        onCloseHistory={() => modals.setIsHistoryOpen(false)}
        onOpenCalendarFromHistory={() => modals.setIsCalendarOpen(true)}
        isCalendarOpen={modals.isCalendarOpen}
        onCloseCalendar={() => modals.setIsCalendarOpen(false)}
        isSuppliersCatalogOpen={modals.isSuppliersCatalogOpen}
        onCloseSuppliersCatalog={() => modals.setIsSuppliersCatalogOpen(false)}
        isPdfPreviewOpen={modals.isPdfPreviewOpen}
        onClosePdfPreview={() => modals.setIsPdfPreviewOpen(false)}
        isCustomerVerificationOpen={modals.isCustomerVerificationOpen}
        onCloseCustomerVerification={modals.closeCustomerVerification}
        verificationInn={modals.verificationInn}
        verificationCustomerName={modals.verificationCustomerName}
        isAISettingsOpen={modals.isAISettingsOpen}
        onCloseAISettings={() => modals.setIsAISettingsOpen(false)}
        isContractDiffOpen={modals.isContractDiffOpen}
        onCloseContractDiff={modals.closeContractDiff}
        contractDiffOriginalText={modals.contractDiffOriginalText}
        isFasComplaintOpen={modals.isFasComplaintOpen}
        onCloseFasComplaint={() => modals.setIsFasComplaintOpen(false)}
        isBankGuaranteeOpen={modals.isBankGuaranteeOpen}
        onCloseBankGuarantee={() => modals.setIsBankGuaranteeOpen(false)}
        isExportingPdf={isExportingPdf}
        isExportingGoogleDocs={isExportingGoogleDocs}
        isExportingGoogleSheets={isExportingGoogleSheets}
        onDownloadPdf={handleExportPdf}
        onExportTxt={handleExportTxt}
        onExportGoogleDocs={handleExportGoogleDocs}
        onExportGoogleSheets={handleExportGoogleSheets}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 mb-16 sm:mb-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
          <p>Интерфейс анализатора заявки по регламенту 223-ФЗ и 44-ФЗ | ИИ-ассистент тендерного отдела</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Все расчёты и выводы формируются с учётом неисполняемого списания штрафов по 223-ФЗ
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenChat={() => modals.setIsChatOpen(true)}
        onOpenCustomerVerification={() => modals.openCustomerVerification()}
        onOpenSuppliersCatalog={() => modals.setIsSuppliersCatalogOpen(true)}
        onOpenCalendar={() => modals.setIsCalendarOpen(true)}
        onOpenHistory={() => modals.setIsHistoryOpen(true)}
        onOpenGuide={() => modals.setIsGuideOpen(true)}
        onScrollToUploader={() => {
          if (analysisResult) {
            resetAnalysis();
          }
          setTimeout(() => {
            const el = document.getElementById('uploader-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onOpenAISettings={() => modals.setIsAISettingsOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={openAuthModal}
      />
    </div>
  );
}
