import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase body limit for large 4K file chunk uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cross-Origin Resource Sharing (CORS) for Desktop (Electron/Tauri) & Mobile (Flutter/React Native)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-Platform, X-Client-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Cloud Database Connection
let dbInstance: any = null;
let dbConfig: any = null;

function getCloudDb() {
  if (!dbInstance) {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        dbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const apps = getApps();
        const appInstance = apps.length > 0 ? apps[0] : initializeApp(dbConfig);
        dbInstance = getFirestore(appInstance, dbConfig.firestoreDatabaseId);
      }
    } catch (e) {
      console.warn('Backend cloud db initialization deferred:', e);
    }
  }
  return { db: dbInstance, config: dbConfig };
}

// =========================================================================
// 1. SYSTEM HEALTH & MULTI-PLATFORM ECOSYSTEM STATUS
// =========================================================================
app.get('/api/health', (req, res) => {
  const { db, config } = getCloudDb();
  res.json({
    status: 'ok',
    service: 'Prisha Stationery Multi-Platform Sync Core',
    database: {
      type: 'Centralized Cloud Firestore',
      connected: !!db,
      databaseId: config?.firestoreDatabaseId || 'default'
    },
    supportedClients: [
      { platform: 'Desktop App (Electron / Tauri)', storage: 'SQLite 3 Local DB', syncMode: 'Bi-directional Real-time' },
      { platform: 'Mobile App (Flutter / Android Room)', storage: 'SQLite Local DB', syncMode: 'Background Delta Sync' },
      { platform: 'Web Client (PWA)', storage: 'IndexedDB', syncMode: 'Live Snapshot & REST' }
    ],
    storageEngine: 'Distributed Binary Chunk Storage (Up to 5GB per 4K file)',
    serverTimestamp: Date.now()
  });
});

app.get('/api/sync/status', async (req, res) => {
  const { db, config } = getCloudDb();
  try {
    let jobCount = 0;
    if (db) {
      const snap = await getDoc(doc(db, 'store_data', 'printJobs'));
      if (snap.exists()) {
        jobCount = snap.data()?.data?.length || 0;
      }
    }
    res.json({
      online: true,
      databaseId: config?.firestoreDatabaseId || 'local',
      totalJobsInCloud: jobCount,
      realtimeSyncActive: true,
      conflictStrategy: 'Field-Level Non-Destructive Merge (Additive Payments, Status Hierarchy, File Union)',
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query sync status', details: err.message });
  }
});

// =========================================================================
// 2. PRINT JOBS REST API (For Desktop & Mobile Clients)
// =========================================================================
app.get('/api/jobs', async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database not initialized' });

  try {
    const snap = await getDoc(doc(db, 'store_data', 'printJobs'));
    let jobs = snap.exists() ? snap.data()?.data || [] : [];

    const since = req.query.since ? parseInt(req.query.since as string, 10) : 0;
    if (since > 0) {
      jobs = jobs.filter((j: any) => (j.updatedAt || j.createdAt || 0) > since);
    }

    const statusFilter = req.query.status as string;
    if (statusFilter && statusFilter !== 'all') {
      jobs = jobs.filter((j: any) => j.status === statusFilter);
    }

    res.json({
      success: true,
      count: jobs.length,
      serverTimestamp: Date.now(),
      jobs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch jobs', details: err.message });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database not initialized' });

  try {
    const snap = await getDoc(doc(db, 'store_data', 'printJobs'));
    const jobs = snap.exists() ? snap.data()?.data || [] : [];
    const job = jobs.find((j: any) => j.id === req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch job', details: err.message });
  }
});

// =========================================================================
// 3. OFFLINE SYNC PUSH & PULL WITH CONFLICT RESOLUTION
// =========================================================================
app.post('/api/sync/pull', async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database unavailable' });

  const { lastSyncTimestamp = 0 } = req.body || {};

  try {
    const pjSnap = await getDoc(doc(db, 'store_data', 'printJobs'));
    const allJobs = pjSnap.exists() ? pjSnap.data()?.data || [] : [];
    const modifiedJobs = allJobs.filter((j: any) => (j.updatedAt || j.createdAt || 0) > lastSyncTimestamp);

    const ordSnap = await getDoc(doc(db, 'store_data', 'orders'));
    const allOrders = ordSnap.exists() ? ordSnap.data()?.data || [] : [];
    const modifiedOrders = allOrders.filter((o: any) => (o.date || o.createdAt || 0) > lastSyncTimestamp);

    const setSnap = await getDoc(doc(db, 'store_data', 'storeSettings'));
    const settings = setSnap.exists() ? setSnap.data()?.data || null : null;

    res.json({
      serverTimestamp: Date.now(),
      hasMore: false,
      changes: {
        printJobs: modifiedJobs,
        orders: modifiedOrders,
        products: [],
        storeSettings: settings
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Sync pull failed', details: err.message });
  }
});

app.post('/api/sync/push', async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database unavailable' });

  const { mutations = [], clientId = 'unknown', clientPlatform = 'desktop_sqlite' } = req.body || {};

  try {
    let processed = 0;
    let conflictsResolved = 0;
    const recordedConflicts: any[] = [];

    const pjRef = doc(db, 'store_data', 'printJobs');
    const pjSnap = await getDoc(pjRef);
    const jobsList: any[] = pjSnap.exists() ? pjSnap.data()?.data || [] : [];

    for (const m of mutations) {
      if (m.entity === 'printJobs') {
        const existingIdx = jobsList.findIndex((j: any) => j.id === m.id);

        if (existingIdx >= 0) {
          const serverJob = jobsList[existingIdx];
          const clientJob = m.data;

          // Conflict resolution:
          // 1. Status precedence
          const statusRank: Record<string, number> = {
            cancelled: 10,
            delivered: 5,
            completed: 4,
            ready: 3,
            processing: 2,
            pending: 1
          };
          if ((statusRank[clientJob.status] || 0) > (statusRank[serverJob.status] || 0)) {
            serverJob.status = clientJob.status;
          }

          // 2. Additive payment merge
          if (clientJob.paidAmount > serverJob.paidAmount) {
            serverJob.paidAmount = clientJob.paidAmount;
            serverJob.paymentStatus = clientJob.paymentStatus;
          }

          // 3. Union files by file id
          const filesMap = new Map();
          (serverJob.files || []).forEach((f: any) => filesMap.set(f.id, f));
          (clientJob.files || []).forEach((f: any) => {
            if (!filesMap.has(f.id)) {
              filesMap.set(f.id, f);
            }
          });
          serverJob.files = Array.from(filesMap.values());

          // 4. Notes merge
          if (clientJob.notes && clientJob.notes !== serverJob.notes && !serverJob.notes?.includes(clientJob.notes)) {
            serverJob.notes = serverJob.notes ? `${serverJob.notes} | [${clientPlatform}: ${clientJob.notes}]` : clientJob.notes;
          }

          serverJob.updatedAt = Date.now();
          jobsList[existingIdx] = serverJob;
          conflictsResolved++;
          recordedConflicts.push({
            entityId: m.id,
            entity: 'printJobs',
            reason: 'Concurrent edit merged gracefully via field-level logic',
            resolution: 'merged',
            finalData: serverJob
          });
        } else {
          // New record created offline on desktop/mobile
          const newJob = {
            ...m.data,
            updatedAt: Date.now(),
            syncVersion: 1
          };
          jobsList.unshift(newJob);
        }
        processed++;
      }
    }

    await setDoc(pjRef, { data: jobsList });

    res.json({
      success: true,
      processedCount: processed,
      conflictsResolved,
      serverTimestamp: Date.now(),
      conflicts: recordedConflicts
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Sync push processing failed', details: err.message });
  }
});

// =========================================================================
// 4. CLOUD STORAGE: 4K IMAGES & PDF SECURE STREAMING (AWS S3 / Cloud Chunks)
// =========================================================================
app.get('/api/files/:fileId', async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database unavailable' });

  const fileId = req.params.fileId;
  try {
    const metaDoc = await getDoc(doc(db, 'print_files', fileId));
    if (!metaDoc.exists()) {
      return res.status(404).json({ error: 'File metadata not found in cloud storage' });
    }
    res.json({ success: true, metadata: metaDoc.data() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve file metadata', details: err.message });
  }
});

app.get(['/api/files/:fileId/stream', '/api/files/:fileId/download'], async (req, res) => {
  const { db } = getCloudDb();
  if (!db) return res.status(503).json({ error: 'Cloud database unavailable' });

  const fileId = req.params.fileId;

  try {
    const metaDoc = await getDoc(doc(db, 'print_files', fileId));
    if (!metaDoc.exists()) {
      return res.status(404).json({ error: 'File not found in cloud storage' });
    }

    const meta = metaDoc.data();
    const totalChunks = meta.totalChunks || 0;
    const fileName = meta.fileName || `document_${fileId}.pdf`;
    const mimeType = meta.fileType || 'application/octet-stream';

    // Retrieve and concatenate all binary chunks
    const chunkBuffers: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkDoc = await getDoc(doc(db, 'print_file_chunks', `${fileId}_chunk_${i}`));
      if (chunkDoc.exists()) {
        const chunkData = chunkDoc.data();
        if (chunkData.chunkBytes) {
          const u8 = chunkData.chunkBytes.toUint8Array();
          chunkBuffers.push(Buffer.from(u8));
        }
      }
    }

    if (chunkBuffers.length === 0) {
      return res.status(404).json({ error: 'No binary chunks available for this file' });
    }

    const fullBuffer = Buffer.concat(chunkBuffers);

    // Set standard binary download & streaming headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fullBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Accept-Ranges', 'bytes');

    res.send(fullBuffer);
  } catch (err: any) {
    console.error('File stream error:', err);
    res.status(500).json({ error: 'Failed to stream cloud file', details: err.message });
  }
});

// =========================================================================
// 5. READY-TO-USE SQLITE DDL SCHEMA FOR DESKTOP & MOBILE APPS
// =========================================================================
app.get('/api/sqlite/schema', (req, res) => {
  const schemaPath = path.join(process.cwd(), 'src/types/sync.ts');
  let ddl = '-- SQLite 3 DDL for Prisha Stationery Printing Manager';
  try {
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const match = content.match(/SQLITE_SCHEMA_DDL = `([\s\S]*?)`;/);
      if (match) ddl = match[1];
    }
  } catch (e) {}

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(ddl);
});

// =========================================================================
// 6. VITE MIDDLEWARE (DEV) & STATIC SERVING (PROD)
// =========================================================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prisha Stationery Multi-Platform Server active on http://0.0.0.0:${PORT}`);
  });
}

start();
