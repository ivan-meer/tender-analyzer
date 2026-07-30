import React from 'react';
import { X, BookOpen, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 rounded-t-3xl">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                Регламент работы по 223-ФЗ и подготовки заявок
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Официальная инструкция тендерного отдела компании
              </p>
            </div>
          </div>
          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Закрыть памятку"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Главное правило 223-ФЗ: Штрафы и пени НЕ СПИСЫВАЮТСЯ!</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Начисленные штрафы и пени по 223-ФЗ либо оплачиваются Поставщиком, либо удерживаются из оплаты по контракту. Поэтому каждый проект договора просматривается от «А» до «Я» на предмет кабальных условий.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              1. Организация работы по 223-ФЗ
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <li><strong className="text-slate-900 dark:text-white font-bold">Проект договора:</strong> Обязательно читаем от «от» и «до» перед расчетом.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Сроки и условия поставки:</strong> Особое внимание к условиям «по заявке Заказчика» (уведомление не менее чем за 5 рабочих дней).</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Раздел ответственность:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                  <li>Закупка у 3-х лиц за счет Поставщика при недопоставке/браке;</li>
                  <li>Возмещение разницы в цене при покупке у других лиц после расторжения;</li>
                  <li>Односторонний отказ при задержке более 5 рабочих дней;</li>
                  <li>Расторжение договора при просрочке свыше 10 календарных дней;</li>
                  <li><strong className="text-red-700 dark:text-red-400 font-bold">Штраф 3% от стоимости товара</strong> за нарушения упаковки, маркировки, качества, сроков или конфиденциальности.</li>
                </ul>
              </li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Первичка до поставки:</strong> Уточнить вид первичных документов (УПД, ТОРГ-12, Акт) и зафиксировать в Юджайл.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Сопровождающие документы:</strong> Сертификаты и декларации передаются строго вместе с товаром.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Документы о приемке:</strong> Требуем от заказчика документы о приемке с подписями, печатями и ДАТАМИ приемки. Обязательно грузим сканы в Юджайл.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Мотивированный отказ:</strong> Если товар полностью соответствует ТЗ, а заказчик отказывается принимать — ТРЕБУЕМ письменный аргументированный мотивированный отказ. Никаких отказов на словах!</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              2. Правила подготовки заявок на подачу
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              <li><strong className="text-slate-900 dark:text-white font-bold">Таблица запросов:</strong> Обязательно направляем запрос по участию в таблицу запросов.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Оплата/Аккредитация:</strong> Если закупка платная или нужна аккредитация — пишем в ЛС тендерному специалисту с просьбой закинуть денег на ЭТП или получить аккредитацию.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Формы заявки:</strong> Менеджер заполняет ВСЕ рекомендуемые организатором формы, <em className="text-slate-900 dark:text-white font-bold">кроме описи вложений</em>. Если форм нет — свободная форма.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Запрос котировок:</strong> Заявка в одном файле с разбивкой по листам разных разделов.</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Аукцион:</strong> Как минимум 2 файла (1 – технические характеристики, 2 – информация об участнике).</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">ПП РФ № 1875 (Запрет/Ограничение):</strong> Обязательно указываем реестровые номера и количество баллов по каждой позиции (для РФ).</li>
              <li><strong className="text-slate-900 dark:text-white font-bold">Бухгалтерские данные:</strong> Если требуется стоимость активов, баланс или ССЧ — предупреждаем тендерного специалиста заранее.</li>
            </ul>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 rounded-b-3xl flex justify-end">
          <button
            id="close-guide-bottom-btn"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

