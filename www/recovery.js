(function(){var d=document;function cv(){var m=navigator.userAgent.match(/Chrome\/(\d+)/);return m?m[1]:'?'}
function rec(m){if(window.__ascBooted)return;var b=d.getElementById('boot'),t=d.getElementById('bm'),r=d.getElementById('br');if(!b||!t||!r)return;b.hidden=false;if(m)t.textContent=m;else if(t.textContent==='Carregando…')t.textContent='O app demorou para iniciar. (WebView Chrome '+cv()+')';r.hidden=false}
window.__ascRecovery=rec;
window.addEventListener('error',function(e){if(window.__ascBooted||!e||!e.message)return;rec('Erro ao iniciar: '+e.message+' (WebView Chrome '+cv()+')')});
setTimeout(function(){rec()},15000);
d.addEventListener('DOMContentLoaded',function(){
 d.getElementById('b1').onclick=function(){location.reload()};
 d.getElementById('b2').onclick=function(){try{localStorage.clear();sessionStorage.clear();localStorage.asc_dm='w'}catch(e){}
  try{var q=indexedDB.deleteDatabase('asc');q.onsuccess=q.onerror=q.onblocked=function(){location.reload()};setTimeout(function(){location.reload()},1500)}catch(e){location.reload()}}})})();
