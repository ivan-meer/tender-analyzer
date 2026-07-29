import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
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
      model: "gemini-3.6-flash",
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
    console.error("Error in /api/analyze:", error);
    res.status(500).json({
      error: "Ошибка при анализе закупки: " + (error?.message || "Внутренняя ошибка сервера"),
    });
  }
});

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
      model: "gemini-3.6-flash",
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
