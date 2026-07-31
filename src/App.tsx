import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GuideModal } from './components/GuideModal';
import { UserFlowSteps } from './components/UserFlowSteps';
import { DocumentUploader } from './components/DocumentUploader';
import { RiskSummaryCard } from './components/RiskSummaryCard';
import { RiskMapCard } from './components/RiskMapCard';
import { DeliveryLogisticsCard } from './components/DeliveryLogisticsCard';
import { ContractRisksTable } from './components/ContractRisksTable';
import { ProductListTable } from './components/ProductListTable';
import { SubmissionChecklist } from './components/SubmissionChecklist';
import { PostAwardWorkflow } from './components/PostAwardWorkflow';
import { TemplatesSection } from './components/TemplatesSection';
import { TenderChatModal } from './components/TenderChatModal';
import { LegalSearchModal } from './components/LegalSearchModal';
import { DeepAuditModal } from './components/DeepAuditModal';
import { ScanAnalyzerModal } from './components/ScanAnalyzerModal';
import { AuthAndHistoryDrawer } from './components/AuthAndHistoryDrawer';
import { SuppliersCatalogModal } from './components/SuppliersCatalogModal';
import { AnalysisProgressScreen } from './components/AnalysisProgressScreen';
import { auth, saveAnalysisToDb } from './lib/firebase';
import { AnalysisInput, AnalysisResult } from './types';
import { generatePdfReport } from './utils/pdfGenerator';
import { getPresetAnalysisResult } from './data/presetResults';
import { 
  Download, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Layers,
  BarChart3,
  Package,
  ShieldAlert,
  Truck,
  FileCheck,
  ChevronRight,
  ArrowLeft,
  History
} from 'lucide-react';

export default function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'spec' | 'risks' | 'workflow' | 'templates'>('all');

  // Interactive AI & Firebase Modals State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDeepAuditOpen, setIsDeepAuditOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSuppliersCatalogOpen, setIsSuppliersCatalogOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleAnalyze = async (input: AnalysisInput) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

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
            data.summary?.procurementTitle || 'Анализ закупки 223-ФЗ'
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
      console.error('Analysis error:', err);
      setError(err?.message || 'Не удалось выполнить анализ закупки');
    } finally {
      setIsAnalyzing(false);
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
    }, 300);
  };

  const handleExportPdf = async () => {
    if (!analysisResult) return;
    setIsExportingPdf(true);
    try {
      await generatePdfReport(analysisResult, 'Отчет_223_ФЗ');
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Ошибка при формировании PDF файла. Попробуйте еще раз.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportTxt = () => {
    if (!analysisResult) return;

    const summary = analysisResult.summary;
    const reportText = `ОТЧЕТ ПО АНАЛИЗУ ЗАКУПКИ ПО 223-ФЗ
=========================================
Наименование: ${summary.procurementTitle}
Индекс риска: ${summary.overallRiskScore} / 100
Уровень риска: ${summary.riskLevel}
Резюме: ${summary.keyTakeaway}

СПЕЦИФИКАЦИЯ ПРОДУКЦИИ:
-----------------------------------------
${(analysisResult.productList || []).map((p, i) => `${i + 1}. ${p.name} | Кол-во: ${p.quantity} | Характеристики: ${p.specification} | ПП 1875: ${p.pp1875Status}`).join('\n')}

РЕЕСТР РИСКОВ ПРОЕКТА ДОГОВОРА:
-----------------------------------------
${analysisResult.contractRisks.map((r, i) => `
${i + 1}. [${r.severity}] ${r.title} (${r.clauseNumber || 'Б/Н'})
   Цитата: «${r.clauseQuote}»
   Риск: ${r.explanation}
   Рекомендация: ${r.recommendation}
`).join('\n')}

ПРАВИЛА ПОДАЧИ ЗАЯВКИ:
-----------------------------------------
- Запрос в таблицу: ${analysisResult.submissionRulesCheck.requestInTableRequired ? 'Да' : 'Нет'}
- Формат файлов: ${analysisResult.submissionRulesCheck.requiredFilesStructure.join(', ')}
- ПП РФ № 1875: ${analysisResult.submissionRulesCheck.pp1875Applies ? 'ПРИМЕНЯЕТСЯ (' + analysisResult.submissionRulesCheck.pp1875Details + ')' : 'Не применяется'}
- Бухгалтерия: ${analysisResult.submissionRulesCheck.accountingInfoNeeded ? 'ТРЕБУЮТСЯ ДАННЫЕ (' + analysisResult.submissionRulesCheck.accountingItems.join(', ') + ')' : 'Не требуется'}

ПОРЯДОК ИСПОЛНЕНИЯ И ЗАКРЫВАШКИ:
-----------------------------------------
- Сопровождающие документы: ${analysisResult.postAwardWorkflow.accompanyingDocs.join(', ')}
- Работа с документами приемки: ${analysisResult.postAwardWorkflow.acceptanceDocsStrategy}
- Мотивированный отказ: ${analysisResult.postAwardWorkflow.motivatedRefusalGuide}
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Отчет_223_ФЗ_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick Metrics
  const productsCount = analysisResult?.productList?.length || 0;
  const risksCount = analysisResult?.contractRisks?.length || 0;
  const criticalRisksCount = analysisResult?.contractRisks?.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length || 0;
  const templatesCount = analysisResult?.generatedTemplates ? Object.keys(analysisResult.generatedTemplates).length : 0;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isAnalyzing={isAnalyzing}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDeepAudit={() => setIsDeepAuditOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSuppliersCatalog={() => setIsSuppliersCatalogOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 flex-1 w-full">
        {/* Screen 1: Document Uploader (Only displayed when not analyzing and no report result) */}
        {!isAnalyzing && !analysisResult && (
          <DocumentUploader
            onAnalyze={handleAnalyze}
            onLoadPresetResult={handleLoadPresetResult}
            isAnalyzing={isAnalyzing}
            onOpenScanModal={() => setIsScanOpen(true)}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-3xl p-5 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm animate-shake shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block mb-0.5">Ошибка анализа:</strong>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Screen 2: Splash Loading Progress Screen during analysis */}
        {isAnalyzing && (
          <AnalysisProgressScreen />
        )}

        {/* Screen 3: Analysis Results Report Screen */}
        {analysisResult && !isAnalyzing && (
          <div id="analysis-results-section" className="space-y-5 animate-fade-in pt-2">
            
            {/* Top Navigation & Export Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-xs">
              
              {/* Back to Home & Title */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="Вернуться к экрану загрузки файлов"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Загрузить новый файл</span>
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded-md uppercase">
                      Отчет готов
                    </span>
                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {analysisResult.summary.projectName || analysisResult.summary.procurementTitle}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Открыть историю сохранений"
                >
                  <History className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">История БД</span>
                </button>

                <button
                  id="export-pdf-report-btn"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>PDF Отчет</span>
                </button>

                <button
                  id="export-txt-report-btn"
                  onClick={handleExportTxt}
                  className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Скачать текстовую версию"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics & Structured Screen Switcher Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-xs space-y-3">
              {/* Quick Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1 pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">Индекс риска</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">{analysisResult.summary.overallRiskScore} / 100</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">Позиции ТЗ</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">{productsCount} товаров</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">Критичные риски</span>
                    <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-0.5 block">{criticalRisksCount} из {risksCount}</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">Готовые документы</span>
                    <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">{templatesCount} шаблонов</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Navigation Screens Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 dark:border-slate-800/80 pt-2 px-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Все разделы</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Аналитика & Риски</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('spec')}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'spec'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Спецификация ({productsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('risks')}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'risks'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Реестр рисков & Чек-лист</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('workflow')}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'workflow'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Логистика & Исполнение</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTab === 'templates'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Шаблоны писем ({templatesCount})</span>
                </button>
              </div>
            </div>

            {/* SCREEN 1: Overview & Risk Analysis */}
            {(activeTab === 'all' || activeTab === 'overview') && (
              <div className="space-y-6">
                <RiskSummaryCard summary={analysisResult.summary} />
                <RiskMapCard 
                  summary={analysisResult.summary} 
                  contractRisks={analysisResult.contractRisks} 
                />
              </div>
            )}

            {/* SCREEN 2: Delivery & Logistics */}
            {(activeTab === 'all' || activeTab === 'overview' || activeTab === 'workflow') && (
              <DeliveryLogisticsCard deliveryInfo={analysisResult.deliveryInfo} />
            )}

            {/* SCREEN 3: Product Specification Table */}
            {(activeTab === 'all' || activeTab === 'spec') && (
              <ProductListTable products={analysisResult.productList || []} />
            )}

            {/* SCREEN 4: Contract Risks & Submission Checklist */}
            {(activeTab === 'all' || activeTab === 'risks') && (
              <div className="space-y-6">
                <ContractRisksTable risks={analysisResult.contractRisks} />
                <SubmissionChecklist check={analysisResult.submissionRulesCheck} />
              </div>
            )}

            {/* SCREEN 5: Post Award Execution Workflow */}
            {(activeTab === 'all' || activeTab === 'workflow') && (
              <PostAwardWorkflow workflow={analysisResult.postAwardWorkflow} />
            )}

            {/* SCREEN 6: Generated Templates & Letters */}
            {(activeTab === 'all' || activeTab === 'templates') && (
              <TemplatesSection templates={analysisResult.generatedTemplates} />
            )}
          </div>
        )}
      </main>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* AI Tender Chatbot Modal */}
      <TenderChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeAnalysisContext={
          analysisResult
            ? `Закупка: ${analysisResult.summary.procurementTitle}. Индекс риска: ${analysisResult.summary.overallRiskScore}/100. Резюме: ${analysisResult.summary.keyTakeaway}`
            : undefined
        }
      />

      {/* Legal Search Grounding Modal */}
      <LegalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* High Thinking Deep Legal Audit Modal */}
      <DeepAuditModal
        isOpen={isDeepAuditOpen}
        onClose={() => setIsDeepAuditOpen(false)}
        procurementContext={analysisResult?.summary.procurementTitle}
      />

      {/* Multimodal Scan / Photo OCR Modal */}
      <ScanAnalyzerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onExtractedTextReady={(extractedText) => {
          handleAnalyze({
            procedureType: '223_FZ_QUOTATION',
            contractText: extractedText,
            documentationText: '',
            tzText: '',
          });
        }}
      />

      {/* Firestore DB & Auth Drawer */}
      <AuthAndHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentAnalysisResult={analysisResult}
        onSelectAnalysis={(savedResult) => {
          setAnalysisResult(savedResult);
          setActiveTab('all');
          setTimeout(() => {
            const el = document.getElementById('analysis-results-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Verified Domestic Furniture Suppliers Catalog Modal */}
      <SuppliersCatalogModal
        isOpen={isSuppliersCatalogOpen}
        onClose={() => setIsSuppliersCatalogOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-12 mb-16 sm:mb-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1 font-medium">
          <p>Интерфейс анализатора заявки по регламенту 223-ФЗ | ИИ-ассистент тендерного отдела</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Все расчёты и выводы формируются с учётом неисполняемого списания штрафов по 223-ФЗ</p>
        </div>
      </footer>

      {/* Floating Sticky Mobile Quick Action Bar when report is open */}
      {analysisResult && !isAnalyzing && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 px-4 flex items-center justify-between gap-2 shadow-2xl animate-fade-in">
          <button
            type="button"
            onClick={() => setAnalysisResult(null)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Новый</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>PDF Отчет</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>БД</span>
          </button>
        </div>
      )}
    </div>
  );
}
