const fs = require('fs');

// 1. Update App.tsx so when we delete a customer or supplier account, or a khata transaction, or a rojmel entry, it saves to trash!
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Let's check how onDeleteKhataAccount, onDeleteKhataTransaction, onDeleteRojmelEntry are implemented in App.tsx
// We want them to push to trashList first!

const targetDeletes = `          onDeleteRojmelEntry={(id) => {
            const entry = rojmelEntries.find(e => e.id === id);
            if (entry) {
              setTrashList(prev => [{
                id: \`trash-rojmel-\${Date.now()}\`,
                type: 'rojmel',
                title: \`રોજમેળ: \${entry.category} (₹\${entry.amount})\`,
                deletedAt: new Date().toLocaleString(),
                summary: \`પ્રકાર: \${entry.type}, તારીખ: \${entry.date}\`,
                data: entry
              }, ...prev]);
            }
            setRojmelEntries(prev => prev.filter(e => e.id !== id));
            showToast('🗑️ રોજમેળ એન્ટ્રી ટ્રેશ બિનમાં ગઈ.');
          }}`;

// Let's check if onDeleteRojmelEntry exists in App.tsx
if (!appCode.includes('type: \'rojmel\'')) {
  // Replace onDeleteRojmelEntry
  appCode = appCode.replace(
    /onDeleteRojmelEntry=\{\(id\) => \{\s*setRojmelEntries\(prev => prev\.filter\(e => e\.id !== id\);\s*\}\}/,
    targetDeletes
  );
}

// Now update onDeleteKhataAccount to push to trashList
const khataAccDeleteCode = `          onDeleteKhataAccount={(id) => {
            const acc = khataAccounts.find(a => a.id === id);
            const txs = khataTransactions.filter(t => t.accountId === id);
            if (acc) {
              setTrashList(prev => [{
                id: \`trash-khata-acc-\${Date.now()}\`,
                type: 'khata_account',
                title: \`खाતું: \${acc.name} (\${acc.type === 'customer' ? 'ગ્રાહક' : 'વેપારી'})\`,
                deletedAt: new Date().toLocaleString(),
                summary: \`ಬાકી: ₹\${acc.balance}, ફોન: \${acc.phone || 'નથી'}\`,
                data: { account: acc, transactions: txs }
              }, ...prev]);
            }
            setKhataAccounts(prev => prev.filter(a => a.id !== id));
            setKhataTransactions(prev => prev.filter(t => t.accountId !== id));
            showToast('🗑️ ખાતું અને વ્યવહારો ટ્રેશ બિનમાં ખસેડાયા.');
          }}`;

// Replace onDeleteKhataAccount in App.tsx
appCode = appCode.replace(
  /onDeleteKhataAccount=\{\(id\) => \{[\s\S]*?showToast\('🗑️ ખાતું અને વ્યવહારો ડીલીટ થઈ ગયા\.'\);\s*\}\}/,
  khataAccDeleteCode
);

// Now update onDeleteKhataTransaction to push to trashList
const khataTxDeleteCode = `          onDeleteKhataTransaction={(id, accountId) => {
            const tx = khataTransactions.find(t => t.id === id);
            if (!tx) return;
            
            setTrashList(prev => [{
              id: \`trash-khata-tx-\${Date.now()}\`,
              type: 'khata_transaction',
              title: \`વ્યવહાર: \${tx.accountName} (₹\${tx.amount})\`,
              deletedAt: new Date().toLocaleString(),
              summary: \`પ્રકાર: \${tx.type}, વિગત: \${tx.description || '-'}\`,
              data: tx
            }, ...prev]);
            
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
            showToast('🗑️ વ્યવહાર ટ્રેશ બિનમાં ગયો.');
          }}`;

appCode = appCode.replace(
  /onDeleteKhataTransaction=\{\(id, accountId\) => \{[\s\S]*?showToast\('🗑️ વ્યવહાર ડીલીટ થઈ ગયો\.'\);\s*\}\}/,
  khataTxDeleteCode
);

fs.writeFileSync('src/App.tsx', appCode);
console.log('Updated App.tsx with full trash integration for Khata and Rojmel');
