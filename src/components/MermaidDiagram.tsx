import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { RefreshCw, ZoomIn, Copy, Check } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

// Initialize mermaid with optimal theme and settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  themeVariables: {
    darkMode: true,
    background: '#0f172a',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#cbd5e1',
    secondaryColor: '#0ea5e9',
    tertiaryColor: '#10b981',
  },
});

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setError(null);
        const uniqueId = `mermaid-id-${Math.random().toString(36).substring(2, 9)}`;
        const cleanChart = chart.trim();
        
        const { svg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.warn('Mermaid render warning:', err);
        if (isMounted) {
          setError(err?.message || 'Не удалось отрисовать Mermaid диаграмму');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopyChart = () => {
    navigator.clipboard.writeText(chart);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-300 space-y-2">
        <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1.5">
          <span>⚠️ Код схемы Mermaid</span>
          <button
            onClick={handleCopyChart}
            className="text-[11px] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{isCopied ? 'Скопировано' : 'Копировать'}</span>
          </button>
        </div>
        <pre className="overflow-x-auto text-[11px] text-cyan-300 bg-slate-950 p-2 rounded-xl">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-3 bg-slate-900/90 dark:bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4 shadow-inner overflow-hidden relative group">
      <div className="flex items-center justify-between text-[11px] text-indigo-300 font-bold border-b border-slate-800/80 pb-2 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Интерактивная диаграмма процессов / схемы
        </span>
        <button
          onClick={handleCopyChart}
          className="text-slate-400 hover:text-white text-[10px] bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-slate-700/60"
        >
          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{isCopied ? 'Скопировано' : 'Копировать Mermaid'}</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-x-auto flex justify-center items-center py-2 min-h-[120px] [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
};
