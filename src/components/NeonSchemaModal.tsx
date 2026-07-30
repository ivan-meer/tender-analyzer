import React, { useEffect, useState } from 'react';
import { 
  X, 
  Database, 
  Table, 
  Key, 
  Columns, 
  Copy, 
  Check, 
  Loader2, 
  Server, 
  Layers, 
  Hash,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { NeonService, NeonDbSchemaResponse } from '../lib/neonService';

interface NeonSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeonSchemaModal: React.FC<NeonSchemaModalProps> = ({
  isOpen,
  onClose
}) => {
  const [schemaData, setSchemaData] = useState<NeonDbSchemaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchSchema();
    }
  }, [isOpen]);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await NeonService.getSchema();
      setSchemaData(data);
    } catch (err: any) {
      console.error('Failed to load schema:', err);
      setError(err?.message || 'Не удалось загрузить структуру БД Neon');
    } finally {
      setLoading(false);
    }
  };

  const copyDdlToClipboard = () => {
    const ddl = `-- СТРУКТУРА БАЗЫ ДАННЫХ NEON POSTGRESQL (neondb)
-- Автоматически сгенерированный DDL скрипт

CREATE TABLE IF NOT EXISTS neon_suppliers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  region TEXT,
  specialization TEXT,
  contacts_or_website TEXT,
  website_url TEXT,
  in_gisp_registry BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS neon_catalog_items (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES neon_suppliers(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  model_name TEXT NOT NULL,
  manufacturer TEXT,
  country TEXT DEFAULT 'Российская Федерация',
  dimensions TEXT,
  estimated_price NUMERIC(12, 2),
  price_formatted TEXT,
  description TEXT,
  gisp_registry_status TEXT,
  product_url TEXT,
  image_url TEXT,
  product_features TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_neon_catalog_model ON neon_catalog_items(LOWER(model_name));
CREATE INDEX IF NOT EXISTS idx_neon_catalog_category ON neon_catalog_items(LOWER(category));
`;

    navigator.clipboard.writeText(ddl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-md">
                  Neon PostgreSQL
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Подключено
                </span>
              </div>
              <h2 className="text-xl font-black text-white leading-tight">
                Структура Данных БД и Таблиц
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSchema}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Обновить структуру"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={copyDdlToClipboard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Скопировано DDL' : 'Скопировать DDL'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">Получение схемы таблиц и столбцов из Neon DB...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl text-rose-300 text-xs">
              {error}
            </div>
          ) : schemaData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>База Данных</span>
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-base font-black text-cyan-300 truncate">
                    {schemaData.database}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {schemaData.host}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>Таблицы Схемы</span>
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {schemaData.tables.length}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    public schema
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>Записи Поставщиков</span>
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-black text-emerald-400">
                    {schemaData.counts?.suppliers_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    neon_suppliers
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>Записи Каталога / ТХ</span>
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-amber-400">
                    {schemaData.counts?.items_count || 0}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold">
                    neon_catalog_items
                  </div>
                </div>
              </div>

              {/* Table Schema Details */}
              <div className="space-y-5">
                <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                  <Columns className="w-4 h-4 text-cyan-400" />
                  <span>Структура Таблиц и Аттрибутов</span>
                </h3>

                {schemaData.tables.map((table) => (
                  <div key={table.tableName} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden space-y-3 p-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-cyan-400" />
                        <span className="font-extrabold text-sm text-cyan-300 font-mono">
                          {table.tableName}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-bold">
                          {table.columnCount} столбцов
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                            <th className="pb-2 font-bold">Имя столбца</th>
                            <th className="pb-2 font-bold">Тип данных</th>
                            <th className="pb-2 font-bold">Nullable</th>
                            <th className="pb-2 font-bold">По умолчанию</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {table.columns.map((col) => (
                            <tr key={col.column} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2 text-slate-200 font-bold flex items-center gap-1.5">
                                {col.column === 'id' ? (
                                  <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                ) : col.column.includes('id') ? (
                                  <Key className="w-3 h-3 text-indigo-400 shrink-0" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                                )}
                                <span>{col.column}</span>
                              </td>
                              <td className="py-2 text-cyan-400">{col.type}</td>
                              <td className="py-2">
                                {col.nullable ? (
                                  <span className="text-slate-500">YES</span>
                                ) : (
                                  <span className="text-rose-400 font-bold">NOT NULL</span>
                                )}
                              </td>
                              <td className="py-2 text-slate-400 text-[10px] truncate max-w-[180px]">
                                {col.default || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Схема находится в активном постоянном состоянии (Neon Serverless PostgreSQL)</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
