export interface SearchCacheItem {
  key: string;
  queryType: string;
  data: any;
  cachedAt: string;
  hits: number;
}

export const globalSearchCache = new Map<string, SearchCacheItem>();

export function getCachedResult(key: string): SearchCacheItem | null {
  const found = globalSearchCache.get(key);
  if (found) {
    found.hits += 1;
    return found;
  }
  return null;
}

export function setCachedResult(key: string, data: any, queryType: string): void {
  globalSearchCache.set(key, {
    key,
    queryType,
    data,
    cachedAt: new Date().toISOString(),
    hits: 1,
  });
}

// In-Memory Procurement Analysis Cache
const analysisCache = new Map<string, any>();

export function getAnalysisFromCache(cacheKey: string): any | null {
  return analysisCache.get(cacheKey) || null;
}

export function setAnalysisInCache(cacheKey: string, analysisData: any): void {
  analysisCache.set(cacheKey, analysisData);
  // Limit cache size to prevent memory bloat
  if (analysisCache.size > 200) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
}

export const UNIQUE_PRODUCT_PHOTO_BANKS: Record<string, string[]> = {
  chair: [
    "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1688578735427-91038bc320f7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  ],
  desk: [
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80",
  ],
  cabinet: [
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
  ],
  tech: [
    "https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80",
  ],
  electrical: [
    "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=800&q=80",
  ],
  construction: [
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  ],
  office: [
    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80",
  ],
  medical: [
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80",
  ],
  general: [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
  ],
};

export function sanitizeAndVerifyUrl(
  rawUrl: string | undefined,
  queryText: string,
  isSupplier: boolean = false
): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return isSupplier
      ? `https://yandex.ru/search/?text=${encodeURIComponent(queryText + " официальный сайт поставщик")}`
      : `https://gisp.gov.ru/goods/#/products?query=${encodeURIComponent(queryText)}`;
  }

  const clean = rawUrl.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    return isSupplier
      ? `https://yandex.ru/search/?text=${encodeURIComponent(queryText + " официальный сайт")}`
      : `https://gisp.gov.ru/goods/#/products?query=${encodeURIComponent(queryText)}`;
  }

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();

    // Known synthetic / hallucinated domain markers
    const fakeKeywords = [
      "ofis-mebel-zavod",
      "umk-mebel",
      "reform-goszakupki",
      "rossnab",
      "stroykomplekt-nn",
      "armstroimontazh",
      "energo-promdetal",
      "example.com",
      "domain.ru",
      "site.ru",
      "company.ru",
      "url.com",
      "mysite.ru",
    ];
    if (fakeKeywords.some((fk) => host.includes(fk))) {
      return isSupplier
        ? `https://yandex.ru/search/?text=${encodeURIComponent(queryText + " производитель официальный сайт")}`
        : `https://gisp.gov.ru/goods/#/products?query=${encodeURIComponent(queryText)}`;
    }

    return clean;
  } catch {
    return isSupplier
      ? `https://yandex.ru/search/?text=${encodeURIComponent(queryText + " официальный сайт")}`
      : `https://gisp.gov.ru/goods/#/products?query=${encodeURIComponent(queryText)}`;
  }
}

export function resolveUniqueProductImage(
  productName: string,
  modelName?: string,
  index: number = 0
): string {
  const text = `${productName || ""} ${modelName || ""}`.toLowerCase();
  let key = "general";
  if (text.includes("кресл") || text.includes("стул") || text.includes("сиден")) key = "chair";
  else if (text.includes("стол") || text.includes("мест") || text.includes("верстак")) key = "desk";
  else if (text.includes("шкаф") || text.includes("стеллаж") || text.includes("тумб") || text.includes("сейф")) key = "cabinet";
  else if (text.includes("пк") || text.includes("компьютер") || text.includes("сервер") || text.includes("монитор") || text.includes("ноутбук") || text.includes("оргтехник")) key = "tech";
  else if (text.includes("кабель") || text.includes("провод") || text.includes("светильник") || text.includes("лампа") || text.includes("ввг")) key = "electrical";
  else if (text.includes("труб") || text.includes("арматур") || text.includes("краска") || text.includes("профиль")) key = "construction";
  else if (text.includes("бумаг") || text.includes("папк") || text.includes("картридж")) key = "office";
  else if (text.includes("маск") || text.includes("медиц") || text.includes("перчатк")) key = "medical";

  const bank = UNIQUE_PRODUCT_PHOTO_BANKS[key] || UNIQUE_PRODUCT_PHOTO_BANKS.general;
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
  const selectedIdx = Math.abs(hash + index) % bank.length;
  return bank[selectedIdx];
}
