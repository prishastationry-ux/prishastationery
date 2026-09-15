const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleRestoreTrashItem = (id: string) => {
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
  };        }
        return a;
      }));
    } else if (item.type === 'rojmel' && item.data) {
      setRojmelEntries(prev => [...prev, item.data]);
    } else if (item.type === 'print_job' && item.data) {
      setPrintJobs(prev => [...prev, item.data]);
    }
    
    setTrashList(prev => prev.filter(t => t.id !== id));
    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');
  };`;

const cleanReplacement = `  const handleRestoreTrashItem = (id: string) => {
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
  };`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, cleanReplacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed duplicate restore block exactly');
} else {
  console.log('Target string not found');
}
