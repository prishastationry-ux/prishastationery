export interface DistrictData {
  id: string;
  nameGu: string;
  nameEn: string;
  talukas: string[];
}

export const GUJARAT_DISTRICTS: DistrictData[] = [
  {
    id: 'banaskantha',
    nameGu: 'બનાસકાંઠા (વાવ - થરાદ)',
    nameEn: 'Banaskantha (Vav-Tharad)',
    talukas: [
      'થરાદ (Tharad)',
      'વાવ (Vav)',
      'સુઈગામ (Suigam)',
      'ભાભર (Bhabhar)',
      'લાખણી (Lakhani)',
      'ધાનેરા (Dhanera)',
      'ડીસા (Deesa)',
      'દિયોદર (Diodar)',
      'પાલનપુર (Palanpur)',
      'દાંતીવાડા (Dantiwada)',
      'કાંકરેજ (Kankrej)',
      'વડગામ (Vadgam)',
      'દાંતા (Danta)',
      'અમીરગઢ (Amirgadh)'
    ]
  },
  {
    id: 'patan',
    nameGu: 'પાટણ (Patan)',
    nameEn: 'Patan',
    talukas: [
      'રાધનપુર (Radhanpur)',
      'સાંતલપુર (Santalpur)',
      'સમી (Sami)',
      'શંખેશ્વર (Shankheshwar)',
      'હારીજ (Harij)',
      'પાટણ (Patan)',
      'સિદ્ધપુર (Sidhpur)',
      'ચાણસ્મા (Chanasma)',
      'સરસ્વતી (Saraswati)'
    ]
  },
  {
    id: 'mehsana',
    nameGu: 'મહેસાણા (Mehsana)',
    nameEn: 'Mehsana',
    talukas: [
      'મહેસાણા (Mehsana)',
      'વિસનગર (Visnagar)',
      'ઊંઝા (Unjha)',
      'કડી (Kadi)',
      'વડનગર (Vadnagar)',
      'ખેરાલુ (Kheralu)',
      'વિજાપુર (Vijapur)',
      'બેચરાજી (Becharaji)',
      'જોટાણા (Jotana)',
      'સતલાસણા (Satlasana)'
    ]
  },
  {
    id: 'sabarkantha',
    nameGu: 'સાબરકાંઠા (Sabarkantha)',
    nameEn: 'Sabarkantha',
    talukas: ['હિંમતનગર', 'ઈડર', 'પ્રાંતિજ', 'તલોદ', 'ખેડબ્રહ્મા', 'વડાલી', 'પોશિના', 'વિજયનગર']
  },
  {
    id: 'aravalli',
    nameGu: 'અરવલ્લી (Aravalli)',
    nameEn: 'Aravalli',
    talukas: ['મોડાસા', 'બાયડ', 'ભિલોડા', 'ધનસુરા', 'માલપુર', 'મેઘરજ']
  },
  {
    id: 'ahmedabad',
    nameGu: 'અમદાવાદ (Ahmedabad)',
    nameEn: 'Ahmedabad',
    talukas: [
      'અમદાવાદ શહેર (Ahmedabad City)',
      'દસ્ક્રોઈ (Daskroi)',
      'સાણંદ (Sanand)',
      'ધોળકા (Dholka)',
      'બાવળા (Bavla)',
      'વિરમગામ (Viramgam)',
      'માંડલ (Mandal)',
      'દેત્રોજ (Detroj)',
      'ધંધુકા (Dhandhuka)',
      'ધોલેરા (Dholera)'
    ]
  },
  {
    id: 'gandhinagar',
    nameGu: 'ગાંધીનગર (Gandhinagar)',
    nameEn: 'Gandhinagar',
    talukas: ['ગાંધીનગર', 'કલોલ', 'દહેગામ', 'માણસા']
  },
  {
    id: 'kutch',
    nameGu: 'કચ્છ (Kutch)',
    nameEn: 'Kutch',
    talukas: ['ભુજ', 'ગાંધીધામ', 'અંજાર', 'માંડવી', 'મુન્દ્રા', 'ભચાઉ', 'રાપર', 'નખત્રાણા', 'અબડાસા', 'લખપત']
  },
  {
    id: 'surat',
    nameGu: 'સુરત (Surat)',
    nameEn: 'Surat',
    talukas: ['સુરત શહેર', 'ચોર્યાસી', 'કામરેજ', 'ઓલપાડ', 'પલસાણા', 'બારડોલી', 'માંડવી', 'મહુવા', 'માંગરોળ', 'ઉમરપાડા']
  },
  {
    id: 'rajkot',
    nameGu: 'રાજકોટ (Rajkot)',
    nameEn: 'Rajkot',
    talukas: ['રાજકોટ', 'ગોંડલ', 'જેતપુર', 'ધોરાજી', 'ઉપલેટા', 'જસદણ', 'વિંછીયા', 'કોટડા સાંગાણી', 'લોધિકા', 'પડધરી', 'જામકંડોરણા']
  },
  {
    id: 'vadodara',
    nameGu: 'વડોદરા (Vadodara)',
    nameEn: 'Vadodara',
    talukas: ['વડોદરા', 'ડભોઈ', 'પાદરા', 'કરજણ', 'વાઘોડિયા', 'સાવલી', 'ડેસર', 'શિનોર']
  },
  {
    id: 'bhavnagar',
    nameGu: 'ભાવનગર (Bhavnagar)',
    nameEn: 'Bhavnagar',
    talukas: ['ભાવનગર', 'સિહોર', 'પાલીતાણા', 'તળાજા', 'મહુવા', 'ગારીયાધાર', 'ઘોઘા', 'વલ્લભીપુર', 'ઉમરાળા', 'જેસર']
  },
  {
    id: 'jamnagar',
    nameGu: 'જામનગર (Jamnagar)',
    nameEn: 'Jamnagar',
    talukas: ['જામનગર', 'લાલપુર', 'જામજોધપુર', 'કાલાવડ', 'ધ્રોલ', 'જોડિયા']
  },
  {
    id: 'junagadh',
    nameGu: 'જૂનાગઢ (Junagadh)',
    nameEn: 'Junagadh',
    talukas: ['જૂનાગઢ', 'કેશોદ', 'માંગરોળ', 'માળિયા હાટીના', 'માણાવદર', 'વંથલી', 'વિસાવદર', 'મેંદરડા', 'ભેસાણ']
  },
  {
    id: 'morbi',
    nameGu: 'મોરબી (Morbi)',
    nameEn: 'Morbi',
    talukas: ['મોરબી', 'વાંકાનેર', 'હળવદ', 'ટંકારા', 'માળિયા (મિયાણા)']
  },
  {
    id: 'surendranagar',
    nameGu: 'સુરેન્દ્રનગર (Surendranagar)',
    nameEn: 'Surendranagar',
    talukas: ['વઢવાણ', 'ધ્રાંગધ્રા', 'લીંબડી', 'ચોટીલા', 'સાયલા', 'મૂળી', 'દસાડા (પાટડી)', 'થાનગઢ', 'ચુડા', 'લખતર']
  },
  {
    id: 'anand',
    nameGu: 'આણંદ (Anand)',
    nameEn: 'Anand',
    talukas: ['આણંદ', 'બોરસદ', 'ખંભાત', 'પેટલાદ', 'સોજિત્રા', 'તારાપુર', 'ઉમરેઠ', 'આંકલાવ']
  },
  {
    id: 'kheda',
    nameGu: 'ખેડા (Kheda)',
    nameEn: 'Kheda',
    talukas: ['નડિયાદ', 'મહેમદાવાદ', 'મહુધા', 'માતર', 'ખેડા', 'કપડવંજ', 'કઠલાલ', 'ઠાસરા', 'ગળતેશ્વર', 'વસો']
  },
  {
    id: 'bharuch',
    nameGu: 'ભરૂચ (Bharuch)',
    nameEn: 'Bharuch',
    talukas: ['ભરૂચ', 'અંકલેશ્વર', 'જંબુસર', 'આમોદ', 'વાગરા', 'ઝઘડિયા', 'નેત્રંગ', 'હાસોટ', 'વાલિયા']
  },
  {
    id: 'navsari',
    nameGu: 'નવસારી (Navsari)',
    nameEn: 'Navsari',
    talukas: ['નવસારી', 'જલાલપોર', 'ગણદેવી', 'ચીખલી', 'વાંસદા', 'ખેરગામ']
  },
  {
    id: 'valsad',
    nameGu: 'વલસાડ (Valsad)',
    nameEn: 'Valsad',
    talukas: ['વલસાડ', 'વાપી', 'પારડી', 'ઉમરગામ', 'ધરમપુર', 'કપરાડા']
  },
  {
    id: 'amreli',
    nameGu: 'અમરેલી (Amreli)',
    nameEn: 'Amreli',
    talukas: ['અમરેલી', 'બગસરા', 'બાબરા', 'ધારી', 'જાફરાબાદ', 'ખાંભા', 'કુંકાવાવ-વડિયા', 'લાઠી', 'લીલીયા', 'રાજુલા', 'સાવરકુંડલા']
  },
  {
    id: 'gir_somnath',
    nameGu: 'ગીર સોમનાથ (Gir Somnath)',
    nameEn: 'Gir Somnath',
    talukas: ['વેરાવળ', 'સુત્રાપાડા', 'કોડિનાર', 'ઉના', 'ગીર ગઢડા', 'તાલાળા']
  },
  {
    id: 'devbhumi_dwarka',
    nameGu: 'દેવભૂમિ દ્વારકા (Devbhumi Dwarka)',
    nameEn: 'Devbhumi Dwarka',
    talukas: ['ખંભાળિયા', 'ઓખા મંડળ (દ્વારકા)', 'કલ્યાણપુર', 'ભાણવડ']
  },
  {
    id: 'porbandar',
    nameGu: 'પોરબંદર (Porbandar)',
    nameEn: 'Porbandar',
    talukas: ['પોરબંદર', 'રાણાવાવ', 'કુતિયાણા']
  },
  {
    id: 'botad',
    nameGu: 'બોટાદ (Botad)',
    nameEn: 'Botad',
    talukas: ['બોટાદ', 'બરવાળા', 'ગઢડા', 'રાણપુર']
  },
  {
    id: 'panchmahal',
    nameGu: 'પંચમહાલ (Panchmahal)',
    nameEn: 'Panchmahal',
    talukas: ['ગોધરા', 'હાલોલ', 'કાલોલ', 'ઘોઘંબા', 'શહેરા', 'મોરવા હડફ', 'જાંબુઘોડા']
  },
  {
    id: 'dahod',
    nameGu: 'દાહોદ (Dahod)',
    nameEn: 'Dahod',
    talukas: ['દાહોદ', 'ઝાલોદ', 'લીમખેડા', 'ગરબાડા', 'ફતેપુરા', 'દેવગઢ બારિયા', 'ધાનપુર', 'સંજેલી', 'સિંગવડ']
  },
  {
    id: 'mahisagar',
    nameGu: 'મહીસાગર (Mahisagar)',
    nameEn: 'Mahisagar',
    talukas: ['લુણાવાડા', 'સંતરામપુર', 'કડાણા', 'વીરપુર', 'બાલાસિનોર', 'ખાનપુર']
  },
  {
    id: 'chhota_udaipur',
    nameGu: 'છોટા ઉદેપુર (Chhota Udaipur)',
    nameEn: 'Chhota Udaipur',
    talukas: ['છોટા ઉદેપુર', 'બોડેલી', 'જેતપુર પાવી', 'કવાંટ', 'નસવાડી', 'સંખેડા']
  },
  {
    id: 'narmada',
    nameGu: 'નર્મદા (Narmada)',
    nameEn: 'Narmada',
    talukas: ['રાજપીપળા (નાંદોદ)', 'ગરુડેશ્વર', 'તિલકવાડા', 'દેડિયાપાડા', 'સાગબારા']
  },
  {
    id: 'tapi',
    nameGu: 'તાપી (Tapi)',
    nameEn: 'Tapi',
    talukas: ['વ્યારા', 'સોનગઢ', 'વાલોડ', 'ઉચ્છલ', 'નિઝર', 'કુકરમુંડા', 'ડોલવણ']
  },
  {
    id: 'dang',
    nameGu: 'ડાંગ (Dang)',
    nameEn: 'Dang',
    talukas: ['આહવા', 'વધઈ', 'સુબીર']
  }
];

// Popular villages directory for Tharad, Vav, Banaskantha, and nearby regions
export const POPULAR_VILLAGES_MAP: Record<string, string[]> = {
  tharad: [
    'થરાદ શહેર (Tharad City)',
    'ઢીમા (Dhima)',
    'રાહ (Rah)',
    'ખોડા (Khoda)',
    'નાગલા (Nagla)',
    'ડુવા (Duva)',
    'ચારડા (Charda)',
    'પીલુડા (Piluda)',
    'અસાસણ (Asasan)',
    'જમડા (Jamda)',
    'જેતડા (Jetda)',
    'શેરગઢ (Shergadh)',
    'રાણપુર (Ranpur)',
    'વડગામડા (Vadgamda)',
    'લોડ્રોર (Lodror)',
    'ઉચપા (Uchpa)',
    'મિયાલ (Miyal)',
    'કુંભારા (Kumbhara)',
    'તેરા (Tera)',
    'દોડગામ (Dodgam)',
    'વારા (Vara)',
    'ખેંગારપુરા (Khengapura)',
    'લખમીપુરા (Lakhmipura)',
    'મલુપુર (Malupur)'
  ],
  vav: [
    'વાવ નગર (Vav Town)',
    'ભોરોલ (Bhorol)',
    'માલસણ (Malsan)',
    'રાધનપુર રોડ (Radhanpur Rd)',
    'મોરીખા (Morikha)',
    'ચોથાણા (Chothana)',
    'કુંભારખા (Kumbharkha)',
    'તારુવા (Taruva)',
    'ગડસીસર (Gadsisar)',
    'મીઠાવી (Mithavi)',
    'ઢીમા રોડ (Dhima Rd)',
    'બલોધણ (Balodhan)'
  ],
  suigam: [
    'સુઈગામ (Suigam)',
    'બેણપ (Benap)',
    'કનેસરા (Kanesara)',
    'રાધાનેસડા (Radhanesda)',
    'ઝઝામ (Jhajham)',
    'લીંબુણી (Limbuni)',
    'મોટી સરુ (Moti Saru)',
    'દેલણકોટ (Delankot)'
  ],
  bhabhar: [
    'ભાભર શહેર (Bhabhar City)',
    'રૂણી (Runi)',
    'ચીચોદરા (Chichodra)',
    'મેસરા (Mesra)',
    'ભાભર જૂના (Old Bhabhar)',
    'સુરાણા (Surana)',
    'ટેરા (Tera)',
    'કપરૂપુર (Kaprpur)'
  ],
  lakhani: [
    'લાખણી (Lakhani)',
    'જસરા (Jasra)',
    'કુડા (Kuda)',
    'ગેળા (Gela)',
    'પેપોળ (Pepol)',
    'લવાણા (Lavana)',
    'શેરગઢ (Shergadh)'
  ],
  dhanera: [
    'ધાનેરા શહેર (Dhanera City)',
    'રમાસીણા (Ramasina)',
    'રાણપુર (Ranpur)',
    'સોથેડા (Sotheda)',
    'ધાખા (Dhakha)',
    'કરધા (Kardha)',
    'એડલ (Edal)'
  ],
  deesa: [
    'ડીસા શહેર (Deesa City)',
    'ભીલડી (Bhildi)',
    'ઝાંપા (Jhampa)',
    'રામસણ (Ramsan)',
    'લોરવાડા (Lorwada)',
    'ઝેરડા (Jherda)'
  ],
  palanpur: [
    'પાલનપુર શહેર (Palanpur City)',
    'કનોદરા (Kanodar)',
    'ગઢ (Gadh)',
    'ચંડીસર (Chandisar)',
    'જગાણા (Jagana)',
    'સદરપુર (Sadarpur)'
  ],
  radhanpur: [
    'રાધનપુર શહેર (Radhanpur City)',
    'સાંતલપુર (Santalpur)',
    'વરાણા (Varana)',
    'ગોળીયા (Goliya)',
    'પેડાસણ (Pedasan)'
  ]
};

// Known pincodes for prompt auto-fill
export const TALUKA_PINCODES: Record<string, string> = {
  'થરાદ': '385565',
  'વાવ': '385575',
  'સુઈગામ': '385570',
  'ભાભર': '385320',
  'લાખણી': '385535',
  'ધાનેરા': '385310',
  'ડીસા': '385535',
  'પાલનપુર': '385001',
  'દિયોદર': '385330',
  'દાંતીવાડા': '385505',
  'કાંકરેજ': '385550',
  'રાધનપુર': '385340',
  'સિદ્ધપુર': '384151',
  'પાટણ': '384265',
  'મહેસાણા': '384001',
  'ઊંઝા': '384170',
  'અમદાવાદ': '380001',
  'ગાંધીનગર': '382010',
  'સુરત': '395003',
  'રાજકોટ': '360001',
  'વડોદરા': '390001',
  'ભુજ': '370001'
};

export function getVillagesForTaluka(talukaName: string): string[] {
  if (!talukaName) return [];
  const lower = talukaName.toLowerCase();
  for (const [k, v] of Object.entries(POPULAR_VILLAGES_MAP)) {
    if (lower.includes(k) || talukaName.includes(k)) {
      return v;
    }
  }
  // Generic fallbacks for Banaskantha / Tharad area
  if (talukaName.includes('થરાદ') || talukaName.includes('Tharad')) {
    return POPULAR_VILLAGES_MAP.tharad;
  }
  if (talukaName.includes('વાવ') || talukaName.includes('Vav')) {
    return POPULAR_VILLAGES_MAP.vav;
  }
  return [];
}

export function getPincodeForTaluka(talukaName: string): string {
  if (!talukaName) return '';
  for (const [k, pin] of Object.entries(TALUKA_PINCODES)) {
    if (talukaName.includes(k)) {
      return pin;
    }
  }
  return '';
}
