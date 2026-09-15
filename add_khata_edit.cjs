const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

if (!code.includes('onEditKhataAccount')) {
  // Update props
  code = code.replace(
    /onDeleteKhataTransaction: \(id: string, accountId: string\) => void;/,
    `onDeleteKhataTransaction: (id: string, accountId: string) => void;
  onEditKhataAccount: (id: string, newName: string) => void;
  onEditKhataTransaction: (id: string, newAmount: number, newDesc: string) => void;`
  );
  code = code.replace(
    /onDeleteKhataTransaction,\n  storeSettings,/,
    `onDeleteKhataTransaction,\n  onEditKhataAccount,\n  onEditKhataTransaction,\n  storeSettings,`
  );

  // Khata Account header: Edit and Delete buttons
  code = code.replace(
    /<h4 className="text-base font-black">\{selectedAccount\.name\}<\/h4>/,
    `<div className="flex items-center gap-2">
                            <h4 className="text-base font-black">{selectedAccount.name}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newName = window.prompt('નવું નામ દાખલ કરો:', selectedAccount.name);
                                if (newName && newName.trim() !== '') {
                                  onEditKhataAccount(selectedAccount.id, newName.trim());
                                }
                              }}
                              className="text-blue-300 hover:text-white px-1 py-1 rounded cursor-pointer"
                              title="નામ બદલો"
                            >
                              ✏️
                            </button>
                          </div>`
  );

  // Transaction Edit and Delete buttons
  code = code.replace(
    /<button\s+type="button"\s+onClick=\{\(\) => \{\s+if \(window\.confirm\('આ એન્ટ્રી કાઢી નાખવી છે\?'\)\) \{\s+onDeleteKhataTransaction\(t\.id, t\.accountId\);\s+\}\s+\}\}\s+className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded cursor-pointer"\s+title="એન્ટ્રી ડીલીટ કરો"\s+>\s+<Trash2 className="w-3\.5 h-3\.5" \/>\s+<\/button>/,
    `<div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAmt = window.prompt('નવી રકમ (Amount) દાખલ કરો:', t.amount.toString());
                                      const newDesc = window.prompt('નવી વિગત (Description) દાખલ કરો:', t.description);
                                      if (newAmt !== null && newDesc !== null) {
                                        const parsedAmt = parseFloat(newAmt);
                                        if (!isNaN(parsedAmt) && parsedAmt > 0) {
                                          onEditKhataTransaction(t.id, parsedAmt, newDesc);
                                        } else {
                                          alert('યોગ્ય રકમ દાખલ કરો.');
                                        }
                                      }
                                    }}
                                    className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1 rounded cursor-pointer"
                                    title="એન્ટ્રી એડિટ કરો"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('આ એન્ટ્રી કાઢી નાખવી છે?')) {
                                        onDeleteKhataTransaction(t.id, t.accountId);
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1 rounded cursor-pointer"
                                    title="એન્ટ્રી ડીલીટ કરો"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>`
  );

  fs.writeFileSync('src/components/RojmelKhataModal.tsx', code);
  console.log('RojmelKhataModal updated for edit');
}
