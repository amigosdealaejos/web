/* Buscador de Amigos de Alaejos: busca en assets/buscar.json, sin servidor. */
(function () {
  var d = document, form = d.getElementById('buscar-form'), campo = d.getElementById('q'),
      res = d.getElementById('resultados'), estado = d.getElementById('buscar-estado');
  var base = form.getAttribute('data-base'), datos = null;
  function norm(t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function escH(t) { return t.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cargar(cb) {
    if (datos) return cb();
    estado.textContent = 'Cargando…';
    fetch(base + 'assets/buscar.json').then(function (r) { return r.json(); }).then(function (j) {
      datos = j.map(function (e) { e.n = norm(e.t + ' ' + e.a + ' ' + e.x); e.nt = norm(e.t + ' ' + e.a); return e; });
      cb();
    }).catch(function () { estado.textContent = 'No se ha podido cargar el buscador.'; });
  }
  function fragmento(x, palabras) {
    var nx = norm(x), pos = -1;
    for (var i = 0; i < palabras.length && pos < 0; i++) pos = nx.indexOf(palabras[i]);
    var ini = Math.max(0, pos - 90), fin = Math.min(x.length, ini + 260);
    var t = (ini > 0 ? '…' : '') + x.slice(ini, fin) + (fin < x.length ? '…' : '');
    t = escH(t);
    palabras.forEach(function (p) {
      if (p.length < 2) return;
      var nt = norm(t), out = '', k = 0, j;
      while ((j = nt.indexOf(p, k)) >= 0) { out += t.slice(k, j) + '<mark>' + t.slice(j, j + p.length) + '</mark>'; k = j + p.length; }
      t = out + t.slice(k);
    });
    return t;
  }
  function buscar() {
    var q = campo.value.trim();
    history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
    if (q.length < 2) { res.innerHTML = ''; estado.textContent = ''; return; }
    cargar(function () {
      var frase = norm(q), palabras = frase.split(/\s+/).filter(function (p) { return p.length > 1; });
      var hits = [];
      datos.forEach(function (e) {
        var ok = palabras.every(function (p) { return e.n.indexOf(p) >= 0; });
        if (!ok) return;
        var pt = 0;
        palabras.forEach(function (p) { pt += (e.nt.indexOf(p) >= 0 ? 10 : 0) + Math.min(5, e.n.split(p).length - 1); });
        if (e.n.indexOf(frase) >= 0) pt += 8;
        hits.push({ e: e, pt: pt });
      });
      hits.sort(function (a, b) { return b.pt - a.pt; });
      estado.textContent = hits.length ? (hits.length === 1 ? '1 resultado' : hits.length + ' resultados') : 'No hay resultados. Pruebe con otra palabra o busque también en la biblioteca.';
      res.innerHTML = hits.slice(0, 60).map(function (h) {
        var e = h.e;
        return '<li><a href="' + base + e.u + '">' + escH(e.t) + (e.a ? ' <span>› ' + escH(e.a) + '</span>' : '') + '</a><p>' + fragmento(e.x, palabras) + '</p></li>';
      }).join('');
    });
  }
  var t;
  campo.addEventListener('input', function () { clearTimeout(t); t = setTimeout(buscar, 200); });
  form.addEventListener('submit', function (e) { e.preventDefault(); buscar(); });
  var q0 = new URLSearchParams(location.search).get('q');
  if (q0) { campo.value = q0; buscar(); }
})();
