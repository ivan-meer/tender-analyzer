import { useState } from 'react';
import { AnalysisResult } from '../types';
import { generatePdfReport } from '../utils/pdfGenerator';
import { exportReportToGoogleDocs } from '../lib/googleDocsExport';
import { exportReportToGoogleSheets } from '../lib/googleSheetsExport';

export function useExports(analysisResult: AnalysisResult | null) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingGoogleDocs, setIsExportingGoogleDocs] = useState(false);
  const [googleDocsSuccessUrl, setGoogleDocsSuccessUrl] = useState<string | null>(null);
  const [isExportingGoogleSheets, setIsExportingGoogleSheets] = useState(false);
  const [googleSheetsSuccessUrl, setGoogleSheetsSuccessUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    if (!analysisResult) return;
    setIsExportingPdf(true);
    setExportError(null);
    try {
      await generatePdfReport(analysisResult, 'Отчет_223_ФЗ');
    } catch (err: any) {
      console.error('PDF export error:', err);
      setExportError('Ошибка при формировании PDF файла. Попробуйте еще раз.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportGoogleDocs = async () => {
    if (!analysisResult) return;
    setIsExportingGoogleDocs(true);
    setGoogleDocsSuccessUrl(null);
    setExportError(null);
    try {
      const { documentUrl } = await exportReportToGoogleDocs(analysisResult);
      setGoogleDocsSuccessUrl(documentUrl);
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Google Docs export error:', err);
      setExportError(`Ошибка сохранения в Google Документы: ${err.message || err}`);
    } finally {
      setIsExportingGoogleDocs(false);
    }
  };

  const handleExportGoogleSheets = async () => {
    if (!analysisResult) return;
    setIsExportingGoogleSheets(true);
    setGoogleSheetsSuccessUrl(null);
    setExportError(null);
    try {
      const { spreadsheetUrl } = await exportReportToGoogleSheets(analysisResult);
      setGoogleSheetsSuccessUrl(spreadsheetUrl);
      window.open(spreadsheetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Google Sheets export error:', err);
      setExportError(`Ошибка сохранения в Google Таблицы: ${err.message || err}`);
    } finally {
      setIsExportingGoogleSheets(false);
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

  return {
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
  };
}
