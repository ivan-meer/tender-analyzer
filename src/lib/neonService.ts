export interface NeonSupplier {
  id: number;
  companyName: string;
  region?: string;
  specialization?: string;
  contactsOrWebsite?: string;
  websiteUrl?: string;
  inGispRegistry?: boolean;
  createdAt?: string;
  catalogCount?: number;
}

export interface NeonCatalogItem {
  id: number;
  category: string;
  modelName: string;
  manufacturer: string;
  country: string;
  dimensions: string;
  estimatedPrice: number;
  priceFormatted: string;
  description: string;
  gispRegistryStatus: string;
  productUrl: string;
  imageUrl: string;
  productFeatures: string[];
  supplierName: string;
  supplierContacts?: string;
  supplierWebsite?: string;
  inGispRegistry?: boolean;
}

export interface NeonStatus {
  status: string;
  database: string;
  host: string;
  suppliersCount: number;
  itemsCount: number;
  currentTime?: string;
}

export interface NeonCatalogQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inGispOnly?: boolean;
}

export interface NeonTableColumn {
  column: string;
  type: string;
  nullable: boolean;
  default: string | null;
}

export interface NeonTableSchema {
  tableName: string;
  columnCount: number;
  columns: NeonTableColumn[];
}

export interface NeonDbSchemaResponse {
  status: string;
  database: string;
  host: string;
  counts: {
    suppliers_count: string | number;
    items_count: string | number;
  };
  tables: NeonTableSchema[];
}

export class NeonService {
  /**
   * Fetch complete PostgreSQL schema structure from Neon DB
   */
  static async getSchema(): Promise<NeonDbSchemaResponse> {
    const res = await fetch('/api/neon/schema');
    if (!res.ok) {
      throw new Error('Failed to fetch Neon DB schema');
    }
    return res.json();
  }

  /**
   * Check connection status and get entity counts from Neon DB
   */
  static async getStatus(): Promise<NeonStatus> {
    const res = await fetch('/api/neon/status');
    if (!res.ok) {
      throw new Error('Failed to connect to Neon PostgreSQL');
    }
    return res.json();
  }

  /**
   * Get all registered suppliers in Neon DB
   */
  static async getSuppliers(): Promise<NeonSupplier[]> {
    const res = await fetch('/api/neon/suppliers');
    if (!res.ok) {
      throw new Error('Failed to fetch suppliers from Neon DB');
    }
    return res.json();
  }

  /**
   * Search and query catalog items with technical specs & pricing
   */
  static async getCatalog(query: NeonCatalogQuery = {}): Promise<NeonCatalogItem[]> {
    const url = new URL('/api/neon/catalog', window.location.origin);
    if (query.search) url.searchParams.set('search', query.search);
    if (query.category && query.category !== 'ALL') url.searchParams.set('category', query.category);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error('Failed to fetch catalog from Neon DB');
    }

    let items: NeonCatalogItem[] = await res.json();

    // Client-side filtering extensions for price range and GISP status
    if (query.minPrice !== undefined && !isNaN(query.minPrice)) {
      items = items.filter(item => item.estimatedPrice >= query.minPrice!);
    }
    if (query.maxPrice !== undefined && !isNaN(query.maxPrice)) {
      items = items.filter(item => item.estimatedPrice <= query.maxPrice!);
    }
    if (query.inGispOnly) {
      items = items.filter(item => item.inGispRegistry !== false);
    }

    return items;
  }

  /**
   * Add a new product/model with technical specifications & price to Neon DB
   */
  static async addCatalogItem(payload: {
    companyName: string;
    category: string;
    modelName: string;
    dimensions: string;
    estimatedPrice: number;
    priceFormatted?: string;
    description: string;
    gispRegistryStatus?: string;
    productUrl?: string;
    imageUrl?: string;
    productFeatures?: string[];
  }): Promise<NeonCatalogItem> {
    const res = await fetch('/api/neon/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add item to Neon DB');
    }

    return res.json();
  }

  /**
   * Delete catalog item from Neon DB
   */
  static async deleteCatalogItem(id: number): Promise<boolean> {
    const res = await fetch(`/api/neon/catalog/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete item from Neon DB');
    }

    return true;
  }

  /**
   * Update existing catalog item in Neon DB
   */
  static async updateCatalogItem(id: number, payload: Partial<{
    companyName: string;
    supplierName: string;
    category: string;
    modelName: string;
    dimensions: string;
    estimatedPrice: number;
    priceFormatted: string;
    description: string;
    gispRegistryStatus: string;
    productUrl: string;
    imageUrl: string;
    productFeatures: string[];
  }>): Promise<NeonCatalogItem> {
    const res = await fetch(`/api/neon/catalog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update item in Neon DB');
    }

    return res.json();
  }

  /**
   * Add a supplier company to Neon DB
   */
  static async addSupplier(supplier: {
    companyName: string;
    region?: string;
    specialization?: string;
    contactsOrWebsite?: string;
    websiteUrl?: string;
    inGispRegistry?: boolean;
  }): Promise<NeonSupplier> {
    const res = await fetch('/api/neon/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });

    if (!res.ok) {
      throw new Error('Failed to add supplier to Neon DB');
    }

    return res.json();
  }

  /**
   * Update existing supplier in Neon DB
   */
  static async updateSupplier(id: number, supplier: Partial<{
    companyName: string;
    region: string;
    specialization: string;
    contactsOrWebsite: string;
    websiteUrl: string;
    inGispRegistry: boolean;
  }>): Promise<NeonSupplier> {
    const res = await fetch(`/api/neon/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplier),
    });

    if (!res.ok) {
      throw new Error('Failed to update supplier in Neon DB');
    }

    return res.json();
  }

  /**
   * Delete supplier from Neon DB
   */
  static async deleteSupplier(id: number): Promise<boolean> {
    const res = await fetch(`/api/neon/suppliers/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('Failed to delete supplier from Neon DB');
    }

    return true;
  }
}
