/* La población de Alaejos en datos.
   Reúne las cifras de habitantes desde el siglo XV (vecindarios, catastros, censos y padrón)
   y las dibuja en gráficos SVG. Sin dependencias ni descargas: los datos van aquí mismo.

   Para añadir un año nuevo del padrón basta con una línea en PADRON (año: [hombres, mujeres]).
   Para añadir cualquier otra cifra, una línea en OTRAS con su fuente (clave de FUENTES). */
(function () {
  "use strict";
  var raiz = document.getElementById("poblacion");
  if (!raiz) return;
  var BASE = raiz.getAttribute("data-base") || "../../";
  var SUPERFICIE = 102.49; // km² del término municipal (IGN)
  var NS = "http://www.w3.org/2000/svg";

  // ================================================================ FUENTES
  var H = BASE + "historia-del-pueblo/";
  var FUENTES = {
    ojeda1991: { c: "Ojeda Nieto, 1991", t: "José Ojeda Nieto, «Bosquejo histórico», en Alaejos, apuntes histórico-artísticos (1991)", u: H + "siglos-xvi-y-xvii/" },
    ojeda2004: { c: "Ojeda Nieto, 2004", t: "José Ojeda Nieto, programa de fiestas de 2004 (cálculo a partir de los más de 900 vecinos de 1591)", u: H + "siglos-xvi-y-xvii/" },
    baraja2021: { c: "Baraja, 2021", t: "José M. Baraja, programa de fiestas de 2021", u: H + "el-siglo-xviii/" },
    ensenada: { c: "Catastro de Ensenada", t: "Catastro de Ensenada, 1751, según el extracto de Adelio Castaño Casquero (programa de 1981)", u: H + "el-siglo-xviii/" },
    madoz: { c: "Madoz", t: "Pascual Madoz, Diccionario geográfico-estadístico-histórico (1845-1850), según el extracto de Azucena Hernández Amez (programa de 1991)", u: H + "el-siglo-xix/" },
    sepia: { c: "Alaejos, del sepia al color", t: "Armando Caballero Morante, Alaejos, del sepia al color (2001), tabla de evolución de la población", u: BASE + "biblioteca/bibliografia/#del-sepia-al-color" },
    castano1993: { c: "Castaño, 1993", t: "Adelio Castaño, «Se quedó en proyecto», programa de 1993: memoria del ferrocarril de Valladolid a Fuentesaúco (1887)", u: H + "el-siglo-xx/" },
    castano1984: { c: "Castaño, 1984", t: "Adelio Castaño, 1984", u: H + "el-siglo-xx/" },
    prog1954: { c: "Programa de 1954", t: "Programa de fiestas de 1954", u: H + "el-siglo-xx/" },
    ineHecho: { c: "INE, censos", t: "INE, censos de población, población de hecho (serie publicada por Foro-Ciudad; 1950 y 1970 comprobadas en los tomos de esos censos en INEbase Historia)", u: "https://www.foro-ciudad.com/valladolid/alaejos/habitantes.html" },
    ineDerecho: { c: "INE, censos", t: "INE, censos de población, población de derecho o residente (1950 y 1970, tomos de esos censos en INEbase Historia; 1981-2021, City Population)", u: "https://www.citypopulation.de/es/spain/castillayleon/valladolid/47004__alaejos/" },
    inePadron: { c: "INE, padrón", t: "INE, cifras oficiales de población del padrón municipal (1986-2024, serie publicada por Foro-Ciudad; 2025, Real Decreto 1117/2025)", u: "https://www.foro-ciudad.com/valladolid/alaejos/habitantes.html" },
    ineCenso2025: { c: "INE, censo anual 2025", t: "INE, Censo anual de población a 1 de enero de 2025 (vía City Population)", u: "https://www.citypopulation.de/es/spain/castillayleon/valladolid/47004__alaejos/" },
    ineNacimiento: { c: "INE, padrón 2022", t: "INE, padrón municipal de 2022, población por lugar de nacimiento (vía Foro-Ciudad)", u: "https://www.foro-ciudad.com/valladolid/alaejos/habitantes.html" }
  };

  // ================================================================ DATOS
  // Padrón municipal, cifras oficiales del INE a 1 de enero (1996: 1 de mayo; en 1997 no hubo revisión).
  // 1991 es la cifra del censo de ese año, que fue también la oficial.
  var PADRON = {
    1986: [1031, 987], 1987: [1025, 990], 1988: [1017, 986], 1989: [1010, 978], 1990: [1014, 973],
    1991: [919, 869], 1992: [929, 878], 1993: [926, 877], 1994: [919, 861], 1995: [929, 859],
    1996: [895, 820], 1998: [868, 809], 1999: [860, 804], 2000: [829, 785],
    2001: [816, 765], 2002: [800, 739], 2003: [809, 742], 2004: [842, 785], 2005: [845, 806],
    2006: [831, 762], 2007: [822, 764], 2008: [843, 770], 2009: [836, 775], 2010: [820, 752],
    2011: [820, 740], 2012: [782, 712], 2013: [772, 695], 2014: [754, 675], 2015: [753, 665],
    2016: [741, 659], 2017: [747, 642], 2018: [740, 642], 2019: [732, 637], 2020: [738, 641],
    2021: [740, 640], 2022: [742, 643], 2023: [731, 649], 2024: [747, 660], 2025: [764, 663]
  };
  // t: vec = vecinos (cabezas de familia), est = estimación de habitantes, cuenta = recuento antiguo de personas,
  //    local = cifra de publicaciones locales, hecho / derecho = censos del INE
  var OTRAS = [
    { a: 1452, v: 200, t: "vec", f: "ojeda1991" },
    { a: 1580, v: 1000, t: "vec", f: "ojeda1991", n: "Momento de mayor auge, con el vino" },
    { a: 1591, v: 900, t: "vec", f: "prog1954", n: "«Más de 900 vecinos» al terminar el siglo XVI" },
    { a: 1591, v: 4000, t: "est", f: "ojeda2004", n: "«Algo más de 4.000 personas»" },
    { a: 1700, v: 2000, t: "est", f: "baraja2021", n: "«Poco más de 2.000 habitantes» a comienzos del siglo XVIII" },
    { a: 1751, v: 538, t: "vec", f: "ensenada", n: "538 vecinos, de ellos 119 viudas" },
    { a: 1787, v: 2697, t: "cuenta", f: "ojeda1991", n: "Censo de Floridablanca, según Ojeda; Baraja da 2.800" },
    { a: 1787, v: 2800, t: "cuenta", f: "baraja2021", n: "Censo de Floridablanca, según Baraja; Ojeda da 2.697" },
    { a: 1845, v: 804, t: "vec", f: "madoz", n: "804 vecinos" },
    { a: 1845, v: 3255, t: "cuenta", f: "madoz", n: "Hacia 1845. Madoz tomó sus cifras de la Matrícula catastral de 1842" },
    { a: 1860, v: 3725, t: "local", f: "sepia" },
    { a: 1877, v: 3665, t: "local", f: "sepia" },
    { a: 1887, v: 3776, t: "local", f: "castano1993", n: "Cifra de la memoria del ferrocarril proyectado" },
    { a: 1900, v: 3561, t: "hecho", f: "ineHecho" },
    { a: 1900, v: 3564, t: "local", f: "sepia" },
    { a: 1905, v: 3584, t: "local", f: "castano1984" },
    { a: 1910, v: 3694, t: "hecho", f: "ineHecho" },
    { a: 1920, v: 3456, t: "hecho", f: "ineHecho" },
    { a: 1930, v: 3532, t: "hecho", f: "ineHecho" },
    { a: 1930, v: 3652, t: "local", f: "sepia" },
    { a: 1940, v: 3471, t: "hecho", f: "ineHecho" },
    { a: 1940, v: 3715, t: "local", f: "sepia" },
    { a: 1950, v: 3610, t: "hecho", f: "ineHecho" },
    { a: 1950, v: 3715, t: "derecho", f: "ineDerecho" },
    { a: 1950, v: 2715, t: "local", f: "sepia", n: "Errata probable: el censo de 1950 da 3.715 de derecho" },
    { a: 1954, v: 3950, t: "local", f: "prog1954", n: "850 vecinos; otra crónica de entonces da 3.715" },
    { a: 1960, v: 2939, t: "hecho", f: "ineHecho" },
    { a: 1970, v: 2420, t: "hecho", f: "ineHecho" },
    { a: 1970, v: 2444, t: "derecho", f: "ineDerecho" },
    { a: 1970, v: 2444, t: "local", f: "sepia" },
    { a: 1981, v: 1977, t: "hecho", f: "ineHecho" },
    { a: 1981, v: 2006, t: "derecho", f: "ineDerecho" },
    { a: 1990, v: 1983, t: "local", f: "sepia" },
    { a: 1991, v: 1788, t: "derecho", f: "ineDerecho" },
    { a: 2001, v: 1550, t: "derecho", f: "ineDerecho", n: "Censo a 1 de noviembre de 2001 (población residente)" },
    { a: 2001, v: 1616, t: "local", f: "sepia", n: "A 1 de enero de 2001; el padrón oficial da 1.581" },
    { a: 2011, v: 1468, t: "derecho", f: "ineDerecho", n: "Censo a 1 de noviembre de 2011" },
    { a: 2021, v: 1380, t: "derecho", f: "ineDerecho", n: "Censo a 1 de enero de 2021: 741 hombres y 639 mujeres" }
  ];
  // Estructura de la población a 1 de enero de 2025 (Censo anual del INE)
  var EDADES = [["0-9", 102], ["10-19", 73], ["20-29", 110], ["30-39", 177], ["40-49", 197], ["50-59", 199], ["60-69", 242], ["70-79", 162], ["80-89", 118], ["90 y más", 46]];
  var GRANDES = { menores: 157, adultos: 841, mayores: 428 }; // 0-17, 18-64, 65 y más
  var NACIONALIDAD = [["Española", 1217], ["Otro país de la Unión Europea", 100], ["Resto de Europa", 5], ["África", 11], ["América", 92], ["Asia, Oceanía y apátridas", 1]];
  var NACIMIENTO = [["Alaejos", 639], ["Otro pueblo de la provincia de Valladolid", 378], ["Otra provincia de Castilla y León", 95], ["Otra comunidad autónoma", 107], ["Otro país", 166]]; // padrón 2022
  // Acontecimientos que se marcan en el gráfico grande
  var HITOS = [
    { a: 1580, t: "Auge del vino: unos mil vecinos", u: H + "siglos-xvi-y-xvii/" },
    { a: 1636, t: "Crisis: el concejo dice al rey que los vecinos se van", u: H + "siglos-xvi-y-xvii/" },
    { a: 1751, t: "Catastro de Ensenada", u: H + "el-siglo-xviii/" },
    { a: 1834, t: "Cólera: muere el 10 % de la población", u: H + "el-siglo-xix/" },
    { a: 1864, t: "El tren llega a Nava del Rey, no a Alaejos", u: H + "el-siglo-xx/" },
    { a: 1936, t: "Guerra civil (1936-1939)", u: H + "el-siglo-xx/" },
    { a: 1960, t: "Años de la emigración", u: H + "el-siglo-xx/" },
    { a: 1996, t: "Empieza el padrón continuo", u: "https://www.ine.es/dynt3/inebase/index.htm?padre=1689" }
  ];

  // ================================================================ PREPARACIÓN
  var PUNTOS = OTRAS.slice();
  var ANIOS_P = Object.keys(PADRON).map(Number).sort(function (a, b) { return a - b; });
  ANIOS_P.forEach(function (a) {
    var p = PADRON[a];
    PUNTOS.push({ a: a, v: p[0] + p[1], t: "padron", f: "inePadron", h: p[0], m: p[1],
      n: a === 1996 ? "A 1 de mayo de 1996" : a === 1991 ? "Cifra del censo de 1991" : null });
  });
  PUNTOS.sort(function (x, y) { return x.a - y.a || orden(x.t) - orden(y.t); });
  function orden(t) { return ["vec", "est", "cuenta", "local", "hecho", "derecho", "padron"].indexOf(t); }
  var ULT = ANIOS_P[ANIOS_P.length - 1], HOY = PADRON[ULT][0] + PADRON[ULT][1];

  // Serie de referencia: una cifra de personas por año, la más fiable que hay
  // (padrón desde 1986; censos de hecho de 1900 a 1981, para comparar lo mismo con lo mismo; antes, lo que haya)
  var REF = [];
  (function () {
    var porAnio = {};
    function poner(p, aprox) { if (!porAnio[p.a]) porAnio[p.a] = { a: p.a, v: p.v, p: p, aprox: !!aprox }; }
    PUNTOS.forEach(function (p) { if (p.t === "padron") poner(p); });
    PUNTOS.forEach(function (p) { if (p.t === "hecho") poner(p); });
    PUNTOS.forEach(function (p) { if (p.t === "cuenta" && p.f !== "baraja2021") poner(p); });
    PUNTOS.forEach(function (p) { if (p.t === "local" && p.a < 1900) poner(p); });
    PUNTOS.forEach(function (p) { if (p.t === "est") poner(p, true); });
    REF = Object.keys(porAnio).map(function (k) { return porAnio[k]; }).sort(function (x, y) { return x.a - y.a; });
  })();
  function ref(a) { for (var i = 0; i < REF.length; i++) if (REF[i].a === a) return REF[i]; return null; }

  // ================================================================ FORMATO
  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: true });
  var nf1 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf2 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function menos(s) { return s.replace("-", "−"); }
  // Intl no agrupa los miles en números de cuatro cifras en español: se agrupan a mano
  function f0(v) { var s = nf0.format(Math.round(Math.abs(v))); if (Math.abs(v) >= 1000 && s.indexOf(".") < 0) s = s.slice(0, -3) + "." + s.slice(-3); return (v < -0.5 ? "−" : "") + s; }
  function f1(v) { return menos(nf1.format(v)); }
  function f2(v) { return menos(nf2.format(v)); }
  function signo(v, fn) { return (v > 0 ? "+" : v < 0 ? "−" : "±") + (fn || f0)(Math.abs(v)); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function tasa(v0, v1, anios) { return anios > 0 ? (Math.pow(v1 / v0, 1 / anios) - 1) * 100 : 0; }

  var TIPOS = {
    vec: { n: "Vecinos (cabezas de familia), pasados a habitantes", c: "po-m-est po-m-hueco" },
    est: { n: "Estimación de habitantes", c: "po-m-est" },
    cuenta: { n: "Recuento antiguo de personas", c: "po-m-est" },
    local: { n: "Publicaciones locales", c: "po-m-local" },
    hecho: { n: "Censo del INE, población de hecho", c: "po-m-censo" },
    derecho: { n: "Censo del INE, población de derecho o residente", c: "po-m-censo po-m-cuadro" },
    padron: { n: "Padrón municipal (INE)", c: "po-m-padron" }
  };
  function nombreTipo(p) { return TIPOS[p.t].n; }

  // ================================================================ SVG
  var graficos = [];
  function S_(tag, at, padre) {
    var e = document.createElementNS(NS, tag);
    for (var k in at) if (at[k] != null) e.setAttribute(k, at[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  function registrar(el, dibujar) {
    for (var i = 0; i < graficos.length; i++) if (graficos[i].el === el) graficos.splice(i, 1);
    var g = { el: el, dibujar: dibujar, ancho: 0 };
    graficos.push(g); pintar(g);
  }
  function pintar(g) { var w = g.el.clientWidth; if (!w) return; g.ancho = w; g.dibujar(Math.floor(w)); }
  var espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () { graficos.forEach(function (g) { if (g.el.clientWidth !== g.ancho) pintar(g); }); }, 150);
  });
  function bonita(min, max, n) {
    if (min === max) { min -= 1; max += 1; }
    var paso = Math.pow(10, Math.floor(Math.log10((max - min) / n))), err = (max - min) / n / paso;
    paso *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var a = Math.floor(min / paso) * paso, b = Math.ceil(max / paso) * paso, t = [];
    for (var v = a; v <= b + paso / 2; v += paso) t.push(Math.round(v * 1e6) / 1e6);
    return { min: a, max: b, ticks: t };
  }
  function lienzo(el, w, o) {
    el.innerHTML = "";
    var m = { t: o.arriba || 12, r: 12, b: 24, l: o.izq || 44 }, h = o.alto;
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var svg = S_("svg", { width: w, height: h, viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": o.aria });
    var x0 = o.x[0], x1 = o.x[1], y0 = o.y.min, y1 = o.y.max;
    var L = {
      svg: svg, m: m, w: w, h: h, iw: iw, ih: ih,
      sx: function (v) { return m.l + (v - x0) / (x1 - x0) * iw; },
      sy: function (v) { return m.t + (1 - (v - y0) / (y1 - y0)) * ih; },
      ix: function (px) { return x0 + (px - m.l) / iw * (x1 - x0); }
    };
    var ejes = S_("g", {}, svg);
    o.y.ticks.forEach(function (v) {
      var y = L.sy(v);
      S_("line", { x1: m.l, x2: w - m.r, y1: y, y2: y, "class": v === 0 ? "po-base" : "po-rejilla" }, ejes);
      S_("text", { x: m.l - 6, y: y + 4, "text-anchor": "end", "class": "po-eje" }, ejes).textContent = (o.fmtY || f0)(v);
    });
    (o.ticksX || []).forEach(function (t) {
      var x = L.sx(t.v);
      if (x < m.l - 1 || x > w - m.r + 1) return;
      S_("text", { x: x, y: h - 6, "text-anchor": "middle", "class": "po-eje" }, ejes).textContent = t.t;
    });
    L.fondo = S_("g", {}, svg);
    L.capa = S_("g", {}, svg);
    el.appendChild(svg);
    return L;
  }
  function ticksAnios(L, a, b) {
    var span = b - a, objetivo = Math.max(3, Math.floor(L.iw / 70));
    var pasos = [1, 2, 5, 10, 20, 25, 50, 100, 200], paso = 200;
    for (var i = 0; i < pasos.length; i++) if (span / pasos[i] <= objetivo) { paso = pasos[i]; break; }
    var t = [];
    for (var y = Math.ceil(a / paso) * paso; y <= b; y += paso) t.push({ v: y, t: String(y) });
    return t;
  }
  function ruta(L, pts) {
    return pts.map(function (p, i) { return (i ? "L" : "M") + L.sx(p.a).toFixed(1) + " " + L.sy(p.v).toFixed(1); }).join("");
  }
  // Cruz y ficha al pasar el dedo o el ratón. xs: años ordenados; tip(i) → html o null
  function interaccion(L, el, xs, tip) {
    var cruz = S_("line", { y1: L.m.t, y2: L.h - L.m.b, "class": "po-cruz", visibility: "hidden" }, L.svg);
    var zona = S_("rect", { x: L.m.l, y: 0, width: L.iw, height: L.h, fill: "transparent" }, L.svg);
    var caja = document.createElement("div");
    caja.className = "po-tip"; caja.hidden = true; el.appendChild(caja);
    function ocultar() { cruz.setAttribute("visibility", "hidden"); caja.hidden = true; }
    function mover(ev) {
      if (!xs.length) return;
      var r = L.svg.getBoundingClientRect(), v = L.ix(ev.clientX - r.left);
      var lo = 0, hi = xs.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (xs[mid] < v) lo = mid; else hi = mid; }
      var i = Math.abs(xs[lo] - v) <= Math.abs(xs[hi] - v) ? lo : hi, html = tip(i);
      if (html == null) { ocultar(); return; }
      var x = L.sx(xs[i]);
      cruz.setAttribute("x1", x); cruz.setAttribute("x2", x); cruz.setAttribute("visibility", "visible");
      caja.innerHTML = html; caja.hidden = false;
      var cw = caja.offsetWidth, izq = x + 14;
      if (izq + cw > L.w) izq = x - cw - 14;
      caja.style.left = Math.max(0, izq) + "px";
    }
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
    zona.addEventListener("pointerleave", ocultar);
  }
  function leyenda(el, items) {
    var prev = el.previousElementSibling;
    if (prev && prev.classList.contains("po-leyenda")) prev.remove();
    var ul = document.createElement("ul");
    ul.className = "po-leyenda";
    ul.innerHTML = items.map(function (it) { return '<li><i class="po-m ' + it[0] + '"></i>' + esc(it[1]) + "</li>"; }).join("");
    el.parentNode.insertBefore(ul, el);
  }
  function fila(et, val, marca) { return '<span class="po-tf">' + (marca ? '<i class="po-m ' + marca + '"></i>' : "") + esc(et) + ": <b>" + esc(val) + "</b></span>"; }

  // ================================================================ FICHAS
  function fichas() {
    var censos = REF.filter(function (r) { return r.a >= 1900; });
    var max = censos.reduce(function (a, b) { return b.v > a.v ? b : a; });
    var hace10 = PADRON[ULT - 10] ? PADRON[ULT - 10][0] + PADRON[ULT - 10][1] : null;
    var mayores = GRANDES.mayores / (GRANDES.menores + GRANDES.adultos + GRANDES.mayores) * 100;
    var F = [
      ["Habitantes hoy", f0(HOY), "Padrón a 1 de enero de " + ULT],
      ["Máximo del siglo XX", f0(max.v), "En " + max.a + " (censo, población de hecho)"],
      ["Desde entonces", signo((HOY / max.v - 1) * 100, f1) + " %", f0(max.v - HOY) + " habitantes menos"],
      ["Última década", hace10 ? signo(HOY - hace10) : "—", hace10 ? (ULT - 10) + "–" + ULT + " (" + signo((HOY / hace10 - 1) * 100, f1) + " %)" : ""],
      ["Densidad", f1(HOY / SUPERFICIE), "habitantes por km² (término de 102,49 km²)"],
      ["Mayores de 65 años", f0(mayores) + " %", "de la población en 2025"]
    ];
    $("po-fichas").innerHTML = F.map(function (f) {
      return '<div class="po-ficha"><span class="po-fe">' + esc(f[0]) + '</span><span class="po-fv">' + esc(f[1]) + '</span><span class="po-fd">' + esc(f[2]) + "</span></div>";
    }).join("");
  }

  // ================================================================ GRÁFICO GRANDE
  var estado = { desde: 1440, hasta: ULT, coef: 4, ver: { est: true, local: true, censo: true, padron: true }, hitos: true };
  function visible(p) {
    if (p.a < estado.desde || p.a > estado.hasta) return false;
    if (p.t === "vec" || p.t === "est" || p.t === "cuenta") return estado.ver.est;
    if (p.t === "hecho" || p.t === "derecho") return estado.ver.censo;
    return estado.ver[p.t];
  }
  function valorDibujo(p) { return p.t === "vec" ? p.v * estado.coef : p.v; }

  function graficoGrande() {
    var el = $("g-grande");
    leyenda(el, [["po-m-censo", "Censos: de hecho (●) y de derecho (■)"], ["po-m-padron po-m-linea", "Padrón anual"], ["po-m-local", "Publicaciones locales"], ["po-m-est", "Estimaciones y recuentos antiguos"], ["po-m-est po-m-hueco", "Vecinos × " + f1(estado.coef).replace(",0", "")]]);
    registrar(el, function (w) {
      var pts = PUNTOS.filter(visible);
      var maxV = 0;
      pts.forEach(function (p) { var v = p.t === "vec" ? p.v * 5 : p.v; if (v > maxV) maxV = v; });
      var ye = bonita(0, Math.max(maxV, 500), 5);
      var a0 = estado.desde, a1 = estado.hasta;
      if (pts.length) { a0 = Math.max(a0, pts[0].a - 2); }
      if (a1 - a0 < 4) { a0 -= 2; a1 += 2; }
      a1 += (a1 - a0) * 0.012;
      var L = lienzo(el, w, { alto: w < 520 ? 300 : 380, x: [a0, a1], y: ye, arriba: 26,
        aria: "Habitantes de Alaejos entre " + a0 + " y " + a1 });
      var ticks = ticksAnios(L, a0, a1);
      ticks.forEach(function (t) { S_("text", { x: L.sx(t.v), y: L.h - 6, "text-anchor": "middle", "class": "po-eje" }, L.fondo).textContent = t.t; });

      // acontecimientos
      if (estado.hitos) {
        var n = 0;
        HITOS.forEach(function (hh, k) {
          if (hh.a < a0 || hh.a > a1) return;
          var x = L.sx(hh.a);
          S_("line", { x1: x, x2: x, y1: L.m.t - 4, y2: L.h - L.m.b, "class": "po-hito" }, L.fondo);
          var g = S_("g", { "class": "po-hito-n" }, L.fondo);
          S_("circle", { cx: x, cy: 10, r: 8 }, g);
          S_("text", { x: x, y: 13.5, "text-anchor": "middle" }, g).textContent = String(k + 1);
          n++;
        });
      }
      // líneas: antes de 1900 (punteada), censos de hecho 1900-1981, padrón desde 1986
      var refVis = REF.filter(function (r) { return r.a >= a0 && r.a <= a1 && visible(r.p); });
      var antes = refVis.filter(function (r) { return r.a <= 1900; });
      var hecho = refVis.filter(function (r) { return r.a >= 1900 && r.a <= 1981 && r.p.t === "hecho"; });
      var padron = refVis.filter(function (r) { return r.p.t === "padron"; });
      if (antes.length > 1) S_("path", { d: ruta(L, antes), "class": "po-linea po-l-antes", fill: "none" }, L.capa);
      if (hecho.length > 1) S_("path", { d: ruta(L, hecho), "class": "po-linea po-l-censo", fill: "none" }, L.capa);
      if (hecho.length && padron.length && hecho[hecho.length - 1].a === 1981) S_("path", { d: ruta(L, [hecho[hecho.length - 1], padron[0]]), "class": "po-linea po-l-antes", fill: "none" }, L.capa);
      if (padron.length > 1) S_("path", { d: ruta(L, padron), "class": "po-linea po-l-padron", fill: "none" }, L.capa);

      // marcas
      var r = w < 520 ? 3.5 : 4.5;
      pts.slice().sort(function (p, q) { return (p.t === "derecho" ? 0 : 1) - (q.t === "derecho" ? 0 : 1); }).forEach(function (p) {
        var x = L.sx(p.a), v = valorDibujo(p), y = L.sy(v);
        if (p.t === "vec") {
          S_("line", { x1: x, x2: x, y1: L.sy(p.v * 3.5), y2: L.sy(p.v * 5), "class": "po-bigote" }, L.capa);
          S_("circle", { cx: x, cy: y, r: r + 0.5, "class": "po-p po-p-vec" }, L.capa);
        } else if (p.t === "derecho") {
          S_("rect", { x: x - r - 1, y: y - r - 1, width: 2 * r + 2, height: 2 * r + 2, "class": "po-p po-p-derecho" }, L.capa);
        } else if (p.t === "padron") {
          if (padron.length < 25) S_("circle", { cx: x, cy: y, r: r - 1, "class": "po-p po-p-padron" }, L.capa);
        } else {
          S_("circle", { cx: x, cy: y, r: r, "class": "po-p po-p-" + p.t }, L.capa);
        }
      });
      // etiqueta del último dato
      var ult = padron[padron.length - 1];
      if (ult && ult.a === ULT && (w >= 520 || a1 - a0 < 200)) {
        S_("text", { x: L.sx(ult.a) - 4, y: L.sy(ult.v) - 16, "text-anchor": "end", "class": "po-etq" }, L.capa).textContent = f0(ult.v) + " en " + ult.a;
      }
      // ficha
      var anios = []; pts.forEach(function (p) { if (anios[anios.length - 1] !== p.a) anios.push(p.a); });
      interaccion(L, el, anios, function (i) {
        var a = anios[i], aqui = pts.filter(function (p) { return p.a === a; });
        if (!aqui.length) return null;
        var html = "<strong>" + a + "</strong>";
        aqui.forEach(function (p) {
          var val = p.t === "vec" ? f0(p.v) + " vecinos ≈ " + f0(p.v * estado.coef) + " hab." : f0(p.v) + (p.t === "est" ? " (aprox.)" : "");
          html += fila(TIPOS[p.t].n.replace(", pasados a habitantes", ""), val, TIPOS[p.t].c);
          var nota = (p.n ? p.n + ". " : "") + FUENTES[p.f].c;
          html += '<span class="po-tn">' + esc(nota) + "</span>";
          if (p.t === "padron" && p.h != null) html += '<span class="po-tn">' + f0(p.h) + " hombres y " + f0(p.m) + " mujeres</span>";
        });
        return html;
      });
    });
  }

  function listaHitos() {
    $("po-hitos").innerHTML = HITOS.map(function (hh, k) {
      return '<li><span class="po-hn">' + (k + 1) + '</span><span class="po-ha">' + hh.a + '</span> <a href="' + esc(hh.u) + '">' + esc(hh.t) + "</a></li>";
    }).join("");
  }

  function controles() {
    var dSel = $("po-desde"), hSel = $("po-hasta");
    var anios = [];
    PUNTOS.forEach(function (p) { if (anios.indexOf(p.a) < 0) anios.push(p.a); });
    anios.sort(function (a, b) { return a - b; });
    dSel.innerHTML = anios.map(function (a) { return '<option value="' + a + '">' + a + "</option>"; }).join("");
    hSel.innerHTML = dSel.innerHTML;
    function sinc() {
      dSel.value = String(anios.filter(function (a) { return a >= estado.desde; })[0]);
      hSel.value = String(anios.filter(function (a) { return a <= estado.hasta; }).pop());
      Array.prototype.forEach.call(document.querySelectorAll(".po-periodo button"), function (b) {
        b.setAttribute("aria-pressed", +b.getAttribute("data-desde") === estado.desde && estado.hasta === ULT ? "true" : "false");
      });
    }
    sinc();
    Array.prototype.forEach.call(document.querySelectorAll(".po-periodo button"), function (b) {
      b.addEventListener("click", function () { estado.desde = +b.getAttribute("data-desde"); estado.hasta = ULT; sinc(); graficoGrande(); });
    });
    dSel.addEventListener("change", function () { estado.desde = +dSel.value; if (estado.hasta <= estado.desde) estado.hasta = ULT; sinc(); graficoGrande(); });
    hSel.addEventListener("change", function () { estado.hasta = +hSel.value; if (estado.hasta <= estado.desde) estado.desde = anios[0]; sinc(); graficoGrande(); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-serie]"), function (c) {
      c.addEventListener("change", function () { estado.ver[c.getAttribute("data-serie")] = c.checked; graficoGrande(); });
    });
    $("po-hitos-ver").addEventListener("change", function () { estado.hitos = this.checked; graficoGrande(); });
    $("po-coef").addEventListener("change", function () { estado.coef = +this.value; graficoGrande(); tabla(); });
  }

  // ================================================================ COMPARAR DOS FECHAS
  function comparar() {
    var a = $("po-a"), b = $("po-b");
    var ops = REF.map(function (r) {
      return '<option value="' + r.a + '">' + r.a + " · " + f0(r.v) + (r.aprox ? " (aprox.)" : "") + "</option>";
    }).join("");
    a.innerHTML = ops; b.innerHTML = ops;
    a.value = "1910"; b.value = String(ULT);
    function calc() {
      var x = ref(+a.value), y = ref(+b.value);
      if (x.a > y.a) { var t = x; x = y; y = t; }
      var dif = y.v - x.v, anios = y.a - x.a, pct = (y.v / x.v - 1) * 100, t = tasa(x.v, y.v, anios);
      var frase;
      if (anios === 0) frase = "Elija dos años distintos.";
      else if (dif < 0) frase = "Entre " + x.a + " y " + y.a + " Alaejos perdió " + f0(-dif) + " habitantes: " +
        (pct <= -50 ? "más de la mitad" : pct <= -33 ? "más de un tercio" : pct <= -25 ? "más de la cuarta parte" : pct <= -10 ? "más de uno de cada diez" : "menos de uno de cada diez") +
        ". De media, " + f1(-dif / anios) + " habitantes menos cada año.";
      else if (dif > 0) frase = "Entre " + x.a + " y " + y.a + " Alaejos ganó " + f0(dif) + " habitantes, " + f1(dif / anios) + " más cada año de media.";
      else frase = "Entre " + x.a + " y " + y.a + " la población quedó igual.";
      var nota = [x, y].filter(function (r) { return r.aprox || r.p.t !== "padron"; }).map(function (r) {
        return r.a + ": " + nombreTipo(r.p).toLowerCase().replace("ine", "INE") + (r.aprox ? " (aproximada)" : "") + (/^ine/.test(r.p.f) ? "" : ", " + FUENTES[r.p.f].c);
      });
      $("po-comp").innerHTML =
        '<div class="po-fichas po-fichas-comp">' +
        '<div class="po-ficha"><span class="po-fe">Diferencia</span><span class="po-fv">' + signo(dif) + '</span><span class="po-fd">habitantes en ' + anios + (anios === 1 ? " año" : " años") + "</span></div>" +
        '<div class="po-ficha"><span class="po-fe">Variación</span><span class="po-fv">' + signo(pct, f1) + ' %</span><span class="po-fd">de ' + f0(x.v) + " a " + f0(y.v) + "</span></div>" +
        '<div class="po-ficha"><span class="po-fe">Ritmo medio</span><span class="po-fv">' + signo(t, f2) + ' %</span><span class="po-fd">al año (tasa compuesta)</span></div>' +
        "</div><p>" + esc(frase) + "</p>" + (nota.length ? '<p class="po-nota">Cifras: ' + esc(nota.join("; ")) + ".</p>" : "");
    }
    a.addEventListener("change", calc); b.addEventListener("change", calc);
    calc();
  }

  // ================================================================ RITMO DE CAMBIO POR PERIODOS
  function graficoRitmo() {
    var el = $("g-ritmo");
    var marcas = [1591, 1700, 1787, 1845, 1860, 1877, 1887, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1981, 1991, 2001, 2011, 2021, ULT];
    var tramos = [];
    for (var i = 1; i < marcas.length; i++) {
      var x = ref(marcas[i - 1]), y = ref(marcas[i]);
      if (!x || !y) continue;
      tramos.push({ a0: x.a, a1: y.a, v0: x.v, v1: y.v, t: tasa(x.v, y.v, y.a - x.a), aprox: x.aprox || y.aprox || x.a < 1900 });
    }
    leyenda(el, [["po-m-ritmo", "Censos y padrón"], ["po-m-ritmo po-m-rayado", "Antes de 1900: cifras menos seguras"]]);
    registrar(el, function (w) {
      var vis = tramos.filter(function (t) { return t.a0 >= $("po-ritmo-desde").value; });
      var lo = Math.min.apply(null, vis.map(function (t) { return t.t; }).concat([0]));
      var hi = Math.max.apply(null, vis.map(function (t) { return t.t; }).concat([0]));
      var ye = bonita(lo, hi, 5);
      var a0 = vis[0].a0, a1 = vis[vis.length - 1].a1;
      var L = lienzo(el, w, { alto: 240, x: [a0, a1], y: ye, fmtY: function (v) { return f1(v) + " %"; }, izq: 52,
        ticksX: null, aria: "Crecimiento medio anual de la población por periodos" });
      ticksAnios(L, a0, a1).forEach(function (t) { S_("text", { x: L.sx(t.v), y: L.h - 6, "text-anchor": "middle", "class": "po-eje" }, L.fondo).textContent = t.t; });
      var b = L.sy(0);
      vis.forEach(function (t) {
        var x0 = L.sx(t.a0) + 1, x1 = L.sx(t.a1) - 1, y = L.sy(t.t);
        S_("rect", { x: x0.toFixed(1), y: Math.min(y, b).toFixed(1), width: Math.max(x1 - x0, 1).toFixed(1), height: Math.max(Math.abs(b - y), 1).toFixed(1), rx: 2,
          "class": "po-bar" + (t.aprox ? " po-bar-aprox" : "") }, L.capa);
      });
      var xs = vis.map(function (t) { return (t.a0 + t.a1) / 2; });
      interaccion(L, el, xs, function (i) {
        var t = vis[i];
        return "<strong>" + t.a0 + "–" + t.a1 + "</strong>" + fila("De", f0(t.v0) + " a " + f0(t.v1)) + fila("Cambio", signo(t.v1 - t.v0) + " (" + signo((t.v1 / t.v0 - 1) * 100, f1) + " %)") +
          fila("Ritmo medio", signo(t.t, f2) + " % al año") + (t.aprox ? '<span class="po-tn">Alguna de las dos cifras es aproximada o de fuente local</span>' : "");
      });
    });
  }

  // ================================================================ AÑO A AÑO (PADRÓN)
  function graficoAnual() {
    var el = $("g-anual"), cambios = [];
    for (var i = 1; i < ANIOS_P.length; i++) {
      var a = ANIOS_P[i], b = ANIOS_P[i - 1];
      var v = PADRON[a][0] + PADRON[a][1], w0 = PADRON[b][0] + PADRON[b][1];
      cambios.push({ a: a, d: v - w0, desde: b, v: v });
    }
    registrar(el, function (w) {
      var ds = cambios.map(function (c) { return c.d; });
      var ye = bonita(Math.min.apply(null, ds.concat([0])), Math.max.apply(null, ds.concat([0])), 5);
      var L = lienzo(el, w, { alto: 220, x: [ANIOS_P[0] + 0.5, ULT + 0.5], y: ye, fmtY: function (v) { return signo(v); },
        aria: "Cambio de población de un año a otro según el padrón" });
      ticksAnios(L, ANIOS_P[0] + 1, ULT).forEach(function (t) { S_("text", { x: L.sx(t.v), y: L.h - 6, "text-anchor": "middle", "class": "po-eje" }, L.fondo).textContent = t.t; });
      var ancho = Math.max(2, L.iw / (ULT - ANIOS_P[0]) - 3), b0 = L.sy(0);
      cambios.forEach(function (c) {
        var y = L.sy(c.d);
        S_("rect", { x: (L.sx(c.a) - ancho / 2).toFixed(1), y: Math.min(y, b0).toFixed(1), width: ancho.toFixed(1), height: Math.max(Math.abs(b0 - y), 1).toFixed(1), rx: ancho > 6 ? 2 : 0,
          "class": "po-bar po-bar-padron" + (c.a - c.desde > 1 || c.a === 1991 || c.a === 1992 ? " po-bar-aprox" : "") }, L.capa);
      });
      interaccion(L, el, cambios.map(function (c) { return c.a; }), function (i) {
        var c = cambios[i];
        return "<strong>" + c.desde + " → " + c.a + "</strong>" + fila("Habitantes", f0(c.v)) + fila("Cambio", signo(c.d)) +
          (c.a - c.desde > 1 ? '<span class="po-tn">En 1997 no hubo revisión del padrón: el cambio es de dos años</span>' : "") +
          (c.a === 1991 || c.a === 1992 ? '<span class="po-tn">La cifra de 1991 es la del censo de ese año</span>' : "");
      });
    });
  }

  // ================================================================ HOMBRES Y MUJERES
  function graficosSexo() {
    var el = $("g-sexo"), el2 = $("g-razon");
    var H_ = ANIOS_P.map(function (a) { return { a: a, v: PADRON[a][0] }; }), M_ = ANIOS_P.map(function (a) { return { a: a, v: PADRON[a][1] }; });
    var R_ = ANIOS_P.map(function (a) { return { a: a, v: PADRON[a][0] / PADRON[a][1] * 100 }; });
    leyenda(el, [["po-m-hombres po-m-linea", "Hombres"], ["po-m-mujeres po-m-linea", "Mujeres"]]);
    registrar(el, function (w) {
      var ye = bonita(0, 1100, 5);
      var L = lienzo(el, w, { alto: 230, x: [ANIOS_P[0], ULT], y: ye, aria: "Hombres y mujeres empadronados en Alaejos desde 1986" });
      ticksAnios(L, ANIOS_P[0], ULT).forEach(function (t) { S_("text", { x: L.sx(t.v), y: L.h - 6, "text-anchor": "middle", "class": "po-eje" }, L.fondo).textContent = t.t; });
      S_("path", { d: ruta(L, H_), "class": "po-linea po-l-hombres", fill: "none" }, L.capa);
      S_("path", { d: ruta(L, M_), "class": "po-linea po-l-mujeres", fill: "none" }, L.capa);
      var uh = H_[H_.length - 1], um = M_[M_.length - 1];
      S_("text", { x: L.sx(uh.a) - 4, y: L.sy(uh.v) - 8, "text-anchor": "end", "class": "po-etq" }, L.capa).textContent = "Hombres " + f0(uh.v);
      S_("text", { x: L.sx(um.a) - 4, y: L.sy(um.v) + 18, "text-anchor": "end", "class": "po-etq" }, L.capa).textContent = "Mujeres " + f0(um.v);
      interaccion(L, el, ANIOS_P, function (i) {
        return "<strong>" + ANIOS_P[i] + "</strong>" + fila("Hombres", f0(H_[i].v), "po-m-hombres po-m-linea") + fila("Mujeres", f0(M_[i].v), "po-m-mujeres po-m-linea");
      });
    });
    registrar(el2, function (w) {
      var vals = R_.map(function (r) { return r.v; });
      var ye = bonita(Math.min(98, Math.min.apply(null, vals)), Math.max.apply(null, vals), 4);
      var L = lienzo(el2, w, { alto: 180, x: [ANIOS_P[0], ULT], y: ye, aria: "Hombres por cada 100 mujeres desde 1986" });
      ticksAnios(L, ANIOS_P[0], ULT).forEach(function (t) { S_("text", { x: L.sx(t.v), y: L.h - 6, "text-anchor": "middle", "class": "po-eje" }, L.fondo).textContent = t.t; });
      if (ye.min <= 100) {
        S_("line", { x1: L.m.l, x2: L.w - L.m.r, y1: L.sy(100), y2: L.sy(100), "class": "po-regla" }, L.capa);
        S_("text", { x: L.m.l + 4, y: L.sy(100) - 5, "class": "po-etq" }, L.capa).textContent = "Igualdad";
      }
      S_("path", { d: ruta(L, R_), "class": "po-linea po-l-censo", fill: "none" }, L.capa);
      interaccion(L, el2, ANIOS_P, function (i) { return "<strong>" + ANIOS_P[i] + "</strong>" + fila("Hombres por cada 100 mujeres", f1(R_[i].v)); });
    });
  }

  // ================================================================ ESTRUCTURA ACTUAL
  function barrasHtml(id, datos, total, clase) {
    var max = Math.max.apply(null, datos.map(function (d) { return d[1]; }));
    $(id).innerHTML = datos.map(function (d) {
      return '<div class="po-hb"><span class="po-hb-e">' + esc(d[0]) + '</span><span class="po-hb-b"><i class="' + clase + '" style="width:' + (d[1] / max * 100).toFixed(1) + '%"></i></span>' +
        '<span class="po-hb-v">' + f0(d[1]) + ' <small>' + f1(d[1] / total * 100) + " %</small></span></div>";
    }).join("");
  }
  function estructura() {
    var tot = GRANDES.menores + GRANDES.adultos + GRANDES.mayores;
    barrasHtml("po-edades", EDADES, tot, "po-hb-edad");
    barrasHtml("po-nacionalidad", NACIONALIDAD, tot, "po-hb-nac");
    var totN = NACIMIENTO.reduce(function (s, d) { return s + d[1]; }, 0);
    barrasHtml("po-nacimiento", NACIMIENTO, totN, "po-hb-nac");
    $("po-grandes").innerHTML =
      '<div class="po-ficha"><span class="po-fe">Menores de 18</span><span class="po-fv">' + f0(GRANDES.menores) + '</span><span class="po-fd">' + f1(GRANDES.menores / tot * 100) + " %</span></div>" +
      '<div class="po-ficha"><span class="po-fe">De 18 a 64</span><span class="po-fv">' + f0(GRANDES.adultos) + '</span><span class="po-fd">' + f1(GRANDES.adultos / tot * 100) + " %</span></div>" +
      '<div class="po-ficha"><span class="po-fe">65 y más</span><span class="po-fv">' + f0(GRANDES.mayores) + '</span><span class="po-fd">' + f1(GRANDES.mayores / tot * 100) + " %</span></div>" +
      '<div class="po-ficha"><span class="po-fe">Mayores por cada menor</span><span class="po-fv">' + f1(GRANDES.mayores / GRANDES.menores) + '</span><span class="po-fd">de 65 y más por cada menor de 18</span></div>';
  }

  // ================================================================ TABLA Y CSV
  function filasTabla() {
    return PUNTOS.map(function (p) {
      var hab = p.t === "vec" ? "≈ " + f0(p.v * estado.coef) : f0(p.v);
      var fu = FUENTES[p.f];
      return { a: p.a, tipo: nombreTipo(p), vec: p.t === "vec" ? p.v : "", hab: p.t === "vec" ? Math.round(p.v * estado.coef) : p.v, habTxt: hab,
        h: p.h != null ? p.h : "", m: p.m != null ? p.m : "", nota: p.n || "", fuente: fu.t, url: fu.u, corta: fu.c };
    });
  }
  function tabla() {
    var fs = filasTabla();
    $("t-datos").innerHTML = '<table class="tabla"><thead><tr><th>Año</th><th class="num">Habitantes</th><th>Qué es</th><th>Fuente y notas</th></tr></thead><tbody>' +
      fs.map(function (r) {
        var det = (r.vec !== "" ? f0(r.vec) + " vecinos × " + f1(estado.coef).replace(",0", "") + ". " : "") + (r.h !== "" ? f0(r.h) + " hombres y " + f0(r.m) + " mujeres. " : "") + (r.nota ? r.nota + ". " : "");
        return "<tr><td>" + r.a + '</td><td class="num">' + r.habTxt + "</td><td>" + esc(r.tipo) + '</td><td><a href="' + esc(r.url) + '">' + esc(r.corta) + "</a>" +
          (det ? '<span class="nota">' + esc(det.trim()) + "</span>" : "") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function csv() {
    var fs = filasTabla(), q = function (s) { s = String(s); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    var txt = "anio;habitantes;tipo;vecinos;habitantes_por_vecino;hombres;mujeres;nota;fuente;enlace\n" + fs.map(function (r) {
      return [r.a, r.hab, r.tipo, r.vec, r.vec !== "" ? String(estado.coef).replace(".", ",") : "", r.h, r.m, r.nota, r.fuente, r.url].map(q).join(";");
    }).join("\n");
    var blob = new Blob(["﻿" + txt], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "poblacion-alaejos.csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ================================================================ INICIO
  fichas();
  controles();
  listaHitos();
  graficoGrande();
  comparar();
  $("po-ritmo-desde").addEventListener("change", graficoRitmo);
  graficoRitmo();
  graficoAnual();
  graficosSexo();
  estructura();
  tabla();
  $("po-csv").addEventListener("click", csv);
  raiz.classList.add("po-listo");
})();
