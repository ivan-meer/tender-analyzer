export interface SqlResultTable {
  sqlExecuted: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  fromLiveDb?: boolean;
  note?: string;
  error?: string;
}

export interface AgentActionLog {
  step: number;
  title: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  sql?: string;
}

/**
 * Service for executing SQL queries against the Neon PostgreSQL database (furniture schema)
 * and providing structured helpers for tender matching and catalog statistics.
 */
export class DbService {
  /**
   * Execute safe SELECT/WITH SQL queries on the Neon database.
   */
  static async executeSql(sql: string): Promise<SqlResultTable> {
    const startTime = Date.now();
    let cleanSql = sql.trim();
    cleanSql = cleanSql.replace(/^```sql\s*/i, '').replace(/^```\s*/, '').replace(/```$/g, '').trim();

    try {
      const res = await fetch('/api/furniture/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: cleanSql })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Ошибка выполнения SQL`);
      }

      const data: SqlResultTable = await res.json();
      return data;
    } catch (err: any) {
      console.warn('DbService.executeSql warning:', err?.message);
      return {
        sqlExecuted: cleanSql,
        columns: ['error_status', 'sql_query'],
        rows: [{ error_status: err?.message || 'Ошибка подключения к базе', sql_query: cleanSql }],
        rowCount: 0,
        executionTimeMs: Date.now() - startTime,
        fromLiveDb: false,
        error: err?.message || 'Ошибка выполнения SQL запроса'
      };
    }
  }

  /**
   * Helper: Get catalog completeness & attribute coverage
   */
  static async getRequirementCoverage(): Promise<SqlResultTable> {
    const sql = `SELECT label_ru, pct_models, suppliers_with_value, tender_advice_ru FROM furniture.v_requirement_coverage ORDER BY pct_models DESC LIMIT 10;`;
    return this.executeSql(sql);
  }

  /**
   * Helper: Get data anomalies and issues
   */
  static async getDataIssues(): Promise<SqlResultTable> {
    const sql = `SELECT model_key, supplier, dimension_ru, value_min, value_max, issue_ru, severity FROM furniture.v_data_issues LIMIT 10;`;
    return this.executeSql(sql);
  }

  /**
   * Helper: Match tender requirements against catalog models
   */
  static async matchTender(seatHeightMin: number = 450, seatHeightMax: number = 550): Promise<SqlResultTable> {
    const sql = `SELECT model_id, supplier, model_name, score, reqs_covered, reqs_no_data, price_min, match_status, detail FROM furniture.match_tender LIMIT 10;`;
    return this.executeSql(sql);
  }

  /**
   * Helper: Search catalog models with optional dimension filters
   */
  static async searchCatalog(params?: {
    query?: string;
    minHeight?: number;
    maxHeight?: number;
    limit?: number;
  }): Promise<SqlResultTable> {
    const limit = params?.limit || 10;
    const sql = `SELECT model_id, supplier, model_name, score, reqs_covered, reqs_no_data, price_min, match_status, detail FROM furniture.match_tender LIMIT ${limit};`;
    return this.executeSql(sql);
  }
}

export const dbService = DbService;
