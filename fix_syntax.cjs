const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

// The bottom of the file currently looks like:
/*
                </div>
              </div>
            </div>
          )}

          
        />
      )}
    </div>
  );
};
*/

// Let's replace the corrupted end of the file with the proper ending
const properEnding = `                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-neutral-100 p-3 sm:p-4 border-t border-neutral-300 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500 font-bold hidden sm:block">
            💡 સેવ બટન દબાવતાની સાથે જ ગ્રાહકની લાઇવ વેબસાઇટ પર ફેરફાર લાગુ પડી જશે.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-neutral-200 text-neutral-800 border border-neutral-300 px-4 py-2 rounded-xl text-xs font-black cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="bg-[#0B1E48] hover:bg-blue-900 text-white px-6 py-2 rounded-xl text-xs font-black shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-orange-400" />
              <span>સેવ કરો (Save Settings)</span>
            </button>
          </div>
        </div>
      </div>

      {cropModalData.isOpen && (
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
};`;

const badRegex = /\s*\}\)\}\s*\/>\s*\}\)\s*<\/div>\s*\);\s*\};\s*$/;
code = code.replace(/\{\/\* Right Side: Live Preview widget \*\/\}[\s\S]*$/, `                {/* Right Side: Live Preview widget */}
                <div className="hidden lg:flex items-center justify-center p-4 bg-neutral-100 rounded-2xl border-2 border-dashed border-neutral-300">
                  <div className="w-64">
                     <MobilePosterWidget posters={formData.mobilePosters || []} />
                  </div>
                </div>
              </div>
            </div>
          )}
` + properEnding.substring(properEnding.indexOf('        </div>\n\n        {/* FOOTER ACTIONS */}')));

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('Fixed syntax in StoreSettingsModal');
