import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Trash2, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  FolderUp, 
  Check, 
  AlertCircle,
  File,
  Table,
  FileCheck2,
  Plus,
  MessageSquare,
  X,
  Archive,
  FileArchive,
  Zap
} from 'lucide-react';
import { AnalysisInput, ProcedureType } from '../types';
import { SAMPLE_PROCUREMENTS } from '../data/sampleProcurements';
import { parseDocumentFile, parseFileOrArchive, ParsedDocument, formatFileSize } from '../utils/documentParser';
import { DocumentViewerModal } from './DocumentViewerModal';
import { TokenPriceEstimator } from './TokenPriceEstimator';
import { Camera } from 'lucide-react';

interface DocumentUploaderProps {
  onAnalyze: (input: AnalysisInput) => void;
  onLoadPresetResult?: (presetId?: string) => void;
  isAnalyzing: boolean;
  onOpenScanModal?: () => void;
  onOpenHistory?: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onAnalyze, 
  onLoadPresetResult, 
  isAnalyzing,
  onOpenScanModal,
  onOpenHistory,
}) => {
  const [procedureType, setProcedureType] = useState<ProcedureType>('223_FZ_QUOTATION');
  const [parsedFiles, setParsedFiles] = useState<ParsedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Single-window workspace text inputs & modals
  const [pastedText, setPastedText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const [modalDocument, setModalDocument] = useState<ParsedDocument | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Preset Loading
  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PROCUREMENTS.find(p => p.id === presetId);
    if (!preset) return;

    setProcedureType(preset.input.procedureType);
    setAdditionalNotes(preset.input.additionalNotes || '');

    // Convert preset texts into virtual standardized files in the single window
    const virtualFiles: ParsedDocument[] = [
      {
        id: `preset_contract_${Date.now()}`,
        fileName: `Проект_Договора_${preset.title.replace(/\s+/g, '_')}.docx`,
        fileType: 'word',
        fileSize: preset.input.contractText.length * 2,
        category: 'contract',
        content: preset.input.contractText,
        charCount: preset.input.contractText.length,
        status: 'ready',
      },
      {
        id: `preset_docs_${Date.now()}`,
        fileName: `Извещение_Закупки_${preset.title.replace(/\s+/g, '_')}.pdf`,
        fileType: 'pdf',
        fileSize: preset.input.documentationText.length * 2,
        category: 'docs',
        content: preset.input.documentationText,
        charCount: preset.input.documentationText.length,
        status: 'ready',
      },
      {
        id: `preset_tz_${Date.now()}`,
        fileName: `Техническое_Задание_и_Спецификация.xlsx`,
        fileType: 'excel',
        fileSize: preset.input.tzText.length * 2,
        category: 'tz',
        content: preset.input.tzText,
        charCount: preset.input.tzText.length,
        status: 'ready',
      },
    ];

    setParsedFiles(virtualFiles);
    setPastedText('');
  };

  // Process selected or dropped files (supports PDF, DOCX, XLSX, and ZIP/RAR/7Z Archives)
  const handleFilesAdded = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    const newParsedList: ParsedDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const parsedResults = await parseFileOrArchive(files[i]);
      newParsedList.push(...parsedResults);
    }

    setParsedFiles(prev => [...prev, ...newParsedList]);
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleCategoryChange = (fileId: string, newCategory: ParsedDocument['category']) => {
    setParsedFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, category: newCategory } : f))
    );
  };

  const handleRemoveFile = (fileId: string) => {
    setParsedFiles(prev => prev.filter(f => f.id !== fileId));
    if (previewingFileId === fileId) {
      setPreviewingFileId(null);
    }
  };

  const handleClearAll = () => {
    setParsedFiles([]);
    setPastedText('');
    setAdditionalNotes('');
    setPreviewingFileId(null);
  };

  // Compile all loaded documents and text into the unified AnalysisInput
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Group text by category
    const contractDocs = parsedFiles.filter(f => f.category === 'contract');
    const noticeDocs = parsedFiles.filter(f => f.category === 'docs');
    const tzDocs = parsedFiles.filter(f => f.category === 'tz' || f.category === 'table');
    const unassignedDocs = parsedFiles.filter(f => f.category === 'auto');

    let compiledContractText = contractDocs
      .map(f => `=== [ФАЙЛ: ${f.fileName}] ===\n${f.content}`)
      .join('\n\n');

    let compiledDocsText = noticeDocs
      .map(f => `=== [ФАЙЛ: ${f.fileName}] ===\n${f.content}`)
      .join('\n\n');

    let compiledTzText = tzDocs
      .map(f => `=== [ФАЙЛ: ${f.fileName}] ===\n${f.content}`)
      .join('\n\n');

    // Add unassigned or pasted text
    if (unassignedDocs.length > 0) {
      const extraContent = unassignedDocs
        .map(f => `=== [ДОКУМЕНТ: ${f.fileName}] ===\n${f.content}`)
        .join('\n\n');
      compiledDocsText = compiledDocsText
        ? `${compiledDocsText}\n\n${extraContent}`
        : extraContent;
    }

    if (pastedText.trim()) {
      if (!compiledContractText) {
        compiledContractText = pastedText.trim();
      } else {
        compiledDocsText = `${compiledDocsText}\n\n=== [ВСТАВЛЕННЫЙ ТЕКСТ] ===\n${pastedText.trim()}`;
      }
    }

    onAnalyze({
      procedureType,
      contractText: compiledContractText,
      documentationText: compiledDocsText,
      tzText: compiledTzText,
      additionalNotes,
    });
  };

  const totalChars = parsedFiles.reduce((acc, f) => acc + f.charCount, 0) + pastedText.length;
  const hasContent = parsedFiles.length > 0 || pastedText.trim().length > 0;

  const getFileBadge = (type: ParsedDocument['fileType']) => {
    switch (type) {
      case 'excel':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
            <Table className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Excel / Таблица
          </span>
        );
      case 'word':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
            <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Word Doc
          </span>
        );
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-md">
            <FileCode className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            PDF Doc
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
            <File className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            Текст
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden space-y-0 transition-colors duration-200">
      {/* Top Banner: Quick Shortcuts */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/40 p-3 sm:p-4 border-b border-indigo-100/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/80 rounded-xl text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 shrink-0" />
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Загрузка документации 223-ФЗ
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Открыть историю сохраненных проверок"
            >
              <FolderUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>📜 История запросов</span>
            </button>
          )}

          {onLoadPresetResult && (
            <button
              type="button"
              onClick={() => onLoadPresetResult('sample-furniture-223fz')}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
              title="Открыть готовый эталонный результат со всеми картами рисков и функциями"
            >
              <span>⚡ Флагманский демо-отчет</span>
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* STANDARDIZED UNIFIED DOCUMENT WINDOW */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Единое окно загрузки документации закупки</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Загрузите файлы: Таблицы Excel (.xlsx/.csv), PDF (.pdf), Word (.docx) или Текст
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
                className={`text-xs font-bold flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-xl border cursor-pointer ${
                  pastedText.trim() || additionalNotes.trim()
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Добавить особые указания или вставить текст вручную"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {pastedText.trim() || additionalNotes.trim() ? '💬 Инструкция (Добавлена)' : '💬 Инструкция / Текст'}
                </span>
              </button>

              {onOpenScanModal && (
                <button
                  type="button"
                  onClick={onOpenScanModal}
                  className="text-xs text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                  title="Распознать скан или фото документа (Gemini Vision)"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Скан (OCR)</span>
                </button>
              )}

              {hasContent && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-bold flex items-center gap-1 transition-colors bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Очистить
                </button>
              )}
            </div>
          </div>

          {/* DRAG AND DROP ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-5 sm:p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,.rar,.7z,.tar,.gz,.tgz,.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.rtf,.json,.md"
              className="hidden"
              onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
            />

            <div className="max-w-md mx-auto space-y-2.5 pointer-events-none">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-2xs border border-indigo-200/50 dark:border-indigo-800/50">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  Перетащите сюда файлы закупочной документации или архивы (.zip)
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1">
                  Поддерживаются: <strong className="text-indigo-600 dark:text-indigo-400">Архивы ZIP/RAR/7Z</strong> (авто-разархивация), <strong>PDF</strong>, <strong>Word</strong>, <strong>Excel</strong>, <strong>TXT</strong>
                </span>
              </div>

              {/* Supported Format Icons */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                  <FileCode className="w-3 h-3 text-rose-600 dark:text-rose-400" /> PDF
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                  <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Word
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Table className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Excel / Таблицы
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <File className="w-3 h-3 text-slate-500 dark:text-slate-400" /> TXT
                </span>
              </div>
            </div>
          </div>

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl text-xs font-bold text-indigo-700 dark:text-indigo-300 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span>Извлекаем и индексируем содержимое документов...</span>
            </div>
          )}

          {/* UPLOADED DOCUMENTS LIST */}
          {parsedFiles.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Загружено файлов ({parsedFiles.length}):</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Общий объем: ~{(totalChars / 1000).toFixed(1)} тыс. символов
                </span>
              </div>

              <div className="space-y-2">
                {parsedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 space-y-2 transition-all shadow-2xs hover:border-slate-300 dark:hover:border-slate-600"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileBadge(file.fileType)}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                              {file.fileName}
                            </span>
                            {file.isFromArchive && (
                              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0">
                                <FileArchive className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Разархивирован ({file.archiveFileName})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {formatFileSize(file.fileSize)} • {file.charCount} симв.
                          </span>
                        </div>
                      </div>

                      {/* Controls: Category & Preview & Remove */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={file.category}
                          onChange={(e) => handleCategoryChange(file.id, e.target.value as ParsedDocument['category'])}
                          className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer"
                        >
                          <option value="contract">📄 Проект договора</option>
                          <option value="docs">📋 Извещение / Правила</option>
                          <option value="tz">⚙️ ТЗ / Спецификация</option>
                          <option value="table">📊 Таблица / Смета</option>
                          <option value="auto">📁 Общий документ</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setModalDocument(file)}
                          className="px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 flex items-center gap-1 shadow-2xs"
                          title="Открыть полноэкранный ридер с поиском и таблицами"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Просмотр</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                          title="Удалить файл"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Extracted Text Preview Drawer */}
                    {previewingFileId === file.id && (
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                            Предпросмотр извлеченного текста ({file.fileName}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setModalDocument(file)}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>Открыть в полноэкранном ридере</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="font-mono text-slate-800 dark:text-slate-200 text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                          {file.content || '[Пустой или распознанный формат]'}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Live Token & Price Estimator Calculator */}
        <TokenPriceEstimator totalChars={totalChars} />

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {hasContent ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Готово к ИИ-экспертизе ({parsedFiles.length} файл(ов), ~{totalChars} симв.)
              </span>
            ) : (
              'Загрузите файлы документации в окно выше'
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onLoadPresetResult && (
              <button
                type="button"
                onClick={() => onLoadPresetResult('sample-furniture-223fz')}
                className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Показать эталонный отчёт без обращения к API ИИ"
              >
                <span>⚡ Быстрый отчет по шаблону</span>
              </button>
            )}

            <button
              id="start-analysis-btn"
              type="submit"
              disabled={!hasContent || isAnalyzing || isProcessing}
              className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                hasContent && !isAnalyzing && !isProcessing
                  ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-950 active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Выполняется юридический анализ 223-ФЗ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Проанализировать и Сформировать Отчет</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal for Custom Instructions & Pasted Text */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Инструкция и дополнительный текст
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Укажите комментарий эксперту ИИ или вставьте фрагмент вручную
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Примечания и особые указания тендерному эксперту:
                </label>
                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Укажите особые условия: например, проверить аванс, штрафы ПП 1875 или спецификацию..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Вставьте фрагменты текста вручную (если нет файла):
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Вставьте пункт о штрафах, ТЗ или извещение..."
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
              >
                Сохранить и закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Viewer Modal */}
      <DocumentViewerModal
        document={modalDocument}
        isOpen={!!modalDocument}
        onClose={() => setModalDocument(null)}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
};
