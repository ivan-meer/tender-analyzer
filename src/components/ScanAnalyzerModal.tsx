import React, { useState, useRef } from 'react';
import { Camera, Upload, X, FileImage, Sparkles, AlertCircle, Check, Copy, RefreshCw, FileText } from 'lucide-react';

interface ScanAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtractedTextReady?: (text: string) => void;
}

export const ScanAnalyzerModal: React.FC<ScanAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onExtractedTextReady,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения (JPG, PNG, WEBP, TIFF)');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSelectedImage(evt.target?.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRunImageAnalysis = async () => {
    if (!selectedImage || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          prompt: customPrompt.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      setAnalysisResult(data.analysisText || 'Распознавание завершено.');
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setAnalysisResult(`Ошибка распознавания скана: ${err?.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyTextToForm = () => {
    if (analysisResult && onExtractedTextReady) {
      onExtractedTextReady(analysisResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <Camera className="w-6 h-6 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Анализ сканов и фото документов (Multimodal)</h3>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Распознавание текста, таблиц ТЗ и печатей с фотографий или сканов</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* File selector zone */}
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-3xl p-8 text-center space-y-3 cursor-pointer bg-indigo-50/30 dark:bg-indigo-950/20 transition-all group"
            >
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Нажмите для загрузки скана или фотографии документа
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Поддерживаются сканы проекта договора, чертежей ТЗ, таблиц спецификаций и фотографий листов (JPG, PNG, WEBP)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <img
                  src={selectedImage}
                  alt="Document Scan"
                  className="w-full sm:w-36 h-36 object-cover rounded-xl border border-slate-300 dark:border-slate-600 shrink-0"
                />
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <FileImage className="w-4 h-4 text-indigo-600" />
                      <span>Скан загружен и готов к ИИ-обработке</span>
                    </span>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold"
                    >
                      Сменить скан
                    </button>
                  </div>

                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Доп. указание для ИИ (например: 'Распознай таблицу ТЗ и разбей по позициям')"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <button
                    onClick={handleRunImageAnalysis}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>ИИ считывает текст скана...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Распознать скан с Gemini Vision</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Output */}
          {analysisResult && (
            <div className="space-y-3 animate-fade-in pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Распознанный текст и юридические выводы:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Скопировано' : 'Копировать'}</span>
                  </button>

                  {onExtractedTextReady && (
                    <button
                      onClick={handleApplyTextToForm}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Перенести в форму анализа</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans shadow-inner max-h-72 overflow-y-auto">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
