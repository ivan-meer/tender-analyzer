import React, { useState } from 'react';
import {
  X,
  Scale,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertTriangle,
  FileText,
  Send,
  Building2,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface FasComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult?: AnalysisResult | null;
}

interface FasComplaintResponse {
  documentType: string;
  title: string;
  targetAuthority: string;
  legalBasisArticles: string[];
  demandsSummary: string[];
  fullDocumentText: string;
}

const VIOLATION_PRESETS = [
  {
    id: 'MONOPOLY_BRAND',
    type: 'FAS_RESTRICTION',
    title: 'Заточка под конкретного производителя',
    description: 'Указаны товарные знаки или уникальные габариты без слов «или эквивалент» (нарушение п. 1 ч. 1 ст. 33 44-ФЗ)',
    icon: ShieldAlert,
    defaultText: 'Заказчик установил совокупность нестандартных характеристик товара (габариты с точностью до миллиметра, уникальные патентованные артикулы), которым соответствует продукция исключительно одного бренда, без возможности поставки эквивалента.'
  },
  {
    id: 'ILLEGAL_DOCS',
    type: 'FAS_UNLAWFUL_REQUIREMENT',
    title: 'Избыточные требования к документам в заявке',
    description: 'Требование протоколов заводских испытаний, ГОСТ-паспортов или СТ-1 на этапе подачи заявки',
    icon: AlertTriangle,
    defaultText: 'Заказчик неправомерно требует предоставить в составе первой/второй части заявки действующие протоколы испытаний, дилерские сертификаты или копии паспортов качества производителя, что нарушает запрет на истребование документов, отсутствующих в открытом доступе до поставки товара.'
  },
  {
    id: 'IMPOSSIBLE_DEADLINE',
    type: 'FAS_ILLEGAL_DEADLINE',
    title: 'Нереалистичный / Заниженный срок поставки',
    description: 'Срок поставки 1–3 календарных дня для заказной продукции (заведомое ограничение конкуренции)',
    icon: AlertTriangle,
    defaultText: 'Срок поставки сложной заказной продукции установлен в 2 рабочих дня с момента заключения контракта, что физически невозможно для добросовестных участников и свидетельствует о предварительном сговоре Заказчика с единственным аффилированным поставщиком.'
  },
  {
    id: 'CLARIFICATION_SPECS',
    type: 'CLARIFICATION_REQUEST',
    title: 'Запрос на разъяснение положений ТЗ / Контракта',
    description: 'Официальный запрос заказчику на уточнение противоречий до подачи жалобы в ФАС',
    icon: HelpCircle,
    defaultText: 'В техническом задании обнаружены взаимоисключающие требования к материалам (в спецификации указан металлокаркас, а в описании — массив дерева). Просим дать официальное разъяснение и внести изменения в извещение.'
  }
];

export const FasComplaintModal: React.FC<FasComplaintModalProps> = ({
  isOpen,
  onClose,
  analysisResult
}) => {
  const [complaintType, setComplaintType] = useState<string>('FAS_RESTRICTION');
  const [procurementNumber, setProcurementNumber] = useState<string>(() => {
    return analysisResult?.summary?.procurementTitle?.match(/\d{11,19}/)?.[0] || '0373200002824000001';
  });
  const [procurementTitle, setProcurementTitle] = useState<string>(() => {
    return analysisResult?.summary?.procurementTitle || 'Поставка компьютерного оборудования и офисной мебели';
  });
  const [customerName, setCustomerName] = useState<string>(() => {
    return analysisResult?.summary?.customerName || 'ГБУ «Служба Единого Заказчика»';
  });
  const [customerInn, setCustomerInn] = useState<string>(() => {
    return analysisResult?.summary?.customerInn || '7701234567';
  });
  const [violationDetails, setViolationDetails] = useState<string>(
    'Заказчик объединил в один лот поставку мебели и лицензионного ПО, а также установил требование об обязательном наличии дилерского сертификата на этапе подачи заявки.'
  );

  const [petitionerName, setPetitionerName] = useState('ООО «Тендерный Партнер»');
  const [petitionerInn, setPetitionerInn] = useState('7701987654');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<FasComplaintResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof VIOLATION_PRESETS[0]) => {
    setComplaintType(preset.type);
    setViolationDetails(preset.defaultText);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/procurement/generate-fas-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintType,
          procurementNumber,
          procurementTitle,
          customerName,
          customerInn,
          lawType: '44_FZ',
          violationDetails,
          petitionerName,
          petitionerInn,
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации документа');
      }

      const resData = await response.json();
      setGeneratedResult(resData.data);
    } catch (err: any) {
      console.error('FAS Generate error:', err);
      alert('Ошибка при составлении жалобы: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = () => {
    if (generatedResult?.fullDocumentText) {
      navigator.clipboard.writeText(generatedResult.fullDocumentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!generatedResult?.fullDocumentText) return;
    const element = document.createElement('a');
    const file = new Blob([generatedResult.fullDocumentText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Жалоба_ФАС_${procurementNumber || 'Закупка'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="fas-complaint-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Генератор жалоб в ФАС РФ и Запросов на разъяснение
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300">
                  ст. 105 44-ФЗ / ст. 18.1 135-ФЗ
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Защита прав поставщика при заточке ТЗ, ограничении конкуренции и неправомерных требованиях
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Violation Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
              Типовые основания для жалобы или запроса:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {VIOLATION_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = violationDetails === preset.defaultText;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200 ring-2 ring-red-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="font-bold text-xs line-clamp-1">{preset.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Реестровый номер закупки:
              </label>
              <input
                type="text"
                value={procurementNumber}
                onChange={(e) => setProcurementNumber(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Заказчик (Наименование):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ИНН Заказчика:
              </label>
              <input
                type="text"
                value={customerInn}
                onChange={(e) => setCustomerInn(e.target.value)}
                className="w-full text-xs font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Violation Details & Demands Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Суть нарушения / цитата спорного пункта ТЗ:</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ИИ автоматически подберет судебную практику и нормы законов
              </span>
            </label>
            <textarea
              rows={3}
              value={violationDetails}
              onChange={(e) => setViolationDetails(e.target.value)}
              placeholder="Опишите, в чем именно Заказчик нарушил закон (завышенные требования, заточка ТЗ, отказ от эквивалентов, нереалистичные сроки)..."
              className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isLoading || !violationDetails.trim()}
              onClick={handleGenerate}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md hover:shadow-red-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Составление жалобы юристом ИИ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Сформировать документ для ФАС РФ</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Output */}
          {generatedResult && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/60 dark:bg-red-950/30 p-4 rounded-2xl border border-red-200 dark:border-red-800">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
                    {generatedResult.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-red-700 dark:text-red-300">
                    <span>Орган: <strong>{generatedResult.targetAuthority}</strong></span>
                    <span>•</span>
                    <span>Нормы: <strong>{generatedResult.legalBasisArticles.join(', ')}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Скачать .TXT</span>
                  </button>
                </div>
              </div>

              {/* Full Text Preview Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  Полный текст процессуального документа:
                </label>
                <textarea
                  readOnly
                  rows={14}
                  value={generatedResult.fullDocumentText}
                  className="w-full text-xs font-mono p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed outline-none resize-none shadow-inner"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>Срок подачи жалобы на положения документации: до окончания срока подачи заявок (ч. 2 ст. 105 44-ФЗ).</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
