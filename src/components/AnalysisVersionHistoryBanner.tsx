import React, { useState } from 'react';
import { 
  GitBranch, 
  History, 
  Sparkles, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileUp, 
  X, 
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';
import { AnalysisResult, AnalysisVersion, ContractRiskItem } from '../types';

interface AnalysisVersionHistoryBannerProps {
  analysis: AnalysisResult;
  onUpdateAnalysisVersion: (updatedAnalysis: AnalysisResult) => void;
}

export const AnalysisVersionHistoryBanner: React.FC<AnalysisVersionHistoryBannerProps> = ({
  analysis,
  onUpdateAnalysisVersion
}) => {
  const [isRescanModalOpen, setIsRescanModalOpen] = useState(false);
  const [rescanText, setRescanText] = useState('');
  const [versionNoteInput, setVersionNoteInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(analysis.version || 1);

  const currentVersion = analysis.version || 1;
  const history = analysis.versionHistory || [];

  // Handle re-scanning documentation and creating a new version
  const handleRunRescan = async () => {
    if (!rescanText.trim()) {
      alert('Пожалуйста, введите текст новой редакции документации или договора.');
      return;
    }

    setIsProcessing(true);
    try {
      // Call backend /api/analyze with new text
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: rescanText,
          procedureType: analysis.summary.is223FZ ? '223_FZ' : '44_FZ'
        })
      });

      let newAnalysisData: AnalysisResult;
      if (res.ok) {
        newAnalysisData = await res.json();
      } else {
        throw new Error('API error during re-analysis');
      }

      // Snapshot current version before updating
      const prevVersionSnapshot: AnalysisVersion = {
        version: currentVersion,
        id: `v${currentVersion}-${Date.now()}`,
        createdAt: analysis.versionTimestamp || new Date().toISOString(),
        note: analysis.versionNote || (currentVersion === 1 ? 'Первоначальный анализ документации' : `Редакция v${currentVersion}`),
        overallRiskScore: analysis.summary.overallRiskScore,
        riskLevel: analysis.summary.riskLevel,
        contractRisksCount: analysis.contractRisks.length,
        newRisksCount: analysis.newRisksCount || 0,
        resolvedRisksCount: analysis.resolvedRisksCount || 0,
        analysisResultSnapshot: JSON.parse(JSON.stringify(analysis))
      };

      const updatedHistory = [...history, prevVersionSnapshot];
      const nextVersionNum = currentVersion + 1;

      // Identify NEW risks and RESOLVED risks by comparing clauses/titles
      const oldRiskTitles = new Set(analysis.contractRisks.map(r => (r.clauseNumber + ' ' + r.title).toLowerCase()));
      const newRiskTitles = new Set((newAnalysisData.contractRisks || []).map(r => (r.clauseNumber + ' ' + r.title).toLowerCase()));

      let newRisksCount = 0;
      const updatedNewRisks: ContractRiskItem[] = (newAnalysisData.contractRisks || []).map((risk, index) => {
        const key = (risk.clauseNumber + ' ' + risk.title).toLowerCase();
        const isNew = !oldRiskTitles.has(key);
        if (isNew) newRisksCount++;

        return {
          ...risk,
          id: risk.id || `risk-v${nextVersionNum}-${index}`,
          isNew,
          versionAdded: isNew ? nextVersionNum : (risk.versionAdded || 1)
        };
      });

      let resolvedRisksCount = 0;
      analysis.contractRisks.forEach(oldRisk => {
        const key = (oldRisk.clauseNumber + ' ' + oldRisk.title).toLowerCase();
        if (!newRiskTitles.has(key)) {
          resolvedRisksCount++;
        }
      });

      const updatedAnalysis: AnalysisResult = {
        ...newAnalysisData,
        version: nextVersionNum,
        versionTimestamp: new Date().toISOString(),
        versionNote: versionNoteInput.trim() || `Извещение №${nextVersionNum} (Повторный скан)`,
        previousVersionScore: analysis.summary.overallRiskScore,
        newRisksCount,
        resolvedRisksCount,
        versionHistory: updatedHistory,
        contractRisks: updatedNewRisks
      };

      onUpdateAnalysisVersion(updatedAnalysis);
      setSelectedVersionNum(nextVersionNum);
      setIsRescanModalOpen(false);
      setRescanText('');
      setVersionNoteInput('');
    } catch (err) {
      console.error('Re-scan error:', err);
      alert('Произошла ошибка при повторном сканировании. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectVersion = (vNum: number) => {
    if (vNum === currentVersion) return;
    const targetSnap = history.find(h => h.version === vNum);
    if (targetSnap && targetSnap.analysisResultSnapshot) {
      // Revert/view older version snapshot
      const restored = JSON.parse(JSON.stringify(targetSnap.analysisResultSnapshot));
      onUpdateAnalysisVersion(restored);
      setSelectedVersionNum(vNum);
    }
  };

  const scoreDiff = analysis.previousVersionScore !== undefined 
    ? analysis.summary.overallRiskScore - analysis.previousVersionScore 
    : 0;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-indigo-800/50 space-y-4 animate-fade-in">
      
      {/* Version Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
            <GitBranch className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-indigo-500 text-white font-mono font-black text-xs rounded-lg shadow-xs">
                Версия v{currentVersion}
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-white">
                {analysis.versionNote || 'Первоначальный анализ документации'}
              </h4>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Обновлено: {new Date(analysis.versionTimestamp || Date.now()).toLocaleDateString('ru-RU')} ({new Date(analysis.versionTimestamp || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})</span>
            </p>
          </div>
        </div>

        {/* Action Button: Repeat Scan / New Version */}
        <button
          onClick={() => setIsRescanModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-cyan-300" />
          <span>Загрузить новую редакцию (v{currentVersion + 1})</span>
        </button>
      </div>

      {/* Version Comparison Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        
        {/* Risk Score Trend */}
        <div className="bg-slate-800/80 border border-indigo-800/40 p-3 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-indigo-200 uppercase font-extrabold block">Индекс риска</span>
          <div className="flex items-center justify-between font-mono font-black text-sm">
            <span>{analysis.summary.overallRiskScore} / 100</span>
            {scoreDiff !== 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                scoreDiff < 0 ? 'bg-emerald-500/30 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
              }`}>
                {scoreDiff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} б.
              </span>
            )}
          </div>
        </div>

        {/* New Risks Count */}
        <div className="bg-slate-800/80 border border-indigo-800/40 p-3 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-amber-300 uppercase font-extrabold block">⚡ Новых рисков</span>
          <div className="font-mono font-black text-sm text-amber-400 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            <span>+{analysis.newRisksCount || 0} факторов</span>
          </div>
        </div>

        {/* Resolved Risks Count */}
        <div className="bg-slate-800/80 border border-indigo-800/40 p-3 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-emerald-300 uppercase font-extrabold block">✓ Снято / Устранено</span>
          <div className="font-mono font-black text-sm text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{analysis.resolvedRisksCount || 0} рисков</span>
          </div>
        </div>

        {/* Total History Stack Switcher */}
        <div className="bg-slate-800/80 border border-indigo-800/40 p-3 rounded-2xl space-y-0.5">
          <span className="text-[10px] text-indigo-200 uppercase font-extrabold block">Всего версий</span>
          <div className="flex items-center gap-1 pt-0.5 overflow-x-auto scrollbar-none">
            {Array.from({ length: currentVersion }, (_, i) => i + 1).map(vNum => (
              <button
                key={vNum}
                onClick={() => handleSelectVersion(vNum)}
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  vNum === currentVersion
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-300'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                v{vNum}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Modal for uploading/pasting new contract text for re-scanning */}
      {isRescanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in text-slate-900 dark:text-white">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base">Повторный скан и создание версии v{currentVersion + 1}</h3>
              </div>
              <button
                onClick={() => setIsRescanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Наименование / Причина изменений (опционально):
                </label>
                <input
                  type="text"
                  value={versionNoteInput}
                  onChange={(e) => setVersionNoteInput(e.target.value)}
                  placeholder="Напр.: Извещение №2 (Изменение штрафов и сроков поставки)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                  Вставьте измененный текст проекта договора / ТЗ:
                </label>
                <textarea
                  rows={8}
                  value={rescanText}
                  onChange={(e) => setRescanText(e.target.value)}
                  placeholder="Вставьте обновленные условия договора или новую редакцию технического задания..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRescanModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleRunRescan}
                disabled={isProcessing || !rescanText.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Сравнение и сканирование...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сформировать версию v{currentVersion + 1}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
