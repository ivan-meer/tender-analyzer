import React, { useState } from 'react';
import { Copy, Check, FileCheck2, Send, Mail, Building, AlertTriangle, Sparkles } from 'lucide-react';
import { GeneratedTemplates } from '../types';

interface TemplatesSectionProps {
  templates: GeneratedTemplates;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ templates }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof GeneratedTemplates>('acceptanceDocsRequest');

  const handleCopy = (key: keyof GeneratedTemplates, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const templateConfig: { key: keyof GeneratedTemplates; title: string; icon: any; description: string }[] = [
    {
      key: 'acceptanceDocsRequest',
      title: 'Запрос закрывающих документов с печатью',
      icon: FileCheck2,
      description: 'Письмо Заказчику с просьбой выслать подписанный скан накладной/акта с датой приемки'
    },
    {
      key: 'motivatedRefusalDemand',
      title: 'Требование мотивированного отказа',
      icon: AlertTriangle,
      description: 'Официальное письмо при устном отказе Заказчика принимать товар по ТЗ'
    },
    {
      key: 'etpFundsRequest',
      title: 'Запрос тендерному на ЭТП / Аккредитацию',
      icon: Send,
      description: 'Сообщение в ЛС тендерному специалисту по платной закупке или зачислению средств'
    },
    {
      key: 'accountingDataRequest',
      title: 'Запрос документов в Бухгалтерию',
      icon: Building,
      description: 'Запрос стоимости активов, баланса за отчетный период и ССЧ для заявки'
    },
    {
      key: 'yougileTaskSummary',
      title: 'Карточка задачи в YouGile (Юджайл)',
      icon: Sparkles,
      description: 'Готовый шаблон текста задачи для ведения закупки в Юджайле'
    },
    {
      key: 'claimResponseTemplate',
      title: 'Шаблон ответа на претензию Заказчика',
      icon: Mail,
      description: 'Официальный ответ при поступлении замечаний или претензии от Заказчика'
    },
  ];

  const currentTemplate = templates[activeTab] || '';

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <span>Автоматически сгенерированные шаблоны писем и документов</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Готовые юридически подкованные тексты для моментального копирования и отправки
        </p>
      </div>

      {/* Grid of Template Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {templateConfig.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 mb-2.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-[11px] leading-snug line-clamp-2">{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Template Output */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-3 gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {templateConfig.find(t => t.key === activeTab)?.title}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {templateConfig.find(t => t.key === activeTab)?.description}
            </p>
          </div>

          <button
            onClick={() => handleCopy(activeTab, currentTemplate)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Скопировано!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать в буфер</span>
              </>
            )}
          </button>
        </div>

        <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto p-4 bg-white rounded-xl border border-slate-200 shadow-2xs font-medium">
          {currentTemplate || 'Текст шаблона формируется...'}
        </pre>
      </div>
    </div>
  );
};

