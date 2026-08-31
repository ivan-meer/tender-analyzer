import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AutoSaveSessionState,
  AutoSaveUploaderState,
  AutoSaveAnalysisState,
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  hasMeaningfulContent,
  getAutoSaveConfig,
} from '../utils/autoSaveManager';

interface UseAutoSaveProps {
  uploaderState: AutoSaveUploaderState;
  analysisState?: AutoSaveAnalysisState | null;
  activeEditingDocId?: string | null;
  mode?: 'uploader' | 'analysis';
  onRestore?: (session: AutoSaveSessionState) => void;
}

export function useAutoSave({
  uploaderState,
  analysisState,
  activeEditingDocId,
  mode = 'uploader',
  onRestore,
}: UseAutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasRestoredSession, setHasRestoredSession] = useState(false);
  const [restoredSessionData, setRestoredSessionData] = useState<AutoSaveSessionState | null>(null);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  const debounceTimerRef = useRef<any>(null);
  const isInitialMountRef = useRef(true);
  const latestStateRef = useRef<AutoSaveSessionState>({
    id: 'active_session',
    version: 1,
    lastSavedAt: new Date().toISOString(),
    mode,
    uploaderState,
    analysisState: analysisState || null,
    activeEditingDocId: activeEditingDocId || null,
  });

  // Keep latest state in ref for event handlers (beforeunload / visibilitychange)
  latestStateRef.current = {
    id: 'active_session',
    version: 1,
    lastSavedAt: lastSavedAt || new Date().toISOString(),
    mode,
    uploaderState,
    analysisState: analysisState || null,
    activeEditingDocId: activeEditingDocId || null,
  };

  // Immediate synchronous flush function
  const flushSaveSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const stateToSave = latestStateRef.current;
    if (hasMeaningfulContent(stateToSave)) {
      const now = new Date().toISOString();
      stateToSave.lastSavedAt = now;
      const success = saveActiveSession(stateToSave);
      if (success) {
        setLastSavedAt(now);
      }
    }
  }, []);

  // 1. Initial Load & Recovery Check
  useEffect(() => {
    if (!isInitialMountRef.current) return;
    isInitialMountRef.current = false;

    const config = getAutoSaveConfig();
    if (!config.enabled) return;

    const savedSession = loadActiveSession();
    if (savedSession && hasMeaningfulContent(savedSession)) {
      setRestoredSessionData(savedSession);
      setLastSavedAt(savedSession.lastSavedAt);
      setHasRestoredSession(true);

      if (config.showRestorePrompt) {
        setShowRestoredNotice(true);
      }

      if (onRestore) {
        onRestore(savedSession);
      }
    }
  }, [onRestore]);

  // 2. Debounced Auto-Save on any state change
  useEffect(() => {
    // Skip saving during first mount if we just loaded
    const config = getAutoSaveConfig();
    if (!config.enabled) return;

    const currentState: AutoSaveSessionState = {
      id: 'active_session',
      version: 1,
      lastSavedAt: new Date().toISOString(),
      mode,
      uploaderState,
      analysisState: analysisState || null,
      activeEditingDocId: activeEditingDocId || null,
    };

    if (!hasMeaningfulContent(currentState)) {
      return;
    }

    setIsSaving(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      currentState.lastSavedAt = now;
      const saved = saveActiveSession(currentState);
      if (saved) {
        setLastSavedAt(now);
      }
      setIsSaving(false);
      debounceTimerRef.current = null;
    }, config.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    uploaderState,
    analysisState,
    activeEditingDocId,
    mode,
  ]);

  // 3. Window & Tab Navigation Guards
  useEffect(() => {
    // Flush on beforeunload (browser refresh, back/forward, tab close)
    const handleBeforeUnload = () => {
      flushSaveSync();
    };

    // Flush when tab is hidden (switch tabs, minimize browser)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSaveSync]);

  const saveImmediately = useCallback(() => {
    flushSaveSync();
  }, [flushSaveSync]);

  const clearAutoSaveDraft = useCallback(() => {
    clearActiveSession();
    setLastSavedAt(null);
    setShowRestoredNotice(false);
    setHasRestoredSession(false);
    setRestoredSessionData(null);
  }, []);

  const dismissRestoredNotice = useCallback(() => {
    setShowRestoredNotice(false);
  }, []);

  return {
    isSaving,
    lastSavedAt,
    hasRestoredSession,
    restoredSessionData,
    showRestoredNotice,
    saveImmediately,
    clearAutoSaveDraft,
    dismissRestoredNotice,
  };
}
