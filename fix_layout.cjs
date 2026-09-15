const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

// There seem to be two Layout tabs now, let's remove the older one.
const tab2Regex = /\{\/\* TAB 2: WEBSITE LAYOUT \& BOX SIZE \(FULL ADMIN POWER\) \*\/\}[\s\S]*?(?=\{\/\* TAB 3: BANNERS)/;
code = code.replace(tab2Regex, '');

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('cleaned extra layout tab');
