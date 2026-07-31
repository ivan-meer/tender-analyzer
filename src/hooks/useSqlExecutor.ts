import { useState, useCallback } from 'react';
import { dbService, SqlResultTable } from '../lib/dbService';

export interface UseSqlExecutorReturn {
  isExecuting: boolean;
  sqlTable: SqlResultTable | null;
  error: string | null;
  executeSql: (query: string) => Promise<SqlResultTable>;
  resetSqlState: () => void;
}

/**
 * Custom React Hook for executing PostgreSQL queries via dbService.ts
 * Integrates directly with Neon DB endpoint and handles loading/error states.
 */
export function useSqlExecutor(): UseSqlExecutorReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlTable, setSqlTable] = useState<SqlResultTable | null>(null);
  const [error, setError] = useState<string | null>(null);

  const executeSql = useCallback(async (query: string): Promise<SqlResultTable> => {
    setIsExecuting(true);
    setError(null);
    try {
      const result = await dbService.executeSql(query);
      setSqlTable(result);
      if (result.error) {
        setError(result.error);
      }
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'ошибка выполнения SQL в dbService';
      setError(errMsg);
      const fallbackTable: SqlResultTable = {
        sqlExecuted: query,
        columns: ['error'],
        rows: [{ error: errMsg }],
        rowCount: 0,
        executionTimeMs: 0,
        fromLiveDb: false,
        error: errMsg,
      };
      setSqlTable(fallbackTable);
      return fallbackTable;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const resetSqlState = useCallback(() => {
    setIsExecuting(false);
    setSqlTable(null);
    setError(null);
  }, []);

  return {
    isExecuting,
    sqlTable,
    error,
    executeSql,
    resetSqlState,
  };
}
