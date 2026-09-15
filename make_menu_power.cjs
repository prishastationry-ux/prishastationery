const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

// The original UI has tabs across the top. Let's make sure the options exist and they are clear.
const layoutBtn = `<button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={\`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap \${
              activeTab === 'layout'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }\`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>દુકાન પાવર સેટિંગ્સ</span>
          </button>`;

// Try to replace the old layout button
const oldLayoutBtnRegex = /<button\s*type="button"\s*onClick=\{\(\) => setActiveTab\('layout'\)\}[\s\S]*?<\/button>/;
if (code.match(oldLayoutBtnRegex)) {
  code = code.replace(oldLayoutBtnRegex, layoutBtn);
}
fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('Fixed tab label');
