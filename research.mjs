// Tests extra confirmation filters on top of the base strategy (index.html logic is reused, not copied).
// Usage: node research.mjs   (public Binance futures data, no key)
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const code='const ATRSL=1.5,MAXBARS=30;'+html.slice(html.indexOf('// ---------- indicators'),html.indexOf('function stats')).replace(/^const (P|QF)=.*$/gm,'');
const {ema,rsi,atr,vwap,analyze,plan,backtest}=new Function(code+';return{ema,rsi,atr,vwap,analyze,plan,backtest}')();
const F='https://fapi.binance.com/fapi/v1/',FEE=0.0005,RR=1.5,sleep=ms=>new Promise(r=>setTimeout(r,ms));
const get=async u=>{for(let i=0;i<4;i++){try{const r=await fetch(F+u);if(r.ok)return r.json()}catch{}await sleep(1500)}throw new Error(u)};
const kl=async(s,tf)=>(await get(`klines?symbol=${s}&interval=${tf}&limit=1500`)).map(k=>({t:k[0]/1000,o:+k[1],h:+k[2],l:+k[3],c:+k[4],v:+k[5],tb:+k[9]}));
const PER={'5m':300,'15m':900,'1h':3600,'4h':14400};

// ---- extra indicators ----
function adx(C,n=14){const N=C.length,r=Array(N).fill(NaN);let tr=0,pd=0,md=0,a=0;
 for(let i=1;i<N;i++){const up=C[i].h-C[i-1].h,dn=C[i-1].l-C[i].l,t=Math.max(C[i].h-C[i].l,Math.abs(C[i].h-C[i-1].c),Math.abs(C[i].l-C[i-1].c)),p=up>dn&&up>0?up:0,m=dn>up&&dn>0?dn:0;
  if(i<=n){tr+=t;pd+=p;md+=m}else{tr=tr-tr/n+t;pd=pd-pd/n+p;md=md-md/n+m}
  if(i>=n){const pi=100*pd/tr,mi=100*md/tr,dx=100*Math.abs(pi-mi)/((pi+mi)||1);
   if(i<2*n){a+=dx;if(i==2*n-1)r[i]=a/n}else r[i]=(r[i-1]*(n-1)+dx)/n}}return r}
function supertrend(C,m=3){const at=atr(C,10),N=C.length,dir=Array(N).fill(0);let fu=0,fl=0,d=1;
 for(let i=1;i<N;i++){if(isNaN(at[i]))continue;const hl=(C[i].h+C[i].l)/2,bu=hl+m*at[i],bl=hl-m*at[i],pu=fu||bu,pl=fl||bl;
  fu=(bu<pu||C[i-1].c>pu)?bu:pu;fl=(bl>pl||C[i-1].c<pl)?bl:pl;d=d===1?(C[i].c<fl?-1:1):(C[i].c>fu?1:-1);dir[i]=d}return dir}
function bias(C){const c=C.map(k=>k.c),e20=ema(c,20),e50=ema(c,50),r=rsi(c);return c.map((x,i)=>i<60?0:x>e50[i]&&e20[i]>e50[i]&&r[i]>50?1:x<e50[i]&&e20[i]<e50[i]&&r[i]<50?-1:0)}

// ---- filters: f(i,d) true = keep the signal ----
function build(C,H,tf){const c=C.map(k=>k.c),A=analyze(C),ax=adx(C),st=supertrend(C),e12=ema(c,12),e26=ema(c,26),ln=e12.map((x,i)=>x-e26[i]),sg=ema(ln,9),hist=ln.map((x,i)=>x-sg[i]),e200=ema(c,200),
 rv=C.map((k,i)=>i<21?0:k.v/(C.slice(i-20,i).reduce((a,x)=>a+x.v,0)/20)),
 tk=C.map((k,i)=>i<2?.5:C.slice(i-2,i+1).reduce((a,x)=>a+x.tb,0)/(C.slice(i-2,i+1).reduce((a,x)=>a+x.v,0)||1)),
 hb=H?bias(H.d):null,hp=H?PER[H.tf]:0,P=PER[tf];
 const hbAt=i=>{if(!hb)return 0;const close=C[i].t+P;let lo=0,hi=H.d.length-1,r=-1;while(lo<=hi){const m=(lo+hi)>>1;if(H.d[m].t+hp<=close){r=m;lo=m+1}else hi=m-1}return r<0?0:hb[r]};
 const pos=i=>(C[i].c-C[i].l)/((C[i].h-C[i].l)||1);
 const flt={
  adx20:(i)=>ax[i]>20, adx25:(i)=>ax[i]>25,
  relvol1_5:(i)=>Math.max(rv[i],rv[i-1])>1.5, relvol1:(i)=>rv[i]>1,
  supertrend:(i,d)=>st[i]===d,
  macd:(i,d)=>d*hist[i]>0&&d*(hist[i]-hist[i-1])>0,
  ema200:(i,d)=>d*(c[i]-e200[i])>0,
  takerflow:(i,d)=>d>0?tk[i]>0.52:tk[i]<0.48,
  notExtended:(i)=>Math.abs(c[i]-A.e21[i])<1.2*A.at[i],
  strongClose:(i,d)=>d>0?pos(i)>0.6:pos(i)<0.4,
  htfBias:(i,d)=>hbAt(i)===d,
  htfNotAgainst:(i,d)=>hbAt(i)!==-d};
 return{A,flt}}

function run(C,A,keep){const A2={...A,sig:A.sig.map((d,i)=>d&&keep(i,d)?d:0)};return backtest(C,A2,{fee:FEE,rr:RR,shorts:true})}
function agg(T){if(!T.length)return{n:0,wr:0,avg:0,pf:0};const w=T.filter(x=>x.pnl>0),gp=w.reduce((a,x)=>a+x.pnl,0),gl=-T.filter(x=>x.pnl<=0).reduce((a,x)=>a+x.pnl,0);
 return{n:T.length,wr:w.length/T.length*100,avg:T.reduce((a,x)=>a+x.pnl,0)/T.length,pf:gl?gp/gl:9.99}}
const fmt=a=>`n=${String(a.n).padStart(4)} win=${a.wr.toFixed(0).padStart(2)}% avg=${a.avg.toFixed(3).padStart(7)}% pf=${a.pf.toFixed(2)}`;

const tick=await get('ticker/24hr'),info=await get('exchangeInfo');
const ok=new Set(info.symbols.filter(s=>s.contractType==='PERPETUAL'&&s.quoteAsset==='USDT'&&s.status==='TRADING'&&s.underlyingType==='COIN'&&!/^(USDC|FDUSD|TUSD|USDP|DAI|USD1|BFUSD)/.test(s.baseAsset)).map(s=>s.symbol));
const SYMS=tick.filter(x=>ok.has(x.symbol)).sort((a,b)=>b.quoteVolume-a.quoteVolume).slice(0,50).map(x=>x.symbol);
console.log('coins',SYMS.length);
const data={};
for(const s of SYMS)for(const tf of['5m','15m','1h','4h']){data[s+tf]=await kl(s,tf);await sleep(120)}
const HT={'5m':'1h','15m':'1h','1h':'4h'},NAMES=Object.keys(build(data[SYMS[0]+'1h'].slice(0,-1),{d:data[SYMS[0]+'4h'].slice(0,-1),tf:'4h'},'1h').flt);
for(const tf of['5m','15m','1h']){
 const res={base:{all:[],oos:[]}};NAMES.forEach(n=>res[n]={all:[],oos:[]});const combos={};
 for(const s of SYMS){const C=data[s+tf].slice(0,-1),H={d:data[s+HT[tf]].slice(0,-1),tf:HT[tf]};if(C.length<400)continue;const{A,flt}=build(C,H,tf),cut=C[Math.floor(C.length*0.6)].t;
  const add=(k,T)=>{(res[k]??={all:[],oos:[]}).all.push(...T);res[k].oos.push(...T.filter(x=>x.t>=cut))};
  add('base',run(C,A,()=>true));
  for(const n of NAMES)add(n,run(C,A,(i,d)=>i>210&&flt[n](i,d)));
  for(let a=0;a<NAMES.length;a++)for(let b=a+1;b<NAMES.length;b++){const k=NAMES[a]+'+'+NAMES[b];add(k,run(C,A,(i,d)=>i>210&&flt[NAMES[a]](i,d)&&flt[NAMES[b]](i,d)))}}
 console.log(`\n===== ${tf} (all data | out-of-sample last 40%) =====`);
 const rows=Object.entries(res).map(([k,v])=>({k,a:agg(v.all),o:agg(v.oos)}));
 const show=r=>console.log(r.k.padEnd(28),fmt(r.a),' | OOS',fmt(r.o));
 show(rows.find(r=>r.k==='base'));console.log('-- single filters');rows.filter(r=>NAMES.includes(r.k)).sort((x,y)=>y.o.pf-x.o.pf).forEach(show);
 console.log('-- best pairs (OOS n>=150, ranked by OOS profit factor, in-sample pf must also beat base)');
 const b=rows.find(r=>r.k==='base');rows.filter(r=>r.k.includes('+')&&r.o.n>=150&&r.a.pf>b.a.pf).sort((x,y)=>y.o.pf-x.o.pf).slice(0,6).forEach(show)}
