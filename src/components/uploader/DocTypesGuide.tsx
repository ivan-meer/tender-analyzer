import React, { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

interface DocTypesGuideProps {
  lawType: '44_FZ' | '223_FZ' | 'COMMERCIAL' | string;
}

export const DocTypesGuide: React.FC<DocTypesGuideProps> = ({ lawType }) => {
  const [showDocTypesGuide, setShowDocTypesGuide] = useState(false);

  return (
    <div 
      id="doc-types-guide-container"
      className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-2xl p-3 sm:p-3.5 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            Специфика видов документов и форматов ({lawType === '44_FZ' ? '44-ФЗ Госзакупки' : lawType === '223_FZ' ? '223-ФЗ Госкорпорации' : 'Коммерческие B2B тендеры'})
          </span>
        </div>
        <button
          id="toggle-doc-types-guide-btn"
          type="button"
          onClick={() => setShowDocTypesGuide(!showDocTypesGuide)}
          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>{showDocTypesGuide ? 'Скрыть справку' : 'Подробнее о форматах'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDocTypesGuide ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showDocTypesGuide && (
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 animate-fade-in">
          {lawType === '44_FZ' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  🏛️ Обязательный состав пакета 44-ФЗ:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                  <li><strong>Проект госконтракта (ПГК)</strong> — строгие условия по ПП №1042 (штрафы) и ПП №783 (списание неустоек), электронное актирование.</li>
                  <li><strong>Описание объекта закупки (ООЗ / ТЗ)</strong> — ст. 33 44-ФЗ, обязательное использование каталога КТРУ и ОКПД2.</li>
                  <li><strong>Обоснование НМЦК</strong> — расчет методом сопоставимых рыночных цен (не менее 3 КП) или сметный расчет.</li>
                  <li><strong>Национальный режим</strong> — выписки ГИСП/РЭП, запреты/ограничения (ПП №1875, №616, №878).</li>
                </ul>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  📁 Поддерживаемые форматы:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Файлы <strong>.docx, .xlsx, .pdf, .xml (структурированный пакет из ЕИС), .zip/.rar</strong>. Система автоматически распознает реестровые номера, КТРУ и выписки из реестров Минпромторга.
                </p>
              </div>
            </div>
          )}

          {lawType === '223_FZ' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  🏢 Специфика пакета по 223-ФЗ:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                  <li><strong>Положение о закупке</strong> — индивидуальные правила заказчика, критерии отбора и скрытые основания отклонения.</li>
                  <li><strong>Формы заявок (Формы 1–5)</strong> — шаблоны согласия, оферты, технического и ценового предложений.</li>
                  <li><strong>Квалификационные требования</strong> — опыт, персонал, материальные ресурсы и подтверждающие акты.</li>
                  <li><strong>Обеспечение и штрафы</strong> — заказчик может устанавливать несимметричные пени и удержания.</li>
                </ul>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  📁 Поддерживаемые форматы:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Многостраничные регламенты в <strong>.docx / .pdf</strong>, таблицы форм заявок и смет в <strong>.xlsx / .xls</strong>, многотомные архивы <strong>.zip / .7z</strong>.
                </p>
              </div>
            </div>
          )}

          {lawType === 'COMMERCIAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  💼 Коммерческие B2B тендеры:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-300">
                  <li><strong>Рамочные соглашения и SLA</strong> — штрафы за задержки, отсрочки платежа до 90-120 дней, условия одностороннего отказа.</li>
                  <li><strong>RFP/RFQ таблицы</strong> — формы предоставления цен, скидок от объема и калькуляции себестоимости.</li>
                  <li><strong>Антикоррупционные оговорки</strong> — комплаенс, аудит поставщика, соглашения о неразглашении (NDA).</li>
                </ul>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  📁 Поддерживаемые форматы:
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Прайс-листы <strong>.xlsx</strong>, корпоративные шаблоны <strong>.docx / .pdf</strong>, коммерческие предложения и спецификации.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
