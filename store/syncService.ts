/**
 * syncService.ts
 *
 * CORE RULE: The Cloud Bridge (alwaysdata) NEVER stores files.
 * It only holds lightweight TEXT rows (~2KB per property).
 * This service pulls those text rows and saves them to the phone's
 * local SQLite database for 100% offline access.
 */

import { getDatabase } from './database';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';

export type SyncResult = {
  success: boolean;
  propertiesSynced: number;
  pendingPushed: number;
  error?: string;
};

/**
 * Main sync entry point.
 * Call this on app open and every 10 minutes.
 */
export async function syncWithBridge(): Promise<SyncResult> {
  const apiUrl = useSettingsStore.getState().apiUrl;
  const token = useAuthStore.getState().token;

  if (!token) {
    return { success: false, propertiesSynced: 0, pendingPushed: 0, error: 'Not authenticated' };
  }

  let propertiesSynced = 0;
  let pendingPushed = 0;
  let error: string | undefined;

  try {
    // 1. Pull properties from bridge → save to local SQLite
    propertiesSynced = await pullProperties(apiUrl, token);

    // 2. Push any locally queued pending submissions to bridge
    pendingPushed = await pushPendingSubmissions(apiUrl, token);

    // 3. Update last sync timestamp
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync', ?)`,
      [new Date().toISOString()]
    );
  } catch (e: any) {
    error = e?.message ?? 'Unknown sync error';
    return { success: false, propertiesSynced, pendingPushed, error };
  } finally {
    // Refresh UI state from local SQLite after sync (or partial sync)
    try {
      const { loadProperties, loadStats } = require('./propertyStore').usePropertyStore.getState();
      await loadProperties();
      await loadStats();
    } catch(e) {}
  }

  return { success: true, propertiesSynced, pendingPushed };
}

/**
 * Pull all properties from the bridge (paginated) and upsert into local SQLite.
 * Only text + image URL strings are transferred — no binary files.
 */
async function pullProperties(apiUrl: string, token: string): Promise<number> {
  const db = await getDatabase();
  let page = 1;
  let totalSynced = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${apiUrl}/api/properties?page=${page}&limit=100`, {
      headers: { Authorization: `Bearer ${token}`, 'X-API-Key': token },
    });

    if (!res.ok) throw new Error(`Bridge returned ${res.status}`);
    const body = await res.json();

    if (!body.success) throw new Error(body.error ?? 'Bridge error');

    const properties: any[] = body.data?.properties ?? [];

    // Upsert each property into local SQLite
    for (const p of properties) {
      await db.runAsync(
        `INSERT OR REPLACE INTO properties (
          id, owner_name, mobile_number, address, city,
          area_marla, area_sqft, plot_length, plot_width,
          property_type, property_subtype, purpose, beds, baths, kitchens, parking, furnished, rent_monthly, security_deposit, installments_available, demand, demand_currency, status, notes,
          agent_name, agent_mobile, images, video_url, created_at, updated_at, synced_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          p.id,
          p.owner_name ?? null,
          p.mobile_number ?? null,
          p.address ?? null,
          p.city ?? null,
          p.area_marla ?? null,
          p.area_sqft ?? null,
          p.plot_length ?? null,
          p.plot_width ?? null,
          p.property_type ?? 'Residential',
          p.property_subtype ?? 'Plot',
          p.purpose ?? 'sale',
          p.beds ?? 0,
          p.baths ?? 0,
          p.kitchens ?? 0,
          p.parking ?? 0,
          p.furnished ?? 'Unfurnished',
          p.rent_monthly ?? null,
          p.security_deposit ?? null,
          p.installments_available ?? 0,
          p.demand ?? null,
          p.demand_currency ?? 'PKR',
          p.status ?? 'Available',
          p.notes ?? null,
          p.agent_name ?? null,
          p.agent_mobile ?? null,
          typeof p.images === 'string' ? p.images : JSON.stringify(p.images ?? []),
          p.video_url ?? null,
          p.created_at ?? null,
          p.updated_at ?? null,
          new Date().toISOString(),
        ]
      );
      totalSynced++;
    }

    const totalPages = body.data?.total_pages ?? 1;
    hasMore = page < totalPages;
    page++;
  }

  // Push pending submissions to the bridge
  await pushPendingSubmissions(apiUrl, token);
  
  // Pull updated statuses of pending submissions
  await pullMyPendingSubmissions(apiUrl, token);

  return totalSynced;
}

/**
 * Push any locally queued pending submissions to the bridge.
 * Called when internet is available. If offline, submissions stay queued.
 */
async function pushPendingSubmissions(apiUrl: string, token: string): Promise<number> {
  const db = await getDatabase();
  const queued = await db.getAllAsync<any>(
    `SELECT * FROM pending_submissions WHERE push_status = 'pending'`
  );

  let pushed = 0;

  for (const sub of queued) {
    try {
      const res = await fetch(`${apiUrl}/api/listings/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-API-Key': token,
        },
        body: JSON.stringify({
          submitted_by: useAuthStore.getState().user?.email ?? 'agent',
          submitted_from_device: 'mobile',
          submitted_at: sub.created_at,
          offline_queued: sub.submission_id ? 0 : 1,
          listing: {
            owner_name: sub.owner_name,
            mobile_number: sub.mobile_number,
            address: sub.address,
            city: sub.city,
            area_marla: sub.area_marla,
            area_sqft: sub.area_sqft,
            plot_length: sub.plot_length,
            plot_width: sub.plot_width,
            property_type: sub.property_type,
            property_subtype: sub.property_subtype,
            purpose: sub.purpose,
            status: sub.status,
            beds: sub.beds,
            baths: sub.baths,
            kitchens: sub.kitchens,
            parking: sub.parking,
            furnished: sub.furnished,
            rent_monthly: sub.rent_monthly,
            security_deposit: sub.security_deposit,
            installments_available: sub.installments_available,
            demand: sub.demand,
            demand_currency: sub.demand_currency,
            notes: sub.notes,
          },
        }),
      });

      if (res.ok) {
        const body = await res.json();
        const remoteId = body.data?.submission_id ?? null;
        
        // --- MEDIA UPLOAD (The Breathing Space) ---
        let mediaUploaded = true;
        const images: string[] = sub.images ? JSON.parse(sub.images) : [];
        if (images.length > 0 && remoteId) {
          const formData = new FormData();
          formData.append('submission_id', remoteId);
          
          images.forEach((uri, index) => {
            const ext = uri.split('.').pop() || 'jpg';
            // @ts-ignore - React Native FormData accepts an object for files
            formData.append('media[]', {
              uri,
              name: `media_${index}.${ext}`,
              type: `image/${ext}` // Simplified, actual type could be video/mp4 but bridge doesn't strictly check MIME
            });
          });

          try {
            const mediaRes = await fetch(`${apiUrl}/api/sync/media`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'X-API-Key': token,
              },
              body: formData,
            });
            if (!mediaRes.ok) {
              mediaUploaded = false;
            }
          } catch (e) {
            mediaUploaded = false;
          }
        }

        // Only mark as pushed if media upload also succeeded (or there was no media)
        if (mediaUploaded) {
          await db.runAsync(
            `UPDATE pending_submissions SET push_status = 'pushed', submission_id = ? WHERE local_id = ?`,
            [remoteId, sub.local_id]
          );
          pushed++;
        }
      }
    } catch (_) {
      // Silently skip — will retry on next sync
    }
  }

  return pushed;
}

/**
 * Pull the latest status of "my" pending submissions from the bridge.
 */
async function pullMyPendingSubmissions(apiUrl: string, token: string): Promise<void> {
  try {
    const res = await fetch(`${apiUrl}/api/listings/pending/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-API-Key': token,
      },
    });
    if (!res.ok) return;
    const body = await res.json();
    if (body.success && Array.isArray(body.data)) {
      const db = await getDatabase();
      for (const p of body.data) {
        await db.runAsync(
          `UPDATE pending_submissions SET status = ? WHERE submission_id = ?`,
          [p.status, p.submission_id]
        );
      }
    }
  } catch (_) {
    // Ignore offline errors
  }
}

/**
 * Save a new pending submission to the LOCAL mobile SQLite queue immediately.
 * Does not require internet. Will be pushed on next sync.
 */
export async function saveSubmissionLocally(data: {
  owner_name: string;
  mobile_number?: string;
  address?: string;
  city?: string;
  area_marla?: number;
  area_sqft?: number;
  plot_length?: number;
  plot_width?: number;
  property_type?: string;
  property_subtype?: string;
  purpose?: string;
  beds?: number;
  baths?: number;
  kitchens?: number;
  parking?: number;
  furnished?: string;
  rent_monthly?: number;
  security_deposit?: number;
  installments_available?: number;
  demand?: number;
  demand_currency?: string;
  notes?: string;
  images?: string[];
  status?: string;
}): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO pending_submissions (
      owner_name, mobile_number, address, city,
      area_marla, area_sqft, plot_length, plot_width,
      property_type, property_subtype, purpose, beds, baths, kitchens, parking,
      furnished, rent_monthly, security_deposit, installments_available,
      demand, demand_currency, notes, status, images,
      push_status, created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending',datetime('now'))`,
    [
      data.owner_name !== undefined ? data.owner_name : null,
      data.mobile_number !== undefined ? data.mobile_number : null,
      data.address !== undefined ? data.address : null,
      data.city !== undefined ? data.city : null,
      (typeof data.area_marla === 'number' && !Number.isNaN(data.area_marla)) ? data.area_marla : null,
      (typeof data.area_sqft === 'number' && !Number.isNaN(data.area_sqft)) ? data.area_sqft : null,
      (typeof data.plot_length === 'number' && !Number.isNaN(data.plot_length)) ? data.plot_length : null,
      (typeof data.plot_width === 'number' && !Number.isNaN(data.plot_width)) ? data.plot_width : null,
      data.property_type !== undefined ? data.property_type : 'Residential',
      data.property_subtype !== undefined ? data.property_subtype : null,
      data.purpose !== undefined ? data.purpose : 'sale',
      (typeof data.beds === 'number' && !Number.isNaN(data.beds)) ? data.beds : 0,
      (typeof data.baths === 'number' && !Number.isNaN(data.baths)) ? data.baths : 0,
      (typeof data.kitchens === 'number' && !Number.isNaN(data.kitchens)) ? data.kitchens : 0,
      (typeof data.parking === 'number' && !Number.isNaN(data.parking)) ? data.parking : 0,
      data.furnished !== undefined ? data.furnished : null,
      (typeof data.rent_monthly === 'number' && !Number.isNaN(data.rent_monthly)) ? data.rent_monthly : null,
      (typeof data.security_deposit === 'number' && !Number.isNaN(data.security_deposit)) ? data.security_deposit : null,
      (typeof data.installments_available === 'number' && !Number.isNaN(data.installments_available)) ? data.installments_available : 0,
      (typeof data.demand === 'number' && !Number.isNaN(data.demand)) ? data.demand : null,
      data.demand_currency !== undefined ? data.demand_currency : 'PKR',
      data.notes !== undefined ? data.notes : null,
      data.status !== undefined ? data.status : 'queued',
      JSON.stringify(data.images ?? []),
    ]
  );
}

/**
 * Get last sync time from local DB.
 */
export async function getLastSyncTime(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_meta WHERE key = 'last_sync'`
  );
  return row?.value ?? null;
}
