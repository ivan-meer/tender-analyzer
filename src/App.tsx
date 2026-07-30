import React, { useState } from 'react';
import { Header } from './components/Header';
import { GuideModal } from './components/GuideModal';
import { DocumentUploader } from './components/DocumentUploader';
import { RiskSummaryCard } from './components/RiskSummaryCard';
import { RiskMapCard } from './components/RiskMapCard';
import { DeliveryLogisticsCard } from './components/DeliveryLogisticsCard';
import { ContractRisksTable } from './components/ContractRisksTable';
import { ProductListTable } from './components/ProductListTable';
import { SubmissionChecklist } from './components/SubmissionChecklist';
import { PostAwardWorkflow } from './components/PostAwardWorkflow';
import { TemplatesSection } from './components/TemplatesSection';
import { AnalysisInput, AnalysisResult } from './types';
import { generatePdfReport } from './utils/pdfGenerator';
import { getPresetAnalysisResult } from './data/presetResults';
import { Download, AlertCircle, FileText, CheckCircle2, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        isAnalyzing={isAnalyzing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Section */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Интеллектуальная система юридического и операционного аудита
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Единое окно загрузки и анализа документации
          </h2>
          <p className="text-slate-600 text-sm max-w-3xl font-medium">
            Загрузите файлы в единое окно (Excel-сметы, PDF, Word, тексты). ИИ-ассистент извлечет спецификацию продукции, проверит кабальные штрафы по 223-ФЗ, правила подачи файлов и сгенерирует отчет в PDF.
          </p>
        </div>

        {/* Document Uploader Form */}
        <DocumentUploader
          onAnalyze={handleAnalyze}
          onLoadPresetResult={handleLoadPresetResult}
          isAnalyzing={isAnalyzing}
        />

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-start gap-3 text-red-800 text-sm animate-shake shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block mb-0.5">Ошибка анализа:</strong>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Analysis Loading Indicator */}
        {isAnalyzing && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto"></div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Анализируем документацию и спецификацию по 223-ФЗ...
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Извлекаем номенклатуру продукции, проверяем штрафы 3%, условия поставки по заявке Заказчика, закупку у 3-х лиц и ограничение по ПП РФ № 1875.
              </p>
            </div>
          </div>
        )}

        {/* Analysis Results Display */}
        {analysisResult && !isAnalyzing && (
          <div id="analysis-results-section" className="space-y-8 animate-fade-in pt-2">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Анализ успешно завершен! Сформирован комплексный отчет.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="export-pdf-report-btn"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isExportingPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Сформировать и скачать PDF отчет</span>
                </button>

                <button
                  id="export-txt-report-btn"
                  onClick={handleExportTxt}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Скачать исходный текстовый формат"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            {/* Risk Summary Card */}
            <RiskSummaryCard summary={analysisResult.summary} />

            {/* Interactive Recharts Risk Map Card (Red/Yellow/Green categories & severity) */}
            <RiskMapCard 
              summary={analysisResult.summary} 
              contractRisks={analysisResult.contractRisks} 
            />

            {/* Delivery Terms & Addresses Card (High Accent) */}
            <DeliveryLogisticsCard deliveryInfo={analysisResult.deliveryInfo} />

            {/* Extracted Product Specification Table */}
            <ProductListTable products={analysisResult.productList || []} />

            {/* Contract Risks Table */}
            <ContractRisksTable risks={analysisResult.contractRisks} />

            {/* Bid Submission Rules Checklist */}
            <SubmissionChecklist check={analysisResult.submissionRulesCheck} />

            {/* Post Award Execution & Primary Docs Workflow */}
            <PostAwardWorkflow workflow={analysisResult.postAwardWorkflow} />

            {/* Templates & Letters Section */}
            <TemplatesSection templates={analysisResult.generatedTemplates} />
          </div>
        )}
      </main>

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1 font-medium">
          <p>Интерфейс анализатора заявки по регламенту 223-ФЗ | ИИ-ассистент тендерного отдела</p>
          <p className="text-[11px] text-slate-400">Все расчёты и выводы формируются с учётом неисполняемого списания штрафов по 223-ФЗ</p>
        </div>
      </footer>
    </div>
  );
}

