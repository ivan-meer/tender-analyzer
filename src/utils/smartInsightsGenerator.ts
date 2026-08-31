import { AnalysisResult, SmartInsightQuestion, SmartInsightsResponse } from '../types';
import { getStoredLLMConfig } from './aiConfig';

const INSIGHTS_CACHE_KEY_PREFIX = 'smart_insights_cache_v1_';

/**
 * Generates or fetches Smart Insights questions from the server (using Gemini LLM cascade),
 * with instant client-side fallback and localStorage caching.
 */
export async function fetchSmartInsights(
  analysis: AnalysisResult,
  options?: { forceRefresh?: boolean }
): Promise<SmartInsightsResponse> {
  const cacheKey = `${INSIGHTS_CACHE_KEY_PREFIX}${analysis.summary?.projectName || analysis.summary?.procurementTitle || 'default'}_${analysis.contractRisks?.length || 0}`;

  if (!options?.forceRefresh) {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.questions && parsed.questions.length > 0) {
          return { ...parsed, _cached: true };
        }
      }
    } catch {
      // ignore
    }
  }

  const llmConfig = getStoredLLMConfig();

  try {
    const res = await fetch('/api/smart-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: analysis.summary,
        contractRisks: analysis.contractRisks,
        deliveryInfo: analysis.deliveryInfo,
        submissionRulesCheck: analysis.submissionRulesCheck,
        productList: analysis.productList,
        llmConfig,
      }),
    });

    if (res.ok) {
      const data: SmartInsightsResponse = await res.json();
      if (data.questions && data.questions.length > 0) {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {
          // ignore
        }
        return data;
      }
    }
  } catch (err) {
    console.warn('[Smart Insights] Fetch error, using client-side generator:', err);
  }

  // Client-side instant generator fallback
  const fallbackQuestions = generateClientSideSmartInsights(analysis);
  const fallbackResponse: SmartInsightsResponse = {
    questions: fallbackQuestions,
    modelUsed: 'Экспертная система (Клиентский анализ)',
    generatedAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(fallbackResponse));
  } catch {
    // ignore
  }

  return fallbackResponse;
}

/**
 * Generate comprehensive 3-5 smart questions tailored to the customer based on analysis data
 */
export function generateClientSideSmartInsights(analysis: AnalysisResult): SmartInsightQuestion[] {
  const is223 = analysis.summary?.is223FZ ?? false;
  const delivery = analysis.deliveryInfo;
  const risks = analysis.contractRisks || [];
  const products = analysis.productList || [];
  const customer = analysis.summary?.customerName || 'Заказчик';
  const questions: SmartInsightQuestion[] = [];

  // Question 1: Penalties / PP 783 / 1042 / Rate
  const penaltyRisk = risks.find((r) => r.category === 'PENALTIES' || /штраф|пени|неустойк/i.test(r.title + r.explanation));
  if (is223) {
    questions.push({
      id: 'insight-q-1',
      category: 'PENALTIES',
      categoryLabel: 'Штрафы и ответственность',
      priority: 'HIGH',
      relatedRiskOrClause: penaltyRisk?.clauseNumber || 'Раздел ответственности Сторон',
      title: 'Порядок начисления неустоек и учет обстоятельств задержки',
      rationale: 'В 223-ФЗ нормы обязательного списания штрафов не действуют автоматически. Важно зафиксировать досудебный порядок и основания освобождения от ответственности.',
      questionText: `В проекте договора установлен размер ответственности поставщика за нарушение сроков. Просим разъяснить порядок фиксации момента надлежащей передачи товара, а также подтвердить, что в случае задержки по вине третьих лиц или отсутствия своевременной заявки Заказчика неустойка не начисляется.`,
      expectedOutcome: 'Заказчик подтвердит порядок согласования задержек и освобождения от штрафов при отсутствии вины.',
      legalBasis: 'ст. 330, 401 ГК РФ, Федеральный закон № 223-ФЗ',
    });
  } else {
    questions.push({
      id: 'insight-q-1',
      category: 'PENALTIES',
      categoryLabel: 'Штрафы и ответственность',
      priority: 'HIGH',
      relatedRiskOrClause: penaltyRisk?.clauseNumber || 'п. 7.2-7.5 Проекта контракта',
      title: 'Обязательное списание неустоек по ПП РФ № 783',
      rationale: 'Проект контракта часто не содержит прямой ссылки на обязанность Заказчика списать начисленные пени и штрафы при исполнении обязательств.',
      questionText: `Просим разъяснить и подтвердить применение норм Постановления Правительства РФ от 04.07.2018 № 783 «О списании сумм неустоек (штрафов, пеней)» в случае надлежащего исполнения государственного контракта и внести соответствующее уточнение в проект контракта.`,
      expectedOutcome: 'Заказчик официально подтвердит обязанность списания неустоек по ПП РФ № 783.',
      legalBasis: 'ч. 9.1 ст. 34 44-ФЗ, ПП РФ от 04.07.2018 № 783',
    });
  }

  // Question 2: Logistics / Delivery / Unloading
  const addressList = delivery?.deliveryAddresses || [];
  const multiAddress = addressList.length > 1;
  questions.push({
    id: 'insight-q-2',
    category: 'DELIVERY_LOGISTICS',
    categoryLabel: 'Логистика и условия сдачи',
    priority: 'HIGH',
    relatedRiskOrClause: 'Раздел условий и графика поставки',
    title: 'Режим работы склада, пропускная система и условия разгрузки',
    rationale: 'Отсутствие точного регламента пропускного режима и разгрузки ведет к простоям грузового транспорта и срыву срока поставки.',
    questionText: `Просим уточнить регламент приема товаров на объекте Заказчика (${customer}): точные часы работы склада, порядок подачи заявок на оформление пропусков для автотранспорта и водителей (за сколько часов), а также подтвердить наличие условий для механизированной разгрузки и грузового лифта.${multiAddress ? ' Просим также конкретизировать график и пропорции распределения товара по адресам поставки.' : ''}`,
    expectedOutcome: 'Заказчик предоставит исчерпывающий регламент пропуска и контакты материально-ответственного лица.',
    legalBasis: 'ст. 509, 513 ГК РФ',
  });

  // Question 3: Acceptance & Payment / EIS E-Invoicing
  if (!is223) {
    questions.push({
      id: 'insight-q-3',
      category: 'ACCEPTANCE_EIS',
      categoryLabel: 'Электронное актирование в ЕИС',
      priority: 'HIGH',
      relatedRiskOrClause: 'Порядок приемки и электронного актирования',
      title: 'Сроки подписания электронного УПД в ЕИС и оплаты по контракту',
      rationale: 'По 44-ФЗ предельный срок оплаты составляет 7 рабочих дней с момента подписания документа о приемке в ЕИС. Важно исключить затягивание приемки.',
      questionText: `Просим подтвердить, что приемка товара осуществляется строго в ЕИС Закупки с подписанием электронного документа о приемке (электронный УПД) в срок не более 20 рабочих дней, а окончательный расчет производится не позднее 7 рабочих дней с даты подписания документа в ЕИС.`,
      expectedOutcome: 'Заказчик подтвердит нормативные сроки электронного актирования по ч. 13.1 ст. 34 44-ФЗ.',
      legalBasis: 'ч. 13.1 ст. 34 Федерального закона № 44-ФЗ',
    });
  } else {
    questions.push({
      id: 'insight-q-3',
      category: 'PAYMENT_TERMS',
      categoryLabel: 'Оплата и приемка',
      priority: 'HIGH',
      relatedRiskOrClause: 'Порядок расчетов и подписания накладных',
      title: 'Срок рассмотрения товарных накладных и гарантия оплаты',
      rationale: 'В коммерческих договорах и 223-ФЗ важно зафиксировать предельный срок приемки (например 5 рабочих дней) и автоматическое принятие при отсутствии замечаний.',
      questionText: `Просим уточнить срок подписания товарной накладной / акта приема-передачи Заказчиком с момента доставки товара на склад, а также зафиксировать норму о том, что при отсутствии мотивированного письменного отказа в течение 5 рабочих дней товар считается принятым без замечаний.`,
      expectedOutcome: 'Заказчик зафиксирует конкретный срок приемки в проекте договора.',
      legalBasis: 'ст. 309, 310, 513 ГК РФ',
    });
  }

  // Question 4: Technical specification & Equivalents
  const firstProduct = products[0];
  questions.push({
    id: 'insight-q-4',
    category: 'TECHNICAL_SPEC',
    categoryLabel: 'Техническое задание и спецификация',
    priority: 'MEDIUM',
    relatedRiskOrClause: 'Техническое задание (Описание объекта закупки)',
    title: 'Допустимость предложения эквивалентных материалов и габаритов',
    rationale: 'Слишком узкие диапазоны или указание конкретных торговых марок без эквивалента ограничивают поставщиков и несут риск отклонения заявки.',
    questionText: `Просим разъяснить возможность поставки товара с эквивалентными характеристиками и допустимыми технологическими допусками (по габаритам ±5%, материалам и цветовым решениям)${firstProduct ? ` в отношении позиции «${firstProduct.name}»` : ''}, не снижающими эксплуатационные качества товара.`,
    expectedOutcome: 'Заказчик подтвердит право предложения эквивалента в соответствии со ст. 33 44-ФЗ / 223-ФЗ.',
    legalBasis: 'п. 1 ч. 1 ст. 33 44-ФЗ / ч. 6.1 ст. 3 223-ФЗ',
  });

  // Question 5: National regime & Registry proof
  const hasPp1875 = analysis.submissionRulesCheck?.pp1875Applies || products.some((p) => p.pp1875Status === 'RUSSIAN_REQUIRED');
  questions.push({
    id: 'insight-q-5',
    category: 'NATIONAL_REGIME',
    categoryLabel: 'Нацрежим и реестровые номера',
    priority: hasPp1875 ? 'HIGH' : 'RECOMMENDED',
    relatedRiskOrClause: 'Требования к составу заявки (Нацрежим ПП 1875 / ПП 616 / ПП 878)',
    title: 'Порядок подтверждения страны происхождения и реестровых записей',
    rationale: 'Неверно указанный реестровый номер ГИСП/РЭП или отсутствие выписки ведет к отклонению заявки по второй части.',
    questionText: `Просим разъяснить порядок предоставления сведений о номерах реестровых записей из Реестра российской промышленной продукции (ГИСП) в составе заявки: достаточно ли указания номера записи реестра и совокупного количества баллов, либо требуется приложение полной выписки на этапе подачи заявки.`,
    expectedOutcome: 'Заказчик однозначно подтвердит перечень документов для подтверждения страны происхождения.',
    legalBasis: 'Постановление Правительства РФ № 1875 / ПП РФ № 616 / ПП РФ № 878',
  });

  return questions;
}

/**
 * Format all questions as a ready-to-submit formal Clarification Request letter
 */
export function formatFullClarificationLetter(
  analysis: AnalysisResult,
  questions: SmartInsightQuestion[]
): string {
  const customer = analysis.summary?.customerName || 'Заказчик';
  const title = analysis.summary?.procurementTitle || 'Закупка';
  const projectNumber = analysis.summary?.projectName || '';
  const is223 = analysis.summary?.is223FZ ?? false;
  const law = is223 ? '223-ФЗ' : '44-ФЗ';

  let text = `ЗАПРОС НА РАЗЪЯСНЕНИЕ ПОЛОЖЕНИЙ ИЗВЕЩЕНИЯ / ДОКУМЕНТАЦИИ О ЗАКУПКЕ\n`;
  text += `Заказчику: ${customer}\n`;
  text += `Закупка: «${title}» ${projectNumber ? `(${projectNumber})` : ''}\n`;
  text += `Нормативная база: Федеральный закон ${law}\n`;
  text += `Дата запроса: ${new Date().toLocaleDateString('ru-RU')}\n\n`;
  text += `Уважаемый Заказчик!\n\n`;
  text += `При изучении документации и проекта договора (контракта) по указанной закупке у потенциального участника закупки возникли следующие вопросы, требующие официального разъяснения:\n\n`;

  questions.forEach((q, idx) => {
    text += `ВОПРОС № ${idx + 1}: ${q.title.toUpperCase()}\n`;
    if (q.relatedRiskOrClause) {
      text += `Относительно пункта: ${q.relatedRiskOrClause}\n`;
    }
    if (q.legalBasis) {
      text += `Правовое основание: ${q.legalBasis}\n`;
    }
    text += `Суть запроса:\n${q.questionText}\n\n`;
  });

  text += `На основании изложенного, руководствуясь нормами законодательства о закупках (${law}), просим дать официальные разъяснения по вышеуказанным вопросам и при необходимости внести соответствующие изменения в извещение и проект договора (контракта).\n\n`;
  text += `С уважением,\nУчастник закупки`;

  return text;
}
