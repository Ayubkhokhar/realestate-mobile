import { create } from 'zustand';
import { getDatabase } from './database';

export type Property = {
  id: number;
  owner_name: string | null;
  mobile_number: string | null;
  address: string | null;
  city: string | null;
  area_marla: number | null;
  area_sqft: number | null;
  plot_length: number | null;
  plot_width: number | null;
  property_type: string;
  demand: number | null;
  demand_currency: string;
  status: 'Available' | 'Reserved' | 'Sold' | string;
  notes: string | null;
  agent_name: string | null;
  agent_mobile: string | null;
  images: string[];   // array of URL strings — no binary files
  created_at: string | null;
  updated_at: string | null;
  synced_at: string | null;
  video_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  property_subtype?: string | null;
  installments_available?: boolean | null;
  purpose?: string | null;
  beds?: number | null;
  baths?: number | null;
  kitchens?: number | null;
  parking?: number | null;
  furnished?: string | null;
  rent_monthly?: number | null;
  security_deposit?: number | null;
};

export type PropertyFilters = {
  query?: string;
  status?: string;
  city?: string;
  property_type?: string;
  purpose?: string;
  min_marla?: number;
  max_marla?: number;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
};

export type PropertyStats = {
  total: number;
  available: number;
  sold: number;
  reserved: number;
};

interface PropertyState {
  properties: Property[];
  stats: PropertyStats;
  isLoading: boolean;
  error: string | null;

  // Load all properties from local SQLite
  loadProperties: (filters?: PropertyFilters) => Promise<void>;
  // Get a single property by id from local SQLite
  getPropertyById: (id: number) => Promise<Property | null>;
  // Reload stats for dashboard
  loadStats: () => Promise<void>;
}

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  stats: { total: 0, available: 0, sold: 0, reserved: 0 },
  isLoading: false,
  error: null,

  loadProperties: async (filters: PropertyFilters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const db = await getDatabase();

      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      const pendingConditions: string[] = ['1=1'];
      const pendingParams: any[] = [];

      if (filters.query) {
        const q = `%${filters.query}%`;
        conditions.push(`(owner_name LIKE ? OR city LIKE ? OR address LIKE ? OR notes LIKE ?)`);
        params.push(q, q, q, q);
        pendingConditions.push(`(owner_name LIKE ? OR city LIKE ? OR address LIKE ? OR notes LIKE ?)`);
        pendingParams.push(q, q, q, q);
      }
      if (filters.status && filters.status !== 'All') {
        conditions.push('status = ?');
        params.push(filters.status);
        pendingConditions.push('status = ?');
        pendingParams.push(filters.status);
      }
      if (filters.city) {
        conditions.push('city LIKE ?');
        params.push(`%${filters.city}%`);
        pendingConditions.push('city LIKE ?');
        pendingParams.push(`%${filters.city}%`);
      }
      if (filters.property_type && filters.property_type !== 'All') {
        conditions.push('property_type = ?');
        params.push(filters.property_type);
        pendingConditions.push('property_type = ?');
        pendingParams.push(filters.property_type);
      }
      if (filters.purpose && filters.purpose !== 'All') {
        const purposeVal = filters.purpose === 'For Rent' ? 'rent' : 'sale';
        conditions.push('purpose = ?');
        params.push(purposeVal);
        pendingConditions.push('purpose = ?');
        pendingParams.push(purposeVal);
      }
      if (filters.min_marla != null) {
        conditions.push('area_marla >= ?');
        params.push(filters.min_marla);
        pendingConditions.push('area_marla >= ?');
        pendingParams.push(filters.min_marla);
      }
      if (filters.max_marla != null) {
        conditions.push('area_marla <= ?');
        params.push(filters.max_marla);
        pendingConditions.push('area_marla <= ?');
        pendingParams.push(filters.max_marla);
      }
      if (filters.min_price != null) {
        conditions.push('demand >= ?');
        params.push(filters.min_price);
        pendingConditions.push('demand >= ?');
        pendingParams.push(filters.min_price);
      }
      if (filters.max_price != null) {
        conditions.push('demand <= ?');
        params.push(filters.max_price);
        pendingConditions.push('demand <= ?');
        pendingParams.push(filters.max_price);
      }

      let orderBy = 'ORDER BY created_at DESC';
      if (filters.sort === 'price_asc') orderBy = 'ORDER BY demand ASC';
      else if (filters.sort === 'price_desc') orderBy = 'ORDER BY demand DESC';

      // Load synced properties from bridge
      const where = conditions.join(' AND ');
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM properties WHERE ${where} ${orderBy}`,
        params
      );

      // Also load offline pending submissions so agent sees their own work immediately
      const pendingWhere = pendingConditions.join(' AND ');
      const pendingRows = await db.getAllAsync<any>(
        `SELECT local_id as id, owner_name, mobile_number, address, city, area_marla, area_sqft,
         plot_length, plot_width, property_type, property_subtype, purpose, beds, baths,
         kitchens, parking, furnished, rent_monthly, security_deposit, installments_available,
         demand, demand_currency, notes, status, images, push_status,
         created_at, NULL as updated_at, NULL as synced_at
         FROM pending_submissions WHERE ${pendingWhere} ORDER BY created_at DESC`,
        pendingParams
      );

      // Mark pending as '⏳ Pending Sync' so user knows
      const pendingProperties: Property[] = pendingRows.map((r: any) => ({
        ...r,
        id: `pending_${r.id}`,
        status: r.status || '⏳ Pending Sync',
        images: parseImages(r.images),
      }));

      const syncedProperties: Property[] = rows.map((r) => ({
        ...r,
        images: parseImages(r.images),
      }));

      set({ properties: [...pendingProperties, ...syncedProperties], isLoading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Failed to load properties', isLoading: false });
    }
  },

  getPropertyById: async (id: number): Promise<Property | null> => {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<any>(
        `SELECT * FROM properties WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!row) return null;
      return { ...row, images: parseImages(row.images) };
    } catch {
      return null;
    }
  },

  loadStats: async () => {
    try {
      const db = await getDatabase();

      const total = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM properties`
      );
      const available = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM properties WHERE status = 'Available'`
      );
      const sold = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM properties WHERE status = 'Sold'`
      );
      const reserved = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM properties WHERE status = 'Reserved'`
      );

      set({
        stats: {
          total: total?.count ?? 0,
          available: available?.count ?? 0,
          sold: sold?.count ?? 0,
          reserved: reserved?.count ?? 0,
        },
      });
    } catch {
      // Keep last known stats on error
    }
  },
}));
