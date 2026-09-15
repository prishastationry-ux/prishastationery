const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove StoryWidget rendering
const storyWidgetRegex = /\{\/\* INSTAGRAM \/ WHATSAPP STYLE STORE STORIES WIDGET \*\/\}\s*\{storeSettings\.showStoriesWidget \!\=\= false \&\& \(\s*<StoryWidget\s*stories=\{storeSettings\.storeStories \|\| \[\]\}\s*isAdminUnlocked=\{isAdminUnlocked\}\s*onOpenStoreSettings=\{\(\) => setShowStoreSettingsModal\(true\)\}\s*\/>\s*\)\}/;
code = code.replace(storyWidgetRegex, '');

fs.writeFileSync('src/App.tsx', code);
console.log('StoryWidget removed from App.tsx');
