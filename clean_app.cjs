const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Let's remove the duplicate block around line 150-175
const duplicatePattern = /\s*\}\s*return a;\s*\}\);\s*\}\);\s*\}\s*else if \(item\.type === 'rojmel' && item\.data\) \{\s*setRojmelEntries\(prev => \[...prev, item\.data\]\);\s*\} else if \(item\.type === 'print_job' && item\.data\) \{\s*setPrintJobs\(prev => \[...prev, item\.data\]\);\s*\}\s*setTrashList\(prev => prev\.filter\(t => t\.id !== id\)\);\s*showToast\('♻️ આઇટમ સફળતાપૂર્વਕ પાછી મેળવી લીધી \(Restored\)\!'\);\s*\};\s*/g;

// Let's replace the whole handleRestoreTrashItem cleanly
const cleanRestore = `
  const handleRestoreTrashItem = (id: string) => {
    const item = trashList.find(t => t.id === id);
    if (!item) return;
    
    if (item.type === 'khata_account' && item.data) {
      const accData = item.data.account || item.data;
      const txData = item.data.transactions || [];
      setKhataAccounts(prev => [...prev, accData]);
      if (txData.length > 0) {
        setKhataTransactions(prev => [...prev, ...txData]);
      }
    } else if (item.type === 'khata_transaction' && item.data) {
      const tx = item.data;
      setKhataTransactions(prev => [...prev, tx]);
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
    } else if (item.type === 'rojmel' && item.data) {
      setRojmelEntries(prev => [...prev, item.data]);
    } else if (item.type === 'print_job' && item.data) {
      setPrintJobs(prev => [...prev, item.data]);
    }
    
    setTrashList(prev => prev.filter(t => t.id !== id));
    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');
  };
`;

// Find where handleRestoreTrashItem starts and replace until the closing brace
const startIdx = code.indexOf('const handleRestoreTrashItem');
if (startIdx !== -1) {
  // Let's find the next function or marker
  const nextFuncIdx = code.indexOf('const ', startIdx + 30);
  if (nextFuncIdx !== -1) {
    code = code.substring(0, startIdx) + cleanRestore + code.substring(nextFuncIdx);
  }
}

fs.writeFileSync('src/App.tsx', code);
console.log('Cleaned App.tsx successfully');
