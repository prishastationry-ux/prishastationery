const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('onEditKhataAccount={')) {
  const replacement = `onDeleteKhataTransaction={(id, accountId) => {
            const tx = khataTransactions.find(t => t.id === id);
            if (!tx) return;
            
            setKhataTransactions(prev => prev.filter(t => t.id !== id));
            
            // Reverse the balance
            setKhataAccounts(prev => prev.map(a => {
              if (a.id === accountId) {
                const reverseAmt = tx.type === 'jama' ? -tx.amount : tx.amount;
                return {
                  ...a,
                  balance: a.balance + reverseAmt,
                  totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) - tx.amount : (a.totalGiven || 0),
                  totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) - tx.amount : (a.totalReceived || 0)
                };
              }
              return a;
            }));
            showToast('🗑️ વ્યવહાર ડીલીટ થઈ ગયો.');
          }}
          onEditKhataAccount={(id, newName) => {
             setKhataAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
             showToast('✅ ખાતાનું નામ અપડેટ થયું.');
          }}
          onEditKhataTransaction={(id, newAmount, newDesc) => {
            const tx = khataTransactions.find(t => t.id === id);
            if (!tx) return;
            
            const amountDiff = newAmount - tx.amount;
            
            setKhataTransactions(prev => prev.map(t => {
               if(t.id === id) {
                 return { ...t, amount: newAmount, description: newDesc };
               }
               return t;
            }));
            
            setKhataAccounts(prev => prev.map(a => {
               if (a.id === tx.accountId) {
                 const balanceDiff = tx.type === 'jama' ? amountDiff : -amountDiff;
                 return {
                   ...a,
                   balance: a.balance + balanceDiff,
                   totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + amountDiff : (a.totalGiven || 0),
                   totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + amountDiff : (a.totalReceived || 0)
                 };
               }
               return a;
            }));
            showToast('✅ વ્યવહાર અપડેટ થયો.');
          }}`;

  const regex = /onDeleteKhataTransaction=\{\(id, accountId\) => \{[\s\S]*?showToast\('🗑️ વ્યવહાર ડીલીટ થઈ ગયો\.'\);\n          \}\}/;
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx updated for edit');
}
