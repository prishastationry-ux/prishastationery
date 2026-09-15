const fs = require('fs');
let code = fs.readFileSync('src/components/RojmelKhataModal.tsx', 'utf8');

const targetListMapping = `                      <div
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
                          <div className="flex items-center gap-1.5">
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
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
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

// Let's replace the simple account card rendering with the one containing delete icon
const oldCardRegex = /<div\s+key=\{acc\.id\}\s+onClick=\{\(\) => setSelectedAccountId\(acc\.id\)\}[\s\S]*?<\/div>\s*\)\}\)/;
if (code.includes('onDeleteKhataAccount(acc.id)')) {
  console.log('Already updated RojmelKhataModal');
} else {
  // Let's do a precise string replacement for the map block
  const mapStart = code.indexOf('.map(acc => (');
  if (mapStart !== -1) {
    // find the end of map return
    console.log('Found map block in RojmelKhataModal');
  }
}
EOF
node -v
