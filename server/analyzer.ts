import { Router } from "express";
import crypto from "crypto";
import { getAnalysisFromCache, setAnalysisInCache } from "./cache";
import { callUniversalLLM, extractJsonFromLLMResponse } from "./llm";
import {
  extractHighPriorityDocumentSections,
  extractIndividualProductsServer,
  isGenericServerUmbrellaName
} from "./productExtractor";

export const analyzerRouter = Router();

// Main Procurement Analyzer API
analyzerRouter.post("/analyze", async (req, res) => {
  try {
    const { procedureType, contractText, documentationText, tzText, additionalNotes, llmConfig, bypassCache } = req.body;

    if (!contractText && !documentationText && !tzText) {
      res.status(400).json({ error: "Не передано ни одного документа для анализа." });
      return;
    }

    // 1. Generate Content Hash for In-Memory Caching (unless bypass requested)
    const hashInput = `${procedureType || ''}_${contractText || ''}_${documentationText || ''}_${tzText || ''}_${additionalNotes || ''}_${llmConfig?.modelName || 'default'}`;
    const cacheKey = crypto.createHash('sha256').update(hashInput).digest('hex');

    if (!bypassCache) {
      const cachedResult = getAnalysisFromCache(cacheKey);
      if (cachedResult && cachedResult.summary?.procurementTitle && cachedResult._aiAnalysisStatus === 'LLM_AI_VERIFIED') {
        console.log(`[Cache Hit] Serving verified analysis from cache (${cacheKey.slice(0, 8)})`);
        res.setHeader('X-Cache-Status', 'HIT');
        res.json({ ...cachedResult, _cached: true, _cacheHitTime: new Date().toISOString() });
        return;
      }
    }

    const systemInstruction = `Ты — ведущий эксперт тендерного отдела, юрист высшей квалификации и логист по закупкам в РФ (специализация: 44-ФЗ, 223-ФЗ и коммерческие торги).
Твоя задача — провести глубокий, безошибочный анализ загруженных документов закупки (Проект договора/контракта, Документация/Извещение, Техническое задание/Спецификация) и извлечь ВСЕ фактические данные.

ПРАВИЛА ИЗВЛЕЧЕНИЯ КЛЮЧЕВЫХ ДАННЫХ:

1. ДАТЫ И СРОКИ (ОБЯЗАТЕЛЬНО ИЗВЛЕЧЬ ИЗ ТЕКСТА):
   - "auctionDate" (в объекте summary): точная дата и время окончания подачи заявок / проведения аукциона (например: "28.08.2025 в 10:00 МСК" или "По извещению: 15.09.2025"). Обязательно найди дату в извещении или документации!
   - "deliveryPeriod" (в объекте deliveryInfo): точный срок поставки/выполнения работ (например: "В течение 15 рабочих дней с даты заключения контракта, но не позднее 30.11.2025" или "С даты заключения контракта по 25.12.2025 г.").
   - Сроки оплаты: по 44-ФЗ строго проверь срок (не более 7 рабочих дней с даты подписания электронного УПД в ЕИС по ч. 13.1 ст. 34 44-ФЗ).
   - Сроки подписания контракта и направления протокола разногласий (5 дней на подписание, 1 протокол разногласий).

2. АДРЕСА И ЛОГИСТИКА (ОБЯЗАТЕЛЬНО ИЗВЛЕЧЬ ИЗ ТЕКСТА):
   - "deliveryAddresses" (в объекте deliveryInfo): массив ВСЕХ точных адресов поставки/складов из текста с почтовым индексом, регионом, городом, улицей, домом, строением, номером склада/помещения. Если в тексте есть точный адрес — он ОБЯЗАТЕЛЬНО должен быть в массиве!
   - "deliveryScheduleNotice": порядок и график поставки (по заявкам Заказчика, срок направления заявки).
   - "unloadingAndAccessConditions": разгрузка силами поставщика, подъем на этаж, оформление пропусков, режим работы склада.
   - "consigneeDetails": грузополучатель, контактное лицо, телефон.
   - "customerInn" (в summary): ИНН заказчика (10 или 12 цифр).

3. ШТРАФЫ, ПЕНИ И РИСКИ ДОГОВОРА ("contractRisks"):
   - Обязательно сформируй полный список рисков договора.
   - Если закупка по 44-ФЗ:
     1. Пени за просрочку исполнения: 1/300 ключевой ставки ЦБ РФ от цены контракта, уменьшенной на сумму исполненных обязательств.
     2. Фиксированные штрафы по Постановлению Правительства РФ № 1042 за ненадлежащее исполнение обязательств.
     3. Законное право и обязательность списания начисленных штрафов/пеней по Постановлению Правительства РФ № 783 (до 5% списывается 100%, от 5% до 20% — при уплате 50%).
     4. Односторонний отказ Заказчика от исполнения контракта с размещением в ЕИС и риск включения в РНП на 2 года.
     5. Электронное актирование в ЕИС и сроки приемки (до 20 рабочих дней, мотивированный отказ).
     6. Обеспечение исполнения контракта и гарантийных обязательств (независимая гарантия из реестра ЕИС).
   - Если закупка по 223-ФЗ:
     1. Неустойки и штрафы НЕ списываются в силу закона (оценивай как CRITICAL).
     2. Риск закупки у третьих лиц за счет Поставщика при просрочке/недопоставке.
     3. Удержание штрафов из суммы оплаты.
     4. Односторонний отказ при просрочке свыше 5-10 дней.

4. СПЕЦИФИКАЦИЯ И СПИСОК ТОВАРОВ ("productList"):
   - КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать одну общую позицию "Офисная мебель", "Товары" или дублировать название закупки!
   - В "productList" ОБЯЗАТЕЛЬНО извлеки КАЖДУЮ ОТДЕЛЬНУЮ ПОЗИЦИЮ как самостоятельный товар со своими габаритами, количеством и характеристиками.
   - Извлеки каждый товар с наименованием, количеством, единицами измерения, габаритами, техническими параметрами, кодом ОКПД2/КТРУ и статусом требований по нацрежиму (ПП РФ 1875 / ПП РФ 616 / ПП РФ 617 / ПП РФ 878: "RUSSIAN_REQUIRED", "RESTRICTED", "NOT_APPLICABLE", "UNKNOWN").
   - Если в документах 3, 5, 10 или 20 позиций — верни ВСЕ эти позиции отдельными объектами в массиве "productList"!

5. ШАБЛОНЫ ДОКУМЕНТОВ ("generatedTemplates"):
   - Автоматически сгенерируй полные, готовые к отправке тексты документов с подстановкой реальных названий закупки и заказчика.`;

    const safeContract = extractHighPriorityDocumentSections(contractText || "", 26000) || "Не предоставлен";
    const safeDoc = extractHighPriorityDocumentSections(documentationText || "", 26000) || "Не предоставлен";
    const safeTz = extractHighPriorityDocumentSections(tzText || "", 30000) || "Не предоставлен";

    const promptText = `
Тип процедуры: ${procedureType || "Не указан"}
Дополнительные примечания: ${additionalNotes || "Отсутствуют"}

--- ТЕКСТ ПРОЕКТА ДОГОВОРА / КОНТРАКТА ---
${safeContract}

--- ТЕКСТ ДОКУМЕНТАЦИИ / ИЗВЕЩЕНИЯ ЗАКУПКИ ---
${safeDoc}

--- ТЕКСТ ТЕХНИЧЕСКОГО ЗАДАНИЯ, СПЕЦИФИКАЦИЙ И ТАБЛИЦ ---
${safeTz}

ВНИМАНИЕ: Извлеки РЕАЛЬНЫЕ даты, РЕАЛЬНЫЕ адреса, РЕАЛЬНЫЕ суммы, ИНН, РЕАЛЬНЫЕ штрафы и товары из текста выше!
ОБЯЗАТЕЛЬНО ВЕРНИ СТРОГИЙ JSON ОБЪЕКТ ПО СЛЕДУЮЩЕЙ СХЕМЕ:
{
  "summary": {
    "procurementTitle": "Реальное наименование закупки из документов",
    "projectName": "Номер закупки или название проекта",
    "customerName": "Реальное наименование Заказчика",
    "customerInn": "ИНН заказчика (например 7707083893)",
    "procurementSum": "Реальная НМЦК / сумма договора (например 1 450 000,00 ₽)",
    "auctionDate": "Реальная дата и время окончания подачи заявок / проведения аукциона (например 25.08.2025 в 10:00 МСК)",
    "overallRiskScore": 45,
    "riskLevel": "MEDIUM",
    "keyTakeaway": "Развернутое юридическое резюме по рискам, срокам поставки и ответственности",
    "is223FZ": false
  },
  "deliveryInfo": {
    "deliveryPeriod": "Точный срок поставки из договора/ТЗ",
    "deliveryScheduleNotice": "Порядок подачи заявок и уведомлений Заказчика",
    "deliveryAddresses": [
      "Точный адрес склада / места поставки 1"
    ],
    "unloadingAndAccessConditions": "Условия разгрузки, подъем на этаж, пропускной режим, рабочие часы",
    "consigneeDetails": "Грузополучатель, контакты и телефон",
    "riskWarning": "Оценка логистических рисков"
  },
  "contractRisks": [
    {
      "id": "risk-1",
      "category": "PENALTIES",
      "clauseNumber": "п. 7.2",
      "clauseQuote": "Точная цитата из текста договора",
      "severity": "HIGH",
      "title": "Штрафы по ПП РФ № 1042 и пени 1/300 ставки ЦБ РФ",
      "explanation": "Разъяснение риска и нормативное обоснование",
      "recommendation": "Рекомендация поставщику"
    }
  ],
  "submissionRulesCheck": {
    "procedureType": "${procedureType || '44_FZ_AUCTION'}",
    "requestInTableRequired": true,
    "etpAccreditationNotice": "Требования к регистрации в ЕРУЗ ЕИС / на ЭТП",
    "requiredFilesStructure": [
      "1. Заявка на участие с конкретными показателями товара",
      "2. Документы подтверждения страны происхождения"
    ],
    "formsRequirement": "Требования к оформлению документов и согласий",
    "pp1875Applies": true,
    "pp1875Details": "Требования нацрежима",
    "accountingInfoNeeded": false,
    "accountingItems": ["Справка об отсутствии задолженности"]
  },
  "postAwardWorkflow": {
    "deliveryNotifications": "Порядок уведомления Заказчика о готовности к отгрузке",
    "primaryDocFormatConfirmation": "Электронный УПД в ЕИС / система ЭДО",
    "accompanyingDocs": ["Электронный УПД", "Транспортная накладная", "Сертификат качества"],
    "acceptanceDocsStrategy": "Порядок и сроки приемки (до 20 рабочих дней в ЕИС)",
    "motivatedRefusalGuide": "Действия при мотивированном отказе Заказчика"
  },
  "productList": [
    {
      "id": "prod-1",
      "name": "Реальное наименование товара из ТЗ",
      "quantity": "Количество и единицы",
      "dimensions": "Габариты и размеры из ТЗ",
      "specification": "Техническое описание из ТЗ",
      "parameters": [{"name": "Параметр", "value": "Значение"}],
      "okpd2OrGvin": "Код ОКПД2 / КТРУ",
      "pp1875Status": "RUSSIAN_REQUIRED",
      "registryNumberNote": "Требование номера записи реестра Минпромторга"
    }
  ],
  "generatedTemplates": {
    "acceptanceDocsRequest": "Полный текст уведомления о поставке и подписании электронного УПД",
    "motivatedRefusalDemand": "Полный текст требования мотивированного отказа при претензиях",
    "etpFundsRequest": "Заявление о возврате/разблокировании обеспечения",
    "accountingDataRequest": "Служебная записка в бухгалтерию",
    "yougileTaskSummary": "Карточка задачи для CRM/Yougile",
    "claimResponseTemplate": "Шаблон ответа на претензию заказчика"
  }
}
`;

    // Wrap LLM call with a 14-second timeout to prevent stalling
    const llmPromise = callUniversalLLM({
      llmConfig,
      prompt: promptText,
      systemInstruction,
      responseJsonFormat: true,
      temperature: llmConfig?.temperature ?? 0.2
    });
    const timeoutPromise = new Promise<{ text: string; modelUsed: string }>((_, reject) =>
      setTimeout(() => reject(new Error("LLM analysis timeout exceeded")), 14000)
    );

    const llmResult = await Promise.race([llmPromise, timeoutPromise]);

    const analysisData = extractJsonFromLLMResponse(llmResult.text);
    analysisData._aiAnalysisStatus = 'LLM_AI_VERIFIED';
    analysisData._modelUsed = llmResult.modelUsed || llmConfig?.modelName || 'gemini';

    // Verify product extraction: if productList is empty or collapsed into 1 generic umbrella item, enrich from document corpus
    const fullCorpus = `${tzText || ''}\n\n${contractText || ''}\n\n${documentationText || ''}`;
    const is44FZ = Boolean(procedureType && procedureType.startsWith('44_FZ')) || /44-фз|сорок четверт/i.test(fullCorpus);

    if (
      !analysisData.productList ||
      analysisData.productList.length === 0 ||
      (analysisData.productList.length === 1 &&
        (isGenericServerUmbrellaName(analysisData.productList[0]?.name || '') ||
          analysisData.productList[0]?.name === analysisData.summary?.procurementTitle))
    ) {
      const recoveredProducts = extractIndividualProductsServer(
        fullCorpus,
        is44FZ,
        analysisData.summary?.procurementTitle || 'Офисная мебель'
      );
      if (recoveredProducts.length > 0) {
        analysisData.productList = recoveredProducts;
      }
    }
    
    // Store in cache for ultra-fast repeats
    setAnalysisInCache(cacheKey, analysisData);

    res.setHeader('X-Cache-Status', 'MISS');
    res.json(analysisData);
  } catch (error: any) {
    console.info("[Analyzer] Generating dynamic heuristic analysis from uploaded text:", error?.message);
    const { contractText, tzText, documentationText, procedureType } = req.body || {};
    const dynamicData = generateDynamicDocumentAnalysis(contractText, tzText, documentationText, procedureType);
    res.json(dynamicData);
  }
});

/**
 * Intelligent Dynamic Document Analyzer for fallback / offline parsing.
 * Thoroughly analyzes uploaded texts via multi-pass regex & semantic extraction.
 */
export function generateDynamicDocumentAnalysis(
  contractText: string = "",
  tzText: string = "",
  documentationText: string = "",
  procedureType: string = "44_FZ_AUCTION"
) {
  const fullCorpus = `${contractText}\n\n${documentationText}\n\n${tzText}`;
  const is44FZ = Boolean(procedureType && procedureType.startsWith('44_FZ')) || /44-фз|сорок четверт|государственн[а-я\s]+контракт/i.test(fullCorpus);

  // 1. EXTRACT PROCUREMENT TITLE
  let extractedTitle = "";
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
      ? "Государственная закупка по 44-ФЗ (по данным загруженной документации)"
      : "Тендерная закупка по 223-ФЗ / Коммерческим торгам (по данным загруженных документов)";
  }

  // 2. EXTRACT CUSTOMER NAME & INN
  let extractedCustomer = "";
  let extractedInn = "";
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
      if (candidate.length >= 3 && !candidate.toLowerCase().includes("поставщик") && !candidate.toLowerCase().includes("подрядчик")) {
        extractedCustomer = candidate;
        break;
      }
    }
  }
  if (!extractedCustomer) {
    extractedCustomer = is44FZ ? 'Государственный заказчик (44-ФЗ)' : 'Заказчик закупки';
  }

  // 3. EXTRACT CONTRACT / PROCUREMENT SUM
  let extractedSum = "";
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
    extractedSum = "По спецификации / Расчетная цена";
  }

  // 4. EXTRACT AUCTION & SUBMISSION DATES
  let extractedAuctionDate = "";
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
      if (d.length >= 5 && !d.toLowerCase().includes("контракт")) {
        extractedAuctionDate = d;
        break;
      }
    }
  }
  if (!extractedAuctionDate) {
    extractedAuctionDate = "По извещению в ЕИС / на ЭТП";
  }

  // 5. EXTRACT DELIVERY DATES AND ADDRESSES
  let deliveryPeriod = "";
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
      ? "В течение установленного контрактом срока с даты заключения (электронное актирование в ЕИС)."
      : "В соответствии с графиком и условиями договора по заявкам Заказчика.";
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
      if (rawAddr.length > 8 && !deliveryAddresses.includes(rawAddr) && !rawAddr.toLowerCase().includes("согласно приложению")) {
        deliveryAddresses.push(rawAddr);
      }
    }
  }
  if (deliveryAddresses.length === 0) {
    deliveryAddresses.push("По адресу Заказчика согласно разделу «Место поставки товара» документации");
  }

  // 6. EXTRACT PRODUCTS FROM SPECIFICATION
  const productList: any[] = extractIndividualProductsServer(
    fullCorpus,
    is44FZ,
    extractedTitle
  );

  // 7. EXTRACT REAL CONTRACT RISKS & PENALTIES
  const contractRisks: any[] = [];
  
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

  const paymentMatch = contractText.match(/(?:оплата|расчет)[^\n.]{0,100}(?:7 рабочих дней|10 рабочих дней|30 дней|банковских дней|еис|упд)[^\n.]{0,180}\./i);
  contractRisks.push({
    id: 'risk-dyn-3',
    category: 'PAYMENT_TERMS',
    clauseNumber: 'Раздел «Порядок расчетов»',
    clauseQuote: paymentMatch ? paymentMatch[0].trim() : (is44FZ ? 'Оплата осуществляется в срок не более 7 рабочих дней со дня подписания электронного документа о приемке в ЕИС.' : 'Оплата производится после приемки товара и подписания закрывающих документов.'),
    severity: is44FZ ? 'LOW' : 'MEDIUM',
    title: is44FZ ? 'Регламентный срок оплаты Заказчиком: 7 рабочих дней через ЕИС' : 'Сроки оплаты и подписание закрывающих документов',
    explanation: is44FZ
      ? 'По ч. 13.1 ст. 34 ФЗ № 44 срок оплаты строго ограничен 7 рабочими днями со дня подписания электронного УПД Заказчиком в ЕИС.'
      : 'Контролируйте дату фактического получения закрывающих документов Заказчиком во избежание затягивания оплаты.',
    recommendation: 'Формируйте электронный УПД в личном кабинете ЕИС строго в день фактической доставки товара на склад Заказчика.'
  });

  const overallRiskScore = contractRisks.some(r => r.severity === 'CRITICAL') ? 74 : is44FZ ? 45 : 60;

  return {
    _aiAnalysisStatus: 'HEURISTIC_PARSED',
    summary: {
      procurementTitle: extractedTitle,
      projectName: `Закупка: ${extractedTitle.slice(0, 60)}...`,
      customerName: extractedCustomer,
      customerInn: extractedInn || undefined,
      procurementSum: extractedSum,
      auctionDate: extractedAuctionDate,
      overallRiskScore,
      riskLevel: overallRiskScore > 70 ? "CRITICAL" : overallRiskScore > 40 ? "MEDIUM" : "LOW",
      keyTakeaway: is44FZ
        ? `Закупка по 44-ФЗ для "${extractedCustomer}". Контроль сроков оплаты (7 р.д. в ЕИС), расчет штрафов по ПП № 1042 и законное право списания неустоек по ПП № 783.`
        : `Закупка по 223-ФЗ/B2B для "${extractedCustomer}". Неустойки по договору не подлежат обязательному списанию, требуется строгий контроль условий поставки и закрывающих документов.`,
      is223FZ: !is44FZ,
    },
    deliveryInfo: {
      deliveryPeriod,
      deliveryScheduleNotice: "Поставка осуществляется в соответствии с согласованным графиком или заявками Заказчика.",
      deliveryAddresses,
      unloadingAndAccessConditions: "Разгрузка, подъем на этаж и оформление пропусков осуществляются согласно регламенту Заказчика.",
      consigneeDetails: extractedCustomer,
      riskWarning: "Соблюдайте согласованные сроки поставки для предотвращения претензионной работы и начисления пеней.",
    },
    contractRisks,
    submissionRulesCheck: {
      procedureType: procedureType || (is44FZ ? "44_FZ_AUCTION" : "223_FZ_QUOTATION"),
      requestInTableRequired: true,
      etpAccreditationNotice: is44FZ ? "Аккредитация в ЕРУЗ ЕИС и спецсчет для обеспечения заявки обязательны." : "Проверить регистрацию и баланс на ЭТП за 48 часов до окончания подачи.",
      requiredFilesStructure: is44FZ
        ? [
            "1. Заявка на участие с конкретными показателями товара (без указания наименования участника)",
            "2. Документы подтверждения страны происхождения товара (реестровые номера ГИСП / РЭП при нацрежиме)",
            "3. Декларация соответствия единым требованиям ст. 31 44-ФЗ"
          ]
        : [
            "1. Заявка участника по установленной форме Заказчика (Форма №1, Согласие)",
            "2. Техническое предложение с конкретными характеристиками товара",
            "3. Уставные документы, выписка ЕГРЮЛ и одобрение крупной сделки",
            "4. Ценовое предложение на ЭТП"
          ],
      formsRequirement: is44FZ ? "Подача через функционал ЭТП в структурированном виде." : "Строгое заполнение установленных форм Заказчика.",
      pp1875Applies: is44FZ,
      pp1875Details: is44FZ ? "Применяются правила нацрежима (ПП РФ № 1875 / ПП РФ № 616 / ПП РФ № 878)." : "Требования устанавливаются Положением о закупке Заказчика.",
      accountingInfoNeeded: !is44FZ,
      accountingItems: is44FZ
        ? ["Справка об отсутствии задолженности (сверка ФНС через ЕИС)", "Выписка ЕГРЮЛ из ЕРУЗ"]
        : ["Бухгалтерский баланс (Форма №1, №2)", "Справка об отсутствии задолженности по налогам"]
    },
    postAwardWorkflow: {
      deliveryNotifications: "Уведомление Заказчика о готовности к отгрузке за 24-48 часов до прибытия транспорта.",
      primaryDocFormatConfirmation: is44FZ ? "Электронное актирование: формирование документа о приемке (электронный УПД) в ЕИС Закупки." : "Формирование УПД (статус 1) через систему ЭДО или на бумажном носителе.",
      accompanyingDocs: is44FZ ? ["Электронный УПД в ЕИС", "Транспортная накладная", "Паспорт качества / сертификат соответствия"] : ["УПД / ТОРГ-12", "Сертификат соответствия / декларация", "Паспорт изделия"],
      acceptanceDocsStrategy: "Обязательная фиксация даты и подписи уполномоченного лица Заказчика в акте/накладной.",
      motivatedRefusalGuide: "При отказе в приемке требовать письменный мотивированный отказ с указанием конкретных пунктов несоответствия."
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
}

/**
 * Smart Insights AI Generator: generates 3-5 specific, high-priority clarification questions
 * to ask the customer based on extracted procurement risks, contract terms, delivery constraints, and specifications.
 */
analyzerRouter.post("/smart-insights", async (req, res) => {
  try {
    const { summary, contractRisks, deliveryInfo, submissionRulesCheck, productList, llmConfig } = req.body || {};

    const risksList = Array.isArray(contractRisks) ? contractRisks : [];
    const is223 = summary?.is223FZ ?? false;
    const customer = summary?.customerName || "Заказчик";
    const title = summary?.procurementTitle || "Закупка";

    const systemInstruction = `Ты — ведущий юрист и эксперт по закупкам в РФ (44-ФЗ, 223-ФЗ, ГК РФ).
Твоя задача — проанализировать выявленные риски, условия контракта, график поставки и спецификацию и сформировать 3-5 ТОЧНЫХ, КРИТИЧЕСКИ ВАЖНЫХ вопросов (запросов на разъяснение положений извещения/документации), которые участник закупки ОБЯЗАН задать Заказчику до подачи заявки или заключения контракта.

ЦЕЛЬ ВОПРОСОВ:
1. Устранить юридические двусмысленности (штрафы, списание по ПП № 783, односторонний отказ, удержание из оплаты).
2. Зафиксировать прозрачные условия поставки, разгрузки, пропускного режима и приемки (электронный УПД в ЕИС по 44-ФЗ).
3. Снять противоречия в ТЗ (габариты, материалы, эквиваленты по ст. 33 44-ФЗ, реестровые номера Минпромторга / ПП 1875).
4. Защитить поставщика от неправомерного включения в РНП и необоснованных претензий.

ТРЕБОВАНИЯ К ФОРМАТУ:
Верни СТРОГИЙ JSON со списком от 3 до 5 вопросов.
Схема каждого элемента массива "questions":
{
  "id": "insight-q-1",
  "category": "PENALTIES" | "DELIVERY_LOGISTICS" | "TECHNICAL_SPEC" | "NATIONAL_REGIME" | "PAYMENT_TERMS" | "ACCEPTANCE_EIS" | "OTHER",
  "categoryLabel": "Штрафы и неустойки" / "Логистика и приемка" / "Техническое задание" / "Нацрежим и реестр" / "Оплата и обеспечение",
  "priority": "HIGH" | "MEDIUM" | "RECOMMENDED",
  "relatedRiskOrClause": "Ссылка на пункт договора или риск (например: 'п. 7.2 Договора', 'Раздел II ТЗ', 'Сроки оплаты')",
  "title": "Краткая суть вопроса (1 строка)",
  "rationale": "Разъяснение: почему поставщик обязан задать этот вопрос и какой финансовый/юридический риск он нейтрализует",
  "questionText": "Официальный текст вопроса Заказчику в строгом деловом стиле для направления через ЭТП/ЕИС",
  "expectedOutcome": "Ожидаемый ответ Заказчика или изменение документации",
  "legalBasis": "Ссылка на закон (например: ч. 13.1 ст. 34 44-ФЗ, ПП РФ № 1042, ст. 33 44-ФЗ, ст. 3.2 223-ФЗ)"
}`;

    const promptText = `
ДАННЫЕ ЗАКУПКИ:
- Наименование: ${title}
- Заказчик: ${customer} ${summary?.customerInn ? `(ИНН ${summary?.customerInn})` : ''}
- Закон: ${is223 ? '223-ФЗ' : '44-ФЗ'}
- Сумма / НМЦК: ${summary?.procurementSum || 'Не указана'}
- Срок поставки: ${deliveryInfo?.deliveryPeriod || 'По контракту'}
- Адреса поставки: ${Array.isArray(deliveryInfo?.deliveryAddresses) ? deliveryInfo.deliveryAddresses.join('; ') : 'По ТЗ'}
- Условия разгрузки: ${deliveryInfo?.unloadingAndAccessConditions || 'По регламенту'}

ВЫЯВЛЕННЫЕ РИСКИ ДОГОВОРА (${risksList.length} рисков):
${risksList.map((r, i) => `${i + 1}. [${r.severity || 'HIGH'}] ${r.clauseNumber || ''} ${r.title || ''}: ${r.explanation || ''} (${r.recommendation || ''})`).join('\n')}

СПЕЦИФИКАЦИЯ ТОВАРОВ:
${Array.isArray(productList) ? productList.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} (Кол-во: ${p.quantity}, Размеры: ${p.dimensions || '—'}, ПП 1875: ${p.pp1875Status || '—'})`).join('\n') : 'Товары по ТЗ'}

Сформируй от 3 до 5 наиболее острых, прикладных и юридически грамотных вопросов Заказчику.
Ответь СТРОГО в формате JSON:
{
  "questions": [ ... ]
}`;

    try {
      const llmResult = await callUniversalLLM({
        llmConfig,
        prompt: promptText,
        systemInstruction,
        responseJsonFormat: true,
        temperature: 0.2
      });

      const parsed = extractJsonFromLLMResponse(llmResult.text);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return res.json({
          questions: parsed.questions.slice(0, 5),
          modelUsed: llmResult.modelUsed || "Gemini Flash",
          generatedAt: new Date().toISOString()
        });
      }
    } catch (llmErr: any) {
      console.warn("[Smart Insights] LLM generation error, falling back to rule-based insights:", llmErr?.message);
    }

    // Fallback: Generate heuristic high-quality questions based on extracted risks & parameters
    const fallbackQuestions = generateFallbackSmartInsights(summary, risksList, deliveryInfo, productList);
    return res.json({
      questions: fallbackQuestions,
      modelUsed: "Rule-Based Expert Engine (Fallback)",
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Smart Insights] Fatal error:", error);
    res.status(500).json({ error: "Не удалось сформировать умные рекомендации." });
  }
});

/**
 * Heuristic fallback for generating 3-5 smart questions to customer
 */
function generateFallbackSmartInsights(
  summary: any,
  risks: any[],
  deliveryInfo: any,
  productList: any[]
): any[] {
  const is223 = summary?.is223FZ ?? false;
  const questions: any[] = [];

  // Question 1: Penalties / PP 783 / 1042
  if (is223) {
    questions.push({
      id: "insight-q-1",
      category: "PENALTIES",
      categoryLabel: "Штрафы и неустойки",
      priority: "HIGH",
      relatedRiskOrClause: "Раздел ответственности проекта Договора",
      title: "Соразмерность неустойки и порядок досудебного урегулирования",
      rationale: "По 223-ФЗ нормы о списании неустоек по ПП РФ № 783 автоматически не действуют. Высокие пени создают риск финансовой потери при малейшей задержке.",
      questionText: "В соответствии с проектом договора установлена неустойка за просрочку поставки. Просим разъяснить, предусматривает ли Заказчик применение положений о соразмерном снижении неустойки при отсутствии вины поставщика, а также уточнить порядок фиксации даты фактической готовности товара к отгрузке.",
      expectedOutcome: "Заказчик подтвердит порядок учета обстоятельств непреодолимой силы и процедуру уведомления о готовности.",
      legalBasis: "ст. 330, 401 ГК РФ, Федеральный закон № 223-ФЗ"
    });
  } else {
    questions.push({
      id: "insight-q-1",
      category: "PENALTIES",
      categoryLabel: "Штрафы и неустойки",
      priority: "HIGH",
      relatedRiskOrClause: "п. 7.2-7.5 Контракта (Ответственность сторон)",
      title: "Применение Постановления Правительства РФ № 783 о списании неустоек",
      rationale: "Заказчики часто 'забывают' включить в проект контракта прямую норму об обязанности списания начисленных штрафов/пеней в силу ПП РФ № 783.",
      questionText: "Просим подтвердить, что в случае начисления штрафов и пеней при исполнении контракта Заказчик осуществляет их списание в строгом соответствии с Постановлением Правительства РФ от 04.07.2018 № 783, и внести соответствующее положение в проект государственного контракта.",
      expectedOutcome: "Заказчик подтвердит обязательность положений ПП РФ № 783 в официальном разъяснении.",
      legalBasis: "ч. 9.1 ст. 34 44-ФЗ, Постановление Правительства РФ № 783"
    });
  }

  // Question 2: Delivery conditions / Unloading / Working hours
  const hasMultipleAddresses = Array.isArray(deliveryInfo?.deliveryAddresses) && deliveryInfo.deliveryAddresses.length > 1;
  questions.push({
    id: "insight-q-2",
    category: "DELIVERY_LOGISTICS",
    categoryLabel: "Логистика и разгрузка",
    priority: "HIGH",
    relatedRiskOrClause: "Раздел 'Сроки и условия поставки' / График разгрузки",
    title: "Уточнение режима разгрузки, пропускного режима и этажа подъема",
    rationale: "Неопределенность с пропускным режимом и разгрузкой силами поставщика может привести к простою транспорта и срыву регламентного срока сдачи.",
    questionText: `Просим уточнить график работы склада Заказчика для приема груза, порядок заблаговременного оформления пропусков на водителей и автотранспорт, а также подтвердить наличие грузового лифта для подъема товара на этажи.${hasMultipleAddresses ? ' Просим также конкретизировать распределение объема товара по указанным в извещении адресам.' : ''}`,
    expectedOutcome: "Заказчик предоставит точные часы работы склада, контакты ответственного лица и правила пропуска.",
    legalBasis: "ст. 509, 513 ГК РФ"
  });

  // Question 3: Acceptance and E-Invoicing (EIS)
  if (!is223) {
    questions.push({
      id: "insight-q-3",
      category: "ACCEPTANCE_EIS",
      categoryLabel: "Электронное актирование в ЕИС",
      priority: "HIGH",
      relatedRiskOrClause: "Порядок приемки товара и подписания электронного УПД",
      title: "Срок подписания документа о приемке в ЕИС и оплаты",
      rationale: "По закону срок оплаты не должен превышать 7 рабочих дней, а срок рассмотрения электронного УПД в ЕИС — не более 20 рабочих дней. Затягивание приемки блокирует оборотные средства.",
      questionText: "Просим подтвердить, что приемка поставленного товара осуществляется исключительно путем формирования и подписания электронного документа о приемке (электронный УПД) в ЕИС Закупки в регламентный срок не более 20 рабочих дней, а оплата производится в срок не более 7 рабочих дней с даты подписания документа в ЕИС.",
      expectedOutcome: "Заказчик подтвердит соблюдение требований ч. 13.1 ст. 34 44-ФЗ.",
      legalBasis: "ч. 13.1 ст. 34 Федерального закона № 44-ФЗ"
    });
  } else {
    questions.push({
      id: "insight-q-3",
      category: "PAYMENT_TERMS",
      categoryLabel: "Оплата и закрывающие документы",
      priority: "HIGH",
      relatedRiskOrClause: "Раздел 'Порядок расчетов'",
      title: "Сроки рассмотрения актов и отсутствие скрытых отсрочек платежа",
      rationale: "Заказчик может затягивать подписание закрывающих актов без мотивированного отказа, откладывая дату начала отсчета срока оплаты.",
      questionText: "Просим уточнить предельный срок рассмотрения и подписания товарной накладной / акта приема-передачи Заказчиком с момента доставки товара, а также зафиксировать, что при отсутствии мотивированного отказа в течение установленного срока товар считается принятым в полном объеме.",
      expectedOutcome: "Фиксация предельного срока приемки (не более 5-10 рабочих дней).",
      legalBasis: "ст. 309, 310, 513 ГК РФ"
    });
  }

  // Question 4: Technical specification & Equivalents
  const firstProd = Array.isArray(productList) && productList[0];
  questions.push({
    id: "insight-q-4",
    category: "TECHNICAL_SPEC",
    categoryLabel: "Техническое задание",
    priority: "MEDIUM",
    relatedRiskOrClause: "Техническое задание (Спецификация)",
    title: "Допустимость поставки эквивалента и точность указанных диапазонов",
    rationale: "Жесткие, неизменяемые габариты или специфические артикулы без указания слов 'или эквивалент' ограничивают конкуренцию и влекут отклонение заявки.",
    questionText: `Просим подтвердить возможность предложения товара с эквивалентными техническими и качественными характеристиками${firstProd ? ` для позиции «${firstProd.name}»` : ''}, не ухудшающими эксплуатационные свойства, согласно требованиям законодательства о закупках.`,
    expectedOutcome: "Заказчик подтвердит эквивалентность и разъяснит допустимые диапазоны отклонения.",
    legalBasis: "п. 1 ч. 1 ст. 33 44-ФЗ / ч. 6.1 ст. 3 223-ФЗ"
  });

  // Question 5: National regime / Registry records (PP 1875 / PP 616 / PP 878)
  questions.push({
    id: "insight-q-5",
    category: "NATIONAL_REGIME",
    categoryLabel: "Нацрежим и реестровые номера",
    priority: "RECOMMENDED",
    relatedRiskOrClause: "Требования к составу заявки (Нацрежим)",
    title: "Порядок подтверждения страны происхождения и реестровых записей ГИСП",
    rationale: "Ошибки в указании реестровых номеров реестра российской промышленной продукции приводят к автоматическому отклонению заявки или неприменению преференций.",
    questionText: "Просим разъяснить, является ли обязательным указание в составе заявки номера реестровой записи из Реестра российской промышленной продукции (ГИСП) на этапе подачи заявки, либо достаточно декларирования страны происхождения товара с предоставлением выписки при отгрузке.",
    expectedOutcome: "Четкое понимание состава документов первой и второй частей заявки.",
    legalBasis: "Постановление Правительства РФ № 1875 / ПП РФ № 616"
  });

  return questions;
}

/**
 * AI Quick Follow-Up Endpoint: generates detailed thematic reports on demand
 * (e.g. Analyze Payment Terms, Check Delivery Deadlines, Summarize Legal Obligations, etc.)
 */
analyzerRouter.post("/quick-followup", async (req, res) => {
  try {
    const { actionType, summary, contractRisks, deliveryInfo, submissionRulesCheck, productList, llmConfig } = req.body || {};

    const risksList = Array.isArray(contractRisks) ? contractRisks : [];
    const is223 = summary?.is223FZ ?? false;
    const customer = summary?.customerName || "Заказчик";
    const title = summary?.procurementTitle || "Закупка";

    const promptContext = `
ДАННЫЕ ЗАКУПКИ:
- Наименование: ${title}
- Заказчик: ${customer} ${summary?.customerInn ? `(ИНН ${summary?.customerInn})` : ''}
- Закон: ${is223 ? '223-ФЗ' : '44-ФЗ'}
- Сумма / НМЦК: ${summary?.procurementSum || 'Не указана'}
- Срок поставки: ${deliveryInfo?.deliveryPeriod || 'По контракту'}
- Адреса поставки: ${Array.isArray(deliveryInfo?.deliveryAddresses) ? deliveryInfo.deliveryAddresses.join('; ') : 'По ТЗ'}
- Условия разгрузки: ${deliveryInfo?.unloadingAndAccessConditions || 'По регламенту'}

РИСКИ ДОГОВОРА:
${risksList.map((r, i) => `${i + 1}. [${r.severity || 'HIGH'}] ${r.clauseNumber || ''} ${r.title || ''}: ${r.explanation || ''}`).join('\n')}

СПЕЦИФИКАЦИЯ ТОВАРОВ:
${Array.isArray(productList) ? productList.slice(0, 5).map((p, i) => `- ${p.name} (Кол-во: ${p.quantity}, ПП 1875: ${p.pp1875Status || '—'})`).join('\n') : 'Товары по ТЗ'}
`;

    let systemInstruction = "";
    let userPrompt = "";

    switch (actionType) {
      case "PAYMENT_TERMS":
        systemInstruction = `Ты — эксперт по финансово-правовому анализу госзакупок и коммерческих контрактов (44-ФЗ, 223-ФЗ).
Проведи детальный экспресс-аудит условий оплаты, расчетов и финансовой безопасности поставщика.
Верни JSON со следующей структурой:
{
  "title": "Анализ условий оплаты и финансовых расчетов",
  "keyParameters": [
    { "label": "Срок оплаты", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Авансирование", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Электронное актирование", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Казначейское/банковское сопровождение", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" }
  ],
  "criticalFindings": ["Ключевой риск 1", "Ключевой риск 2", ...],
  "hiddenTraps": ["Скрытая ловушка в договоре 1", ...],
  "actionPlan": ["Шаг 1 поставщику", "Шаг 2 поставщику", ...],
  "recommendedQuestionsToCustomer": ["Вопрос Заказчику 1", "Вопрос Заказчику 2"],
  "legalCitations": ["ч. 13.1 ст. 34 44-ФЗ", "ст. 314 ГК РФ", ...]
}`;
        userPrompt = `Проанализируй условия оплаты по данной закупке:\n${promptContext}`;
        break;

      case "DELIVERY_DEADLINES":
        systemInstruction = `Ты — ведущий специалист по логистике и срокам исполнения контрактов в закупках.
Проведи экспресс-аудит сроков поставки, этапов, условий сдачи товара и рисков логистического срыва.
Верни JSON со структурой:
{
  "title": "Проверка сроков поставки и логистических рисков",
  "keyParameters": [
    { "label": "Регламентный срок поставки", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Срочность / Календарные vs Рабочие дни", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Разгрузка и подъем на этаж", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Пропускной режим и адреса", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" }
  ],
  "criticalFindings": ["Ключевой вывод 1", "Ключевой вывод 2"],
  "hiddenTraps": ["Ловушка с просрочкой 1", ...],
  "actionPlan": ["Действие 1", "Действие 2"],
  "recommendedQuestionsToCustomer": ["Вопрос по логистике 1", "Вопрос по логистике 2"],
  "legalCitations": ["ст. 509 ГК РФ", "ст. 513 ГК РФ", "ст. 327.1 ГК РФ"]
}`;
        userPrompt = `Проанализируй сроки и логистику поставки:\n${promptContext}`;
        break;

      case "LEGAL_OBLIGATIONS":
      default:
        systemInstruction = `Ты — главный юрисконсульт по тендерному праву.
Сформируй исчерпывающую сводку юридических обязательств, гарантий, санкций за расторжение и прав поставщика.
Верни JSON со структурой:
{
  "title": "Сводка юридических обязательств и защита прав поставщика",
  "keyParameters": [
    { "label": "Обеспечение исполнения / Гарантийных обязательств", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Односторонний отказ Заказчика", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Гарантийный срок и выезд специалиста", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" },
    { "label": "Подсудность и досудебный порядок", "value": "...", "status": "SAFE" | "WARNING" | "CRITICAL" }
  ],
  "criticalFindings": ["Обязательство 1", "Обязательство 2"],
  "hiddenTraps": ["Юридическая ловушка 1", ...],
  "actionPlan": ["Юридическая рекомендация 1", "Юридическая рекомендация 2"],
  "recommendedQuestionsToCustomer": ["Вопрос по контракту 1"],
  "legalCitations": ["ст. 95 44-ФЗ", "ст. 450.1 ГК РФ", "ст. 333 ГК РФ"]
}`;
        userPrompt = `Сформируй сводку юридических обязательств поставщика:\n${promptContext}`;
        break;
    }

    try {
      const llmResult = await callUniversalLLM({
        llmConfig,
        prompt: userPrompt,
        systemInstruction,
        responseJsonFormat: true,
        temperature: 0.2
      });

      const parsed = extractJsonFromLLMResponse(llmResult.text);
      if (parsed && parsed.title && Array.isArray(parsed.keyParameters)) {
        return res.json({
          report: parsed,
          modelUsed: llmResult.modelUsed || "Gemini Flash",
          generatedAt: new Date().toISOString()
        });
      }
    } catch (llmErr: any) {
      console.warn("[Quick Follow-up] LLM generation error, falling back to expert rule engine:", llmErr?.message);
    }

    // Fallback response generated deterministically
    const fallbackReport = generateFallbackQuickReport(actionType, summary, risksList, deliveryInfo, productList);
    return res.json({
      report: fallbackReport,
      modelUsed: "Rule-Based Expert Engine (Fallback)",
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Quick Follow-up] Fatal error:", error);
    res.status(500).json({ error: "Не удалось сформировать отчет по запросу." });
  }
});

function generateFallbackQuickReport(
  actionType: string,
  summary: any,
  risks: any[],
  deliveryInfo: any,
  productList: any[]
): any {
  const is223 = summary?.is223FZ ?? false;
  const deliveryPeriod = deliveryInfo?.deliveryPeriod || "По проекту контракта";
  const customer = summary?.customerName || "Заказчик";

  if (actionType === "PAYMENT_TERMS") {
    return {
      title: "Анализ условий оплаты и финансовых расчетов",
      keyParameters: [
        {
          label: "Срок оплаты",
          value: is223 ? "В течение 7-15 рабочих дней после подписания УПД" : "Не более 7 рабочих дней (ч. 13.1 ст. 34 44-ФЗ)",
          status: "SAFE"
        },
        {
          label: "Авансирование",
          value: "Аванс не предусмотрен (100% постоплата)",
          status: "WARNING"
        },
        {
          label: "Электронное актирование",
          value: is223 ? "ЭДО / Бумажные закрывающие документы" : "Обязательное актирование в ЕИС Закупки",
          status: is223 ? "SAFE" : "SAFE"
        },
        {
          label: "Удержание штрафов из оплаты",
          value: "Проверьте условие о безакцептном зачете неустойки Заказчиком",
          status: "WARNING"
        }
      ],
      criticalFindings: [
        "Оплата производится только после завершения полного цикла приемки и устранения всех возможных замечаний.",
        is223 
          ? "В 223-ФЗ срок оплаты может исчисляться не с момента поставки, а с даты подписания акта Заказчиком (риск затягивания)." 
          : "По 44-ФЗ срок оплаты строго ограничен 7 рабочими днями со дня подписания электронного документа о приемке в ЕИС."
      ],
      hiddenTraps: [
        "Необоснованное затягивание рассмотрения закрывающих документов без направления мотивированного отказа.",
        "Условие об оплате только при предоставлении оригиналов счетов/счетов-фактур на бумажном носителе."
      ],
      actionPlan: [
        "Сформировать электронный УПД в день фактической передачи товара на складе Заказчика.",
        "Фиксировать дату и входящий номер при сдаче сопроводительных документов уполномоченному лицу.",
        "При задержке подписания акта свыше установленного срока направить претензию с требованием мотивированного отказа."
      ],
      recommendedQuestionsToCustomer: [
        `Просим подтвердить, что срок оплаты по контракту исчисляется строго с даты подписания электронного документа о приемке в ЕИС и составляет не более 7 рабочих дней.`
      ],
      legalCitations: [
        is223 ? "ч. 9 ст. 3.2 223-ФЗ, ст. 309, 314 ГК РФ" : "ч. 13.1 ст. 34 Федерального закона № 44-ФЗ"
      ]
    };
  }

  if (actionType === "DELIVERY_DEADLINES") {
    return {
      title: "Проверка сроков поставки и логистических рисков",
      keyParameters: [
        {
          label: "Срок поставки",
          value: deliveryPeriod,
          status: deliveryPeriod.includes("дней") ? "WARNING" : "SAFE"
        },
        {
          label: "Исчисление срока",
          value: "Календарные дни с даты заключения контракта / получения заявки",
          status: "WARNING"
        },
        {
          label: "Условия разгрузки",
          value: deliveryInfo?.unloadingAndAccessConditions || "Силами и за счет Поставщика",
          status: "WARNING"
        },
        {
          label: "География поставки",
          value: Array.isArray(deliveryInfo?.deliveryAddresses) && deliveryInfo.deliveryAddresses.length > 1 ? `${deliveryInfo.deliveryAddresses.length} адресов разгрузки` : "Единый пункт доставки",
          status: Array.isArray(deliveryInfo?.deliveryAddresses) && deliveryInfo.deliveryAddresses.length > 1 ? "WARNING" : "SAFE"
        }
      ],
      criticalFindings: [
        `Срок поставки «${deliveryPeriod}» требует заблаговременного бронирования транспорта и подтверждения наличия товара на складе производителя.`,
        "Разгрузка на объекте Заказчика может потребовать заноса на этаж и предварительного согласования списка водителей для пропускного режима."
      ],
      hiddenTraps: [
        "Необходимость оформления пропусков за 24-48 часов до прибытия транспорта без продления срока поставки при простое.",
        "Узкие временные окна приемки груза на складе (например, только с 10:00 до 14:00 в будни)."
      ],
      actionPlan: [
        "Запросить контакты коменданта/начальника склада Заказчика сразу после публикации протокола.",
        "Направить уведомление об отгрузке с указанием госномеров и ФИО водителей минимум за 2 рабочих дня.",
        "Обеспечить наличие грузчиков или гидроборта на автомобиле для безопасной разгрузки."
      ],
      recommendedQuestionsToCustomer: [
        `Просим уточнить регламент работы склада Заказчика (${customer}), порядок оформления пропусков и наличие грузового лифта для подъема товара.`
      ],
      legalCitations: [
        "ст. 509 ГК РФ (Порядок поставки товаров)",
        "ст. 513 ГК РФ (Принятие товаров покупателем)",
        "ст. 401 ГК РФ (Основания ответственности за нарушение обязательства)"
      ]
    };
  }

  // Default: LEGAL_OBLIGATIONS
  return {
    title: "Сводка юридических обязательств и защита прав поставщика",
    keyParameters: [
      {
        label: "Обеспечение исполнения",
        value: "Независимая банковская гарантия или внесение денежных средств",
        status: "SAFE"
      },
      {
        label: "Односторонний отказ Заказчика",
        value: is223 ? "По правилам Положения о закупке и ГК РФ" : "По правилам ч. 8–26 ст. 95 44-ФЗ (с риском РНП)",
        status: "CRITICAL"
      },
      {
        label: "Гарантийные обязательства",
        value: "Гарантия качества на товар не менее 12-24 месяцев с даты приемки",
        status: "SAFE"
      },
      {
        label: "Подсудность споров",
        value: "Арбитражный суд по месту нахождения Заказчика",
        status: "WARNING"
      }
    ],
    criticalFindings: [
      "В случае одностороннего отказа Заказчика от исполнения контракта сведения о поставщике передаются в ФАС для включения в РНП.",
      "Поставщик обязан соблюдать претензионный порядок (срок ответа на претензию обычно 10–30 календарных дней)."
    ],
    hiddenTraps: [
      "Короткие сроки на замену брака (менее 5 дней), не учитывающие логистическое плечо от завода-изготовителя.",
      "Неустойка за ненадлежащее исполнение обязательств, не имеющих стоимостного выражения."
    ],
    actionPlan: [
      "Внимательно фиксировать акты рекламаций только в присутствии своего представителя или с фото/видеофиксацией.",
      "При получении претензии Заказчика предоставить мотивированный ответ в течение 5 рабочих дней.",
      "Использовать право на списание неустоек в соответствии с Постановлением Правительства РФ № 783 (для 44-ФЗ)."
    ],
    recommendedQuestionsToCustomer: [
      `Просим подтвердить порядок оформления рекламационных актов и срок устранения недостатков с учетом технологического цикла производства (не менее 10 рабочих дней).`
    ],
    legalCitations: [
      "ст. 95 44-ФЗ (Изменение, расторжение контракта)",
      "ст. 104 44-ФЗ (Реестр недобросовестных поставщиков)",
      "ст. 450.1, 475, 518 ГК РФ"
    ]
  };
}

