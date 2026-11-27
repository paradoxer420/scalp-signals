// Downloads fresh candles for the last days (1500 per coin per timeframe) and each coin's funding-rate history. Paced to stay far under Binance limits.
// Output: klines-48h.json ({SYMBOL+tf: [[t,o,h,l,c,v],...]}, t in seconds) and funding.json ({SYMBOL: [[t,rate],...]}). Usage: node fetch48.mjs
import fs from 'node:fs';
const F='https://fapi.binance.com/fapi/v1/',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=async u=>{for(let i=0;i<8;i++){try{const r=await fetch(F+u);if(r.ok)return r.json();if(r.status===418||r.status===429){await sleep((+r.headers.get('retry-after')||60)*1000+2000);continue}}catch{}await sleep(2000)}throw new Error(u)};
const [tick,info]=await Promise.all([get('ticker/24hr'),get('exchangeInfo')]);
const ok=new Set(info.symbols.filter(s=>s.contractType==='PERPETUAL'&&s.quoteAsset==='USDT'&&s.status==='TRADING'&&s.underlyingType==='COIN'&&!/^(USDC|FDUSD|TUSD|USDP|DAI|USD1|BFUSD)/.test(s.baseAsset)).map(s=>s.symbol));
const SYMS=tick.filter(x=>ok.has(x.symbol)).sort((a,b)=>b.quoteVolume-a.quoteVolume).slice(0,50).map(x=>x.symbol);
const K={},FU={};
for(const s of SYMS){for(const tf of['5m','15m','1h']){const k=await get(`klines?symbol=${s}&interval=${tf}&limit=1500`);K[s+tf]=k.slice(0,-1).map(x=>[x[0]/1000,+x[1],+x[2],+x[3],+x[4],+x[5]]);await sleep(700)}
 try{const f=await get(`fundingRate?symbol=${s}&limit=1000`);FU[s]=f.map(x=>[x.fundingTime/1000,+x.fundingRate])}catch{FU[s]=[]}await sleep(300)}
fs.writeFileSync(new URL('./klines-48h.json',import.meta.url),JSON.stringify(K));fs.writeFileSync(new URL('./funding.json',import.meta.url),JSON.stringify(FU));
console.log('done',SYMS.length,'coins; newest 5m candle',new Date(K['BTCUSDT5m'].at(-1)[0]*1000).toISOString(),'| funding points BTC',FU['BTCUSDT'].length);
