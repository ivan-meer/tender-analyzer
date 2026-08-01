import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  Copy, 
  Check, 
  Building2, 
  Calendar, 
  Coins, 
  Sparkles,
  FileCheck2,
  Printer,
  ChevronDown,
  Eye,
  ShieldCheck,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface PdfReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
  onDownloadPdf: () => Promise<void>;
  onExportTxt: () => void;
  isExportingPdf: boolean;
}

export const PdfReportPreviewModal: React.FC<PdfReportPreviewModalProps> = ({
  isOpen,
  onClose,
  analysisResult,
  onDownloadPdf,
  onExportTxt,
  isExportingPdf,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'summary' | 'risks' | 'spec'>('preview');

  if (!isOpen || !analysisResult) return null;

  const { summary, productList, contractRisks, submissionRulesCheck, postAwardWorkflow } = analysisResult;

  const handleCopyText = () => {
    onExportTxt();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-xs">КРИТИЧЕСКИЙ РИСК</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500 text-white shadow-xs">ВЫСОКИЙ РИСК</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-yellow-500 text-slate-950 shadow-xs">СРЕДНИЙ РИСК</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 text-white shadow-xs">НИЗКИЙ РИСК</span>;
    }
  };

  const criticalCount = contractRisks?.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* Modal Top Header Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Предпросмотр PDF-отчета
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleDateString('ru-RU')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
                {summary.projectName || summary.procurementTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Скопировать текстовую версию отчета"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Скопировано!' : 'TXT'}</span>
            </button>

            <button
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-950 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Формирование...' : 'Подтвердить и Скачать PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Закрыть предпросмотр"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs bar inside Preview */}
        <div className="px-5 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Страница PDF (Макет)</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Резюме & Риски ({contractRisks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'spec'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Спецификация ({productList?.length || 0})</span>
          </button>
        </div>

        {/* Document Printable Paper Body View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/90 space-y-6">
          {/* Printable Virtual Paper Frame */}
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl max-w-3xl mx-auto space-y-6 border border-slate-200 font-sans leading-relaxed">
            
            {/* Paper Header Banner */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-900 text-white rounded-lg font-black text-xs">
                    223-ФЗ
                  </div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-slate-500">
                    ЭКСПЕРТНОЕ ЮРИДИЧЕСКОЕ ЗАКЛЮЧЕНИЕ
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {summary.procurementTitle}
                </h1>
                <p className="text-xs text-slate-600 font-medium flex items-center gap-2 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Заказчик: <strong>{summary.customerName || 'Заказчик по 223-ФЗ'}</strong></span>
                </p>
              </div>

              {/* Risk Score Stamp */}
              <div className="p-3 bg-slate-50 border-2 border-slate-900 rounded-2xl shrink-0 text-center space-y-0.5 min-w-[130px]">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Индекс риска</span>
                <div className="text-2xl font-black font-mono text-slate-900">{summary.overallRiskScore} / 100</div>
                <div className="pt-0.5">{getRiskLevelBadge(summary.riskLevel)}</div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] font-bold block uppercase">Регламент</span>
                <span className="font-extrabold text-slate-900">223-ФЗ</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold block uppercase">ПП РФ № 1875</span>
                <span className={`font-extrabold ${submissionRulesCheck.pp1875Applies ? 'text-rose-600' : 'text-slate-900'}`}>
                  {submissionRulesCheck.pp1875Applies ? 'Применяется' : 'Не прим.'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold block uppercase">Рисков в договоре</span>
                <span className="font-extrabold text-amber-700">{contractRisks.length} пунктов</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] font-bold block uppercase">Позиций ТЗ</span>
                <span className="font-extrabold text-indigo-700">{productList?.length || 0} товаров</span>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="space-y-2 border-l-4 border-slate-900 pl-4 py-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                1. Резюме тендерного эксперта и ключевые выводы:
              </h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {summary.keyTakeaway}
              </p>
            </div>

            {/* Section 2: Contract Risk Registry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>2. Реестр выявленных рисков проекта договора ({contractRisks.length})</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Критичных: {criticalCount}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {contractRisks.slice(0, 5).map((risk, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">
                        {idx + 1}. {risk.title} {risk.clauseNumber ? `(${risk.clauseNumber})` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        risk.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        risk.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                      «{risk.clauseQuote}»
                    </p>

                    <p className="text-xs text-slate-700 font-medium">
                      <strong>Риск:</strong> {risk.explanation}
                    </p>
                  </div>
                ))}

                {contractRisks.length > 5 && (
                  <p className="text-[11px] text-slate-500 font-bold text-center italic pt-1">
                    ...и еще {contractRisks.length - 5} пунктов рисков включены в полную PDF версию отчета.
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Product Specification */}
            {productList && productList.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <PackageCheck className="w-4 h-4 text-indigo-600" />
                  <span>3. Спецификация закупаемых товаров и норматив ПП 1875</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                        <th className="p-2 border border-slate-200">№</th>
                        <th className="p-2 border border-slate-200">Наименование</th>
                        <th className="p-2 border border-slate-200">Кол-во</th>
                        <th className="p-2 border border-slate-200">ПП 1875</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {productList.slice(0, 4).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200 font-mono text-center">{idx + 1}</td>
                          <td className="p-2 border border-slate-200 font-medium">{p.name}</td>
                          <td className="p-2 border border-slate-200 font-mono">{p.quantity}</td>
                          <td className="p-2 border border-slate-200 text-[11px] font-bold text-rose-700">{p.pp1875Status || 'Проверено'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Paper Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Сформировано сервисом ИИ-Экспертизы 223-ФЗ</span>
              <span>Страница 1 из 1 (Предпросмотр)</span>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Убедитесь в правильности данных перед формированием документа
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Закрыть
            </button>

            <button
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-950 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPdf ? 'Генерация...' : 'Скачать PDF'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
