const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `initialSettings={storeSettings}`,
  `settings={storeSettings}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App settings prop fixed');
