import { ParsedDocument } from '../utils/documentParser';
import { AnalysisInput, AnalysisResult, ProcedureType } from '../types';

export const AUTOSAVE_STORAGE_KEY = 'procurement_active_autosave_session';
export const AUTOSAVE_BACKUP_KEY = 'procurement_autosave_backup';
export const AUTOSAVE_CONFIG_KEY = 'procurement_autosave_config';

export interface AutoSaveUploaderState {
  lawType: '223_FZ' | '44_FZ' | 'COMMERCIAL';
  procedureType: ProcedureType;
  parsedFiles: ParsedDocument[];
  pastedText: string;
  additionalNotes: string;
  userOverridden?: boolean;
}

export interface AutoSaveAnalysisState {
  result: AnalysisResult | null;
  activeTab?: string;
  lastInput?: AnalysisInput | null;
  timestamp?: string;
}

export interface AutoSaveSessionState {
  id: string;
  version: number;
  lastSavedAt: string;
  mode: 'uploader' | 'analysis';
  uploaderState: AutoSaveUploaderState;
  analysisState?: AutoSaveAnalysisState | null;
  activeEditingDocId?: string | null;
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  showRestorePrompt: boolean;
}

export const DEFAULT_AUTOSAVE_CONFIG: AutoSaveConfig = {
  enabled: true,
  debounceMs: 800,
  showRestorePrompt: true,
};

/**
 * Load configuration for auto-save
 */
export function getAutoSaveConfig(): AutoSaveConfig {
  try {
    const raw = localStorage.getItem(AUTOSAVE_CONFIG_KEY);
    if (!raw) return DEFAULT_AUTOSAVE_CONFIG;
    return { ...DEFAULT_AUTOSAVE_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_AUTOSAVE_CONFIG;
  }
}

/**
 * Save configuration for auto-save
 */
export function setAutoSaveConfig(config: Partial<AutoSaveConfig>): void {
  try {
    const current = getAutoSaveConfig();
    localStorage.setItem(AUTOSAVE_CONFIG_KEY, JSON.stringify({ ...current, ...config }));
  } catch (e) {
    console.warn('Failed to save auto-save config:', e);
  }
}

/**
 * Check if the state has meaningful user data to save or restore
 */
export function hasMeaningfulContent(session: Partial<AutoSaveSessionState> | null): boolean {
  if (!session) return false;

  const uploader = session.uploaderState;
  if (uploader) {
    if (uploader.parsedFiles && uploader.parsedFiles.length > 0) return true;
    if (uploader.pastedText && uploader.pastedText.trim().length > 0) return true;
    if (uploader.additionalNotes && uploader.additionalNotes.trim().length > 0) return true;
  }

  if (session.analysisState && session.analysisState.result) {
    return true;
  }

  return false;
}

/**
 * Persist the active session state to localStorage
 */
export function saveActiveSession(state: Partial<AutoSaveSessionState>): boolean {
  try {
    // If state is completely empty, we do not need to overwrite with empty unless intentional
    const fullState: AutoSaveSessionState = {
      id: state.id || 'active_session',
      version: 1,
      lastSavedAt: new Date().toISOString(),
      mode: state.mode || (state.analysisState?.result ? 'analysis' : 'uploader'),
      uploaderState: state.uploaderState || {
        lawType: '223_FZ',
        procedureType: '223_FZ_QUOTATION',
        parsedFiles: [],
        pastedText: '',
        additionalNotes: '',
      },
      analysisState: state.analysisState || null,
      activeEditingDocId: state.activeEditingDocId || null,
    };

    const serialized = JSON.stringify(fullState);
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, serialized);

    // Keep a rolling backup if it has meaningful data
    if (hasMeaningfulContent(fullState)) {
      localStorage.setItem(AUTOSAVE_BACKUP_KEY, serialized);
    }

    return true;
  } catch (e) {
    console.warn('Failed to persist active autosave session:', e);
    return false;
  }
}

/**
 * Load the active session state from localStorage
 */
export function loadActiveSession(): AutoSaveSessionState | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: AutoSaveSessionState = JSON.parse(raw);
    
    // Check if the session is valid
    if (parsed && typeof parsed === 'object' && hasMeaningfulContent(parsed)) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('Failed to load active autosave session:', e);
    // Try fallback to backup
    try {
      const backupRaw = localStorage.getItem(AUTOSAVE_BACKUP_KEY);
      if (backupRaw) {
        return JSON.parse(backupRaw);
      }
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Clear the active auto-save session (e.g. on new audit / clear all)
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear autosave session:', e);
  }
}

/**
 * Format a human-friendly relative time or timestamp
 */
export function formatAutoSaveTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 5) return 'только что';
    if (diffSeconds < 60) return `${diffSeconds} сек. назад`;
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} мин. назад`;
    }

    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}
