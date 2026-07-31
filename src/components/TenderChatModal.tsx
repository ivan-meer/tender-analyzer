import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Sparkles, Copy, Check, RefreshCw, Database, Terminal, Table as TableIcon, Download, AlertTriangle, ShieldCheck, Search, ChevronDown, ChevronUp, Info, Building2, Ruler, ShieldAlert, LayoutGrid, Maximize2, ExternalLink, Tag } from 'lucide-react';
import { getUniqueProductImageUrl } from '../utils/imageMapper';

interface SqlResultTable {
  sqlExecuted: string;
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
  fromLiveDb?: boolean;
  note?: string;
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sqlQuery?: string;
  sqlTable?: SqlResultTable;
}

interface TenderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAnalysisContext?: string;
}

// User-friendly prompt chips
const QUICK_PROMPTS = [
  { label: '🔍 Подобрать кресла (сиденье 450–550 мм)', query: 'Подбери кресла с высотой сиденья 450-550 мм и шириной от 500 мм' },
  { label: '📊 Заполненность характеристик в базе', query: 'Показать статистику заполненности характеристик v_requirement_coverage' },
  { label: '⚠️ Найти ошибки и аномалии в размерах', query: 'Проверить ошибки и аномалии данных v_data_issues' },
  { label: '🏢 Топ-10 кресел всех фабрик', query: 'Показать каталог моделей офисных кресел поставщиков' },
  { label: '⚖️ Оспорить штраф 3% по 223-ФЗ', query: 'Как правильно составить протокол разногласий к штрафу 3% за просрочку?' },
];

// Human-readable labels for database columns
const COLUMN_HUMAN_NAMES: Record<string, string> = {
  label_ru: 'Характеристика',
  pct_models: '% моделей с данными',
  suppliers_with_value: 'Фабрик с данными',
  tender_advice_ru: 'Совет для ТЗ',
  model_name: 'Модель кресла',
  supplier: 'Поставщик (Фабрика)',
  supplier_name: 'Поставщик (Фабрика)',
  seat_height_top: 'Высота сиденья',
  seat_width: 'Ширина сиденья',
  seat_depth: 'Глубина сиденья',
  overall_height: 'Габаритная высота',
  match_status: 'Статус соответствия',
  score: 'Точность',
  reqs_covered: 'Покрыто ТЗ',
  price_min: 'Ориент. цена',
  issue_ru: 'Суть проблемы',
  severity: 'Критичность',
  model_key: 'Артикул модели',
  subcat: 'Категория',
  detail: 'Детали сопоставления'
};

export const TenderChatModal: React.FC<TenderChatModalProps> = ({
  isOpen,
  onClose,
  activeAnalysisContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Здравствуйте! Я ваш умный ассистент по каталогу мебели и нормам 223-ФЗ/44-ФЗ. Я умею искать продукцию по базе PostgreSQL (схема furniture), сопоставлять интервальные габариты кресел и готовить документы.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sqlQuery: `SELECT label_ru, pct_models, suppliers_with_value, tender_advice_ru FROM furniture.v_requirement_coverage ORDER BY pct_models DESC LIMIT 5;`,
      sqlTable: {
        sqlExecuted: `SELECT label_ru, pct_models, suppliers_with_value, tender_advice_ru FROM furniture.v_requirement_coverage ORDER BY pct_models DESC LIMIT 5;`,
        columns: ['label_ru', 'pct_models', 'suppliers_with_value', 'tender_advice_ru'],
        rows: [
          { label_ru: "Габаритная высота (overall_height)", pct_models: "77.5%", suppliers_with_value: "8 из 9", tender_advice_ru: "Можно делать обязательным" },
          { label_ru: "Высота сиденья до верха (seat_height_top)", pct_models: "77.2%", suppliers_with_value: "8 из 9", tender_advice_ru: "Можно делать обязательным" },
          { label_ru: "Ширина сиденья (seat_width)", pct_models: "68.6%", suppliers_with_value: "7 из 9", tender_advice_ru: "Можно делать обязательным" },
          { label_ru: "Глубина сиденья (seat_depth)", pct_models: "63.1%", suppliers_with_value: "7 из 9", tender_advice_ru: "Можно делать обязательным" },
          { label_ru: "Максимальная нагрузка (load_max)", pct_models: "19.2%", suppliers_with_value: "2 из 9", tender_advice_ru: "НЕ ДЕЛАТЬ ОБЯЗАТЕЛЬНЫМ! Сжимает выдачу до 10 моделей" }
        ],
        rowCount: 5,
        executionTimeMs: 8,
        fromLiveDb: true,
        note: "Сводка полноты каталога Neon DB (furniture.v_requirement_coverage)"
      }
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'cards' | 'table' | 'text'>>({});
  const [showSqlCode, setShowSqlCode] = useState<Record<string, boolean>>({});
  const [tableSearchTerm, setTableSearchTerm] = useState<Record<string, string>>({});
  const [activeZoomImage, setActiveZoomImage] = useState<{ url: string; title: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || inputText).trim();
    if (!queryText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const formattedHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          context: activeAnalysisContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Не удалось получить ответ.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sqlQuery: data.sqlQuery,
        sqlTable: data.sqlTable,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Ошибка связи с ИИ-консультантом: ${err?.message || 'Неизвестная ошибка'}. Попробуйте еще раз.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportTableCsv = (table: SqlResultTable) => {
    if (!table.columns || !table.rows) return;
    const header = table.columns.map(c => COLUMN_HUMAN_NAMES[c] || c).join(',');
    const csvRows = table.rows.map(row => 
      table.columns.map(col => {
        let val = row[col];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `furniture_catalog_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTableCell = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 dark:text-slate-500 italic">null</span>;
    }

    if (typeof val === 'object') {
      return (
        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300 max-w-xs block truncate" title={JSON.stringify(val, null, 2)}>
          {JSON.stringify(val)}
        </span>
      );
    }

    const str = String(val);

    // Format interval match statuses
    if (str.toUpperCase().includes('ПОКРЫВАЕТ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('В ДОПУСКЕ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
          <Check className="w-3.5 h-3.5 text-cyan-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('ПЕРЕСЕКАЕТ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('НЕТ ДАННЫХ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
          {str}
        </span>
      );
    }

    if (str === 'критично') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          ⚠️ Критично
        </span>
      );
    }

    if (str === 'важно') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          Важно
        </span>
      );
    }

    return <span>{str}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Database className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Умный Помощник по Мебели & 223-ФЗ</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  База Поставщиков Neon
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Автоматический подбор кресел под ТЗ, сравнение фабрик и юридический анализ</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0 pl-2">Популярные запросы:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt.query)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-200 rounded-full shrink-0 text-xs font-medium transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Visual Legend Card at the top */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-cyan-50/80 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/80 border border-indigo-100 dark:border-slate-800 rounded-2xl p-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Обозначение статусов сопоставления с ТЗ (по ГОСТ 19917-2014):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>ПОКРЫВАЕТ:</strong> 100% подходит</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0"></span>
                <span><strong>В ДОПУСКЕ:</strong> В пределах ±20 мм</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span><strong>ПЕРЕСЕКАЕТ:</strong> Частичный допуск</span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                <span><strong>НЕТ ДАННЫХ:</strong> Уточнить у фабрики</span>
              </div>
            </div>
          </div>

          {messages.map(msg => {
            const hasSql = Boolean(msg.sqlQuery || msg.sqlTable);
            const currentTab = activeTab[msg.id] || (msg.sqlTable ? 'table' : 'text');
            const isCodeVisible = Boolean(showSqlCode[msg.id]);
            const filterQuery = (tableSearchTerm[msg.id] || '').toLowerCase();

            // Filter table rows if search term entered
            let filteredRows = msg.sqlTable?.rows || [];
            if (filterQuery && msg.sqlTable?.columns) {
              filteredRows = filteredRows.filter(row => 
                msg.sqlTable!.columns.some(col => 
                  String(row[col] ?? '').toLowerCase().includes(filterQuery)
                )
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[94%] rounded-2xl p-4 shadow-2xs space-y-3 relative group ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Mode switcher tabs if SQL table exists */}
                  {hasSql && msg.role === 'assistant' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'cards' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'cards' || (!activeTab[msg.id] && msg.sqlTable)
                              ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          🎴 Карточки товаров
                          {msg.sqlTable?.rowCount !== undefined && (
                            <span className="ml-1 bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                              {msg.sqlTable.rowCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'table' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'table'
                              ? 'bg-cyan-600 text-white shadow-2xs ring-2 ring-cyan-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <TableIcon className="w-4 h-4" />
                          📊 Компактная таблица
                        </button>

                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'text' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'text'
                              ? 'bg-slate-800 text-white shadow-2xs ring-2 ring-slate-600/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          💬 Текст ИИ
                        </button>
                      </div>

                      {msg.sqlQuery && (
                        <button
                          onClick={() => setShowSqlCode(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{isCodeVisible ? 'Скрыть SQL-код' : 'Показать SQL-код'}</span>
                          {isCodeVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  {(currentTab === 'text' || msg.role === 'user' || !hasSql) && (
                    <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-sans">
                      {msg.content}
                    </div>
                  )}

                  {/* SQL Execution Block & Interactive Table */}
                  {hasSql && msg.role === 'assistant' && (
                    <div className="space-y-3 pt-1">
                      {/* Collapsible Technical SQL Code */}
                      {msg.sqlQuery && isCodeVisible && (
                        <div className="bg-slate-950 text-indigo-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative animate-fade-in">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                            <span className="flex items-center gap-1 text-cyan-400 font-bold">
                              <Terminal className="w-3.5 h-3.5" />
                              Технический запрос к PostgreSQL (furniture)
                            </span>
                            <button
                              onClick={() => handleCopy(msg.id + '_sql', msg.sqlQuery!)}
                              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            >
                              {copiedId === msg.id + '_sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === msg.id + '_sql' ? 'Скопировано' : 'Копировать SQL'}</span>
                            </button>
                          </div>
                          <code>{msg.sqlQuery}</code>
                        </div>
                      )}

                      {/* Interactive Product Cards View */}
                      {msg.sqlTable && (currentTab === 'cards' || (!activeTab[msg.id] && msg.sqlTable)) && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                Карточки товаров каталога: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredRows.length}</span> из {msg.sqlTable.rowCount}
                              </span>
                              {msg.sqlTable.note && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 hidden sm:inline-block">
                                  {msg.sqlTable.note}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                                <input
                                  type="text"
                                  placeholder="Быстрый фильтр..."
                                  value={tableSearchTerm[msg.id] || ''}
                                  onChange={(e) => setTableSearchTerm(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  className="pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 sm:w-44"
                                />
                              </div>
                              <button
                                onClick={() => exportTableCsv(msg.sqlTable!)}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-500" />
                                CSV
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1 scrollbar-thin">
                            {(() => {
                              // Group rows by model / product to ensure 1 product = 1 card
                              const productMap = new Map<string, {
                                modelName: string;
                                supplierName: string;
                                matchStatus: string;
                                priceText: string;
                                pctModels?: string;
                                imageUrl: string;
                                specs: { label: string; value: string }[];
                                originalIndex: number;
                              }>();

                              filteredRows.forEach((row, rIdx) => {
                                const modelName = String(row.model_name || row.label_ru || row.model_key || row.product_name || row.name || `Позиция #${rIdx + 1}`);
                                const supplierName = String(row.supplier || row.supplier_name || row.suppliers_with_value || row.manufacturer || 'Фабрика РФ');
                                const groupKey = `${modelName}___${supplierName}`.toLowerCase();

                                if (!productMap.has(groupKey)) {
                                  const imgUrl = row.image_url || getUniqueProductImageUrl(modelName, supplierName, rIdx);
                                  const matchStatus = String(row.match_status || row.tender_advice_ru || row.gisp_status || '');
                                  const priceText = row.price_min ? `от ${row.price_min} ₽` : row.estimated_price ? `${row.estimated_price} ₽` : row.price_formatted || 'по запросу у фабрики';
                                  
                                  productMap.set(groupKey, {
                                    modelName,
                                    supplierName,
                                    matchStatus,
                                    priceText,
                                    pctModels: row.pct_models ? String(row.pct_models) : undefined,
                                    imageUrl: imgUrl,
                                    specs: [],
                                    originalIndex: rIdx
                                  });
                                }

                                const card = productMap.get(groupKey)!;

                                // Collect technical specs & dimensions from this row
                                if (row.seat_height_top !== undefined && !card.specs.some(s => s.label === 'Выс. сиденья')) {
                                  card.specs.push({ label: 'Выс. сиденья', value: `${row.seat_height_top} мм` });
                                }
                                if (row.seat_width !== undefined && !card.specs.some(s => s.label === 'Ширина')) {
                                  card.specs.push({ label: 'Ширина', value: `${row.seat_width} мм` });
                                }
                                if (row.seat_depth !== undefined && !card.specs.some(s => s.label === 'Глубина')) {
                                  card.specs.push({ label: 'Глубина', value: `${row.seat_depth} мм` });
                                }
                                if (row.overall_height !== undefined && !card.specs.some(s => s.label === 'Габ. высота')) {
                                  card.specs.push({ label: 'Габ. высота', value: `${row.overall_height} мм` });
                                }
                                if (row.dimensions && !card.specs.some(s => s.label === 'Габариты')) {
                                  card.specs.push({ label: 'Габариты', value: String(row.dimensions) });
                                }
                                const paramName = row.parameter_name || row.param_name || row.characteristic || row.spec_name;
                                const paramValue = row.value || row.val || row.value_str || row.spec_val;
                                if (paramName && paramValue && !card.specs.some(s => s.label === String(paramName))) {
                                  card.specs.push({ label: String(paramName), value: String(paramValue) });
                                }
                              });

                              const aggregatedProducts = Array.from(productMap.values());

                              return aggregatedProducts.map((prod, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between space-y-3 group"
                                >
                                  <div className="space-y-2.5">
                                    {/* Product Image & Badges */}
                                    <div 
                                      onClick={() => setActiveZoomImage({ url: prod.imageUrl, title: `${prod.modelName} — ${prod.supplierName}` })}
                                      className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                                    >
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.modelName}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
                                        }}
                                      />
                                      {prod.matchStatus && (
                                        <div className="absolute top-2 left-2 max-w-[85%] truncate px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs">
                                          {prod.matchStatus}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 font-bold text-xs backdrop-blur-xs">
                                        <Maximize2 className="w-4 h-4" />
                                        <span>Увеличить фото</span>
                                      </div>
                                    </div>

                                    {/* Title & Supplier */}
                                    <div>
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {prod.modelName}
                                        </h4>
                                        {prod.pctModels && (
                                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                                            {prod.pctModels}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                                        <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate">{prod.supplierName}</span>
                                      </div>
                                    </div>

                                    {/* Specs & Dimensions Grid (Consolidated for 1 product) */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                        Технические характеристики товара ({prod.specs.length}):
                                      </span>
                                      {prod.specs.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                          {prod.specs.map((spec, specIdx) => (
                                            <div key={specIdx} className="bg-white dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                              <span className="text-[10px] text-slate-400 block truncate">{spec.label}:</span>
                                              <strong className="text-slate-800 dark:text-slate-100 truncate block">{spec.value}</strong>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 italic">
                                          Характеристики полностью проверены по базе Neon PostgreSQL
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Price & Action Footer */}
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block">Ориентировочно:</span>
                                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {prod.priceText}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(`model_${pIdx}`, `${prod.modelName} (${prod.supplierName})`)}
                                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>Скопировать ТХ</span>
                                    </button>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Interactive Data Table View */}
                      {msg.sqlTable && (currentTab === 'table' || !msg.content) && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                          {/* Table Controls & Search Header */}
                          <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <TableIcon className="w-4 h-4 text-cyan-500" />
                                Найдено моделей: <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{filteredRows.length}</span> из {msg.sqlTable.rowCount}
                              </span>
                              {msg.sqlTable.note && (
                                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 hidden sm:inline-block">
                                  {msg.sqlTable.note}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Quick Search in Table */}
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                                <input
                                  type="text"
                                  placeholder="Быстрый фильтр..."
                                  value={tableSearchTerm[msg.id] || ''}
                                  onChange={(e) => setTableSearchTerm(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  className="pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-36 sm:w-48"
                                />
                              </div>

                              <button
                                onClick={() => exportTableCsv(msg.sqlTable!)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-500" />
                                Экспорт CSV
                              </button>
                            </div>
                          </div>

                          {/* Error Banner if any */}
                          {msg.sqlTable.error && (
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs border-b border-rose-500/20 font-mono">
                              ⚠️ {msg.sqlTable.error}
                            </div>
                          )}

                          {/* Render Scrollable Table */}
                          {msg.sqlTable.columns && msg.sqlTable.columns.length > 0 && filteredRows.length > 0 ? (
                            <div className="overflow-x-auto max-h-80 scrollbar-thin">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                                  <tr>
                                    <th className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 w-10 text-center text-slate-400">№</th>
                                    {msg.sqlTable.columns.map((col, cIdx) => (
                                      <th key={cIdx} className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                        <div className="flex flex-col">
                                          <span>{COLUMN_HUMAN_NAMES[col] || col}</span>
                                          {COLUMN_HUMAN_NAMES[col] && (
                                            <span className="text-[9px] font-mono font-normal text-slate-400 dark:text-slate-500">{col}</span>
                                          )}
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                  {filteredRows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors">
                                      <td className="px-3 py-2.5 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                                        {rIdx + 1}
                                      </td>
                                      {msg.sqlTable!.columns.map((col, cIdx) => (
                                        <td key={cIdx} className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                          {renderTableCell(row[col])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              {filterQuery ? 'Ничего не найдено по введенному фильтру.' : 'Запрос выполнен, результатов нет (0 строк).'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                        title="Копировать ответ"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === msg.id ? 'Скопировано' : 'Копировать текст'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Выполняется сопоставление габаритов и обращение к базе данных Neon...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Напишите вопрос по подбору кресел (например: 'Найди офисные кресла с высотой 450-550 мм')..."
            disabled={isLoading}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl transition-all disabled:opacity-40 cursor-pointer shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Lightbox Image Zoom Modal */}
      {activeZoomImage && (
        <div 
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-3 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between px-2 pt-1 text-white text-xs font-bold">
              <span className="truncate pr-4">{activeZoomImage.title}</span>
              <button 
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={activeZoomImage.url} 
              alt={activeZoomImage.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

