const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const modalCode = `
      {showStoreSettingsModal && (
        <StoreSettingsModal
          isOpen={showStoreSettingsModal}
          onClose={() => setShowStoreSettingsModal(false)}
          settings={storeSettings}
          onSave={(updated) => {
            setStoreSettings(prev => ({ ...prev, ...updated }));
          }}
          showToast={showToast}
        />
      )}
`;

code = code.replace(
  `{/* ========================================================================= */}`,
  modalCode + '\n      {/* ========================================================================= */}'
);

fs.writeFileSync('src/App.tsx', code);
console.log('Added modal back');
