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
  Printer,
  ChevronDown,
  Eye,
  ShieldCheck,
  PackageCheck,
  AlertCircle,
  Table,
  RefreshCw,
  ExternalLink,
  Layers,
  FileSpreadsheet,
  FileCode,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCheck,
  Truck,
  MapPin,
  Tag,
  Scale
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { PRESET_TAG_DEFINITIONS } from '../utils/tagUtils';

export type ReportPreviewFormat = 'pdf' | 'gdocs' | 'gsheets' | 'txt';

export interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
  onDownloadPdf: () => Promise<void> | void;
  onExportTxt: () => void;
  onExportGoogleDocs?: () => Promise<void> | void;
  onExportGoogleSheets?: () => Promise<void> | void;
  isExportingPdf: boolean;
  isExportingGoogleDocs?: boolean;
  isExportingGoogleSheets?: boolean;
  googleDocsSuccessUrl?: string | null;
  googleSheetsSuccessUrl?: string | null;
  initialFormat?: ReportPreviewFormat;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  analysisResult,
  onDownloadPdf,
  onExportTxt,
  onExportGoogleDocs,
  onExportGoogleSheets,
  isExportingPdf,
  isExportingGoogleDocs = false,
  isExportingGoogleSheets = false,
  googleDocsSuccessUrl = null,
  googleSheetsSuccessUrl = null,
  initialFormat = 'pdf',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReportPreviewFormat>(initialFormat);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [sheetsActiveTab, setSheetsActiveTab] = useState<'passport' | 'risks' | 'spec' | 'submission' | 'templates'>('passport');

  if (!isOpen || !analysisResult) return null;

  const {
    summary,
    productList = [],
    contractRisks = [],
    submissionRulesCheck,
    postAwardWorkflow,
    deliveryInfo,
    generatedTemplates = {},
    tags = []
  } = analysisResult;

  const handleCopyText = () => {
    onExportTxt();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-600 text-white shadow-xs">КРИТИЧЕСКИЙ РИСК</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-white shadow-xs">ВЫСОКИЙ РИСК</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-yellow-500 text-slate-950 shadow-xs">СРЕДНИЙ РИСК</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shadow-xs">НИЗКИЙ РИСК</span>;
    }
  };

  const dateFormatted = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-scale-up">
        
        {/* TOP MODAL HEADER & MAIN FORMAT SWITCHER */}
        <div className="p-3.5 sm:p-4 bg-slate-900/95 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Интерактивный предпросмотр отчета
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {summary.is223FZ !== false ? '223-ФЗ' : '44-ФЗ'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
                {summary.projectName || summary.procurementTitle || 'Отчет по закупке'}
              </h3>
            </div>
          </div>

          {/* Zoom controls & Close button */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <div className="flex items-center bg-slate-800 border border-slate-700/70 rounded-xl p-0.5 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Уменьшить масштаб"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono font-bold">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Увеличить масштаб"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Закрыть окно предпросмотра"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* FORMAT SELECTION TABS BAR */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedFormat('pdf')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedFormat === 'pdf'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span>PDF Документ (A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('gdocs')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedFormat === 'gdocs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Google Документ (Docs)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('gsheets')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedFormat === 'gsheets'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Google Таблица (Sheets)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('txt')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedFormat === 'txt'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-slate-300" />
              <span>Текстовый TXT</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400 font-medium shrink-0">
            <span>Рисков: <b className="text-rose-400">{contractRisks.length}</b></span>
            <span>Позиций ТЗ: <b className="text-indigo-400">{productList.length}</b></span>
            <span>Сумма: <b className="text-slate-200">{summary.procurementSum || 'По заявке'}</b></span>
          </div>
        </div>

        {/* MAIN PREVIEW CONTAINER (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/90 flex justify-center items-start">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-4xl transition-transform duration-200"
          >

            {/* 1. PDF FORMAT PREVIEW */}
            {selectedFormat === 'pdf' && (
              <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-6 border border-slate-200 font-sans leading-relaxed">
                {/* Paper Header Banner */}
                <div className="border-b-2 border-indigo-600 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-black text-xs">
                        {summary.is223FZ !== false ? '223-ФЗ' : '44-ФЗ'}
                      </div>
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                        ЭКСПЕРТНЫЙ ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                      {summary.procurementTitle}
                    </h1>
                    <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span>Заказчик: <strong>{summary.customerName || '—'}</strong> {summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}</span>
                      <span>НМЦК: <strong className="text-indigo-700">{summary.procurementSum || 'По заявке'}</strong></span>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-slate-400">Метки:</span>
                        {tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-bold text-slate-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stamp */}
                  <div className="p-3 bg-slate-50 border-2 border-indigo-600/30 rounded-2xl shrink-0 text-center space-y-1 min-w-[140px]">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Индекс риска</span>
                    <div className="text-2xl font-black font-mono text-slate-900">{summary.overallRiskScore} / 100</div>
                    <div>{getRiskBadge(summary.riskLevel)}</div>
                    <div className="text-[9px] text-slate-400 font-medium pt-0.5">{dateFormatted}</div>
                  </div>
                </div>

                {/* 1. Executive Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Ключевое резюме и заключение юриста</span>
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {summary.keyTakeaway}
                  </p>
                </div>

                {/* 2. Delivery & Logistics */}
                {deliveryInfo && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs text-slate-800">
                    <h2 className="text-xs font-black text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Логистика, график и условия поставки</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="font-bold text-slate-500 text-[10px] block">Срок поставки:</span>
                        <span className="font-semibold">{deliveryInfo.deliveryPeriod || 'По контракту'}</span>
                      </div>
                      {deliveryInfo.deliveryScheduleNotice && (
                        <div>
                          <span className="font-bold text-slate-500 text-[10px] block">Порядок вызова партий:</span>
                          <span>{deliveryInfo.deliveryScheduleNotice}</span>
                        </div>
                      )}
                      {deliveryInfo.deliveryAddresses && deliveryInfo.deliveryAddresses.length > 0 && (
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-500 text-[10px] block">Адреса разгрузки:</span>
                          <span className="font-medium">{deliveryInfo.deliveryAddresses.join('; ')}</span>
                        </div>
                      )}
                      {deliveryInfo.unloadingAndAccessConditions && (
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-500 text-[10px] block">Условия разгрузки:</span>
                          <span>{deliveryInfo.unloadingAndAccessConditions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Contract Risks Table */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-l-4 border-rose-500 pl-2">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      3. Реестр договорных рисков и штрафов ({contractRisks.length})
                    </h2>
                    <span className="text-[10px] font-bold text-slate-500">
                      Критичных/Высоких: {contractRisks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length}
                    </span>
                  </div>

                  {contractRisks.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase">
                          <tr>
                            <th className="p-2.5 w-12">Пункт</th>
                            <th className="p-2.5 w-20">Уровень</th>
                            <th className="p-2.5 w-44">Условие / Цитата</th>
                            <th className="p-2.5">Правовая оценка</th>
                            <th className="p-2.5 w-44">Рекомендация</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {contractRisks.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold text-slate-500 align-top">{r.clauseNumber || '—'}</td>
                              <td className="p-2.5 align-top">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                  r.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                                  r.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                                  r.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {r.severity}
                                </span>
                              </td>
                              <td className="p-2.5 align-top">
                                <div className="font-bold text-slate-900 mb-0.5">{r.title}</div>
                                {r.clauseQuote && <div className="text-[10px] text-slate-500 italic">«{r.clauseQuote}»</div>}
                              </td>
                              <td className="p-2.5 text-slate-700 align-top leading-relaxed">{r.explanation}</td>
                              <td className="p-2.5 text-emerald-800 font-medium align-top leading-relaxed">{r.recommendation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                      ✅ Критических ловушек и завышенных неустоек в договоре не обнаружено.
                    </div>
                  )}
                </div>

                {/* 4. Product Spec Table */}
                {productList.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-2">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        4. Спецификация продукции и Нацрежим (ПП РФ № 1875) ({productList.length})
                      </h2>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase">
                          <tr>
                            <th className="p-2.5 w-8">№</th>
                            <th className="p-2.5 w-44">Товар / Номенклатура</th>
                            <th className="p-2.5 w-16">Кол-во</th>
                            <th className="p-2.5">Характеристики и требования</th>
                            <th className="p-2.5 w-32">ПП РФ 1875</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {productList.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold text-center text-slate-400 align-top">{i + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900 align-top">{p.name}</td>
                              <td className="p-2.5 font-bold text-indigo-700 align-top">{p.quantity}</td>
                              <td className="p-2.5 text-slate-700 align-top leading-relaxed">
                                {p.dimensions && (
                                  <div className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[9px] mb-1">
                                    Габариты: {p.dimensions}
                                  </div>
                                )}
                                <div>{p.specification}</div>
                              </td>
                              <td className="p-2.5 align-top">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  p.pp1875Status === 'RUSSIAN_REQUIRED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {p.pp1875Status === 'RUSSIAN_REQUIRED' ? '⚠️ Требуется РФ' : '✅ Допущен'}
                                </span>
                                {p.okpd2OrGvin && <div className="text-[9px] text-slate-400 font-mono mt-0.5">{p.okpd2OrGvin}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer seal */}
                <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Сформировано сервисом TenderAgent AI</span>
                  <span>Штрафы и неустойки по 223-ФЗ не подлежат списанию</span>
                </div>
              </div>
            )}

            {/* 2. GOOGLE DOCS PREVIEW */}
            {selectedFormat === 'gdocs' && (
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-slate-900">
                {/* Simulated Google Docs Application Bar */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-600 text-white rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {summary.projectName || summary.procurementTitle || 'Аудит закупки'} — Google Документ
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>Файл</span>
                        <span>Правка</span>
                        <span>Вид</span>
                        <span>Вставка</span>
                        <span>Формат</span>
                        <span>Инструменты</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-blue-50 text-blue-700 font-bold rounded-md text-[10px] border border-blue-200">
                    Стандартный шрифт Arial • Выделения цветом
                  </div>
                </div>

                {/* Document Body */}
                <div className="p-8 sm:p-12 space-y-6 max-w-3xl mx-auto leading-relaxed text-xs">
                  <div className="border-b-2 border-slate-800 pb-3">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ И ЮРИДИЧЕСКИЙ АУДИТ ЗАКУПКИ
                    </div>
                    <div className="text-slate-600 text-xs mt-1">
                      Объект аудита: <b>{summary.procurementTitle}</b>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Регулирование: <b>{summary.is223FZ !== false ? 'Федеральный закон № 223-ФЗ' : 'Федеральный закон № 44-ФЗ'}</b> • Дата: {dateFormatted}
                    </div>
                  </div>

                  {/* Section 1 */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1">
                      1. ПАСПОРТ ЗАКУПКИ И ИНДЕКС БЕЗОПАСНОСТИ
                    </h2>
                    <ul className="space-y-1 list-disc pl-5 text-slate-800">
                      <li><b>Наименование закупки:</b> {summary.procurementTitle}</li>
                      <li><b>Заказчик:</b> {summary.customerName || '—'} {summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}</li>
                      <li><b>НМЦК / Сумма:</b> <span className="bg-yellow-100 font-bold px-1">{summary.procurementSum || 'По заявке'}</span></li>
                      <li><b>ИНДЕКС РИСКА ДОГОВОРА:</b> <span className="bg-rose-100 text-rose-900 font-black px-1.5 py-0.5 rounded">{summary.overallRiskScore} из 100 [{summary.riskLevel}]</span></li>
                      <li>
                        <b>Ключевой правовой вывод эксперта:</b>
                        <div className="mt-1 p-2.5 bg-slate-50 border-l-4 border-blue-500 text-slate-700 italic">
                          «{summary.keyTakeaway}»
                        </div>
                      </li>
                    </ul>
                  </div>

                  {/* Section 2 */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1">
                      2. РЕЕСТР ВЫЯВЛЕННЫХ РИСКОВ ДОГОВОРА ({contractRisks.length})
                    </h2>
                    <div className="space-y-3">
                      {contractRisks.map((r, i) => (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-rose-600">[{i + 1}]</span>
                            <span>{r.title}</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 rounded font-mono">Пункт {r.clauseNumber || 'Б/Н'}</span>
                          </div>
                          {r.clauseQuote && (
                            <div className="text-[11px] text-slate-500 italic pl-3 border-l-2 border-slate-300">
                              «{r.clauseQuote}»
                            </div>
                          )}
                          <div className="text-slate-700 pt-0.5"><b>Правовой анализ:</b> {r.explanation}</div>
                          <div className="text-emerald-800"><b>Рекомендация:</b> {r.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-300 pb-1">
                      3. СПЕЦИФИКАЦИЯ ТЗ И ТРЕБОВАНИЯ ПП РФ № 1875
                    </h2>
                    <div className="space-y-2">
                      {productList.map((p, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                          <div className="font-bold text-slate-900 flex justify-between">
                            <span>{i + 1}. {p.name}</span>
                            <span className="text-blue-700">Кол-во: {p.quantity}</span>
                          </div>
                          <div className="text-slate-600 text-[11px] mt-1">{p.specification}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Статус ПП 1875: <b>{p.pp1875Status === 'RUSSIAN_REQUIRED' ? 'Требуется происхождение РФ' : 'Без ограничений'}</b>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GOOGLE SHEETS / SPREADSHEET PREVIEW */}
            {selectedFormat === 'gsheets' && (
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans text-slate-900">
                {/* Simulated Google Sheets Bar */}
                <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span className="font-bold truncate">
                      {summary.projectName || summary.procurementTitle || 'Аудит закупки'} — Google Таблица (5 листов)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded font-mono">
                    Сетка формул и автоформат
                  </span>
                </div>

                {/* Sub-Tabs Selector inside Google Sheets */}
                <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSheetsActiveTab('passport')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                      sheetsActiveTab === 'passport'
                        ? 'bg-white text-emerald-800 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    1. Паспорт и Логистика
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetsActiveTab('risks')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                      sheetsActiveTab === 'risks'
                        ? 'bg-white text-emerald-800 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    2. Реестр Рисков ({contractRisks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetsActiveTab('spec')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                      sheetsActiveTab === 'spec'
                        ? 'bg-white text-emerald-800 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    3. Спецификация и ТЗ ({productList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetsActiveTab('submission')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                      sheetsActiveTab === 'submission'
                        ? 'bg-white text-emerald-800 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    4. Подача и Регламент
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetsActiveTab('templates')}
                    className={`px-3 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                      sheetsActiveTab === 'templates'
                        ? 'bg-white text-emerald-800 shadow-xs border border-slate-300'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    5. Шаблоны Писем
                  </button>
                </div>

                {/* Spreadsheet Grid Body */}
                <div className="p-4 sm:p-6 overflow-x-auto text-xs min-h-[380px]">
                  {sheetsActiveTab === 'passport' && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2 border-r border-slate-300 w-1/3">Параметр закупки</th>
                            <th className="p-2">Значение из анализа</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Наименование</td>
                            <td className="p-2 font-medium">{summary.procurementTitle}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Заказчик</td>
                            <td className="p-2">{summary.customerName || '—'} {summary.customerInn ? `(ИНН: ${summary.customerInn})` : ''}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">НМЦК / Сумма</td>
                            <td className="p-2 font-extrabold text-emerald-700">{summary.procurementSum || 'По заявке'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Регламент</td>
                            <td className="p-2">{summary.is223FZ !== false ? '223-ФЗ' : '44-ФЗ'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Индекс риска</td>
                            <td className="p-2 font-black text-rose-600">{summary.overallRiskScore} / 100 ({summary.riskLevel})</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Ключевой вывод</td>
                            <td className="p-2 italic text-slate-700">{summary.keyTakeaway}</td>
                          </tr>
                          {deliveryInfo && (
                            <>
                              <tr>
                                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Срок поставки</td>
                                <td className="p-2">{deliveryInfo.deliveryPeriod || 'По контракту'}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Адреса складов</td>
                                <td className="p-2">{deliveryInfo.deliveryAddresses?.join('; ') || 'По извещению'}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sheetsActiveTab === 'risks' && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-slate-300 text-[10px] uppercase">
                          <tr>
                            <th className="p-2 border-r border-slate-300 w-10">№</th>
                            <th className="p-2 border-r border-slate-300 w-16">Уровень</th>
                            <th className="p-2 border-r border-slate-300 w-20">Пункт</th>
                            <th className="p-2 border-r border-slate-300 w-44">Наименование</th>
                            <th className="p-2 border-r border-slate-300">Цитата договора</th>
                            <th className="p-2 border-r border-slate-300">Правовой риск</th>
                            <th className="p-2">Рекомендация</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {contractRisks.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-bold border-r border-slate-300 text-center">{i + 1}</td>
                              <td className="p-2 border-r border-slate-300 font-bold">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                  r.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 font-black' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {r.severity}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-300 font-mono text-slate-600">{r.clauseNumber || '—'}</td>
                              <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{r.title}</td>
                              <td className="p-2 border-r border-slate-300 text-slate-500 italic text-[10px]">«{r.clauseQuote}»</td>
                              <td className="p-2 border-r border-slate-300 text-slate-700">{r.explanation}</td>
                              <td className="p-2 text-emerald-800 font-semibold">{r.recommendation}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sheetsActiveTab === 'spec' && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-slate-300 text-[10px] uppercase">
                          <tr>
                            <th className="p-2 border-r border-slate-300 w-10">№</th>
                            <th className="p-2 border-r border-slate-300 w-44">Товар</th>
                            <th className="p-2 border-r border-slate-300 w-20">Кол-во</th>
                            <th className="p-2 border-r border-slate-300">Характеристики ТЗ</th>
                            <th className="p-2 border-r border-slate-300 w-28">Габариты</th>
                            <th className="p-2 w-36">Статус ПП 1875</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-[11px]">
                          {productList.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-bold border-r border-slate-300 text-center">{i + 1}</td>
                              <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{p.name}</td>
                              <td className="p-2 border-r border-slate-300 font-extrabold text-emerald-700">{p.quantity}</td>
                              <td className="p-2 border-r border-slate-300 text-slate-700">{p.specification}</td>
                              <td className="p-2 border-r border-slate-300 font-mono text-[10px]">{p.dimensions || '—'}</td>
                              <td className="p-2 font-bold">
                                {p.pp1875Status === 'RUSSIAN_REQUIRED' ? (
                                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Требуется РФ</span>
                                ) : (
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Без ограничений</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sheetsActiveTab === 'submission' && (
                    <div className="border border-slate-300 rounded-lg overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-emerald-50 text-emerald-900 font-bold border-b border-slate-300">
                          <tr>
                            <th className="p-2 border-r border-slate-300 w-1/3">Требование подачи</th>
                            <th className="p-2">Детали и регламент</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Запрос в таблицу</td>
                            <td className="p-2">{submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО' : 'Нет'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Форматы файлов</td>
                            <td className="p-2">{submissionRulesCheck.requiredFilesStructure.join(', ') || 'Стандартные'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">ПП РФ № 1875</td>
                            <td className="p-2">{submissionRulesCheck.pp1875Applies ? `Применяется (${submissionRulesCheck.pp1875Details})` : 'Не применяется'}</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">Бухгалтерские данные</td>
                            <td className="p-2">{submissionRulesCheck.accountingInfoNeeded ? 'Требуются' : 'Не требуются'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {sheetsActiveTab === 'templates' && (
                    <div className="space-y-3">
                      {Object.keys(generatedTemplates).length > 0 ? (
                        Object.entries(generatedTemplates).map(([name, text]) => (
                          <div key={name} className="border border-slate-300 rounded-lg p-3 bg-slate-50">
                            <div className="font-bold text-slate-900 text-xs mb-1">{name}</div>
                            <div className="text-[11px] text-slate-700 whitespace-pre-wrap font-mono bg-white p-2 border border-slate-200 rounded">
                              {String(text ?? '')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                          Шаблоны писем формируются автоматически при детальном анализе закупки.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. PLAIN TEXT / TXT PREVIEW */}
            {selectedFormat === 'txt' && (
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-2xl border border-slate-800 font-mono text-xs leading-relaxed space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Формат: UTF-8 Plain Text (.txt)</span>
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Скопировано!' : 'Копировать в буфер'}</span>
                  </button>
                </div>

                <div className="whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-[11px] leading-relaxed text-slate-300 max-h-[500px] overflow-y-auto">
{`ОТЧЕТ ПО АНАЛИЗУ ЗАКУПКИ (${summary.is223FZ !== false ? '223-ФЗ' : '44-ФЗ'})
================================================================================
Наименование: ${summary.procurementTitle}
Заказчик: ${summary.customerName || '—'} ${summary.customerInn ? '(ИНН: ' + summary.customerInn + ')' : ''}
НМЦК: ${summary.procurementSum || 'По заявке'}
Индекс риска: ${summary.overallRiskScore} / 100 [${summary.riskLevel}]
Дата анализа: ${dateFormatted}

КЛЮЧЕВОЙ ПРАВОВОЙ ВЫВОД:
--------------------------------------------------------------------------------
${summary.keyTakeaway}

РЕЕСТР ДОГОВОРНЫХ РИСКОВ И ШТРАФОВ (${contractRisks.length}):
--------------------------------------------------------------------------------
${contractRisks.map((r, i) => `${i + 1}. [${r.severity}] ${r.title} (Пункт: ${r.clauseNumber || 'Б/Н'})
   Цитата: «${r.clauseQuote}»
   Риск: ${r.explanation}
   Рекомендация: ${r.recommendation}
`).join('\n')}

СПЕЦИФИКАЦИЯ ПРОДУКЦИИ И НАЦРЕЖИМ (${productList.length}):
--------------------------------------------------------------------------------
${productList.map((p, i) => `${i + 1}. ${p.name} | Кол-во: ${p.quantity} | Характеристики: ${p.specification} | Габариты: ${p.dimensions || '—'} | ПП 1875: ${p.pp1875Status}`).join('\n')}

ПРАВИЛА ПОДАЧИ ЗАЯВКИ:
--------------------------------------------------------------------------------
- Запрос в таблицу: ${submissionRulesCheck.requestInTableRequired ? 'ОБЯЗАТЕЛЬНО' : 'Нет'}
- Форматы файлов: ${submissionRulesCheck.requiredFilesStructure.join(', ')}
- ПП РФ № 1875: ${submissionRulesCheck.pp1875Applies ? 'ПРИМЕНЯЕТСЯ (' + submissionRulesCheck.pp1875Details + ')' : 'Не применяется'}
`}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR TRIGGER BAR */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-bold text-slate-300">Текущий выбор экспорта:</span>
            <span className="px-2 py-0.5 bg-slate-800 rounded-md text-white font-mono uppercase text-[10px]">
              {selectedFormat === 'pdf' ? 'PDF файл' : selectedFormat === 'gdocs' ? 'Google Документ' : selectedFormat === 'gsheets' ? 'Google Таблица' : 'TXT текст'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
            {/* Direct Google Docs Export & Link */}
            {googleDocsSuccessUrl ? (
              <a
                href={googleDocsSuccessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Открыть в Google Docs</span>
              </a>
            ) : (
              onExportGoogleDocs && (
                <button
                  type="button"
                  onClick={onExportGoogleDocs}
                  disabled={isExportingGoogleDocs}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Создать Google Документ"
                >
                  {isExportingGoogleDocs ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>В Google Docs</span>
                </button>
              )
            )}

            {/* Direct Google Sheets Export & Link */}
            {googleSheetsSuccessUrl ? (
              <a
                href={googleSheetsSuccessUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Открыть в Google Sheets</span>
              </a>
            ) : (
              onExportGoogleSheets && (
                <button
                  type="button"
                  onClick={onExportGoogleSheets}
                  disabled={isExportingGoogleSheets}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Создать Google Таблицу"
                >
                  {isExportingGoogleSheets ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>В Google Sheets</span>
                </button>
              )
            )}

            {/* Copy TXT button */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Скопировать текст отчета"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Скопировано!' : 'Копировать TXT'}</span>
            </button>

            {/* Primary Action Button: Download PDF */}
            <button
              id="report-preview-confirm-download-pdf-btn"
              type="button"
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-950 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Формирование PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать PDF Отчет</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
