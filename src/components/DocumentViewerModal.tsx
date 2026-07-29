import React, { useState, useMemo } from 'react';
import { ParsedDocument, formatFileSize } from '../utils/documentParser';
import { 
  X, 
  FileText, 
  Table as TableIcon, 
  FileCode, 
  File, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Sliders, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Tag,
  Maximize2,
  Minimize2,
  ListOrdered,
  BarChart2
} from 'lucide-react';

interface DocumentViewerModalProps {
  document: ParsedDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange?: (fileId: string, category: ParsedDocument['category']) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onCategoryChange,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'table' | 'analytics'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<number>(12); // in px
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Computed Text Lines and Statistics
  const lines = useMemo(() => {
    if (!doc?.content) return [];
    return doc.content.split('\n');
  }, [doc?.content]);

  const wordCount = useMemo(() => {
    if (!doc?.content) return 0;
    return doc.content.trim().split(/\s+/).length;
  }, [doc?.content]);

  // Search occurrence stats
  const searchMatchesCount = useMemo(() => {
    if (!searchQuery.trim() || !doc?.content) return 0;
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = doc.content.match(regex);
    return matches ? matches.length : 0;
  }, [doc?.content, searchQuery]);

  // Detected key terms and potential risk clauses in the document
  const documentAnalytics = useMemo(() => {
    if (!doc?.content) return null;
    const text = doc.content.toLowerCase();

    const riskKeywords = [
      { term: 'штраф', label: 'Указания о штрафах', icon: <ShieldAlert className="w-4 h-4 text-rose-600" /> },
      { term: 'пени', label: 'Начисление пени', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> },
      { term: 'сроки', label: 'Сроки исполнения', icon: <Clock className="w-4 h-4 text-indigo-600" /> },
      { term: 'аванс', label: 'Порядок авансирования', icon: <Tag className="w-4 h-4 text-emerald-600" /> },
      { term: '1875', label: 'ПП РФ № 1875 (Нацрежим)', icon: <Sparkles className="w-4 h-4 text-purple-600" /> },
      { term: 'гарантия', label: 'Обеспечение и гарантии', icon: <FileText className="w-4 h-4 text-blue-600" /> },
      { term: 'приемка', label: 'Порядок и акты приемки', icon: <Check className="w-4 h-4 text-teal-600" /> },
      { term: 'отказ', label: 'Мотивированный отказ', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> },
    ];

    const detectedRisks = riskKeywords.map(rk => {
      const regex = new RegExp(rk.term, 'gi');
      const matches = doc.content.match(regex);
      return {
        ...rk,
        count: matches ? matches.length : 0,
      };
    }).filter(r => r.count > 0);

    return {
      detectedRisks,
      readingTimeMinutes: Math.max(1, Math.ceil(wordCount / 180)),
    };
  }, [doc?.content, wordCount]);

  // Parse lines into structured table rows if table format or CSV/pipes/tabs
  const parsedTableData = useMemo(() => {
    if (!doc?.content) return [];
    
    // Check if lines contain CSV commas, tabs, or pipe characters
    const sample = lines.slice(0, 30);
    const rows: string[][] = [];

    for (const line of sample) {
      if (line.includes(',')) {
        rows.push(line.split(',').map(cell => cell.replace(/^"|"$/g, '').trim()));
      } else if (line.includes('\t')) {
        rows.push(line.split('\t').map(cell => cell.trim()));
      } else if (line.includes('|')) {
        rows.push(line.split('|').map(cell => cell.trim()).filter(Boolean));
      } else {
        // Fallback split by double spaces
        const parts = line.split(/\s{2,}/).map(p => p.trim());
        if (parts.length > 1) {
          rows.push(parts);
        }
      }
    }

    return rows;
  }, [lines, doc?.content]);

  if (!isOpen || !doc) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(doc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.fileName.replace(/\.[^/.]+$/, '')}_экспорт.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 text-slate-900 font-extrabold rounded-xs px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getFileIcon = () => {
    switch (doc.fileType) {
      case 'excel':
        return <TableIcon className="w-5 h-5 text-emerald-500" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'pdf':
        return <FileCode className="w-5 h-5 text-rose-500" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl max-h-[92vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 bg-slate-800 rounded-2xl border border-slate-700 shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-md">
                  Интерактивный Ридер Документов
                </span>
                <span className="text-xs text-slate-400 font-medium">• {formatFileSize(doc.fileSize)}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white truncate leading-snug">
                {doc.fileName}
              </h2>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Category Selector inside Viewer */}
            {onCategoryChange && (
              <select
                value={doc.category}
                onChange={(e) => onCategoryChange(doc.id, e.target.value as ParsedDocument['category'])}
                className="text-xs font-bold bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="contract">📄 Проект договора</option>
                <option value="docs">📋 Извещение / Правила</option>
                <option value="tz">⚙️ ТЗ / Спецификация</option>
                <option value="table">📊 Таблица / Смета</option>
                <option value="auto">📁 Общий документ</option>
              </select>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Свернуть' : 'На весь экран'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Sub-Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
              <span>Текстовый вид ({lines.length} стр.)</span>
            </button>

            {doc.fileType === 'excel' || parsedTableData.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'table'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Табличный вид ({parsedTableData.length} строк)</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-600" />
              <span>ИИ-Анализ & Риски</span>
            </button>
          </div>

          {/* Search Input & Font Zoom & Copy/Download */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по документу..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
              {searchQuery && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                  {searchMatchesCount}
                </span>
              )}
            </div>

            {/* Font Zoom Controls */}
            {activeTab === 'text' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                  title="Уменьшить шрифт"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 px-1">{fontSize}px</span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(18, prev + 1))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                  title="Увеличить шрифт"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Copy All */}
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Скопировано' : 'Текст'}</span>
            </button>

            {/* Download TXT */}
            <button
              type="button"
              onClick={handleDownloadText}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Скачать</span>
            </button>
          </div>

        </div>

        {/* Modal View Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          
          {/* TAB 1: Formatted Line-Numbered Text View */}
          {activeTab === 'text' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-inner p-4 font-mono overflow-x-auto max-h-[60vh]">
              {lines.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-4 hover:bg-indigo-50/50 py-0.5 px-1 rounded transition-colors ${
                    searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase())
                      ? 'bg-amber-50/80 border-l-2 border-amber-500'
                      : ''
                  }`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                >
                  <span className="text-slate-300 font-sans text-[10px] font-bold select-none text-right w-10 shrink-0 pt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-slate-800 break-words whitespace-pre-wrap flex-1">
                    {highlightText(line, searchQuery)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Table Spreadsheet View */}
          {activeTab === 'table' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-inner overflow-hidden overflow-x-auto max-h-[60vh]">
              {parsedTableData.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold border-b border-slate-700">
                      <th className="py-2.5 px-3 w-12 text-center text-slate-400">#</th>
                      {parsedTableData[0]?.map((_, colIdx) => (
                        <th key={colIdx} className="py-2.5 px-3 border-r border-slate-800">
                          Колонка {colIdx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTableData.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className={`border-b border-slate-200 hover:bg-indigo-50/50 transition-colors ${
                          rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3 text-center text-slate-400 font-bold border-r border-slate-200 bg-slate-100">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 border-r border-slate-200 text-slate-800 font-medium">
                            {highlightText(cell, searchQuery)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Табличные данные не обнаружены в файле. Переключитесь в текстовый режим.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Document Analytics & Risk Scan */}
          {activeTab === 'analytics' && documentAnalytics && (
            <div className="space-y-6">
              
              {/* Document Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Общий объем</span>
                  <p className="text-lg font-black text-slate-900">
                    {doc.charCount.toLocaleString('ru-RU')} символов
                  </p>
                  <p className="text-xs text-slate-500 font-medium">~{wordCount} слов</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Время чтений</span>
                  <p className="text-lg font-black text-indigo-600">
                    ~{documentAnalytics.readingTimeMinutes} мин.
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Оценка скорости изучений ИИ</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Найдено маркаров рисков</span>
                  <p className="text-lg font-black text-rose-600">
                    {documentAnalytics.detectedRisks.length} категорий
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Нажмите на маркер для поиска</p>
                </div>
              </div>

              {/* Detected Risk Keyword Tags */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Сканер ключевых условий и юридических формулировок в документе:</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {documentAnalytics.detectedRisks.map((risk, rIdx) => (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(risk.term);
                        setActiveTab('text');
                      }}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      {risk.icon}
                      <span>{risk.label}:</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md font-extrabold text-[11px]">
                        {risk.count} совпадений
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium shrink-0">
          <span>Символов: {doc.charCount} • Строк: {lines.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
          >
            Закрыть ридер
          </button>
        </div>

      </div>
    </div>
  );
};
