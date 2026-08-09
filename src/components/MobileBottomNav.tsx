import React from 'react';
import { MessageSquare, Building2, Calendar, History, FileText, Sparkles, Cpu, BookOpen, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface MobileBottomNavProps {
  onOpenChat: () => void;
  onOpenCustomerVerification?: () => void;
  onOpenCalendar?: () => void;
  onOpenHistory: () => void;
  onScrollToUploader: () => void;
  onOpenAISettings?: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenChat,
  onOpenCustomerVerification,
  onOpenCalendar,
  onOpenHistory,
  onScrollToUploader,
  onOpenAISettings,
  currentUser,
  onOpenAuthModal,
}) => {
  const isGoogleUser = currentUser && !currentUser.isAnonymous;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 transition-colors duration-200">
      <div className="grid grid-cols-5 items-center justify-between max-w-md mx-auto text-center">
        
        {/* 1. AI Chat Consultant */}
        <button
          type="button"
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center py-1.5 px-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-extrabold mt-1 text-slate-800 dark:text-slate-200 truncate w-full">
            ИИ-Чат
          </span>
        </button>

        {/* 2. Customer INN Check */}
        <button
          type="button"
          onClick={() => onOpenCustomerVerification && onOpenCustomerVerification()}
          className="flex flex-col items-center justify-center py-1.5 px-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200/80 dark:border-amber-800 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-extrabold mt-1 text-slate-800 dark:text-slate-200 truncate w-full">
            ИНН
          </span>
        </button>

        {/* 3. Central Primary Action: Upload & Analyze */}
        <button
          type="button"
          onClick={onScrollToUploader}
          className="flex flex-col items-center justify-center -mt-4 py-1 px-1 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-2 border-white dark:border-slate-900 group-hover:scale-105 transition-all">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black mt-0.5 text-indigo-700 dark:text-indigo-400 uppercase tracking-tighter truncate w-full">
            Анализ
          </span>
        </button>

        {/* 4. Deadlines Calendar */}
        <button
          type="button"
          onClick={() => onOpenCalendar && onOpenCalendar()}
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 transition-all shadow-2xs">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-[10px] font-extrabold mt-1 text-slate-800 dark:text-slate-200 truncate w-full">
            Календарь
          </span>
        </button>

        {/* 5. Database & History */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="flex flex-col items-center justify-center py-1.5 px-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer active:scale-95 group"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-indigo-300 transition-all shadow-2xs">
            <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <span className="text-[10px] font-extrabold mt-1 text-slate-800 dark:text-slate-200 truncate w-full">
            База
          </span>
        </button>

      </div>
    </nav>
  );
};
