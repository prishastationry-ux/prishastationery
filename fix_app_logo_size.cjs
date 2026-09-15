const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexHeaderTitle = /<h3 className="font-black text-sm text-orange-400">/g;
const regexHeaderDesc = /<p className="text-\[11px\] text-neutral-300">/g;

code = code.replace(
  /<h1 className="font-black text-white text-lg tracking-wide drop-shadow-md">/,
  `<h1 className={\`font-black text-white tracking-wide drop-shadow-md \${
    storeSettings.headerNameSize === 'small' ? 'text-base' :
    storeSettings.headerNameSize === 'large' ? 'text-2xl' :
    storeSettings.headerNameSize === 'xl' ? 'text-3xl' :
    'text-xl'
  }\`}>`
);

code = code.replace(
  /<p className="text-blue-100 text-\[11px\] font-bold tracking-wider mt-0.5 opacity-90 drop-shadow">/,
  `<p className={\`text-blue-100 font-bold tracking-wider mt-0.5 opacity-90 drop-shadow \${
    storeSettings.headerNameSize === 'small' ? 'text-[10px]' :
    storeSettings.headerNameSize === 'large' ? 'text-xs' :
    storeSettings.headerNameSize === 'xl' ? 'text-sm' :
    'text-[11px]'
  }\`}>`
);

// We need to pass productTextSize to products
code = code.replace(
  `productCardSize={storeSettings.productCardSize}`,
  `productCardSize={storeSettings.productCardSize} productTextSize={storeSettings.productTextSize}`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App header logo size updated');
