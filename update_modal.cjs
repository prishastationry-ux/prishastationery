const fs = require('fs');
let code = fs.readFileSync('src/components/StoreSettingsModal.tsx', 'utf8');

// Imports
code = code.replace(
  "import {  Store,  X",
  "import {  Store,  X, Newspaper, Crop"
);
code = code.replace(
  "import { compressAndResizeImage } from '../lib/invoiceUtils';",
  "import { compressAndResizeImage } from '../lib/invoiceUtils';\nimport { ImageCropModal } from './ImageCropModal';\nimport { MobilePosterWidget } from './MobilePosterWidget';"
);

// Form Data Defaults
code = code.replace(
  "storeStories: settings.storeStories || [",
  "mobilePosters: settings.mobilePosters || [],\n    newsBoxPosters: settings.newsBoxPosters || [],\n    storeStories: settings.storeStories || ["
);

// Active Tab
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'store_info' | 'layout' | 'banners' | 'stories' | 'posters'>('store_info');",
  "const [activeTab, setActiveTab] = useState<'store_info' | 'layout' | 'banners' | 'stories' | 'posters' | 'news'>('store_info');"
);

// Add crop state variables
code = code.replace(
  "const [newPosterImageUrl, setNewPosterImageUrl] = useState<string>('');",
  "const [newPosterImageUrl, setNewPosterImageUrl] = useState<string>('');\n  const [cropModalData, setCropModalData] = useState<{isOpen: boolean; imageSrc: string; type: 'poster' | 'news' | null}>({ isOpen: false, imageSrc: '', type: null });\n"
);

// Update Poster add/delete and media upload
const posterHandlers = `  const handleAddPoster = (target: 'mobilePosters' | 'newsBoxPosters', imageUrl: string) => {
    const newEntry = {
      id: \`\${target}-\${Date.now()}\`,
      title: '', // no text required
      subtitle: '',
      imageUrl: imageUrl
    };
    setFormData(prev => ({
      ...prev,
      [target]: [...(prev[target] || []), newEntry]
    }));
    showToast('📱 નવો ફોટો ઉમેરવામાં આવ્યો!');
  };

  const handleDeletePoster = (target: 'mobilePosters' | 'newsBoxPosters', id: string) => {
    setFormData(prev => ({
      ...prev,
      [target]: (prev[target] || []).filter(p => p.id !== id)
    }));
    showToast('🗑️ ફોટો દૂર કર્યો.');
  };

  const handleMediaUploadInit = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'news') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropModalData({ isOpen: true, imageSrc: reader.result as string, type });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
  const handleCropComplete = (croppedBase64: string) => {
    if (cropModalData.type === 'poster') {
      handleAddPoster('mobilePosters', croppedBase64);
    } else if (cropModalData.type === 'news') {
      handleAddPoster('newsBoxPosters', croppedBase64);
    }
    setCropModalData({ isOpen: false, imageSrc: '', type: null });
  };`;

// replace handleAddPoster, handleDeletePoster, handlePosterMediaUpload
code = code.replace(
  /const handleAddPoster = \(\) => {[\s\S]*?const handlePosterMediaUpload = \(e: React.ChangeEvent<HTMLInputElement>\) => {[\s\S]*?reader\.readAsDataURL\(file\);\n    }\n  };/,
  posterHandlers
);

// Menu tabs
code = code.replace(
  /<button\s*onClick=\{\(\) => setActiveTab\('posters'\)\}[\s\S]*?મોબાઇલ પોસ્ટર્સ\s*<\/span>\s*<\/button>/,
  `<button
                onClick={() => setActiveTab('posters')}
                className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer \${
                  activeTab === 'posters' 
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md' 
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300'
                }\`}
              >
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2" />
                <span className="text-[10px] sm:text-xs font-black">મોબાઇલ પોસ્ટર્સ</span>
              </button>
              
              <button
                onClick={() => setActiveTab('news')}
                className={\`w-full flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer \${
                  activeTab === 'news' 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md' 
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:border-neutral-300'
                }\`}
              >
                <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2" />
                <span className="text-[10px] sm:text-xs font-black">ન્યૂઝ અપડેટ્સ</span>
              </button>`
);

fs.writeFileSync('src/components/StoreSettingsModal.tsx', code);
console.log('updated modal initial phase');
