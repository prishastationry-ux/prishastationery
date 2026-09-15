const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

const postersUI = `{/* TAB 5: MOBILE POSTERS */}
          {activeTab === 'posters' && (
            <div className="space-y-4">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-rose-950 text-sm mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-rose-700" />
                    <span>મોબાઇલ પોસ્ટર (જમણી બાજુનું સ્ક્રીન)</span>
                  </h3>
                  <p className="text-rose-800 font-bold text-[11px]">
                    ગ્રાહકને જમણી બાજુ મોબાઈલ સ્ક્રીનમાં રોજ નવી ઓફર્સ, ફોટા કે વિડીયો બતાવો.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side: Upload & Manage */}
                <div className="space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-sm space-y-3">
                    <h4 className="font-black text-neutral-900 text-xs border-b border-neutral-200 pb-2">
                      + નવો ફોટો ઉમેરો
                    </h4>
                    <div className="flex flex-col items-center justify-center p-4">
                      <label className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-black shadow-md cursor-pointer flex items-center gap-2 transition-all hover:-translate-y-0.5">
                        <Crop className="w-4 h-4" />
                        <span>ફોટો સિલેક્ટ અને ક્રોપ કરો</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUploadInit(e, 'poster')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-black text-neutral-800 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>અપલોડ કરેલા પોસ્ટર્સ ({(formData.mobilePosters || []).length})</span>
                    </h4>
                    {!(formData.mobilePosters || []).length ? (
                      <div className="p-4 rounded-xl border-2 border-dashed border-neutral-300 text-center text-neutral-500 text-xs font-bold bg-neutral-50">
                        કોઈ પોસ્ટર નથી. નવું પોસ્ટર ઉમેરો.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {(formData.mobilePosters || []).map((poster) => (
                          <div key={poster.id} className="relative group rounded-xl border-2 border-neutral-200 overflow-hidden aspect-[4/5] bg-neutral-100 shadow-sm">
                            <img src={poster.imageUrl} alt="Poster" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeletePoster('mobilePosters', poster.id)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center cursor-pointer shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Live Preview widget */}
                <div className="hidden lg:flex items-center justify-center p-4 bg-neutral-100 rounded-2xl border-2 border-dashed border-neutral-300">
                  <div className="w-64">
                     <MobilePosterWidget posters={formData.mobilePosters || []} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NEWS BOX */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-indigo-950 text-sm mb-1 flex items-center gap-1.5">
                    <Newspaper className="w-4 h-4 text-indigo-700" />
                    <span>ન્યૂઝ & અપડેટ્સ બોક્સ</span>
                  </h3>
                  <p className="text-indigo-800 font-bold text-[11px]">
                    ગ્રાહકને જમણી બાજુ પોસ્ટરની નીચે નવા સમાચાર, વેકેશન કે નવી સ્કીમની માહિતી બતાવો.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-300 shadow-sm space-y-3">
                    <h4 className="font-black text-neutral-900 text-xs border-b border-neutral-200 pb-2">
                      + નવો ફોટો ઉમેરો
                    </h4>
                    <div className="flex flex-col items-center justify-center p-4">
                      <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-black shadow-md cursor-pointer flex items-center gap-2 transition-all hover:-translate-y-0.5">
                        <Crop className="w-4 h-4" />
                        <span>ફોટો સિલેક્ટ અને ક્રોપ કરો</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUploadInit(e, 'news')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-black text-neutral-800 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>અપલોડ કરેલા ન્યૂઝ ({(formData.newsBoxPosters || []).length})</span>
                    </h4>
                    {!(formData.newsBoxPosters || []).length ? (
                      <div className="p-4 rounded-xl border-2 border-dashed border-neutral-300 text-center text-neutral-500 text-xs font-bold bg-neutral-50">
                        કોઈ ન્યૂઝ નથી. નવો ફોટો ઉમેરો.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {(formData.newsBoxPosters || []).map((poster) => (
                          <div key={poster.id} className="relative group rounded-xl border-2 border-neutral-200 overflow-hidden aspect-[4/5] bg-neutral-100 shadow-sm">
                            <img src={poster.imageUrl} alt="News" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeletePoster('newsBoxPosters', poster.id)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center cursor-pointer shadow opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Live Preview widget */}
                <div className="hidden lg:flex items-center justify-center p-4 bg-neutral-100 rounded-2xl border-2 border-dashed border-neutral-300">
                  <div className="w-64">
                     <MobilePosterWidget 
                        posters={formData.newsBoxPosters || []} 
                        headerTitle="નવા સમાચાર & અપડેટ્સ"
                        headerSubtitle="સ્ટોર અને ઓફર્સ વિશે માહિતી"
                        Icon={Newspaper}
                     />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>`;

// Replace old activeTab === 'posters' block
const activeTabRegex = /\{\/\* TAB 5: MOBILE POSTERS \*\/\}[\s\S]*?\{\/\* FOOTER ACTIONS \*\/\}/;
code = code.replace(activeTabRegex, postersUI + '\n\n        {/* FOOTER ACTIONS */}');

// Add ImageCropModal to the end of the return
code = code.replace(
  '    </div>\n  );\n};',
  `      {cropModalData.isOpen && (
        <ImageCropModal
          imageSrc={cropModalData.imageSrc}
          aspectPreset="free"
          title={cropModalData.type === 'poster' ? 'પોસ્ટર ક્રોપ કરો' : 'ન્યૂઝ ક્રોપ કરો'}
          onCropComplete={handleCropComplete}
          onClose={() => setCropModalData({ isOpen: false, imageSrc: '', type: null })}
        />
      )}
    </div>
  );
};`
);

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('updated modal tabs');
