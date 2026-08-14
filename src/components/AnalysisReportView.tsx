import React from 'react';
import { AnalysisResult } from '../types';
import { ReportTab } from '../hooks/useAnalysis';
import { AnalysisVersionHistoryBanner } from './AnalysisVersionHistoryBanner';
import { RiskSummaryCard } from './RiskSummaryCard';
import { RiskMapCard } from './RiskMapCard';
import { RiskDynamicsChart } from './RiskDynamicsChart';
import { DeliveryLogisticsCard } from './DeliveryLogisticsCard';
import { ContractRisksTable } from './ContractRisksTable';
import { ProductListTable } from './ProductListTable';
import { SubmissionChecklist } from './SubmissionChecklist';
import { PostAwardWorkflow } from './PostAwardWorkflow';
import { TemplatesSection } from './TemplatesSection';
import { 
  ArrowLeft, 
  History, 
  FileText, 
  Table, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  BarChart3,
  Package,
  ShieldAlert,
  FileCheck,
  Layers,
  Truck,
  BookOpen,
  FileDiff,
  Scale,
  Calculator
} from 'lucide-react';

interface AnalysisReportViewProps {
  analysisResult: AnalysisResult;
  onReset: () => void;
  onOpenHistory: () => void;
  onOpenGuide: () => void;
  onOpenPdfPreview: () => void;
  onOpenCustomerVerification: (inn?: string, name?: string) => void;
  onUpdateAnalysisVersion: (updated: AnalysisResult) => void;
  onOpenContractDiff?: () => void;
  onOpenFasComplaint?: () => void;
  onOpenBankGuarantee?: () => void;
  
  // Tabs & filters
  activeTab: ReportTab;
  setActiveTab: (tab: ReportTab) => void;
  externalCategoryFilter: string | null;
  externalSeverityFilter: string | null;
  onRiskSectorClick: (filter: { category?: string | null; severity?: string | null }) => void;
  onClearExternalFilter: () => void;

  // Exports
  isExportingPdf: boolean;
  isExportingGoogleDocs: boolean;
  isExportingGoogleSheets: boolean;
  googleDocsSuccessUrl: string | null;
  googleSheetsSuccessUrl: string | null;
  onExportGoogleDocs: () => void;
  onExportGoogleSheets: () => void;
  onExportTxt: () => void;
}

export const AnalysisReportView: React.FC<AnalysisReportViewProps> = ({
  analysisResult,
  onReset,
  onOpenHistory,
  onOpenGuide,
  onOpenPdfPreview,
  onOpenCustomerVerification,
  onUpdateAnalysisVersion,
  onOpenContractDiff,
  onOpenFasComplaint,
  onOpenBankGuarantee,
  activeTab,
  setActiveTab,
  externalCategoryFilter,
  externalSeverityFilter,
  onRiskSectorClick,
  onClearExternalFilter,
  isExportingPdf,
  isExportingGoogleDocs,
  isExportingGoogleSheets,
  googleDocsSuccessUrl,
  googleSheetsSuccessUrl,
  onExportGoogleDocs,
  onExportGoogleSheets,
  onExportTxt,
}) => {
  const productsCount = analysisResult?.productList?.length || 0;
  const risksCount = analysisResult?.contractRisks?.length || 0;
  const criticalRisksCount =
    analysisResult?.contractRisks?.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH')
      .length || 0;
  const templatesCount = analysisResult?.generatedTemplates
    ? Object.keys(analysisResult.generatedTemplates).length
    : 0;

  return (
    <div id="analysis-results-section" className="space-y-5 animate-fade-in pt-2">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-xs">
        {/* Back Button & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
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
                {analysisResult?.summary?.projectName || analysisResult?.summary?.procurementTitle || 'Анализ закупки'}
              </h2>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Открыть историю сохранений"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">История БД</span>
          </button>

          {onOpenContractDiff && (
            <button
              type="button"
              onClick={onOpenContractDiff}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Сравнить редакции договора и составить протокол разногласий"
            >
              <FileDiff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Diff правок</span>
            </button>
          )}

          {onOpenFasComplaint && (
            <button
              type="button"
              onClick={onOpenFasComplaint}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/80 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Сформировать жалобу в ФАС РФ по ст. 105 44-ФЗ"
            >
              <Scale className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>ФАС РФ</span>
            </button>
          )}

          {onOpenBankGuarantee && (
            <button
              type="button"
              onClick={onOpenBankGuarantee}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Рассчитать обеспечение и комиссию независимой банковской гарантии"
            >
              <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Калькулятор БГ</span>
            </button>
          )}

          <button
            id="export-gdocs-report-btn"
            onClick={onExportGoogleDocs}
            disabled={isExportingGoogleDocs}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Сохранить отчет непосредственно в Ваш Google Документ"
          >
            {isExportingGoogleDocs ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>Google Doc</span>
          </button>

          <button
            id="export-gsheets-report-btn"
            onClick={onExportGoogleSheets}
            disabled={isExportingGoogleSheets}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Сохранить ТЗ и Риски в Google Таблицу"
          >
            {isExportingGoogleSheets ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Table className="w-4 h-4" />
            )}
            <span>Google Sheet</span>
          </button>

          <button
            id="export-pdf-report-btn"
            onClick={onOpenPdfPreview}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Предпросмотр и скачивание PDF-отчета"
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
            onClick={onExportTxt}
            className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Скачать текстовую версию"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Google Docs Export Success Banner */}
      {googleDocsSuccessUrl && (
        <div className="bg-blue-50 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Отчет сохранен в ваш Google Документ!</span>
              <span className="text-[11px] text-blue-700 dark:text-blue-300">
                Файл доступен на вашем Google Диске для редактирования и распечатки.
              </span>
            </div>
          </div>
          <a
            href={googleDocsSuccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <span>Открыть Google Doc</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Google Sheets Export Success Banner */}
      {googleSheetsSuccessUrl && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">Таблица ТЗ и Рисков сохранена в Google Таблицах!</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Создана многостраничная таблица с разбором спецификации, рисками договора и логистикой.
              </span>
            </div>
          </div>
          <a
            href={googleSheetsSuccessUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <span>Открыть Google Sheet</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Quick Metrics & Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 shadow-xs space-y-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">
                Индекс риска
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {analysisResult?.summary?.overallRiskScore ?? 0} / 100
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">
                Позиции ТЗ
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {productsCount} товаров
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">
                Критичные риски
              </span>
              <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-0.5 block">
                {criticalRisksCount} из {risksCount}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none">
                Готовые документы
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {templatesCount} шаблонов
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Row */}
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

          <button
            type="button"
            onClick={onOpenGuide}
            className="px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Открыть Регламент работы (44-ФЗ & 223-ФЗ)"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Регламент работы</span>
          </button>
        </div>
      </div>

      {/* Screen Sections */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <div className="space-y-6">
          <AnalysisVersionHistoryBanner
            analysis={analysisResult}
            onUpdateAnalysisVersion={onUpdateAnalysisVersion}
          />
          <RiskSummaryCard
            summary={analysisResult.summary}
            onOpenCustomerVerification={onOpenCustomerVerification}
          />
          <RiskMapCard
            summary={analysisResult.summary}
            contractRisks={analysisResult.contractRisks}
            onRiskSectorClick={onRiskSectorClick}
          />
          <RiskDynamicsChart
            summary={analysisResult.summary}
            contractRisks={analysisResult.contractRisks}
          />
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'overview' || activeTab === 'workflow') && (
        <DeliveryLogisticsCard deliveryInfo={analysisResult.deliveryInfo} />
      )}

      {(activeTab === 'all' || activeTab === 'spec') && (
        <ProductListTable products={analysisResult.productList || []} />
      )}

      {(activeTab === 'all' || activeTab === 'risks') && (
        <div className="space-y-6">
          <ContractRisksTable
            risks={analysisResult.contractRisks}
            externalCategoryFilter={externalCategoryFilter}
            externalSeverityFilter={externalSeverityFilter}
            onClearExternalFilter={onClearExternalFilter}
          />
          <SubmissionChecklist check={analysisResult.submissionRulesCheck} />
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'workflow') && (
        <PostAwardWorkflow workflow={analysisResult.postAwardWorkflow} />
      )}

      {(activeTab === 'all' || activeTab === 'templates') && (
        <TemplatesSection templates={analysisResult.generatedTemplates} />
      )}
    </div>
  );
};
