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
  Zap,
  Globe,
  Download,
  FileDiff,
  Building2,
  ExternalLink,
  Scale,
  Calculator,
  ChevronDown
} from 'lucide-react';
import { AnalysisInput, ProcedureType } from '../types';
import { SAMPLE_PROCUREMENTS } from '../data/sampleProcurements';
import { 
  parseDocumentFile, 
  parseFileOrArchive, 
  ParsedDocument, 
  formatFileSize,
  smartClassifyDocument 
} from '../utils/documentParser';
import { detectLawTypeFromContent, LawDetectionResult } from '../utils/lawDetector';
import { DocumentViewerModal } from './DocumentViewerModal';
import { TokenPriceEstimator } from './TokenPriceEstimator';
import { Camera } from 'lucide-react';

interface DocumentUploaderProps {
  onAnalyze: (input: AnalysisInput) => void;
  onLoadPresetResult?: (presetId?: string) => void;
  isAnalyzing: boolean;
  onOpenScanModal?: () => void;
  onOpenHistory?: () => void;
  onOpenContractDiff?: (initialOriginalText?: string) => void;
  onOpenFasComplaint?: () => void;
  onOpenBankGuarantee?: () => void;
}

const ALLOWED_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'pdf', 'docx', 'doc', 'rtf', 'xlsx', 'xls', 'csv', 'txt', 'json', 'md'];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  onAnalyze, 
  onLoadPresetResult, 
  isAnalyzing,
  onOpenScanModal,
  onOpenHistory,
  onOpenContractDiff,
  onOpenFasComplaint,
  onOpenBankGuarantee,
}) => {
  const [lawType, setLawType] = useState<'223_FZ' | '44_FZ' | 'COMMERCIAL'>(() => {
    const saved = localStorage.getItem('selected_law_type');
    return (saved as '223_FZ' | '44_FZ' | 'COMMERCIAL') || '223_FZ';
  });
  const [procedureType, setProcedureType] = useState<ProcedureType>(() => {
    const saved = localStorage.getItem('selected_procedure_type');
    if (saved) return saved as ProcedureType;
    const law = localStorage.getItem('selected_law_type');
    if (law === '44_FZ') return '44_FZ_AUCTION';
    if (law === 'COMMERCIAL') return 'COMMERCIAL';
    return '223_FZ_QUOTATION';
  });
  const [parsedFiles, setParsedFiles] = useState<ParsedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync with localStorage
  React.useEffect(() => {
    localStorage.setItem('selected_law_type', lawType);
  }, [lawType]);

  React.useEffect(() => {
    localStorage.setItem('selected_procedure_type', procedureType);
  }, [procedureType]);
  
  // Single-window workspace text inputs & modals
  const [pastedText, setPastedText] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [previewingFileId, setPreviewingFileId] = useState<string | null>(null);
  const [modalDocument, setModalDocument] = useState<ParsedDocument | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // EIS (zakupki.gov.ru) Import State
  const [isEisModalOpen, setIsEisModalOpen] = useState(false);
  const [eisQuery, setEisQuery] = useState('');
  const [isEisFetching, setIsEisFetching] = useState(false);
  const [eisError, setEisError] = useState<string | null>(null);

  // Automatic Law Type Detection (44-FZ / 223-FZ / Commercial)
  const [autoDetectedInfo, setAutoDetectedInfo] = useState<LawDetectionResult | null>(null);
  const [userOverridden, setUserOverridden] = useState(false);

  // Auto-detect law type when documents or pasted text change
  React.useEffect(() => {
    const combinedText = parsedFiles.map(f => `${f.fileName}\n${f.content}`).join('\n\n') + '\n\n' + pastedText;
    const detected = detectLawTypeFromContent(combinedText);
    if (detected) {
      setAutoDetectedInfo(detected);
      if (!userOverridden) {
        setLawType(detected.lawType);
        setProcedureType(detected.procedureType);
      }
    } else {
      setAutoDetectedInfo(null);
    }
  }, [parsedFiles, pastedText, userOverridden]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Fetching from EIS (zakupki.gov.ru)
  const handleFetchEis = async (procurementNumber?: string) => {
    const queryToUse = procurementNumber || eisQuery;
    if (!queryToUse.trim()) {
      setEisError('Пожалуйста, введите номер закупки (11 или 19 цифр) или ссылку на ЕИС.');
      return;
    }

    setEisError(null);
    setIsEisFetching(true);

    try {
      const response = await fetch('/api/procurement/fetch-eis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ procurementNumberOrUrl: queryToUse })
      });

      if (!response.ok) {
        throw new Error('Не удалось получить данные из ЕИС');
      }

      const resData = await response.json();
      const tenderData = resData.data;

      if (!tenderData) {
        throw new Error('Данные закупки не найдены');
      }

      // Configure law type
      if (tenderData.lawType === '44-ФЗ') {
        setLawType('44_FZ');
        setProcedureType('44_FZ_AUCTION');
      } else {
        setLawType('223_FZ');
        setProcedureType('223_FZ_QUOTATION');
      }

      // Create virtual files from EIS package
      const now = Date.now();
      const eisVirtualFiles: ParsedDocument[] = [
        {
          id: `eis_contract_${now}`,
          fileName: `Проект_Контракта_ЕИС_${tenderData.regNumber}.docx`,
          fileType: 'word',
          fileSize: (tenderData.contractText || '').length * 2,
          category: 'contract',
          content: tenderData.contractText || '',
          charCount: (tenderData.contractText || '').length,
          status: 'ready'
        },
        {
          id: `eis_tz_${now}`,
          fileName: `Техническое_Задание_ЕИС_${tenderData.regNumber}.xlsx`,
          fileType: 'excel',
          fileSize: (tenderData.tzText || '').length * 2,
          category: 'tz',
          content: tenderData.tzText || '',
          charCount: (tenderData.tzText || '').length,
          status: 'ready'
        },
        {
          id: `eis_notice_${now}`,
          fileName: `Извещение_Закупки_ЕИС_${tenderData.regNumber}.pdf`,
          fileType: 'pdf',
          fileSize: (tenderData.documentationText || '').length * 2,
          category: 'docs',
          content: tenderData.documentationText || '',
          charCount: (tenderData.documentationText || '').length,
          status: 'ready'
        }
      ];

      setParsedFiles(eisVirtualFiles);
      setAdditionalNotes(`Закупка из ЕИС № ${tenderData.regNumber}\nЗаказчик: ${tenderData.customerName} (ИНН ${tenderData.customerInn})\nНМЦК: ${tenderData.procurementSum}\nСрок поставки: ${tenderData.deliveryPeriod}`);
      setIsEisModalOpen(false);
      setEisQuery('');
    } catch (err: any) {
      console.error('EIS Fetch Error:', err);
      setEisError(err.message || 'Ошибка подключения к ЕИС');
    } finally {
      setIsEisFetching(false);
    }
  };

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

  // Process selected or dropped files with format validation
  const handleFilesAdded = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const rejectedFiles: { name: string; ext: string }[] = [];

    fileArray.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        validFiles.push(file);
      } else {
        rejectedFiles.push({ name: file.name, ext: ext ? `.${ext}` : 'без расширения' });
      }
    });

    if (rejectedFiles.length > 0) {
      const rejectedListStr = rejectedFiles.map(f => `"${f.name}" (${f.ext})`).join(', ');
      setUploadError(
        `Формат файла ${rejectedListStr} не поддерживается системой. Загружайте файлы в форматах: PDF, Word (.docx/.doc), Excel (.xlsx/.xls/.csv), Текст (.txt/.rtf/.json/.md) и архивы (.zip/.rar/.7z).`
      );
    }

    if (validFiles.length === 0) return;

    setIsProcessing(true);
    const newParsedList: ParsedDocument[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      const parsedResults = await parseFileOrArchive(validFiles[i]);
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

  const handleAutoClassifyAll = () => {
    setParsedFiles(prev =>
      prev.map(f => ({
        ...f,
        category: smartClassifyDocument(f.fileName, f.content),
      }))
    );
  };

  const handleClearAll = () => {
    setParsedFiles([]);
    setPastedText('');
    setAdditionalNotes('');
    setPreviewingFileId(null);
    setUserOverridden(false);
    setAutoDetectedInfo(null);
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

  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-colors duration-200">
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {/* UNIFIED SINGLE HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
              <FolderUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight flex-wrap">
                <span>Единое окно загрузки документации закупки</span>
                <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {autoDetectedInfo 
                      ? `${autoDetectedInfo.lawType === '44_FZ' ? '44-ФЗ' : autoDetectedInfo.lawType === '223_FZ' ? '223-ФЗ' : 'Коммерческая'} • ${autoDetectedInfo.procedureName}`
                      : `${lawType === '44_FZ' ? '44-ФЗ' : lawType === '223_FZ' ? '223-ФЗ' : 'Коммерческая'}`
                    }
                  </span>
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Индексация проекта договора, ТЗ, смет и архивов (.zip, .pdf, .docx, .xlsx)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* DEMO REPORT BUTTON */}
            {onLoadPresetResult && (
              <button
                type="button"
                onClick={() => onLoadPresetResult('sample-furniture-223fz')}
                className="text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                title="Показать эталонный отчёт"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Демо-отчет</span>
              </button>
            )}

            {/* EIS (zakupki.gov.ru) IMPORT BUTTON */}
            <button
              type="button"
              onClick={() => setIsEisModalOpen(true)}
              className="text-xs font-semibold flex items-center gap-1.5 transition-colors bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-lg cursor-pointer"
              title="Загрузить закупку по номеру или ссылке из ЕИС (zakupki.gov.ru)"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>ЕИС (zakupki.gov.ru)</span>
            </button>

            {/* INSTRUCTION / NOTES BUTTON */}
            <button
              type="button"
              onClick={() => setIsNotesModalOpen(true)}
              className={`text-xs font-semibold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg border cursor-pointer ${
                pastedText.trim() || additionalNotes.trim()
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              title="Добавить особые указания или вставить текст вручную"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {pastedText.trim() || additionalNotes.trim() ? 'Инструкция (есть)' : 'Инструкция'}
              </span>
            </button>

            {/* SECONDARY TOOLS DROPDOWN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                className="text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2.5 py-1.5 rounded-lg cursor-pointer"
                title="Дополнительные инструменты"
              >
                <span>Инструменты</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsToolsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 text-xs animate-fadeIn">
                    {onOpenContractDiff && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          const contractDoc = parsedFiles.find(f => f.category === 'contract');
                          onOpenContractDiff(contractDoc?.content || pastedText);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
                      >
                        <FileDiff className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-semibold">Diff правок договора</div>
                          <div className="text-[10px] text-slate-400">Сравнение версий</div>
                        </div>
                      </button>
                    )}

                    {onOpenFasComplaint && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          onOpenFasComplaint();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
                      >
                        <Scale className="w-4 h-4 text-red-500 shrink-0" />
                        <div>
                          <div className="font-semibold">Жалобы в ФАС РФ</div>
                          <div className="text-[10px] text-slate-400">ст. 105 44-ФЗ / 135-ФЗ</div>
                        </div>
                      </button>
                    )}

                    {onOpenBankGuarantee && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          onOpenBankGuarantee();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
                      >
                        <Calculator className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-semibold">Калькулятор гарантий</div>
                          <div className="text-[10px] text-slate-400">Обеспечение и БГ</div>
                        </div>
                      </button>
                    )}

                    {onOpenScanModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsToolsDropdownOpen(false);
                          onOpenScanModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer border-t border-slate-100 dark:border-slate-700/60"
                      >
                        <Camera className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <div className="font-semibold">Распознать скан (OCR)</div>
                          <div className="text-[10px] text-slate-400">Анализ сканов и фото</div>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {hasContent && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 font-semibold flex items-center gap-1 transition-colors px-2 py-1.5 rounded-lg cursor-pointer"
                title="Очистить все файлы"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Очистить</span>
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".zip,.rar,.7z,.tar,.gz,.tgz,.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.rtf,.json,.md"
          className="hidden"
          onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
        />

        {/* AUTO-DETECTION NOTICE BANNER */}
        {autoDetectedInfo && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Определено:
                </span>{' '}
                <span>{autoDetectedInfo.lawName} ({autoDetectedInfo.procedureName})</span>
              </div>
            </div>

            {userOverridden ? (
              <button
                type="button"
                onClick={() => {
                  setUserOverridden(false);
                  setLawType(autoDetectedInfo.lawType);
                  setProcedureType(autoDetectedInfo.procedureType);
                }}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Вернуть ({autoDetectedInfo.lawType === '44_FZ' ? '44-ФЗ' : autoDetectedInfo.lawType === '223_FZ' ? '223-ФЗ' : 'Коммерческая'})
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded shrink-0">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Применено
              </span>
            )}
          </div>
        )}

        {/* ERROR MESSAGE FOR UNSUPPORTED FILE FORMATS */}
        {uploadError && (
          <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200 text-xs p-3 rounded-xl flex items-start justify-between gap-3 animate-shake">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{uploadError}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-rose-400 hover:text-rose-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MINIMALIST DRAG AND DROP ZONE */}
        {parsedFiles.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`document-uploader-section border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-900/40'
            }`}
          >
            <div className="max-w-md mx-auto space-y-2 pointer-events-none">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                <Upload className="w-4 h-4" />
              </div>
              
              <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                Перетащите файлы закупки или выберите на диске
              </p>

              {/* Minimal Format Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                <span>PDF</span>
                <span>•</span>
                <span>Word (.docx)</span>
                <span>•</span>
                <span>Excel (.xlsx)</span>
                <span>•</span>
                <span>Архивы (.zip, .rar)</span>
              </div>
            </div>
          </div>
        ) : (
          /* COMPACT "ADD DOCUMENT" BAR WHEN FILES ARE PRESENT */
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              isDragging ? 'ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40' : ''
            }`}
          >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                    Загружено документов: {parsedFiles.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить файл</span>
                </button>
              </div>
            </div>
          )}

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Пакет закупки ({parsedFiles.length} файл(ов)):</span>
                  <div className="flex items-center gap-1.5 flex-wrap font-semibold text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Договор: {parsedFiles.filter(f => f.category === 'contract').length}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      ТЗ/Спец: {parsedFiles.filter(f => f.category === 'tz' || f.category === 'table').length}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Извещение: {parsedFiles.filter(f => f.category === 'docs').length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleAutoClassifyAll}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Автоматически распределить файлы по типам (Договор, ТЗ, Извещение)"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Авто-сортировка</span>
                  </button>
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                    ~{(totalChars / 1000).toFixed(1)} тыс. симв.
                  </span>
                </div>
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

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {onLoadPresetResult && (
              <button
                type="button"
                onClick={() => onLoadPresetResult('sample-furniture-223fz')}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] rounded-2xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                title="Показать эталонный отчёт без обращения к API ИИ"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                <span>Быстрый демо-отчет</span>
              </button>
            )}

            <button
              id="start-analysis-btn"
              type="submit"
              disabled={!hasContent || isAnalyzing || isProcessing}
              className={`flex-1 sm:flex-initial px-5 py-3 min-h-[44px] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                hasContent && !isAnalyzing && !isProcessing
                  ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-950 active:scale-95'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Выполняется ИИ-анализ ({lawType === '44_FZ' ? '44-ФЗ' : lawType === '223_FZ' ? '223-ФЗ' : 'Закупка'})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Проанализировать закупку</span>
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

      {/* Modal for Direct EIS (zakupki.gov.ru) Import */}
      {isEisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Загрузка закупки из ЕИС (zakupki.gov.ru)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Автоматическое скачивание извещения, проекта контракта и ТЗ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEisModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Номер закупки (ЕИС) или прямая ссылка:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={eisQuery}
                    onChange={(e) => setEisQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFetchEis();
                      }
                    }}
                    placeholder="Например: 0373200002824000001 или 32412345678"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              {eisError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{eisError}</span>
                </div>
              )}

              {/* Quick Presets for 1-click loading */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Быстрый выбор из реестра ЕИС:
                </span>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleFetchEis('0373200002824000001')}
                    disabled={isEisFetching}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        № 0373200002824000001 (44-ФЗ)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Поставка компьютерной техники и рабочих мест ГБУ • 4,25 млн ₽
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFetchEis('32412345678')}
                    disabled={isEisFetching}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/80 transition-colors flex items-center justify-between group cursor-pointer disabled:opacity-50"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        № 32412345678 (223-ФЗ)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Закупка офисной мебели и оборудования • 2,85 млн ₽
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEisModalOpen(false)}
                className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isEisFetching}
                onClick={() => handleFetchEis()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isEisFetching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Скачивание из ЕИС...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Импортировать пакет закупки</span>
                  </>
                )}
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
