import { PrintJobRecord, OrderRecord, ProductItem, StoreSettings } from '../types';
import { SyncMutation, SyncPushPayload, SyncPushResponse, SyncPullResponse, ConflictRecord } from '../types/sync';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sanitizeForFirestore } from '../hooks/useFirebaseSync';

const CLIENT_ID_KEY = 'prisha_device_client_id';
const PENDING_MUTATIONS_KEY = 'prisha_pending_sync_mutations';
const CONFLICT_LOG_KEY = 'prisha_sync_conflicts_log';
const LAST_SYNC_TS_KEY = 'prisha_last_sync_timestamp';

/**
 * Get or generate a persistent unique Device ID for this client (Desktop, Mobile, or Browser)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-runner';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

/**
 * Detect client platform
 */
export function getClientPlatform(): 'desktop_sqlite' | 'mobile_sqlite' | 'web_indexeddb' {
  if (typeof window === 'undefined') return 'desktop_sqlite';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('electron') || ua.includes('tauri')) return 'desktop_sqlite';
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return 'mobile_sqlite';
  return 'web_indexeddb';
}

/**
 * Queue a mutation for offline background sync
 */
export function enqueueOfflineMutation(mutation: Omit<SyncMutation, 'clientId' | 'clientUpdatedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_MUTATIONS_KEY);
    const list: SyncMutation[] = raw ? JSON.parse(raw) : [];
    const fullMutation: SyncMutation = {
      ...mutation,
      clientId: getOrCreateDeviceId(),
      clientUpdatedAt: Date.now()
    };
    list.push(fullMutation);
    localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to enqueue offline mutation:', e);
  }
}

/**
 * Get count of pending offline mutations
 */
export function getPendingMutationCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(PENDING_MUTATIONS_KEY);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}

/**
 * Clear queued mutations after successful push
 */
export function clearPendingMutations(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_MUTATIONS_KEY);
}

/**
 * Field-Level Non-Destructive Conflict Resolver:
 * Handles concurrent edits between Desktop (SQLite) and Mobile (SQLite/App):
 * - Status progressions (e.g. 'completed', 'delivered') take precedence over earlier stages.
 * - Payment updates (e.g. customer paid on mobile while desktop printed) are merged additively.
 * - Files and attachments from both devices are unioned by file ID.
 * - Notes are concatenated if divergent.
 */
export function resolvePrintJobConflict(
  serverJob: PrintJobRecord,
  clientJob: PrintJobRecord
): { resolvedJob: PrintJobRecord; wasConflict: boolean; reason: string } {
  let wasConflict = false;
  let reason = '';

  const resolved: PrintJobRecord = { ...serverJob };

  // 1. Status Hierarchy: 'completed' > 'ready' > 'processing' > 'pending'
  const statusRank: Record<string, number> = {
    cancelled: 10,
    delivered: 5,
    completed: 4,
    ready: 3,
    processing: 2,
    pending: 1
  };

  const serverRank = statusRank[serverJob.status] || 0;
  const clientRank = statusRank[clientJob.status] || 0;

  if (clientRank > serverRank) {
    resolved.status = clientJob.status;
    wasConflict = true;
    reason += `Status progressed to ${clientJob.status}; `;
  }

  // 2. Payment Conflict Resolution: Merge payments additively
  const clientPaid = clientJob.paidAmount || 0;
  const serverPaid = serverJob.paidAmount || 0;
  if (clientPaid > serverPaid) {
    resolved.paidAmount = clientPaid;
    resolved.paymentStatus = clientJob.paymentStatus;
    wasConflict = true;
    reason += `Payment updated to ₹${clientPaid}; `;
  }

  // 3. Files union by file id (neither side loses customer 4K images or docs)
  const fileMap = new Map<string, any>();
  (serverJob.files || []).forEach(f => fileMap.set(f.id, f));
  (clientJob.files || []).forEach(f => {
    if (!fileMap.has(f.id)) {
      fileMap.set(f.id, f);
      wasConflict = true;
      reason += `Added file ${f.fileName}; `;
    } else {
      // If client updated file notes or lamination, merge
      const existing = fileMap.get(f.id);
      fileMap.set(f.id, { ...existing, ...f });
    }
  });
  resolved.files = Array.from(fileMap.values());

  // 4. Notes resolution: combine distinct notes
  const clientNotes = clientJob.notes || clientJob.adminNotes;
  const serverNotes = serverJob.notes || serverJob.adminNotes;
  if (clientNotes && clientNotes !== serverNotes) {
    if (!serverNotes) {
      resolved.notes = clientNotes;
    } else if (!serverNotes.includes(clientNotes)) {
      resolved.notes = `${serverNotes} | [Mobile/Desktop Note: ${clientNotes}]`;
      wasConflict = true;
      reason += 'Merged divergent notes; ';
    }
  }

  // 5. Timestamp: update to newest
  resolved.updatedAt = Math.max(serverJob.updatedAt || 0, clientJob.updatedAt || 0, Date.now());

  return { resolvedJob: resolved, wasConflict, reason: reason || 'Concurrent edit resolved via field-level merge' };
}

/**
 * Push pending offline mutations to the centralized REST API or Firestore
 */
export async function pushOfflineSync(): Promise<SyncPushResponse> {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(PENDING_MUTATIONS_KEY) : null;
  const mutations: SyncMutation[] = raw ? JSON.parse(raw) : [];

  if (mutations.length === 0) {
    return {
      success: true,
      processedCount: 0,
      conflictsResolved: 0,
      serverTimestamp: Date.now(),
      conflicts: []
    };
  }

  const payload: SyncPushPayload = {
    clientId: getOrCreateDeviceId(),
    clientPlatform: getClientPlatform(),
    clientVersion: '2.0.0',
    mutations
  };

  try {
    // Attempt REST push endpoint first
    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data: SyncPushResponse = await res.json();
      clearPendingMutations();
      return data;
    }
  } catch (err) {
    console.warn('REST sync push failed, falling back to direct Firestore sync:', err);
  }

  // Fallback: Direct Firestore batch processing
  let processed = 0;
  let conflictsResolved = 0;
  const recordedConflicts: any[] = [];

  try {
    for (const m of mutations) {
      if (m.entity === 'printJobs') {
        const pjRef = doc(db, 'store_data', 'printJobs');
        const snap = await getDoc(pjRef);
        const currentList: PrintJobRecord[] = snap.exists() ? snap.data()?.data || [] : [];

        const existingIdx = currentList.findIndex(j => j.id === m.id);
        if (existingIdx >= 0) {
          const { resolvedJob, wasConflict, reason } = resolvePrintJobConflict(currentList[existingIdx], m.data);
          currentList[existingIdx] = resolvedJob;
          if (wasConflict) {
            conflictsResolved++;
            recordedConflicts.push({
              entityId: m.id,
              entity: 'printJobs',
              reason,
              resolution: 'merged',
              finalData: resolvedJob
            });
          }
        } else {
          currentList.unshift(m.data);
        }

        await setDoc(pjRef, { data: sanitizeForFirestore(currentList) });
        processed++;
      } else if (m.entity === 'products') {
        const prodRef = doc(db, 'store_data', 'products');
        const snap = await getDoc(prodRef);
        const prodList: any[] = snap.exists() ? snap.data()?.data || [] : [];
        const existingIdx = prodList.findIndex((p: any) => p.id === m.id);
        if (existingIdx >= 0) {
          prodList[existingIdx] = { ...prodList[existingIdx], ...m.data };
        } else {
          prodList.unshift(m.data);
        }
        await setDoc(prodRef, { data: sanitizeForFirestore(prodList) });
        processed++;
      }
    }

    clearPendingMutations();

    return {
      success: true,
      processedCount: processed,
      conflictsResolved,
      serverTimestamp: Date.now(),
      conflicts: recordedConflicts
    };
  } catch (error: any) {
    console.error('Direct Firestore push failed:', error);
    return {
      success: false,
      processedCount: 0,
      conflictsResolved: 0,
      serverTimestamp: Date.now(),
      conflicts: []
    };
  }
}

/**
 * Pull latest changes from Centralized Cloud Backend
 */
export async function pullCloudSync(lastTimestamp = 0): Promise<SyncPullResponse | null> {
  try {
    const res = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: getOrCreateDeviceId(),
        clientPlatform: getClientPlatform(),
        lastSyncTimestamp: lastTimestamp
      })
    });

    if (res.ok) {
      const data: SyncPullResponse = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_SYNC_TS_KEY, data.serverTimestamp.toString());
      }
      return data;
    }
  } catch (e) {
    console.warn('REST pull failed, relying on Firestore real-time listener:', e);
  }
  return null;
}

/**
 * Get cross-platform secure download URL for 4K customer images and PDFs
 */
export function getCrossPlatformFileDownloadUrl(fileId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/files/${encodeURIComponent(fileId)}/download`;
  }
  return `/api/files/${encodeURIComponent(fileId)}/download`;
}
