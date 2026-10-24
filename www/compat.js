/* Compatibilidade com WebViews antigos (TVs e TV boxes). Carrega antes do app.js. Codigo ES5 de proposito. */
(function () {
  var w = window;
  function def(o, n, f) { if (!o[n]) try { Object.defineProperty(o, n, { value: f, writable: true, configurable: true }); } catch (e) {} }

  // String.prototype.matchAll (Chrome 73+), preguicoso para nao estourar memoria com guias grandes
  def(String.prototype, 'matchAll', function (re) {
    var s = String(this), fl = re.flags || '';
    var g = new RegExp(re.source, fl.indexOf('g') < 0 ? fl + 'g' : fl);
    var it = {
      next: function () {
        var m = g.exec(s);
        if (!m) return { done: true, value: undefined };
        if (m[0] === '') g.lastIndex++;
        return { done: false, value: m };
      }
    };
    it[Symbol.iterator] = function () { return it; };
    return it;
  });

  // Array.prototype.flatMap (Chrome 69+)
  def(Array.prototype, 'flatMap', function (f, t) {
    var o = [];
    for (var i = 0; i < this.length; i++) {
      var v = f.call(t, this[i], i, this);
      if (Array.isArray(v)) { for (var j = 0; j < v.length; j++) o.push(v[j]); } else o.push(v);
    }
    return o;
  });

  // AbortController (Chrome 66+): sem ele o fetch segue sem cancelamento por tempo
  if (!w.AbortController) {
    w.AbortController = function () { this.signal = undefined; };
    w.AbortController.prototype.abort = function () {};
  }

  // Detecta se o WebView aceita "gap" em flexbox (Chrome 84+). Se nao, o CSS usa margens (classe .nogap)
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var d = document.createElement('div');
      d.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
      d.appendChild(document.createElement('i'));
      d.appendChild(document.createElement('i'));
      document.body.appendChild(d);
      var ok = d.scrollHeight === 1;
      document.body.removeChild(d);
      if (!ok) document.documentElement.className += ' nogap';
    } catch (e) {}
  });
})();
