const fs = require('fs');

// 1. Remove from App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const widgetRegex = /<MobilePosterWidget\s+posters=\{storeSettings\.newsBoxPosters \|\| \[\]\}\s*\/>/;
if (appCode.match(widgetRegex)) {
  appCode = appCode.replace(widgetRegex, '');
  fs.writeFileSync('src/App.tsx', appCode);
  console.log('Removed second MobilePosterWidget from App.tsx');
}

// 2. Remove news tab from StoreSettingsModal.tsx
let modalCode = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');
const tabBtnRegex = /<button\s+type="button"\s+onClick=\{\(\) => setActiveTab\('news'\)\}[\s\S]*?<span>ન્યૂઝ બોક્સ \(News\)<\/span>\s*<\/button>/;
modalCode = modalCode.replace(tabBtnRegex, '');

const tabContentRegex = /\{\/\* TAB 6: NEWS BOX \*\/\}\s*\{activeTab === 'news' && \([\s\S]*?\}\)\}/;
modalCode = modalCode.replace(tabContentRegex, '');

fs.writeFileSync('src/components/StoreSettingsModal.tsx', modalCode);
console.log('Removed news tab from StoreSettingsModal.tsx');
