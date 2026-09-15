const fs = require('fs');
let code = fs.readFileSync('src/components/MobilePosterWidget.tsx', 'utf8');

code = code.replace(
  `title: 'ઓનલાઇન પ્રિન્ટિંગ & ઝેરોક્ષ સેવા'`,
  `title: 'નવી પ્રોડક્ટ્સ અને સ્કીમ'`
);
code = code.replace(
  `subtitle: 'WhatsApp & Web પરથી ફાઇલ મોકલો • સુપર ફાસ્ટ પ્રિન્ટ મેળવો'`,
  `subtitle: 'અહીં તમારા નવા ફોટા જોવા મળશે'`
);

code = code.replace(
  `title: 'સ્કૂલ-કોલેજ સ્ટેશનરી & ચોપડા'`,
  `title: 'નવી ઓફર'`
);
code = code.replace(
  `subtitle: 'હોલસેલ ભાવે તમામ બ્રાન્ડેડ સાહિત્ય ઉપલબ્ધ છે'`,
  `subtitle: 'અહીં તમારા નવા ફોટા જોવા મળશે'`
);

code = code.replace(
  `title: 'CSC ડિજિટલ સેવા કેન્દ્ર (Tharad)'`,
  `title: 'દુકાનની માહિતી'`
);
code = code.replace(
  `subtitle: 'આધાર, પાન કાર્ડ, ચૂંટણી કાર્ડ, આવકના દાખલા'`,
  `subtitle: 'અહીં તમારા નવા ફોટા જોવા મળશે'`
);

fs.writeFileSync('src/components/MobilePosterWidget.tsx', code);
console.log('Defaults updated');
