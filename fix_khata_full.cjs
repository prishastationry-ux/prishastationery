const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

// 1. Update handleCreateKhataAccount to also support address and shop name / notes if needed or add prompt edit for name, phone, address
// Let's add full edit button for Account details (Name, Phone, Address)
const oldAccountHeaderCard = `                            <h4 className="text-base font-black">{selectedAccount.name}</h4>
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
                            </button>`;

const newAccountHeaderCard = `                            <h4 className="text-base font-black">{selectedAccount.name}</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const newName = window.prompt('નામ બદલો (Name):', selectedAccount.name);
                                const newPhone = window.prompt('મોબાઇલ નંબર બદલો (Phone):', selectedAccount.phone || '');
                                const newAddress = window.prompt('સરનામું બદલો (Address/Shop Name):', selectedAccount.address || '');
                                if (newName !== null && newName.trim() !== '') {
                                  onEditKhataAccount(selectedAccount.id, newName.trim(), newPhone !== null ? newPhone.trim() : selectedAccount.phone, newAddress !== null ? newAddress.trim() : selectedAccount.address);
                                }
                              }}
                              className="bg-blue-800/60 hover:bg-blue-800 text-amber-300 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition"
                              title="નામ, મોબાઇલ અને સરનામું એડિટ કરો"
                            >
                              ✏️ એડિટ વિગત
                            </button>`;

if (code.includes(oldAccountHeaderCard)) {
  code = code.replace(oldAccountHeaderCard, newAccountHeaderCard);
  console.log('Updated account header card edit prompts');
}

fs.writeFileSync('src/components/RojmelKhataModal.tsx', code);
console.log('Saved RojmelKhataModal updates');
