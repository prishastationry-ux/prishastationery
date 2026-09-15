const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

// Update interface RojmelKhataModalProps
code = code.replace(
  /onEditKhataAccount: \(id: string, newName: string\) => void;/,
  'onEditKhataAccount: (id: string, newName: string, newPhone: string, newAddress: string) => void;'
);

fs.writeFileSync('src/components/RojmelKhataModal.tsx', code);
console.log('Updated RojmelKhataModalProps interface');
