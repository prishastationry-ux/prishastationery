export type ClientPlatform = 'desktop_sqlite' | 'mobile_sqlite' | 'web_indexeddb' | 'rest_client';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncMutation {
  id: string;
  entity: 'printJobs' | 'orders' | 'products' | 'storeSettings';
  operation: SyncOperation;
  data: any;
  clientUpdatedAt: number;
  baseVersion?: number;
  clientId: string;
}

export interface SyncPushPayload {
  clientId: string;
  clientPlatform: ClientPlatform;
  clientVersion?: string;
  mutations: SyncMutation[];
}

export interface SyncPushResponse {
  success: boolean;
  processedCount: number;
  conflictsResolved: number;
  serverTimestamp: number;
  conflicts: Array<{
    entityId: string;
    entity: string;
    reason: string;
    resolution: 'server_wins' | 'client_wins' | 'merged';
    finalData: any;
  }>;
}

export interface SyncPullPayload {
  clientId: string;
  clientPlatform?: ClientPlatform;
  lastSyncTimestamp: number;
  entities?: Array<'printJobs' | 'orders' | 'products' | 'storeSettings'>;
}

export interface SyncPullResponse {
  serverTimestamp: number;
  hasMore: boolean;
  changes: {
    printJobs: any[];
    orders: any[];
    products: any[];
    storeSettings?: any;
  };
}

export interface ConflictRecord {
  id: string;
  entity: string;
  entityId: string;
  clientId: string;
  platform: ClientPlatform;
  detectedAt: number;
  clientData: any;
  serverData: any;
  resolvedData: any;
  resolutionStrategy: 'merged_field_level' | 'last_write_wins' | 'admin_override';
  status: 'auto_resolved' | 'pending_review';
}

export interface MultiPlatformDevice {
  id: string;
  name: string;
  platform: ClientPlatform;
  lastSeenAt: number;
  pendingSyncCount: number;
  appVersion: string;
  isOnline: boolean;
}

/**
 * SQLite 3 DDL schemas designed for Desktop (Electron / Tauri / C#)
 * and Mobile (Android Room / SQLite / React Native / Flutter)
 */
export const SQLITE_SCHEMA_DDL = `
-- =========================================================================
-- PRISHA STATIONERY PRINTING MANAGER: OFFLINE-FIRST SQLITE SCHEMA
-- Designed for Desktop (Electron / Tauri) and Mobile (Flutter / React Native)
-- =========================================================================

-- 1. Print Jobs Table
CREATE TABLE IF NOT EXISTS print_jobs (
    id TEXT PRIMARY KEY,
    token_number TEXT,
    customer_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, cancelled
    delivery_type TEXT DEFAULT 'shop_pickup', -- shop_pickup, home_delivery
    total_amount REAL NOT NULL DEFAULT 0.0,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, partial
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'synced', -- synced, pending_push, conflict
    sync_version INTEGER DEFAULT 1
);

-- 2. Print Job Files Table (Metadata & Local Cache Path)
CREATE TABLE IF NOT EXISTS print_job_files (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    copies INTEGER NOT NULL DEFAULT 1,
    color_mode TEXT NOT NULL DEFAULT 'black_white', -- black_white, color
    side_option TEXT NOT NULL DEFAULT 'single_side', -- single_side, double_side
    paper_size TEXT NOT NULL DEFAULT 'A4',
    lamination INTEGER NOT NULL DEFAULT 0, -- 0 = false, 1 = true
    notes TEXT,
    cloud_file_id TEXT,
    local_cache_path TEXT,
    uploaded_to_cloud INTEGER DEFAULT 0,
    FOREIGN KEY (job_id) REFERENCES print_jobs(id) ON DELETE CASCADE
);

-- 3. Offline Sync Journal (Change Tracker / Outbox Queue)
CREATE TABLE IF NOT EXISTS sync_journal (
    journal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL, -- printJobs, orders, products
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- create, update, delete
    payload_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_push', -- pending_push, pushed, failed
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- 4. Sync Conflicts Audit Table
CREATE TABLE IF NOT EXISTS sync_conflicts (
    conflict_id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    client_data TEXT NOT NULL,
    server_data TEXT NOT NULL,
    resolved_data TEXT,
    resolution_status TEXT DEFAULT 'auto_resolved',
    detected_at INTEGER NOT NULL
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON print_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_files_job_id ON print_job_files(job_id);
CREATE INDEX IF NOT EXISTS idx_sync_journal_status ON sync_journal(status);
`;
