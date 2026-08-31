import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Trash2, RotateCcw, FileUp, Info, Building2, LayoutGrid, FileText, Cpu, CheckCircle2, RefreshCw, Clock, AlertTriangle
} from 'lucide-react';
import { dbService, SqlResultTable, AgentActionLog } from '../lib/dbService';
import { useSqlExecutor } from '../hooks/useSqlExecutor';
import { VERIFIED_SUPPLIERS } from '../data/verifiedSuppliers';
import { ChatProductDetailModal } from './chat/ChatProductDetailModal';
import { ChatPenaltyCalcModal } from './chat/ChatPenaltyCalcModal';
import { ChatSuppliersTab } from './chat/ChatSuppliersTab';
import { ChatProductsTab } from './chat/ChatProductsTab';
import { ChatDetailsTab } from './chat/ChatDetailsTab';
import { ChatToolsDropdown } from './chat/ChatToolsDropdown';
import { ChatMessageItem, ChatMessage } from './chat/ChatMessageItem';
import { ChatInputBar } from './chat/ChatInputBar';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
  previewUrl?: string;
}

export interface DetailedProduct {
  msgId: string;
  originalIndex: number;
  modelName: string;
  supplierName: string;
  matchStatus: string;
  priceText: string;
  imageUrl: string;
  specs: { label: string; value: string }[];
  rawRow: Record<string, any>;
}

export const MOCK_CHAIR_IMAGES = [
  { title: 'Эргономичное сетчатое кресло', url: '/src/assets/images/office_chair_ergonomic_1785511520849.jpg' },
  { title: 'Премиум кожаное кресло руководителя', url: '/src/assets/images/executive_leather_chair_1785511530335.jpg' },
  { title: 'Стильное операторское синее кресло', url: '/src/assets/images/task_chair_blue_1785511542046.jpg' },
  { title: 'Классическое тканевое офисное кресло', url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80' },
  { title: 'Современное компьютерное кресло', url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80' },
  { title: 'Черное анатомическое кресло', url: 'https://images.unsplash.com/photo-1688578735427-91038bc320f7?auto=format&fit=crop&w=800&q=80' },
];

interface TenderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAnalysisContext?: any;
}

// User-friendly prompt chips
const QUICK_PROMPTS = [
  { label: '🔍 Подобрать кресла (сиденье 450–550 мм)', query: 'Подбери кресла с высотой сиденья 450-550 мм и шириной от 500 мм' },
  { label: '📊 Заполненность характеристик в базе', query: 'Показать статистику заполненности характеристик v_requirement_coverage' },
  { label: '⚠️ Найти ошибки и аномалии в размерах', query: 'Проверить ошибки и аномалии данных v_data_issues' },
  { label: '🏢 Топ-10 кресел всех фабрик', query: 'Показать каталог моделей офисных кресел поставщиков' },
  { label: '⚖️ Схема обжалования штрафа 3% (Mermaid)', query: 'Нарисуй Mermaid диаграмму и дай пошаговую инструкцию, как оспорить штраф 3% за просрочку по 223-ФЗ' },
];

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `### 👋 Здравствуйте! Я ваш ИИ-консультант по закупкам (223-ФЗ)

Готов проанализировать ТЗ, проверить поставщиков, подобрать товары из реестра ГИСП/Neon DB и сформировать отчет.

Переключайтесь между вкладками **Чат**, **Поставщики**, **Товары** и **Детали закупки** выше для быстрого доступа!`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export const TenderChatModal: React.FC<TenderChatModalProps> = ({
  isOpen,
  onClose,
  activeAnalysisContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'cards' | 'table' | 'text'>>({});
  const [showSqlCode, setShowSqlCode] = useState<Record<string, boolean>>({});
  const [showAgentLogs, setShowAgentLogs] = useState<Record<string, boolean>>({});
  const [tableSearchTerm, setTableSearchTerm] = useState<Record<string, string>>({});
  const [activeZoomImage, setActiveZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [isExecutingManualSql, setIsExecutingManualSql] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Main Modal View Mode: 'chat' | 'suppliers' | 'products' | 'details'
  const [modalMode, setModalMode] = useState<'chat' | 'suppliers' | 'products' | 'details'>('chat');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // File Attachments State & Ref
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice & Audio Speech State
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Tools Drawer & Penalty Calc State
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showPenaltyCalc, setShowPenaltyCalc] = useState(false);
  const [penaltyContractAmount, setPenaltyContractAmount] = useState('1000000');
  const [penaltyDays, setPenaltyDays] = useState('10');
  const [penaltyKeyRate, setPenaltyKeyRate] = useState('16');

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<DetailedProduct | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showMockGallery, setShowMockGallery] = useState(false);
  const productImageFileInputRef = useRef<HTMLInputElement>(null);

  const [productEditForm, setProductEditForm] = useState({
    modelName: '',
    supplierName: '',
    matchStatus: '',
    priceText: '',
    imageUrl: '',
    seatHeightTop: '',
    seatWidth: '',
    seatDepth: '',
    overallHeight: '',
    loadMax: ''
  });

  const openProductDetail = (prod: DetailedProduct) => {
    setSelectedProduct(prod);
    setIsEditingProduct(false);
    setShowMockGallery(false);
    setProductEditForm({
      modelName: prod.modelName,
      supplierName: prod.supplierName,
      matchStatus: prod.matchStatus,
      priceText: prod.priceText,
      imageUrl: prod.imageUrl,
      seatHeightTop: String(prod.rawRow.seat_height_top ?? ''),
      seatWidth: String(prod.rawRow.seat_width ?? ''),
      seatDepth: String(prod.rawRow.seat_depth ?? ''),
      overallHeight: String(prod.rawRow.overall_height ?? ''),
      loadMax: String(prod.rawRow.load_max ?? '')
    });
  };

  const handleSaveProductEdits = () => {
    if (!selectedProduct) return;
    const { msgId, originalIndex } = selectedProduct;

    setMessages(prev => prev.map(m => {
      if (m.id === msgId && m.sqlTable) {
        const updatedRows = [...m.sqlTable.rows];
        const targetRow = { ...updatedRows[originalIndex] };

        targetRow.model_name = productEditForm.modelName;
        targetRow.supplier = productEditForm.supplierName;
        targetRow.match_status = productEditForm.matchStatus;
        targetRow.price_min = productEditForm.priceText;
        targetRow.image_url = productEditForm.imageUrl;
        if (productEditForm.seatHeightTop) targetRow.seat_height_top = productEditForm.seatHeightTop;
        if (productEditForm.seatWidth) targetRow.seat_width = productEditForm.seatWidth;
        if (productEditForm.seatDepth) targetRow.seat_depth = productEditForm.seatDepth;
        if (productEditForm.overallHeight) targetRow.overall_height = productEditForm.overallHeight;
        if (productEditForm.loadMax) targetRow.load_max = productEditForm.loadMax;

        updatedRows[originalIndex] = targetRow;

        return {
          ...m,
          sqlTable: {
            ...m.sqlTable,
            rows: updatedRows
          }
        };
      }
      return m;
    }));

    setSelectedProduct(prev => {
      if (!prev) return null;
      return {
        ...prev,
        modelName: productEditForm.modelName,
        supplierName: productEditForm.supplierName,
        matchStatus: productEditForm.matchStatus,
        priceText: productEditForm.priceText,
        imageUrl: productEditForm.imageUrl,
        rawRow: {
          ...prev.rawRow,
          model_name: productEditForm.modelName,
          supplier: productEditForm.supplierName,
          match_status: productEditForm.matchStatus,
          price_min: productEditForm.priceText,
          image_url: productEditForm.imageUrl,
          seat_height_top: productEditForm.seatHeightTop,
          seat_width: productEditForm.seatWidth,
          seat_depth: productEditForm.seatDepth,
          overall_height: productEditForm.overallHeight,
          load_max: productEditForm.loadMax
        }
      };
    });

    setIsEditingProduct(false);
  };

  const updateProductPhoto = (newUrl: string) => {
    setProductEditForm(prev => ({ ...prev, imageUrl: newUrl }));
    if (selectedProduct) {
      setSelectedProduct(prev => prev ? ({ ...prev, imageUrl: newUrl }) : null);
      setMessages(prevMsgs => prevMsgs.map(m => {
        if (m.id === selectedProduct.msgId && m.sqlTable) {
          const updatedRows = [...m.sqlTable.rows];
          updatedRows[selectedProduct.originalIndex] = {
            ...updatedRows[selectedProduct.originalIndex],
            image_url: newUrl
          };
          return { ...m, sqlTable: { ...m.sqlTable, rows: updatedRows } };
        }
        return m;
      }));
    }
  };

  const handleProductPhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    updateProductPhoto(previewUrl);
  };

  const handleDeleteProductPhoto = () => {
    const fallbackUrl = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
    updateProductPhoto(fallbackUrl);
  };

  const handleReplacePhotoUrl = () => {
    const url = prompt('Введите URL нового изображения товара:', productEditForm.imageUrl || selectedProduct?.imageUrl || '');
    if (url && url.trim()) {
      updateProductPhoto(url.trim());
    }
  };

  const handleSelectMockImage = (url: string) => {
    updateProductPhoto(url);
    setShowMockGallery(false);
  };

  const { executeSql, resetSqlState } = useSqlExecutor();
  const [activeAgentSteps, setActiveAgentSteps] = useState<AgentActionLog[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const handleClearChat = () => {
    setMessages([]);
    setInputText('');
    setAttachedFiles([]);
    setActiveAgentSteps([]);
    setActiveTab({});
    setShowSqlCode({});
    setShowAgentLogs({});
    setTableSearchTerm({});
    setShowClearConfirm(false);
    setIsExecutingManualSql(null);
    setActiveZoomImage(null);
    resetSqlState();
    if (speakingMsgId && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type.startsWith('text/') || 
                     file.name.endsWith('.json') || 
                     file.name.endsWith('.csv') || 
                     file.name.endsWith('.md') ||
                     file.name.endsWith('.xml') ||
                     file.name.endsWith('.tsv') ||
                     file.name.endsWith('.txt');

      if (isImage) {
        const previewUrl = URL.createObjectURL(file);
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl
        }]);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const textContent = evt.target?.result as string;
          setAttachedFiles(prev => [...prev, {
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            content: textContent
          }]);
        };
        reader.readAsText(file);
      } else {
        setAttachedFiles(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          content: `Документ ${file.name} (${Math.round(file.size / 1024)} KB)`
        }]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => {
      const found = prev.find(f => f.id === id);
      if (found?.previewUrl) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает голосовой ввод. Используйте Google Chrome или Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const toggleSpeechSynthesis = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#*_~`]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 1000);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.05;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    const formatted = messages.map(m => {
      const header = `[${m.timestamp}] ${m.role === 'user' ? 'ПОЛЬЗОВАТЕЛЬ' : 'ИИ-КОНСУЛЬТАНТ 223-ФЗ'}:`;
      return `${header}\n${m.content}\n${m.sqlQuery ? `\n--- SQL ---\n${m.sqlQuery}\n` : ''}\n----------------------------------------\n`;
    }).join('\n');

    const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tender_chat_history_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReExecuteSql = async (msgId: string, sqlToRun: string) => {
    setIsExecutingManualSql(msgId);
    try {
      const newTable = await executeSql(sqlToRun);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            sqlTable: newTable,
            sqlQuery: sqlToRun
          };
        }
        return m;
      }));
    } catch (err: any) {
      console.error('Failed to re-execute SQL:', err);
    } finally {
      setIsExecutingManualSql(null);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || inputText;
    if ((!promptToSend.trim() && attachedFiles.length === 0) || isLoading) return;

    const userAttachments = [...attachedFiles];
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: userAttachments.length > 0 ? userAttachments : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    if (!overridePrompt) setInputText('');
    setAttachedFiles([]);
    setIsLoading(true);

    const initialSteps: AgentActionLog[] = [
      { step: 1, title: 'Анализ запроса и классификация', description: 'Распознавание параметров ГОСТ и ключевых фильтров', status: 'in_progress', timestamp: new Date().toLocaleTimeString() },
      { step: 2, title: 'Прямой поиск в базе Neon PostgreSQL', description: 'Обращение к dbService.ts (v_catalog_search & product_model)', status: 'pending', timestamp: '' },
      { step: 3, title: 'Синтез SQL и валидация схемы furniture', description: 'Подготовка структурированного ответа', status: 'pending', timestamp: '' },
      { step: 4, title: 'Форматирование Markdown и сборка карточек', description: 'Финализация ответа для интерфейса', status: 'pending', timestamp: '' },
    ];
    setActiveAgentSteps(initialSteps);

    const startTime = Date.now();

    try {
      await new Promise(r => setTimeout(r, 100));
      initialSteps[0].status = 'completed';
      initialSteps[1].status = 'in_progress';
      setActiveAgentSteps([...initialSteps]);

      let directDbResult: SqlResultTable | null = null;
      const lowerPrompt = promptToSend.toLowerCase();

      if (lowerPrompt.includes('кресл') || lowerPrompt.includes('стул') || lowerPrompt.includes('подобрать') || lowerPrompt.includes('высот') || lowerPrompt.includes('каталог') || lowerPrompt.includes('модел')) {
        try {
          directDbResult = await dbService.searchCatalog({
            query: promptToSend,
            minHeight: 450,
            maxHeight: 550,
            limit: 10
          });
          initialSteps[1].description = `dbService.searchCatalog() нашел ${directDbResult?.rowCount || 0} записей`;
        } catch (dbErr) {
          console.warn('Direct dbService call failed:', dbErr);
        }
      }

      initialSteps[1].status = 'completed';
      initialSteps[2].status = 'in_progress';
      setActiveAgentSteps([...initialSteps]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          context: activeAnalysisContext || null,
          directDbResult: directDbResult || null,
          attachments: userAttachments.map(a => ({
            name: a.name,
            type: a.type,
            size: a.size,
            content: a.content || (a.previewUrl ? `[Изображение/Скан: ${a.name}]` : '')
          }))
        })
      });

      const data = await res.json();

      let extractedSql = data.sqlQuery || null;
      if (!extractedSql && data.reply) {
        const sqlBlockMatch = data.reply.match(/```sql\s*([\s\S]*?)\s*```/i);
        if (sqlBlockMatch && sqlBlockMatch[1]) {
          extractedSql = sqlBlockMatch[1].trim();
        }
      }

      let finalSqlTable: SqlResultTable | undefined = directDbResult || data.sqlResultTable;
      if (extractedSql && (!finalSqlTable || finalSqlTable.error)) {
        initialSteps[2].description = `Исполнение через executeSql("${extractedSql.slice(0, 45)}...")`;
        setActiveAgentSteps([...initialSteps]);
        finalSqlTable = await executeSql(extractedSql);
      }

      initialSteps[2].status = 'completed';
      initialSteps[3].status = 'in_progress';
      setActiveAgentSteps([...initialSteps]);

      await new Promise(r => setTimeout(r, 150));
      initialSteps[3].status = 'completed';
      setActiveAgentSteps([...initialSteps]);

      const totalTime = Date.now() - startTime;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Не удалось получить ответ.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sqlQuery: extractedSql,
        sqlTable: finalSqlTable,
        agentLogs: JSON.parse(JSON.stringify(initialSteps)),
        executionTimeTotalMs: totalTime,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      initialSteps.forEach(s => {
        if (s.status === 'in_progress') s.status = 'error';
      });

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Ошибка связи с ИИ-консультантом: ${err?.message || 'Неизвестная ошибка'}. Попробуйте еще раз.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentLogs: initialSteps,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setActiveAgentSteps([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Bot className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-tight">
                  ИИ-Ассистент Закупок & dbService
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 hidden sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Neon PostgreSQL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Маркдаун, Mermaid диаграммы, карточки и SQL таблицы</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ChatToolsDropdown
              isOpen={showToolsDrawer}
              onToggle={() => setShowToolsDrawer(!showToolsDrawer)}
              onOpenPenaltyCalc={() => setShowPenaltyCalc(true)}
              onGenerateDisagreementTemplate={() => handleSend("Сгенерируй шаблон Протокола разногласий по закупке мебели (ГОСТ 19917-2014) с обоснованием несоответствия ТЗ")}
              onExportChat={handleExportChat}
              hasMessages={messages.length > 0}
            />

            <div className="relative">
              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 p-1.5 rounded-xl text-xs animate-fade-in shadow-md">
                  <span className="text-[11px] text-amber-300 font-medium px-1">Очистить весь чат?</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearChat();
                    }}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shadow-xs"
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-rose-950/80 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Очистить чат и сбросить историю"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Очистить чат</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setModalMode('chat')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              modalMode === 'chat'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Чат с ИИ</span>
          </button>

          <button
            onClick={() => setModalMode('suppliers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              modalMode === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Поставщики ({VERIFIED_SUPPLIERS.length})</span>
          </button>

          <button
            onClick={() => setModalMode('products')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              modalMode === 'products'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Каталог товаров</span>
          </button>

          <button
            onClick={() => setModalMode('details')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              modalMode === 'details'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Детали закупки</span>
          </button>
        </div>

        {modalMode === 'suppliers' ? (
          <ChatSuppliersTab
            supplierSearch={supplierSearch}
            setSupplierSearch={setSupplierSearch}
            onAskAiAboutSupplier={(supplierName) => {
              setModalMode('chat');
              handleSend(`Покажи подходящие модели и сертификаты фабрики ${supplierName} из базы данных PostgreSQL`);
            }}
          />
        ) : modalMode === 'products' ? (
          <ChatProductsTab
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            onCompareWithTz={(productName) => {
              setModalMode('chat');
              handleSend(`Проверь соответствие позиции «${productName}» требованием ГОСТ 19917-2014 и покажи допуски в таблице`);
            }}
          />
        ) : modalMode === 'details' ? (
          <ChatDetailsTab
            activeAnalysisContext={activeAnalysisContext}
            onGenerateDisagreementProtocol={() => {
              setModalMode('chat');
              handleSend("Сформируй подробный Протокол разногласий к этой закупке с указанием всех жестких требований ТЗ");
            }}
          />
        ) : (
          /* CHAT MODE VIEW */
          <>
            {/* Quick prompt suggestions */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 pl-1">Быстрый поиск:</span>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt.query)}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-200 rounded-full shrink-0 text-xs font-medium transition-all cursor-pointer hover:shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Messages List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
              {/* Status Legend */}
              {messages.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Статусы ГОСТ 19917-2014 в базе PostgreSQL:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span><strong>ПОКРЫВАЕТ:</strong> 100% сопоставимо</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                      <span><strong>В ДОПУСКЕ:</strong> Допуск ±20 мм</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span><strong>ПЕРЕСЕКАЕТ:</strong> Частично</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                      <span><strong>НЕТ ДАННЫХ:</strong> Не указано</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State Screen */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs my-auto space-y-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <Bot className="w-7 h-7" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white">История чата очищена</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Задайте новый вопрос по базе PostgreSQL, прикрепите файлы ТЗ или восстановите исходную переписку.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-2">
                    <button
                      type="button"
                      onClick={() => setMessages([INITIAL_WELCOME_MESSAGE])}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/80 dark:bg-slate-800 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl text-left transition-all cursor-pointer group flex items-center gap-3"
                    >
                      <RotateCcw className="w-5 h-5 text-indigo-500 group-hover:rotate-180 transition-transform shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Восстановить диалог</div>
                        <div className="text-[10px] text-slate-400">Приветствие со сводкой Neon DB</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-slate-50 hover:bg-cyan-50/80 dark:bg-slate-800 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 rounded-2xl text-left transition-all cursor-pointer group flex items-center gap-3"
                    >
                      <FileUp className="w-5 h-5 text-cyan-500 shrink-0" />
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Прикрепить файлы ТЗ</div>
                        <div className="text-[10px] text-slate-400">Анализ TXT, CSV, JSON, MD</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Message Items list */}
              {messages.map(msg => (
                <ChatMessageItem
                  key={msg.id}
                  msg={msg}
                  currentTab={activeTab[msg.id] || (msg.sqlTable ? 'cards' : 'text')}
                  onTabChange={(tab) => setActiveTab(prev => ({ ...prev, [msg.id]: tab }))}
                  isCodeVisible={Boolean(showSqlCode[msg.id])}
                  onToggleCode={() => setShowSqlCode(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                  isAgentLogsVisible={Boolean(showAgentLogs[msg.id])}
                  onToggleAgentLogs={() => setShowAgentLogs(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                  tableSearchTerm={tableSearchTerm[msg.id] || ''}
                  onTableSearchChange={(term) => setTableSearchTerm(prev => ({ ...prev, [msg.id]: term }))}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  onSpeak={toggleSpeechSynthesis}
                  speakingMsgId={speakingMsgId}
                  onOpenProductDetail={openProductDetail}
                  onZoomImage={setActiveZoomImage}
                  onExecuteManualSql={handleReExecuteSql}
                  isExecutingManualSql={isExecutingManualSql}
                />
              ))}

              {/* Loading Agent Steps Animation */}
              {isLoading && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 animate-bounce" />
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-bl-xs shadow-xl text-white space-y-3 max-w-[90%] sm:max-w-[80%]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="font-bold text-xs text-indigo-200">ИИ-Агент анализа & dbService.ts</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/30">
                        Neon PostgreSQL
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeAgentSteps.map((step) => (
                        <div key={step.step} className="flex items-start gap-2.5 text-xs">
                          {step.status === 'completed' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {step.status === 'in_progress' && (
                            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                          )}
                          {step.status === 'pending' && (
                            <Clock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                          )}
                          {step.status === 'error' && (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`font-semibold text-[11px] ${
                                step.status === 'completed' ? 'text-slate-200' :
                                step.status === 'in_progress' ? 'text-cyan-300 font-bold' : 'text-slate-500'
                              }`}>
                                {step.title}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{step.description}</p>
                            {step.sql && (
                              <div className="mt-1 font-mono text-[9px] bg-slate-950 p-1.5 rounded text-cyan-300 border border-slate-800 truncate">
                                {step.sql}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Toolbar */}
            <ChatInputBar
              inputText={inputText}
              setInputText={setInputText}
              attachedFiles={attachedFiles}
              onRemoveAttachment={removeAttachment}
              onFileSelect={handleFileSelect}
              isListening={isListening}
              onToggleVoice={toggleVoiceRecognition}
              isLoading={isLoading}
              onSend={handleSend}
            />
          </>
        )}
      </div>

      {/* Penalty Calculator Modal */}
      {showPenaltyCalc && (
        <ChatPenaltyCalcModal
          isOpen={showPenaltyCalc}
          onClose={() => setShowPenaltyCalc(false)}
          penaltyContractAmount={penaltyContractAmount}
          setPenaltyContractAmount={setPenaltyContractAmount}
          penaltyDays={penaltyDays}
          setPenaltyDays={setPenaltyDays}
          penaltyKeyRate={penaltyKeyRate}
          setPenaltyKeyRate={setPenaltyKeyRate}
          onInsertToChat={(text) => handleSend(text)}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ChatProductDetailModal
          selectedProduct={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isEditingProduct={isEditingProduct}
          setIsEditingProduct={setIsEditingProduct}
          productEditForm={productEditForm}
          setProductEditForm={setProductEditForm}
          showMockGallery={showMockGallery}
          setShowMockGallery={setShowMockGallery}
          fileInputRef={productImageFileInputRef as any}
          onFileSelect={handleProductPhotoFileSelect}
          onReplacePhotoUrl={handleReplacePhotoUrl}
          onDeletePhoto={handleDeleteProductPhoto}
          onSelectMockImage={handleSelectMockImage}
          onSave={handleSaveProductEdits}
          onCopy={(key, text) => handleCopy(key, text)}
        />
      )}

      {/* Lightbox Image Zoom Modal */}
      {activeZoomImage && (
        <div 
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-3 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between px-2 pt-1 text-white text-xs font-bold">
              <span className="truncate pr-4">{activeZoomImage.title}</span>
              <button 
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img 
              src={activeZoomImage.url} 
              alt={activeZoomImage.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
