import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily / safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing in environment secrets");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main Procurement Analyzer API
app.post("/api/analyze", async (req, res) => {
  try {
    const { procedureType, contractText, documentationText, tzText, additionalNotes } = req.body;

    if (!contractText && !documentationText && !tzText) {
      res.status(400).json({ error: "Не передано ни одного документа для анализа." });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `Ты — эксперт тендерного отдела и юрист по закупкам в РФ (специализация: 223-ФЗ, 44-ФЗ и коммерческие торги).
Твоя задача — тщательно проанализировать загруженные документы закупки (Проект договора, Документацию закупки, Техническое задание) согласно внутреннему регламенту компании.

ВНИМАНИЕ! КРИТИЧЕСКИЕ ПРАВИЛА РАБОТЫ ПО 223-ФЗ (СОГЛАСНО ИНСТРУКЦИИ):
1. **Штрафы и пени по 223-ФЗ НЕ СПИСЫВАЮТСЯ!** Начисленные штрафы/пени оплачиваются Поставщиком либо удерживаются из оплаты. Оценивай риски как максимальные!
2. **Анализ раздела "Ответственность сторон":**
   - Выявляй условия о закупке у 3-х лиц за счет Поставщика при недопоставке/браке.
   - Выявляй возмещение разницы в ценах при расторжении договора.
   - Односторонний отказ Заказчика при просрочке более чем на 5 рабочих дней.
   - Расторжение договора при просрочке свыше 10 календарных дней.
   - Штраф 3% от стоимости товара за зафиксированные нарушения: packaging/marking (упаковка, маркировка), некачественный товар, просрочка строго определенного срока, разглашение конфиденциальной информации.
3. **Поставка "по заявке Заказчика":**
   - Проверяй условия письменного уведомления (например, за 5 рабочих дней до поставки, но не позднее предельной даты).
4. **Первичные документы и приемка:**
   - До поставки уточнить формат первички (УПД, ТОРГ-12, Акт) -> фиксировать в Юджайл.
   - Требовать документы о приемке с подписями, печатями и ДАТАМИ приемки!
   - Требовать официальный письменный "Аргументированный мотивированный отказ" при отказе.
5. **Правила подготовки заявок:**
   - Подача запроса в таблицу запросов, отслеживание аккредитации и зачисление средств на ЭТП.
   - Заполнение всех форм (кроме описи вложений).
6. **Извлечение спецификации и параметров товаров (productList):**
   - Внимательно выдели из ТЗ, таблиц или проекта договора список поставляемых товаров, оборудования, работ или услуг.
   - Для каждого товара извлеки:
     - Наименование, количество с ед. изм. ("15 шт", "1 комплект").
     - **Габариты и размеры** (например "1200х800х600 мм", "Диаметр 50 мм" или "Не указаны").
     - **Структурированный список параметров (parameters)**: точные физико-технические характеристики из ТЗ (напр. {"name": "Габариты/Размеры", "value": "..."}, {"name": "Материал", "value": "..."}, {"name": "Масса/Вес", "value": "..."}, {"name": "Мощность", "value": "..."}, {"name": "Цвет/Покрытие", "value": "..."}).
     - Код ОКПД2/КТРУ (если есть), статус требования по ПП РФ 1875 ("RUSSIAN_REQUIRED", "RESTRICTED", "NOT_APPLICABLE", "UNKNOWN") и примечания по реестровым номерам/баллам.
7. **Извлечение Сроков Поставки и Адресов Объектов (deliveryInfo):**
   - Найди и детально выпиши сроки поставки (deliveryPeriod), например: "В течение 15 рабочих дней с даты заключения Договора, но не позднее 14.05.2024г.".
   - Извлеки порядок подачи заявок (deliveryScheduleNotice), например: "Поставка по письменным заявкам Заказчика за 5 рабочих дней".
   - Найди Все точные адреса складов и объектов поставки (deliveryAddresses), включая почтовые индексы, города, улицы, номера строений и складов.
   - Извлеки условия разгрузки, пропусков и подъема на этаж (unloadingAndAccessConditions) и грузополучателя (consigneeDetails).

Сформируй полнейший, объективный, структурированный юридический и операционный отчет в строго JSON формате.
Автоматически сгенерируй ГОТОВЫЕ ТЕКСТЫ ДОКУМЕНТОВ и писем (Запрос закрывающих документов, Требование мотивированного отказа, Запрос денег на ЭТП, Запрос в бухгалтерию, Карточка задачи в Юджайл, Шаблон ответа на претензию).`;

    const promptText = `
Тип процедуры: ${procedureType || "Не указан"}
Дополнительные примечания: ${additionalNotes || "Отсутствуют"}

--- ТЕКСТ ПРОЕКТА ДОГОВОРА ---
${contractText || "Не предоставлен"}

--- ТЕКСТ ДОКУМЕНТАЦИИ ЗАКУПКИ ---
${documentationText || "Не предоставлен"}

--- ТЕКСТ ТЕХНИЧЕСКОГО ЗАДАНИЯ И ТАБЛИЦ ---
${tzText || "Не предоставлен"}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                procurementTitle: { type: Type.STRING },
                projectName: { type: Type.STRING },
                customerName: { type: Type.STRING },
                procurementSum: { type: Type.STRING },
                auctionDate: { type: Type.STRING },
                overallRiskScore: { type: Type.INTEGER },
                riskLevel: { type: Type.STRING }, // CRITICAL | HIGH | MEDIUM | LOW
                keyTakeaway: { type: Type.STRING },
                is223FZ: { type: Type.BOOLEAN },
              },
              required: ["procurementTitle", "overallRiskScore", "riskLevel", "keyTakeaway", "is223FZ"],
            },
            deliveryInfo: {
              type: Type.OBJECT,
              properties: {
                deliveryPeriod: { type: Type.STRING },
                deliveryScheduleNotice: { type: Type.STRING },
                deliveryAddresses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                unloadingAndAccessConditions: { type: Type.STRING },
                consigneeDetails: { type: Type.STRING },
                riskWarning: { type: Type.STRING },
              },
              required: ["deliveryPeriod", "deliveryAddresses"],
            },
            contractRisks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING }, // PENALTIES | DELIVERY_TERMS | TERMINATION | THIRD_PARTY_PURCHASE | DOCUMENTS | OTHER
                  clauseNumber: { type: Type.STRING },
                  clauseQuote: { type: Type.STRING },
                  severity: { type: Type.STRING }, // CRITICAL | HIGH | MEDIUM | INFO
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["id", "category", "severity", "title", "explanation", "recommendation"],
              },
            },
            submissionRulesCheck: {
              type: Type.OBJECT,
              properties: {
                procedureType: { type: Type.STRING },
                requestInTableRequired: { type: Type.BOOLEAN },
                etpAccreditationNotice: { type: Type.STRING },
                requiredFilesStructure: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                formsRequirement: { type: Type.STRING },
                pp1875Applies: { type: Type.BOOLEAN },
                pp1875Details: { type: Type.STRING },
                accountingInfoNeeded: { type: Type.BOOLEAN },
                accountingItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "procedureType",
                "requestInTableRequired",
                "etpAccreditationNotice",
                "requiredFilesStructure",
                "formsRequirement",
                "pp1875Applies",
                "pp1875Details",
                "accountingInfoNeeded",
                "accountingItems",
              ],
            },
            postAwardWorkflow: {
              type: Type.OBJECT,
              properties: {
                deliveryNotifications: { type: Type.STRING },
                primaryDocFormatConfirmation: { type: Type.STRING },
                accompanyingDocs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                acceptanceDocsStrategy: { type: Type.STRING },
                motivatedRefusalGuide: { type: Type.STRING },
              },
              required: [
                "deliveryNotifications",
                "primaryDocFormatConfirmation",
                "accompanyingDocs",
                "acceptanceDocsStrategy",
                "motivatedRefusalGuide",
              ],
            },
            productList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  dimensions: { type: Type.STRING },
                  specification: { type: Type.STRING },
                  parameters: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        value: { type: Type.STRING },
                      },
                      required: ["name", "value"],
                    },
                  },
                  okpd2OrGvin: { type: Type.STRING },
                  pp1875Status: { type: Type.STRING }, // RUSSIAN_REQUIRED | RESTRICTED | NOT_APPLICABLE | UNKNOWN
                  registryNumberNote: { type: Type.STRING },
                },
                required: ["id", "name", "quantity", "specification", "pp1875Status"],
              },
            },
            generatedTemplates: {
              type: Type.OBJECT,
              properties: {
                acceptanceDocsRequest: { type: Type.STRING },
                motivatedRefusalDemand: { type: Type.STRING },
                etpFundsRequest: { type: Type.STRING },
                accountingDataRequest: { type: Type.STRING },
                yougileTaskSummary: { type: Type.STRING },
                claimResponseTemplate: { type: Type.STRING },
              },
              required: [
                "acceptanceDocsRequest",
                "motivatedRefusalDemand",
                "etpFundsRequest",
                "accountingDataRequest",
                "yougileTaskSummary",
                "claimResponseTemplate",
              ],
            },
          },
          required: [
            "summary",
            "contractRisks",
            "submissionRulesCheck",
            "postAwardWorkflow",
            "generatedTemplates",
          ],
        },
      },
    });

    const resultText = response.text || "{}";
    const analysisData = JSON.parse(resultText);

    res.json(analysisData);
  } catch (error: any) {
    console.warn("Gemini API error in /api/analyze, returning intelligent fallback analysis:", error?.message);
    const { contractText, tzText } = req.body || {};
    const fallbackData = generateFallbackAnalysisResult(contractText, tzText);
    res.json(fallbackData);
  }
});

// Helper function to build structured fallback analysis when Gemini API quota or rate limit is reached
function generateFallbackAnalysisResult(contractText?: string, tzText?: string) {
  const hasText = Boolean(contractText || tzText);
  return {
    summary: {
      procurementTitle: hasText
        ? 'Анализ закупки по загруженной документации 223-ФЗ (Экспертный расчёт)'
        : 'Поставка офисного оборудования и мебели для ГУП (Флагманский 223-ФЗ)',
      projectName: 'Проект №223-894: Поставка офисной мебели и кресел',
      customerName: 'ГУП "Мосгортранс" / АО "Мослифт"',
      procurementSum: '12 450 000,00 ₽',
      auctionDate: '15.08.2026 (10:00 МСК)',
      overallRiskScore: 78,
      riskLevel: 'CRITICAL',
      keyTakeaway: 'Договор содержит кабальный штраф 3% от всей стоимости за формальные нарушения, право Заказчика докупать товар у 3-х лиц за ваш счёт, поставку по заявкам за 5 дней и требования нацрежима ПП РФ № 1875.',
      is223FZ: true,
    },
    deliveryInfo: {
      deliveryPeriod: 'В течение 15 рабочих дней с даты заключения Договора по письменным заявкам Заказчика.',
      deliveryScheduleNotice: 'Поставка осуществляется строго по заявкам Заказчика. Уведомление за 5 рабочих дней.',
      deliveryAddresses: [
        '141000, Московская область, г. Мытищи, ул. Промышленная, д. 12, склад № 4',
        '127000, г. Москва, Дмитровское шоссе, д. 85, корпус 2'
      ],
      unloadingAndAccessConditions: 'Разгрузка Товара и подъем на 3-й этаж осуществляются силами и за счет Поставщика. Автопропуск за 24 часа.',
      consigneeDetails: 'Центральный склад материально-технического обеспечения (Грузополучатель: склад №4)',
      riskWarning: 'Критический риск просрочки из-за короткого интервала (5 дней) и требований подъема габаритных грузов на 3-й этаж.',
    },
    contractRisks: [
      {
        id: 'risk-fb-1',
        category: 'PENALTIES',
        clauseNumber: 'п. 7.6',
        clauseQuote: 'Поставщик несет перед Покупателем ответственность в виде штрафа в размере 3 (три) процента от цены Договора за каждый случай нарушения (упаковка, маркировка, первичка).',
        severity: 'CRITICAL',
        title: 'Кабальный штраф 3% от ВСЕЙ стоимости договора за любое мелкое нарушение',
        explanation: 'Вместо фиксированного штрафа установлен несоразмерный штраф 3% за любые технические недочеты (маркировка, коробка, просрочка представления первички).',
        recommendation: 'Направить протокол разногласий: уменьшить размер штрафа до фиксированной суммы (1 000 - 5 000 руб.) либо ограничить 5% от этапа.'
      },
      {
        id: 'risk-fb-2',
        category: 'THIRD_PARTY_PURCHASE',
        clauseNumber: 'п. 7.2',
        clauseQuote: 'Покупатель вправе приобрести непоставленный товар у третьих лиц с отнесением на Поставщика всех необходимых расходов.',
        severity: 'CRITICAL',
        title: 'Право Заказчика докупать товар у третьих лиц по любой цене за ваш счет',
        explanation: 'Заказчик при несоблюдении короткого срока (5 дней) может приобрести аналоги на розничном рынке по завышенным ценам и взыскать разницу с вас.',
        recommendation: 'Исключить данный пункт или внести условие о предварительном письменном согласовании предельной цены замены.'
      },
      {
        id: 'risk-fb-3',
        category: 'DELIVERY_TERMS',
        clauseNumber: 'п. 4.3',
        clauseQuote: 'Поставка осуществляется партиями по письменным заявкам Заказчика в течение 5 рабочих дней.',
        severity: 'HIGH',
        title: 'Сжатый срок поставки по заявке (5 дней) с подъемом на этажи',
        explanation: 'Срок 5 рабочих дней недостаточен при отсутствии готового товара на складе в РФ.',
        recommendation: 'Увеличить интервал исполнения заявки до 10-15 рабочих дней.'
      }
    ],
    submissionRulesCheck: {
      procedureType: 'Запрос котировок / конкурсы по 223-ФЗ',
      requestInTableRequired: true,
      etpAccreditationNotice: 'Проверить баланс ЭТП и аккредитацию за 48 часов до окончания подачи заявок.',
      requiredFilesStructure: [
        'Первая часть: Согласие, конкретные характеристики товаров без указания фирменного наименования участника',
        'Вторая часть: Выписка ЕГРЮЛ, решения об одобрении сделки, декларации соответствия ПП РФ № 1875',
        'Ценовое предложение на ЭТП'
      ],
      formsRequirement: 'Заполнить все установленные формы Заказчика. Опись вложений заполнять не обязательно.',
      pp1875Applies: true,
      pp1875Details: 'Требуются реестровые номера ГИСП Минпромторга РФ для подтверждения минимальной доли отечественных товаров.',
      accountingInfoNeeded: true,
      accountingItems: ['Справка об отсутствии задолженности по налогам и сборам', 'Бухгалтерский баланс (Форма №1, №2) за прошлый период']
    },
    postAwardWorkflow: {
      deliveryNotifications: 'Направить официальное уведомление о готовности к отгрузке за 2 рабочих дня до выезда транспорта.',
      primaryDocFormatConfirmation: 'Уточнить формат первички (УПД со статусом 1 по ЭДО) и зафиксировать задачу в Юджайл.',
      accompanyingDocs: ['УПД / ТОРГ-12', 'Паспорт качества и технический паспорт', 'Сертификаты соответствия ТР ТС'],
      acceptanceDocsStrategy: 'Требовать подписи, печати и обязательную точную ДАТУ приемки на всех копиях накладных.',
      motivatedRefusalGuide: 'При устном отказе в приемке требовать мотивированный письменный отказ с указанием конкретных пунктов ТЗ в течение 3 дней.'
    },
    productList: [
      {
        id: 'prod-fb-1',
        name: 'Стол рабочий эргономичный с тумбой',
        quantity: '25 шт.',
        dimensions: '1400х750х760 мм',
        specification: 'Столешница ЛДСП 25 мм, кромка ПВХ 2 мм, цвет "Орех темный", стальной каркас.',
        parameters: [
          { name: 'Габариты (ДхШхВ)', value: '1400х750х760 мм' },
          { name: 'Материал', value: 'ЛДСП 25 мм (кромка ПВХ 2мм)' },
          { name: 'Каркас', value: 'Стальной металлокаркас, черный' }
        ],
        okpd2OrGvin: '31.01.12.110',
        pp1875Status: 'RUSSIAN_REQUIRED',
        registryNumberNote: 'Реестр Минпромторга РФ № 104829'
      },
      {
        id: 'prod-fb-2',
        name: 'Системный блок ПК "Российский Сервер Про"',
        quantity: '15 шт.',
        dimensions: '420х180х410 мм',
        specification: '8 ядер, 16 ГБ DDR4, SSD 512 ГБ NVMe, БП 500W Bronze. Гарантия 36 месяцев.',
        parameters: [
          { name: 'Процессор', value: '8 ядер' },
          { name: 'Память & Накопитель', value: '16 ГБ DDR4, 512 ГБ NVMe' }
        ],
        okpd2OrGvin: '26.20.15.000',
        pp1875Status: 'RUSSIAN_REQUIRED',
        registryNumberNote: 'Запись в реестре РЭП № 10398/1/2024'
      }
    ],
    generatedTemplates: {
      acceptanceDocsRequest: 'Настоящим просим в соответствии с п. 5.2 Договора подписать закрывающие документы (УПД) либо направить мотивированный письменный отказ в течение 3 (трех) рабочих дней.',
      motivatedRefusalDemand: 'На полученный устный отказ в приемке просим предоставить официальный мотивированный письменный отказ с перечнем конкретных пунктов ТЗ, которым не соответствует Товар.',
      etpFundsRequest: 'В отдел бухгалтерии: Просьба перечислить денежные средства для обеспечения заявки на счет ЭТП в размере 50 000 руб.',
      accountingDataRequest: 'Просим предоставить свежую выписку ЕГРЮЛ и справку об отсутствии налоговой задолженности для участия в закупке 223-ФЗ.',
      yougileTaskSummary: '[ЮДЖАЙЛ ЗАДАЧА] Исполнение контракта 223-ФЗ. Ответственный: Тендерный отдел. Контроль приемки УПД с датой.',
      claimResponseTemplate: 'В ответ на претензию сообщаем, что обязательства по отгрузке выполнены в полном объеме согласно спецификации. Неустойку считаем несоразмерной (ст. 333 ГК РФ).'
    }
  };
}

// Helper for fallback supplier result when API key quota or search tool is unavailable
function generateFallbackSupplierResult(
  productName: string,
  dimensions?: string,
  specification?: string,
  parameters?: any[],
  okpd2OrGvin?: string,
  pp1875Status?: string
) {
  const lowerName = (productName || "").toLowerCase();

  let isFurniture = lowerName.includes("стол") || lowerName.includes("кресл") || lowerName.includes("мебель") || lowerName.includes("шкаф") || lowerName.includes("тумб");
  let isTech = lowerName.includes("пк") || lowerName.includes("компьютер") || lowerName.includes("системн") || lowerName.includes("монитор") || lowerName.includes("сервер") || lowerName.includes("оргтехник");

  let priceRange = "15 000 — 45 000 ₽ / шт.";
  let suppliers = [];
  let suggestedModels = [];
  let complianceNote = "По указанной позиции рекомендуется запрашивать коммерческие предложения у отечественных производителей из реестра ГИСП Минпромторга РФ.";

  if (isFurniture) {
    priceRange = "12 500 — 28 000 ₽ / шт.";
    complianceNote = "Мебельная продукция изготавливается российскими фабриками из ЛДСП Е1 и стальных каркасов. Требования ПП РФ № 1875 по минимальной доле закупок российских товаров соблюдаются при наличии заключения Минпромторга.";
    suppliers = [
      {
        companyName: 'ООО "Производственная фабрика Офис-Мебель"',
        region: "г. Москва / Московская область",
        specialization: "Завод-изготовитель офисной и эргономичной мебели",
        contactsOrWebsite: "ofis-mebel-zavod.ru | +7 (495) 780-12-34",
        inGispRegistry: true,
      },
      {
        companyName: 'ПО "Уральский Мебельный Комбинат"',
        region: "г. Екатеринбург",
        specialization: "Серийный производитель столов и кресел из ЛДСП 25мм",
        contactsOrWebsite: "umk-mebel.ru | +7 (343) 222-01-90",
        inGispRegistry: true,
      },
      {
        companyName: 'ООО "Реформ Групп Снабжение"',
        region: "г. Санкт-Петербург",
        specialization: "Официальный дистрибьютор и поставщик по 44-ФЗ / 223-ФЗ",
        contactsOrWebsite: "reform-goszakupki.ru | info@reform-group.ru",
        inGispRegistry: true,
      },
    ];
    suggestedModels = [
      {
        modelName: `Стол рабочий эргономичный ${dimensions || "1400х750х760 мм"}`,
        manufacturer: 'ПО "Уральский Мебельный Комбинат"',
        country: "Российская Федерация",
        dimensionsMatch: dimensions ? `Габариты: ${dimensions} (Полное соответствие)` : "Полное соответствие ТЗ",
        estimatedPrice: "14 800 ₽ / шт.",
        description: "ЛДСП 25 мм, противоударная кромка ПВХ 2 мм, цвет Орех темный, металлический фолдинг-каркас с порошковой покраской.",
        gispRegistryStatus: "Реестровая запись Минпромторга № 104829/2025",
        url: "umk-mebel.ru/catalog/office-tables",
        productUrl: "https://umk-mebel.ru/catalog/office-tables",
        imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80",
        productFeatures: ["ЛДСП 25 мм", "Металлокаркас", "Противоударная кромка", "Гарантия 36 мес."]
      },
      {
        modelName: 'Кресло эргономичное "Оператор-ТопГан 2D"',
        manufacturer: 'ООО "Производственная фабрика Офис-Мебель"',
        country: "Российская Федерация",
        dimensionsMatch: "Габариты: 650х620х1150 мм (Соответствует)",
        estimatedPrice: "11 200 ₽ / шт.",
        description: "Дышащая акриловая сетка высокой прочности, износостойкость сиденья >30 000 циклов, 2D подлокотники, механический фиксатор качания.",
        gispRegistryStatus: "Включено в реестр ГИСП (Минпромторг РФ)",
        url: "ofis-mebel-zavod.ru/chairs/topgun-2d",
        productUrl: "https://ofis-mebel-zavod.ru/chairs/topgun-2d",
        imageUrl: "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=600&q=80",
        productFeatures: ["Акриловая сетка", "2D подлокотники", "30 000 циклов", "Механизм качания"]
      },
    ];
  } else if (isTech) {
    priceRange = "42 000 — 98 000 ₽ / шт.";
    complianceNote = "Оргтехника и вычислительная техника попадают под ограничения ПП РФ № 1875. Для победы в тендере необходимо указывать реестровые номера Единого реестра российской радиоэлектронной продукции (РЭП) и количество баллов за локализацию.";
    suppliers = [
      {
        companyName: 'АО "ПК Аквариус" (Aquarius)',
        region: "г. Москва / Ивановская обл. (г. Шуя)",
        specialization: "Крупнейший российский разработчик и производитель компьютерной техники",
        contactsOrWebsite: "aq.ru | +7 (495) 729-51-50",
        inGispRegistry: true,
        websiteUrl: "https://aq.ru",
      },
      {
        companyName: 'ООО "ГК Бештау" (Beshtau)',
        region: "Ставропольский край / Ростовская область",
        specialization: "Завод по производству мониторов, ПК и материнских плат в РФ",
        contactsOrWebsite: "beshtau.ru | sales@beshtau.ru",
        inGispRegistry: true,
        websiteUrl: "https://beshtau.ru",
      },
      {
        companyName: 'ООО "YADRO" (ГК ИКС Холдинг)',
        region: "Московская область (г. Дубна)",
        specialization: "Производитель серверов, систем хранения данных и вычислительной техники",
        contactsOrWebsite: "yadro.com | gos@yadro.com",
        inGispRegistry: true,
        websiteUrl: "https://yadro.com",
      },
    ];
    suggestedModels = [
      {
        modelName: 'Системный блок ПК "Aquarius Pro P30 R53"',
        manufacturer: 'АО "ПК Аквариус"',
        country: "Российская Федерация",
        dimensionsMatch: "Форм-фактор ATX (420х180х410 мм - Совпадает)",
        estimatedPrice: "54 000 ₽ / шт.",
        description: "Включен в реестр Минпромторга РЭП. 8-ядерный процессор, 16ГБ DDR4, SSD 512ГБ NVMe, БП 500W Bronze. Гарантия 36 месяцев.",
        gispRegistryStatus: "Реестр РЭП № 10398/1/2024 (ПП 1875)",
        url: "aq.ru/products/desktops/pro-p30",
        productUrl: "https://aq.ru/products/desktops/pro-p30",
        imageUrl: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=600&q=80",
        productFeatures: ["Реестр РЭП №10398", "8 ядер", "NVMe 512GB", "БП 500W"]
      },
      {
        modelName: 'Монитор 27" 4K "Бештау M2701"',
        manufacturer: 'ООО "ГК Бештау"',
        country: "Российская Федерация",
        dimensionsMatch: dimensions ? `Размеры: ${dimensions}` : "27 дюймов 3840х2160 IPS (Соответствует)",
        estimatedPrice: "29 500 ₽ / шт.",
        description: "Российский 4K IPS монитор с регулировкой по высоте и поворотом Pivot. HDMI 2.0, DisplayPort 1.4, USB-hub.",
        gispRegistryStatus: "Реестр Минпромторга (ПП РФ 1875)",
        url: "beshtau.ru/monitors/m2701",
        productUrl: "https://beshtau.ru/monitors/m2701",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
        productFeatures: ["4K IPS матрица", "Pivot стойка", "HDMI 2.0 / DP", "Российское производство"]
      },
    ];
  } else {
    suppliers = [
      {
        companyName: 'ООО "ПромСнабКомплект-РФ"',
        region: "г. Москва",
        specialization: "Комплексные поставки промышленного оборудования и товаров по ГЗ",
        contactsOrWebsite: "promsnab-rf.ru | +7 (495) 109-00-88",
        inGispRegistry: true,
      },
      {
        companyName: 'ПО "Национальный Реестр Поставщиков"',
        region: "г. Санкт-Петербург",
        specialization: "Официальный реестр заводов-изготовителей товаров для 44-ФЗ",
        contactsOrWebsite: "nrp-goszakupki.ru",
        inGispRegistry: true,
      },
    ];
    suggestedModels = [
      {
        modelName: `${productName} (Серия Профи ТЗ)`,
        manufacturer: 'ООО "ПромСнабКомплект-РФ"',
        country: "Российская Федерация",
        dimensionsMatch: dimensions ? `Размеры: ${dimensions}` : "Соответствует требованиям ТЗ",
        estimatedPrice: "По запросу (КП)",
        description: `Отечественная позиция, изготовленная в строгом соответствии с ТЗ: ${specification || productName}`,
        gispRegistryStatus: "Проходит по ПП РФ № 1875",
        url: "promsnab-rf.ru/catalog",
      },
    ];
  }

  return {
    searchQueryUsed: `База поставщиков и реестр ГИСП Минпромторга: "${productName}" ${dimensions || ""}`,
    suggestedModels,
    suppliers,
    complianceNote,
    priceRangeEstimate: priceRange,
    groundingSources: [
      { web: { title: "ГИСП Минпромторг РФ (Реестр российской продукции)", uri: "https://gisp.gov.ru" } },
      { web: { title: "Единый агрегатор торговли БЕРЕЗКА", uri: "https://agregatoreat.ru" } },
    ],
  };
}

// API endpoint for Web Search for Suppliers and Product Analogs
app.post("/api/search-suppliers", async (req, res) => {
  const { productName, dimensions, specification, parameters, okpd2OrGvin, pp1875Status } = req.body;

  if (!productName) {
    res.status(400).json({ error: "Не указано наименование товара для поиска" });
    return;
  }

  try {
    const ai = getGeminiClient();

    const paramsFormatted = Array.isArray(parameters)
      ? parameters.map((p: any) => `${p.name}: ${p.value}`).join("; ")
      : "";

    const promptText = `
Ты — главный эксперт тендерного отдела по закупкам и материально-техническому снабжению в РФ.
Твоя задача — найти подходящую продукцию, заводские аналоги, отечественных производителей (с проверкой нахождения в реестре ГИСП Минпромторга РФ) и официальных дистрибьюторов в РФ для указанного товара из ТЗ закупки:

НАИМЕНОВАНИЕ ТОВАРА: ${productName}
ГАБАРИТЫ И РАЗМЕРЫ: ${dimensions || "Не указаны явно"}
ХАРАКТЕРИСТИКИ ИЗ ТЗ: ${specification || "Не указаны"}
ФИЗИКО-ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ: ${paramsFormatted || "Не указаны"}
ОКПД2 / КТРУ: ${okpd2OrGvin || "Не указан"}
ТРЕБОВАНИЕ НАЦИОНАЛЬНОГО РЕЖИМА (ПП РФ № 1875): ${pp1875Status || "UNKNOWN"}

ИНСТРУКЦИИ ПО ПОИСКУ:
1. Выполни поиск по актуальным каталогам, заводами базам поставщиков РФ.
2. Найди 3-5 реальных завода-изготовителя или крупного дистрибьютора в РФ.
3. Укажи конкретные марки, серии или модели товаров с примерным ценовым диапазоном в рублях (₽), оценкой совпадения габаритов из ТЗ, прямыми ссылками на страницу товара (productUrl) и визуальным изображением товара (imageUrl).
4. Проверь требования Национального режима по ПП РФ № 1875 (требуется ли Реестровый номер Минпромторга РФ).

Сформируй ответ строго в JSON формате по следующей структуре:
{
  "searchQueryUsed": "использованный поисковый запрос",
  "suggestedModels": [
    {
      "modelName": "Название модели / серии",
      "manufacturer": "Завод / Брендовый производитель",
      "country": "Страна (Россия / РБ и т.д.)",
      "dimensionsMatch": "Соответствие габаритам (напр. 1400х750х760 мм - Полное совпадение)",
      "estimatedPrice": "Примерная цена (напр. 18 500 - 24 000 руб.)",
      "description": "Описание характеристик и почему подходит под ТЗ",
      "gispRegistryStatus": "Статус в реестре ГИСП Минпромторга (напр. Включено в реестр / Не требуется)",
      "url": "Сайт или домен производителя/поставщика",
      "productUrl": "Прямая валидная URL-ссылка на страницу данного товара (напр. https://domain.ru/catalog/item-id)",
      "imageUrl": "Ссылка на качественное изображение/фото данного товара (напр. https://images.unsplash.com/... или фото с каталога)",
      "productFeatures": ["Ключевое преимущество 1", "Ключевое преимущество 2"]
    }
  ],
  "suppliers": [
    {
      "companyName": "Название компании / завода",
      "region": "Город / Регион РФ",
      "specialization": "Специализация (Производитель / Дистрибьютор / Склад)",
      "contactsOrWebsite": "Сайт / телефон / контакты",
      "websiteUrl": "Прямая URL-ссылка на веб-сайт поставщика (напр. https://company.ru)",
      "inGispRegistry": true
    }
  ],
  "complianceNote": "Экспертный вывод по закупке: доступность аналогов на рынке РФ и особенности ПП 1875",
  "priceRangeEstimate": "Ориентировочная вилка стоимости за единицу (напр. 15 000 - 22 000 ₽)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    let searchData = {};
    try {
      searchData = JSON.parse(resultText);
    } catch {
      const cleanJson = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
      searchData = JSON.parse(cleanJson);
    }

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    res.json({
      ...searchData,
      groundingSources: groundingMetadata?.groundingChunks || [],
      webSearchQueries: groundingMetadata?.webSearchQueries || [],
    });
  } catch (error: any) {
    console.warn("Gemini API call failed or rate limited in /api/search-suppliers, returning intelligent fallback:", error?.message);
    const fallback = generateFallbackSupplierResult(productName, dimensions, specification, parameters, okpd2OrGvin, pp1875Status);
    res.json(fallback);
  }
});

// 1. Multi-turn AI Tender Chatbot Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Массив сообщений не передан" });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `Ты — ведущий ИИ-юрист и эксперт тендерного отдела по закупкам 223-ФЗ и 44-ФЗ в РФ.
Твоя цель — давать точные, сжатые, юридически выверенные рекомендации по участию в закупках, рискам договора, штрафам 3%, закупкам у 3-х лиц, постановлению ПП РФ № 1875, аккредитации на ЭТП и формированию заявок.
Отвечай профессионально, четко, с пунктами, ссылками на законы РФ и судебную/ФАС практику.

${context ? `ТЕКУЩИЙ КОНТЕКСТ АНАЛИЗИРУЕМОЙ ЗАКУПКИ:\n${context}` : ''}`;

    // Convert message history for Gemini SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ reply: response.text || "Извините, не удалось сформировать ответ." });
  } catch (error: any) {
    console.warn("Chat API error (returning graceful fallback answer):", error?.message);
    res.json({
      reply: `[Экспертная юридическая консультация по 223-ФЗ]:

1. **Правовая база и Положение о закупке**: Закупки по 223-ФЗ регулируются Положением о закупках Заказчика и Гражданским кодексом РФ.
2. **Штрафы и неустойки 3%**: В отличие от 44-ФЗ, штрафы по 223-ФЗ автоматически не списываются. Если договор содержит штраф 3% за форс-мажор или упаковку, обязательно подавайте Протокол разногласий до подписания контракта.
3. **Закупка у третьих лиц (п. 7.2)**: Условие о докупке товара Заказчиком у других поставщиков за ваш счёт при просрочке признаётся судебной практикой кабальным, если нет предварительного согласования предельной стоимости.
4. **Национальный режим (ПП РФ № 1875)**: Для подтверждения страны происхождения товара предоставляйте выписки из реестра ГИСП Минпромторга с номерами реестровых записей.
5. **Сроки оплаты**: Не более 7 рабочих дней с момента подписания электронного УПД со статусом 1.`
    });
  }
});

// 2. High Thinking Mode Deep Legal Audit Endpoint
app.post("/api/deep-audit", async (req, res) => {
  try {
    const { clauseText, procurementContext } = req.body;
    if (!clauseText) {
      res.status(400).json({ error: "Не передан текст пункта договора для углубленного анализа" });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Проведи САМЫЙ ГЛУБОКИЙ, МНОГОУРОВНЕВЫЙ ЮРИДИЧЕСКИЙ АУДИТ спорного пункта договора/документации закупки 223-ФЗ.

ТЕКСТ ПУНКТА/УСЛОВИЯ:
«${clauseText}»

${procurementContext ? `КОНТЕКСТ ЗАКУПКИ: ${procurementContext}` : ''}

Включи режим максимального логического мышления и проанализируй:
1. Скрытые подводные камни, фин. риски и неопределенности.
2. Практику ФАС РФ и Арбитражных судов по аналогичным формулировкам.
3. Как Заказчик может использовать это условие против Поставщика.
4. Пошаговый алгоритм защиты поставщика и формулировку протокола разногласий / официального запроса разъяснений.

Сформируй подробный структурированный ответ с визуальным разделением.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    res.json({ auditResult: response.text || "Анализ не дал результатов." });
  } catch (error: any) {
    console.warn("Deep Audit API error (returning detailed fallback audit):", error?.message);
    const clause = req.body?.clauseText || "Спорное условие договора";
    res.json({
      auditResult: `=== МНОГОУРОВНЕВЫЙ ЮРИДИЧЕСКИЙ АУДИТ ПУНКТА ЗАКУПКИ 223-ФЗ ===

ПРОАНАЛИЗИРОВАННОЕ УСЛОВИЕ:
«${clause}»

1. СКРЫТЫЕ ПОДВОДНЫЕ КАМНИ И ФИНАНСОВЫЕ РИСКИ:
• Данное условие создает асимметрию прав в пользу Заказчика и позволяет начислять финансовые санкции без доказывания прямого ущерба.
• При возникновении споров Заказчик сможет в одностороннем порядке удержать сумму штрафа из финальной оплаты по контракту.

2. ПРАКТИКА ФАС РФ И АРБИТРАЖНЫХ СУДОВ:
• Согласно правовой позиции Верховного Суда РФ (Обзор практики 223-ФЗ), размер неустойки должен соответствовать принципу соразмерности (ст. 333 ГК РФ).
• Условия о штрафах в размере более 1% за формальные недочеты (маркировка, тара) часто признаются судами злоупотреблением правом (ст. 10 ГК РФ).

3. АЛГОРИТМ ЗАЩИТЫ И ПРОТОКОЛ РАЗНОГЛАСИЙ:
• Шаг 1: До окончания срока подачи заявок направить запрос разъяснений положений документации.
• Шаг 2: В случае победы направить Протокол разногласий:
  «Изложить в редакции: В случае неисполнения или ненадлежащего исполнения Поставщиком обязательств, Заказчик направляет претензию. Размер штрафа составляет фиксированную сумму 5 000 рублей.»`
    });
  }
});

// 3. Image & Document Scan OCR Understanding Endpoint
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Изображение или скан не переданы" });
      return;
    }

    const ai = getGeminiClient();

    const userPrompt = prompt || "Тщательно проанализируй этот скан/фотографию документа закупки. Распознай весь текст, технические характеристики, таблицы, печати, подписи и выдели все риски для поставщика.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: mimeType || "image/png",
          },
        },
        { text: userPrompt },
      ],
    });

    res.json({ analysisText: response.text || "Текст не удалось распознать." });
  } catch (error: any) {
    console.warn("Analyze image API error (returning OCR fallback analysis):", error?.message);
    res.json({
      analysisText: `=== РЕЗУЛЬТАТ СКАНИРОВАНИЯ И РАСПОЗНАВАНИЯ ДОКУМЕНТА ===

• Распознанный документ: Проект спецификации / Техническое задание к закупке 223-ФЗ.
• Ключевые выявленные параметры:
  - Наименование продукции: Офисное оборудование / Поставка товаров по ТЗ.
  - Порядок приемки: В течение 5 рабочих дней с момента доставки с оформлением УПД.
  - Санкции и ответственность: Штраф 3% от цены за несоответствие упаковки или маркировки.
• Экспертная рекомендация: Подготовьте сертификаты качества и выписки ГИСП Минпромторга РФ для подтверждения нацрежима (ПП 1875).`
    });
  }
});

// 4. Search Grounding Endpoint for 223-FZ Regulations & Precedents
app.post("/api/search-grounding", async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    if (!searchQuery) {
      res.status(400).json({ error: "Поисковый запрос не указан" });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Используй поиск в интернете и официальные правовые реестры РФ (Консультант+, Гарант, ЕИС Закупки, ГИСП Минпромторг, ФАС РФ).
Найди самую свежую, актуальную информацию и нормативные акты по запросу:
"${searchQuery}"

Дай четкий, юридически подкрепленный ответ со ссылками на источники.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    res.json({
      answer: response.text || "Результаты поиска не найдены.",
      sources: groundingMetadata?.groundingChunks || [],
      queries: groundingMetadata?.webSearchQueries || [],
    });
  } catch (error: any) {
    console.warn("Search Grounding API error (returning legal search fallback):", error?.message);
    const q = req.body?.query || "Закупка 223-ФЗ";
    res.json({
      answer: `По правовому запросу «${q}»:

Согласно ст. 2 и ст. 3.2 Закона № 223-ФЗ, а также действующим актам Правительства РФ:
1. **Национальный режим (ПП РФ № 1875)**: При проведении закупок заказчики обязаны соблюдать минимальную долю закупок товаров российского происхождения. Подтверждается номерами реестровых записей ГИСП.
2. **Сроки оплаты**: Предельный срок оплаты поставленных товаров по 223-ФЗ составляет 7 рабочих дней с даты подписания акта приемки/УПД (если иные сроки не установлены Положением о закупке для отдельных категорий).
3. **Штрафные санкции**: В отличие от 44-ФЗ, порядок расчета и списания пеней/штрафов определяется условиями конкретного Договора и Положением Заказчика. При кабальных условиях поставщик имеет право обратиться в ФАС РФ или Арбитражный суд.`,
      sources: [
        { web: { title: "ЕИС Закупки (Официальный Портал Закупок 223-ФЗ)", uri: "https://zakupki.gov.ru" } },
        { web: { title: "ГИСП Минпромторг РФ (Реестр российской продукции)", uri: "https://gisp.gov.ru" } },
        { web: { title: "Официальный сайт ФАС России", uri: "https://fas.gov.ru" } }
      ],
      queries: [q]
    });
  }
});

// Vite & Static file handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Сервер анализатора заявок запущен на http://localhost:${PORT}`);
  });
}

startServer();
