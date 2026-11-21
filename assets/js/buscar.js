/* Buscador de Amigos de Alaejos, con el índice troceado de Pagefind (carpeta pagefind/).
   En cada búsqueda el navegador descarga solo la parte del índice que necesita. */
(function () {
  var d = document, form = d.getElementById('buscar-form'), campo = d.getElementById('q'),
      res = d.getElementById('resultados'), estado = d.getElementById('buscar-estado');
  var base = form.getAttribute('data-base'), pf = null, turno = 0, resultados = [], mostrados = 0, POR_TANDA = 20;
  var mas = d.createElement('button');
  mas.type = 'button'; mas.className = 'btn btn-sec buscar-mas'; mas.hidden = true; mas.textContent = 'Ver más resultados';
  res.parentNode.insertBefore(mas, res.nextSibling);

  function escH(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cargar() {
    if (!pf) {
      pf = import(new URL(base + 'pagefind/pagefind.js', location.href).href).then(function (m) {
        return Promise.resolve(m.options ? m.options({ excerptLength: 40 }) : null).then(function () { return m; });
      });
    }
    return pf;
  }
  function pintar(data) {
    // Si la coincidencia está en un apartado concreto, se enlaza a él
    var sub = (data.sub_results || []).filter(function (s) { return s.url && s.url.indexOf('#') > 0 && s.title !== data.meta.title; })[0];
    var url = sub ? sub.url : data.url;
    var apartado = sub ? sub.title : (data.meta.sub || '');
    var extracto = sub ? sub.excerpt : data.excerpt;
    return '<li><a href="' + escH(url) + '">' + escH(data.meta.title || '') +
      (apartado ? ' <span>› ' + escH(apartado) + '</span>' : '') + '</a><p>' + extracto + '</p></li>';
  }
  function tanda(mi) {
    var trozo = resultados.slice(mostrados, mostrados + POR_TANDA);
    mostrados += trozo.length;
    return Promise.all(trozo.map(function (r) { return r.data(); })).then(function (datos) {
      if (mi !== turno) return;
      res.insertAdjacentHTML('beforeend', datos.map(pintar).join(''));
      mas.hidden = mostrados >= resultados.length;
    });
  }
  function buscar() {
    var q = campo.value.trim(), mi = ++turno;
    history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname);
    if (q.length < 2) { res.innerHTML = ''; estado.textContent = ''; mas.hidden = true; return; }
    estado.textContent = 'Buscando…';
    cargar().then(function (m) { return m.search(q); }).then(function (r) {
      if (mi !== turno) return;
      resultados = r.results; mostrados = 0; res.innerHTML = ''; mas.hidden = true;
      var n = resultados.length;
      estado.textContent = n ? (n === 1 ? '1 resultado' : n + ' resultados') : 'No hay resultados. Pruebe con otra palabra.';
      return tanda(mi);
    }).catch(function () {
      if (mi === turno) estado.textContent = 'No se ha podido cargar el buscador. Pruebe a recargar la página.';
    });
  }
  var t;
  campo.addEventListener('input', function () { clearTimeout(t); t = setTimeout(buscar, 250); });
  form.addEventListener('submit', function (e) { e.preventDefault(); buscar(); });
  mas.addEventListener('click', function () { tanda(turno); });
  var q0 = new URLSearchParams(location.search).get('q');
  if (q0) { campo.value = q0; buscar(); }
})();
