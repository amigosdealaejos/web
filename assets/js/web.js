/* Amigos de Alaejos: menú del móvil, índice de la página, volver arriba y visor de fotos. */
(function () {
  var d = document;

  // Menú plegable en el móvil
  var btn = d.querySelector('.menu-btn'), menu = d.getElementById('menu');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var abierto = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', abierto ? 'false' : 'true');
      menu.classList.toggle('abierto', !abierto);
    });
  }

  // Submenú: que se vea el apartado actual aunque la fila tenga que desplazarse
  var actual = d.querySelector('.submenu-in [aria-current="page"]');
  if (actual && actual.scrollIntoView) {
    var fila = actual.parentNode;
    fila.scrollLeft = actual.getBoundingClientRect().left - fila.getBoundingClientRect().left + fila.scrollLeft - 12;
  }

  // Índice «En esta página»: abierto en pantallas anchas
  var ind = d.querySelector('.indice');
  if (ind && window.matchMedia('(min-width: 60rem)').matches) ind.open = true;
  if (ind) ind.addEventListener('click', function (e) {
    if (e.target.tagName === 'A' && !window.matchMedia('(min-width: 60rem)').matches) ind.open = false;
  });

  // Volver arriba: aparece al bajar en las páginas largas
  var arriba = d.querySelector('.arriba');
  if (arriba && d.documentElement.scrollHeight > window.innerHeight * 3) {
    var vis = false;
    window.addEventListener('scroll', function () {
      var v = window.scrollY > window.innerHeight * 1.5;
      if (v !== vis) { vis = v; arriba.classList.toggle('visible', v); }
    }, { passive: true });
    arriba.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // Visor de fotos: abre en grande la foto y su pie
  var enlaces = d.querySelectorAll('a.ampliar');
  if (enlaces.length && window.HTMLDialogElement) {
    var dlg = d.createElement('dialog');
    dlg.className = 'visor';
    dlg.innerHTML = '<button class="visor-cerrar" type="button" aria-label="Cerrar">×</button><img alt=""><p></p>';
    d.body.appendChild(dlg);
    var vimg = dlg.querySelector('img'), vtxt = dlg.querySelector('p');
    dlg.querySelector('.visor-cerrar').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target === vimg) dlg.close(); });
    dlg.addEventListener('close', function () { vimg.removeAttribute('src'); });
    Array.prototype.forEach.call(enlaces, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var img = a.querySelector('img'), fig = a.closest('figure'), cap = fig && fig.querySelector('figcaption');
        vimg.src = a.href; vimg.alt = img ? img.alt : '';
        vtxt.innerHTML = cap ? cap.innerHTML : '';
        dlg.showModal();
      });
    });
  }
})();
