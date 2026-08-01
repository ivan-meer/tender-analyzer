import React, { useState } from 'react';
import { 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Scale, 
  HelpCircle, 
  Gavel,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ContractRiskItem, RiskSeverity } from '../types';

interface ContractRisksTableProps {
  risks: ContractRiskItem[];
}

interface LegalNormInfo {
  normArticle: string;
  normTitle: string;
  normExplanation: string;
  fasPractice?: string;
}

type SortField = 'severity' | 'clause' | 'title';
type SortOrder = 'asc' | 'desc';

export const ContractRisksTable: React.FC<ContractRisksTableProps> = ({ risks }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const severityWeight: Record<RiskSeverity, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    INFO: 1
  };

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredRisks = risks.filter(r => {
    const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    const matchSeverity = selectedSeverity === 'ALL' || r.severity === selectedSeverity;
    return matchCategory && matchSeverity;
  });

  const sortedRisks = [...filteredRisks].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'severity') {
      const weightA = severityWeight[a.severity] || 0;
      const weightB = severityWeight[b.severity] || 0;
      comparison = weightA - weightB;
    } else if (sortField === 'title') {
      comparison = a.title.localeCompare(b.title, 'ru');
    } else if (sortField === 'clause') {
      comparison = (a.clauseNumber || '').localeCompare(b.clauseNumber || '', 'ru', { numeric: true });
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const getSeverityBadge = (severity: RiskSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-2.5 py-0.5 rounded-full uppercase">
            <ShieldAlert className="w-3 h-3" />
            Критический риск
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full uppercase">
            <AlertTriangle className="w-3 h-3" />
            Высокий риск
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 px-2.5 py-0.5 rounded-full uppercase">
            <AlertCircle className="w-3 h-3" />
            Средний риск
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full uppercase">
            Информация
          </span>
        );
    }
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'PENALTIES': return 'Штрафы и неустойки';
      case 'DELIVERY_TERMS': return 'Сроки и условия поставки';
      case 'TERMINATION': return 'Расторжение и отказ';
      case 'THIRD_PARTY_PURCHASE': return 'Закупка у 3-х лиц / Разница цен';
      case 'DOCUMENTS': return 'Приемка и закрывашки';
      default: return 'Прочие условия';
    }
  };

  const getLegalNormInfo = (item: ContractRiskItem): LegalNormInfo => {
    switch (item.category) {
      case 'PENALTIES':
        return {
          normArticle: 'ст. 2 ч. 1 223-ФЗ, ст. 330, 333 ГК РФ',
          normTitle: 'Ограничение несоразмерной неустойки и штрафов',
          normExplanation: 'Закон 223-ФЗ требует соответствия Положению о закупке. Чрезмерная неустойка (свыше 0.1% в день) является кабальным условием и признается судом несоразмерной с возможностью снижения по ст. 333 ГК РФ.',
          fasPractice: 'Практика ФАС: Решение Московского УФАС № 077/06/106-1284/2024'
        };
      case 'DELIVERY_TERMS':
        return {
          normArticle: 'ч. 1 ст. 3 223-ФЗ, ст. 457 ГК РФ',
          normTitle: 'Принцип равноправия и разумности сроков',
          normExplanation: 'Запрет установления заведомо невыполнимых или дискриминационных сроков поставки. ФАС квалифицирует сжатые сроки без технологического обоснования как ограничение конкуренции.',
          fasPractice: 'Практика ФАС: Определение ВСРФ № 305-ЭС23-14922'
        };
      case 'TERMINATION':
        return {
          normArticle: 'ст. 450.1 ГК РФ, Положение о закупках',
          normTitle: 'Порядок одностороннего расторжения договора',
          normExplanation: 'Односторонний отказ Заказчика возможен строго при наличии условий в Положении о закупке и возмещении Поставщику фактически понесенных расходов и убытков (ст. 15 ГК РФ).',
          fasPractice: 'Постановление Пленума ВС РФ № 54'
        };
      case 'THIRD_PARTY_PURCHASE':
        return {
          normArticle: 'ч. 1 ст. 3 223-ФЗ, ст. 1102 ГК РФ',
          normTitle: 'Запрет взыскания разницы цен при закупке у третьих лиц',
          normExplanation: 'Условие о закупке товара у третьих лиц за счет Поставщика до расторжения договора признается в арбитражной практике необоснованным обогащением и кабальной сделкой.',
          fasPractice: 'Практика Арбитражного суда г. Москвы № А40-18239/2023'
        };
      case 'DOCUMENTS':
        return {
          normArticle: 'ч. 10 ст. 3.2 223-ФЗ, ПП РФ № 1875',
          normTitle: 'Сроки приемки и подписания актов/УПД',
          normExplanation: 'Заказчик обязан провести приемку и подписать закрывающие документы в течение регламентированного срока (не более 20 рабочих дней по ПП № 1875). Необоснованный затяг приемки влечет штраф Заказчику.',
          fasPractice: 'Закон 223-ФЗ ред. 2026 / ЕИС ЭДО'
        };
      default:
        return {
          normArticle: 'ст. 3 223-ФЗ (Принципы закупок)',
          normTitle: 'Общие принципы равноправия и справедливых условий',
          normExplanation: 'Заказчик не вправе предъявлять неизмеримые или избыточные требования, ограничивающие круг участников закупки.',
          fasPractice: 'Федеральный закон № 223-ФЗ'
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Реестр рисков проекта договора ({risks.length})</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Детальный аудит спорных, кабальных и повышенных условий договора по регламенту 223-ФЗ
          </p>
        </div>

        {/* Filter and Sort controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleSortToggle('severity')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                sortField === 'severity'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Сортировка по уровню риска"
            >
              <span>По риску</span>
              {sortField === 'severity' ? (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSortToggle('clause')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                sortField === 'clause'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Сортировка по пункту договора"
            >
              <span>По пункту</span>
              {sortField === 'clause' ? (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSortToggle('title')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                sortField === 'title'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Сортировка по наименованию риска"
            >
              <span>По теме</span>
              {sortField === 'title' ? (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Все категории</option>
              <option value="PENALTIES">Штрафы и неустойки</option>
              <option value="DELIVERY_TERMS">Сроки поставки</option>
              <option value="TERMINATION">Расторжение</option>
              <option value="THIRD_PARTY_PURCHASE">Покупка у 3-х лиц</option>
              <option value="DOCUMENTS">Приемка и документы</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Все уровни</option>
              <option value="CRITICAL">Критический</option>
              <option value="HIGH">Высокий</option>
              <option value="MEDIUM">Средний</option>
            </select>
          </div>
        </div>
      </div>

      {sortedRisks.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-medium">
          По выбранным фильтрам рисков не найдено.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRisks.map((item) => {
            const legalNorm = getLegalNormInfo(item);
            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-5 space-y-3 transition-all ${
                  item.severity === 'CRITICAL'
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                    : item.severity === 'HIGH'
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-300 font-extrabold bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      {item.clauseNumber || 'Пункт договора'}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Interactive Legal Norm Hover Tooltip */}
                    <div className="relative group/tooltip inline-block">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/90 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200/80 dark:border-indigo-800 px-2.5 py-1 rounded-lg cursor-help transition-all shadow-2xs">
                        <Scale className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>{legalNorm.normArticle}</span>
                        <HelpCircle className="w-3 h-3 text-indigo-400 ml-0.5" />
                      </span>

                      {/* Floating Tooltip Box */}
                      <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 w-72 sm:w-80 p-3.5 bg-slate-900 text-white text-xs rounded-2xl shadow-xl border border-slate-700 space-y-1.5 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                          <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                            <Gavel className="w-3.5 h-3.5 text-amber-400" />
                            {legalNorm.normArticle}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">223-ФЗ / ГК РФ</span>
                        </div>
                        <p className="font-bold text-white text-xs">{legalNorm.normTitle}</p>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{legalNorm.normExplanation}</p>
                        {legalNorm.fasPractice && (
                          <div className="pt-1 text-[10px] text-amber-300 font-mono border-t border-slate-800 flex items-center gap-1">
                            <span>⚖️ {legalNorm.fasPractice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {getCategoryTitle(item.category)}
                    </span>
                    {getSeverityBadge(item.severity)}
                  </div>
                </div>

                {/* Quote from contract */}
                {item.clauseQuote && (
                  <div className="bg-white dark:bg-slate-900/90 border-l-4 border-indigo-500 pl-3.5 py-2 pr-3 text-xs italic text-slate-700 dark:text-slate-300 font-serif rounded-r-xl border-y border-r border-slate-200 dark:border-slate-800 shadow-2xs">
                    «{item.clauseQuote}»
                  </div>
                )}

                {/* Explanation & Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl space-y-1 shadow-2xs">
                    <div className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Правовые и финансовые риски:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{item.explanation}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl space-y-1 shadow-2xs">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Рекомендация и защитные шаги:</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{item.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};



