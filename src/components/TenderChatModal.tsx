import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, User, X, Sparkles, Copy, Check, RefreshCw, Database, Terminal, 
  Table as TableIcon, Download, AlertTriangle, ShieldCheck, Search, ChevronDown, 
  ChevronUp, Info, Building2, Ruler, ShieldAlert, LayoutGrid, Maximize2, 
  ExternalLink, Tag, Activity, CheckCircle2, Clock, Layers, Cpu, Play,
  Trash2, Image as ImageIcon, RotateCcw, Paperclip, Mic, MicOff, Volume2, VolumeX,
  Calculator, FileText, Upload, Plus, FileJson, DownloadCloud, Wrench, FileUp,
  Pencil, Camera, Save, Link, Eye, CheckCircle, MapPin, Globe, Phone, Mail
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dbService, SqlResultTable, AgentActionLog } from '../lib/dbService';
import { useSqlExecutor } from '../hooks/useSqlExecutor';
import { getUniqueProductImageUrl } from '../utils/imageMapper';
import { MermaidDiagram } from './MermaidDiagram';
import { VERIFIED_SUPPLIERS } from '../data/verifiedSuppliers';
import { TokenPriceEstimator } from './TokenPriceEstimator';
import { ChatProductDetailModal } from './chat/ChatProductDetailModal';
import { ChatPenaltyCalcModal } from './chat/ChatPenaltyCalcModal';
import { ChatSuppliersTab } from './chat/ChatSuppliersTab';
import { ChatProductsTab } from './chat/ChatProductsTab';
import { ChatDetailsTab } from './chat/ChatDetailsTab';
import { ChatToolsDropdown } from './chat/ChatToolsDropdown';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sqlQuery?: string;
  sqlTable?: SqlResultTable;
  agentLogs?: AgentActionLog[];
  executionTimeTotalMs?: number;
  attachments?: AttachedFile[];
}

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

// Human-readable labels for database columns
const COLUMN_HUMAN_NAMES: Record<string, string> = {
  label_ru: 'Характеристика',
  pct_models: '% моделей с данными',
  suppliers_with_value: 'Фабрик с данными',
  tender_advice_ru: 'Совет для ТЗ',
  model_name: 'Модель кресла',
  supplier: 'Поставщик (Фабрика)',
  supplier_name: 'Поставщик (Фабрика)',
  seat_height_top: 'Высота сиденья',
  seat_width: 'Ширина сиденья',
  seat_depth: 'Глубина сиденья',
  overall_height: 'Габаритная высота',
  match_status: 'Статус соответствия',
  score: 'Точность',
  reqs_covered: 'Покрыто ТЗ',
  price_min: 'Ориент. цена',
  issue_ru: 'Суть проблемы',
  severity: 'Критичность',
  model_key: 'Артикул модели',
  subcat: 'Категория',
  detail: 'Детали сопоставления'
};

const INITIAL_WELCOME_MESSAGE: Message = {
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
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);
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

  const handleProductPhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    updateProductPhoto(previewUrl);
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

  // Hook for executing SQL queries via dbService.ts
  const { executeSql, isExecuting: isExecutingHookSql, resetSqlState } = useSqlExecutor();

  // Live Agent Progress steps during request processing
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
    setMessages([]); // Clears messages completely!
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
      alert('Голосовой ввод не поддерживается данным браузером.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const toggleSpeechSynthesis = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Озвучивание текста не поддерживается браузером.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~\[\]]/g, '').slice(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportChat = (format: 'md' | 'json') => {
    if (messages.length === 0) return;
    
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'md') {
      mimeType = 'text/markdown';
      ext = 'md';
      content = `# История переписки ИИ-Консультанта Закупок\n_Дата экспорта: ${new Date().toLocaleString()}\n\n` +
        messages.map(m => `### ${m.role === 'user' ? '👤 Пользователь' : '🤖 ИИ-Ассистент'} (${m.timestamp})\n${m.content}\n\n${m.sqlQuery ? '```sql\n' + m.sqlQuery + '\n```\n\n' : ''}`).join('---\n\n');
    } else {
      mimeType = 'application/json';
      ext = 'json';
      content = JSON.stringify(messages, null, 2);
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tender_chat_export_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSend = async (textToSend?: string) => {
    const rawText = (textToSend || inputText).trim();
    if ((!rawText && attachedFiles.length === 0) || isLoading) return;

    const startTime = Date.now();
    
    // Construct query with attached files text if present
    let queryText = rawText;
    if (attachedFiles.length > 0) {
      const fileSummaries = attachedFiles.map(f => {
        if (f.content) {
          return `--- Файл: ${f.name} ---\n${f.content.slice(0, 3000)}`;
        }
        return `--- Файл: ${f.name} (${Math.round(f.size / 1024)} KB) ---`;
      }).join('\n\n');

      queryText = rawText 
        ? `${rawText}\n\n📌 Вложенные файлы к запросу:\n${fileSummaries}` 
        : `Проанализируй вложенные файлы ТЗ:\n${fileSummaries}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: rawText || `Загружено файлов: ${attachedFiles.length}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [...attachedFiles]
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Initial Agent Action Pipeline Steps
    const initialSteps: AgentActionLog[] = [
      {
        step: 1,
        title: "🔍 Анализ интента ТЗ и требований ГОСТ 19917-2014",
        description: `Запрос: "${queryText.slice(0, 60)}${queryText.length > 60 ? '...' : ''}"`,
        status: "in_progress",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      {
        step: 2,
        title: "⚙️ Формирование безопасного SQL-запроса (Neon DB)",
        description: "Подготовка выражения к схеме furniture...",
        status: "pending",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      {
        step: 3,
        title: "⚡ Выполнение SQL через dbService.ts в PostgreSQL",
        description: "Отправка запроса к серверному роутеру /api/furniture/execute-sql",
        status: "pending",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      },
      {
        step: 4,
        title: "🎴 Трансформация данных в интерактивные карточки, Mermaid и таблицы",
        description: "Группировка характеристик, форматирование Markdown",
        status: "pending",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ];

    setActiveAgentSteps(initialSteps);

    try {
      await new Promise(r => setTimeout(r, 200));
      initialSteps[0].status = 'completed';
      initialSteps[1].status = 'in_progress';
      setActiveAgentSteps([...initialSteps]);

      const formattedHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          context: activeAnalysisContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }

      const data = await res.json();
      
      let extractedSql = data.sqlQuery;
      if (!extractedSql) {
        const sqlMatch = data.reply?.match(/```sql\s*([\s\S]*?)\s*```/i);
        if (sqlMatch && sqlMatch[1]) {
          extractedSql = sqlMatch[1].trim();
        }
      }

      initialSteps[1].status = 'completed';
      initialSteps[1].sql = extractedSql;
      initialSteps[2].status = 'in_progress';
      setActiveAgentSteps([...initialSteps]);

      // Execute SQL through dbService.ts on client if needed
      let finalSqlTable: SqlResultTable | undefined = data.sqlTable;
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

      const assistantMessage: Message = {
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

      const errorMessage: Message = {
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

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportTableCsv = (table: SqlResultTable) => {
    if (!table.columns || !table.rows) return;
    const header = table.columns.map(c => COLUMN_HUMAN_NAMES[c] || c).join(',');
    const csvRows = table.rows.map(row => 
      table.columns.map(col => {
        let val = row[col];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        const str = String(val ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `furniture_catalog_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTableCell = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 dark:text-slate-500 italic">null</span>;
    }

    if (typeof val === 'object') {
      return (
        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-700 dark:text-indigo-300 max-w-xs block truncate" title={JSON.stringify(val, null, 2)}>
          {JSON.stringify(val)}
        </span>
      );
    }

    const str = String(val);

    if (str.toUpperCase().includes('ПОКРЫВАЕТ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('В ДОПУСКЕ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
          <Check className="w-3.5 h-3.5 text-cyan-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('ПЕРЕСЕКАЕТ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          {str}
        </span>
      );
    }

    if (str.toUpperCase().includes('НЕТ ДАННЫХ')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30">
          {str}
        </span>
      );
    }

    if (str === 'критично') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
          ⚠️ Критично
        </span>
      );
    }

    if (str === 'важно') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          Важно
        </span>
      );
    }

    return <span>{str}</span>;
  };

  /**
   * Custom Markdown renderer components for Markdown + Mermaid + Image preview
   */
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      // Check if code is Mermaid diagram
      if (
        language === 'mermaid' ||
        (!language && inline === false && /^(graph|flowchart|gantt|sequenceDiagram|erDiagram|classDiagram|stateDiagram|pie)\b/i.test(codeString.trim()))
      ) {
        return <MermaidDiagram chart={codeString} />;
      }

      if (!inline && language === 'sql') {
        return (
          <div className="my-2 bg-slate-950 text-cyan-300 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1 text-cyan-400 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                SQL Выражение (PostgreSQL)
              </span>
              <button
                onClick={() => handleCopy('code_' + Math.random(), codeString)}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Скопировать SQL</span>
              </button>
            </div>
            <code>{codeString}</code>
          </div>
        );
      }

      if (!inline) {
        return (
          <div className="my-2 bg-slate-950 text-slate-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative">
            <code>{codeString}</code>
          </div>
        );
      }

      return (
        <code className="bg-slate-100 dark:bg-slate-800/90 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700/80">
          {children}
        </code>
      );
    },
    img({ src, alt, ...props }: any) {
      if (!src) return null;
      return (
        <span className="inline-block my-2 group relative">
          <img
            src={src}
            alt={alt || 'Изображение товара'}
            referrerPolicy="no-referrer"
            onClick={() => setActiveZoomImage({ url: src, title: alt || 'Изображение товара' })}
            className="max-w-xs sm:max-w-sm max-h-60 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover cursor-zoom-in hover:opacity-95 transition-all shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
            }}
            {...props}
          />
          <span className="text-[10px] text-slate-400 block mt-1 font-sans italic">
            📷 {alt || 'Нажмите для увеличения'}
          </span>
        </span>
      );
    },
    a({ href, children, ...props }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-0.5"
          {...props}
        >
          {children}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
    },
    table({ children }: any) {
      return (
        <div className="my-3 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return (
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
          {children}
        </thead>
      );
    },
    tbody({ children }: any) {
      return (
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {children}
        </tbody>
      );
    },
    tr({ children }: any) {
      return (
        <tr className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors">
          {children}
        </tr>
      );
    },
    th({ children }: any) {
      return (
        <th className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
          {children}
        </th>
      );
    },
    td({ children }: any) {
      return (
        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-700">
          {children}
        </td>
      );
    },
    p({ children }: any) {
      return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
    },
    h1({ children }: any) {
      return <h1 className="text-base font-extrabold text-slate-900 dark:text-white my-2">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-sm font-bold text-slate-900 dark:text-white my-2">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-xs font-bold text-slate-900 dark:text-white my-1.5">{children}</h3>;
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Minimalist Header */}
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
            {/* Tools Drawer Dropdown */}
            <ChatToolsDropdown
              isOpen={showToolsDrawer}
              onToggle={() => setShowToolsDrawer(!showToolsDrawer)}
              onOpenPenaltyCalc={() => setShowPenaltyCalc(true)}
              onGenerateDisagreementTemplate={() => handleSend("Сгенерируй шаблон Протокола разногласий по закупке мебели (ГОСТ 19917-2014) с обоснованием несоответствия ТЗ")}
              onExportChat={handleExportChat}
              hasMessages={messages.length > 0}
            />

            {/* Clear Chat Button */}
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
          /* CHAT MODE VIEW (Existing Chat Interface) */
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

          {/* Empty State Screen when Messages Cleared */}
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

          {messages.map(msg => {
            const hasSql = Boolean(msg.sqlQuery || msg.sqlTable);
            const isProductTable = Boolean(
              msg.sqlTable?.columns.some(col => 
                ['model_name', 'supplier', 'product_name', 'furniture_id', 'model_key', 'subcat', 'manufacturer', 'supplier_name'].includes(col)
              )
            );
            const currentTab = activeTab[msg.id] || (msg.sqlTable ? (isProductTable ? 'cards' : 'table') : 'text');
            const isCodeVisible = Boolean(showSqlCode[msg.id]);
            const isAgentLogsVisible = Boolean(showAgentLogs[msg.id]);
            const filterQuery = (tableSearchTerm[msg.id] || '').toLowerCase();

            let filteredRows = msg.sqlTable?.rows || [];
            if (filterQuery && msg.sqlTable?.columns) {
              filteredRows = filteredRows.filter(row => 
                msg.sqlTable!.columns.some(col => 
                  String(row[col] ?? '').toLowerCase().includes(filterQuery)
                )
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[94%] rounded-2xl p-4 shadow-2xs space-y-3 relative group ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Mode switcher tabs if SQL table exists */}
                  {hasSql && msg.role === 'assistant' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'cards' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'cards'
                              ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          🎴 Карточки товаров
                          {msg.sqlTable?.rowCount !== undefined && (
                            <span className="ml-1 bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                              {msg.sqlTable.rowCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'table' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'table'
                              ? 'bg-cyan-600 text-white shadow-2xs ring-2 ring-cyan-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <TableIcon className="w-4 h-4" />
                          📊 Таблица SQL
                        </button>

                        <button
                          onClick={() => setActiveTab(prev => ({ ...prev, [msg.id]: 'text' }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentTab === 'text'
                              ? 'bg-slate-800 text-white shadow-2xs ring-2 ring-slate-600/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          💬 Текст & Схемы
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {msg.agentLogs && msg.agentLogs.length > 0 && (
                          <button
                            onClick={() => setShowAgentLogs(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Cpu className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                            <span>Шаги Агента ({msg.agentLogs.length})</span>
                            {isAgentLogsVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}

                        {msg.sqlQuery && (
                          <button
                            onClick={() => setShowSqlCode(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{isCodeVisible ? 'Скрыть SQL' : 'SQL-Код'}</span>
                            {isCodeVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Agent Action Execution Log Timeline Card */}
                  {msg.agentLogs && msg.agentLogs.length > 0 && isAgentLogsVisible && (
                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-3.5 space-y-2 border border-slate-800 animate-fade-in text-xs shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-indigo-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-amber-400" />
                          Журнал действий ИИ-Агента (dbService.ts Integration)
                        </span>
                        {msg.executionTimeTotalMs && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            Всего: {msg.executionTimeTotalMs} мс
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 pt-1">
                        {msg.agentLogs.map((log, lIdx) => (
                          <div key={lIdx} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white text-[12px]">{log.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{log.description}</p>
                              {log.sql && (
                                <div className="mt-1 font-mono text-[10px] bg-slate-900 p-1.5 rounded text-cyan-300 border border-slate-800 overflow-x-auto">
                                  {log.sql}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Markdown + Mermaid + Image Rendered Message */}
                  {(currentTab === 'text' || msg.role === 'user' || !hasSql) && (
                    <div className="text-xs sm:text-sm font-sans leading-relaxed break-words">
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                  )}

                  {/* SQL Execution Block & Interactive Table */}
                  {hasSql && msg.role === 'assistant' && (
                    <div className="space-y-3 pt-1">
                      {/* Collapsible Technical SQL Code */}
                      {msg.sqlQuery && isCodeVisible && (
                        <div className="bg-slate-950 text-indigo-200 rounded-xl p-3 text-xs font-mono border border-slate-800 overflow-x-auto relative animate-fade-in space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                            <span className="flex items-center gap-1 text-cyan-400 font-bold">
                              <Terminal className="w-3.5 h-3.5" />
                              Запрос PostgreSQL к схеме furniture (dbService.ts)
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleReExecuteSql(msg.id, msg.sqlQuery!)}
                                disabled={isExecutingManualSql === msg.id}
                                className="hover:text-emerald-300 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                                title="Перевыполнить запрос через dbService.ts"
                              >
                                <Play className="w-3 h-3" />
                                <span>{isExecutingManualSql === msg.id ? 'Запрос...' : 'Выполнить в dbService'}</span>
                              </button>
                              <button
                                onClick={() => handleCopy(msg.id + '_sql', msg.sqlQuery!)}
                                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                              >
                                {copiedId === msg.id + '_sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedId === msg.id + '_sql' ? 'Скопировано' : 'Копировать'}</span>
                              </button>
                            </div>
                          </div>
                          <code>{msg.sqlQuery}</code>
                        </div>
                      )}

                      {/* Interactive Product Cards View */}
                      {msg.sqlTable && currentTab === 'cards' && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <LayoutGrid className="w-4 h-4 text-indigo-500" />
                                Карточки товаров каталога: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{filteredRows.length}</span> из {msg.sqlTable.rowCount}
                              </span>
                              {msg.sqlTable.note && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 hidden sm:inline-block">
                                  {msg.sqlTable.note}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                                <input
                                  type="text"
                                  placeholder="Быстрый фильтр..."
                                  value={tableSearchTerm[msg.id] || ''}
                                  onChange={(e) => setTableSearchTerm(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  className="pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 sm:w-44"
                                />
                              </div>
                              <button
                                onClick={() => exportTableCsv(msg.sqlTable!)}
                                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-500" />
                                CSV
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1 scrollbar-thin">
                            {(() => {
                              const productMap = new Map<string, {
                                modelName: string;
                                supplierName: string;
                                matchStatus: string;
                                priceText: string;
                                pctModels?: string;
                                imageUrl: string;
                                specs: { label: string; value: string }[];
                                originalIndex: number;
                              }>();

                              filteredRows.forEach((row, rIdx) => {
                                const modelName = String(row.model_name || row.label_ru || row.model_key || row.product_name || row.name || `Позиция #${rIdx + 1}`);
                                const supplierName = String(row.supplier || row.supplier_name || row.suppliers_with_value || row.manufacturer || 'Фабрика РФ');
                                const groupKey = `${modelName}___${supplierName}`.toLowerCase();

                                if (!productMap.has(groupKey)) {
                                  const imgUrl = row.image_url || getUniqueProductImageUrl(modelName, supplierName, rIdx);
                                  const matchStatus = String(row.match_status || row.tender_advice_ru || row.gisp_status || '');
                                  const priceText = row.price_min ? `от ${row.price_min} ₽` : row.estimated_price ? `${row.estimated_price} ₽` : row.price_formatted || 'по запросу у фабрики';
                                  
                                  productMap.set(groupKey, {
                                    modelName,
                                    supplierName,
                                    matchStatus,
                                    priceText,
                                    pctModels: row.pct_models ? String(row.pct_models) : undefined,
                                    imageUrl: imgUrl,
                                    specs: [],
                                    originalIndex: rIdx
                                  });
                                }

                                const card = productMap.get(groupKey)!;

                                if (row.seat_height_top !== undefined && !card.specs.some(s => s.label === 'Выс. сиденья')) {
                                  card.specs.push({ label: 'Выс. сиденья', value: `${row.seat_height_top} мм` });
                                }
                                if (row.seat_width !== undefined && !card.specs.some(s => s.label === 'Ширина')) {
                                  card.specs.push({ label: 'Ширина', value: `${row.seat_width} мм` });
                                }
                                if (row.seat_depth !== undefined && !card.specs.some(s => s.label === 'Глубина')) {
                                  card.specs.push({ label: 'Глубина', value: `${row.seat_depth} мм` });
                                }
                                if (row.overall_height !== undefined && !card.specs.some(s => s.label === 'Габ. высота')) {
                                  card.specs.push({ label: 'Габ. высота', value: `${row.overall_height} мм` });
                                }
                                if (row.dimensions && !card.specs.some(s => s.label === 'Габариты')) {
                                  card.specs.push({ label: 'Габариты', value: String(row.dimensions) });
                                }
                                const paramName = row.parameter_name || row.param_name || row.characteristic || row.spec_name;
                                const paramValue = row.value || row.val || row.value_str || row.spec_val;
                                if (paramName && paramValue && !card.specs.some(s => s.label === String(paramName))) {
                                  card.specs.push({ label: String(paramName), value: String(paramValue) });
                                }
                              });

                              const aggregatedProducts = Array.from(productMap.values());

                              return aggregatedProducts.map((prod, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between space-y-3 group"
                                >
                                  <div className="space-y-2.5">
                                    <div 
                                      onClick={() => setActiveZoomImage({ url: prod.imageUrl, title: `${prod.modelName} — ${prod.supplierName}` })}
                                      className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
                                    >
                                      <img
                                        src={prod.imageUrl}
                                        alt={prod.modelName}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80';
                                        }}
                                      />
                                      {prod.matchStatus && (
                                        <div className="absolute top-2 left-2 max-w-[85%] truncate px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs">
                                          {prod.matchStatus}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 font-bold text-xs backdrop-blur-xs">
                                        <Maximize2 className="w-4 h-4" />
                                        <span>Увеличить фото</span>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between gap-1">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                          {prod.modelName}
                                        </h4>
                                        {prod.pctModels && (
                                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                                            {prod.pctModels}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                                        <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                                        <span className="truncate">{prod.supplierName}</span>
                                      </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                                        Технические характеристики ({prod.specs.length}):
                                      </span>
                                      {prod.specs.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                          {prod.specs.map((spec, specIdx) => (
                                            <div key={specIdx} className="bg-white dark:bg-slate-900/80 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                              <span className="text-[10px] text-slate-400 block truncate">{spec.label}:</span>
                                              <strong className="text-slate-800 dark:text-slate-100 truncate block">{spec.value}</strong>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 italic">
                                          Характеристики подтверждены в базе Neon PostgreSQL
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                                    <div>
                                      <span className="text-[10px] text-slate-400 block">Ориентировочно:</span>
                                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {prod.priceText}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => openProductDetail({
                                          msgId: msg.id,
                                          originalIndex: prod.originalIndex,
                                          modelName: prod.modelName,
                                          supplierName: prod.supplierName,
                                          matchStatus: prod.matchStatus,
                                          priceText: prod.priceText,
                                          imageUrl: prod.imageUrl,
                                          specs: prod.specs,
                                          rawRow: filteredRows[prod.originalIndex] || {}
                                        })}
                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 shrink-0"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Подробнее</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleCopy(`model_${pIdx}`, `${prod.modelName} (${prod.supplierName})`)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
                                        title="Скопировать названия ТХ"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Interactive Data Table View */}
                      {msg.sqlTable && currentTab === 'table' && (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                          <div className="bg-slate-100/90 dark:bg-slate-800/90 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <TableIcon className="w-4 h-4 text-cyan-500" />
                                Найдено строк: <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">{filteredRows.length}</span> из {msg.sqlTable.rowCount}
                              </span>
                              {msg.sqlTable.note && (
                                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/50 hidden sm:inline-block">
                                  {msg.sqlTable.note}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                                <input
                                  type="text"
                                  placeholder="Быстрый фильтр..."
                                  value={tableSearchTerm[msg.id] || ''}
                                  onChange={(e) => setTableSearchTerm(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                  className="pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-36 sm:w-48"
                                />
                              </div>

                              <button
                                onClick={() => exportTableCsv(msg.sqlTable!)}
                                className="px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-500" />
                                Экспорт CSV
                              </button>
                            </div>
                          </div>

                          {msg.sqlTable.error && (
                            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs border-b border-rose-500/20 font-mono flex items-center justify-between">
                              <span>⚠️ {msg.sqlTable.error}</span>
                              {msg.sqlQuery && (
                                <button
                                  onClick={() => handleReExecuteSql(msg.id, msg.sqlQuery!)}
                                  className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700"
                                >
                                  Повторить через dbService
                                </button>
                              )}
                            </div>
                          )}

                          {msg.sqlTable.columns && msg.sqlTable.columns.length > 0 && filteredRows.length > 0 ? (
                            <div className="overflow-x-auto max-h-80 scrollbar-thin">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
                                  <tr>
                                    <th className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 w-10 text-center text-slate-400">№</th>
                                    {msg.sqlTable.columns.map((col, cIdx) => (
                                      <th key={cIdx} className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                        <div className="flex flex-col">
                                          <span>{COLUMN_HUMAN_NAMES[col] || col}</span>
                                          {COLUMN_HUMAN_NAMES[col] && (
                                            <span className="text-[9px] font-mono font-normal text-slate-400 dark:text-slate-500">{col}</span>
                                          )}
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                                  {filteredRows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 transition-colors">
                                      <td className="px-3 py-2.5 text-center text-slate-400 border-r border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                                        {rIdx + 1}
                                      </td>
                                      {msg.sqlTable!.columns.map((col, cIdx) => (
                                        <td key={cIdx} className="px-3 py-2.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap text-slate-700 dark:text-slate-200">
                                          {renderTableCell(row[col])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs">
                              {filterQuery ? 'Ничего не найдено по введенному фильтру.' : 'Запрос выполнен, результатов нет (0 строк).'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Render attached files on User message if present */}
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/20">
                      {msg.attachments.map(att => (
                        <div key={att.id} className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg text-[10px] font-medium text-white/90">
                          <Paperclip className="w-3 h-3 text-cyan-200" />
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] opacity-70 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSpeechSynthesis(msg.id, msg.content)}
                          className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                          title={speakingMsgId === msg.id ? "Остановить озвучивание" : "Озвучить ответ"}
                        >
                          {speakingMsgId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{speakingMsgId === msg.id ? 'Стоп' : 'Озвучить'}</span>
                        </button>

                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                          title="Копировать ответ"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === msg.id ? 'Скопировано' : 'Копировать'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Animated Agent Progress Card while Loading */}
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
                  onClick={() => removeAttachment(file.id)}
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
            totalChars={inputText.length + attachedFiles.reduce((acc, f) => acc + (f.content?.length || f.size || 0), 0)}
            isCompact={true}
          />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
        >
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
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
            onClick={toggleVoiceRecognition}
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
