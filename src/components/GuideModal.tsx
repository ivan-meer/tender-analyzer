import React from 'react';
import { X, BookOpen, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-slate-800">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Регламент работы по 223-ФЗ и подготовки заявок</h2>
              <p className="text-xs text-slate-500 font-medium">Официальная инструкция тендерного отдела компании</p>
            </div>
          </div>
          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-700">
          <section className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Главное правило 223-ФЗ: Штрафы и пени НЕ СПИСЫВАЮТСЯ!</span>
            </div>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Начисленные штрафы и пени по 223-ФЗ либо оплачиваются Поставщиком, либо удерживаются из оплаты по контракту. Поэтому каждый проект договора просматривается от «А» до «Я» на предмет кабальных условий.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
              1. Организация работы по 223-ФЗ
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <li><strong className="text-slate-900 font-bold">Проект договора:</strong> Обязательно читаем от «от» и «до» перед расчетом.</li>
              <li><strong className="text-slate-900 font-bold">Сроки и условия поставки:</strong> Особое внимание к условиям «по заявке Заказчика» (уведомление не менее чем за 5 рабочих дней).</li>
              <li><strong className="text-slate-900 font-bold">Раздел ответственность:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1 text-slate-600">
                  <li>Закупка у 3-х лиц за счет Поставщика при недопоставке/браке;</li>
                  <li>Возмещение разницы в цене при покупке у других лиц после расторжения;</li>
                  <li>Односторонний отказ при задержке более 5 рабочих дней;</li>
                  <li>Расторжение договора при просрочке свыше 10 календарных дней;</li>
                  <li><strong className="text-red-700 font-bold">Штраф 3% от стоимости товара</strong> за нарушения упаковки, маркировки, качества, сроков или конфиденциальности.</li>
                </ul>
              </li>
              <li><strong className="text-slate-900 font-bold">Первичка до поставки:</strong> Уточнить вид первичных документов (УПД, ТОРГ-12, Акт) и зафиксировать в Юджайл.</li>
              <li><strong className="text-slate-900 font-bold">Сопровождающие документы:</strong> Сертификаты и декларации передаются строго вместе с товаром.</li>
              <li><strong className="text-slate-900 font-bold">Документы о приемке:</strong> Требуем от заказчика документы о приемке с подписями, печатями и ДАТАМИ приемки. Обязательно грузим сканы в Юджайл.</li>
              <li><strong className="text-slate-900 font-bold">Мотивированный отказ:</strong> Если товар полностью соответствует ТЗ, а заказчик отказывается принимать — ТРЕБУЕМ письменный аргументированный мотивированный отказ. Никаких отказов на словах!</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-slate-200 pt-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              2. Правила подготовки заявок на подачу
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
              <li><strong className="text-slate-900 font-bold">Таблица запросов:</strong> Обязательно направляем запрос по участию в таблицу запросов.</li>
              <li><strong className="text-slate-900 font-bold">Оплата/Аккредитация:</strong> Если закупка платная или нужна аккредитация — пишем в ЛС тендерному специалисту с просьбой закинуть денег на ЭТП или получить аккредитацию.</li>
              <li><strong className="text-slate-900 font-bold">Формы заявки:</strong> Менеджер заполняет ВСЕ рекомендуемые организатором формы, <em className="text-slate-900 font-bold">кроме описи вложений</em>. Если форм нет — свободная форма.</li>
              <li><strong className="text-slate-900 font-bold">Запрос котировок:</strong> Заявка в одном файле с разбивкой по листам разных разделов.</li>
              <li><strong className="text-slate-900 font-bold">Аукцион:</strong> Как минимум 2 файла (1 – технические характеристики, 2 – информация об участнике).</li>
              <li><strong className="text-slate-900 font-bold">ПП РФ № 1875 (Запрет/Ограничение):</strong> Обязательно указываем реестровые номера и количество баллов по каждой позиции (для РФ).</li>
              <li><strong className="text-slate-900 font-bold">Бухгалтерские данные:</strong> Если требуется стоимость активов, баланс или ССЧ — предупреждаем тендерного специалиста заранее.</li>
            </ul>
          </section>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-3xl flex justify-end">
          <button
            id="close-guide-bottom-btn"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

