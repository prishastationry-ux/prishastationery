const fs = require('fs');

// 1. Check App.tsx for trash state and trash modal integration
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

if (!appCode.includes('restoreTrashItem')) {
  // Let's add restoreTrashItem handler and Trash modal in App.tsx
  // First find where trashList is defined
  const trashStateMarker = /const \[trashList, setTrashList\] = useFirebaseSync<TrashRecord\[\]>\('trash', 'prisha_trash_v4', \[\]\);/;
  const restoreFunction = `
  const handleRestoreTrashItem = (id: string) => {
    const item = trashList.find(t => t.id === id);
    if (!item) return;
    
    if (item.type === 'khata_account' && item.data) {
      setKhataAccounts(prev => [...prev, item.data]);
    } else if (item.type === 'khata_transaction' && item.data) {
      setKhataTransactions(prev => [...prev, item.data]);
      // restore balance on account
      const tx = item.data;
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

  if (trashStateMarker.test(appCode)) {
    appCode = appCode.replace(trashStateMarker, (match) => match + '\n' + restoreFunction);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log('Added handleRestoreTrashItem to App.tsx');
  }
}
