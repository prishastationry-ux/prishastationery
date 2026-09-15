const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('headerNameSize?:')) {
  code = code.replace(
    /productCardSize\?: 'small' \| 'medium' \| 'large';/,
    `productCardSize?: 'small' | 'medium' | 'large';
  headerNameSize?: 'small' | 'medium' | 'large' | 'xl';
  productTextSize?: 'small' | 'medium' | 'large';`
  );
  fs.writeFileSync('src/types.ts', code);
  console.log('Types updated');
}
