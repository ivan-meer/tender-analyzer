import React, { useState, useMemo } from 'react';
import {
  X,
  Calculator,
  Percent,
  Coins,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

interface BankGuaranteeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNmck?: number;
  isSmpOnly?: boolean;
}

export const BankGuaranteeCalculatorModal: React.FC<BankGuaranteeCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialNmck = 4250000,
  isSmpOnly = true
}) => {
  const [nmck, setNmck] = useState<number>(initialNmck || 4250000);
  const [bidPrice, setBidPrice] = useState<number>(initialNmck ? Math.round(initialNmck * 0.85) : 3612500);
  
  // Percentages
  const [bidSecurityPercent, setBidSecurityPercent] = useState<number>(1.0); // Обеспечение заявки
  const [contractSecurityPercent, setContractSecurityPercent] = useState<number>(5.0); // Обеспечение контракта
  const [warrantySecurityPercent, setWarrantySecurityPercent] = useState<number>(0.0); // Гарантийные обязательства
  const [advancePercent, setAdvancePercent] = useState<number>(0.0); // Аванс

  // Bank guarantee terms
  const [bgRateAnnual, setBgRateAnnual] = useState<number>(2.5); // % годовых
  const [bgDurationMonths, setBgDurationMonths] = useState<number>(6); // Срок гарантии

  if (!isOpen) return null;

  // Calculations
  const priceDropPercent = nmck > 0 ? Math.max(0, ((nmck - bidPrice) / nmck) * 100) : 0;
  const isAntiDumping = priceDropPercent >= 25;

  // Base security amounts
  const bidSecurityAmount = (nmck * bidSecurityPercent) / 100;
  
  // Contract security base amount (for SMP calculated from contract price or NMCC)
  const contractBaseCalculationPrice = isSmpOnly ? bidPrice : nmck;
  let effectiveContractSecurityPercent = contractSecurityPercent;

  // If advance is higher than security, contract security must be at least advance size
  if (advancePercent > effectiveContractSecurityPercent) {
    effectiveContractSecurityPercent = advancePercent;
  }

  let contractSecurityAmount = (contractBaseCalculationPrice * effectiveContractSecurityPercent) / 100;
  let contractSecurityAntiDumpingAmount = contractSecurityAmount * 1.5;

  const finalContractSecurityRequired = isAntiDumping ? contractSecurityAntiDumpingAmount : contractSecurityAmount;
  const warrantySecurityAmount = (nmck * warrantySecurityPercent) / 100;

  const totalSecuritySum = finalContractSecurityRequired + warrantySecurityAmount;

  // Bank Guarantee Commission calculation
  // Formula: Sum * (Rate / 100) * (Months / 12), min 1500 RUB
  const bgCommission = Math.max(1500, (totalSecuritySum * (bgRateAnnual / 100) * (bgDurationMonths / 12)));

  // Opportunity cost of freezing own cash (assumed 18% key rate / deposit yield p.a.)
  const frozenCapitalLoss = totalSecuritySum * (0.18 * (bgDurationMonths / 12));

  return (
    <div id="bank-guarantee-calculator-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Калькулятор обеспечения и Банковских гарантий
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  ст. 37, 44, 96 44-ФЗ
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Точный расчет сумм обеспечений, антидемпинговых мер и стоимости независимой гарантии
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Input Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            
            {/* NMCC & Bid Price */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-500" />
                Параметры закупки и цены
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex justify-between">
                  <span>Начальная (макс.) цена контракта (НМЦК):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{nmck.toLocaleString('ru-RU')} ₽</span>
                </label>
                <input
                  type="number"
                  value={nmck}
                  onChange={(e) => setNmck(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs font-mono p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex justify-between">
                  <span>Предложенная цена победителем:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{bidPrice.toLocaleString('ru-RU')} ₽</span>
                </label>
                <input
                  type="number"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs font-mono p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Price Drop Indicator */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                isAntiDumping
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              }`}>
                <span className="flex items-center gap-1.5 font-medium">
                  <TrendingDown className="w-4 h-4" />
                  Снижение цены: <strong>{priceDropPercent.toFixed(1)}%</strong>
                </span>
                {isAntiDumping && (
                  <span className="font-bold text-[10px] bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded-md">
                    Антидемпинг (ст. 37 44-ФЗ)
                  </span>
                )}
              </div>
            </div>

            {/* Security Percentages */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-indigo-500" />
                Процентные ставки обеспечения
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Обеспечение заявки (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={bidSecurityPercent}
                    onChange={(e) => setBidSecurityPercent(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Обеспечение контракта (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={contractSecurityPercent}
                    onChange={(e) => setContractSecurityPercent(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Гарантийные обязат-ва (%):
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={warrantySecurityPercent}
                    onChange={(e) => setWarrantySecurityPercent(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Аванс по контракту (%):
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={advancePercent}
                    onChange={(e) => setAdvancePercent(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Ставка БГ (% годовых):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bgRateAnnual}
                    onChange={(e) => setBgRateAnnual(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Срок гарантии (мес.):
                  </label>
                  <input
                    type="number"
                    value={bgDurationMonths}
                    onChange={(e) => setBgDurationMonths(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Anti-Dumping Explanation if >= 25% */}
          {isAntiDumping && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Применены антидемпинговые меры (падение {priceDropPercent.toFixed(1)}% ≥ 25%)</span>
              </div>
              <p className="leading-relaxed">
                По ст. 37 Федерального закона № 44-ФЗ победитель обязан предоставить:
              </p>
              <ul className="list-disc list-inside space-y-1 font-medium pl-1">
                <li>
                  <strong>Вариант 1:</strong> Обеспечение исполнения контракта в <strong>1.5-кратном размере</strong> (составляет {contractSecurityAntiDumpingAmount.toLocaleString('ru-RU')} ₽ вместо {contractSecurityAmount.toLocaleString('ru-RU')} ₽).
                </li>
                <li>
                  <strong>Вариант 2 (для закупок ≤ 15 млн ₽):</strong> Обеспечение в стандартном размере ({contractSecurityAmount.toLocaleString('ru-RU')} ₽) + подтверждение добросовестности информацией о <strong>3 исполненных контрактах</strong> из реестра за последние 3 года без штрафов и неустоек.
                </li>
              </ul>
            </div>
          )}

          {/* Results Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Application Security */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                Обеспечение заявки ({bidSecurityPercent}%)
              </span>
              <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {bidSecurityAmount.toLocaleString('ru-RU')} ₽
              </p>
              <span className="text-[10px] text-slate-400 block">
                Блокируется на спецсчете в банке до подведения итогов
              </span>
            </div>

            {/* Card 2: Contract Security */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block uppercase">
                Обеспечение контракта {isAntiDumping ? '(1.5x Антидемпинг)' : `(${effectiveContractSecurityPercent}%)`}
              </span>
              <p className="text-xl font-bold font-mono text-indigo-900 dark:text-indigo-200">
                {finalContractSecurityRequired.toLocaleString('ru-RU')} ₽
              </p>
              <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400 block">
                Предоставляется независимой гарантией или деньгами
              </span>
            </div>

            {/* Card 3: BG Commission Cost */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase">
                Ориентир комиссии за БГ ({bgRateAnnual}% год.)
              </span>
              <p className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                ~ {Math.round(bgCommission).toLocaleString('ru-RU')} ₽
              </p>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 block">
                За срок {bgDurationMonths} мес. на сумму {totalSecuritySum.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Comparison: Bank Guarantee vs Own Cash Deposit */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              Экономическое сравнение: Независимая гарантия vs Заморозка денег
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Банковская гарантия (Рекомендуется)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Единоразовый расход: <strong>~{Math.round(bgCommission).toLocaleString('ru-RU')} ₽</strong>. Все оборотные средства ({totalSecuritySum.toLocaleString('ru-RU')} ₽) остаются в обороте компании для закупки товаров у поставщиков.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-600">
                  <Lock className="w-4 h-4" />
                  <span>Внесение денежных средств на счет Заказчика</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  Замораживается <strong>{totalSecuritySum.toLocaleString('ru-RU')} ₽</strong> на {bgDurationMonths} мес. Упущенная выгода по ставке ЦБ РФ (~18%): <strong>~{Math.round(frozenCapitalLoss).toLocaleString('ru-RU')} ₽</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>Срок действия независимой гарантии должен превышать срок исполнения контракта не менее чем на 1 месяц.</span>
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
