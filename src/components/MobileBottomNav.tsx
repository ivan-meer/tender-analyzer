import React, { useState } from 'react';
import { 
  FileText, 
  Package, 
  History, 
  MessageSquare, 
  MoreHorizontal, 
  Building2, 
  Calendar, 
  BookOpen, 
  Cpu, 
  X 
} from 'lucide-react';
import { User } from 'firebase/auth';

interface MobileBottomNavProps {
  onOpenChat: () => void;
  onOpenCustomerVerification?: () => void;
  onOpenSuppliersCatalog?: () => void;
  onOpenCalendar?: () => void;
  onOpenHistory: () => void;
  onScrollToUploader: () => void;
  onOpenAISettings?: () => void;
  onOpenGuide?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenChat,
  onOpenCustomerVerification,
  onOpenSuppliersCatalog,
  onOpenCalendar,
  onOpenHistory,
  onScrollToUploader,
  onOpenAISettings,
  onOpenGuide,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1.5 transition-colors">
        <div className="grid grid-cols-5 items-center max-w-md mx-auto text-center">
          
          {/* 1. Analysis (Upload/Home) */}
          <button
            type="button"
            onClick={onScrollToUploader}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-1 truncate">
              Анализ
            </span>
          </button>

          {/* 2. Products / Suppliers Catalog */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSuppliersCatalog) onOpenSuppliersCatalog();
            }}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-1 truncate">
              Каталог
            </span>
          </button>

          {/* 3. Database / Saved history */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-1 truncate">
              База
            </span>
          </button>

          {/* 4. AI Consultant Chat */}
          <button
            type="button"
            onClick={onOpenChat}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-1 truncate">
              ИИ-Чат
            </span>
          </button>

          {/* 5. More Menu */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-medium mt-1 truncate">
              Ещё
            </span>
          </button>

        </div>
      </nav>

      {/* Clean Compact "More" Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 space-y-3 shadow-xl animate-slide-up pb-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Инструменты и сервисы
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {onOpenCustomerVerification && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCustomerVerification();
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-medium text-left"
                >
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Проверка ИНН</span>
                </button>
              )}

              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCalendar();
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-medium text-left"
                >
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Календарь</span>
                </button>
              )}

              {onOpenGuide && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenGuide();
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-medium text-left"
                >
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Регламент</span>
                </button>
              )}

              {onOpenAISettings && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAISettings();
                    setIsMoreOpen(false);
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 font-medium text-left"
                >
                  <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Настройки ИИ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

