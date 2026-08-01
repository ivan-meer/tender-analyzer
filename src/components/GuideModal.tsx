import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  Scale, 
  Info,
  Check,
  Zap
} from 'lucide-react';
import { ProcedureType } from '../types';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateGuidelines?: (guidelinesText: string) => void;
  activeProcedureType?: ProcedureType;
}

// Default presets for regulations
const DEFAULT_44_FZ = `### 1. Особые требования и риски Постановления Правительства № 1042 и закона 44-ФЗ
- **Списание штрафов и пени (ПП РФ № 783):** В отличие от 223-ФЗ, по 44-ФЗ начисленные неустойки могут быть списаны Заказчиком, если совокупная сумма не превышает 5% от цены контракта, либо при исполнении контракта в условиях санкций.
- **ЕИС и ЕРУЗ:** Подача заявки допускается строго при наличии действующей регистрации в Едином реестре участников закупок (ЕРУЗ ЕИС).
- **Электронное актирование:** Подписание документов о приемке (УПД) осуществляется исключительно через личный кабинет ЕИС в течение 20 рабочих дней.
- **Независимые банковские гарантии:** Должны выдаваться строго банками из перечня Минфина и вноситься в закрытый реестр НГ в ЕИС.

### 2. Национальный режим (ПП РФ № 1875 / Запреты и Ограничения)
- Для подтверждения страны происхождения товара из РФ обязательно указывается номер реестровой записи ГИСП / РЭП Минпромторга и количество набранных баллов.
- При правиле «Второй лишний» заявка с иностранным товаром отклоняется при наличии хотя бы одной заявки с российским товаром.

### 3. Подготовка заявок по 44-ФЗ
- **Электронный аукцион:** 1-я часть содержит конкретные показатели товара (без наименования участника). 2-я часть содержит декларации соответствия, ЕГРЮЛ, решения об одобрении крупной сделки и документы нацрежима.
- **Односторонний отказ:** При просрочке поставки Заказчик размещает решение о расторжении в ЕИС, что влечет риск попадания в РНП на 2 года.`;

const DEFAULT_223_FZ = `### 1. Главное правило 223-ФЗ: Штрафы и пени НЕ СПИСЫВАЮТСЯ!
Начисленные штрафы и пени по 223-ФЗ либо оплачиваются Поставщиком, либо удерживаются из оплаты по контракту. Кабальные условия просматриваются от «А» до «Я».

### 2. Кабальные пункты проекта договора 223-ФЗ:
- Закупка у 3-х лиц за счет Поставщика при недопоставке или браке.
- Возмещение разницы в цене при покупке у других лиц после расторжения.
- Односторонний отказ при задержке более 5 рабочих дней.
- Расторжение договора при просрочке свыше 10 календарных дней.
- Штраф 3% от всей стоимости товара за нарушения упаковки, маркировки, качества или сроков.

### 3. Сопровождение и приемка:
- Уточнить вид первичных документов (УПД, ТОРГ-12) заранее.
- Требовать письменный мотивированный отказ при немотивированном непринимании товара.`;

const DEFAULT_CORE_INSTRUCTIONS = `### Основные директивы для ИИ-анализатора и тендерного отдела:
1. Автоматически искать кабальные штрафы (>1% от суммы) и необоснованное удержание выплат.
2. Проверять соответствие требованиям Нацрежима (ПП РФ № 1875) и реестрам ГИСП.
3. Проверять условия поставки «по заявкам» и выявлять сжатые сроки (менее 5 рабочих дней).
4. Оценивать риски одностороннего отказа Заказчика и внесения в РНП.`;

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, onUpdateGuidelines, activeProcedureType }) => {
  const [activeTab, setActiveTab] = useState<'223_FZ' | '44_FZ' | 'CORE'>('223_FZ');
  const [isEditing, setIsEditing] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Editable text states
  const [text44FZ, setText44FZ] = useState(DEFAULT_44_FZ);
  const [text223FZ, setText223FZ] = useState(DEFAULT_223_FZ);
  const [textCore, setTextCore] = useState(DEFAULT_CORE_INSTRUCTIONS);

  // Determine active law for current session
  const storedLaw = localStorage.getItem('selected_law_type');
  const isCurrently44FZ = Boolean(
    (activeProcedureType && activeProcedureType.startsWith('44_FZ')) ||
    storedLaw === '44_FZ'
  );

  // Load saved guidelines and active tab on mount
  useEffect(() => {
    const saved44 = localStorage.getItem('regulations_44fz');
    const saved223 = localStorage.getItem('regulations_223fz');
    const savedCore = localStorage.getItem('regulations_core');
    const savedTab = localStorage.getItem('active_regulations_tab') as '223_FZ' | '44_FZ' | 'CORE' | null;

    if (saved44) setText44FZ(saved44);
    if (saved223) setText223FZ(saved223);
    if (savedCore) setTextCore(savedCore);

    if (savedTab) {
      setActiveTab(savedTab);
    } else if (isCurrently44FZ) {
      setActiveTab('44_FZ');
    }
  }, [activeProcedureType]);

  const handleTabChange = (tab: '223_FZ' | '44_FZ' | 'CORE') => {
    setActiveTab(tab);
    localStorage.setItem('active_regulations_tab', tab);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('regulations_44fz', text44FZ);
    localStorage.setItem('regulations_223fz', text223FZ);
    localStorage.setItem('regulations_core', textCore);

    const combined = `=== РЕГЛАМЕНТ 44-ФЗ ===\n${text44FZ}\n\n=== РЕГЛАМЕНТ 223-ФЗ ===\n${text223FZ}\n\n=== ОСНОВНЫЕ ИНСТРУКЦИИ ===\n${textCore}`;
    localStorage.setItem('custom_tender_guidelines', combined);

    if (onUpdateGuidelines) {
      onUpdateGuidelines(combined);
    }

    setIsEditing(false);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Восстановить стандартные регламенты по 44-ФЗ и 223-ФЗ?')) {
      setText44FZ(DEFAULT_44_FZ);
      setText223FZ(DEFAULT_223_FZ);
      setTextCore(DEFAULT_CORE_INSTRUCTIONS);
      localStorage.removeItem('regulations_44fz');
      localStorage.removeItem('regulations_223fz');
      localStorage.removeItem('regulations_core');
      localStorage.removeItem('custom_tender_guidelines');
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 transition-colors duration-200">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 rounded-t-3xl">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                <span>Регламент работы: 44-ФЗ & 223-ФЗ</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Инструкции ИИ
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Официальный регламент тендерного отдела & основные директивы анализа
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="Редактировать регламент и инструкции"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Редактировать</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSave}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                  title="Сбросить к исходным настройкам"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              id="close-guide-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Закрыть регламент"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION SAVED */}
        {isSavedNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs px-4 py-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Обновленный регламент сохранен и подключен в качестве основных инструкций ИИ!
            </span>
          </div>
        )}

        {/* ACTIVE LAW INDICATOR BANNER */}
        <div className="bg-slate-50 dark:bg-slate-950/60 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Активный законы в сессии:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] flex items-center gap-1 ${
              isCurrently44FZ 
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
            }`}>
              <Zap className="w-3 h-3 text-current" />
              {isCurrently44FZ ? 'Выбран 44-ФЗ (ЕИС Закупки)' : 'Выбран 223-ФЗ'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Сохраняется в localStorage & синхронизируется с ИИ
          </span>
        </div>

        {/* TABS SELECTOR */}
        <div className="bg-slate-100/70 dark:bg-slate-900 px-4 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleTabChange('223_FZ')}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === '223_FZ'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-400 border-b-transparent -mb-px'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Регламент 223-ФЗ</span>
            {!isCurrently44FZ && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" title="Активен для текущего анализа" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('44_FZ')}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === '44_FZ'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400 border-b-transparent -mb-px'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Регламент 44-ФЗ</span>
            {isCurrently44FZ && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Активен для текущего анализа" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('CORE')}
            className={`px-4 py-2 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === 'CORE'
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400 border-b-transparent -mb-px'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Основные инструкции ИИ</span>
          </button>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Редактирование выбранного раздела ({activeTab === '44_FZ' ? '44-ФЗ' : activeTab === '223_FZ' ? '223-ФЗ' : 'Директивы ИИ'}):</span>
                <span className="text-slate-400">Поддерживает простой текст и списки</span>
              </div>
              <textarea
                value={
                  activeTab === '44_FZ'
                    ? text44FZ
                    : activeTab === '223_FZ'
                    ? text223FZ
                    : textCore
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeTab === '44_FZ') setText44FZ(val);
                  else if (activeTab === '223_FZ') setText223FZ(val);
                  else setTextCore(val);
                }}
                rows={16}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Внесите изменения в текст регламента..."
              />
            </div>
          ) : (
            <>
              {/* TAB 44-FZ */}
              {activeTab === '44_FZ' && (
                <div className="space-y-4">
                  <section className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 mb-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Главные особенности закона 44-ФЗ (ЕИС Закупки)</span>
                    </div>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                      Закупки по 44-ФЗ регулируются едиными государственными стандартами. Процедуры требуют обязательной регистрации в ЕРУЗ, предоставления банковских гарантий из реестра ЕИС и электронного актирования.
                    </p>
                  </section>

                  <div className="prose dark:prose-invert max-w-none space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        1. Порядок расчета штрафов и пени по Постановлению № 1042
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <li><strong>Штрафы за неисполнение:</strong> Устанавливаются в фиксированном размере от НМЦК (например, 10% от НМЦК до 3 млн руб).</li>
                        <li><strong>Пени за просрочку:</strong> Начисляются за каждый день просрочки в размере 1/300 ключевой ставки ЦБ РФ от стоимости неисполненных обязательств.</li>
                        <li><strong className="text-emerald-700 dark:text-emerald-400">Списание неустоек (ПП РФ № 783):</strong> При полностью выполненном контракте или в условиях внешних санкций Заказчик обязан списать начисленные штрафы (до 5% от ЦК — полностью, от 5% до 20% — при уплате 50%).</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        2. Национальный режим (ПП РФ № 1875 / ГИСП)
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        <li>Запреты и ограничения на закупку товаров иностранного происхождения.</li>
                        <li>Обязательное включение реестровых номеров ГИСП/РЭП Минпромторга и технологических баллов в заявку.</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-xs sm:text-sm font-sans">
                      {text44FZ}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 223-FZ */}
              {activeTab === '223_FZ' && (
                <div className="space-y-4">
                  <section className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Главное правило 223-ФЗ: Штрафы и пени НЕ СПИСЫВАЮТСЯ!</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      Начисленные штрафы и пени по 223-ФЗ либо оплачиваются Поставщиком, либо удерживаются из оплаты по контракту. Проект договора подлежит сплошному аудиту.
                    </p>
                  </section>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-xs sm:text-sm font-sans">
                    {text223FZ}
                  </div>
                </div>
              )}

              {/* TAB CORE INSTRUCTIONS */}
              {activeTab === 'CORE' && (
                <div className="space-y-4">
                  <section className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 p-4 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200 mb-1.5">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>Инструкции для алгоритма ИИ-анализа закупки</span>
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                      Эти директивы используются системой в качестве баз системного контроля при экспертизе загруженных документов 44-ФЗ и 223-ФЗ.
                    </p>
                  </section>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-xs sm:text-sm font-sans font-mono">
                    {textCore}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 rounded-b-3xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Регламент автоматически применяется при экспертной оценке документов</span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить</span>
              </button>
            )}

            <button
              id="close-guide-bottom-btn"
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Понятно, закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
