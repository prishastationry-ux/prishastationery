const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Update onEditKhataAccount in App.tsx to accept name, phone, address
const oldEditDef = `onEditKhataAccount={(id, newName) => {
             setKhataAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
             showToast('✅ ખાતાનું નામ અપડેટ થયું.');
          }}`;

const newEditDef = `onEditKhataAccount={(id, newName, newPhone, newAddress) => {
             setKhataAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName, phone: newPhone, address: newAddress } : a));
             showToast('✅ ખાતાની વિગત (નામ, ફોન, સરનામું) અપડેટ થઈ ગઈ!');
          }}`;

if (code.includes(oldEditDef)) {
  code = code.replace(oldEditDef, newEditDef);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Updated App.tsx for full account edit');
} else {
  console.log('oldEditDef not found exactly in App.tsx');
}
