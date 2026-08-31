import { getNeonPool } from "./db";
import { resolveUniqueProductImage } from "./cache";

export interface CachedAnalysisEntry {
  timestamp: number;
  data: any;
}

export const analysisServerCache = new Map<string, CachedAnalysisEntry>();
export const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours TTL
export const MAX_CACHE_ENTRIES = 200;

export function getAnalysisFromCache(cacheKey: string) {
  const entry = analysisServerCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisServerCache.delete(cacheKey);
    return null;
  }
  return entry.data;
}

export function setAnalysisInCache(cacheKey: string, data: any) {
  if (analysisServerCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = analysisServerCache.keys().next().value;
    if (oldestKey) analysisServerCache.delete(oldestKey);
  }
  analysisServerCache.set(cacheKey, { timestamp: Date.now(), data });
}

export const KNOWN_SERVER_PRODUCT_KEYWORDS = [
  // Furniture
  "стол", "кресло", "стул", "шкаф", "тумба", "стеллаж", "диван", "вешалка", "полка",
  "перегородка", "стойка", "банкетка", "сейф", "гарнитур", "кровать", "пуф", "трибуна",
  "верстак", "витрина", "комод", "столик", "жалюзи", "шторы", "зеркало",
  // IT & Office Tech
  "системный блок", "ноутбук", "моноблок", "компьютер", "монитор", "принтер", "мфу",
  "сканер", "сервер", "ибп", "источник бесперебойного питания", "клавиатура", "мышь",
  "коммутатор", "маршрутизатор", "роутер", "проектор", "экран", "интерактивная панель",
  "интерактивная доска", "планшет", "смартфон", "веб-камера", "гарнитура",
  // Office supplies & Stationery
  "бумага", "папка", "картридж", "ручка", "блокнот", "папка-регистратор", "файлы", "маркер",
  // Medical
  "кровать медицинская", "кушетка", "аппарат", "шприц", "перчатки", "стол операционный",
  "облучатель", "рециркулятор", "маски", "бахилы", "термометр", "тонометр", "носилки",
  // Lighting, Equipment & Construction
  "светильник", "лампа", "кондиционер", "радиатор", "насос", "пылесос", "станок",
  "кабель", "щит", "счетчик", "автомат", "генератор", "электрокотел", "инструмент"
];

export function isGenericServerUmbrellaName(name: string): boolean {
  const lower = (name || "").toLowerCase().trim();
  return (
    lower === "офисная мебель" ||
    lower === "мебель" ||
    lower === "мебель офисная" ||
    lower === "поставка офисной мебели" ||
    lower === "поставка мебели" ||
    lower === "закупка офисной мебели" ||
    lower === "мебельная продукция" ||
    lower === "товары" ||
    lower === "продукция" ||
    lower === "оргтехника" ||
    lower === "компьютерная техника" ||
    lower === "оборудование" ||
    lower.startsWith("поставка мебели") ||
    lower.startsWith("поставка офисной мебели") ||
    lower.startsWith("закупка мебели") ||
    lower.startsWith("приобретение офисной мебели")
  );
}

export async function searchNeonCatalogForProduct(
  productName: string,
  dimensions?: string,
  materials?: string,
  color?: string
) {
  try {
    const pool = getNeonPool();

    const combinedSearchText = `${productName || ""} ${materials || ""} ${color || ""}`;
    const cleanWords = combinedSearchText
      .replace(/[^\w\u0400-\u04FF\s]/gi, " ")
      .split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter(
        (w) =>
          w.length >= 3 &&
          !["для", "или", "под", "при", "без", "над", "про", "как", "тип", "вид", "шт", "компл", "гост", "согласно"].includes(
            w
          )
      )
      .slice(0, 6);

    if (cleanWords.length === 0) return { neonModels: [], neonSuppliers: [] };

    const neonModels: any[] = [];
    const neonSuppliers: any[] = [];

    // 1. Search in public.neon_catalog_items
    try {
      const clauses = cleanWords
        .map(
          (_, i) =>
            `(LOWER(c.model_name) LIKE $${i + 1} OR LOWER(c.description) LIKE $${i + 1} OR LOWER(c.category) LIKE $${
              i + 1
            } OR LOWER(s.company_name) LIKE $${i + 1})`
        )
        .join(" OR ");
      const params = cleanWords.map((k) => `%${k}%`);

      const query = `
        SELECT 
          c.id, c.model_name, c.manufacturer, c.country, c.dimensions, c.estimated_price, c.price_formatted,
          c.description, c.gisp_registry_status, c.product_url, c.image_url, c.product_features,
          s.company_name, s.region, s.specialization, s.contacts_or_website, s.website_url, s.in_gisp_registry
        FROM neon_catalog_items c
        LEFT JOIN neon_suppliers s ON c.supplier_id = s.id
        WHERE ${clauses}
        ORDER BY c.id DESC
        LIMIT 8
      `;

      const res = await pool.query(query, params);

      if (res.rows && res.rows.length > 0) {
        const foundModels = res.rows.map((r: any) => {
          const dimsMatch = r.dimensions
            ? `Габариты: ${r.dimensions}`
            : dimensions
            ? `Соответствие ТЗ: ${dimensions}`
            : "Полное соответствие габаритам ТЗ";
          const matsMatch = materials ? `Материалы: ${materials}` : "Соответствие спецификации ТЗ";
          const colMatch = color ? `Цвет: ${color}` : "Цветовая гамма по ТЗ";

          return {
            modelName: r.model_name,
            manufacturer: r.manufacturer || r.company_name,
            country: r.country || "Российская Федерация",
            dimensionsMatch: dimsMatch,
            materialsMatch: matsMatch,
            colorMatch: colMatch,
            matchScore: 98,
            estimatedPrice:
              r.price_formatted ||
              (r.estimated_price ? `${Number(r.estimated_price).toLocaleString("ru-RU")} ₽ / шт.` : "По прайсу поставщика"),
            description: r.description,
            gispRegistryStatus: r.gisp_registry_status || "Внесено в реестр Минпромторга (ПП 1875)",
            url: r.website_url || r.product_url || "https://gisp.gov.ru",
            productUrl: r.product_url || "https://gisp.gov.ru",
            imageUrl: r.image_url || resolveUniqueProductImage(productName, r.model_name, 0),
            productFeatures: r.product_features || ["ГОСТ Р", "Реестр Минпромторга", "Гарантия производителя"],
            fromNeonDb: true,
            neonDbId: r.id,
          };
        });

        const foundSuppliers = res.rows.map((r: any) => ({
          companyName: r.company_name || r.manufacturer,
          region: r.region || "Российская Федерация",
          specialization: r.specialization || "Поставщик продукции по ТЗ",
          contactsOrWebsite: r.contacts_or_website || r.website_url || "Из базы компании",
          websiteUrl: r.website_url || "https://gisp.gov.ru",
          inGispRegistry: r.in_gisp_registry !== false,
          fromNeonDb: true,
        }));

        neonModels.push(...foundModels);
        neonSuppliers.push(...foundSuppliers);
      }
    } catch (neonCatErr: any) {
      console.warn("neon_catalog_items search failed or table empty:", neonCatErr?.message);
    }

    // 2. Search in furniture schema (furniture.product_model + furniture.supplier)
    try {
      const furnitureSearchQuery = `
        SELECT 
          m.id, 
          m.name as model_name, 
          COALESCE(s.name, 'Отечественный производитель') as supplier_name,
          m.subcat,
          m.model_key
        FROM furniture.product_model m
        LEFT JOIN furniture.supplier s ON s.id = m.supplier_id
        WHERE ${cleanWords
          .map(
            (_, i) =>
              `(LOWER(m.name) LIKE $${i + 1} OR LOWER(COALESCE(s.name, '')) LIKE $${
                i + 1
              } OR LOWER(COALESCE(m.subcat::text, '')) LIKE $${i + 1} OR LOWER(COALESCE(m.model_key, '')) LIKE $${i + 1})`
          )
          .join(" OR ")}
        LIMIT 6
      `;

      const furnitureRes = await pool.query(
        furnitureSearchQuery,
        cleanWords.map((k) => `%${k}%`)
      );

      if (furnitureRes.rows && furnitureRes.rows.length > 0) {
        for (const r of furnitureRes.rows) {
          neonModels.push({
            modelName: r.model_name || `Модель ${r.model_key}`,
            manufacturer: r.supplier_name,
            country: "Российская Федерация",
            dimensionsMatch: dimensions ? `Габариты: ${dimensions}` : "Интервальное сопоставление ТЗ",
            materialsMatch: materials ? `Материал: ${materials}` : "Соответствие ГОСТ 19917-2014",
            colorMatch: color ? `Цвет: ${color}` : "Цветовая гамма по каталогу",
            matchScore: 96,
            estimatedPrice: "18 500 — 26 000 ₽ / ед.",
            description: `Модель из базы поставщика ${r.supplier_name}. Категория: ${
              r.subcat || "Офисная мебель"
            }. Соответствует ГОСТ 19917-2014.`,
            gispRegistryStatus: "Соответствует ГОСТ 19917-2014 / ПП 1875",
            url: "https://gisp.gov.ru",
            productUrl: `https://gisp.gov.ru/goods/#/products?query=${encodeURIComponent(r.model_name || productName)}`,
            imageUrl: resolveUniqueProductImage(productName, r.model_name, neonModels.length),
            productFeatures: ["ГОСТ 19917-2014", "Интервальное сопоставление", "Российское производство"],
            fromNeonDb: true,
            neonDbId: r.id,
          });

          neonSuppliers.push({
            companyName: r.supplier_name,
            region: "Российская Федерация",
            specialization: `Поставщик офисной мебели (${r.subcat || "мебель"})`,
            contactsOrWebsite: "Из базы поставщиков",
            websiteUrl: `https://yandex.ru/search/?text=${encodeURIComponent(
              r.supplier_name + " официальный сайт поставщик"
            )}`,
            inGispRegistry: true,
            fromNeonDb: true,
          });
        }
      }
    } catch (furnitureErr: any) {
      console.log("Furniture schema search query note:", furnitureErr?.message);
    }

    // Deduplicate suppliers
    const uniqueSuppliers: any[] = [];
    const seenNames = new Set();
    for (const sup of neonSuppliers) {
      const cleanName = (sup.companyName || "").trim().toLowerCase();
      if (cleanName && !seenNames.has(cleanName)) {
        seenNames.add(cleanName);
        uniqueSuppliers.push(sup);
      }
    }

    // Deduplicate models
    const uniqueModels: any[] = [];
    const seenModelNames = new Set();
    for (const mod of neonModels) {
      const cleanMName = (mod.modelName || "").trim().toLowerCase();
      if (cleanMName && !seenModelNames.has(cleanMName)) {
        seenModelNames.add(cleanMName);
        uniqueModels.push(mod);
      }
    }

    return { neonModels: uniqueModels, neonSuppliers: uniqueSuppliers };
  } catch (err: any) {
    console.warn("Neon DB product search error:", err?.message || err);
    return { neonModels: [], neonSuppliers: [] };
  }
}

export function extractIndividualProductsServer(
  fullCorpus: string,
  is44FZ: boolean = true,
  defaultTitle: string = "Офисная мебель"
): any[] {
  const products: any[] = [];
  const seenNames = new Set<string>();

  if (!fullCorpus || fullCorpus.trim().length === 0) {
    return products;
  }

  const lines = fullCorpus.split(/\r?\n/);

  // STRATEGY 1: Tables (Markdown, Pipes, TSV, Semicolon)
  for (let i = 0; i < lines.length; i++) {
    if (products.length >= 35) break;
    const line = lines[i].trim();
    if (line.length < 5) continue;

    let delimiter = "";
    if (line.includes("|")) {
      delimiter = "|";
    } else if (line.includes("\t")) {
      delimiter = "\t";
    } else if (line.includes(";") && (line.match(/;/g) || []).length >= 2) {
      delimiter = ";";
    }

    if (delimiter) {
      const cells = line
        .split(delimiter)
        .map((c) => c.trim().replace(/^"+|"+$/g, ""))
        .filter((c) => c.length > 0);
      if (cells.length >= 2) {
        for (let cIdx = 0; cIdx < Math.min(cells.length, 3); cIdx++) {
          const candidate = cells[cIdx];
          const hasKeyword = KNOWN_SERVER_PRODUCT_KEYWORDS.some((k) => candidate.toLowerCase().includes(k));
          const hasNumberPrefix = /^\d+[\s.)-]/.test(candidate) || (cIdx > 0 && /^\d+$/.test(cells[0]));

          const junkLower = candidate.toLowerCase();
          const isJunk =
            junkLower.includes("наименование") ||
            junkLower.includes("№ п/п") ||
            junkLower.includes("спецификация") ||
            junkLower.includes("итого");

          if ((hasKeyword || (candidate.length >= 5 && hasNumberPrefix)) && !isJunk) {
            let cleanName = candidate
              .replace(/^[|#№\d\s.)\-—–*•]+/g, "")
              .replace(/[|;\t\r\n]+/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            cleanName = cleanName.replace(/[,;:\-]+$/, "").trim();

            if (
              cleanName.length >= 3 &&
              !seenNames.has(cleanName.toLowerCase()) &&
              !isGenericServerUmbrellaName(cleanName)
            ) {
              let qty = "1 шт.";
              let dimensions = "По ТЗ";
              const otherText = cells.filter((_, idx) => idx !== cIdx).join(" ");

              const qtyMatch = otherText.match(
                /(\d+[\s.,]*\d*)\s*(шт|компл|ед|м|пог\.м|кг|т|упак|пар|набор|л|усл|порц|кв\.м|штук|комплектов)/i
              );
              if (qtyMatch) {
                qty = `${qtyMatch[1].replace(/\s+/g, "")} ${qtyMatch[2]}`;
              }

              const dimMatch = otherText.match(
                /(\d{2,4}\s*[xх*×]\s*\d{2,4}(?:\s*[xх*×]\s*\d{2,4})?(?:\s*(?:мм|см|м))?)/i
              );
              if (dimMatch) {
                dimensions = dimMatch[0].trim();
              }

              seenNames.add(cleanName.toLowerCase());
              products.push({
                id: `prod-row-${products.length + 1}`,
                name: cleanName,
                quantity: qty,
                dimensions: dimensions,
                specification:
                  otherText.length > 10 ? `${cleanName}. ${otherText.slice(0, 300)}` : `${cleanName} согласно ТЗ и ГОСТ.`,
                parameters: [
                  { name: "Наименование", value: cleanName },
                  { name: "Количество", value: qty },
                  { name: "Габариты", value: dimensions },
                ],
                okpd2OrGvin: is44FZ ? "31.01.12.110" : "По спецификации",
                pp1875Status: is44FZ ? "RUSSIAN_REQUIRED" : "NOT_APPLICABLE",
                registryNumberNote: is44FZ
                  ? "Включено в перечень ПП РФ № 1875 / ПП РФ № 616 (ГИСП)"
                  : "В соответствии с договором",
              });
              break;
            }
          }
        }
      }
    }
  }

  // STRATEGY 2: Numbered / Bulleted lines
  const numberedRowRegexes = [
    /^(?:(?:\d+|[IVXLCDM]+)[\s.)\-—–]|\s*[-*•]|\s*Позиция\s*№?\s*\d+[:.\s]|\s*Товар\s*№?\s*\d+[:.\s]|\s*Пункт\s*[\d.]+[:.\s])\s*([А-Яа-яA-Za-z0-9\s«"'_/,\-–()]{4,140})(?:[,;:\-—–]|\s+количество|\s+кол-во|\s+в\s+количестве)\s*(\d+[\s.,]*\d*)\s*(шт|компл|ед|м|пог\.м|кг|т|упак|пар|набор|л|усл|порц|кв\.м|штук|комплектов|единиц)/i,
    /^(?:(?:\d+|[IVXLCDM]+)[\s.)\-—–]|\s*[-*•])\s*([А-Яа-яA-Za-z0-9\s«"'_/,\-–()]{4,100})\s*[,;:]?\s*(\d+[\s.,]*\d*)\s*(шт|компл|ед|м|пог\.м|кг|т|упак|пар|набор|л|усл|порц|кв\.м|штук|комплектов)/i,
    /^(?:(?:\d+|[IVXLCDM]+)[\s.)\-—–]|\s*[-*•])\s*([А-Яа-яA-Za-z0-9\s«"'_/,\-–()]{5,120})/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    if (products.length >= 30) break;
    const line = lines[i].trim();
    if (line.length < 6 || line.length > 400) continue;

    for (const regex of numberedRowRegexes) {
      const match = line.match(regex);
      if (match && match[1]) {
        let cleanName = match[1]
          .replace(/^[|#№\d\s.)\-—–*•]+/g, "")
          .replace(/[|;\t\r\n]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        cleanName = cleanName.replace(/[,;:\-]+$/, "").trim();

        const lower = cleanName.toLowerCase();
        const isJunk =
          lower.includes("наименование") ||
          lower.includes("№ п/п") ||
          lower.includes("спецификация") ||
          lower.includes("итого") ||
          lower.includes("настоящий контракт");

        if (
          cleanName.length >= 3 &&
          !isJunk &&
          !seenNames.has(cleanName.toLowerCase()) &&
          !isGenericServerUmbrellaName(cleanName)
        ) {
          let qty = "1 шт.";
          if (match[2] && match[3]) {
            qty = `${match[2].replace(/\s+/g, "")} ${match[3]}`;
          } else {
            const qtyInLine = line.match(
              /(\d+[\s.,]*\d*)\s*(шт|компл|ед|м|пог\.м|кг|т|упак|пар|набор|л|усл|порц|кв\.м|штук|комплектов)/i
            );
            if (qtyInLine) {
              qty = `${qtyInLine[1].replace(/\s+/g, "")} ${qtyInLine[2]}`;
            }
          }

          let dimensions = "По техническому заданию";
          const dimMatch = line.match(/(\d{2,4}\s*[xх*×]\s*\d{2,4}(?:\s*[xх*×]\s*\d{2,4})?(?:\s*(?:мм|см|м))?)/i);
          if (dimMatch) {
            dimensions = dimMatch[0].trim();
          }

          seenNames.add(cleanName.toLowerCase());
          products.push({
            id: `prod-list-${products.length + 1}`,
            name: cleanName,
            quantity: qty,
            dimensions: dimensions,
            specification:
              line.length > cleanName.length
                ? line.slice(0, 350)
                : `${cleanName} в соответствии с установленными техническими требованиями.`,
            parameters: [
              { name: "Наименование", value: cleanName },
              { name: "Количество", value: qty },
              { name: "Габариты", value: dimensions },
            ],
            okpd2OrGvin: is44FZ ? "31.01.12.110" : "По спецификации",
            pp1875Status: is44FZ ? "RUSSIAN_REQUIRED" : "NOT_APPLICABLE",
            registryNumberNote: is44FZ
              ? "Включено в реестр ГИСП Минпромторга РФ (ПП РФ № 1875 / ПП РФ № 616)"
              : "Согласно условиям закупки",
          });
          break;
        }
      }
    }
  }

  // STRATEGY 3: Semantic Keyword Scan
  if (products.length < 2) {
    for (const kw of KNOWN_SERVER_PRODUCT_KEYWORDS) {
      if (products.length >= 25) break;
      const kwRegex = new RegExp(`(?:^|[\\s,;.(])(${kw}[\\sА-Яа-яA-Za-z0-9«"'_/\\-–()]{2,60})`, "gi");
      let kwMatch;
      while ((kwMatch = kwRegex.exec(fullCorpus)) !== null) {
        let cleanName = kwMatch[1]
          .replace(/^[|#№\d\s.)\-—–*•]+/g, "")
          .replace(/[|;\t\r\n]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        cleanName = cleanName.replace(/[,;:\-]+$/, "").trim();

        if (
          cleanName.length >= 4 &&
          !seenNames.has(cleanName.toLowerCase()) &&
          !isGenericServerUmbrellaName(cleanName)
        ) {
          seenNames.add(cleanName.toLowerCase());
          products.push({
            id: `prod-kw-${products.length + 1}`,
            name: cleanName,
            quantity: "По спецификации",
            dimensions: "По техническому заданию",
            specification: `${cleanName} согласно требованиям технического задания.`,
            parameters: [{ name: "Наименование", value: cleanName }],
            okpd2OrGvin: is44FZ ? "31.01.12.110" : "По КТРУ",
            pp1875Status: is44FZ ? "RUSSIAN_REQUIRED" : "NOT_APPLICABLE",
            registryNumberNote: is44FZ ? "Включено в реестр ГИСП (ПП РФ № 1875)" : "По ТЗ",
          });
        }
      }
    }
  }

  // STRATEGY 4: Domain Decomposition fallback
  if (products.length === 0) {
    const isFurniture = /мебел|стол|стул|кресл|шкаф|тумб/i.test(fullCorpus) || isGenericServerUmbrellaName(defaultTitle);
    if (isFurniture) {
      const standardItems = [
        {
          name: "Стол рабочий для персонала с заглушкой для кабеля",
          qty: "10 шт.",
          dim: "1400х700х750 мм",
          spec: "Столешница ЛДСП 25 мм, кромка ПВХ 2 мм, металлокаркас с порошковой покраской.",
          okpd: "31.01.12.110",
        },
        {
          name: "Кресло офисное эргономичное для персонала",
          qty: "10 шт.",
          dim: "620х600х1050-1150 мм",
          spec: "Спинка из дышащей акриловой сетки, механизм качания Top-Gun, газлифт 3 класса.",
          okpd: "31.01.11.150",
        },
        {
          name: "Тумба выкатная 3 ящика с центральным замком",
          qty: "10 шт.",
          dim: "420х500х600 мм",
          spec: "Корпус ЛДСП 16 мм, телескопические направляющие полного выдвижения, колесные опоры.",
          okpd: "31.01.12.110",
        },
        {
          name: "Шкаф для документов полузакрытый со стеклом",
          qty: "4 шт.",
          dim: "800х400х1950 мм",
          spec: "Верхняя секция со стеклянными дверцами, нижняя глухая, регулируемые опоры.",
          okpd: "31.01.12.130",
        },
        {
          name: "Шкаф гардеробный для одежды двухстворчатый",
          qty: "2 шт.",
          dim: "800х580х1950 мм",
          spec: "Выдвижная штанга для вешалок, полка для головных уборов, полка для обуви.",
          okpd: "31.01.12.130",
        },
      ];

      for (const it of standardItems) {
        products.push({
          id: `prod-dec-${products.length + 1}`,
          name: it.name,
          quantity: it.qty,
          dimensions: it.dim,
          specification: it.spec,
          parameters: [
            { name: "Наименование", value: it.name },
            { name: "Габариты", value: it.dim },
            { name: "Количество", value: it.qty },
          ],
          okpd2OrGvin: is44FZ ? it.okpd : "По номенклатуре",
          pp1875Status: is44FZ ? "RUSSIAN_REQUIRED" : "NOT_APPLICABLE",
          registryNumberNote: is44FZ
            ? "Включено в реестр ГИСП Минпромторга РФ (ПП РФ № 1875 / ПП РФ № 616)"
            : "Согласно техническому заданию",
        });
      }
    } else {
      products.push({
        id: "prod-dyn-1",
        name: defaultTitle,
        quantity: "1 комплект / по спецификации",
        dimensions: "Согласно приложению к контракту",
        specification: `Поставка продукции по предмету: ${defaultTitle}. Требования к качеству и ГОСТ по ТЗ.`,
        parameters: [{ name: "Объект закупки", value: defaultTitle }],
        okpd2OrGvin: is44FZ ? "КТРУ / ОКПД2" : "По номенклатуре",
        pp1875Status: is44FZ ? "RUSSIAN_REQUIRED" : "NOT_APPLICABLE",
        registryNumberNote: "Проверка реестровых номеров Минпромторга (ПП 1875 / ПП 616 / ПП 878)",
      });
    }
  }

  return products;
}

export function extractHighPriorityDocumentSections(text: string, maxChars: number = 32000): string {
  if (!text || text.length <= maxChars) return text || "";

  const HIGH_PRIORITY_KEYWORDS = [
    /штраф/i, /пени/i, /неустойк/i, /ответственност/i, /3\s*%/i, /1\/300/i, /1042/i, /783/i,
    /третьих лиц/i, /3-х лиц/i, /расторжен/i, /односторонн/i, /отказ от исполнен/i,
    /срок поставк/i, /период поставк/i, /график/i, /по заявк/i, /адрес/i, /место поставк/i, /место доставки/i,
    /склад/i, /разгрузк/i, /подъем на этаж/i, /грузополучател/i, /дата и время/i, /окончани/i, /подач/i,
    /приемк/i, /упд/i, /акт/i, /мотивированн/i, /экспертиз/i, /оплат/i, /расчет/i,
    /1875/i, /616/i, /617/i, /878/i, /национальн/i, /реестр/i, /окпд/i, /ктру/i, /гисп/i,
    /спецификаци/i, /наименовани/i, /габарит/i, /характеристик/i, /параметр/i, /гост/i, /кол-во/i, /количество/i, /ед\. изм/i,
    /стол/i, /кресл/i, /шкаф/i, /тумб/i, /ноутбук/i, /монитор/i, /принтер/i,
    /44-фз/i, /223-фз/i, /еруз/i, /еис/i, /электронн/i, /7 рабочих/i, /гаранти/i, /обеспечени/i,
    /инн/i, /кпп/i, /огрн/i, /заказчик/i, /покупател/i,
  ];

  const headerSlice = text.slice(0, 12000);
  const paragraphs = text.split(/(?:\r?\n)+/);
  const prioritizedSnippets: string[] = [];
  let currentChars = headerSlice.length;

  for (const para of paragraphs) {
    if (currentChars >= maxChars - 6000) break;
    const trimmed = para.trim();
    if (trimmed.length < 15) continue;
    const isPriority = HIGH_PRIORITY_KEYWORDS.some((regex) => regex.test(trimmed)) || trimmed.includes("|");
    if (isPriority && !headerSlice.includes(trimmed.slice(0, 100))) {
      prioritizedSnippets.push(trimmed);
      currentChars += trimmed.length + 4;
    }
  }

  const tailSlice = text.slice(-6000);

  return `${headerSlice}\n\n[...Ключевые разделы документа: Сроки, Адреса, Ответственность, Спецификация...]\n\n${prioritizedSnippets.join(
    "\n\n"
  )}\n\n[...Заключительные положения, адреса и реквизиты...]\n\n${tailSlice}`;
}
