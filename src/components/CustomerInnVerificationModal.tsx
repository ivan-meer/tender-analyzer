import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Scale, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  FileText, 
  Clock, 
  ExternalLink,
  Award
} from 'lucide-react';
import { CustomerVerificationReport } from '../types';
import { verifyCustomerByInn } from '../utils/innVerification';

interface CustomerInnVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInn?: string;
  initialCustomerName?: string;
}

export const CustomerInnVerificationModal: React.FC<CustomerInnVerificationModalProps> = ({
  isOpen,
  onClose,
  initialInn = '',
  initialCustomerName = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialInn || initialCustomerName);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<CustomerVerificationReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      const query = initialInn || initialCustomerName || '7707083893';
      setSearchQuery(query);
      runCheck(query, initialCustomerName);
    }
  }, [isOpen, initialInn, initialCustomerName]);

  if (!isOpen) return null;

  const runCheck = async (query: string, nameFallback?: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const result = await verifyCustomerByInn(query, nameFallback);
      setReport(result);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCheck(searchQuery);
  };

  const getReliabilityBadge = (level: string) => {
    switch (level) {
      case 'HIGH':
        return (
          <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            ВЫСОКАЯ НАДЕЖНОСТЬ
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            СРЕДНИЙ УРОВЕНЬ
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-rose-600 text-white text-xs font-black rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-4 h-4" />
            ВЫСОКИЙ РИСК / ВНИМАНИЕ
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <Building2 className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Проверка добросовестности заказчика по ИНН</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  ФНС • ЕИС • РНП
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">Экспертный аудит арбитражных дел, задержек выплат и кредитного риска</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Quick Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите ИНН заказчика (10 или 12 цифр) или наименование..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Проверка...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Проверить ИНН</span>
                </>
              )}
            </button>
          </form>

          {/* Verification Results */}
          {report && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Summary Card with Reliability Index Meter */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {report.customerName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono font-bold mt-1">
                      <span>ИНН: {report.inn}</span>
                      {report.ogrn && <span>ОГРН: {report.ogrn}</span>}
                      {report.kpp && <span>КПП: {report.kpp}</span>}
                    </div>
                  </div>

                  <div>{getReliabilityBadge(report.reliabilityLevel)}</div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-slate-700 dark:text-slate-300">Индекс финансовой надежности и платежеспособности:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm">
                      {report.reliabilityScore} / 100 баллов
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${report.reliabilityScore}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        report.reliabilityScore >= 85
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : report.reliabilityScore >= 65
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-rose-600 to-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Status & Address details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Статус ЕГРЮЛ</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {report.statusText}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Реестр недобросовестных поставщиков (РНП)</span>
                    <span className={`font-bold flex items-center gap-1 mt-0.5 ${report.rnpStatus ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {report.rnpStatus ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      {report.rnpStatus ? 'ВКЛЮЧЕН В РНП!' : 'Записи в РНП отсутствуют'}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 sm:col-span-2 lg:col-span-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Задолженности по налогам ФНС</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                      {report.fnsTaxDebts}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Registry Detail Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                {/* Card 1: Arbitration */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      Арбитражные дела
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md">
                      {report.arbitrationSummary.totalCases} исков
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                    <div className="flex justify-between">
                      <span>В качестве ответчика:</span>
                      <span className="font-bold text-rose-600">{report.arbitrationSummary.asDefendantCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>В качестве истца:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{report.arbitrationSummary.asPlaintiffCount}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1">
                      <span>Сумма претензий:</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{report.arbitrationSummary.claimsSum}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: FSSP Executions */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      Исполнительные производства
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md">
                      {report.fsspSummary.activeExecutionsCount} открыто
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                    <div className="flex justify-between">
                      <span>Активных производств:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{report.fsspSummary.activeExecutionsCount}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-1">
                      <span>Сумма взыскания ФССП:</span>
                      <span className="font-bold font-mono text-amber-600 dark:text-amber-400">{report.fsspSummary.totalDebtSum}</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Payment Delay History */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Оплата контрактов
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                      {report.paymentDelayStats.onTimePaymentRatePct}% вовремя
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                    <div className="flex justify-between">
                      <span>Ср. задержка оплаты:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{report.paymentDelayStats.avgDelayDays} дн.</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight border-t border-slate-100 dark:border-slate-700 pt-1">
                      {report.paymentDelayStats.delayRiskNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Factors List */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Выявленные индикаторы надежности и рисков:
                </span>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                  {report.riskMarkers.map((marker, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      {marker}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 p-4 rounded-2xl space-y-1 text-xs">
                <span className="font-extrabold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Итоговая рекомендация участнику закупки:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {report.recommendation}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
