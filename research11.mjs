// (A) How did each strategy do in the LAST 48 HOURS (fresh candles, same rules, 50 coins, fee 0.05%/side)?
// (B) New candidates: RSI2, MACD flip, NR7 breakout, and a FUNDING-RATE fade (a different kind of information: crowd positioning), on the older cache
//     (older 60% vs newer 40%) AND on the last 48 h. Needs klines-48h.json + funding.json (node fetch48.mjs) and klines-cache.json.
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const code='const ATRSL=1.5,MAXBARS=30;const PB=()=>({depth:21,rsi:45,adx:0});'+html.slice(html.indexOf('// ---------- indicators'),html.indexOf('function stats')).replace(/^const (P|QF|PB|SM)=.*$/gm,'').replace(/^const SNAME=.*$/m,'');
const {analyzeS}=new Function(code+';return{analyzeS}')();
const FEE=0.0005,PER={'5m':300,'15m':900,'1h':3600};
const rd=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url),'utf8'));
const OLD=rd('./klines-cache.json'),NEW=rd('./klines-48h.json'),FUND=rd('./funding.json');
const SYMS=Object.keys(FUND).filter(s=>NEW[s+'5m']);
const toC=R=>R.map(x=>({t:x[0],o:x[1],h:x[2],l:x[3],c:x[4],v:x[5]}));
// funding fade: last settled funding rate at candle close, ranked against the coin's previous 90 settlements (past only).
// top 10% (crowded longs) + a candle closing below the previous low = short; bottom 10% (crowded shorts) + close above the previous high = long.
function fundSig(C,per,F){const N=C.length,sig=Array(N).fill(0);let j=-1;
 for(let i=1;i<N;i++){const close=C[i].t+per;while(j+1<F.length&&F[j+1][0]<=close)j++;if(j<90)continue;
  const r=F[j][1],past=F.slice(j-90,j).map(x=>x[1]);let below=0;for(const p of past)if(p<r)below++;const pct=below/90;
  if(pct>=0.9&&C[i].c<C[i-1].l)sig[i]=-1;else if(pct<=0.1&&C[i].c>C[i-1].h)sig[i]=1}return sig}
function bt(C,A,mode,from){const T=[];let busy=-1;for(let i=130;i<C.length-1;i++){const d=A.sig[i];if(!d||i<=busy)continue;const e=C[i+1].o,a=A.at[i];
 const risk=mode==='pb'?Math.min(3*a,Math.max(0.8*a,Math.abs(C[i].c-(A.ext[i]-d*0.2*a)))):1.5*a,rr=mode==='pb'?2:1.5,sl=e-d*risk,tp=e+d*rr*risk,MB=mode==='pb'?40:30;
 if(!(a>0)||(d>0?sl>=e:sl<=e)||Math.abs(tp-e)/e<4*FEE)continue;let ex=null,j=i+1;const lim=Math.min(i+MB,C.length-1);
 for(;j<=lim;j++){const k=C[j],hs=d>0?k.l<=sl:k.h>=sl,ht=d>0?k.h>=tp:k.l<=tp;if(hs){ex=sl;break}if(ht){ex=tp;break}}
 if(ex===null){j=lim;ex=C[j].c}busy=j;if(C[i].t>=from)T.push({t:C[i].t,pnl:d*(ex-e)/e*100-2*FEE*100})}return T}
const agg=T=>{if(!T.length)return{n:0,pf:0,txt:'n=   0'};const w=T.filter(x=>x.pnl>0),gp=w.reduce((a,x)=>a+x.pnl,0),gl=-T.filter(x=>x.pnl<=0).reduce((a,x)=>a+x.pnl,0),pf=gl?gp/gl:9.99;
 return{n:T.length,pf,txt:`n=${String(T.length).padStart(4)} win=${(w.length/T.length*100).toFixed(0).padStart(2)}% avg=${(T.reduce((a,x)=>a+x.pnl,0)/T.length).toFixed(3).padStart(7)}% pf=${pf.toFixed(2)}`}};
const CUR=['flip','pb','brk','st','sqz','vwp','ovx'],CAND=['rsi2','macd','nr7','fund'],ALL=[...CUR,...CAND];
const sigFor=(name,C,tf,s,F)=>{if(name==='fund'){const base=analyzeS('vwp',C,tf,true);return{...base,sig:fundSig(C,PER[tf],F),ext:[]}}return analyzeS(name,C,tf,true)};
const t1=NEW['BTCUSDT5m'].at(-1)[0],from48=t1-48*3600;
console.log('Last 48 hours = '+new Date(from48*1000).toISOString()+' to '+new Date(t1*1000).toISOString());
console.log('\n######## (A)+(B) LAST 48 HOURS, all 50 coins (current strategies marked *) ########');
const pooled={};
for(const tf of['5m','15m','1h']){console.log(`\n--- ${tf} ---`);const per=SYMS.map(s=>({s,C:toC(NEW[s+tf])}));
 for(const name of ALL){const T=[];for(const{s,C}of per){const A=sigFor(name,C,tf,s,FUND[s]);T.push(...bt(C,A,name==='pb'?'pb':'x',from48))}
  const a=agg(T);(pooled[name]??=[]).push(...T);console.log((CUR.includes(name)?'*':' ')+name.padEnd(5),a.txt)}}
console.log('\n--- all three timeframes pooled, last 48 hours ---');
const rank=ALL.map(n=>({n,a:agg(pooled[n])})).sort((x,y)=>y.a.pf-x.a.pf);rank.forEach(r=>console.log((CUR.includes(r.n)?'*':' ')+r.n.padEnd(5),r.a.txt));
console.log('\n######## (B) CANDIDATES on the older cache: older 60% / newer 40% ########');
const res={};
for(const tf of['5m','15m','1h']){const B=OLD['BTCUSDT'+tf],t0=B[0][0],cut=t0+0.6*(B.at(-1)[0]-t0);console.log(`\n--- ${tf} ---`);res[tf]={};
 const per=SYMS.map(s=>OLD[s+tf]&&OLD[s+tf].length>=600?{s,C:toC(OLD[s+tf])}:null).filter(Boolean);
 for(const name of CAND){const is=[],oos=[];for(const{s,C}of per){const A=sigFor(name,C,tf,s,FUND[s]);bt(C,A,'x',0).forEach(t=>(t.t<cut?is:oos).push(t))}
  const a=agg(is),b=agg(oos);res[tf][name]={isPf:+a.pf.toFixed(2),oosPf:+b.pf.toFixed(2),n:b.n};console.log(name.padEnd(5),'IS ',a.txt,'\n     OOS',b.txt)}}
console.log('\nCANDIDATES='+JSON.stringify(res));
