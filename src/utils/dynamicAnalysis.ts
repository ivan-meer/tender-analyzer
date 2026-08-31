import { AnalysisInput, AnalysisResult, ContractRiskItem, ProductItem } from '../types';
import { extractIndividualProductsFromText } from './productExtractor';

/**
 * Client-side heuristic and semantic procurement analyzer.
 * Guarantees zero freezes, zero timeouts, and immediate resilience against network or server drops.
 */
export function generateClientSideDynamicAnalysis(input: AnalysisInput): AnalysisResult {
  const contractText = input.contractText || '';
  const tzText = input.tzText || '';
  const documentationText = input.documentationText || '';
  const procedureType = input.procedureType || '44_FZ_AUCTION';

  const fullCorpus = `${contractText}\n\n${documentationText}\n\n${tzText}`;
  const is44FZ = Boolean(procedureType.startsWith('44_FZ')) || /44-фз|сорок четверт|государственн[а-я\s]+контракт/i.test(fullCorpus);

  // 1. EXTRACT PROCUREMENT TITLE
  let extractedTitle = '';
  const titlePatterns = [
    /(?:предмет контракта|предмет договора|наименование закупки|объект закупки|на поставку|на оказание услуг|на выполнение работ)[\s:—–«"\-]+([^\n\r.;]{10,240})/i,
    /(?:извещение о проведении|открытый аукцион на|запрос котировок на|конкурс на)[\s:—–«"\-]+([^\n\r.;]{10,240})/i,
    /=== \[(?:ПРОЕКТ ДОГОВОРА|ИЗВЕЩЕНИЕ|ТЕХНИЧЕСКОЕ ЗАДАНИЕ)[^:]*: ([^\]]+)\] ===/i
  ];
  for (const regex of titlePatterns) {
    const match = fullCorpus.match(regex);
    if (match && match[1] && match[1].trim().length > 8) {
      extractedTitle = match[1].replace(/^[«"'\s]+|[»"'\s]+$/g, '').trim();
      break;
    }
  }
  if (!extractedTitle) {
    extractedTitle = is44FZ
      ? 'Государственная закупка по 44-ФЗ (по данным загруженной документации)'
      : 'Тендерная закупка по 223-ФЗ / Коммерческим торгам (по данным загруженных документов)';
  }

  // 2. EXTRACT CUSTOMER NAME & INN
  let extractedCustomer = '';
  let extractedInn = '';
  const innMatch = fullCorpus.match(/(?:ИНН(?:\/КПП)?|ИНН\s*Заказчика)[\s:—–]+(\d{10}|\d{12})/i);
  if (innMatch && innMatch[1]) {
    extractedInn = innMatch[1];
  }

  const customerPatterns = [
    /(?:заказчик|покупатель|получатель)[\s:—–«"\-]+([^\n\r,.;]{4,140})/i,
    /(?:ГКУ|ГБУ|ГБУЗ|МАОУ|МБОУ|ФГБУ|ФКУ|ГУП|МУП|ФГУП|ПАО|АО|ООО)\s+[«"][^»"]+[»"]/i,
    /(?:ГКУ|ГБУ|ГБУЗ|МАОУ|МБОУ|ФГБУ|ФКУ|ГУП|МУП|ФГУП)\s+[А-Яа-яA-Za-z0-9№\s"«»\-]+(?=\s*[,.\n])/i
  ];
  for (const regex of customerPatterns) {
    const match = fullCorpus.match(regex);
    if (match) {
      const candidate = (match[1] || match[0]).trim();
      if (candidate.length >= 3 && !candidate.toLowerCase().includes('поставщик') && !candidate.toLowerCase().includes('подрядчик')) {
        extractedCustomer = candidate;
        break;
      }
    }
  }
  if (!extractedCustomer) {
    extractedCustomer = is44FZ ? 'Государственный заказчик (44-ФЗ)' : 'Заказчик закупки';
  }

  // 3. EXTRACT CONTRACT / PROCUREMENT SUM
  let extractedSum = '';
  const sumPatterns = [
    /(?:цена контракта|цена договора|начальная\s*(?:\(максимальная\))?\s*цена|нмцк|стоимость договора|сумма контракта)[\s:—–\-]*([\d\s,.]+)\s*(?:руб|рублей|₽)/i,
    /([\d]{1,3}(?:[ \xA0]\d{3})+(?:[.,]\d{2})?)\s*(?:руб|рублей|₽)/i,
    /([\d]{4,10}(?:[.,]\d{2})?)\s*(?:руб|рублей|₽)/i
  ];
  for (const regex of sumPatterns) {
    const match = fullCorpus.match(regex);
    if (match && match[1]) {
      const cleanNum = match[1].replace(/\s+/g, ' ').trim();
      if (cleanNum.length >= 3) {
        extractedSum = `${cleanNum} ₽`;
        break;
      }
    }
  }
  if (!extractedSum) {
    extractedSum = 'По спецификации / Расчетная цена';
  }

  // 4. EXTRACT AUCTION & SUBMISSION DATES
  let extractedAuctionDate = '';
  const auctionDatePatterns = [
    /(?:дата и время окончания срока подачи заявок|окончание подачи заявок|дата окончания приема заявок|срок подачи заявок до)[\s:—–\-]+([^\n\r.;]{6,120})/i,
    /(?:дата проведения аукциона|дата подведения итогов|дата подведения итогов аукциона)[\s:—–\-]+([^\n\r.;]{6,120})/i,
    /(?:до\s+\d{1,2}[:.]\d{2}\s+(?:МСК|\(МСК\))?\s+\d{2}[./]\d{2}[./]\d{4})/i,
    /(\d{2}[./]\d{2}[./]\d{4}\s+(?:года|г\.)?\s*(?:в\s+\d{1,2}[:.]\d{2})?)/i
  ];
  for (const regex of auctionDatePatterns) {
    const match = fullCorpus.match(regex);
    if (match && match[1]) {
      const d = match[1].trim();
      if (d.length >= 5 && !d.toLowerCase().includes('контракт')) {
        extractedAuctionDate = d;
        break;
      }
    }
  }
  if (!extractedAuctionDate) {
    extractedAuctionDate = 'По извещению в ЕИС / на ЭТП';
  }

  // 5. EXTRACT DELIVERY DATES AND ADDRESSES
  let deliveryPeriod = '';
  const deliveryPeriodPatterns = [
    /(?:срок поставки товара|срок поставки|период поставки|товар поставляется|поставка осуществляется)[\s:—–\-]+([^\n\r.;]{10,220})/i,
    /(?:в течение\s+\d+\s*(?:рабочих|календарных|банковских)?\s*дней[^\n\r.;]{0,120})/i,
    /(?:не позднее\s+«?\d{1,2}»?\s+[а-яА-Я]+\s+202\d\s*(?:года|г\.))/i,
    /(?:до\s+«?\d{1,2}»?\s+[а-яА-Я]+\s+202\d\s*(?:года|г\.))/i
  ];
  for (const regex of deliveryPeriodPatterns) {
    const match = fullCorpus.match(regex);
    if (match) {
      const cand = (match[1] || match[0]).trim();
      if (cand.length > 8) {
        deliveryPeriod = cand;
        break;
      }
    }
  }
  if (!deliveryPeriod) {
    deliveryPeriod = is44FZ
      ? 'В течение установленного контрактом срока с даты заключения (электронное актирование в ЕИС).'
      : 'В соответствии с графиком и условиями договора по заявкам Заказчика.';
  }

  const deliveryAddresses: string[] = [];
  const addressRegexes = [
    /(?:место поставки(?:\s*товара)?|адрес поставки(?:\s*товара)?|место доставки|место разгрузки|грузополучатель и его адрес)[\s:—–\-]+([^;\n\r]{10,240})/gi,
    /(?:\b\d{6}\b,?\s*(?:Российская Федерация,?\s*)?(?:г\.|город|обл\.|область|пос\.|р-н|ул\.|улица|просп\.|проспект|наб\.|шоссе|пер\.|проезд)[^;\n]{8,180})/gi
  ];
  for (const regex of addressRegexes) {
    let m;
    while ((m = regex.exec(fullCorpus)) !== null && deliveryAddresses.length < 4) {
      const rawAddr = (m[1] || m[0]).replace(/^(?:место поставки(?:\s*товара)?|адрес поставки)[\s:—–\-]+/i, '').trim();
      if (rawAddr.length > 8 && !deliveryAddresses.includes(rawAddr) && !rawAddr.toLowerCase().includes('согласно приложению')) {
        deliveryAddresses.push(rawAddr);
      }
    }
  }
  if (deliveryAddresses.length === 0) {
    deliveryAddresses.push('По адресу Заказчика согласно разделу «Место поставки товара» документации');
  }

  // 6. EXTRACT PRODUCTS FROM SPECIFICATION / TZ / CONTRACT TABLES
  const combinedTzAndContract = `${tzText}\n\n${contractText}\n\n${documentationText}`;
  const productList: ProductItem[] = extractIndividualProductsFromText(
    combinedTzAndContract,
    is44FZ,
    extractedTitle
  );

  // 7. EXTRACT REAL CONTRACT RISKS & PENALTIES
  const contractRisks: ContractRiskItem[] = [];

  // A) Penalties (1042 / 1/300 / 3%)
  const penaltyMatch = contractText.match(/(?:штраф|пени|неустойк)[^\n.]{0,120}(?:1042|1\/300|3\s*%|0[,.]\d+\s*%|размере)[^\n.]{0,220}\./i);
  if (is44FZ) {
    contractRisks.push({
      id: 'risk-dyn-1',
      category: 'PENALTIES',
      clauseNumber: 'Раздел «Ответственность Сторон» (ПП РФ № 1042)',
      clauseQuote: penaltyMatch ? penaltyMatch[0].trim() : 'Штрафы начисляются в порядке Постановления Правительства РФ № 1042, пени — 1/300 ключевой ставки ЦБ РФ.',
      severity: 'HIGH',
      title: 'Расчет неустоек по ПП РФ № 1042 и законное списание по ПП РФ № 783',
      explanation: 'Штрафы начисляются в фиксированном размере от цены контракта, пени — 1/300 ключевой ставки ЦБ РФ за каждый день просрочки. При сумме начисленных неустоек до 5% они подлежат обязательному списанию Заказчиком по ПП РФ № 783.',
      recommendation: 'Контролируйте дату сдачи в ЕИС. В случае выставления штрафов направьте заявление о списании начисленной неустойки по ПП РФ № 783.'
    });
  } else {
    contractRisks.push({
      id: 'risk-dyn-1',
      category: 'PENALTIES',
      clauseNumber: 'Раздел «Ответственность Сторон»',
      clauseQuote: penaltyMatch ? penaltyMatch[0].trim() : 'За нарушение сроков поставки начисляется неустойка в размере, предусмотренном договором.',
      severity: 'CRITICAL',
      title: 'Штрафные санкции и пени по договору (223-ФЗ / Коммерческие торги)',
      explanation: 'По 223-ФЗ и коммерческим контрактам начисленные неустойки НЕ подлежат законному списанию и могут быть удержаны из суммы оплаты.',
      recommendation: 'Направьте протокол разногласий с предложением ограничить совокупный размер ответственности или снизить процент пени.'
    });
  }

  // B) Unilateral Termination / Refusal
  const terminationMatch = contractText.match(/(?:односторонн[а-я\s]+отказ|расторжен[а-я\s]+договор|расторжен[а-я\s]+контракт)[^\n.]{0,180}\./i);
  contractRisks.push({
    id: 'risk-dyn-2',
    category: 'TERMINATION',
    clauseNumber: 'Раздел «Изменение и расторжение»',
    clauseQuote: terminationMatch ? terminationMatch[0].trim() : (is44FZ ? 'Заказчик вправе принять решение об одностороннем отказе от исполнения контракта в соответствии со ст. 95 44-ФЗ.' : 'Заказчик вправе в одностороннем порядке расторгнуть договор при нарушении сроков поставки.'),
    severity: is44FZ ? 'HIGH' : 'CRITICAL',
    title: is44FZ ? 'Односторонний отказ Заказчика и риск включения в РНП (ч. 9-22 ст. 95 44-ФЗ)' : 'Одностороннее расторжение договора Заказчиком',
    explanation: is44FZ
      ? 'При одностороннем отказе Заказчика решение размещается в ЕИС. Неустранение нарушений в течение 10 дней влечет расторжение контракта и направление сведений в ФАС для включения в РНП на 2 года.'
      : 'Односторонний отказ лишает поставщика оплаты и дает право Заказчику взыскать понесенные убытки.',
    recommendation: 'При возникновении задержек направьте Заказчику официальное уведомление о форс-мажоре или задержке встречных обязательств.'
  });

  // C) Payment Terms / Electronic Acceptance
  const paymentMatch = contractText.match(/(?:оплата|расчет)[^\n.]{0,100}(?:7 рабочих дней|10 рабочих дней|30 дней|банковских дней|еис|упд)[^\n.]{0,180}\./i);
  contractRisks.push({
    id: 'risk-dyn-3',
    category: 'PAYMENT_TERMS' as any,
    clauseNumber: 'Раздел «Порядок расчетов»',
    clauseQuote: paymentMatch ? paymentMatch[0].trim() : (is44FZ ? 'Оплата осуществляется в срок не более 7 рабочих дней со дня подписания электронного документа о приемке в ЕИС.' : 'Оплата производится после приемки товара и подписания закрывающих документов.'),
    severity: is44FZ ? 'INFO' : 'MEDIUM',
    title: is44FZ ? 'Регламентный срок оплаты Заказчиком: 7 рабочих дней через ЕИС' : 'Сроки оплаты и подписание закрывающих документов',
    explanation: is44FZ
      ? 'По ч. 13.1 ст. 34 ФЗ № 44 срок оплаты строго ограничен 7 рабочими днями со дня подписания электронного УПД Заказчиком в ЕИС.'
      : 'Контролируйте дату фактического получения закрывающих документов Заказчиком во избежание затягивания оплаты.',
    recommendation: 'Формируйте электронный УПД в личном кабинете ЕИС строго в день фактической доставки товара на склад Заказчика.'
  });

  const overallRiskScore = contractRisks.some(r => r.severity === 'CRITICAL') ? 74 : is44FZ ? 45 : 60;

  const resultData: any = {
    _aiAnalysisStatus: 'HEURISTIC_PARSED',
    summary: {
      procurementTitle: extractedTitle,
      projectName: `Закупка: ${extractedTitle.slice(0, 60)}...`,
      customerName: extractedCustomer,
      customerInn: extractedInn || undefined,
      procurementSum: extractedSum,
      auctionDate: extractedAuctionDate,
      overallRiskScore,
      riskLevel: overallRiskScore > 70 ? 'CRITICAL' : overallRiskScore > 40 ? 'MEDIUM' : 'LOW',
      keyTakeaway: is44FZ
        ? `Закупка по 44-ФЗ для «${extractedCustomer}». Контроль сроков оплаты (7 р.д. в ЕИС), расчет штрафов по ПП № 1042 и законное право списания неустоек по ПП № 783.`
        : `Закупка по 223-ФЗ/B2B для «${extractedCustomer}». Неустойки по договору не подлежат обязательному списанию, требуется строгий контроль условий поставки и закрывающих документов.`,
      is223FZ: !is44FZ,
    },
    deliveryInfo: {
      deliveryPeriod,
      deliveryScheduleNotice: 'Поставка осуществляется в соответствии с согласованным графиком или заявками Заказчика.',
      deliveryAddresses,
      unloadingAndAccessConditions: 'Разгрузка, подъем на этаж и оформление пропусков осуществляются согласно регламенту Заказчика.',
      consigneeDetails: extractedCustomer,
      riskWarning: 'Соблюдайте согласованные сроки поставки для предотвращения претензионной работы и начисления пеней.',
    },
    contractRisks,
    submissionRulesCheck: {
      procedureType: procedureType || (is44FZ ? '44_FZ_AUCTION' : '223_FZ_QUOTATION'),
      requestInTableRequired: true,
      etpAccreditationNotice: is44FZ ? 'Аккредитация в ЕРУЗ ЕИС и спецсчет для обеспечения заявки обязательны.' : 'Проверить регистрацию и баланс на ЭТП за 48 часов до окончания подачи.',
      requiredFilesStructure: is44FZ
        ? [
            '1. Заявка на участие с конкретными показателями товара (без указания наименования участника)',
            '2. Документы подтверждения страны происхождения товара (реестровые номера ГИСП / РЭП при нацрежиме)',
            '3. Декларация соответствия единым требованиям ст. 31 44-ФЗ'
          ]
        : [
            '1. Заявка участника по установленной форме Заказчика (Форма №1, Согласие)',
            '2. Техническое предложение с конкретными характеристиками товара',
            '3. Уставные документы, выписка ЕГРЮЛ и одобрение крупной сделки',
            '4. Ценовое предложение на ЭТП'
          ],
      formsRequirement: is44FZ ? 'Подача через функционал ЭТП в структурированном виде.' : 'Строгое заполнение установленных форм Заказчика.',
      pp1875Applies: is44FZ,
      pp1875Details: is44FZ ? 'Применяются правила нацрежима (ПП РФ № 1875 / ПП РФ № 616 / ПП РФ № 878).' : 'Требования устанавливаются Положением о закупке Заказчика.',
      accountingInfoNeeded: !is44FZ,
      accountingItems: is44FZ
        ? ['Справка об отсутствии задолженности (сверка ФНС через ЕИС)', 'Выписка ЕГРЮЛ из ЕРУЗ']
        : ['Бухгалтерский баланс (Форма №1, №2)', 'Справка об отсутствии задолженности по налогам']
    },
    postAwardWorkflow: {
      deliveryNotifications: 'Уведомление Заказчика о готовности к отгрузке за 24-48 часов до прибытия транспорта.',
      primaryDocFormatConfirmation: is44FZ ? 'Электронное актирование: формирование документа о приемке (электронный УПД) в ЕИС Закупки.' : 'Формирование УПД (статус 1) через систему ЭДО или на бумажном носителе.',
      accompanyingDocs: is44FZ ? ['Электронный УПД в ЕИС', 'Транспортная накладная', 'Паспорт качества / сертификат соответствия'] : ['УПД / ТОРГ-12', 'Сертификат соответствия / декларация', 'Паспорт изделия'],
      acceptanceDocsStrategy: 'Обязательная фиксация даты и подписи уполномоченного лица Заказчика в акте/накладной.',
      motivatedRefusalGuide: 'При отказе в приемке требовать письменный мотивированный отказ с указанием конкретных пунктов несоответствия.'
    },
    productList,
    generatedTemplates: {
      acceptanceDocsRequest: `Руководству Заказчика (${extractedCustomer})\nОт Поставщика\n\nУВЕДОМЛЕНИЕ О ПОСТАВКЕ И ПОДПИСАНИИ ЭЛЕКТРОННОГО УПД В ЕИС\n\nУведомляем о завершении поставки по закупке «${extractedTitle}». Товар доставлен в полном объеме на склад Заказчика. Документ о приемке (электронный УПД) сформирован в ЕИС Закупки. Просим осуществить приемку и подписание в регламентный срок.`,
      motivatedRefusalDemand: `В адрес Заказчика (${extractedCustomer})\n\nТРЕБОВАНИЕ О ПРЕДОСТАВЛЕНИИ МОТИВИРОВАННОГО ОТКАЗА В ЕИС\n\nВ связи с устными замечаниями просим сформировать в ЕИС мотивированный отказ от подписания документа о приемке с указанием конкретных пунктов технического задания, которым не соответствует поставленный товар.`,
      etpFundsRequest: `Оператору ЭТП / В финансовую службу\n\nЗАЯВЛЕНИЕ\nО разблокировании обеспечения заявки по закупке «${extractedTitle}» в связи с надлежащим завершением процедуры.`,
      accountingDataRequest: `В отдел бухгалтерии\n\nСЛУЖЕБНАЯ ЗАПИСКА\nПросьба подготовить пакет финансовых документов для участия в закупке для Заказчика ${extractedCustomer}.`,
      yougileTaskSummary: `🎯 [ЗАДАЧА YOUGILE/БИТРИКС24]: Исполнение контракта «${extractedTitle}» (${extractedCustomer}). Контроль логистики, сдачи товара и подписания электронного УПД в ЕИС.`,
      claimResponseTemplate: `Заказчику (${extractedCustomer})\n\nОТВЕТ НА ПРЕТЕНЗИЮ / ХОДАТАЙСТВО О СПИСАНИИ НЕУСТОЙКИ\nСообщаем, что обязательства по отгрузке выполнены. На основании Постановления Правительства РФ № 783 просим произвести списание начисленных штрафов и пеней.`
    }
  };

  return resultData as AnalysisResult;
}
