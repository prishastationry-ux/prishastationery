import React, { useState } from 'react';
import {
  Store,
  X,
  Save,
  Layout,
  Grid,
  List,
  Sliders,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  Smartphone,
  Check,
  Film,
  Newspaper,
  Crop
} from 'lucide-react';
import { StoreSettings } from '../types';
import { compressAndResizeImage } from '../lib/invoiceUtils';
import { ImageCropModal } from './ImageCropModal';
import { MobilePosterWidget } from './MobilePosterWidget';

interface StoreSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onSave: (updated: Partial<StoreSettings>) => void;
  showToast: (msg: string) => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  showToast
}) => {
  const [formData, setFormData] = useState<Partial<StoreSettings>>({
    storeNameGu: settings.storeNameGu || '',
    storeNameEn: settings.storeNameEn || '',
    tagline: settings.tagline || '',
    ownerName: settings.ownerName || '',
    phone: settings.phone || '',
    phoneDisplay: settings.phoneDisplay || '',
    address: settings.address || '',
    marqueeText: settings.marqueeText || '',
    bannerTitle: settings.bannerTitle || '',
    bannerSubtitle: settings.bannerSubtitle || '',
    bannerImageUrl: settings.bannerImageUrl || '',
    productCardSize: settings.productCardSize || 'medium',
    productLayoutMode: settings.productLayoutMode || 'grid',
    catalogFirstView: settings.catalogFirstView || 'categories',
    productGridColumns: settings.productGridColumns || '4',
    autoSlideBannerInterval: settings.autoSlideBannerInterval || 4,
    showStoriesWidget: settings.showStoriesWidget !== false,
    showBannerSlider: settings.showBannerSlider !== false,
    bannerSlides: settings.bannerSlides && settings.bannerSlides.length > 0 ? settings.bannerSlides : [
      {
        id: 'slide-1',
        imageUrl: settings.bannerImageUrl || '',
        title: settings.bannerTitle || 'ઓનલાઇન સરકારી સેવાઓ અને સ્ટેશનરી સામાન',
        subtitle: settings.bannerSubtitle || 'નોટબુક, પેન, ફાઇલ્સ, આધાર-પાન કાર્ડ, ઝેરોક્ષ પ્રિન્ટિંગ'
      }
    ],
    mobilePosters: settings.mobilePosters || [],
    newsBoxPosters: settings.newsBoxPosters || [],
    storeStories: settings.storeStories || [
      {
        id: 'story-1',
        title: 'નવો સ્ટોક આવ્યો!',
        mediaUrl: '',
        type: 'image',
        caption: 'Classmate નોટબુક્સ અને બધી સ્ટેશનરી હવે ઉપલબ્ધ છે',
        date: 'આજે',
        active: true
      }
    ]
  });

  const [activeTab, setActiveTab] = useState<'store_info' | 'layout' | 'banners' | 'stories' | 'posters' | 'news'>('store_info');
  const [newSlideTitle, setNewSlideTitle] = useState<string>('');
  const [newSlideSubtitle, setNewSlideSubtitle] = useState<string>('');
  const [newSlideImageUrl, setNewSlideImageUrl] = useState<string>('');
  const [newStoryTitle, setNewStoryTitle] = useState<string>('');
  const [newStoryCaption, setNewStoryCaption] = useState<string>('');
  const [newStoryMediaUrl, setNewStoryMediaUrl] = useState<string>('');
  
  const [newPosterTitle, setNewPosterTitle] = useState<string>('');
  const [newPosterSubtitle, setNewPosterSubtitle] = useState<string>('');
  const [newPosterImageUrl, setNewPosterImageUrl] = useState<string>('');
  const [cropModalData, setCropModalData] = useState<{isOpen: boolean; imageSrc: string; type: 'poster' | 'news' | null}>({ isOpen: false, imageSrc: '', type: null });


  if (!isOpen) return null;

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAndResizeImage(file, 960, 480, 0.85);
      setNewSlideImageUrl(dataUrl);
      showToast('📸 બેનર ફોટો સફળતાપૂર્વક લોડ થયો!');
    } catch (err) {
      showToast('❌ ફોટો લોડ કરવામાં ભૂલ થઈ.');
    }
  };

  const handleStoryMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAndResizeImage(file, 720, 1280, 0.85);
      setNewStoryMediaUrl(dataUrl);
      showToast('📱 સ્ટોરી ફોટો સફળતાપૂર્વક લોડ થયો!');
    } catch (err) {
      showToast('❌ સ્ટોરી ફોટો લોડ કરવામાં ભૂલ થઈ.');
    }
  };

  const handleAddSlide = () => {
    if (!newSlideTitle.trim()) {
      showToast('⚠️ કૃપા કરીને બેનરનું ટાઇટલ લખો.');
      return;
    }
    const newSlide = {
      id: `slide-${Date.now()}`,
      title: newSlideTitle,
      subtitle: newSlideSubtitle,
      imageUrl: newSlideImageUrl || formData.bannerImageUrl || ''
    };
    const updatedSlides = [...(formData.bannerSlides || []), newSlide];
    setFormData(prev => ({ ...prev, bannerSlides: updatedSlides }));
    setNewSlideTitle('');
    setNewSlideSubtitle('');
    setNewSlideImageUrl('');
    showToast('✅ નવું બેનર ઉમેરાયું!');
  };

  const handleDeleteSlide = (id: string) => {
    setFormData(prev => ({
      ...prev,
      bannerSlides: (prev.bannerSlides || []).filter(s => s.id !== id)
    }));
    showToast('🗑️ બેનર દૂર કર્યું.');
  };

  const handleAddStory = () => {
    if (!newStoryTitle.trim()) {
      showToast('⚠️ કૃપા કરીને સ્ટોરીનું નામ લખો.');
      return;
    }
    const newStory = {
      id: `story-${Date.now()}`,
      title: newStoryTitle,
      caption: newStoryCaption,
      mediaUrl: newStoryMediaUrl,
      type: 'image' as const,
      date: 'આજે',
      active: true
    };
    const updatedStories = [...(formData.storeStories || []), newStory];
    setFormData(prev => ({ ...prev, storeStories: updatedStories }));
    setNewStoryTitle('');
    setNewStoryCaption('');
    setNewStoryMediaUrl('');
    showToast('✅ નવી સ્ટેટસ/સ્ટોરી ઉમેરાઈ!');
  };

  const handleDeleteStory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      storeStories: (prev.storeStories || []).filter(s => s.id !== id)
    }));
    showToast('🗑️ સ્ટોરી દૂર કરી.');
  };

    const handleAddPoster = (target: 'mobilePosters' | 'newsBoxPosters', imageUrl: string) => {
    const newEntry = {
      id: `${target}-${Date.now()}`,
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
  };

  const handleSaveAll = () => {
    onSave(formData);
    showToast('✅ દુકાન અને વેબસાઇટ સેટિંગ્સ સફળતાપૂર્વક સાચવાઈ ગયા!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in no-print overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border-2 border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#0B1E48] via-blue-900 to-[#0B1E48] text-white p-4 flex items-center justify-between gap-3 border-b-2 border-orange-500">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-black flex items-center justify-center font-black shadow">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>🏪 દુકાન & વેબસાઇટ ડિઝાઇન સેટિંગ્સ (Store Front Power)</span>
              </h2>
              <p className="text-xs text-orange-300 font-bold">
                વેબસાઇટ પર પ્રોડક્ટ બોક્સ સાઇઝ, લિસ્ટ વ્યૂ, ઓટો સ્લાઇડર બેનર અને WhatsApp સ્ટોરી બોક્સ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS BAR */}
        <div className="bg-neutral-100 p-2 border-b border-neutral-300 flex items-center gap-1.5 overflow-x-auto text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('store_info')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'store_info'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span>દુકાન વિગતો & નામ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'layout'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>દુકાન પાવર સેટિંગ્સ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>ઓટો સ્લાઇડર બેનર્સ (Multi-Banner)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stories'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>WhatsApp / Insta સ્ટોરી બોક્સ</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('posters')}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'posters'
                ? 'bg-[#0B1E48] text-white shadow-xs'
                : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-400" />
            <span>મોબાઇલ પોસ્ટર (જમણી બાજુનું સ્ક્રીન)</span>
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* TAB 1: STORE BASIC INFO */}
          {activeTab === 'store_info' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                <h3 className="font-black text-blue-950 text-sm mb-1 flex items-center gap-1.5">
                  <span>🏪 દુકાનની મૂળભૂત ઓળખ અને સંપર્ક</span>
                </h3>
                <p className="text-neutral-600 font-bold text-[11px]">
                  અહીં જે પણ ફેરફાર કરશો તે ગ્રાહકની મુખ્ય વેબસાઇટ, હેડર, ફૂટર અને સર્ચમાં રિયલ-ટાઇમ દેખાશે.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-bold">
                <div>
                  <label className="block text-neutral-700 mb-1">દુકાનનું નામ (ગુજરાતી):</label>
                  <input
                    type="text"
                    value={formData.storeNameGu || ''}
                    onChange={e => setFormData({ ...formData, storeNameGu: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-black text-neutral-900 outline-none focus:border-blue-700"
                    placeholder="પ્રિષા સ્ટેશનરી અને ઓનલાઇન સર્વિસ"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">દુકાનનું નામ (English):</label>
                  <input
                    type="text"
                    value={formData.storeNameEn || ''}
                    onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-black text-neutral-900 outline-none focus:border-blue-700 uppercase"
                    placeholder="PRISHA STATIONERY & ONLINE SERVICES"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">ટેગલાઇન / મુખ્ય સેવાઓ:</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-900 outline-none focus:border-blue-700"
                    placeholder="CSC ડિજિટલ સેવા કેન્દ્ર & સ્ટેશનરી માર્ટ"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">સંચાલકનું નામ (Owner Name):</label>
                  <input
                    type="text"
                    value={formData.ownerName || ''}
                    onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-900 outline-none focus:border-blue-700"
                    placeholder="BHARAT CHAUDHARY"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">હેલ્પલાઇન મોબાઇલ નંબર:</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value, phoneDisplay: `+91 ${e.target.value}` })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono font-bold text-neutral-900 outline-none focus:border-blue-700"
                    placeholder="8140430395"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-700 mb-1">દુકાનનું પૂરું સરનામું (Tharad):</label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-medium text-neutral-900 outline-none focus:border-blue-700"
                    placeholder="106, 107 Prince Arcade, Taluka Panchayat Same, Tharad..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-700 mb-1">ટોપ પર ચાલતી લાઇન (Marquee Scroll Text):</label>
                  <input
                    type="text"
                    value={formData.marqueeText || ''}
                    onChange={e => setFormData({ ...formData, marqueeText: e.target.value })}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-bold text-neutral-900 outline-none focus:border-blue-700 text-xs"
                    placeholder="💥 ધમાકા ઓફર: સ્કૂલ સ્ટેશનરી, નોટબુક હોલસેલ ભાવે..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE LAYOUT & BOX SIZE (FULL ADMIN POWER) */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                <h3 className="font-black text-purple-950 text-sm mb-1 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-700" />
                  <span>વેબસાઇટ લેઆઉટ, સાઇઝ & ગ્રાહક ડિસ્પ્લે પાવર કંટ્રોલ</span>
                </h3>
                <p className="text-neutral-600 font-bold text-[11px]">
                  ગ્રાહક જ્યારે વેબસાઇટ ખોલે ત્યારે પ્રોડક્ટ બોક્સ કેટલા મોટા દેખાવા જોઇએ, લિસ્ટમાં જોવું કે ગ્રીડમાં, અને પહેલા કેટેગરી દેખાવી જોઇએ કે પ્રોડક્ટ્સ તે પસંદ કરો.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold">
                {/* 1. Product Card Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    📐 પ્રોડક્ટ બોક્સ સાઇઝ (Card Size):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'small', label: 'નાની સાઇઝ', desc: 'વધુ વસ્તુઓ એક સ્ક્રીનમાં' },
                      { id: 'medium', label: 'મધ્યમ (સામાન્ય)', desc: 'સ્ટાન્ડર્ડ સુંદર દેખાવ' },
                      { id: 'large', label: 'મોટી સાઇઝ', desc: 'મોટો ફોટો & સ્પષ્ટ ભાવ' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, productCardSize: s.id as any })}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          formData.productCardSize === s.id
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="font-black text-xs">{s.label}</div>
                        <div className="text-[9.5px] opacity-75 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Layout Mode: Grid vs List */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    🔲 પ્રોડક્ટ ડિસ્પ્લે સ્ટાઇલ (Display View):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, productLayoutMode: 'grid' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        formData.productLayoutMode === 'grid'
                          ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                      <div>
                        <div className="font-black text-xs">બોક્સ ગ્રીડ (Grid)</div>
                        <div className="text-[9.5px] opacity-75">ઈ-કોમર્સ શોપ સ્ટાઇલ</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, productLayoutMode: 'list' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        formData.productLayoutMode === 'list'
                          ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                          : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <List className="w-4 h-4" />
                      <div>
                        <div className="font-black text-xs">સિંગલ લાઇન લિસ્ટ (List)</div>
                        <div className="text-[9.5px] opacity-75">એક નીચે એક લાઇન</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. First View Hierarchy */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    🏷️ ગ્રાહકને પહેલા શું બતાવવું (First Screen View):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, catalogFirstView: 'categories' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.catalogFirstView === 'categories'
                          ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                          : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="font-black text-xs">૧. પહેલા કેટેગરી બોક્સ</div>
                      <div className="text-[9.5px] opacity-75 mt-0.5">ક્લિક કરવાથી વસ્તુઓ ખૂલે</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, catalogFirstView: 'products' })}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.catalogFirstView === 'products'
                          ? 'bg-blue-900 text-white border-blue-950 shadow-xs'
                          : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      <div className="font-black text-xs">૨. ડાયરેક્ટ બધી વસ્તુઓ</div>
                      <div className="text-[9.5px] opacity-75 mt-0.5">તરત જ બધો સામાન દેખાય</div>
                    </button>
                  </div>
                </div>

                {/* 4. Column Density on Desktop */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    🖥️ કમ્પ્યુટર સ્ક્રીન કોલમ સંખ્યા (Columns):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['2', '3', '4', '5'].map(col => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormData({ ...formData, productGridColumns: col as any })}
                        className={`p-2 rounded-xl border text-center font-black text-xs transition-all cursor-pointer ${
                          formData.productGridColumns === col
                            ? 'bg-orange-500 text-black border-orange-600 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {col} કોલમ
                      </button>
                    ))}
                  </div>
                </div>
                {/* 5. Header Title Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    🅰️ દુકાનનું નામ સાઇઝ (Header Name Size):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'small', label: 'નાની' },
                      { id: 'medium', label: 'મધ્યમ' },
                      { id: 'large', label: 'મોટી' },
                      { id: 'xl', label: 'બહુ મોટી' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, headerNameSize: s.id as any })}
                        className={`py-1.5 rounded-lg border text-center font-black text-xs transition-all cursor-pointer ${
                          (formData.headerNameSize || 'large') === s.id
                            ? 'bg-amber-500 text-black border-amber-600 shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Product Text Size */}
                <div className="bg-white p-3.5 rounded-xl border border-neutral-300 space-y-2">
                  <label className="block text-neutral-900 font-black">
                    📝 પ્રોડક્ટ લખાણ સાઇઝ (Font Size):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'small', label: 'નાના અક્ષરો' },
                      { id: 'medium', label: 'મધ્યમ અક્ષરો' },
                      { id: 'large', label: 'મોટા અક્ષરો' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, productTextSize: s.id as any })}
                        className={`py-1.5 rounded-lg border text-center font-black text-xs transition-all cursor-pointer ${
                          (formData.productTextSize || 'medium') === s.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE LAYOUT & BOX SIZE (FULL ADMIN POWER) */}
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
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                          formData.headerNameSize === size || (!formData.headerNameSize && size === 'medium')
                            ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
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
                        className={`flex-1 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                          formData.productTextSize === size || (!formData.productTextSize && size === 'small')
                            ? 'bg-white text-emerald-700 shadow-sm border border-neutral-200'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
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
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          formData.productCardSize === s.id || (!formData.productCardSize && s.id === 'medium')
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }`}
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
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          formData.productGridColumns === cols || (!formData.productGridColumns && cols === '4')
                            ? 'bg-[#0B1E48] text-white border-blue-900 shadow-xs'
                            : 'bg-neutral-50 text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                        }`}
                      >
                        <div className="font-black text-[11px]">{cols}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUTO SLIDER MULTI-BANNERS */}
          {activeTab === 'banners' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-emerald-950 text-sm mb-0.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>ઓટો સ્લાઇડર બેનર્સ (Automatic Rotating Hero Banners)</span>
                  </h3>
                  <p className="text-neutral-600 font-bold text-[11px]">
                    વેબસાઇટના હોમ પેજ પર પોસ્ટર્સ એક પછી એક આપમેળે ફરતા રહેશે. તમે ગમે તેટલા નવા બેનર્સ ઉમેરી શકો છો.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-700">સ્પીડ:</span>
                  <select
                    value={formData.autoSlideBannerInterval || 4}
                    onChange={e => setFormData({ ...formData, autoSlideBannerInterval: Number(e.target.value) })}
                    className="p-1.5 border border-neutral-300 rounded-lg bg-white font-black text-xs outline-none"
                  >
                    <option value={3}>૩ સેકન્ડ</option>
                    <option value={4}>૪ સેકન્ડ</option>
                    <option value={6}>૬ સેકન્ડ</option>
                    <option value={8}>૮ સેકન્ડ</option>
                  </select>
                </div>
              </div>

              {/* CURRENT SLIDES LIST */}
              <div className="space-y-2">
                <h4 className="font-black text-neutral-800 text-xs">હાલના સક્રિય બેનર્સ (Active Slides):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(formData.bannerSlides || []).map((slide, idx) => (
                    <div key={slide.id} className="bg-neutral-50 p-3 rounded-xl border border-neutral-300 flex items-start gap-3 relative group">
                      <div className="w-20 h-16 bg-neutral-200 rounded-lg overflow-hidden shrink-0 border border-neutral-300 flex items-center justify-center">
                        {slide.imageUrl ? (
                          <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-neutral-400">બેનર {idx + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded">
                          સ્લાઇડ #{idx + 1}
                        </span>
                        <h5 className="font-black text-neutral-900 text-xs truncate mt-0.5">{slide.title}</h5>
                        {slide.subtitle && <p className="text-[10.5px] text-neutral-500 truncate">{slide.subtitle}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(slide.id)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="આ બેનર દૂર કરો"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD NEW SLIDE BOX */}
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-emerald-400 space-y-3">
                <h4 className="font-black text-emerald-950 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>+ નવું બેનર સ્લાઇડ ઉમેરો:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-bold">
                  <div>
                    <label className="block text-neutral-700 mb-1">બેનર હેડિંગ (Title):</label>
                    <input
                      type="text"
                      value={newSlideTitle}
                      onChange={e => setNewSlideTitle(e.target.value)}
                      placeholder="દા.ત. ખાસ સ્કૂલ કિટ પર 20% છૂટ!"
                      className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">સબ-ટાઇટલ (Subtitle):</label>
                    <input
                      type="text"
                      value={newSlideSubtitle}
                      onChange={e => setNewSlideSubtitle(e.target.value)}
                      placeholder="દા.ત. નોટબુક, પેન, પાઉચ સેટ હોલસેલ ભાવે"
                      className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                    <label className="bg-white hover:bg-neutral-100 text-emerald-900 border border-emerald-400 px-3 py-1.5 rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>બેનર ફોટો પસંદ કરો</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSlideImageUpload} />
                    </label>
                    {newSlideImageUrl && (
                      <span className="text-xs font-bold text-emerald-700">✓ ફોટો સિલેક્ટ થયો</span>
                    )}
                    <button
                      type="button"
                      onClick={handleAddSlide}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-black shadow cursor-pointer ml-auto"
                    >
                      + બેનર સાચવો
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WHATSAPP / INSTA STORIES WIDGET */}
          {activeTab === 'stories' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-purple-950 text-sm mb-0.5 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-700" />
                    <span>WhatsApp / Instagram સ્ટોરી બોક્સ (Live Store Status)</span>
                  </h3>
                  <p className="text-neutral-600 font-bold text-[11px]">
                    દુકાન પર જે નવો સામાન આવે કે નવી ઓફર હોય તેનો ફોટો અહીં અપલોડ કરો. ગ્રાહક તેના પર ક્લિક કરીને ફૂલ સ્ક્રીનમાં જોઈ શકશે.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showStoriesWidget !== false}
                    onChange={e => setFormData({ ...formData, showStoriesWidget: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600"
                  />
                  <span className="text-xs font-black text-purple-950">વેબસાઇટ પર બતાવો</span>
                </label>
              </div>

              {/* STORIES LIST */}
              <div className="space-y-2">
                <h4 className="font-black text-neutral-800 text-xs">હાલની સ્ટોરીઓ (Active Stories):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(formData.storeStories || []).map((story) => (
                    <div key={story.id} className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-300 relative group text-center space-y-1.5">
                      <div className="w-16 h-16 mx-auto rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                          {story.mediaUrl ? (
                            <img src={story.mediaUrl} alt={story.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">✨</span>
                          )}
                        </div>
                      </div>
                      <div className="font-black text-neutral-900 text-xs truncate">{story.title}</div>
                      {story.caption && <p className="text-[10px] text-neutral-500 truncate">{story.caption}</p>}
                      <button
                        type="button"
                        onClick={() => handleDeleteStory(story.id)}
                        className="text-red-600 hover:text-red-800 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ડીલીટ</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD NEW STORY */}
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-purple-400 space-y-3">
                <h4 className="font-black text-purple-950 text-xs flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-700" />
                  <span>+ નવી WhatsApp / Insta સ્ટોરી અપલોડ કરો:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-bold">
                  <div>
                    <label className="block text-neutral-700 mb-1">સ્ટોરીનું નામ / પ્રોડક્ટ:</label>
                    <input
                      type="text"
                      value={newStoryTitle}
                      onChange={e => setNewStoryTitle(e.target.value)}
                      placeholder="દા.ત. નવી વોટર બોટલ & લંચ બોક્સ"
                      className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-700 mb-1">વિગત / કિંમત (Caption):</label>
                    <input
                      type="text"
                      value={newStoryCaption}
                      onChange={e => setNewStoryCaption(e.target.value)}
                      placeholder="દા.ત. માત્ર ₹150 થી શરૂ • પ્રિષા સ્ટેશનરી"
                      className="w-full p-2 border border-neutral-300 rounded-lg outline-none focus:border-purple-600"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-purple-50/50 p-2.5 rounded-lg border border-purple-200">
                    <label className="bg-white hover:bg-neutral-100 text-purple-900 border border-purple-400 px-3 py-1.5 rounded-lg text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                      <span>સ્ટોરી ફોટો અપલોડ કરો</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleStoryMediaUpload} />
                    </label>
                    {newStoryMediaUrl && (
                      <span className="text-xs font-bold text-purple-700">✓ ફોટો અપલોડ થયો</span>
                    )}
                    <button
                      type="button"
                      onClick={handleAddStory}
                      className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-1.5 rounded-lg text-xs font-black shadow cursor-pointer ml-auto"
                    >
                      + સ્ટોરી પોસ્ટ કરો
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MOBILE POSTERS */}
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
};