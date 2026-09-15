const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

if (!code.includes('import { ImageCropModal }')) {
  code = code.replace(
    "import { compressAndResizeImage } from '../lib/invoiceUtils';",
    "import { compressAndResizeImage } from '../lib/invoiceUtils';\nimport { ImageCropModal } from './ImageCropModal';\nimport { MobilePosterWidget } from './MobilePosterWidget';"
  );
}

if (!code.includes('Newspaper')) {
  code = code.replace(
    "  Film",
    "  Film,\n  Newspaper,\n  Crop"
  );
}

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('Fixed imports');
