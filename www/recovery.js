(function(){var d=document;function rec(m){if(window.__ascBooted)return;var b=d.getElementById('boot'),t=d.getElementById('bm'),r=d.getElementById('br');if(!b||!t||!r)return;b.hidden=false;if(m)t.textContent=m;else if(t.textContent==='Carregando…')t.textContent='O app demorou para iniciar.';r.hidden=false}
window.__ascRecovery=rec;
setTimeout(function(){rec()},15000);
d.addEventListener('DOMContentLoaded',function(){
 var old=false;
 try{
  var match=navigator.userAgent.match(/Chrome\/(\d+)/);
  if(match&&parseInt(match[1],10)<84)old=true;
  (function(){return {}?.a})();
 }catch(e){old=true;}
 if(old){
  rec('O navegador interno deste aparelho (WebView antigo) é antigo demais para o ASC play. Atualize o Android System WebView ou use o ASC TV Box, versão nativa para aparelhos antigos.');
  var r=d.getElementById('br');if(r)r.hidden=true;
  return;
 }
 d.getElementById('b1').onclick=function(){location.reload()};
 d.getElementById('b2').onclick=function(){try{localStorage.clear();sessionStorage.clear();localStorage.asc_dm='w'}catch(e){}
  try{var q=indexedDB.deleteDatabase('asc');q.onsuccess=q.onerror=q.onblocked=function(){location.reload()};setTimeout(function(){location.reload()},1500)}catch(e){location.reload()}}})})();
