const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('onDeleteKhataAccount={(id)')) {
  const replacement = `onAddKhataTransaction={(tx) => {
            // Find account to calculate balanceAfter
            const acc = khataAccounts.find(a => a.id === tx.accountId);
            const currentBalance = acc?.balance || 0;
            const txAmt = tx.type === 'jama' ? tx.amount : -tx.amount;
            const balanceAfter = currentBalance + txAmt;

            const newTx = {
              ...tx,
              id: \`khata-tx-\${Date.now()}\`,
              createdAt: new Date().toISOString(),
              balanceAfter
            };
            
            // Update account balance
            setKhataAccounts(prev => prev.map(a => {
              if (a.id === tx.accountId) {
                return {
                  ...a,
                  balance: balanceAfter,
                  totalGiven: tx.type === 'udhar' ? (a.totalGiven || 0) + tx.amount : (a.totalGiven || 0),
                  totalReceived: tx.type === 'jama' ? (a.totalReceived || 0) + tx.amount : (a.totalReceived || 0),
                  lastTransactionDate: new Date().toISOString()
                };
              }
              return a;
            }));

            setKhataTransactions(prev => [...prev, newTx]);
          }}
          onDeleteKhataAccount={(id) => {
            setKhataAccounts(prev => prev.filter(a => a.id !== id));
            setKhataTransactions(prev => prev.filter(t => t.accountId !== id));
            showToast('🗑️ ખાતું અને વ્યવહારો ડીલીટ થઈ ગયા.');
          }}
          onDeleteKhataTransaction={(id, accountId) => {
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
          }}`;
          
  // Regex to match onAddKhataTransaction completely and replace it with the new block.
  const regex = /onAddKhataTransaction=\{\(tx\) => \{[\s\S]*?setKhataTransactions\(prev => \[\.\.\.prev, newTx\]\);\n          \}\}/;
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx updated for Khata deletion');
}
