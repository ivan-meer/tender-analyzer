import { ProcedureType } from '../types';

export interface LawDetectionResult {
  lawType: '223_FZ' | '44_FZ' | 'COMMERCIAL';
  procedureType: ProcedureType;
  lawName: string;
  procedureName: string;
  confidence: 'HIGH' | 'MEDIUM';
  reason: string;
}

/**
  * Automatically analyzes text from uploaded procurement documents,
  * technical specifications, or contracts to identify if the tender is governed
  * by 44-FZ, 223-FZ, or Commercial regulations.
  */
export function detectLawTypeFromContent(text: string): LawDetectionResult | null {
  if (!text || text.trim().length < 15) return null;

  const lower = text.toLowerCase();

  let score44 = 0;
  let score223 = 0;
  let scoreComm = 0;

  // 44-FZ key indicators & statutory patterns
  if (/\b44[-_\s]*фз\b|44[-_\s]*федеральн/i.test(lower)) score44 += 12;
  if (/№\s*44-фз|закон[а-я\s]*№\s*44/i.test(lower)) score44 += 12;
  if (lower.includes('о контрактной системе')) score44 += 10;
  if (lower.includes('единая информационная система') || lower.includes('еис')) score44 += 6;
  if (lower.includes('национальный режим') || lower.includes('пп 616') || lower.includes('пп 617') || lower.includes('пп 1875') || lower.includes('126н')) score44 += 8;
  if (lower.includes('ктру') || lower.includes('окпд2') || lower.includes('окпд 2')) score44 += 5;
  if (lower.includes('электронный аукцион')) score44 += 4;
  if (lower.includes('запрос котировок в электронной форме')) score44 += 5;
  if (lower.includes('реестровый номер закупки') || lower.includes('извещение №')) score44 += 4;

  // 223-FZ key indicators & statutory patterns
  if (/\b223[-_\s]*фз\b|223[-_\s]*федеральн/i.test(lower)) score223 += 12;
  if (/№\s*223-фз|закон[а-я\s]*№\s*223/i.test(lower)) score223 += 12;
  if (lower.includes('о закупках товаров, работ, услуг отдельными видами')) score223 += 10;
  if (lower.includes('положение о закупке')) score223 += 8;
  if (lower.includes('закупка у единственного поставщика')) score223 += 5;
  if (lower.includes('запрос котировок в электронной форме по 223')) score223 += 8;

  // Commercial signatures
  if (lower.includes('коммерческий тендер') || lower.includes('коммерческая закупка') || lower.includes('b2b')) scoreComm += 8;
  if (lower.includes('без применения 44-фз и 223-фз')) scoreComm += 12;

  if (score44 === 0 && score223 === 0 && scoreComm === 0) return null;

  if (score44 >= score223 && score44 >= scoreComm && score44 > 0) {
    let proc: ProcedureType = '44_FZ_AUCTION';
    let procName = 'Электронный аукцион';

    if (lower.includes('котирок') || lower.includes('запрос котировок')) {
      proc = '44_FZ_QUOTATION';
      procName = 'Запрос котировок';
    } else if (lower.includes('конкурс')) {
      proc = '44_FZ_TENDER';
      procName = 'Открытый конкурс';
    }

    return {
      lawType: '44_FZ',
      procedureType: proc,
      lawName: '44-ФЗ (Контрактная система)',
      procedureName: procName,
      confidence: score44 >= 10 ? 'HIGH' : 'MEDIUM',
      reason: 'В документах обнаружены ссылки на нормативную базу 44-ФЗ'
    };
  }

  if (score223 > score44 && score223 >= scoreComm && score223 > 0) {
    let proc: ProcedureType = '223_FZ_QUOTATION';
    let procName = 'Запрос котировок / предложений';

    if (lower.includes('аукцион')) {
      proc = '223_FZ_AUCTION';
      procName = 'Электронный аукцион';
    } else if (lower.includes('конкурс')) {
      proc = '223_FZ_TENDER';
      procName = 'Конкурс по 223-ФЗ';
    }

    return {
      lawType: '223_FZ',
      procedureType: proc,
      lawName: '223-ФЗ (Закупки отдельных видов юрлиц)',
      procedureName: procName,
      confidence: score223 >= 10 ? 'HIGH' : 'MEDIUM',
      reason: 'В документах обнаружены ссылки на нормативную базу 223-ФЗ'
    };
  }

  if (scoreComm > score44 && scoreComm > score223) {
    return {
      lawType: 'COMMERCIAL',
      procedureType: 'COMMERCIAL',
      lawName: 'Коммерческая B2B закупка',
      procedureName: 'Коммерческий тендер',
      confidence: 'HIGH',
      reason: 'Документы идентифицированы как коммерческая закупка'
    };
  }

  return null;
}
