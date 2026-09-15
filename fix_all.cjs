const fs = require('fs');

// 1. Update src/types.ts
let typesCode = fs.readFileSync('src/types.ts', 'utf8');
typesCode = typesCode.replace(
  /type:\s*'product'\s*\|\s*'order'\s*\|\s*'expense';/,
  "type: 'product' | 'order' | 'expense' | 'khata_account' | 'khata_transaction' | 'rojmel' | 'print_job';"
);
fs.writeFileSync('src/types.ts', typesCode);
console.log('1. Updated types.ts');

// 2. Clean App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Find the marker: prisha_trash_v4', []);
// and the next marker: const [showDhamakaEditModal, setShowDhamakaEditModal]
const startMarker = "const [trashList, setTrashList] = useFirebaseSync<TrashRecord[]>('trash', 'prisha_trash_v4', []);";
const endMarker = "const [showDhamakaEditModal, setShowDhamakaEditModal] = useState<boolean>(false);";

const startIdx = appCode.indexOf(startMarker);
const endIdx = appCode.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
  const between = appCode.substring(startIdx + startMarker.length, endIdx);
  console.log('Found rogue code length:', between.length);
  appCode = appCode.substring(0, startIdx + startMarker.length) + '\n\n  // Dhamaka Offer Edit Modal State\n  ' + appCode.substring(endIdx);
  console.log('Cleaned rogue code from App.tsx');
} else {
  console.error('Could not find markers in App.tsx');
  process.exit(1);
}

// 3. Update handleRestoreTrashRecord in App.tsx
const restoreMarker = `      setTrashList(prev => prev.filter(t => t.id !== record.id));
      showToast(\`🔄 ખર્ચ રેકોર્ડ પાછો ઉમેરાઈ ગયો!\`);
    }`;

const restoreExpansion = `      setTrashList(prev => prev.filter(t => t.id !== record.id));
      showToast(\`🔄 ખર્ચ રેકોર્ડ પાછો ઉમેરાઈ ગયો!\`);
    } else if (record.type === 'khata_account') {
      const accData = record.data?.account || record.data;
      const txData = record.data?.transactions || [];
      if (accData) {
        setKhataAccounts(prev => [...prev.filter(a => a.id !== accData.id), accData]);
        if (txData && txData.length > 0) {
          const txIds = new Set(txData.map((t: any) => t.id));
          setKhataTransactions(prev => [...prev.filter(t => !txIds.has(t.id)), ...txData]);
        }
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(\`🔄 ખાતું "\${accData.name}" પાછું આવી ગયું!\`);
      }
    } else if (record.type === 'khata_transaction') {
      const tx = record.data;
      if (tx) {
        setKhataTransactions(prev => [...prev.filter(t => t.id !== tx.id), tx]);
        // Re-apply balance
        setKhataAccounts(prev => prev.map(a => {
          if (a.id === tx.accountId) {
            const txAmt = tx.type === 'jama' ? tx.amount : -tx.amount;
            return {
              ...a,
              balance: a.balance + txAmt,
              totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + tx.amount : (a.totalGiven || 0),
              totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + tx.amount : (a.totalReceived || 0)
            };
          }
          return a;
        }));
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(\`🔄 ખાતાનો વ્યવહાર પાછો ઉમેરાઈ ગયો!\`);
      }
    } else if (record.type === 'rojmel') {
      const entry = record.data;
      if (entry) {
        setRojmelEntries(prev => [...prev.filter(e => e.id !== entry.id), entry]);
        setTrashList(prev => prev.filter(t => t.id !== record.id));
        showToast(\`🔄 રોજમેળ એન્ટ્રી પાછી ઉમેરાઈ ગઈ!\`);
      }
    }`;

if (appCode.includes(restoreMarker)) {
  appCode = appCode.replace(restoreMarker, restoreExpansion);
  console.log('Updated handleRestoreTrashRecord in App.tsx');
} else {
  console.error('restoreMarker not found');
}

fs.writeFileSync('src/App.tsx', appCode);
console.log('2. Successfully saved App.tsx');
