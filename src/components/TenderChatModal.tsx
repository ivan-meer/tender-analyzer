import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, X, Sparkles, Copy, Check, RefreshCw, Database, Terminal, Table as TableIcon, Download, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

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

const QUICK_PROMPTS = [
  '🔍 Подбери кресла с сиденьем 450-550 мм',
  '📊 Показать v_requirement_coverage',
  '⚠️ Проверить v_data_issues',
  'SELECT * FROM furniture.product_model LIMIT 10',
  'Протокол разногласий к штрафу 3%',
];

export const TenderChatModal: React.FC<TenderChatModalProps> = ({
  isOpen,
  onClose,
  activeAnalysisContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Здравствуйте! Я ваш ИИ-ассистент по тендерному каталогу мебели и закупкам 223-ФЗ. Я умею искать подходящие товары по базе PostgreSQL (схема furniture), вычислять интервалы габаритов (ПОКРЫВАЕТ, ПЕРЕСЕКАЕТ, В ДОПУСКЕ, НЕТ ДАННЫХ) и выполнять безопасные SQL-запросы.',
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
        note: "Каталог Neon DB (furniture.v_requirement_coverage)"
      }
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'text' | 'table'>>({});

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
      // Format history for backend
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
    const header = table.columns.join(',');
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
    link.setAttribute('download', `furniture_sql_export_${Date.now()}.csv`);
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('В ДОПУСКЕ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
          <Check className="w-3 h-3 text-cyan-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('ПЕРЕСЕКАЕТ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('НЕТ ДАННЫХ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
          {str}
        </span>
      );
    }

    if (str === 'критично') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          ⚠️ Критично
        </span>
      );
    }

    if (str === 'важно') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
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
                <h3 className="font-bold text-base text-white">ИИ-Консультант & SQL Neon DB</h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Database className="w-2.5 h-2.5 text-cyan-400" />
                  furniture.schema
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Автоматический подбор товаров по базе PostgreSQL и 223-ФЗ</p>
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
          <span className="text-[11px] text-slate-400 font-bold uppercase shrink-0 pl-2">Запросы к каталогу:</span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-200 rounded-full shrink-0 text-xs font-medium transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map(msg => {
            const hasSql = Boolean(msg.sqlQuery || msg.sqlTable);
            const currentTab = activeTab[msg.id] || (msg.sqlTable ? 'table' : 'text');

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
                  className={`max-w-[92%] rounded-2xl p-4 shadow-2xs space-y-3 relative group ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Mode switcher tabs if SQL table exists */}
                  {hasSql && msg.role === 'assistant' && (
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'text' }))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentTab === 'text'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          Пояснения ИИ
                        </button>
                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'table' }))}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'table'
                              ? 'bg-cyan-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <TableIcon className="w-3.5 h-3.5" />
                          Таблица результатов SQL
                          {msg.sqlTable?.rowCount !== undefined && (
                            <span className="ml-1 bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                              {msg.sqlTable.rowCount}
                            </span>
                          )}
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
                        PostgreSQL 17 Neon DB
                      </span>
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
                      {/* Executed SQL Code Panel */}
                      {msg.sqlQuery && (
                        <div className="bg-slate-950 text-indigo-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                            <span className="flex items-center gap-1 text-cyan-400 font-bold">
                              <Terminal className="w-3.5 h-3.5" />
                              SQL-Запрос к базе Neon (furniture)
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

                      {/* Interactive Data Table */}
                      {msg.sqlTable && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                          {/* Table Meta Bar */}
                          <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <TableIcon className="w-4 h-4 text-cyan-500" />
                                Выборка из базы ({msg.sqlTable.rowCount} строк)
                              </span>
                              {msg.sqlTable.executionTimeMs !== undefined && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  • {msg.sqlTable.executionTimeMs} мс
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => exportTableCsv(msg.sqlTable!)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Download className="w-3 h-3 text-indigo-500" />
                              Экспорт CSV
                            </button>
                          </div>

                          {/* Error Banner if any */}
                          {msg.sqlTable.error && (
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs border-b border-rose-500/20 font-mono">
                              ⚠️ {msg.sqlTable.error}
                            </div>
                          )}

                          {/* Render Scrollable Table */}
                          {msg.sqlTable.columns && msg.sqlTable.columns.length > 0 && msg.sqlTable.rows ? (
                            <div className="overflow-x-auto max-h-80 scrollbar-thin">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                  <tr>
                                    <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 w-10 text-center text-slate-400">#</th>
                                    {msg.sqlTable.columns.map((col, cIdx) => (
                                      <th key={cIdx} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                  {msg.sqlTable.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors">
                                      <td className="px-3 py-2 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                                        {rIdx + 1}
                                      </td>
                                      {msg.sqlTable!.columns.map((col, cIdx) => (
                                        <td key={cIdx} className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                          {renderTableCell(row[col])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              Запрос выполнен, результатов нет (0 строк).
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
                <span className="text-xs text-slate-500 font-medium">ИИ выполнят сопоставление интервалов и SQL-запрос к базе Neon DB...</span>
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
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Задайте вопрос по мебели или введите SQL-запрос (SELECT * FROM furniture...)..."
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
    </div>
  );
};
