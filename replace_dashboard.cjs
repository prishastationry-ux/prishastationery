const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const calcString = `
  // Auto ERP Calculations
  const now = new Date();
  const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const getStartOfWeek = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return getStartOfDay(x); };
  const getStartOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const getStartOfYear = (d) => new Date(d.getFullYear(), 0, 1).getTime();

  let calcTodaySales = 0;
  let calcWeekSales = 0;
  let calcMonthSales = 0;
  let calcYearSales = 0;

  orders.forEach(o => {
    let time = 0;
    if (o.id.startsWith('ord-')) {
      const parts = o.id.split('-');
      if (parts[1]) time = parseInt(parts[1]);
    }
    if (!time) time = now.getTime(); // fallback

    if (time >= getStartOfDay(now)) calcTodaySales += o.total;
    if (time >= getStartOfWeek(now)) calcWeekSales += o.total;
    if (time >= getStartOfMonth(now)) calcMonthSales += o.total;
    if (time >= getStartOfYear(now)) calcYearSales += o.total;
  });

  const calcStockValue = posItems.reduce((acc, item) => {
    return acc + (Number(item.stock || 0) * Number(item.costPrice || 0));
  }, 0);

  const displayTodaySales = calcTodaySales + (stats.correctionDaily || 0);
  const displayWeekSales = calcWeekSales + (stats.correctionWeekly || 0);
  const displayMonthSales = calcMonthSales + (stats.correctionMonthly || 0);
  const displayYearSales = calcYearSales + (stats.correctionYearly || 0);
  const displayStockValue = calcStockValue + (stats.correctionStockVal || 0);
`;

const dashboardString = `          {/* REAL-TIME ERP DASHBOARD */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => {
                const val = prompt('દૈનિક વેચાણ (Today) કરેક્શન/સુધારો (+/-):', (stats.correctionDaily || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionDaily: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-orange-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">💰 આજનું વેચાણ</p>
              <h3 className="text-sm font-black text-orange-600">₹{displayTodaySales.toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('અઠવાડિયાનું વેચાણ (Weekly) કરેક્શન/સુધારો (+/-):', (stats.correctionWeekly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionWeekly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-blue-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">📅 આ અઠવાડિયાનું વેચાણ</p>
              <h3 className="text-sm font-black text-blue-700">₹{displayWeekSales.toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('મહિનાનું વેચાણ (Monthly) કરેક્શન/સુધારો (+/-):', (stats.correctionMonthly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionMonthly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-emerald-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">📈 આ મહિનાનું વેચાણ</p>
              <h3 className="text-sm font-black text-emerald-600">₹{displayMonthSales.toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('આખા વર્ષનું વેચાણ (Yearly) કરેક્શન/સુધારો (+/-):', (stats.correctionYearly || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionYearly: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-purple-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">🏆 વાર્ષિક વેચાણ</p>
              <h3 className="text-sm font-black text-purple-700">₹{displayYearSales.toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>

            <div
              onClick={() => {
                const val = prompt('કુલ સ્ટોક માલની કિંમત કરેક્શન (+/-):', (stats.correctionStockVal || 0).toString());
                if (val !== null) setStats(s => ({ ...s, correctionStockVal: Number(val) || 0 }));
              }}
              className="bg-white p-3 rounded-xl border border-neutral-300 shadow-2xs cursor-pointer hover:border-red-500 transition-colors"
            >
              <p className="text-[10px] font-bold text-neutral-500">📦 કુલ માલ / સ્ટોક મૂલ્ય</p>
              <h3 className="text-sm font-black text-red-600">₹{displayStockValue.toFixed(2)}</h3>
              <span className="text-[9px] text-neutral-400 font-bold">ઓટો | ક્લિક કરી બદલો</span>
            </div>
          </div>`;

content = content.replace(/\{\/\* REAL-TIME STATS CARDS \*\/\}.*?<\/div>.*?<\/div>.*?<\/div>.*?<\/div>.*?<\/div>/s, dashboardString);

const insertionPoint = "  // Customer Shopping Cart & UI State";
content = content.replace(insertionPoint, calcString + '\n\n' + insertionPoint);

fs.writeFileSync('src/App.tsx', content);
