// Signal-room strategies, walk-forward: older 60% (IS) vs newer 40% (OOS), 50 coins, fee 0.05%/side. Uses the app's own analyzeS().
// flip = trend-flip with quality filter, pb = pullback (structure stop, RR2), others = stop 1.5 ATR, RR1.5. Needs klines-cache.json.
import fs from 'node:fs';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const code='const ATRSL=1.5,MAXBARS=30;const PB=()=>({depth:21,rsi:45,adx:0});'+html.slice(html.indexOf('// ---------- indicators'),html.indexOf('function stats')).replace(/^const (P|QF|PB|SM)=.*$/gm,'').replace(/^const SNAME=.*$/m,'');
const {analyzeS}=new Function(code+';return{analyzeS}')();
const FEE=+process.env.FEE||0.0005,PER={'5m':300,'15m':900,'1h':3600},NAMES=(process.env.NAMES||'flip,pb,brk,st,sqz,vwp').split(',');
const CACHE=JSON.parse(fs.readFileSync(new URL('./klines-cache.json',import.meta.url),'utf8'));
const SYMS=[...new Set(Object.keys(CACHE).map(k=>k.replace(/(5m|15m|1h|4h)$/,'')))];
function bt(C,A,mode){const T=[];let busy=-1;for(let i=130;i<C.length-1;i++){const d=A.sig[i];if(!d||i<=busy)continue;const e=C[i+1].o,a=A.at[i];
 const risk=mode==='pb'?Math.min(3*a,Math.max(0.8*a,Math.abs(C[i].c-(A.ext[i]-d*0.2*a)))):1.5*a,rr=mode==='pb'?2:1.5,sl=e-d*risk,tp=e+d*rr*risk,MB=mode==='pb'?40:30;
 if(!(a>0)||(d>0?sl>=e:sl<=e)||Math.abs(tp-e)/e<4*FEE)continue;let ex=null,j=i+1;const lim=Math.min(i+MB,C.length-1);
 for(;j<=lim;j++){const k=C[j],hs=d>0?k.l<=sl:k.h>=sl,ht=d>0?k.h>=tp:k.l<=tp;if(hs){ex=sl;break}if(ht){ex=tp;break}}
 if(ex===null){j=lim;ex=C[j].c}T.push({t:C[i].t,d,pnl:d*(ex-e)/e*100-2*FEE*100});busy=j}return T}
const agg=T=>{if(!T.length)return{n:0,pf:0,txt:'n=   0'};const w=T.filter(x=>x.pnl>0),gp=w.reduce((a,x)=>a+x.pnl,0),gl=-T.filter(x=>x.pnl<=0).reduce((a,x)=>a+x.pnl,0),pf=gl?gp/gl:9.99;
 return{n:T.length,pf,txt:`n=${String(T.length).padStart(4)} (L${T.filter(x=>x.d>0).length}/S${T.filter(x=>x.d<0).length}) win=${(w.length/T.length*100).toFixed(0)}% avg=${(T.reduce((a,x)=>a+x.pnl,0)/T.length).toFixed(3)}% pf=${pf.toFixed(2)}`}};
const out={};
for(const tf of['5m','15m','1h']){const B=CACHE['BTCUSDT'+tf],t0=B[0][0],cut=t0+0.6*(B.at(-1)[0]-t0),days=(B.at(-1)[0]-t0)/86400;console.log(`\n===== ${tf}: ${days.toFixed(0)} days, fee ${FEE*100}% per side =====`);out[tf]={};
 const per=SYMS.map(s=>CACHE[s+tf]&&CACHE[s+tf].length>=600?CACHE[s+tf].map(x=>({t:x[0],o:x[1],h:x[2],l:x[3],c:x[4],v:x[5]})):null).filter(Boolean);
 for(const name of NAMES){const is=[],oos=[];for(const C of per){const A=analyzeS(name,C,tf,true);bt(C,A,name==='pb'?'pb':'x').forEach(t=>(t.t<cut?is:oos).push(t))}
  const a=agg(is),b=agg(oos);out[tf][name]={isPf:+a.pf.toFixed(2),oosPf:+b.pf.toFixed(2),oosN:b.n};
  console.log(name.padEnd(5),'IS ',a.txt,'\n     OOS',b.txt,`| signals per coin per day (newer 40%): ${(b.n/per.length/(days*0.4)).toFixed(2)}`)}}
console.log('\nTESTED='+JSON.stringify(out));
