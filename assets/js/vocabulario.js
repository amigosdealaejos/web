/* Vocabulario de Alaejos: filtro por palabra y por tipo de entrada. */
(function () {
  var d = document, caja = d.getElementById('vocab-busca'), q = d.getElementById('vq'),
      t = d.getElementById('vt'), estado = d.getElementById('vocab-estado'), raiz = d.getElementById('vocab');
  if (!caja || !raiz) return;
  caja.hidden = false;
  function norm(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC');
  }
  var entradas = [];
  raiz.querySelectorAll('dt').forEach(function (dt) {
    var dd = dt.nextElementSibling;
    entradas.push({ dt: dt, dd: dd, tipo: dt.getAttribute('data-t'),
      lema: norm(dt.textContent), texto: norm(dt.textContent + ' ' + (dd ? dd.textContent : '')) });
  });
  var secciones = raiz.querySelectorAll('section.letra'), total = entradas.length, temporizador;
  function filtrar() {
    var txt = norm(q.value.trim()), tipo = t.value, n = 0, enLema = 0;
    entradas.forEach(function (e) {
      var ok = (!tipo || tipo.indexOf(e.tipo) > -1 || (tipo === 'gl' && (e.tipo === 'g' || e.tipo === 'l'))) &&
               (!txt || e.texto.indexOf(txt) > -1);
      e.dt.hidden = !ok; if (e.dd) e.dd.hidden = !ok;
      if (ok) { n++; if (txt && e.lema.indexOf(txt) > -1) enLema++; }
    });
    secciones.forEach(function (s) {
      s.hidden = !s.querySelector('dt:not([hidden])');
    });
    var p = function (k) { return k === 1 ? '' : 's'; };
    if (!txt && !tipo) estado.textContent = '';
    else if (!n) estado.textContent = 'Ninguna entrada coincide. Pruebe con otra palabra o búsquela en todo el sitio con el buscador general.';
    else estado.textContent = n + ' entrada' + p(n) + ' de ' + total + (txt ? ' (' + enLema + ' con «' + q.value.trim() + '» en la propia palabra)' : '') + '.';
  }
  q.addEventListener('input', function () { clearTimeout(temporizador); temporizador = setTimeout(filtrar, 120); });
  t.addEventListener('change', filtrar);
  // Si se llega con ?q=palabra, se filtra al entrar
  var m = /[?&]q=([^&]+)/.exec(location.search);
  if (m) { q.value = decodeURIComponent(m[1].replace(/\+/g, ' ')); filtrar(); }
})();
