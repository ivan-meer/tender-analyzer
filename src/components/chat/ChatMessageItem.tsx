import React from 'react';
import { 
  Bot, User, Copy, Check, Terminal, Table as TableIcon, 
  Download, AlertTriangle, ShieldCheck, Search, ChevronDown, 
  ChevronUp, Building2, LayoutGrid, Maximize2, ExternalLink, 
  Activity, CheckCircle2, Cpu, Play, Volume2, VolumeX, Paperclip, Eye
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SqlResultTable, AgentActionLog } from '../../lib/dbService';
import { MermaidDiagram } from '../MermaidDiagram';
import { getUniqueProductImageUrl } from '../../utils/imageMapper';
import { DetailedProduct, AttachedFile } from '../TenderChatModal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sqlQuery?: string;
  sqlTable?: SqlResultTable;
  agentLogs?: AgentActionLog[];
  executionTimeTotalMs?: number;
  attachments?: AttachedFile[];
}

export const COLUMN_HUMAN_NAMES: Record<string, string> = {
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

interface ChatMessageItemProps {
  msg: ChatMessage;
  currentTab: 'cards' | 'table' | 'text';
  onTabChange: (tab: 'cards' | 'table' | 'text') => void;
  isCodeVisible: boolean;
  onToggleCode: () => void;
  isAgentLogsVisible: boolean;
  onToggleAgentLogs: () => void;
  tableSearchTerm: string;
  onTableSearchChange: (term: string) => void;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onSpeak: (id: string, text: string) => void;
  speakingMsgId: string | null;
  onOpenProductDetail: (prod: DetailedProduct) => void;
  onZoomImage: (img: { url: string; title: string }) => void;
  onExecuteManualSql: (msgId: string, sql: string) => void;
  isExecutingManualSql: string | null;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  currentTab,
  onTabChange,
  isCodeVisible,
  onToggleCode,
  isAgentLogsVisible,
  onToggleAgentLogs,
  tableSearchTerm,
  onTableSearchChange,
  copiedId,
  onCopy,
  onSpeak,
  speakingMsgId,
  onOpenProductDetail,
  onZoomImage,
  onExecuteManualSql,
  isExecutingManualSql
}) => {
  const hasSql = Boolean(msg.sqlQuery || msg.sqlTable);
  const filterQuery = (tableSearchTerm || '').toLowerCase();

  let filteredRows = msg.sqlTable?.rows || [];
  if (filterQuery && msg.sqlTable?.columns) {
    filteredRows = filteredRows.filter(row => 
      msg.sqlTable!.columns.some(col => 
        String(row[col] ?? '').toLowerCase().includes(filterQuery)
      )
    );
  }

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

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      if (
        language === 'mermaid' ||
        (!language && inline === false && /^(graph|flowchart|gantt|sequenceDiagram|erDiagram|classDiagram|stateDiagram|pie)\b/i.test(codeString.trim()))
      ) {
        return <MermaidDiagram chart={codeString} />;
      }

      if (!inline && language === 'sql') {
        return (
          <div className="my-2 bg-slate-950 text-cyan-300 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                SQL Выражение (PostgreSQL)
              </span>
              <button
                onClick={() => onCopy('code_' + Math.random(), codeString)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Скопировать SQL</span>
              </button>
            </div>
            <code>{codeString}</code>
          </div>
        );
      }

      if (!inline) {
        return (
          <div className="my-2 bg-slate-950 text-slate-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative">
            <code>{codeString}</code>
          </div>
        );
      }

      return (
        <code className="bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700/80">
          {children}
        </code>
      );
    },
    img({ src, alt, ...props }: any) {
      if (!src) return null;
      return (
        <span className="inline-block my-2 group relative">
          <img
            src={src}
            alt={alt || 'Изображение товара'}
            referrerPolicy="no-referrer"
            onClick={() => onZoomImage({ url: src, title: alt || 'Изображение товара' })}
            className="max-w-xs sm:max-w-sm max-h-60 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover cursor-zoom-in hover:opacity-95 transition-all shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
            }}
            {...props}
          />
          <span className="text-[10px] text-slate-400 block mt-1 font-sans italic">
            📷 {alt || 'Нажмите для увеличения'}
          </span>
        </span>
      );
    },
    a({ href, children, ...props }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-0.5"
          {...props}
        >
          {children}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-3 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return (
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
          {children}
        </thead>
      );
    },
    tbody({ children }: any) {
      return (
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {children}
        </tbody>
      );
    },
    tr({ children }: any) {
      return (
        <tr className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors">
          {children}
        </tr>
      );
    },
    th({ children }: any) {
      return (
        <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
          {children}
        </td>
      );
    },
    p({ children }: any) {
      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
    },
    h1({ children }: any) {
      return <h1 className="text-base font-extrabold text-slate-900 dark:text-white my-2">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-sm font-bold text-slate-900 dark:text-white my-2">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-xs font-bold text-slate-900 dark:text-white my-1.5">{children}</h3>;
    },
  };

  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                onClick={() => onTabChange('cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'cards'
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
                onClick={() => onTabChange('table')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'table'
                    ? 'bg-cyan-600 text-white shadow-2xs ring-2 ring-cyan-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                📊 Таблица SQL
              </button>

              <button
                onClick={() => onTabChange('text')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'text'
                    ? 'bg-slate-800 text-white shadow-2xs ring-2 ring-slate-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                💬 Текст & Схемы
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {msg.agentLogs && msg.agentLogs.length > 0 && (
                <button
                  onClick={onToggleAgentLogs}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span>Шаги Агента ({msg.agentLogs.length})</span>
                  {isAgentLogsVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {msg.sqlQuery && (
                <button
                  onClick={onToggleCode}
                  className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{isCodeVisible ? 'Скрыть SQL' : 'SQL-Код'}</span>
                  {isCodeVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Agent Action Execution Log Timeline Card */}
        {msg.agentLogs && msg.agentLogs.length > 0 && isAgentLogsVisible && (
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-3.5 space-y-2 border border-slate-800 animate-fade-in text-xs shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-indigo-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                Журнал действий ИИ-Агента (dbService.ts)
              </span>
              {msg.executionTimeTotalMs && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Всего: {msg.executionTimeTotalMs} мс
                </span>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {msg.agentLogs.map((log, lIdx) => (
                <div key={lIdx} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-[12px]">{log.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.description}</p>
                    {log.sql && (
                      <div className="mt-1 font-mono text-[10px] bg-slate-900 p-1.5 rounded text-cyan-300 border border-slate-800 overflow-x-auto">
                        {log.sql}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markdown + Mermaid + Image Rendered Message */}
        {(currentTab === 'text' || msg.role === 'user' || !hasSql) && (
          <div className="text-xs sm:text-sm font-sans leading-relaxed break-words">
            {msg.role === 'user' ? (
              <div className="whitespace-pre-wrap">{msg.content}</div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}

        {/* SQL Execution Block & Interactive Table */}
        {hasSql && msg.role === 'assistant' && (
          <div className="space-y-3 pt-1">
            {/* Collapsible Technical SQL Code */}
            {msg.sqlQuery && isCodeVisible && (
              <div className="bg-slate-950 text-indigo-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative animate-fade-in space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1 text-cyan-400 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    Запрос PostgreSQL к схеме furniture (dbService.ts)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onExecuteManualSql(msg.id, msg.sqlQuery!)}
                      disabled={isExecutingManualSql === msg.id}
                      className="hover:text-emerald-300 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                      title="Перевыполнить запрос через dbService.ts"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isExecutingManualSql === msg.id ? 'Запрос...' : 'Выполнить в dbService'}</span>
                    </button>
                    <button
                      onClick={() => onCopy(msg.id + '_sql', msg.sqlQuery!)}
                      className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedId === msg.id + '_sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id + '_sql' ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                </div>
                <code>{msg.sqlQuery}</code>
              </div>
            )}

            {/* Interactive Product Cards View */}
            {msg.sqlTable && currentTab === 'cards' && (
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
                        value={tableSearchTerm}
                        onChange={(e) => onTableSearchChange(e.target.value)}
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
                          <div 
                            onClick={() => onZoomImage({ url: prod.imageUrl, title: `${prod.modelName} — ${prod.supplierName}` })}
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

                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                              Технические характеристики ({prod.specs.length}):
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
                                Характеристики подтверждены в базе Neon PostgreSQL
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Ориентировочно:</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {prod.priceText}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenProductDetail({
                                msgId: msg.id,
                                originalIndex: prod.originalIndex,
                                modelName: prod.modelName,
                                supplierName: prod.supplierName,
                                matchStatus: prod.matchStatus,
                                priceText: prod.priceText,
                                imageUrl: prod.imageUrl,
                                specs: prod.specs,
                                rawRow: filteredRows[prod.originalIndex] || {}
                              })}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Подробнее</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onCopy(`model_${pIdx}`, `${prod.modelName} (${prod.supplierName})`)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
                              title="Скопировать названия ТХ"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Interactive Data Table View */}
            {msg.sqlTable && currentTab === 'table' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <TableIcon className="w-4 h-4 text-cyan-500" />
                      Найдено строк: <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{filteredRows.length}</span> из {msg.sqlTable.rowCount}
                    </span>
                    {msg.sqlTable.note && (
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 hidden sm:inline-block">
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
                        value={tableSearchTerm}
                        onChange={(e) => onTableSearchChange(e.target.value)}
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

                {msg.sqlTable.error && (
                  <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs border-b border-rose-500/20 font-mono flex items-center justify-between">
                    <span>⚠️ {msg.sqlTable.error}</span>
                    {msg.sqlQuery && (
                      <button
                        onClick={() => onExecuteManualSql(msg.id, msg.sqlQuery!)}
                        className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                      >
                        Повторить через dbService
                      </button>
                    )}
                  </div>
                )}

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

        {/* Render attached files on User message if present */}
        {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/20">
            {msg.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-medium text-white/90">
                <Paperclip className="w-3 h-3 text-cyan-200" />
                <span className="truncate max-w-[120px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] opacity-70 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <span>{msg.timestamp}</span>
          {msg.role === 'assistant' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSpeak(msg.id, msg.content)}
                className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                title={speakingMsgId === msg.id ? "Остановить озвучивание" : "Озвучить ответ"}
              >
                {speakingMsgId === msg.id ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{speakingMsgId === msg.id ? 'Стоп' : 'Озвучить'}</span>
              </button>

              <button
                onClick={() => onCopy(msg.id, msg.content)}
                className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                title="Копировать ответ"
              >
                {copiedId === msg.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === msg.id ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
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
};
