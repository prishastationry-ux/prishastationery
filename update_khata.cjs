const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

if (!code.includes('onDeleteKhataAccount: (id: string) => void;')) {
  code = code.replace(
    /onAddKhataTransaction: \(tx: Omit<KhataTransaction, 'id' \| 'createdAt' \| 'balanceAfter'>\) => void;/,
    `onAddKhataTransaction: (tx: Omit<KhataTransaction, 'id' | 'createdAt' | 'balanceAfter'>) => void;
  onDeleteKhataAccount: (id: string) => void;
  onDeleteKhataTransaction: (id: string, accountId: string) => void;`
  );
  code = code.replace(
    /onAddKhataTransaction,\n  storeSettings,/,
    `onAddKhataTransaction,\n  onDeleteKhataAccount,\n  onDeleteKhataTransaction,\n  storeSettings,`
  );
  
  // Now add Delete buttons to Khata Account and Khata Transaction
  // Khata Account header:
  const accountDetailHeader = `<h4 className="text-base font-black">{selectedAccount.name}</h4>`;
  code = code.replace(
    accountDetailHeader,
    `<div className="flex items-center gap-2">
                          <h4 className="text-base font-black">{selectedAccount.name}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('આ ખાતું અને તેના તમામ વ્યવહારો કાઢી નાખવા છે?')) {
                                onDeleteKhataAccount(selectedAccount.id);
                                setSelectedAccountId(null);
                              }
                            }}
                            className="bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer"
                          >
                            ડીલીટ ખાતું
                          </button>
                        </div>`
  );

  // Khata Transaction Row:
  const txRow = `<td className="p-2 font-bold max-w-[120px] truncate">{t.description}</td>`;
  code = code.replace(
    txRow,
    `<td className="p-2 font-bold max-w-[120px] truncate">{t.description}</td>
                              <td className="p-2 text-right">
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
                              </td>`
  );
  
  // Need to add empty th to thead
  code = code.replace(
    `<th className="p-2 text-right">બેલેન્સ</th>`,
    `<th className="p-2 text-right">બેલેન્સ</th>
                              <th className="p-2 text-right w-10"></th>`
  );

  fs.writeFileSync('src/components/RojmelKhataModal.tsx', code);
  console.log('RojmelKhataModal.tsx updated');
} else {
  console.log('Already updated');
}
