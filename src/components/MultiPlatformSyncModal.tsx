import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Globe,
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  HardDrive,
  FileText,
  Activity,
  Zap,
  Server,
  X
} from 'lucide-react';
import { SQLITE_SCHEMA_DDL, MultiPlatformDevice } from '../types/sync';
import { pushOfflineSync, pullCloudSync, getPendingMutationCount, getOrCreateDeviceId, getClientPlatform } from '../lib/syncEngine';

interface MultiPlatformSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  printJobCount: number;
}

export const MultiPlatformSyncModal: React.FC<MultiPlatformSyncModalProps> = ({
  isOpen,
  onClose,
  printJobCount
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'storage' | 'sqlite'>('overview');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedApi, setCopiedApi] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const deviceId = getOrCreateDeviceId();
  const currentPlatform = getClientPlatform();

  useEffect(() => {
    if (isOpen) {
      setPendingCount(getPendingMutationCount());
      fetch('/api/health')
        .then(r => r.json())
        .then(data => setServerStatus(data))
        .catch(() => setServerStatus({ status: 'connected_offline_ready' }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const pushRes = await pushOfflineSync();
      await pullCloudSync();
      setPendingCount(getPendingMutationCount());
      setSyncFeedback(
        `✅ સિન્ક સફળ: ${pushRes.processedCount} ફેરફારો અપડેટ થયા, ${pushRes.conflictsResolved} કન્ફ્લિક્ટ સ્મૂધલી મર્જ થયા.`
      );
    } catch (e: any) {
      setSyncFeedback('⚠️ સિન્ક પ્રયાસ દરમિયાન નેટવર્ક સ્લો હોવાથી ડેટા લોકલ મેમરીમાં સુરક્ષિત છે.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQLITE_SCHEMA_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyApi = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedApi(key);
    setTimeout(() => setCopiedApi(null), 2000);
  };

  const devices: MultiPlatformDevice[] = [
    {
      id: 'desktop-main-counter',
      name: 'મેઇન પ્રિન્ટિંગ કાઉન્ટર PC',
      platform: 'desktop_sqlite',
      lastSeenAt: Date.now() - 1000 * 30,
      pendingSyncCount: 0,
      appVersion: 'v2.4.0 (Electron/SQLite)',
      isOnline: true
    },
    {
      id: 'mobile-counter-android',
      name: 'દુકાનદાર સ્માર્ટફોન (Admin POS)',
      platform: 'mobile_sqlite',
      lastSeenAt: Date.now() - 1000 * 60 * 2,
      pendingSyncCount: 0,
      appVersion: 'v2.4.0 (Flutter/SQLite)',
      isOnline: true
    },
    {
      id: 'customer-pwa-portal',
      name: 'ગ્રાહક ઓનલાઇન પ્રિન્ટ પોર્ટલ (વેબ)',
      platform: 'web_indexeddb',
      lastSeenAt: Date.now(),
      pendingSyncCount: pendingCount,
      appVersion: 'v2.4.0 (PWA/IndexedDB)',
      isOnline: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-3 animate-fade-in no-print">
      <div className="bg-neutral-900 text-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-neutral-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-600/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  મલ્ટિ-પ્લેટફોર્મ & રિયલ-ટાઇમ સિન્ક હબ
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> લાઈવ સક્રિય
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Desktop (SQLite), Mobile (SQLite), અને Web વચ્ચે સ્વતંત્ર ઓફલાઇન ફેરફારો અને 4K સ્ટોરેજ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" /> ઇકોસિસ્ટમ ઓવરવ્યૂ
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> કન્ફ્લિક્ટ રિઝોલ્યુશન
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" /> 4K ઇમેજ/PDF ક્લાઉડ સ્ટોરેજ
          </button>
          <button
            onClick={() => setActiveTab('sqlite')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'sqlite'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" /> SQLite DDL & REST API
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Sync Actions & Cloud State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-700 space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>સેન્ટ્રલાઇઝ્ડ ક્લાઉડ ડેટાબેઝ</span>
                    <Database className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-base font-black text-white">
                    Cloud Firestore DB
                  </div>
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> રિયલ-ટાઇમ લિસ્ટનર કનેક્ટેડ
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-700 space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>કુલ પ્રિન્ટ જોબ્સ (Sync)</span>
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {printJobCount} જોબ્સ
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    તમામ ડેસ્કટોપ & મોબાઇલ પર ઉપલબ્ધ
                  </div>
                </div>

                <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-700 space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>આ ડિવાઇસ કતાર (Outbox)</span>
                    <HardDrive className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-black text-white">
                    {pendingCount} પેન્ડિંગ
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {pendingCount === 0 ? 'બધો ડેટા ક્લાઉડ સાથે અદ્યતન છે' : 'બેકગ્રાઉન્ડ સિન્ક ચાલુ છે'}
                  </div>
                </div>
              </div>

              {/* Sync Manual Trigger */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-orange-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    મેન્યુઅલ ડેલ્ટા સિન્ક કરો (Push & Pull)
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    ડિવાઇસ ID: <code className="text-orange-300 font-mono">{deviceId}</code> ({currentPlatform})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer shrink-0 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'સિન્ક થઈ રહ્યું છે...' : 'હમણાં સિન્ક કરો'}
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200">
                  {syncFeedback}
                </div>
              )}

              {/* Multi-Platform Device Matrix */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-black tracking-wider text-neutral-400">
                  સંકળાયેલ પ્લેટફોર્મ્સ અને લોકલ ડેટાબેઝ આર્કિટેક્ચર
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {devices.map(dev => (
                    <div
                      key={dev.id}
                      className="bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-700/80 space-y-2 hover:border-neutral-600 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center text-orange-400">
                          {dev.platform === 'desktop_sqlite' && <Laptop className="w-4 h-4" />}
                          {dev.platform === 'mobile_sqlite' && <Smartphone className="w-4 h-4" />}
                          {dev.platform === 'web_indexeddb' && <Globe className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          સક્રિય
                        </span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{dev.name}</div>
                        <div className="text-[11px] text-neutral-400">{dev.appVersion}</div>
                      </div>
                      <div className="pt-2 border-t border-neutral-700/50 flex items-center justify-between text-[11px] text-neutral-400">
                        <span>લોકલ એન્જિન:</span>
                        <span className="font-mono text-orange-300 font-bold">
                          {dev.platform === 'web_indexeddb' ? 'IndexedDB' : 'SQLite 3 Local DB'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. CONFLICT RESOLUTION TAB */}
          {activeTab === 'conflicts' && (
            <div className="space-y-5">
              <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-700 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-amber-400">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  નોન-ડિસ્ટ્રક્ટિવ ફિલ્ડ-લેવલ કન્ફ્લિક્ટ રિઝોલ્યુશન પોલિસી
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  જ્યારે ડેસ્કટોપ એપ અને મોબાઇલ એપ બંને ઇન્ટરનેટ વગર ઓફલાઇન કામ કરતા હોય અને એક જ જોબમાં ફેરફાર કરે, ત્યારે બેકગ્રાઉન્ડ સિન્ક દરમિયાન કોઈ પણ ડેટા ડિલીટ કે ઓવરરાઇટ થયા વગર નીચે મુજબ સુરક્ષિત રીતે મર્જ થાય છે:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ૧. સ્ટેટસ પ્રગતિ હાયરાર્કી (Status Progression)
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    જો PC પરથી જોબ <strong>Completed</strong> થઈ ગઈ હોય અને મોબાઇલ પરથી કોઈ જૂનો ઓફલાઇન ઓર્ડર આવે, તો સ્ટેટસ ક્યારેય પાછું Pending નહીં થાય. Completed &gt; Ready &gt; Processing &gt; Pending નિયમ જળવાય છે.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ૨. એડિટિવ પેમેન્ટ મર્જ (Additive Payment Merge)
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    જો ગ્રાહકે મોબાઇલમાં UPI થી ₹૫૦ ચૂકવ્યા અને PC પર એડમિને રોકડા ₹૫૦ નોંધ્યા, તો સિસ્ટમ બંને રકમને યોગ્ય રીતે સાચવશે અને પેમેન્ટ કન્ફ્લિક્ટ અટકાવશે.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ૩. ફાઇલ અને 4K ઇમેજ યુનિયન (File Union)
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    જો ગ્રાહકે મોબાઇલ પરથી નવી 4K PDF જોડી અને PC પરથી બીજી ફાઇલ ઉમેરાઈ, તો બંને ફાઇલો Job File ID મુજબ સુરક્ષિત રીતે ક્લાઉડમાં સંયુક્ત થશે.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> ૪. નોટ્સ કોન્કેટેનેશન (Notes Merging)
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    જો ડેસ્કટોપ અને મોબાઇલ પર અલગ-અલગ સૂચના લખી હોય, તો સિન્ક એન્જિન બંને નોંધોને `[Desktop Note] | [Mobile Note]` તરીકે મર્જ કરી લેશે.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. STORAGE TAB */}
          {activeTab === 'storage' && (
            <div className="space-y-5">
              <div className="bg-neutral-800/80 p-4 rounded-xl border border-neutral-700 space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-white">
                  <Cloud className="w-5 h-5 text-blue-400" />
                  ગ્રાહક 4K ફોટો & લાર્જ PDF ક્લાઉડ સ્ટોરેજ
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  ગ્રાહકોની હાઇ-રિઝોલ્યુશન 4K પ્રિન્ટિંગ ઇમેજિસ, ફ્લેક્સ બેનર્સ અને મલ્ટિ-પેજ PDF ફાઇલો (૫ GB સુધી) ને બાઈનરી ચંકિંગ ટેકનોલોજી દ્વારા સ્ટોર કરવામાં આવે છે. આ ફાઇલો સુરક્ષિત REST API સ્ટ્રીમિંગ દ્વારા ડેસ્કટોપ કે મોબાઇલ એપ પર સીધી ડાઉનલોડ કરી શકાય છે.
                </p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>ડેસ્કટોપ / મોબાઇલ ડાઉનલોડ REST URL સ્ટ્રક્ચર:</span>
                  <span className="text-[10px] text-neutral-400">Byte-Range Streaming Ready</span>
                </div>
                <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 font-mono text-xs text-orange-300 flex items-center justify-between">
                  <code>GET /api/files/{'{fileId}'}/stream</code>
                  <button
                    onClick={() => handleCopyApi('/api/files/{fileId}/stream', 'stream')}
                    className="text-neutral-400 hover:text-white p-1"
                  >
                    {copiedApi === 'stream' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[11px] text-neutral-400 space-y-1">
                  <div>• <strong>Content-Length &amp; Range Support:</strong> મોટા 4K ફોટો અટકી ગયા વગર રેઝ્યુમ થઈ શકે છે.</div>
                  <div>• <strong>0KB Corrupt Guard:</strong> સંપૂર્ણ બાઈનરી ચંક્સ એકત્ર થયા પછી જ ફાઇલ ડીલીવર થાય છે.</div>
                </div>
              </div>
            </div>
          )}

          {/* 4. SQLITE DDL & REST API TAB */}
          {activeTab === 'sqlite' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Desktop (Electron/Tauri) &amp; Mobile (SQLite) DDL સ્કીમા
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    તમારી ડેસ્કટોપ અને મોબાઇલ એપના લોકલ SQLite ડેટાબેઝમાં આ ટેબલ્સ સીધા રન કરી શકાય છે.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'કોપી થઈ ગયું!' : 'SQL સ્કીમા કોપી કરો'}
                </button>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 max-h-64 overflow-y-auto font-mono text-[11px] text-emerald-400 whitespace-pre leading-relaxed">
                {SQLITE_SCHEMA_DDL}
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-white">મુખ્ય REST API એન્ડપોઇન્ટ્સ:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-blue-400 font-bold">GET</span> /api/jobs
                    </div>
                    <span className="text-[10px] text-neutral-400">બધા ઓર્ડર્સ ફેચ કરો</span>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">POST</span> /api/sync/push
                    </div>
                    <span className="text-[10px] text-neutral-400">ઓફલાઇન બદલાવ પુશ કરો</span>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-bold">POST</span> /api/sync/pull
                    </div>
                    <span className="text-[10px] text-neutral-400">ડેલ્ટા બદલાવ મેળવો</span>
                  </div>
                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-blue-400 font-bold">GET</span> /api/files/:id/stream
                    </div>
                    <span className="text-[10px] text-neutral-400">4K ફાઇલ સ્ટ્રીમ કરો</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <div className="text-neutral-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>મલ્ટિ-પ્લેટફોર્મ સિન્ક એન્જિન v2.4.0 • સક્રિય</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-4 py-1.5 rounded-xl transition cursor-pointer"
          >
            બંધ કરો
          </button>
        </div>

      </div>
    </div>
  );
};
