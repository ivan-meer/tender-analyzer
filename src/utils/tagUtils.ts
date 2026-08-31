export interface TagDefinition {
  id: string;
  name: string;
  enName?: string;
  color: {
    bg: string;
    text: string;
    border: string;
    darkBg: string;
    darkText: string;
    darkBorder: string;
    dot: string;
  };
  description?: string;
}

export const PRESET_TAG_DEFINITIONS: TagDefinition[] = [
  {
    id: 'high-risk',
    name: 'High Risk',
    enName: 'Высокий риск',
    color: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-300',
      darkBg: 'dark:bg-rose-950/60',
      darkText: 'dark:text-rose-300',
      darkBorder: 'dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    description: 'Критичные риски штрафов, пени или неоднозначные ТЗ',
  },
  {
    id: 'urgent',
    name: 'Urgent',
    enName: 'Срочно',
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
      darkBg: 'dark:bg-amber-950/60',
      darkText: 'dark:text-amber-300',
      darkBorder: 'dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    description: 'Горящий дедлайн подачи заявки или запроса разъяснений',
  },
  {
    id: 'review-needed',
    name: 'Review Needed',
    enName: 'Требуется проверка',
    color: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-300',
      darkBg: 'dark:bg-purple-950/60',
      darkText: 'dark:text-purple-300',
      darkBorder: 'dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    description: 'Требуется дополнительное согласование юристом / инженером',
  },
  {
    id: 'pp-1875',
    name: 'ПП 1875',
    enName: 'PP 1875',
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-300',
      darkBg: 'dark:bg-blue-950/60',
      darkText: 'dark:text-blue-300',
      darkBorder: 'dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    description: 'Применяется национальный режим / запреты на импорт',
  },
  {
    id: 'approved',
    name: 'Согласовано',
    enName: 'Approved',
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      darkBg: 'dark:bg-emerald-950/60',
      darkText: 'dark:text-emerald-300',
      darkBorder: 'dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    description: 'Документация проверена и одобрена к участию',
  },
  {
    id: 'fas-complaint',
    name: 'Жалоба в ФАС',
    enName: 'FAS Complaint',
    color: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-300',
      darkBg: 'dark:bg-red-950/60',
      darkText: 'dark:text-red-300',
      darkBorder: 'dark:border-red-800',
      dot: 'bg-red-500',
    },
    description: 'Готовится жалоба в антимонопольную службу',
  },
  {
    id: 'small-volume',
    name: 'Малый объем',
    enName: 'Small Volume',
    color: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-300',
      darkBg: 'dark:bg-teal-950/60',
      darkText: 'dark:text-teal-300',
      darkBorder: 'dark:border-teal-800',
      dot: 'bg-teal-500',
    },
    description: 'Закупка малого объема до 100/600 тыс. руб.',
  },
  {
    id: 'equipment',
    name: 'Оборудование',
    enName: 'Equipment',
    color: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-300',
      darkBg: 'dark:bg-cyan-950/60',
      darkText: 'dark:text-cyan-300',
      darkBorder: 'dark:border-cyan-800',
      dot: 'bg-cyan-500',
    },
    description: 'Поставка сложного технического оборудования',
  },
  {
    id: 'construction',
    name: 'Строительство',
    enName: 'Construction',
    color: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-300',
      darkBg: 'dark:bg-orange-950/60',
      darkText: 'dark:text-orange-300',
      darkBorder: 'dark:border-orange-800',
      dot: 'bg-orange-500',
    },
    description: 'Строительно-монтажные и ремонтные работы',
  },
  {
    id: 'it-software',
    name: 'ИТ / Софт',
    enName: 'IT / Software',
    color: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-300',
      darkBg: 'dark:bg-indigo-950/60',
      darkText: 'dark:text-indigo-300',
      darkBorder: 'dark:border-indigo-800',
      dot: 'bg-indigo-500',
    },
    description: 'Программное обеспечение, лицензии, ИТ-услуги',
  },
];

const DEFAULT_CUSTOM_COLOR = {
  bg: 'bg-slate-100',
  text: 'text-slate-700',
  border: 'border-slate-300',
  darkBg: 'dark:bg-slate-800',
  darkText: 'dark:text-slate-300',
  darkBorder: 'dark:border-slate-700',
  dot: 'bg-slate-500',
};

// Fallback color palettes for custom user tags to make them look distinct
const CUSTOM_PALETTES = [
  {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    darkBg: 'dark:bg-emerald-950/60',
    darkText: 'dark:text-emerald-300',
    darkBorder: 'dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-300',
    darkBg: 'dark:bg-sky-950/60',
    darkText: 'dark:text-sky-300',
    darkBorder: 'dark:border-sky-800',
    dot: 'bg-sky-500',
  },
  {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-300',
    darkBg: 'dark:bg-violet-950/60',
    darkText: 'dark:text-violet-300',
    darkBorder: 'dark:border-violet-800',
    dot: 'bg-violet-500',
  },
  {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-300',
    darkBg: 'dark:bg-fuchsia-950/60',
    darkText: 'dark:text-fuchsia-300',
    darkBorder: 'dark:border-fuchsia-800',
    dot: 'bg-fuchsia-500',
  },
  {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    darkBg: 'dark:bg-amber-950/60',
    darkText: 'dark:text-amber-300',
    darkBorder: 'dark:border-amber-800',
    dot: 'bg-amber-500',
  },
];

export function getTagStyle(tagName: string) {
  if (!tagName) return DEFAULT_CUSTOM_COLOR;

  const normalized = tagName.trim().toLowerCase();

  const found = PRESET_TAG_DEFINITIONS.find(
    (t) =>
      t.name.toLowerCase() === normalized ||
      (t.enName && t.enName.toLowerCase() === normalized) ||
      t.id.toLowerCase() === normalized
  );

  if (found) {
    return found.color;
  }

  // Consistent hashing for custom tags
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CUSTOM_PALETTES.length;
  return CUSTOM_PALETTES[index];
}

export function normalizeTagName(tag: string): string {
  return tag.replace(/^[#\s]+/, '').trim();
}
