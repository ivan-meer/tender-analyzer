import React from 'react';
import { CheckSquare, AlertCircle, FileSpreadsheet, Building2, CreditCard, ShieldCheck } from 'lucide-react';
import { SubmissionRulesCheck } from '../types';

interface SubmissionChecklistProps {
  check: SubmissionRulesCheck;
}

export const SubmissionChecklist: React.FC<SubmissionChecklistProps> = ({ check }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 transition-colors duration-200">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span>Правила подготовки и подачи заявки</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Контрольный чек-лист подготовки документов менеджеру и тендерному специалисту
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300">
          {check.procedureType === '223_FZ_AUCTION'
            ? 'Электронный Аукцион'
            : check.procedureType === '223_FZ_QUOTATION'
            ? 'Запрос Котировок'
            : 'Закупка'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1: Request Table & ETP */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b border-slate-200/80 pb-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">1</div>
            <span>Запрос участия и ЭТП</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium">
                <strong className="text-slate-900 font-bold">Таблица запросов:</strong> Направить запрос по участию в общую таблицу запросов.
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-3 rounded-xl text-slate-700 flex items-start gap-2 shadow-2xs">
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div className="font-medium">
                <strong className="text-slate-900 font-bold">ЭТП / Аккредитация:</strong> {check.etpAccreditationNotice || 'Если закупка платная или нужна аккредитация — обязательно написать в ЛС тендерному специалисту с ссылкой и указанием компании!'}
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: File Structure & Forms */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b border-slate-200/80 pb-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">2</div>
            <span>Структура файлов и формы заявки</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-bold">Состав файлов для подачи:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                  {check.requiredFilesStructure && check.requiredFilesStructure.length > 0 ? (
                    check.requiredFilesStructure.map((file, idx) => (
                      <li key={idx} className="text-slate-800 font-bold">{file}</li>
                    ))
                  ) : (
                    <li>Для аукциона: 2 файла (1-тех. характеристики, 2-информация об участнике). Для котировок: 1 файл с разбивкой по листам.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs font-medium">
              <strong className="text-slate-900 font-bold">Формы организатора:</strong> Менеджер заполняет ВСЕ рекомендуемые формы к подаче, <u className="decoration-indigo-500">КРОМЕ описи вложений</u>.
              <p className="text-[11px] text-slate-500 mt-1">{check.formsRequirement}</p>
            </div>
          </div>
        </div>

        {/* Step 3: PP RF 1875 National Regime */}
        <div className={`border rounded-2xl p-5 space-y-3 shadow-2xs ${check.pp1875Applies ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b border-slate-200/80 pb-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">3</div>
            <span>Национальный режим (ПП РФ № 1875)</span>
          </div>

          <div className="space-y-2 text-xs">
            {check.pp1875Applies ? (
              <div className="space-y-2">
                <span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px] border border-amber-200">
                  ПП РФ № 1875 Применяется!
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  Обязательно указывать <strong className="text-slate-900 font-bold">реестровые номера</strong> и <strong className="text-slate-900 font-bold">количество баллов</strong> по каждой российской позиции в заявке.
                </p>
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs font-medium">
                  {check.pp1875Details}
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-medium">
                Запрет/ограничение по ПП РФ № 1875 не выявлено в явном виде. Перепроверить ТЗ.
              </p>
            )}
          </div>
        </div>

        {/* Step 4: Accounting & Financial Info */}
        <div className={`border rounded-2xl p-5 space-y-3 shadow-2xs ${check.accountingInfoNeeded ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 border-b border-slate-200/80 pb-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">4</div>
            <span>Запрос данных в Бухгалтерию</span>
          </div>

          <div className="space-y-2 text-xs">
            {check.accountingInfoNeeded ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-red-700 font-bold">
                  <Building2 className="w-4 h-4 text-red-600" />
                  <span>Требуются данные бухгалтерии! Заранее предупредить тендерного!</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium">
                  {check.accountingItems && check.accountingItems.length > 0 ? (
                    check.accountingItems.map((item, i) => (
                      <li key={i} className="font-bold text-slate-900">{item}</li>
                    ))
                  ) : (
                    <>
                      <li>Стоимость активов компании</li>
                      <li>Баланс за последний отчетный период</li>
                      <li>Среднесписочная численность (ССЧ)</li>
                    </>
                  )}
                </ul>
              </div>
            ) : (
              <p className="text-slate-500 font-medium">
                Специальных требований к финансовой отчётности в описании не зафиксировано.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

