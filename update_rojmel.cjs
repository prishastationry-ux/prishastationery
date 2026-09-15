const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

const oldBlock = `                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={\`p-2.5 rounded-xl border cursor-pointer transition-all \${
                          selectedAccountId === acc.id
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                        }\`}
                      >
                        <div className="flex items-center justify-between font-black text-xs">
                          <span>{acc.name}</span>
                          <span
                            className={\`font-mono text-xs \${
                              acc.balance > 0
                                ? selectedAccountId === acc.id ? 'text-amber-300' : 'text-amber-700'
                                : acc.balance < 0
                                ? selectedAccountId === acc.id ? 'text-rose-300' : 'text-rose-700'
                                : 'text-emerald-500'
                            }\`}
                          >
                            ₹{Math.abs(acc.balance).toFixed(2)}
                            {acc.balance > 0 ? ' (લેવાના)' : acc.balance < 0 ? ' (આપવાના)' : ' (0)'}
                          </span>
                        </div>
                        {acc.phone && (
                          <div className={\`text-[10px] font-bold \${selectedAccountId === acc.id ? 'text-blue-200' : 'text-neutral-500'}\`}>
                            📞 {acc.phone}
                          </div>
                        )}
                      </div>`;

const newBlock = `                      <div
                        key={acc.id}
                        onClick={() => setSelectedAccountId(acc.id)}
                        className={\`p-2.5 rounded-xl border cursor-pointer transition-all \${
                          selectedAccountId === acc.id
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                        }\`}
                      >
                        <div className="flex items-center justify-between font-black text-xs">
                          <span>{acc.name}</span>
                          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                            <span
                              className={\`font-mono text-xs \${
                                acc.balance > 0
                                  ? selectedAccountId === acc.id ? 'text-amber-300' : 'text-amber-700'
                                  : acc.balance < 0
                                  ? selectedAccountId === acc.id ? 'text-rose-300' : 'text-rose-700'
                                  : 'text-emerald-500'
                              }\`}
                            >
                              ₹{Math.abs(acc.balance).toFixed(2)}
                              {acc.balance > 0 ? ' (લેવાના)' : acc.balance < 0 ? ' (આપવાના)' : ' (0)'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(\`શું તમે "\${acc.name}" ખાતું અને તેના તમામ વ્યવહારો કાઢી નાખવા માંગો છો?\`)) {
                                  onDeleteKhataAccount(acc.id);
                                  if (selectedAccountId === acc.id) setSelectedAccountId(null);
                                }
                              }}
                              className={\`p-1 rounded transition cursor-pointer \${selectedAccountId === acc.id ? 'text-rose-300 hover:text-white hover:bg-rose-500/30' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}\`}
                              title="ખાતું ડીલીટ કરો"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {acc.phone && (
                          <div className={\`text-[10px] font-bold \${selectedAccountId === acc.id ? 'text-blue-200' : 'text-neutral-500'}\`}>
                            📞 {acc.phone}
                          </div>
                        )}
                      </div>`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/RojmelKhataModal.tsx', code);
  console.log('Successfully updated RojmelKhataModal with account delete button');
} else {
  console.log('Old block not found exactly, trying alternative');
}
