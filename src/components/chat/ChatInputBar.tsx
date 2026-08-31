import React, { useRef } from 'react';
import { Paperclip, Mic, MicOff, Send, X, FileText } from 'lucide-react';
import { TokenPriceEstimator } from '../TokenPriceEstimator';
import { AttachedFile } from '../TenderChatModal';

interface ChatInputBarProps {
  inputText: string;
  setInputText: (text: string) => void;
  attachedFiles: AttachedFile[];
  onRemoveAttachment: (id: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  isLoading: boolean;
  onSend: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  inputText,
  setInputText,
  attachedFiles,
  onRemoveAttachment,
  onFileSelect,
  isListening,
  onToggleVoice,
  isLoading,
  onSend
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalChars = inputText.length + attachedFiles.reduce((acc, f) => acc + (f.content?.length || f.size || 0), 0);

  return (
    <>
      {/* File Attachments Bar */}
      {attachedFiles.length > 0 && (
        <div className="px-3.5 pt-2 pb-1 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none animate-fade-in">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Файлы ({attachedFiles.length}):</span>
          {attachedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs shrink-0 shadow-2xs">
              {file.previewUrl ? (
                <img src={file.previewUrl} alt={file.name} className="w-4 h-4 object-cover rounded" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
              )}
              <span className="max-w-[120px] truncate font-medium text-slate-800 dark:text-slate-200">{file.name}</span>
              <span className="text-[9px] text-slate-400 font-mono">({Math.round(file.size / 1024)}KB)</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(file.id)}
                className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 rounded-full cursor-pointer ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Live Token & Real-time Budget Estimation for Current Message / Attached Context */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80">
        <TokenPriceEstimator 
          totalChars={totalChars}
          isCompact={true}
        />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileSelect} 
          multiple 
          className="hidden" 
          accept=".txt,.csv,.json,.md,.pdf,.docx,.xml,.png,.jpg,.jpeg" 
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95"
          title="Прикрепить файлы ТЗ (TXT, CSV, JSON, PNG)"
        >
          <Paperclip className="w-4 h-4 text-indigo-500" />
        </button>

        <button
          type="button"
          onClick={onToggleVoice}
          className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
          }`}
          title={isListening ? "Остановить голосовой ввод" : "Голосовой ввод (Микрофон)"}
        >
          {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-cyan-500" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={attachedFiles.length > 0 ? "Напишите вопрос к прикрепленным файлам..." : "Напишите вопрос (например: 'Подбери кресла 450-550 мм')..."}
          disabled={isLoading}
          className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 font-sans"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && attachedFiles.length === 0) || isLoading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-md active:scale-95 shrink-0 flex items-center gap-1.5 font-bold text-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Отправить</span>
        </button>
      </form>
    </>
  );
};
