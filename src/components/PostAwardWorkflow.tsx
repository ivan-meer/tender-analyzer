import React from 'react';
import { Truck, FileCheck, Send, AlertOctagon, Mail } from 'lucide-react';
import { PostAwardWorkflow as PostAwardWorkflowType } from '../types';

interface PostAwardWorkflowProps {
  workflow: PostAwardWorkflowType;
}

export const PostAwardWorkflow: React.FC<PostAwardWorkflowProps> = ({ workflow }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
          <span>Порядок исполнения договора и работу с закрывашками (223-ФЗ)</span>
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Операционные правила поставки, приемки документов, YouGile и защиты при отказах
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Step A: Pre-delivery & Primary Docs */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-slate-800 border-b border-slate-200/80 pb-2.5">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>До поставки & Сопровождение</span>
          </div>

          <div className="space-y-2.5 text-slate-700">
            <p className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs font-medium">
              <strong className="text-slate-900 font-bold block mb-0.5">Уточнение формата первички:</strong>
              {workflow.primaryDocFormatConfirmation || 'Уточнить до поставки у Заказчика (УПД, ТОРГ-12, счета) и отписаться в Юджайл!'}
            </p>

            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <strong className="text-slate-900 font-bold block mb-1">Передать ВМЕСТЕ с товаром:</strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium">
                {workflow.accompanyingDocs && workflow.accompanyingDocs.length > 0 ? (
                  workflow.accompanyingDocs.map((doc, idx) => <li key={idx} className="text-slate-800 font-bold">{doc}</li>)
                ) : (
                  <>
                    <li>Сертификаты и декларации соответствия</li>
                    <li>Первичные документы (УПД / накладные / акты)</li>
                    <li>Паспорта изделий и инструкции</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Step B: Strict Acceptance Documents Rule */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 border-b border-emerald-200/80 pb-2.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Закрывающие документы с печатями</span>
          </div>

          <div className="space-y-2.5 text-slate-700 leading-relaxed font-medium">
            <p className="text-slate-900 font-bold">
              Максимальная работа с документами:
            </p>
            <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs font-medium">
              {workflow.acceptanceDocsStrategy || 'Требуем от Заказчика документы о приемке с подписями, печатями и ДАТАМИ приемки. Грузим сканы в Юджайл. Запрашиваем подтверждающие сканы на почту, а при молчании — требование оригиналов почтой!'}
            </p>
            <div className="text-[11px] text-emerald-800 font-extrabold bg-emerald-100/80 p-2 rounded-lg border border-emerald-200">
              ✓ Факт приемки подтверждается ТОЛЬКО наличием подписей и печатей с обеих сторон.
            </div>
          </div>
        </div>

        {/* Step C: Refusals & Claim Correspondence */}
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-red-800 border-b border-red-200/80 pb-2.5">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            <span>Отказы Заказчика & Претензии</span>
          </div>

          <div className="space-y-2.5 text-slate-700">
            <div className="bg-white p-3 rounded-xl border border-red-200 shadow-2xs">
              <strong className="text-red-700 font-bold block mb-1">При отказе от приемки:</strong>
              <span className="text-xs text-slate-700 font-medium">
                {workflow.motivatedRefusalGuide || 'Если доставлен качественный товар по ТЗ, а заказчик отказывается принимать — ТРЕБУЕМ письменный мотивированный отказ. Отказы на словах НЕ ПРИНИМАЕМ!'}
              </span>
            </div>

            <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1 font-medium">
              <strong className="text-amber-800 font-bold block">Официальная переписка:</strong>
              <p className="text-slate-600">
                Вся претензионная переписка строго с официальной почты, логируется в Юджайл. При получении претензии ответ готовится без задержек!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

