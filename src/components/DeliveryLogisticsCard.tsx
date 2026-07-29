import React, { useState } from 'react';
import { DeliveryInfo } from '../types';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  Building2, 
  ShieldAlert, 
  Check, 
  Copy, 
  Navigation, 
  HardHat, 
  AlertTriangle,
  FileCheck,
  PackageCheck
} from 'lucide-react';

interface DeliveryLogisticsCardProps {
  deliveryInfo?: DeliveryInfo;
}

export const DeliveryLogisticsCard: React.FC<DeliveryLogisticsCardProps> = ({ deliveryInfo }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  if (!deliveryInfo) {
    return null;
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const addresses = deliveryInfo.deliveryAddresses && deliveryInfo.deliveryAddresses.length > 0 
    ? deliveryInfo.deliveryAddresses 
    : ['Адрес уточняется в тексте ТЗ / Заявке Заказчика'];

  return (
    <div className="bg-white border-2 border-indigo-200 rounded-3xl shadow-sm overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-indigo-200 shrink-0 shadow-inner">
              <Truck className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  Логистический аудит
                </span>
                <span className="text-xs text-indigo-300 font-medium">• 223-ФЗ / ТЗ</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Сроки Поставки и Адреса Назначения
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-indigo-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Адресов поставки: {addresses.length}</span>
            </div>
            {deliveryInfo.deliveryScheduleNotice && (
              <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>По заявкам Заказчика</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Content Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Main 2-Column Highlight: Deadlines vs Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Сроки поставки и порядок (5 cols on lg) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Calendar className="w-4 h-4" />
              </div>
              <span>1. Сроки и Порядок Поставки</span>
            </div>

            {/* Primary Delivery Period Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-indigo-100/50 rounded-full blur-lg pointer-events-none"></div>
              <div className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Ключевой срок исполнения:
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                {deliveryInfo.deliveryPeriod || 'Срок поставки не определен явно в тексте'}
              </p>
            </div>

            {/* Schedule Notice if present */}
            {deliveryInfo.deliveryScheduleNotice && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-extrabold text-amber-900 block">Порядок графика заявок:</span>
                  <p className="text-amber-800 font-medium leading-relaxed">
                    {deliveryInfo.deliveryScheduleNotice}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Адреса и геолокация объектов (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <span>2. Адреса и Пункты Назначения ({addresses.length})</span>
            </div>

            <div className="space-y-2.5">
              {addresses.map((addr, idx) => (
                <div 
                  key={idx} 
                  className="group bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-2xl p-3.5 transition-all flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md">
                          Пункт №{idx + 1}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {addr.includes('склад') ? 'Складской комплекс' : 'Адрес объекта'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {addr}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAddress(addr)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer shrink-0"
                    title="Скопировать точный адрес"
                  >
                    {copiedAddress === addr ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Info Grid: Unloading, Consignee & Risk Caution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
          
          {/* Unloading & Access Conditions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <HardHat className="w-4 h-4 text-amber-600" />
              <span>Разгрузка и пропускной режим</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {deliveryInfo.unloadingAndAccessConditions || 'Силами Поставщика до склада Заказчика. Требуется оформление пропусков на АТС.'}
            </p>
          </div>

          {/* Consignee Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Грузополучатель</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {deliveryInfo.consigneeDetails || 'Заказчик по договору (или указанный в заявке представитель Покупателя)'}
            </p>
          </div>

          {/* Risk Warning Notice */}
          <div className="bg-red-50/80 border border-red-200 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-900">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Предупреждение о просрочке</span>
            </div>
            <p className="text-[11px] text-red-800 font-medium leading-tight">
              {deliveryInfo.riskWarning || 'Просрочка свыше 5 дней дает Заказчику право одностороннего расторжения и удержания штрафа 3%.'}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
