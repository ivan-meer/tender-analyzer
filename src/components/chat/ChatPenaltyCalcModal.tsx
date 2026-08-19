import React from 'react';
import { Calculator, X } from 'lucide-react';

interface ChatPenaltyCalcModalProps {
  isOpen: boolean;
  onClose: () => void;
  penaltyContractAmount: string;
  setPenaltyContractAmount: (val: string) => void;
  penaltyDays: string;
  setPenaltyDays: (val: string) => void;
  penaltyKeyRate: string;
  setPenaltyKeyRate: (val: string) => void;
  onInsertToChat: (promptText: string) => void;
}

export const ChatPenaltyCalcModal: React.FC<ChatPenaltyCalcModalProps> = ({
  isOpen,
  onClose,
  penaltyContractAmount,
  setPenaltyContractAmount,
  penaltyDays,
  setPenaltyDays,
  penaltyKeyRate,
  setPenaltyKeyRate,
  onInsertToChat,
}) => {
  if (!isOpen) return null;

  const amount = parseFloat(penaltyContractAmount) || 0;
  const days = parseFloat(penaltyDays) || 0;
  const rate = parseFloat(penaltyKeyRate) || 0;
  const dailyRate = (rate / 100) / 300;
  const totalPenalty = amount * dailyRate * days;
  const maxPenalty3Pct = amount * 0.03;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl text-white space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Калькулятор пеней по 223-ФЗ</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Сумма контракта / просрочки (₽):</label>
            <input 
              type="number"
              value={penaltyContractAmount}
              onChange={(e) => setPenaltyContractAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Дней просрочки:</label>
              <input 
                type="number"
                value={penaltyDays}
                onChange={(e) => setPenaltyDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Ставка ЦБ (%):</label>
              <input 
                type="number"
                value={penaltyKeyRate}
                onChange={(e) => setPenaltyKeyRate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          {/* Calculation Result */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2 mt-2 font-mono">
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Ставка в день (1/300 ЦБ):</span>
              <span className="text-cyan-300 font-bold">{(dailyRate * 100).toFixed(4)}%</span>
            </div>
            <div className="flex justify-between text-slate-200 text-xs pt-1 border-t border-slate-800">
              <span>Расчетная неустойка:</span>
              <span className="text-emerald-400 font-extrabold text-sm">{totalPenalty.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[10px]">
              <span>Предел 3% от суммы контракта:</span>
              <span>{maxPenalty3Pct.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => {
              onInsertToChat(`Рассчитать и оформить обоснование неустойки по 223-ФЗ: Сумма контракта ${amount} ₽, дни просрочки ${days}, ключевая ставка ЦБ ${rate}%. Итоговая пени ${totalPenalty.toFixed(2)} ₽.`);
              onClose();
            }}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
          >
            Вставить расчет в чат
          </button>
        </div>
      </div>
    </div>
  );
};
