import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { ReportTab } from '../hooks/useAnalysis';
import { AnalysisVersionHistoryBanner } from './AnalysisVersionHistoryBanner';
import { RiskSummaryCard } from './RiskSummaryCard';
import { RiskMapCard } from './RiskMapCard';
import { DeliveryLogisticsCard } from './DeliveryLogisticsCard';
import { ContractRisksTable } from './ContractRisksTable';
import { ProductListTable } from './ProductListTable';
import { SubmissionChecklist } from './SubmissionChecklist';
import { PostAwardWorkflow } from './PostAwardWorkflow';
import { TemplatesSection } from './TemplatesSection';
import { TagManager } from './TagManager';
import { SmartInsightsSection } from './SmartInsightsSection';
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
  Calculator,
  ChevronDown,
  Sparkles,
  Share2,
  Copy,
  Check,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Tag as TagIcon,
  Plus,
  Eye
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
  pdfSuccessMessage?: string | null;
  onClearPdfSuccess?: () => void;
  onDownloadPdf?: () => void;
  isExportingGoogleDocs: boolean;
  isExportingGoogleSheets: boolean;
  googleDocsSuccessUrl: string | null;
  googleSheetsSuccessUrl: string | null;
  exportError?: string | null;
  onClearExportError?: () => void;
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
  pdfSuccessMessage,
  onClearPdfSuccess,
  onDownloadPdf,
  isExportingGoogleDocs,
  isExportingGoogleSheets,
  googleDocsSuccessUrl,
  googleSheetsSuccessUrl,
  exportError,
  onClearExportError,
  onExportGoogleDocs,
  onExportGoogleSheets,
  onExportTxt,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState(false);

  const productsCount = analysisResult?.productList?.length || 0;
  const risksCount = analysisResult?.contractRisks?.length || 0;
  const criticalRisksCount =
    analysisResult?.contractRisks?.filter((r) => r.severity === 'CRITICAL' || r.severity === 'HIGH')
      .length || 0;
  const templatesCount = analysisResult?.generatedTemplates
    ? Object.keys(analysisResult.generatedTemplates).length
    : 0;

  const hasLegalTools = Boolean(onOpenContractDiff || onOpenFasComplaint || onOpenBankGuarantee);

  const handleCopySummary = () => {
    if (!analysisResult) return;
    const summary = analysisResult.summary;
    const text = `ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ
Предмет: ${summary.procurementTitle || 'Тендер'}
Закон: ${summary.is223FZ ? '223-ФЗ' : '44-ФЗ'}
Заказчик: ${summary.customerName || '—'} ${summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}
НМЦК: ${summary.procurementSum || '—'}
Индекс риска: ${summary.overallRiskScore}/100 (${summary.riskLevel})
Ключевой вывод: ${summary.keyTakeaway}
Логистика: ${analysisResult.deliveryInfo?.deliveryPeriod || 'По договору'}
Нацрежим (ПП 1875): ${analysisResult.submissionRulesCheck?.pp1875Applies ? 'Применяется' : 'Не применяется'}
Выявлено рисков: ${risksCount} (Критичных: ${criticalRisksCount})
Номенклатура: ${productsCount} позиций`;

    navigator.clipboard.writeText(text);
    setIsSummaryCopied(true);
    setTimeout(() => setIsSummaryCopied(false), 2500);
  };

  return (
    <div id="analysis-results-section" className="space-y-5 animate-fade-in pt-2">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 rounded-3xl shadow-xs">
        {/* Back Button & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            title="Вернуться к экрану загрузки файлов"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Новый анализ</span>
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0 border ${
                analysisResult.summary.is223FZ 
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}>
                {analysisResult.summary.is223FZ ? '223-ФЗ' : '44-ФЗ'}
              </span>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate" title={analysisResult?.summary?.projectName || analysisResult?.summary?.procurementTitle}>
                {analysisResult?.summary?.projectName || analysisResult?.summary?.procurementTitle || 'Анализ закупки'}
              </h2>
            </div>

            {/* Document Tags with TagManager */}
            <TagManager
              tags={analysisResult.tags || []}
              onChange={(newTags) => {
                onUpdateAnalysisVersion({
                  ...analysisResult,
                  tags: newTags,
                });
              }}
              variant="compact"
            />
          </div>
        </div>

        {/* Action Buttons & Dropdowns */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Copy Summary Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Скопировать краткое резюме аудита"
          >
            {isSummaryCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Скопировать резюме</span>
              </>
            )}
          </button>

          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Открыть историю сохранений"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">История БД</span>
          </button>

          {/* Legal Tools Dropdown */}
          {hasLegalTools && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsToolsMenuOpen(!isToolsMenuOpen);
                  setIsExportMenuOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Дополнительные юридические инструменты"
              >
                <FileDiff className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Инструменты</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsToolsMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-1.5 text-xs animate-fade-in space-y-1">
                    {onOpenContractDiff && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenContractDiff();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <FileDiff className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <span className="font-bold block">Diff правок договора</span>
                          <span className="text-[10px] text-slate-400">Протокол разногласий</span>
                        </div>
                      </button>
                    )}

                    {onOpenFasComplaint && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenFasComplaint();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <span className="font-bold block">Жалоба в ФАС РФ</span>
                          <span className="text-[10px] text-slate-400">ст. 105 44-ФЗ / 135-ФЗ</span>
                        </div>
                      </button>
                    )}

                    {onOpenBankGuarantee && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBankGuarantee();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                      >
                        <Calculator className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold block">Калькулятор БГ</span>
                          <span className="text-[10px] text-slate-400">Обеспечение и гарантии</span>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Direct Report Preview Button */}
          <button
            id="open-report-preview-toolbar-btn"
            type="button"
            onClick={onOpenPdfPreview}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Интерактивный предпросмотр отчета (PDF, Google Docs, Sheets, TXT)"
          >
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Предпросмотр</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsExportMenuOpen(!isExportMenuOpen);
                setIsToolsMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              title="Экспорт отчета в PDF, Google Docs, Google Sheets, TXT"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Экспорт</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsExportMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-1.5 text-xs animate-fade-in space-y-1">
                  <button
                    id="export-pdf-preview-btn"
                    type="button"
                    onClick={() => {
                      onOpenPdfPreview();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-left cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Предпросмотр отчета</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">PDF, Google Docs, Sheets, TXT</span>
                    </div>
                  </button>

                  <button
                    id="export-pdf-direct-btn"
                    type="button"
                    onClick={() => {
                      if (onDownloadPdf) onDownloadPdf();
                      setIsExportMenuOpen(false);
                    }}
                    disabled={isExportingPdf}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {isExportingPdf ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <Download className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">Скачать PDF (.PDF)</span>
                      <span className="text-[10px] text-slate-400">Прямое скачивание отчета в браузер</span>
                    </div>
                  </button>

                  <button
                    id="export-gdocs-report-btn"
                    type="button"
                    onClick={() => {
                      onExportGoogleDocs();
                      setIsExportMenuOpen(false);
                    }}
                    disabled={isExportingGoogleDocs}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {isExportingGoogleDocs ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">Google Документ</span>
                      <span className="text-[10px] text-slate-400">Экспорт полного отчета в Docs</span>
                    </div>
                  </button>

                  <button
                    id="export-gsheets-report-btn"
                    type="button"
                    onClick={() => {
                      onExportGoogleSheets();
                      setIsExportMenuOpen(false);
                    }}
                    disabled={isExportingGoogleSheets}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {isExportingGoogleSheets ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">Google Таблица</span>
                      <span className="text-[10px] text-slate-400">Спецификация и таблица рисков</span>
                    </div>
                  </button>

                  <button
                    id="export-txt-report-btn"
                    type="button"
                    onClick={() => {
                      onExportTxt();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="font-bold block">Текстовый файл (.TXT)</span>
                      <span className="text-[10px] text-slate-400">Быстрое сохранение в блокнот</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Primary CTA: Direct Download PDF */}
          <button
            id="export-pdf-report-btn"
            onClick={() => {
              if (onDownloadPdf) {
                onDownloadPdf();
              } else {
                onOpenPdfPreview();
              }
            }}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            title="Сформировать и скачать PDF-отчет"
          >
            {isExportingPdf ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Генерация PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Скачать PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF Export Success Notification */}
      {pdfSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 px-5 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm block">PDF-отчет готов и загружен!</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {pdfSuccessMessage}
              </span>
            </div>
          </div>
          {onClearPdfSuccess && (
            <button
              type="button"
              onClick={onClearPdfSuccess}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg transition-colors cursor-pointer shrink-0 border border-emerald-200 dark:border-emerald-900"
            >
              Закрыть
            </button>
          )}
        </div>
      )}

      {/* Export Error Banner */}
      {exportError && (
        <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-2xl p-3.5 px-5 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-rose-600 text-white rounded-xl shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="font-medium truncate">{exportError}</span>
          </div>
          {onClearExportError && (
            <button
              type="button"
              onClick={onClearExportError}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 font-bold rounded-lg transition-colors cursor-pointer shrink-0 border border-rose-200 dark:border-rose-900"
            >
              Закрыть
            </button>
          )}
        </div>
      )}

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
                Файл доступен на вашем Google Диске для совместной работы, правок и печати.
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
              <span className="font-extrabold text-sm block">Спецификация и реестр рисков выгружены в Google Таблицы!</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Создана 4-страничная форматированная таблица со спецификацией, рисками и шаблонами.
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

      {/* Executive Summary Key Stats Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-1 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none truncate">
                Индекс риска
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {analysisResult?.summary?.overallRiskScore ?? 0} / 100
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none truncate">
                Позиции ТЗ
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {productsCount} позиций
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-xl shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none truncate">
                Критичные риски
              </span>
              <span className="text-sm font-black font-mono text-rose-700 dark:text-rose-400 mt-0.5 block">
                {criticalRisksCount} из {risksCount}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 p-2.5 rounded-2xl flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block leading-none truncate">
                Готовые шаблоны
              </span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                {templatesCount} писем
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
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>Smart Insights</span>
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
          <TagManager
            tags={analysisResult.tags || []}
            onChange={(newTags) => {
              onUpdateAnalysisVersion({
                ...analysisResult,
                tags: newTags,
              });
            }}
            variant="expanded"
            label="Метки и категоризация закупки"
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
          <SmartInsightsSection analysis={analysisResult} />
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <SmartInsightsSection analysis={analysisResult} />
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'overview' || activeTab === 'workflow') && (
        <DeliveryLogisticsCard deliveryInfo={analysisResult.deliveryInfo} />
      )}

      {(activeTab === 'all' || activeTab === 'spec') && (
        <ProductListTable products={analysisResult.productList || []} />
      )}

      {(activeTab === 'risks') && (
        <div className="space-y-6">
          <SmartInsightsSection analysis={analysisResult} />
          <ContractRisksTable
            risks={analysisResult.contractRisks}
            externalCategoryFilter={externalCategoryFilter}
            externalSeverityFilter={externalSeverityFilter}
            onClearExternalFilter={onClearExternalFilter}
          />
          <SubmissionChecklist check={analysisResult.submissionRulesCheck} />
        </div>
      )}

      {(activeTab === 'all') && (
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
