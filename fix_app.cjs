const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The original newsBoxPosters prop has headerTitle and headerSubtitle, but the mobilePosters does not
// Wait, we need to remove them from both if the user doesn't want them. Actually, the user specifically mentioned removing "દુકાન પોસ્ટર & ઓફર". If we don't pass headerTitle it'll be empty. 
code = code.replace(
  `              <MobilePosterWidget
                posters={storeSettings.newsBoxPosters || []}
                headerTitle="નવા સમાચાર & અપડેટ્સ"
                headerSubtitle="સ્ટોર અને ઓફર્સ વિશે માહિતી"
                Icon={Newspaper}
              />`,
  `              <MobilePosterWidget
                posters={storeSettings.newsBoxPosters || []}
              />`
);

fs.writeFileSync('src/App.tsx', code);
console.log('App updated');
