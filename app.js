
const $=s=>document.querySelector(s),LS=localStorage,V=$('#v'),G=$('#grid'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jg=(k,d)=>{try{return JSON.parse(LS[k])||d}catch{return d}};
const S={dev:LS.asc_dev,items:[],tab:'home',rails:{},rt:null,cat:'Todos',q:'',epg:{},al:{},fav:[],view:[],pos:0};
let DBP;const db=()=>DBP||(DBP=new Promise((res,rej)=>{const q=indexedDB.open('asc',1);q.onupgradeneeded=()=>q.result.createObjectStore('k');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}));
const kv=async(m,k,v)=>{const d=await db();return new Promise((res,rej)=>{const o=d.transaction('k',m=='get'?'readonly':'readwrite').objectStore('k'),q=m=='get'?o.get(k):m=='del'?o.delete(k):o.put(v,k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})};
/* fetch com limite de tempo, sem cookies e sem referer */
const tf=(u,ms=20000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);return fetch(u,{signal:c.signal,credentials:'omit',referrerPolicy:'no-referrer'}).finally(()=>clearTimeout(t))};
const okU=u=>{try{return /^https?:$/.test(new URL(u).protocol)}catch{return false}};
const sl=u=>/^https?:\/\//i.test(u)?u:'';
const uid=()=>[...crypto.getRandomValues(new Uint8Array(8))].map(b=>b.toString(16).padStart(2,'0')).join('');

/* ---------- Cofre: tudo que e sensivel (listas, logins, links, favoritos, progresso) fica CRIPTOGRAFADO (AES-GCM).
   A chave do cofre fica protegida pelo Android Keystore (hardware, quando o aparelho tem). ---------- */
const b64e=u=>btoa(String.fromCharCode(...u)),b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
/* Chamada nativa com limite de tempo: se o Android nao responder, nunca deixa o app esperando para sempre */
const tmo=(p,ms)=>Promise.race([Promise.resolve(p),new Promise((_,rj)=>setTimeout(()=>rj(new Error('timeout')),ms))]);
/* Modo do cofre fica fixo: asc_dm='n' (chave protegida pelo Android Keystore) ou 'w' (chave do WebView). */
let DKP;const dek=()=>DKP||(DKP=(async()=>{const N=plug('Secure');
 const web=async()=>{let k=await kv('get','dek');if(!k){k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await kv('put','dek',k)}return k};
 if(!(N&&nat())||LS.asc_dm=='w')return web();
 let raw,lost=false;
 if(LS.asc_dk){try{raw=b64d((await tmo(N.unwrap({data:LS.asc_dk}),6000)).data)}
  catch(e){if(e&&e.message=='timeout')throw e;lost=true}}   /* timeout: tenta de novo depois, sem apagar nada */
 if(!raw){/* primeira vez (ou chave do Keystore perdida): cria chave nova */
  try{const r=crypto.getRandomValues(new Uint8Array(32));LS.asc_dk=(await tmo(N.wrap({data:b64e(r)}),6000)).data;LS.asc_dm='n';raw=r}
  catch{if(lost)throw new Error('keystore');LS.removeItem('asc_dk');LS.asc_dm='w';return web()}}   /* Keystore ruim neste aparelho: usa o modo web */
 const k=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);raw.fill(0);return k})().catch(e=>{DKP=null;throw e}));
async function cEnc(str){const k=await dek(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,new TextEncoder().encode(str))),o=new Uint8Array(12+ct.length);o.set(iv);o.set(ct,12);return o.buffer}
async function cDec(buf){try{const k=await dek(),u=new Uint8Array(buf);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:u.slice(0,12)},k,u.slice(12)))}catch{return null}}
const vs=async(k,v)=>kv('put','v:'+k,await cEnc(JSON.stringify(v)));
const vg=async k=>{try{const b=await kv('get','v:'+k);if(!b)return null;const t=await cDec(b);return t==null?null:JSON.parse(t)}catch{return null}};
const plGet=async id=>{try{const b=await kv('get','pl:'+id);return b?await cDec(b):null}catch{return null}};
let LST={act:'',l:[]};const ST={pos:{},last:{}},PIN={on:false,h:'',s:'',f:0,u:0};
const CL=()=>LST.l.find(x=>x.id==LST.act)||{};
const saveL=()=>vs('lists',LST);
let sst=0;const stNow=()=>{clearTimeout(sst);return vs('state',{fav:S.fav,pos:ST.pos,last:ST.last})},saveState=()=>{clearTimeout(sst);sst=setTimeout(stNow,2000)};
async function loadVault(){const l=await vg('lists');if(l&&Array.isArray(l.l))LST=l;const s=await vg('state');if(s){S.fav=s.fav||[];ST.pos=s.pos||{};ST.last=s.last||{}}const p=await vg('pin');if(p)Object.assign(PIN,p)}
/* Dados de versoes antigas (texto puro) sao migrados para o cofre e apagados */
async function migrate(){let old;try{old=await kv('get','pl')}catch{}
 if(!LST.l.length&&old){const id=uid();LST.l.push({id,n:'Minha lista',m:LS.asc_xu?'x':LS.asc_url?'m':'f',u:LS.asc_url||'',epg:LS.asc_epg||'',tvg:LS.asc_tvg||'',exp:+LS.asc_exp||0,expm:LS.asc_expm||''});LST.act=id;await kv('put','pl:'+id,await cEnc(old));await saveL()}
 if(old!==undefined)await kv('del','pl');
 if(LS.asc_fav||LS.asc_pos||LS.asc_last){S.fav=jg('asc_fav',[]);ST.pos=jg('asc_pos',{});ST.last=jg('asc_last',{});await stNow()}
 ['asc_url','asc_epg','asc_tvg','asc_exp','asc_expm','asc_renew','asc_xs','asc_xu','asc_xp','asc_fav','asc_pos','asc_last'].forEach(k=>LS.removeItem(k))}
async function wipeAll(){try{const N=plug('Secure');N&&nat()&&await tmo(N.reset(),3000)}catch{}
 try{(await db()).close()}catch{}
 try{await new Promise(r=>{const q=indexedDB.deleteDatabase('asc');q.onsuccess=q.onerror=q.onblocked=()=>r()})}catch{}
 try{LS.clear();sessionStorage.clear()}catch{}
 location.reload()}
const toast=m=>{const t=document.createElement('div');t.id='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),4000)};
const show=id=>{window.__ascBooted=1;$('#boot').hidden=true;['setup','add','app'].forEach(x=>$('#'+x).hidden=x!=id)};
const bootErr=m=>{if(window.__ascBooted)return console.warn(m);$('#boot').hidden=false;$('#bm').textContent='Erro: '+m;window.__ascRecovery&&window.__ascRecovery()};
addEventListener('unhandledrejection',e=>bootErr((e.reason&&e.reason.message)||e.reason));
addEventListener('error',e=>{if(e.target===window)bootErr(e.message)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- M3U ---------- */
const nz=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const EP=/\bS\d{1,2}\s?E\d{1,3}\b|\bT\d{1,2}\s?E\d{1,3}\b|\b\d{1,2}x\d{2,3}\b|temporada/i;
const kind=i=>{const u=i.u.split('?')[0].toLowerCase(),g=i.g.toLowerCase();
 if(/\/series\//.test(u))return 'series';if(/\/movie\//.test(u))return 'movie';if(/\/live\//.test(u))return 'tv';
 if(/\.(mp4|mkv|avi|mov|wmv|flv|mpg|mpeg|webm)$/.test(u))return EP.test(i.n)||/s[eé]ries?|novelas?|animes?|doramas?|temporada/.test(g)?'series':'movie';
 if(/\.(m3u8|ts)$/.test(u)||/rtmp|rtsp/.test(u))return 'tv';
 if(/canais|canal|24\s?h|ao vivo|live|\btv\b|esporte|abertos|not[ií]cias/.test(g))return 'tv';
 if(EP.test(i.n)||/s[eé]ries?|novelas?|animes?|doramas?/.test(g))return 'series';
 if(/filmes?|movies?|\bvod\b|cine|lan[cç]amentos?/.test(g))return 'movie';return 'tv'};
const title=n=>n.replace(/\s*[-–]?\s*(S|T)\d{1,2}\s?E\d{1,3}.*$|\s*[-–]?\s*\d{1,2}x\d{2,3}.*$/i,'').trim()||n;
function parse(t){const out=[],tvg=(t.slice(0,2000).match(/(?:url-tvg|x-tvg-url)="([^",]+)/i)||[])[1];let cur=null;
 for(const raw of t.split(/\r?\n/)){const ln=raw.trim();
  if(ln.startsWith('#EXTINF')){const a=k=>(ln.match(new RegExp(k+'="([^"]*)"','i'))||[])[1]||'';cur={n:ln.slice(ln.lastIndexOf(',')+1).trim()||a('tvg-name'),l:sl(a('tvg-logo')),g:a('group-title')||'Outros',id:a('tvg-id'),p:a('tvg-plot')||a('plot')||a('tvg-description')||a('description')}}
  else if(cur&&/^(https?|rtmp|rtsp):/i.test(ln)){cur.u=ln;cur.t=kind(cur);cur.k=nz(cur.n);out.push(cur);cur=null}}
 return{out,tvg}}
async function useList(text,meta,cached){
 if(text.length>8e7){$('#st').textContent='Lista grande demais.';return false}
 const{out,tvg}=parse(text);if(!out.length){$('#st').textContent='Nenhum canal encontrado. Confira se é uma lista M3U válida.';return false}
 if(meta){const i=LST.l.findIndex(x=>x.id==meta.id);if(i<0)LST.l.push(meta);else Object.assign(LST.l[i],meta);LST.act=meta.id}
 const l=CL();l.tvg=tvg||'';
 if(!cached)await kv('put','pl:'+l.id,await cEnc(text));
 await saveL();
 S.items=out;S._sg=null;S.cat='Todos';S.tab='home';S.epg={};S.al={};XS=null;show('app');nav();render();
 const e=epgUrl();if(e)loadEPG(e);acct();expSync();return true}

/* ---------- EPG (XMLTV) ---------- */
const dec=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'");
const ms=(d,z)=>{const o=z?(z[0]=='-'?-1:1)*(+z.slice(1,3)*60+ +z.slice(3,5))*6e4:0;return Date.UTC(+d.slice(0,4),+d.slice(4,6)-1,+d.slice(6,8),+d.slice(8,10),+d.slice(10,12),+d.slice(12,14))-o};
const nk=s=>nz(s).replace(/\b(fhd|uhd|hd|sd|4k|h265|hevc)\b/g,'').replace(/[^a-z0-9]/g,'');
/* Guia: link informado > xmltv.php do servidor (login/senha) > url-tvg da lista */
const xepg=()=>{try{const b=new URL(CL().u||''),u=b.searchParams.get('username'),p=b.searchParams.get('password');if(u&&p)return`${b.origin}/xmltv.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`}catch{}};
const epgUrl=()=>CL().epg||xepg()||CL().tvg||'';
async function loadEPG(url){try{const r=await tf(url,6e4);if(!r.ok)throw 0;let t;
  if(/\.gz(\?|$)/i.test(url)&&window.DecompressionStream)t=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text();else t=await r.text();
  const now=Date.now(),lim=now+12*36e5,E={},A={};
  for(const m of t.matchAll(/<channel\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/g)){const id=dec(m[1]).toLowerCase();A[id]=id;
   for(const n of m[2].matchAll(/<display-name[^>]*>([^<]+)/g)){const d=dec(n[1]).trim();A[d.toLowerCase()]=id;A[nk(d)]=id}}
  for(const m of t.matchAll(/<programme\s([^>]*)>([\s\S]*?)<\/programme>/g)){const a=m[1],
   st=a.match(/start="(\d{14})\s?([+-]\d{4})?"/),sp=a.match(/stop="(\d{14})\s?([+-]\d{4})?"/),ch=a.match(/channel="([^"]*)"/),
   ti=m[2].match(/<title[^>]*>\s*(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))/);
   if(!st||!sp||!ch||!ti)continue;const s=ms(st[1],st[2]),e=ms(sp[1],sp[2]);if(e<now||s>lim)continue;
   (E[dec(ch[1]).toLowerCase()]||=[]).push({s,e,t:dec(ti[1]!=null?ti[1]:ti[2]||'').trim()})}
  for(const k in E)E[k].sort((a,b)=>a.s-b.s);
  S.epg=E;S.al=A;fillNow();if(!P.hidden&&cur&&live())epgBar();
  toast(Object.keys(E).length?'Guia de programação carregado':'O guia veio vazio ou fora do horário.')}
 catch{toast('Não foi possível carregar o guia de programação (bloqueio do servidor ou link inválido).')}}
function epgOf(it){const l=S.epg[(it.id||'').toLowerCase()]||S.epg[S.al[it.n.toLowerCase()]]||S.epg[S.al[nk(it.n)]];if(!l)return null;const n=Date.now();
 const i=l.findIndex(p=>p.s<=n&&n<p.e);return i<0?null:{p:l[i],nx:l[i+1]}}
const hm=t=>new Date(t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
function fillNow(){document.querySelectorAll('.card.tv .now').forEach(el=>{const it=itemOf(el.parentNode),x=it&&epgOf(it);el.textContent=x?x.p.t:''})}

/* ---------- Lista ---------- */
function grp(a){const m=new Map();for(const i of a){const k=title(i.n);if(!m.has(k))m.set(k,{n:k,l:i.l,g:i.g,t:'series',eps:[]});m.get(k).eps.push(i)}return[...m.values()]}
function view(){const q=nz(S.q.trim());
 if(S.tab=='home'){if(!q)return[];const r=S.items.filter(i=>i.k.includes(q));return[...r.filter(i=>i.t!='series'),...grp(r.filter(i=>i.t=='series'))]}
 if(S.tab=='fav'){let f=[...S.items.filter(i=>i.t!='series'&&S.fav.includes(i.u)),...sgrp().filter(g=>S.fav.includes('S:'+g.n))];if(q)f=f.filter(i=>nz(i.n).includes(q));return f}
 let a=S.items.filter(i=>i.t==S.tab);
 if(q)a=a.filter(i=>i.k.includes(q));else if(S.cat!='Todos'&&S.tab!='fav')a=a.filter(i=>i.g==S.cat);
 if(S.tab=='series')a=grp(a);return a}
const card=(i,k,r)=>`<div class="card ${i.t=='tv'?'tv':''}" tabindex="0" data-i="${k}"${r?` data-r="${r}"`:''}><div class="im"><span class="pi">${esc(i.n[0]||'?')}</span>${i.l?`<img loading="lazy" decoding="async" src="${esc(i.l)}">`:''}</div><b>${esc(i.n)}</b>${i.t=='tv'?'<small class="now"></small>':''}</div>`;
const itemOf=c=>c.dataset.r?(S.rails[c.dataset.r]||[])[c.dataset.i]:S.view[c.dataset.i];
function nav(){document.querySelectorAll('nav [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==S.tab));
 const dd=S.tab=='tv'||S.tab=='movie'||S.tab=='series';$('#catb').hidden=!dd;$('#cl').textContent=S.cat=='Todos'?'Todas as categorias':S.cat}
function render(){S.view=view();S.pos=0;G.innerHTML='';$('#main').scrollTop=0;
 const ih=S.tab=='home'&&!S.q.trim();G.hidden=ih;$('#main').classList.toggle('hm',ih);$('#home').hidden=!ih;if(ih)return home();
 if(!S.view.length)G.innerHTML='<div class="empty">Nada por aqui ainda.</div>';else more()}
function more(){if(S.pos>=S.view.length)return;const e=Math.min(S.pos+60,S.view.length);let h='';for(let k=S.pos;k<e;k++)h+=card(S.view[k],k);S.pos=e;G.insertAdjacentHTML('beforeend',h);fillNow()}
new IntersectionObserver(e=>e[0].isIntersecting&&more(),{rootMargin:'600px'}).observe($('#more'));

/* ---------- Início: favoritos, ao vivo, filmes e séries ---------- */
const sgrp=()=>S._sg||(S._sg=grp(S.items.filter(i=>i.t=='series')));
function ccNames(){const g=[...new Set(S.items.filter(i=>i.t=='tv').map(i=>i.g))],sel=LS.asc_cc;
 if(sel&&sel!='auto'&&g.includes(sel))return[sel];
 let m=g.filter(x=>/cliente/i.test(x));if(!m.length)m=g.filter(x=>/jogos?\b|jogo do dia|eventos?|ppv|futebol/i.test(x));return m}
const clientCh=()=>{const n=ccNames();return S.items.filter(i=>i.t=='tv'&&n.includes(i.g)).slice(0,80)};
const favItems=()=>({tv:S.items.filter(i=>i.t=='tv'&&S.fav.includes(i.u)),movie:S.items.filter(i=>i.t=='movie'&&S.fav.includes(i.u)),series:sgrp().filter(g=>S.fav.includes('S:'+g.n))});
const vmCard=go=>`<div class="card vm" tabindex="0" data-go="${go}"><svg class="i" style="transform:rotate(-90deg)"><use href="#chev"/></svg>Ver mais</div>`;
const rail=(id,l,go)=>`<div class="rail">${l.map((x,k)=>card(x,k,id)).join('')}${go?vmCard(go):''}</div>`;
function home(){const t=S.items.filter(i=>i.t=='tv'),c=clientCh().slice(0,10),lv=[...c,...t.filter(x=>!c.includes(x))].slice(0,10),
 mv=S.items.filter(i=>i.t=='movie'),sg=sgrp(),F=favItems(),
 ft=[['tv','Canais'],['movie','Filmes'],['series','Séries']].filter(([k])=>F[k].length);
 S.rails={tv:lv,movie:mv.slice(0,10),series:sg.slice(0,10)};ft.forEach(([k])=>S.rails['f'+k]=F[k]);
 let h=ft.length?`<section class="sec"><div class="sx"><h2>Favoritos</h2><button class="chip" data-go="fav">Ver tudo ›</button></div>`+ft.map(([k,n])=>`<div class="sub"><small>${n}</small>${rail('f'+k,F[k])}</div>`).join('')+'</section>'
  :'<section><div class="sx"><h2>Favoritos</h2></div></section>';
 h+=[['tv','Ao vivo',lv,t.length],['movie','Filmes',S.rails.movie,mv.length],['series','Séries',S.rails.series,sg.length]]
  .map(([k,n,l,tot])=>l.length?`<section class="sec"><div class="sx"><h2>${n}</h2><button class="chip" data-go="${k}">Ver mais ›</button></div>${rail(k,l,tot>l.length?k:'')}</section>`:'').join('');
 $('#home').innerHTML=h;fillNow()}
function pickCC(){const g=[...new Set(S.items.filter(i=>i.t=='tv').map(i=>i.g))];
 sh('<b>Categoria do Canal do cliente</b><button class="btn" data-g="auto">Automático</button>'+g.map(x=>`<button class="btn" data-g="${esc(x)}">${esc(x)}</button>`).join(''));
 $('#sh').onclick=e=>{const b=e.target.closest('[data-g]');if(b){LS.asc_cc=b.dataset.g;$('#sheet').hidden=true;refresh()}}}
const refresh=()=>{if(S.tab=='home'&&!S.q.trim())home();else if(S.tab=='fav')render()};
const H=$('#home');
H.onclick=e=>{const g=e.target.closest('[data-go]');if(g){S.tab=g.dataset.go;S.cat=g.dataset.cat||'Todos';nav();render();return}
 if(e.target.closest('#pickcc'))return pickCC();
 const c=e.target.closest('.card');if(c){const l=S.rails[c.dataset.r]||[];openIt(l[c.dataset.i],l)}};
H.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.classList.contains('card'))e.target.click()});

document.querySelectorAll('nav [data-t]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;S.cat='Todos';nav();render()});
let qt;$('#q').oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{S.q=e.target.value;render()},250)};
const openIt=(it,l)=>it&&(it.eps?eps(it):it.t=='tv'?play(it,l.filter(x=>x.t=='tv')):info(it));
G.onclick=e=>{const c=e.target.closest('.card');if(c)openIt(S.view[c.dataset.i],S.view)};
G.addEventListener('keydown',e=>{if(e.key=='Enter'&&e.target.classList.contains('card'))e.target.click()});

/* EPG ao passar o mouse / focar (TV) */
const tip=$('#tip');
function tipOn(e){const c=e.target.closest&&e.target.closest('.card.tv');if(!c)return;const it=itemOf(c);if(!it)return;const x=epgOf(it);
 tip.innerHTML=`<b>${esc(it.n)}</b>`+(x?`<div>${esc(x.p.t)}</div><div class="bar"><i style="width:${Math.min(100,(Date.now()-x.p.s)/(x.p.e-x.p.s)*100)}%"></i></div><small>${hm(x.p.s)} – ${hm(x.p.e)}</small>${x.nx?`<div style="color:#a39a9d;margin-top:.4em">A seguir: ${esc(x.nx.t)} (${hm(x.nx.s)})</div>`:''}`:'<div style="color:#a39a9d">Programação indisponível</div>');
 const r=c.getBoundingClientRect();tip.hidden=false;tip.style.left=Math.max(8,Math.min(innerWidth-tip.offsetWidth-8,r.left))+'px';
 tip.style.top=(r.bottom+tip.offsetHeight+8>innerHeight?Math.max(8,r.top-tip.offsetHeight-8):r.bottom+8)+'px'}
const MN=$('#main');MN.addEventListener('pointerover',e=>e.pointerType=='mouse'&&tipOn(e));MN.addEventListener('focusin',tipOn);
MN.addEventListener('pointerout',()=>tip.hidden=true);MN.addEventListener('focusout',()=>tip.hidden=true);

/* ---------- Sheets ---------- */
const sh=h=>{$('#sh').onclick=null;$('#sh').innerHTML=h;$('#sheet').hidden=false;const f=$('#sh button');f&&f.focus()};
$('#sheet').onclick=e=>{if(e.target.id=='sheet')$('#sheet').hidden=true};
const fav=u=>{const i=S.fav.indexOf(u);i<0?S.fav.push(u):S.fav.splice(i,1);saveState();return i<0};
const xapi=()=>{try{const b=new URL(CL().u||''),u=b.searchParams.get('username'),p=b.searchParams.get('password');if(u&&p)return`${b.origin}/player_api.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`}catch{}};
let XS;const gs=()=>XS=XS||tf(xapi()+'&action=get_series',6e4).then(r=>r.json()).then(l=>{const m=new Map();for(const x of l)m.set(nz(title(x.name||'')),x);return m}).catch(e=>{XS=null;throw e});
async function meta(it,isS){const A=xapi();if(!A)return;
 try{if(!isS){const id=(it.u.match(/\/movie\/[^/]+\/[^/]+\/(\d+)/)||[])[1];if(!id)return;const i=(await(await tf(A+'&action=get_vod_info&vod_id='+id)).json()).info||{};
   return{p:i.plot||i.description,m:[i.genre,(i.releasedate||'').slice(0,4),i.duration,i.rating&&'★ '+i.rating].filter(Boolean).join(' • ')}}
  const x=(await gs()).get(nz(it.n));return x&&{p:x.plot,m:[x.genre,(x.releaseDate||x.release_date||'').slice(0,4),x.rating&&'★ '+x.rating].filter(Boolean).join(' • ')}}catch{}}
const hdr=it=>`<div class="dt">${it.l?`<img src="${esc(it.l)}">`:''}<div><b>${esc(it.n)}</b><small style="display:block;color:#a39a9d">${esc(it.g)}</small><small id="my" style="color:#a39a9d"></small><p class="sy" id="sy">${esc(it.p||'Sem sinopse disponível.')}</p></div></div>`;
async function fillMeta(it,s){const x=await meta(it,s);if(x&&$('#sy')){if(x.p)$('#sy').textContent=x.p;if(x.m)$('#my').textContent=x.m}}
/* progresso: asc_pos[u]={t,d,done}; asc_last[serie]=url do ultimo episodio visto */
const favK=it=>it.t=='series'?'S:'+(it.eps?it.n:title(it.n)):it.u;
const prog=u=>{const p=ST.pos[u];return typeof p=='number'?{t:p,d:0}:p||null};
const fin=p=>!!p&&p.d>0&&p.t/p.d>=.92;
const isPart=u=>{const p=prog(u);return !!p&&p.t>10&&!fin(p)};
const isDone=u=>{const p=prog(u);return !!p&&(!!p.done||fin(p))};
const epn=e=>{const m=e.n.match(/[ST]\d{1,2}\s?E(\d{1,3})/i)||e.n.match(/\d{1,2}x(\d{2,3})/);return m?+m[1]:0};
const seas=e=>+((e.n.match(/[ST](\d{1,2})\s?E/i)||e.n.match(/(\d{1,2})x\d/)||[])[1]||1);
function resume(it,list){const p=prog(it.u);if(!isPart(it.u))return play(it,list,0);
 sh(`<b>${esc(it.n)}</b><button class="btn p" id="r1">Continuar de ${fmt(p.t)}</button><button class="btn" id="r2">Assistir do começo</button>`);
 $('#r1').onclick=()=>{$('#sheet').hidden=true;play(it,list,p.t)};$('#r2').onclick=()=>{$('#sheet').hidden=true;play(it,list,0)}}
function info(it){const p=prog(it.u),rs=isPart(it.u),k=favK(it);
 sh(hdr(it)+(rs?`<button class="btn p" id="i1">Continuar de ${fmt(p.t)}</button><button class="btn" id="i3">Assistir do começo</button>`:`<button class="btn p" id="i1">Assistir</button>`)+`<button class="btn" id="i2">${S.fav.includes(k)?'Remover dos favoritos':'Adicionar aos favoritos'}</button>`);
 $('#i1').onclick=()=>{$('#sheet').hidden=true;play(it,[it],rs?p.t:0)};
 if(rs)$('#i3').onclick=()=>{$('#sheet').hidden=true;play(it,[it],0)};
 $('#i2').onclick=()=>{fav(k);$('#sheet').hidden=true;refresh()};fillMeta(it,0)}
function eps(s){const m={};for(const e of s.eps)(m[seas(e)]||=[]).push(e);
 const ks=Object.keys(m).map(Number).sort((a,b)=>a-b);ks.forEach(k=>m[k].sort((a,b)=>epn(a)-epn(b)));
 const flat=ks.flatMap(k=>m[k]),L=ST.last[s.n];let t=L&&flat.find(e=>e.u==L),nx=null;
 if(t&&isDone(t.u)&&!isPart(t.u)){const j=flat.indexOf(t)+1;if(flat[j]){t=flat[j];nx=t}}
 let cs=t?seas(t):ks[0];const fk=favK(s);
 sh(hdr(s)+`<div class="sbar"><button class="btn" id="sb"><span id="sbt"></span><svg class="i" style="width:1.1em;height:1.1em"><use href="#chev"/></svg></button><button class="btn fv${S.fav.includes(fk)?' on':''}" id="sf"><svg class="i"><use href="#star"/></svg></button></div><div class="sg" id="sl" hidden>${ks.map(k=>`<button class="btn" data-s="${k}">Temporada ${k}</button>`).join('')}</div><div class="eg" id="eg"></div><div class="lg"><span><i style="background:#f5c518"></i>Assistido</span><span><i style="background:#22c55e"></i>Parei aqui</span></div>`);
 const draw=()=>{$('#sbt').textContent='Temporada '+cs;$('#sl').hidden=true;$('#eg').innerHTML=m[cs].map((e,i)=>{const c=isPart(e.u)?'pg':isDone(e.u)?'dn':nx&&e===nx?'nx':'';return`<button class="ep ${c}" data-u="${esc(e.u)}" title="${esc(e.n)}">${epn(e)||i+1}</button>`}).join('')};draw();
 $('#sh').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id=='sb')$('#sl').hidden=!$('#sl').hidden;
  else if(b.id=='sf'){b.classList.toggle('on',fav(fk));refresh()}
  else if(b.dataset.s){cs=+b.dataset.s;draw()}
  else if(b.dataset.u){$('#sheet').hidden=true;resume(flat.find(x=>x.u==b.dataset.u),flat)}};fillMeta(s,1)}
$('#catb').onclick=()=>{const m=new Map();for(const i of S.items)if(i.t==S.tab){let z=m.get(i.g);if(!z)m.set(i.g,z=new Set());z.add(S.tab=='series'?title(i.n):i.u)}
 sh('<b>Categorias</b><button class="btn" data-c="Todos">Todas as categorias</button>'+[...m].map(([g,z])=>`<button class="btn" data-c="${esc(g)}"><span>${esc(g)}</span><small style="margin-left:auto;color:#a39a9d">${z.size}</small></button>`).join(''));
 $('#sh').onclick=e=>{const b=e.target.closest('[data-c]');if(b){S.cat=b.dataset.c;$('#sheet').hidden=true;nav();render()}}};
$('#cfg').onclick=()=>{sh(`<b>Ajustes</b><small id="av" style="color:#a39a9d"></small><button class="btn" id="a1">Gerenciar listas</button><button class="btn" id="a2">Trocar dispositivo (${S.dev=='tv'?'TV':'Celular'})</button><button class="btn" id="a3">Atualizar EPG</button><button class="btn" id="a5">Categoria do Canal do cliente</button><button class="btn" id="a6">Vencimento</button><button class="btn" id="a8">Bloqueio por PIN (${PIN.on?'ativo':'desativado'})</button><button class="btn" id="a7">Verificar atualização</button><button class="btn" id="a4">Limpar favoritos e progresso</button><button class="btn" id="a9">Apagar todos os dados</button>`);
 $('#a1').onclick=lists;$('#a2').onclick=()=>{$('#sheet').hidden=true;show('setup')};
 $('#a3').onclick=()=>{$('#sheet').hidden=true;const e=epgUrl();e?loadEPG(e):toast('Sem guia disponível. Entre com servidor e login ou informe um link de EPG.')};
 ver().then(v=>{if(v&&$('#av'))$('#av').textContent='Versão '+v.name});
 $('#a6').onclick=expSheet;$('#a7').onclick=()=>{$('#sheet').hidden=true;checkUpd(true)};$('#a8').onclick=pinSheet;
 $('#a5').onclick=pickCC;$('#a4').onclick=()=>{S.fav=[];ST.pos={};ST.last={};saveState();$('#sheet').hidden=true;render()};
 $('#a9').onclick=e=>{const b=e.currentTarget;if(b.dataset.c)wipeAll();else{b.dataset.c=1;b.textContent='Toque de novo para apagar tudo'}}};

/* ---------- Gerenciar listas ---------- */
let SS=0;const KN={x:'Servidor e login',m:'Link M3U',f:'Arquivo / texto'};
function lists(){SS=1;
 sh('<b>Gerenciar listas</b>'+(LST.l.length?'':'<small style="color:#a39a9d">Nenhuma lista cadastrada.</small>')+LST.l.map(x=>`<button class="btn${x.id==LST.act?' p':''}" data-l="${esc(x.id)}"><span>${esc(x.n)}</span><small style="margin-left:auto">${x.id==LST.act?'Em uso':esc(KN[x.m]||'')}</small></button>`).join('')+'<button class="btn" id="la">+ Adicionar lista</button>');
 $('#sh').onclick=e=>{if(e.target.closest('#la')){$('#sheet').hidden=true;show('add');return}const b=e.target.closest('[data-l]');b&&listOpts(b.dataset.l)}}
function listOpts(id){const x=LST.l.find(y=>y.id==id);if(!x)return;SS=1;
 sh(`<b>${esc(x.n)}</b><small style="color:#a39a9d">${esc(KN[x.m]||'')}</small>`+(x.id==LST.act?'':'<button class="btn p" id="o1">Usar esta lista</button>')+(x.u?'<button class="btn" id="o2">Atualizar lista</button>':'')+`<input id="rn" value="${esc(x.n)}" maxlength="40" aria-label="Nome da lista"><button class="btn" id="o4">Salvar nome</button><button class="btn" id="o3">Excluir</button><button class="btn" id="o5">Voltar</button>`);
 $('#sh').onclick=async e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id=='o1'){$('#sheet').hidden=true;useSaved(id)}
  else if(b.id=='o2'){$('#sheet').hidden=true;toast('Atualizando…');try{const r=await tf(x.u,6e4);if(!r.ok)throw 0;if(await useList(await r.text(),{id}))toast('Lista atualizada.')}catch{toast('Não consegui atualizar a lista.')}}
  else if(b.id=='o4'){x.n=$('#rn').value.trim().slice(0,40)||x.n;await saveL();lists()}
  else if(b.id=='o3'){if(b.dataset.c)delList(id);else{b.dataset.c=1;b.textContent='Toque de novo para excluir'}}
  else if(b.id=='o5')lists()}}
async function useSaved(id){LST.act=id;await saveL();const t=await plGet(id);if(t)await useList(t,null,1);else{S.items=[];show('add');toast('Essa lista está sem dados. Adicione de novo.')}}
async function delList(id){const was=LST.act==id;LST.l=LST.l.filter(y=>y.id!=id);kv('del','pl:'+id).catch(()=>{});if(was)LST.act=LST.l[0]?LST.l[0].id:'';await saveL();
 if(!was)return lists();$('#sheet').hidden=true;if(LST.act)useSaved(LST.act);else{S.items=[];S._sg=null;show('add')}}

/* ---------- Orientação / tela cheia ---------- */
const CP=(window.Capacitor&&Capacitor.Plugins)||{};
let IM=CP.Immersive;try{if(!IM&&window.Capacitor&&Capacitor.registerPlugin)IM=Capacitor.registerPlugin('Immersive')}catch{}
const ori2=o=>{try{if(CP.ScreenOrientation)CP.ScreenOrientation.lock({orientation:o}).catch(()=>{});else if(screen.orientation&&screen.orientation.lock){const q=screen.orientation.lock(o);q&&q.catch&&q.catch(()=>{})}}catch{}};
const ori=o=>{if(!IM)return ori2(o);try{Promise.resolve(IM.orientation({mode:o})).catch(()=>ori2(o))}catch{ori2(o)}};
const fs=h=>{try{if(h){const e=document.documentElement;e.requestFullscreen&&e.requestFullscreen().catch(()=>{})}else if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch{}};
const bars=h=>{if(!IM){try{if(CP.StatusBar)h?CP.StatusBar.hide():CP.StatusBar.show()}catch{}return fs(h)}try{Promise.resolve(IM.set({on:h})).catch(()=>{})}catch{}};
/* ---------- Player ---------- */
let hls,cur,zap=[],ht,dr=0,lt=0;const P=$('#player'),sk=$('#sk');
const fmt=t=>{if(!isFinite(t))return'0:00';t=Math.floor(t);const h=Math.floor(t/3600),m=Math.floor(t%3600/60),q=String(t%60).padStart(2,'0');return h?`${h}:${String(m).padStart(2,'0')}:${q}`:`${m}:${q}`};
const ic=(id,n)=>$(id).querySelector('use').setAttribute('href','#'+n);
const live=()=>cur&&cur.t=='tv',spin=on=>$('#sp').hidden=!on;
function ui(){P.classList.remove('h');clearTimeout(ht);ht=setTimeout(()=>!V.paused&&!dr&&P.classList.add('h'),3500)}
function epgBar(){const E=$('#epg'),lv=live(),x=lv?epgOf(cur):null;$('#pe').textContent=cur.g||'';E.hidden=!lv;if(!lv)return;
 E.innerHTML=x?`<div class="n">Agora: ${esc(x.p.t)} <span style="font-weight:400">• ${hm(x.p.s)}–${hm(x.p.e)}</span></div><div class="bar"><i style="width:${Math.min(100,Math.max(0,(Date.now()-x.p.s)/(x.p.e-x.p.s)*100))}%"></i></div>`+(x.nx?`<div class="x">A seguir: ${esc(x.nx.t)} • ${hm(x.nx.s)}</div>`:''):'<div class="x">Programação indisponível</div>'}
function saveP(done){if(!cur||live())return;const d=V.duration||0,t=V.currentTime;if(!isFinite(d)||!d)return;const p=ST.pos,o=p[cur.u];p[cur.u]={t,d,done:!!(done||t/d>=.92||(o&&typeof o=='object'&&o.done))};saveState()}
/* Buffer sob medida: abre rápido (começa no 1º trecho) e guarda ~20-30s à frente para não travar */
const HC=lv=>({enableWorker:true,lowLatencyMode:false,startFragPrefetch:true,
 maxBufferLength:lv?20:30,maxMaxBufferLength:lv?40:60,maxBufferSize:60e6,backBufferLength:lv?10:30,
 liveSyncDurationCount:lv?4:3,liveMaxLatencyDurationCount:lv?12:Infinity,maxBufferHole:.6,nudgeMaxRetry:8,
 manifestLoadingMaxRetry:6,manifestLoadingRetryDelay:700,levelLoadingMaxRetry:6,levelLoadingRetryDelay:700,
 fragLoadingMaxRetry:8,fragLoadingRetryDelay:500,fragLoadingMaxRetryTimeout:8000,
 abrEwmaDefaultEstimate:2e6,abrBandWidthFactor:.8,abrBandWidthUpFactor:.6});
let HLP,gen=0,wd=null,lastT=-1,stuck=0,rc=0,started=false,UP=false;
const HL=()=>window.Hls?Promise.resolve():(HLP=HLP||new Promise(r=>{const s=document.createElement('script');s.src='hls.min.js';s.onload=s.onerror=()=>r();document.head.append(s)}));
function src(u,at){const g=++gen;if(hls){hls.destroy();hls=null}UP=false;
 const nativ=()=>{V.src=u;if(at>0)V.addEventListener('loadedmetadata',()=>{try{V.currentTime=at}catch{}},{once:true});V.play().catch(()=>{})};
 HL().then(()=>{if(g!=gen)return;
  if(window.Hls&&Hls.isSupported()&&!/\.(mp4|mkv|avi|mov)(\?|$)/i.test(u)){
   const h=hls=new Hls(Object.assign(HC(live()),at>0?{startPosition:at}:{}));h.loadSource(u);h.attachMedia(V);
   h.on(Hls.Events.MANIFEST_PARSED,()=>V.play().catch(()=>{}));
   h.on(Hls.Events.ERROR,(_,d)=>{if(!d.fatal||h!=hls)return;
    if(d.details=='manifestParsingError'){h.destroy();hls=null;nativ();return}
    spin(true);
    if(d.type=='mediaError')h.recoverMediaError();
    else setTimeout(()=>{if(h==hls&&!P.hidden)h.startLoad(-1)},1500)})
  }else nativ()})}
/* Vigia: se a imagem parar, a bolinha fica girando e o app tenta voltar sozinho (ao vivo: sem desistir) */
function wdOn(){wdOff();lastT=-1;stuck=0;rc=0;started=false;wd=setInterval(tick,1000)}
function wdOff(){clearInterval(wd);wd=null}
function tick(){if(P.hidden||!cur)return;if(UP&&V.paused)return;
 if(V.paused)V.play().catch(()=>{});
 const t=V.currentTime,adv=Math.abs(t-lastT)>.25;lastT=t;
 if(V.seeking||dr){stuck=0;return}
 if(adv&&V.readyState>=2){started=true;stuck=0;rc=0;spin(false);return}
 stuck++;if(stuck>=2)spin(true);
 for(let i=0;i<V.buffered.length;i++){const s=V.buffered.start(i);if(s>t&&s-t<3){try{V.currentTime=s+.05}catch{}break}}
 if(stuck>=(started?(live()?4:6):12))recover()}
function recover(){if(P.hidden||!cur)return;stuck=0;const n=++rc;
 if(!live()&&n>6){wdOff();gen++;if(hls){hls.destroy();hls=null}spin(false);toast('Não foi possível reproduzir. O servidor pode estar fora do ar ou o formato não é compatível.');return}
 spin(true);
 if(hls&&n%3){if(n%3==1)hls.startLoad(-1);else hls.recoverMediaError();V.play().catch(()=>{});return}
 src(cur.u,live()?0:V.currentTime)}
addEventListener('online',()=>{if(!P.hidden&&cur){rc=0;recover()}});
function play(it,list,from){cur=it;zap=list&&list.length?list:[it];ori('landscape');bars(true);if(P.hidden)history.pushState({p:1},'');P.hidden=false;const tv=live();
 $('#pt').textContent=it.n;ic('#pv',tv?'sprev':'rw10');ic('#nx',tv?'snext':'fw10');ic('#pp','pause');$('#lv').hidden=!tv;UP=false;$('#sk').hidden=tv;$('#tm').hidden=tv;
 $('#pr').style.width=$('#bf').style.width='0';$('#th').style.left='0';$('#t1').textContent=$('#t2').textContent='0:00';
 $('#pf').classList.toggle('on',S.fav.includes(favK(it)));spin(true);src(it.u);wdOn();epgBar();ui();
 if(it.t=='series'){ST.last[title(it.n)]=it.u;saveState()}
 if(from>0&&!tv)V.addEventListener('loadedmetadata',()=>V.currentTime=from,{once:true});
 if(document.activeElement)document.activeElement.blur()}
const step=d=>{if(live()){const i=(zap.indexOf(cur)+d+zap.length)%zap.length;play(zap[i],zap)}else V.currentTime=Math.max(0,Math.min(V.duration||1e9,V.currentTime+10*d))};
const tog=()=>V.paused?(UP=false,V.play().catch(()=>{})):(UP=true,V.pause());
$('#pv').onclick=()=>step(-1);$('#nx').onclick=()=>step(1);$('#pp').onclick=tog;
$('#pf').onclick=()=>$('#pf').classList.toggle('on',fav(favK(cur)));
V.onplay=()=>{UP=false;ic('#pp','pause')};V.onpause=()=>{UP=true;ic('#pp','play');ui()};
V.onloadstart=V.onwaiting=()=>spin(true);V.onplaying=V.oncanplay=()=>spin(false);
V.onended=()=>{if(!live()){saveP(1);const i=zap.indexOf(cur);if(zap[i+1])play(zap[i+1],zap)}};
V.onerror=()=>{if(P.hidden||!cur)return;spin(true);setTimeout(()=>{if(!P.hidden&&cur)recover()},1500)};
V.onprogress=()=>{if(V.duration&&V.buffered.length)$('#bf').style.width=V.buffered.end(V.buffered.length-1)/V.duration*100+'%'};
let sv=0;V.ontimeupdate=()=>{if(!cur||live())return;const d=V.duration||0,t=V.currentTime;
 if(!dr){$('#pr').style.width=$('#th').style.left=d?t/d*100+'%':'0';$('#t1').textContent=fmt(t)}$('#t2').textContent=fmt(d);
 if(Date.now()-sv>5e3){sv=Date.now();saveP()}};
const seekTo=e=>{const r=sk.getBoundingClientRect(),f=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));$('#pr').style.width=$('#th').style.left=f*100+'%';$('#t1').textContent=fmt(f*(V.duration||0));return f};
sk.onpointerdown=e=>{dr=1;sk.setPointerCapture(e.pointerId);seekTo(e);ui()};
sk.onpointermove=e=>{if(dr){seekTo(e);ui()}};
sk.onpointerup=e=>{if(dr){const f=seekTo(e);dr=0;if(V.duration)V.currentTime=f*V.duration;ui()}};
const close=pop=>{saveP();wdOff();gen++;ori(S.dev=='tv'?'landscape':'portrait');bars(false);if(hls){hls.destroy();hls=null}UP=true;V.pause();V.removeAttribute('src');V.load();P.hidden=true;spin(false);if(S.tab=='fav'||S.tab=='home')render();if(pop!==1&&history.state&&history.state.p)history.back()};
$('#bk').onclick=()=>close();
setInterval(()=>{if(!P.hidden&&cur&&live())epgBar()},3e4);
addEventListener('popstate',()=>{if(!P.hidden)close(1)});
const fitSet=m=>{V.style.objectFit=m;$('#fit').classList.toggle('on',m=='cover');LS.asc_fit=m};
$('#fit').onclick=()=>fitSet(V.style.objectFit=='cover'?'contain':'cover');fitSet(LS.asc_fit=='cover'?'cover':'contain');
P.addEventListener('pointerdown',e=>{if(e.target.closest('button,#sk'))return ui();const n=Date.now(),x=e.clientX/innerWidth;
 if(!live()&&n-lt<300&&(x<.35||x>.65)){step(x<.5?-1:1);ui();lt=0;return}lt=n;P.classList.contains('h')?ui():P.classList.add('h')});

/* ---------- Controle remoto (D-pad) ---------- */
const BACK=['Escape','Backspace','GoBack','BrowserBack'];
addEventListener('keydown',e=>{const k=e.key;
 if(!LK.hidden){if(/^\d$/.test(k)){e.preventDefault();pinKey(k)}else if(k=='Backspace'){e.preventDefault();pinKey('x')}else if(S.dev=='tv'&&k.startsWith('Arrow'))nvg(e,LK);return}
 if(!P.hidden){const hid=P.classList.contains('h'),onb=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#player button');ui();
  if(BACK.includes(k)||e.keyCode==4){e.preventDefault();return close()}
  if(k==' '||k=='MediaPlayPause'){e.preventDefault();return tog()}
  if(k=='ChannelUp'||k=='PageUp'){if(live())step(1);return}if(k=='ChannelDown'||k=='PageDown'){if(live())step(-1);return}
  if(S.dev=='tv'&&k.startsWith('Arrow')){e.preventDefault();
   if(hid){if(live()&&(k=='ArrowUp'||k=='ArrowDown'))step(k=='ArrowUp'?1:-1);else if(!live()&&(k=='ArrowLeft'||k=='ArrowRight'))step(k=='ArrowRight'?1:-1)}else nvg(e,P)}
  else if(k=='Enter'&&!onb){e.preventDefault();tog()}
  return}
 if(!$('#sheet').hidden&&BACK.includes(k)){$('#sheet').hidden=true;return}
 if(S.dev=='tv'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k))nvg(e,$('#sheet').hidden?document.body:$('#sheet'))});
function nvg(e,root){if(e.target.tagName=='INPUT'&&['ArrowLeft','ArrowRight'].includes(e.key)&&e.target.value)return;
 const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key],a=document.activeElement,
 ls=[...root.querySelectorAll('button,input,textarea,.card,label[tabindex]')].filter(x=>x.offsetParent&&!x.closest('[hidden]')&&(root!==document.body||!x.closest('#player,#sheet')));
 if(!a||!ls.includes(a)){e.preventDefault();return ls[0]&&ls[0].focus()}
 const r=a.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best,bs=1e9;
 for(const x of ls){if(x===a)continue;const q=x.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy,pr=dx*d[0]+dy*d[1];if(pr<=1)continue;const pp=Math.abs(dx*d[1])+Math.abs(dy*d[0]),s=pr+pp*2.5;if(s<bs){bs=s;best=x}}
 e.preventDefault();if(best){best.focus();best.scrollIntoView({block:'nearest',inline:'nearest'})}}

/* ---------- Atualização, vencimento e lembretes ---------- */
const REPO=(document.querySelector('meta[name=asc-repo]')||{}).content||'',UPD=!REPO||REPO.startsWith('__')?'':`https://github.com/${REPO}/releases/latest/download/version.json`;
const plug=n=>{try{return CP[n]||(window.Capacitor&&Capacitor.registerPlugin&&Capacitor.registerPlugin(n))}catch{}};
const nat=()=>{try{return !!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform())}catch{return false}};
const dmy=t=>new Date(t).toLocaleDateString('pt-BR'),daysTo=t=>Math.ceil((t-Date.now())/864e5);
const isoD=t=>{const d=new Date(t),p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
let VER=null;
async function ver(){if(VER)return VER;const U=plug('Updater');if(!U||!nat())return null;try{VER=await U.info()}catch{}return VER}
/* Atualização: compara com version.json do GitHub Releases. O app só aceita APK do próprio repositório
   (https) e o Android confere assinatura e hash antes de instalar. */
async function checkUpd(manual){const v=await ver();
 if(!v||!UPD){if(manual)toast(v?'Atualização não configurada.':'A atualização funciona no app instalado (APK).');return}
 try{const r=await tf(UPD);if(!r.ok)throw 0;const j=JSON.parse(await r.text());
  if(!(+j.code>+v.code)){if(manual)toast('Você já está na versão mais recente ('+v.name+').');return}
  if(typeof j.url!='string'||!j.url.startsWith(`https://github.com/${REPO}/releases/`)){if(manual)toast('Atualização inválida.');return}
  sh(`<b>Nova versão ${esc(j.name||'')}</b>${j.notes?`<p class="sy" style="max-height:8em">${esc(j.notes)}</p>`:''}<small id="up" style="color:#a39a9d">Você está na versão ${esc(v.name)}. Seu login e seus dados são mantidos.</small><button class="btn p" id="u1">Atualizar agora</button><button class="btn" id="u2">Depois</button>`);
  $('#u2').onclick=()=>$('#sheet').hidden=true;
  $('#u1').onclick=async()=>{const U=plug('Updater'),up=$('#up'),b=$('#u1');b.disabled=true;let h;
   try{h=await U.addListener('progress',e=>{up.textContent='Baixando… '+e.percent+'%'})}catch{}
   try{up.textContent='Baixando…';const x=await U.install({url:j.url,sha256:typeof j.sha256=='string'?j.sha256:''});
    up.textContent=x&&x.needPermission?'Permita "instalar apps desta fonte" para o ASC play e toque em Atualizar de novo.':'Pronto! Confirme a instalação na tela do Android.'}
   catch{up.textContent='Falha ao baixar ou validar a atualização. Tente de novo mais tarde.'}
   h&&h.remove&&h.remove();b.disabled=false}
 }catch{if(manual)toast('Não consegui verificar atualizações.')}}
/* Vencimento: Xtream informa exp_date; em lista M3U a data é digitada. Só aviso (banner + notificação), sem renovação. */
const expAt=()=>+CL().exp||0;
async function acct(){const A=xapi();if(!A)return;
 try{const r=await tf(A);if(!r.ok)return;const j=JSON.parse(await r.text()),u=j&&j.user_info;if(!u)return;
  const e=+u.exp_date,l=CL();if(e>0)l.exp=e*1e3;else delete l.exp;delete l.expm;await saveL();expSync()}catch{}}
function expSync(){bn();sched()}
function bn(){const b=$('#exp'),e=expAt();if(!e){b.hidden=true;return}const d=daysTo(e);if(d>7){b.hidden=true;return}
 b.hidden=false;b.className=d<=0?'bad':'';
 $('#et').textContent=d<0?`Sua lista venceu em ${dmy(e)}.`:d==0?'Sua lista vence hoje!':`Sua lista vence em ${d} dia${d>1?'s':''} (${dmy(e)}).`}
$('#ex').onclick=()=>$('#exp').hidden=true;
function expSheet(){const e=expAt(),x=!!xapi(),d=e?daysTo(e):0;
 sh(`<b>Vencimento</b><small style="color:#a39a9d">${e?`Sua lista vence em ${dmy(e)} (${d<0?'vencida':d+' dia'+(d==1?'':'s')}).`:x?'O servidor não informou data de vencimento.':'Informe a data para receber os avisos.'}</small>`
  +(x?'':`<small style="color:#a39a9d">Data de vencimento</small><input type="date" id="ed" value="${e?isoD(e):''}"><button class="btn p" id="es">Salvar</button>`)
  +'<small style="color:#a39a9d">Você recebe uma notificação 7, 3 e 1 dia antes e no dia do vencimento.</small>');
 const es=$('#es');if(es)es.onclick=async()=>{const l=CL(),v=$('#ed').value;
  if(v){l.exp=new Date(v+'T23:59:00').getTime();l.expm='1'}else{delete l.exp;delete l.expm}
  await saveL();$('#sheet').hidden=true;expSync();toast('Salvo.')}}
/* Notificações no celular: 7, 3 e 1 dia antes e no dia, às 9h (funcionam com o app fechado) */
async function sched(){const N=plug('LocalNotifications');if(!N||!nat())return;const e=expAt();
 try{await N.cancel({notifications:[9001,9002,9003,9004].map(id=>({id}))});if(!e)return;
  let p=await N.checkPermissions();if(p.display=='prompt'||p.display=='prompt-with-rationale')p=await N.requestPermissions();if(p.display!='granted')return;
  const L2=[[7,9001,'vence em 7 dias'],[3,9002,'vence em 3 dias'],[1,9003,'vence amanhã'],[0,9004,'vence hoje']],out=[],nm=CL().n||'';
  for(const[d,id,t]of L2){const a=new Date(e);a.setDate(a.getDate()-d);a.setHours(9,0,0,0);if(a.getTime()>e)a.setTime(e-36e5);
   if(a.getTime()>Date.now())out.push({id,title:'ASC play',body:`Sua lista${nm?' "'+nm+'"':''} ${t} (${dmy(e)}).`,schedule:{at:a,allowWhileIdle:true}})}
  if(out.length)await N.schedule({notifications:out})}catch{}}

/* ---------- Segurança: PIN, tela protegida, ambiente ---------- */
const LK=$('#lock');let pinRes=null,pinBuf='';
const SCN=()=>{const N=plug('Secure');return N&&nat()?N:null};
let lastSc='';const syncScr=()=>{const N=SCN();if(!N)return;const s=!$('#add').hidden||SS||!LK.hidden,k=s+'|'+PIN.on;if(k==lastSc)return;lastSc=k;N.screen({secure:!!s,hideRecents:PIN.on}).catch(()=>{})};
['add','sheet','lock'].forEach(id=>new MutationObserver(()=>{if($('#sheet').hidden)SS=0;syncScr()}).observe($('#'+id),{attributes:true,attributeFilter:['hidden']}));
async function pbk(pin,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return b64e(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},k,256)))}
function pinDraw(){$('#ld').textContent='●'.repeat(pinBuf.length)+'○'.repeat(Math.max(0,4-pinBuf.length))}
function askPin(t,o={}){return new Promise(r=>{pinBuf='';pinRes=r;$('#lt').textContent=t;$('#lm').textContent=o.msg||'';$('#lc').hidden=!o.cancel;$('#lf').hidden=!o.forgot;pinDraw();LK.hidden=false;const f=LK.querySelector('[data-k="1"]');f&&f.focus()})}
const pinEnd=()=>{LK.hidden=true;pinRes=null;pinBuf=''};
function pinKey(k){if(!pinRes)return;
 if(k=='x')pinBuf=pinBuf.slice(0,-1);
 else if(k=='ok'){if(pinBuf.length>=4){const r=pinRes;pinRes=null;r(pinBuf);return}$('#lm').textContent='Use de 4 a 6 dígitos.'}
 else if(pinBuf.length<6)pinBuf+=k;
 pinDraw()}
LK.onclick=e=>{const b=e.target.closest('[data-k]');if(b)return pinKey(b.dataset.k);
 if(e.target.closest('#lc')){const r=pinRes;pinRes=null;r&&r(null)}
 if(e.target.closest('#lf')&&confirm('Apagar TODOS os dados do app (listas, logins, favoritos) e remover o PIN?'))wipeAll()};
async function verify(p){if(Date.now()<PIN.u)return false;const ok=await pbk(p,b64d(PIN.s))==PIN.h;
 if(ok){if(PIN.f||PIN.u){PIN.f=0;PIN.u=0;await vs('pin',PIN)}}
 else{PIN.f++;if(PIN.f>=5)PIN.u=Date.now()+Math.min(36e5,3e4*2**(PIN.f-5));await vs('pin',PIN)}return ok}
const wait=()=>`Muitas tentativas. Aguarde ${Math.ceil((PIN.u-Date.now())/1e3)}s.`;
async function unlockLoop(){let m='';for(;;){const p=await askPin('Digite o PIN',{msg:m,forgot:1});
 if(Date.now()<PIN.u){m=wait();continue}
 if(await verify(p)){pinEnd();return}m=Date.now()<PIN.u?wait():'PIN incorreto.'}}
async function chkPin(){try{for(;;){const p=await askPin('Digite o PIN atual',{cancel:1});if(!p)return false;if(await verify(p))return true;toast(Date.now()<PIN.u?wait():'PIN incorreto.')}}finally{pinEnd()}}
async function setPin(){try{const a=await askPin('Crie um PIN (4 a 6 dígitos)',{cancel:1});if(!a)return;const b=await askPin('Repita o PIN',{cancel:1});if(!b)return;
 if(a!=b)return toast('Os PINs não conferem.');const s=crypto.getRandomValues(new Uint8Array(16));
 Object.assign(PIN,{on:true,s:b64e(s),h:await pbk(a,s),f:0,u:0});await vs('pin',PIN);lastSc='';syncScr();toast('PIN ativado.')}finally{pinEnd()}}
function pinSheet(){sh(`<b>Bloqueio por PIN</b><small style="color:#a39a9d">${PIN.on?'Ativo: o app pede o PIN ao abrir e ao voltar depois de 30 segundos fora. Também esconde o app na lista de recentes.':'Desativado. Proteja suas listas e logins com um PIN de 4 a 6 dígitos.'}</small>`+(PIN.on?'<button class="btn" id="p2">Trocar PIN</button><button class="btn" id="p3">Desativar PIN</button>':'<button class="btn p" id="p1">Ativar PIN</button>'));
 const go=(id,f)=>{const b=$(id);b&&(b.onclick=()=>{$('#sheet').hidden=true;f()})};
 go('#p1',setPin);go('#p2',async()=>{if(await chkPin())setPin()});
 go('#p3',async()=>{if(await chkPin()){Object.assign(PIN,{on:false,h:'',s:'',f:0,u:0});await vs('pin',PIN);lastSc='';syncScr();toast('PIN desativado.')}})}
let hideAt=0;
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stNow().catch(()=>{});if(PIN.on){hideAt=Date.now();$('#cover').hidden=false}}
 else if(PIN.on){$('#cover').hidden=true;if(Date.now()-hideAt>3e4&&!pinRes){if(!P.hidden)close();$('#sheet').hidden=true;unlockLoop()}}});
/* Bloqueia o app se houver depurador ou ferramenta de interceptação (Frida/Xposed) ou se o APK foi alterado */
async function envOk(){const N=SCN();if(!N)return true;try{const r=await tmo(N.check(),3000);return !(r.debugger||r.hook||r.sig===false)}catch{return true}}

/* ---------- Início ---------- */
function setDev(d){S.dev=d;LS.asc_dev=d;document.body.className=d=='tv'?'tv':'mob';ori(d=='tv'?'landscape':'portrait')}
async function boot(){const l=CL(),t=l.id&&await plGet(l.id);if(t)return useList(t,null,1);$('#ac').hidden=!LST.l.length;show('add')}
document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{setDev(b.dataset.d);S.items.length?(show('app'),render()):boot()});
const lname=d=>($('#ln').value.trim()||d).slice(0,40);
const doneAdd=()=>{['xs','xu','xp','u','e','ta','ln'].forEach(i=>$('#'+i).value='');$('#st').textContent=''};
$('#ac').onclick=()=>S.items.length?show('app'):lists();
$('#go').onclick=async()=>{const u=$('#u').value.trim(),e=$('#e').value.trim(),st=$('#st');
 if(!okU(u))return st.textContent='Cole um link válido (http:// ou https://).';if(e&&!okU(e))return st.textContent='Link do EPG inválido.';st.textContent='Carregando…';
 try{const r=await tf(u,6e4);if(!r.ok)throw 0;if(await useList(await r.text(),{id:uid(),n:lname(new URL(u).host),m:'m',u,epg:e}))doneAdd()}
 catch{st.textContent='Não consegui baixar o link (bloqueio CORS do servidor). Use “Abrir arquivo” ou “Colar texto”, ou rode o app empacotado em APK.'}};
$('#f').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>8e7)return $('#st').textContent='Arquivo grande demais.';
 const ep=$('#e').value.trim();if(await useList(await f.text(),{id:uid(),n:lname((f.name||'Arquivo').slice(0,40)),m:'f',u:'',epg:okU(ep)?ep:''}))doneAdd()};
$('#fl').onkeydown=e=>e.key=='Enter'&&$('#f').click();
const mode=m=>{$('#xt').hidden=m!='x';$('#ml').hidden=m!='m';$('#m1').classList.toggle('p',m=='x');$('#m2').classList.toggle('p',m=='m');$('#st').textContent='';LS.asc_mode=m};
$('#m1').onclick=()=>mode('x');$('#m2').onclick=()=>mode('m');mode(LS.asc_mode=='m'?'m':'x');
$('#xg').onclick=async()=>{const st=$('#st'),u=$('#xu').value.trim(),p=$('#xp').value.trim();let s=$('#xs').value.trim();
 if(!s||!u||!p)return st.textContent='Preencha servidor, login e senha.';
 if(!/^https?:\/\//i.test(s))s='http://'+s;let o;try{o=new URL(s).origin}catch{return st.textContent='Endereço do servidor inválido.'}
 const url=`${o}/get.php?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}&type=m3u_plus&output=m3u8`;st.textContent='Entrando…';
 try{const r=await tf(url,6e4);if(!r.ok)throw 0;if(await useList(await r.text(),{id:uid(),n:lname(new URL(o).host),m:'x',u:url,epg:''}))doneAdd()}
 catch{st.textContent='Não consegui entrar. Confira servidor, login e senha (ou a conexão).'}};
$('#pa').onclick=()=>{const t=$('#ta');if(t.hidden){t.hidden=false;t.focus();$('#pa').textContent='Carregar texto colado'}else{const ep=$('#e').value.trim();useList(t.value,{id:uid(),n:lname('Lista colada'),m:'f',u:'',epg:okU(ep)?ep:''}).then(ok=>ok&&doneAdd())}};
(async()=>{try{
 if(!await Promise.race([envOk(),sleep(4000).then(()=>true)])){window.__ascBooted=1;$('#boot').hidden=true;$('#blk').hidden=false;return}
 try{await tmo(dek(),9000)}catch(e){window.__ascRecovery&&window.__ascRecovery('Não consegui abrir o cofre seguro deste aparelho.');return}
 try{await loadVault();await migrate()}catch(e){console.warn(e)}
 syncScr();
 if(PIN.on)await unlockLoop();
 if(!S.dev)show('setup');else{setDev(S.dev);await boot()}
 setTimeout(()=>checkUpd(),2500)
}catch(e){bootErr((e&&e.message)||e)}})();
addEventListener('error',e=>{const t=e.target;if(t&&t.tagName=='IMG')t.remove()},true);
try{const A=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App;A&&A.addListener('backButton',()=>{if(!LK.hidden)A.exitApp();else if(!P.hidden)close();else if(!$('#sheet').hidden)$('#sheet').hidden=true;else A.exitApp()})}catch{}
