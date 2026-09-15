const fs = require('fs');
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Update handleRestoreTrashItem to fully restore khata_account with its transactions
const newRestoreFunc = `
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
      // re-apply balance on account
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

// Replace handleRestoreTrashItem if exists or insert
if (appCode.includes('const handleRestoreTrashItem')) {
  appCode = appCode.replace(/const handleRestoreTrashItem = \([\s\S]*?\};\n/, newRestoreFunc);
} else {
  appCode = appCode.replace('function App() {', 'function App() {\n' + newRestoreFunc);
}

fs.writeFileSync('src/App.tsx', appCode);
console.log('Updated handleRestoreTrashItem in App.tsx');
