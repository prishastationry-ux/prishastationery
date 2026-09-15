const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

const newLayoutTab = `{/* TAB 2: APPEARANCE & LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              
              {/* Product Size Configurations */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-sm space-y-4">
                <h4 className="font-black text-neutral-900 text-xs border-b border-neutral-200 pb-2 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" /> 
                  વેબસાઇટ પાવર કંટ્રોલ્સ (Website Size Controls)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="font-bold text-neutral-700 text-xs">દુકાનનું નામ - અક્ષર સાઇઝ (Header Size)</label>
                    <div className="flex bg-neutral-100 rounded-lg p-1 w-full max-w-sm">
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
                          {size === 'small' ? 'નાના (Small)' : size === 'medium' ? 'સાધારણ (Med)' : size === 'large' ? 'મોટા (Large)' : 'ખૂબ મોટા (XL)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-neutral-700 text-xs">પ્રોડક્ટનું નામ - અક્ષર સાઇઝ (Text Size)</label>
                    <div className="flex bg-neutral-100 rounded-lg p-1 w-full max-w-sm">
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
                          {size === 'small' ? 'નાના (Small)' : size === 'medium' ? 'સાધારણ (Med)' : 'મોટા (Large)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-neutral-700 text-xs">પ્રોડક્ટ બોક્સ સાઇઝ (Box Size)</label>
                    <div className="flex bg-neutral-100 rounded-lg p-1 w-full max-w-sm">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFormData({ ...formData, productCardSize: size as any })}
                          className={\`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer \${
                            formData.productCardSize === size
                              ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }\`}
                        >
                          {size === 'small' ? 'નાના (Small)' : size === 'medium' ? 'મધ્યમ (Med)' : 'મોટા (Large)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-neutral-700 text-xs">મોબાઈલમાં 1 લાઈનમાં કેટલી પ્રોડક્ટ્સ બતાવવી?</label>
                    <div className="flex bg-neutral-100 rounded-lg p-1 w-full max-w-sm">
                      {['2', '3', '4', '5'].map((cols) => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() => setFormData({ ...formData, productGridColumns: cols as any })}
                          className={\`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer \${
                            formData.productGridColumns === cols
                              ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                              : 'text-neutral-500 hover:text-neutral-700'
                          }\`}
                        >
                          {cols} લાઈન
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-sm space-y-4">
                 <h4 className="font-black text-neutral-900 text-xs border-b border-neutral-200 pb-2">
                  અન્ય સેટિંગ્સ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.showStoriesWidget !== false}
                      onChange={(e) => setFormData({ ...formData, showStoriesWidget: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      સ્ટોરી બોક્સ (WhatsApp/Insta Style) ચાલુ રાખો
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.showBannerSlider !== false}
                      onChange={(e) => setFormData({ ...formData, showBannerSlider: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors">
                      મેઈન બેનર (ટોપ) ચાલુ રાખો
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}`;

const layoutTabRegex = /\{\/\* TAB 2: APPEARANCE & LAYOUT \*\/\}[\s\S]*?(?=\{\/\* TAB 3: BANNERS & SLIDERS \*\/\}|  \{\/\* TAB 3: BANNERS)/;
code = code.replace(layoutTabRegex, newLayoutTab + '\n\n          ');

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('updated layout power settings');
