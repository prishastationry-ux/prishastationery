const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

const regex = /\{\/\* TAB 3: AUTO SLIDER MULTI-BANNERS \*\/\}/;

const replacement = `{/* TAB 2: WEBSITE LAYOUT & BOX SIZE (FULL ADMIN POWER) */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                <h3 className="font-black text-purple-950 text-sm mb-1 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-700" />
                  <span>વેબસાઇટ પાવર કંટ્રોલ (Layout & Sizes)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-bold">
                {/* Header/Logo Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black text-xs">
                    🏷️ દુકાનનું નામ / લોગો સાઇઝ:
                  </label>
                  <div className="flex bg-neutral-100 rounded-lg p-1 w-full">
                    {['small', 'medium', 'large', 'xl'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({ ...formData, headerNameSize: size as any })}
                        className={\`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer \${
                          formData.headerNameSize === size || (!formData.headerNameSize && size === 'medium')
                            ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }\`}
                      >
                        {size === 'small' ? 'નાનું' : size === 'medium' ? 'મધ્યમ' : size === 'large' ? 'મોટું' : 'ખૂબ મોટું'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Text Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black text-xs">
                    📝 પ્રોડક્ટ લખાણ સાઇઝ:
                  </label>
                  <div className="flex bg-neutral-100 rounded-lg p-1 w-full">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFormData({ ...formData, productTextSize: size as any })}
                        className={\`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer \${
                          formData.productTextSize === size || (!formData.productTextSize && size === 'small')
                            ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }\`}
                      >
                        {size === 'small' ? 'નાનું' : size === 'medium' ? 'મધ્યમ' : 'મોટું'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Card Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black text-xs">
                    📦 પ્રોડક્ટ બોક્સ સાઇઝ:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'small', label: 'નાની સાઇઝ' },
                      { id: 'medium', label: 'મધ્યમ' },
                      { id: 'large', label: 'મોટી સાઇઝ' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, productCardSize: s.id as any })}
                        className={\`p-1.5 rounded-xl border text-center transition-all cursor-pointer \${
                          formData.productCardSize === s.id || (!formData.productCardSize && s.id === 'medium')
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }\`}
                      >
                        <div className="font-black text-[11px]">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Columns */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black text-xs">
                    📱 મોબાઇલમાં ૧ લાઈનમાં કેટલી પ્રોડક્ટ્સ?
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {['2', '3', '4', '5'].map(cols => (
                      <button
                        key={cols}
                        type="button"
                        onClick={() => setFormData({ ...formData, productGridColumns: cols as any })}
                        className={\`p-1.5 rounded-xl border text-center transition-all cursor-pointer \${
                          formData.productGridColumns === cols || (!formData.productGridColumns && cols === '4')
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }\`}
                      >
                        <div className="font-black text-[11px]">{cols}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTO SLIDER MULTI-BANNERS */}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
  console.log('updated StoreSettingsModal layout tab successfully.');
} else {
  console.log('Regex not matched');
}
