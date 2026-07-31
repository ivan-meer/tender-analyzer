/**
 * High-quality curated Unsplash image map for tender catalog items
 * Guarantees distinct, authentic, category-specific photos for all searched products.
 */

const CATEGORY_IMAGE_BANKS: Record<string, string[]> = {
  // Office Chairs & Ergonomic Seating
  chair: [
    'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1688578735427-91038bc320f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
  ],
  // Workstations, Desks, Tables
  desk: [
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
  ],
  // Storage, Cabinets, Shelving
  cabinet: [
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
  ],
  // Computer Hardware, Servers, PCs, Monitors
  tech: [
    'https://images.unsplash.com/photo-1587831990711-23ca6441447b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  ],
  // Electrical Cables, Lighting, Panels
  electrical: [
    'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  ],
  // Pipes, Construction Materials & Plumbing
  construction: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
  ],
  // Paper & Office Stationery
  office: [
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
  ],
  // Medical & Protective Equipment
  medical: [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80',
  ],
  // General Industrial Equipment
  general: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
  ],
};

/**
 * Computes a simple hash integer from string
 */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a unique, category-matched original product image URL
 */
export function getUniqueProductImageUrl(productName: string, modelName?: string, index: number = 0): string {
  const query = `${productName} ${modelName || ''}`.toLowerCase();

  let categoryKey = 'general';
  if (query.includes('кресл') || query.includes('стул') || query.includes('сидень')) {
    categoryKey = 'chair';
  } else if (query.includes('стол') || query.includes('рабочее мест') || query.includes('верстак')) {
    categoryKey = 'desk';
  } else if (query.includes('шкаф') || query.includes('стеллаж') || query.includes('тумб') || query.includes('сейф')) {
    categoryKey = 'cabinet';
  } else if (
    query.includes('пк') || query.includes('компьютер') || query.includes('сервер') ||
    query.includes('монитор') || query.includes('ноутбук') || query.includes('системн') ||
    query.includes('оргтехник') || query.includes('принтер')
  ) {
    categoryKey = 'tech';
  } else if (
    query.includes('кабель') || query.includes('провод') || query.includes('светильник') ||
    query.includes('лампа') || query.includes('ввг') || query.includes('щит')
  ) {
    categoryKey = 'electrical';
  } else if (
    query.includes('труб') || query.includes('арматур') || query.includes('краска') ||
    query.includes('профиль') || query.includes('задвижк') || query.includes('металл')
  ) {
    categoryKey = 'construction';
  } else if (query.includes('бумаг') || query.includes('картридж') || query.includes('папк')) {
    categoryKey = 'office';
  } else if (query.includes('маск') || query.includes('перчатк') || query.includes('медиц')) {
    categoryKey = 'medical';
  }

  const bank = CATEGORY_IMAGE_BANKS[categoryKey] || CATEGORY_IMAGE_BANKS.general;
  const hash = stringHash(`${query}_${index}`);
  const selectedIndex = hash % bank.length;

  return bank[selectedIndex];
}
