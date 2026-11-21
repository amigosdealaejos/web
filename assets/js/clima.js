/* El clima de Alaejos en datos.
   Descarga el histórico diario de Open-Meteo (reanálisis ERA5 desde 1940; los últimos días,
   del modelo de predicción) y lo resume en gráficos SVG. Sin dependencias. */
(function () {
  "use strict";
  var raiz = document.getElementById("clima");
  if (!raiz || !window.fetch) return;

  var LAT = 41.3075, LON = -5.2167, ALT = 752;
  var VARS = "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum";
  var INICIO = "1940-01-01";
  var CLAVE = "ada-clima-v1";
  var PLUVIOMETRO = { media: 323.28, desde: 1942, hasta: 2015 };
  var DIA = 864e5;
  var CUM = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335]; // calendario de 366 días
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MESES_C = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var NS = "http://www.w3.org/2000/svg";

  var $ = function (id) { return document.getElementById(id); };
  var estado = $("cl-estado");

  // ---------------------------------------------------------------- formato
  var nf1 = new Intl.NumberFormat("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var nf0 = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 });
  function menos(s) { return s.replace("-", "−"); }
  function f1(v) { if (Math.abs(v) < 0.05) v = 0; return menos(nf1.format(v)); }
  function f0(v) { if (Math.abs(v) < 0.5) v = 0; return menos(nf0.format(v)); }
  function conSigno(v, dec) { var t = dec === 0 ? f0(Math.abs(v)) : f1(Math.abs(v)); return (Math.round(v * 10) === 0 ? "±" : v > 0 ? "+" : "−") + t; }
  function grados(v) { return f1(v) + "\u00a0°C"; }
  function mm(v) { return (v >= 100 ? f0(v) : f1(v)) + "\u00a0mm"; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ---------------------------------------------------------------- fechas
  function iso(d) { return d.toISOString().slice(0, 10); }
  function hoyMadrid() {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) { return iso(new Date()); }
  }
  function sumarDias(s, n) { var d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function msDe(s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); }
  function bisiesto(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function diasMes(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }

  // ---------------------------------------------------------------- descarga
  function pedir(url) {
    return fetch(url).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.error) { var e = new Error(j.reason || ("HTTP " + r.status)); e.reason = j.reason || ""; throw e; }
        return j;
      });
    });
  }
  function urlArchivo(fin) {
    return "https://archive-api.open-meteo.com/v1/archive?latitude=" + LAT + "&longitude=" + LON + "&elevation=" + ALT +
      "&start_date=" + INICIO + "&end_date=" + fin + "&daily=" + VARS + "&timezone=Europe%2FMadrid&models=era5";
  }
  function urlReciente() {
    return "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON + "&elevation=" + ALT +
      "&daily=" + VARS + "&timezone=Europe%2FMadrid&past_days=60&forecast_days=1";
  }
  function r1(v) { return v == null || isNaN(v) ? null : Math.round(v * 10) / 10; }

  // Convierte la respuesta diaria en series y quita los días finales todavía sin datos
  function series(daily) {
    var t = daily.time, d = { t0: t[0], tx: [], tn: [], tm: [], p: [], prov: -1 };
    for (var i = 0; i < t.length; i++) {
      var tx = r1(daily.temperature_2m_max[i]), tn = r1(daily.temperature_2m_min[i]);
      var tm = r1(daily.temperature_2m_mean ? daily.temperature_2m_mean[i] : null);
      if (tm == null && tx != null && tn != null) tm = r1((tx + tn) / 2);
      d.tx.push(tx); d.tn.push(tn); d.tm.push(tm); d.p.push(r1(daily.precipitation_sum[i]));
    }
    var n = d.p.length;
    while (n && (d.tm[n - 1] == null || d.p[n - 1] == null)) n--;
    ["tx", "tn", "tm", "p"].forEach(function (k) { d[k].length = n; });
    return d;
  }
  // Añade los días que el reanálisis aún no tiene (hasta ayer), marcados como provisionales
  function completar(d, daily, ayer) {
    var r = series(daily), fin = msDe(d.t0) + (d.p.length - 1) * DIA, r0 = msDe(r.t0);
    for (var i = 0; i < r.p.length; i++) {
      var ms = r0 + i * DIA;
      if (ms <= fin || ms > msDe(ayer)) continue;
      while (msDe(d.t0) + d.p.length * DIA < ms) { d.tx.push(null); d.tn.push(null); d.tm.push(null); d.p.push(null); }
      if (d.prov < 0) d.prov = d.p.length;
      d.tx.push(r.tx[i]); d.tn.push(r.tn[i]); d.tm.push(r.tm[i]); d.p.push(r.p[i]);
    }
  }
  function descargar(hoy) {
    var ayer = sumarDias(hoy, -1);
    function archivo(fin, reintento) {
      return pedir(urlArchivo(fin)).catch(function (e) {
        var m = /to (\d{4}-\d{2}-\d{2})/.exec(e.reason || "");
        if (!reintento && m) return archivo(m[1] < fin ? m[1] : fin, true);
        throw e;
      });
    }
    return archivo(ayer, false).then(function (a) {
      var d = series(a.daily);
      return pedir(urlReciente()).then(function (f) { completar(d, f.daily, ayer); return d; }, function () { return d; });
    });
  }
  function leerCache() { try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; } }
  function guardarCache(hoy, d) { try { localStorage.setItem(CLAVE, JSON.stringify({ hoy: hoy, d: d })); } catch (e) { /* sin espacio o sin almacenamiento */ } }

  // ---------------------------------------------------------------- análisis
  var A, N, REF = "1991-2020";

  function preparar(d) {
    var n = d.p.length, T0 = msDe(d.t0);
    var Y = new Int16Array(n), M = new Int8Array(n), Dd = new Int8Array(n), S = new Int16Array(n);
    var anios = {}, lista = [];
    var txRec = [], tnRec = [], pRec = [], txRecI = [], tnRecI = [], pRecI = [];
    for (var s = 0; s < 366; s++) { txRec.push(-Infinity); tnRec.push(Infinity); pRec.push(-1); txRecI.push(-1); tnRecI.push(-1); pRecI.push(-1); }
    for (var i = 0; i < n; i++) {
      var dt = new Date(T0 + i * DIA), y = dt.getUTCFullYear(), m = dt.getUTCMonth(), dd = dt.getUTCDate();
      Y[i] = y; M[i] = m; Dd[i] = dd; s = CUM[m] + dd - 1; S[i] = s;
      var a = anios[y];
      if (!a) {
        a = anios[y] = { y: y, i0: i, i1: i, ok: 0, stm: 0, stx: 0, stn: 0, sp: 0, hel: 0, c30: 0, c35: 0, tro: 0, meses: [] };
        for (var k = 0; k < 12; k++) a.meses.push({ ok: 0, stm: 0, stx: 0, stn: 0, sp: 0 });
        lista.push(a);
      }
      a.i1 = i;
      var tx = d.tx[i], tn = d.tn[i], tm = d.tm[i], p = d.p[i];
      if (tx == null || tn == null || tm == null || p == null) continue;
      var mm_ = a.meses[m];
      a.ok++; a.stm += tm; a.stx += tx; a.stn += tn; a.sp += p;
      mm_.ok++; mm_.stm += tm; mm_.stx += tx; mm_.stn += tn; mm_.sp += p;
      if (tn < 0) a.hel++;
      if (tx >= 30) a.c30++;
      if (tx >= 35) a.c35++;
      if (tn >= 20) a.tro++;
      if (tx > txRec[s]) { txRec[s] = tx; txRecI[s] = i; }
      if (tn < tnRec[s]) { tnRec[s] = tn; tnRecI[s] = i; }
      if (p > pRec[s]) { pRec[s] = p; pRecI[s] = i; }
    }
    lista.forEach(function (a) {
      a.completo = a.ok === (bisiesto(a.y) ? 366 : 365);
      a.tm = a.stm / a.ok; a.tx = a.stx / a.ok; a.tn = a.stn / a.ok; a.p = a.sp;
      a.meses.forEach(function (mm_, m) {
        mm_.completo = mm_.ok === diasMes(a.y, m);
        mm_.tm = mm_.stm / mm_.ok; mm_.tx = mm_.stx / mm_.ok; mm_.tn = mm_.stn / mm_.ok; mm_.p = mm_.sp;
      });
    });
    var completos = lista.filter(function (a) { return a.completo; });
    return { d: d, n: n, T0: T0, Y: Y, M: M, Dd: Dd, S: S, anios: anios, lista: lista, completos: completos,
      txRec: txRec, tnRec: tnRec, pRec: pRec, txRecI: txRecI, tnRecI: tnRecI, pRecI: pRecI,
      ultimo: n - 1, prov: d.prov };
  }

  function media(v) { var s = 0, c = 0; v.forEach(function (x) { if (x != null && !isNaN(x)) { s += x; c++; } }); return c ? s / c : null; }

  function normales(ref) {
    var a = +ref.slice(0, 4), b = +ref.slice(5);
    var anios = A.completos.filter(function (x) { return x.y >= a && x.y <= b; });
    var R = { ref: ref, a: a, b: b, nAnios: anios.length,
      tm: media(anios.map(function (x) { return x.tm; })), p: media(anios.map(function (x) { return x.p; })),
      hel: media(anios.map(function (x) { return x.hel; })), c30: media(anios.map(function (x) { return x.c30; })),
      c35: media(anios.map(function (x) { return x.c35; })), meses: [] };
    for (var m = 0; m < 12; m++) {
      var ms = anios.map(function (x) { return x.meses[m]; }).filter(function (x) { return x.completo; });
      R.meses.push({ tm: media(ms.map(function (x) { return x.tm; })), tx: media(ms.map(function (x) { return x.tx; })),
        tn: media(ms.map(function (x) { return x.tn; })), p: media(ms.map(function (x) { return x.p; })) });
    }
    var sx = new Float64Array(366), cx = new Float64Array(366), sn = new Float64Array(366), cn = new Float64Array(366);
    var acc = new Float64Array(366), cacc = 0;
    anios.forEach(function (x) {
      var run = 0, ult = -1, fila = new Float64Array(366);
      for (var i = x.i0; i <= x.i1; i++) {
        var s = A.S[i];
        sx[s] += A.d.tx[i]; cx[s]++; sn[s] += A.d.tn[i]; cn[s]++;
        for (var k = ult + 1; k < s; k++) fila[k] = run;
        run += A.d.p[i]; fila[s] = run; ult = s;
      }
      for (var j = 0; j < 366; j++) acc[j] += fila[j];
      cacc++;
    });
    function suavizar(sum, cnt) {
      var out = [];
      for (var s = 0; s < 366; s++) {
        var t = 0, c = 0;
        for (var k = -15; k <= 15; k++) { var j = (s + k + 366) % 366; t += sum[j]; c += cnt[j]; }
        out.push(c ? t / c : null);
      }
      return out;
    }
    R.txN = suavizar(sx, cx); R.tnN = suavizar(sn, cn);
    R.pAc = Array.prototype.map.call(acc, function (v) { return cacc ? v / cacc : null; });
    return R;
  }

  function mediaMovil(vals, k) {
    return vals.map(function (_, i) {
      if (i < k || i + k >= vals.length) return null;
      var s = 0;
      for (var j = i - k; j <= i + k; j++) s += vals[j];
      return s / (2 * k + 1);
    });
  }
  function pendiente(xs, ys) {
    var n = xs.length, mx = media(xs), my = media(ys), a = 0, b = 0;
    for (var i = 0; i < n; i++) { a += (xs[i] - mx) * (ys[i] - my); b += (xs[i] - mx) * (xs[i] - mx); }
    return b ? a / b : 0;
  }
  function indice(s) { return Math.round((msDe(s) - A.T0) / DIA); }
  function fechaIso(i) { return iso(new Date(A.T0 + i * DIA)); }
  function fechaLarga(i) { return A.Dd[i] + " de " + MESES[A.M[i]] + " de " + A.Y[i]; }
  function fechaCorta(i) { return A.Dd[i] + " " + MESES_C[A.M[i]] + " " + A.Y[i]; }
  function provisional(i) { return A.prov >= 0 && i >= A.prov; }

  // ---------------------------------------------------------------- gráficos SVG
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

  // Lienzo con ejes. o: {alto, x:[min,max], y:{min,max,ticks}, fmtY, ticksX:[{v,t}], aria}
  function lienzo(el, w, o) {
    el.innerHTML = "";
    var m = { t: 10, r: 10, b: 24, l: o.izq || 38 }, h = o.alto;
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var svg = S_("svg", { width: w, height: h, viewBox: "0 0 " + w + " " + h, role: "img", "aria-label": o.aria });
    var x0 = o.x[0], x1 = o.x[1], y0 = o.y.min, y1 = o.y.max;
    var L = {
      svg: svg, m: m, w: w, h: h, iw: iw, ih: ih,
      sx: function (v) { return m.l + (v - x0) / (x1 - x0) * iw; },
      sy: function (v) { return m.t + (1 - (v - y0) / (y1 - y0)) * ih; },
      ix: function (px) { return x0 + (px - m.l) / iw * (x1 - x0); }
    };
    var ejes = S_("g", { "class": "cl-ejes" }, svg);
    o.y.ticks.forEach(function (v) {
      var y = L.sy(v);
      S_("line", { x1: m.l, x2: w - m.r, y1: y, y2: y, "class": v === 0 ? "cl-base" : "cl-rejilla" }, ejes);
      S_("text", { x: m.l - 6, y: y + 4, "text-anchor": "end", "class": "cl-eje" }, ejes).textContent = (o.fmtY || f0)(v);
    });
    (o.ticksX || []).forEach(function (t) {
      var x = L.sx(t.v);
      if (x < m.l - 1 || x > w - m.r + 1) return;
      S_("text", { x: x, y: h - 6, "text-anchor": t.ancla || "middle", "class": "cl-eje" }, ejes).textContent = t.t;
    });
    L.capa = S_("g", {}, svg);
    el.appendChild(svg);
    return L;
  }
  function ruta(L, xs, ys) {
    var d = "", sigue = false;
    for (var i = 0; i < xs.length; i++) {
      if (ys[i] == null || isNaN(ys[i])) { sigue = false; continue; }
      d += (sigue ? "L" : "M") + L.sx(xs[i]).toFixed(1) + " " + L.sy(ys[i]).toFixed(1);
      sigue = true;
    }
    return d;
  }
  function area(L, xs, y0s, y1s) {
    var d = "", trozo = [];
    function cerrar() {
      if (trozo.length < 2) { trozo = []; return; }
      d += "M" + trozo.map(function (i) { return L.sx(xs[i]).toFixed(1) + " " + L.sy(y1s[i]).toFixed(1); }).join("L");
      d += "L" + trozo.slice().reverse().map(function (i) { return L.sx(xs[i]).toFixed(1) + " " + L.sy(y0s[i]).toFixed(1); }).join("L") + "Z";
      trozo = [];
    }
    for (var i = 0; i < xs.length; i++) {
      if (y0s[i] == null || y1s[i] == null || !isFinite(y0s[i]) || !isFinite(y1s[i])) cerrar(); else trozo.push(i);
    }
    cerrar();
    return d;
  }
  function linea(L, xs, ys, clase) { return S_("path", { d: ruta(L, xs, ys), "class": "cl-linea " + clase, fill: "none" }, L.capa); }
  function regla(L, v, clase, texto) {
    var y = L.sy(v);
    S_("line", { x1: L.m.l, x2: L.w - L.m.r, y1: y, y2: y, "class": "cl-regla " + clase }, L.capa);
    if (texto) S_("text", { x: L.w - L.m.r - 4, y: y - 5, "text-anchor": "end", "class": "cl-etq" }, L.capa).textContent = texto;
  }
  function barras(L, xs, ys, ancho, clase, base) {
    var b = L.sy(base || 0);
    xs.forEach(function (x, i) {
      var v = ys[i]; if (v == null) return;
      var y = L.sy(v), hgt = Math.max(Math.abs(b - y), v ? 1 : 0);
      S_("rect", { x: (L.sx(x) - ancho / 2).toFixed(1), y: Math.min(y, b).toFixed(1), width: Math.max(ancho, 1).toFixed(1), height: hgt.toFixed(1), rx: ancho >= 6 ? 2 : 0, "class": "cl-bar " + clase }, L.capa);
    });
  }
  // Cruz y ficha al pasar el dedo o el ratón. xs: valores x ordenados; tip(i) → html o null
  function interaccion(L, el, xs, tip) {
    var cruz = S_("line", { y1: L.m.t, y2: L.h - L.m.b, "class": "cl-cruz", visibility: "hidden" }, L.svg);
    var zona = S_("rect", { x: L.m.l, y: 0, width: L.iw, height: L.h, fill: "transparent" }, L.svg);
    var caja = document.createElement("div");
    caja.className = "cl-tip"; caja.hidden = true; el.appendChild(caja);
    function ocultar() { cruz.setAttribute("visibility", "hidden"); caja.hidden = true; }
    function mover(ev) {
      var r = L.svg.getBoundingClientRect(), v = L.ix(ev.clientX - r.left);
      var lo = 0, hi = xs.length - 1;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (xs[mid] < v) lo = mid; else hi = mid; }
      var i = Math.abs(xs[lo] - v) <= Math.abs(xs[hi] - v) ? lo : hi, html = tip(i);
      if (html == null) { ocultar(); return; }
      var x = L.sx(xs[i]);
      cruz.setAttribute("x1", x); cruz.setAttribute("x2", x); cruz.setAttribute("visibility", "visible");
      caja.innerHTML = html; caja.hidden = false;
      var cw = caja.offsetWidth, izq = x + 12;
      if (izq + cw > L.w) izq = x - cw - 12;
      caja.style.left = Math.max(0, izq) + "px";
    }
    zona.addEventListener("pointermove", mover);
    zona.addEventListener("pointerdown", mover);
    zona.addEventListener("pointerleave", ocultar);
  }
  function leyenda(el, items) {
    var ul = document.createElement("ul");
    ul.className = "cl-leyenda";
    ul.innerHTML = items.map(function (it) { return '<li><i class="cl-m ' + it[0] + '"></i>' + esc(it[1]) + "</li>"; }).join("");
    el.parentNode.insertBefore(ul, el);
    return ul;
  }
  function ponerLeyenda(el, items) {
    var prev = el.previousElementSibling;
    if (prev && prev.classList.contains("cl-leyenda")) prev.remove();
    leyenda(el, items);
  }
  function ticksAnios(L, a, b) {
    var paso = L.iw < 360 ? 20 : 10, t = [];
    for (var y = Math.ceil(a / paso) * paso; y <= b; y += paso) t.push({ v: y, t: String(y) });
    return t;
  }
  function ticksMeses(w) {
    return CUM.map(function (c, m) { return { v: c + 15, t: w < 480 ? MESES[m][0].toUpperCase() : MESES_C[m] }; });
  }
  function tipHtml(titulo, filas, nota) {
    return "<strong>" + esc(titulo) + "</strong>" + filas.map(function (f) {
      return '<span class="cl-tf">' + (f[2] ? '<i class="cl-m ' + f[2] + '"></i>' : "") + esc(f[0]) + ": <b>" + esc(f[1]) + "</b></span>";
    }).join("") + (nota ? '<span class="cl-tn">' + esc(nota) + "</span>" : "");
  }

  // ---------------------------------------------------------------- un año, día a día
  function datosAnio(y) {
    var a = A.anios[y], xs = [], tx = [], tn = [], acc = [], p = [], idx = [], run = 0;
    for (var i = a.i0; i <= a.i1; i++) {
      xs.push(A.S[i]); idx.push(i); tx.push(A.d.tx[i]); tn.push(A.d.tn[i]); p.push(A.d.p[i]);
      if (A.d.p[i] != null) run += A.d.p[i];
      acc.push(A.d.p[i] == null ? null : run);
    }
    return { a: a, xs: xs, tx: tx, tn: tn, acc: acc, p: p, idx: idx };
  }

  function fichasAnio(y) {
    var Dy = datosAnio(y), a = Dy.a, ult = a.i1, partial = !a.completo;
    var hasta = partial ? " hasta el " + A.Dd[ult] + " de " + MESES[A.M[ult]] : "";
    var pN = N.pAc[A.S[ult]], pct = pN ? a.p / pN * 100 : null;
    // temperatura del periodo comparada con la normal de las mismas fechas
    // (con la semisuma de máxima y mínima en los dos lados, para comparar lo mismo con lo mismo)
    var tAn = 0, c = 0;
    for (var i = a.i0; i <= a.i1; i++) {
      if (A.d.tx[i] == null || A.d.tn[i] == null) continue;
      var s = A.S[i];
      tAn += (A.d.tx[i] + A.d.tn[i]) / 2 - (N.txN[s] + N.tnN[s]) / 2; c++;
    }
    tAn /= c;
    var ixM = -1, inM = -1;
    for (i = a.i0; i <= a.i1; i++) {
      if (A.d.tx[i] != null && (ixM < 0 || A.d.tx[i] > A.d.tx[ixM])) ixM = i;
      if (A.d.tn[i] != null && (inM < 0 || A.d.tn[i] < A.d.tn[inM])) inM = i;
    }
    var fichas = [
      ["Lluvia" + hasta, mm(a.p), pct == null ? "" : f0(pct) + " % de lo normal (" + mm(pN) + ")"],
      ["Temperatura media" + hasta, grados(a.tm), conSigno(tAn) + " °C respecto a lo normal"],
      ["Día más caluroso", grados(A.d.tx[ixM]), fechaLarga(ixM).replace(" de " + y, "")],
      ["Noche más fría", grados(A.d.tn[inM]), fechaLarga(inM).replace(" de " + y, "")],
      ["Días con helada", f0(a.hel), partial ? "en lo que va de año" : "normal: " + f0(N.hel)]
    ];
    $("cl-fichas").innerHTML = fichas.map(function (f) {
      return '<div class="cl-ficha"><span class="cl-fe">' + esc(f[0]) + '</span><span class="cl-fv">' + esc(f[1]) + '</span><span class="cl-fd">' + esc(f[2]) + "</span></div>";
    }).join("");
  }

  function graficoDiaTemp(y) {
    var el = $("g-dia-temp"), Dy = datosAnio(y), slots = [];
    for (var s = 0; s < 366; s++) slots.push(s);
    var lo = Math.min.apply(null, A.tnRec.filter(isFinite)), hi = Math.max.apply(null, A.txRec.filter(isFinite));
    var ye = bonita(lo, hi, 6);
    ponerLeyenda(el, [["cl-calor", "Máxima de " + y], ["cl-frio", "Mínima de " + y], ["cl-normal", "Normal " + N.ref.replace("-", "–")], ["cl-record", "Récords " + A.completos[0].y + "–" + A.Y[A.ultimo]]]);
    registrar(el, function (w) {
      var L = lienzo(el, w, { alto: w < 500 ? 260 : 320, x: [0, 365], y: ye, fmtY: function (v) { return f0(v) + "°"; }, ticksX: ticksMeses(w),
        aria: "Temperaturas máximas y mínimas de cada día de " + y + " comparadas con lo normal y con los récords" });
      S_("path", { d: area(L, slots, A.tnRec, A.txRec), "class": "cl-banda cl-record" }, L.capa);
      S_("path", { d: area(L, slots, N.tnN, N.txN), "class": "cl-banda cl-normal" }, L.capa);
      linea(L, Dy.xs, Dy.tx, "cl-calor");
      linea(L, Dy.xs, Dy.tn, "cl-frio");
      interaccion(L, el, Dy.xs, function (k) {
        var i = Dy.idx[k], s = A.S[i];
        if (A.d.tx[i] == null) return null;
        return tipHtml(fechaLarga(i), [
          ["Máxima", grados(A.d.tx[i]) + " (normal " + f1(N.txN[s]) + ")", "cl-calor"],
          ["Mínima", grados(A.d.tn[i]) + " (normal " + f1(N.tnN[s]) + ")", "cl-frio"],
          ["Lluvia", mm(A.d.p[i])],
          ["Récords del día", f1(A.txRec[s]) + " / " + f1(A.tnRec[s]) + "\u00a0°C"]
        ], provisional(i) ? "Dato provisional" : null);
      });
    });
  }

  function graficoDiaLluvia(y) {
    var el = $("g-dia-lluvia"), Dy = datosAnio(y), slots = [];
    for (var s = 0; s < 366; s++) slots.push(s);
    var maxN = Math.max.apply(null, N.pAc), ye = bonita(0, Math.max(maxN, Dy.a.p) * 1.05, 5);
    ponerLeyenda(el, [["cl-lluvia", "Lluvia de " + y], ["cl-normal-l", "Lo normal " + N.ref.replace("-", "–")]]);
    registrar(el, function (w) {
      var L = lienzo(el, w, { alto: w < 500 ? 220 : 260, x: [0, 365], y: ye, ticksX: ticksMeses(w), fmtY: f0,
        aria: "Lluvia acumulada en " + y + ": " + mm(Dy.a.p) + ", frente a una media de " + mm(maxN) + " al año" });
      linea(L, slots, N.pAc, "cl-normal-l");
      S_("path", { d: area(L, Dy.xs, Dy.xs.map(function () { return 0; }), Dy.acc), "class": "cl-banda cl-lluvia-a" }, L.capa);
      linea(L, Dy.xs, Dy.acc, "cl-lluvia");
      interaccion(L, el, Dy.xs, function (k) {
        var i = Dy.idx[k], s = A.S[i];
        if (Dy.acc[k] == null) return null;
        var pct = N.pAc[s] ? Dy.acc[k] / N.pAc[s] * 100 : null;
        return tipHtml(fechaLarga(i), [
          ["Ese día", mm(A.d.p[i])],
          ["Desde el 1 de enero", mm(Dy.acc[k]), "cl-lluvia"],
          ["Lo normal a esa fecha", mm(N.pAc[s]) + (pct == null ? "" : " (" + f0(pct) + " %)"), "cl-normal-l"]
        ], provisional(i) ? "Dato provisional" : null);
      });
    });
  }

  function verAnio(y) {
    fichasAnio(y); graficoDiaTemp(y); graficoDiaLluvia(y);
  }

  // ---------------------------------------------------------------- año a año
  var DIV = { frio: [[24, 79, 149], [57, 135, 229], [158, 197, 244]], calor: [[245, 184, 176], [227, 73, 72], [163, 36, 36]] };
  function colorAnomalia(v, max, oscuro) {
    var mid = oscuro ? [56, 56, 53] : [240, 239, 236];
    var t = Math.max(-1, Math.min(1, v / max)), stops = t < 0 ? [mid].concat(DIV.frio.slice().reverse()) : [mid].concat(DIV.calor);
    var u = Math.abs(t) * (stops.length - 1), k = Math.min(Math.floor(u), stops.length - 2), f = u - k;
    var c = stops[k].map(function (x, j) { return Math.round(x + (stops[k + 1][j] - x) * f); });
    return "rgb(" + c.join(",") + ")";
  }
  function oscuro() { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; }

  function anioAnio() {
    var C = A.completos, ys = C.map(function (a) { return a.y; }), y0 = ys[0], y1 = ys[ys.length - 1];
    var tms = C.map(function (a) { return a.tm; }), ps = C.map(function (a) { return a.p; });
    var mmT = mediaMovil(tms, 5), mmP = mediaMovil(ps, 5);
    var refTxt = N.ref.replace("-", "–");

    // Texto de tendencia
    var desde = C.filter(function (a) { return a.y >= 1961; });
    var pend = pendiente(desde.map(function (a) { return a.y; }), desde.map(function (a) { return a.tm; })) * 10;
    var calidos = C.slice().sort(function (a, b) { return b.tm - a.tm; }).slice(0, 5).map(function (a) { return a.y; });
    var dec1 = media(C.filter(function (a) { return a.y >= 1961 && a.y <= 1970; }).map(function (a) { return a.tm; }));
    var decN = C.slice(-10), decNm = media(decN.map(function (a) { return a.tm; }));
    $("cl-tendencia").innerHTML = "Desde 1961 la temperatura media de Alaejos ha subido a un ritmo de <strong>" + f1(pend) +
      " °C por década</strong>: los diez últimos años completos (" + decN[0].y + "–" + decN[decN.length - 1].y + ") han tenido de media " + grados(decNm) +
      ", frente a " + grados(dec1) + " en los años sesenta. Los cinco años más cálidos han sido " + calidos.slice(0, 4).join(", ") + " y " + calidos[4] +
      ". Cada franja de abajo es un año: azul si fue más frío de lo normal en " + refTxt + ", rojo si fue más cálido.";

    // Franjas
    var elF = $("g-franjas"), maxAn = 1.6;
    registrar(elF, function (w) {
      elF.innerHTML = "";
      var h = w < 500 ? 56 : 72, bw = w / C.length;
      var svg = S_("svg", { width: w, height: h + 18, viewBox: "0 0 " + w + " " + (h + 18), role: "img",
        "aria-label": "Franjas de temperatura de " + y0 + " a " + y1 + ": de azul (años fríos) a rojo (años cálidos)" });
      var osc = oscuro();
      C.forEach(function (a, i) {
        S_("rect", { x: (i * bw).toFixed(2), y: 0, width: (bw + 0.6).toFixed(2), height: h, fill: colorAnomalia(a.tm - N.tm, maxAn, osc) }, svg);
      });
      [y0, Math.round((y0 + y1) / 2 / 10) * 10, y1].forEach(function (yy, k) {
        var i = ys.indexOf(yy); if (i < 0) return;
        S_("text", { x: k === 0 ? 0 : k === 2 ? w : (i + 0.5) * bw, y: h + 14, "text-anchor": k === 0 ? "start" : k === 2 ? "end" : "middle", "class": "cl-eje" }, svg).textContent = yy;
      });
      elF.appendChild(svg);
      var L = { svg: svg, m: { t: 0, b: 18, l: 0, r: 0 }, w: w, h: h + 18, iw: w, sx: function (v) { return (v - y0 + 0.5) * bw; }, ix: function (px) { return px / bw + y0 - 0.5; } };
      interaccion(L, elF, ys, function (i) {
        return tipHtml(String(C[i].y), [["Temperatura media", grados(C[i].tm)], ["Respecto a lo normal", conSigno(C[i].tm - N.tm) + "\u00a0°C"]]);
      });
    });

    // Temperatura anual
    var elT = $("g-anual-temp"), yeT = bonita(Math.min.apply(null, tms) - 0.2, Math.max.apply(null, tms) + 0.2, 5);
    var rankT = C.slice().sort(function (a, b) { return b.tm - a.tm; }).map(function (a) { return a.y; });
    ponerLeyenda(elT, [["cl-punto", "Cada año"], ["cl-tinta", "Media de 11 años"], ["cl-regla-l", "Media " + refTxt + " (" + grados(N.tm) + ")"]]);
    registrar(elT, function (w) {
      var L = lienzo(elT, w, { alto: w < 500 ? 220 : 260, x: [y0 - 1, y1 + 1], y: yeT, ticksX: ticksAnios({ iw: w - 48 }, y0, y1), fmtY: function (v) { return f1(v) + "°"; }, izq: 44,
        aria: "Temperatura media de cada año de " + y0 + " a " + y1 + "; sube " + f1(pend) + " °C por década desde 1961" });
      regla(L, N.tm, "cl-regla-l");
      linea(L, ys, mmT, "cl-tinta");
      C.forEach(function (a) { S_("circle", { cx: L.sx(a.y), cy: L.sy(a.tm), r: w < 500 ? 2.5 : 3.2, "class": "cl-punto" }, L.capa); });
      interaccion(L, elT, ys, function (i) {
        return tipHtml(String(C[i].y), [["Temperatura media", grados(C[i].tm)], ["Respecto a lo normal", conSigno(C[i].tm - N.tm) + "\u00a0°C"],
          ["Puesto", (rankT.indexOf(C[i].y) + 1) + "º más cálido de " + C.length]]);
      });
    });

    // Lluvia anual
    var elP = $("g-anual-lluvia"), yeP = bonita(0, Math.max.apply(null, ps) * 1.05, 5);
    var rankP = C.slice().sort(function (a, b) { return b.p - a.p; }).map(function (a) { return a.y; });
    var gauge = PLUVIOMETRO.media;
    ponerLeyenda(elP, [["cl-lluvia-b", "Cada año"], ["cl-tinta", "Media de 11 años"], ["cl-regla-l", "Media " + refTxt + " (" + mm(N.p) + ")"], ["cl-regla-p", "Pluviómetro de Alaejos " + PLUVIOMETRO.desde + "–" + PLUVIOMETRO.hasta + " (" + f0(gauge) + "\u00a0mm)"]]);
    registrar(elP, function (w) {
      var L = lienzo(elP, w, { alto: w < 500 ? 220 : 260, x: [y0 - 1, y1 + 1], y: yeP, ticksX: ticksAnios({ iw: w - 48 }, y0, y1), fmtY: f0,
        aria: "Lluvia de cada año de " + y0 + " a " + y1 + ", con una media de " + mm(N.p) + " en " + refTxt });
      var bw = Math.max(1, L.iw / (y1 - y0 + 2) - 2);
      barras(L, ys, ps, bw, "cl-lluvia");
      regla(L, N.p, "cl-regla-l");
      regla(L, gauge, "cl-regla-p");
      linea(L, ys, mmP, "cl-tinta");
      interaccion(L, elP, ys, function (i) {
        return tipHtml(String(C[i].y), [["Lluvia", mm(C[i].p)], ["Respecto a lo normal", f0(C[i].p / N.p * 100) + " %"],
          ["Puesto", (rankP.indexOf(C[i].y) + 1) + "º más lluvioso de " + C.length]]);
      });
    });

    // Tabla anual (todos los años, el último quizá incompleto)
    var filas = A.lista.slice().reverse().map(function (a) {
      var nota = a.completo ? "" : ' <span class="nota">hasta el ' + A.Dd[a.i1] + " " + MESES_C[A.M[a.i1]] + "</span>";
      return "<tr><td>" + a.y + nota + '</td><td class="num">' + f1(a.tm) + '</td><td class="num">' + f1(a.tx) + '</td><td class="num">' + f1(a.tn) +
        '</td><td class="num">' + f0(a.p) + '</td><td class="num">' + a.hel + '</td><td class="num">' + a.c35 + "</td></tr>";
    }).join("");
    $("t-anual").innerHTML = '<table class="tabla"><thead><tr><th>Año</th><th class="num">Media °C</th><th class="num">Máx. media</th><th class="num">Mín. media</th>' +
      '<th class="num">Lluvia mm</th><th class="num">Heladas</th><th class="num">≥ 35 °C</th></tr></thead><tbody>' + filas + "</tbody></table>";
  }

  // ---------------------------------------------------------------- mes a mes
  var N61, N91;
  function mesAMes() {
    N61 = normales("1961-1990"); N91 = normales("1991-2020");
    var xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var tm61 = N61.meses.map(function (m) { return m.tm; }), tm91 = N91.meses.map(function (m) { return m.tm; });
    var p61 = N61.meses.map(function (m) { return m.p; }), p91 = N91.meses.map(function (m) { return m.p; });
    function tx(w) { return xs.map(function (m) { return { v: m, t: w < 480 ? MESES[m][0].toUpperCase() : MESES_C[m] }; }); }

    var elT = $("g-mes-temp"), yeT = bonita(Math.min.apply(null, tm61.concat(tm91)), Math.max.apply(null, tm61.concat(tm91)), 5);
    ponerLeyenda(elT, [["cl-antes", "1961–1990"], ["cl-ahora", "1991–2020"]]);
    registrar(elT, function (w) {
      var L = lienzo(elT, w, { alto: w < 500 ? 220 : 250, x: [-0.5, 11.5], y: yeT, ticksX: tx(w), fmtY: function (v) { return f0(v) + "°"; },
        aria: "Temperatura media de cada mes en 1961–1990 y en 1991–2020" });
      linea(L, xs, tm61, "cl-antes"); linea(L, xs, tm91, "cl-ahora");
      xs.forEach(function (m) {
        S_("circle", { cx: L.sx(m), cy: L.sy(tm61[m]), r: 3.5, "class": "cl-p-antes" }, L.capa);
        S_("circle", { cx: L.sx(m), cy: L.sy(tm91[m]), r: 3.5, "class": "cl-p-ahora" }, L.capa);
      });
      interaccion(L, elT, xs, function (m) {
        return tipHtml(MESES[m][0].toUpperCase() + MESES[m].slice(1), [
          ["1961–1990", grados(tm61[m]) + " (" + f1(N61.meses[m].tn) + " / " + f1(N61.meses[m].tx) + ")", "cl-antes"],
          ["1991–2020", grados(tm91[m]) + " (" + f1(N91.meses[m].tn) + " / " + f1(N91.meses[m].tx) + ")", "cl-ahora"],
          ["Diferencia", conSigno(tm91[m] - tm61[m]) + "\u00a0°C"]], "Entre paréntesis, mínima / máxima medias");
      });
    });

    var elP = $("g-mes-lluvia"), yeP = bonita(0, Math.max.apply(null, p61.concat(p91)) * 1.08, 4);
    ponerLeyenda(elP, [["cl-antes", "1961–1990"], ["cl-ahora", "1991–2020"]]);
    registrar(elP, function (w) {
      var L = lienzo(elP, w, { alto: w < 500 ? 200 : 230, x: [-0.5, 11.5], y: yeP, ticksX: tx(w), fmtY: f0,
        aria: "Lluvia media de cada mes en 1961–1990 y en 1991–2020" });
      var bw = Math.max(3, L.iw / 12 / 2 - 4);
      barras(L, xs.map(function (m) { return m - (bw / 2 + 1) / (L.iw / 12); }), p61, bw, "cl-antes");
      barras(L, xs.map(function (m) { return m + (bw / 2 + 1) / (L.iw / 12); }), p91, bw, "cl-ahora");
      interaccion(L, elP, xs, function (m) {
        return tipHtml(MESES[m][0].toUpperCase() + MESES[m].slice(1), [["1961–1990", mm(p61[m]), "cl-antes"], ["1991–2020", mm(p91[m]), "cl-ahora"],
          ["Diferencia", conSigno(p91[m] - p61[m]) + "\u00a0mm"]]);
      });
    });

    $("t-mes").innerHTML = '<table class="tabla"><thead><tr><th>Mes</th><th class="num">Temp. 1961–90</th><th class="num">Temp. 1991–2020</th>' +
      '<th class="num">Lluvia 1961–90</th><th class="num">Lluvia 1991–2020</th></tr></thead><tbody>' +
      xs.map(function (m) {
        return "<tr><td>" + MESES[m][0].toUpperCase() + MESES[m].slice(1) + '</td><td class="num">' + f1(tm61[m]) + '</td><td class="num">' + f1(tm91[m]) +
          '</td><td class="num">' + f0(p61[m]) + '</td><td class="num">' + f0(p91[m]) + "</td></tr>";
      }).join("") +
      '<tr><td><strong>Año</strong></td><td class="num"><strong>' + f1(N61.tm) + '</strong></td><td class="num"><strong>' + f1(N91.tm) +
      '</strong></td><td class="num"><strong>' + f0(N61.p) + '</strong></td><td class="num"><strong>' + f0(N91.p) + "</strong></td></tr></tbody></table>";
  }

  // ---------------------------------------------------------------- heladas y calores
  function heladasCalor() {
    var C = A.completos, ys = C.map(function (a) { return a.y; }), y0 = ys[0], y1 = ys[ys.length - 1];
    function grafico(el, vals, clase, nombre, normal) {
      var ye = bonita(0, Math.max.apply(null, vals) * 1.05 || 1, 4), mmv = mediaMovil(vals, 5);
      ponerLeyenda(el, [[clase, "Cada año"], ["cl-tinta", "Media de 11 años"]]);
      registrar(el, function (w) {
        var L = lienzo(el, w, { alto: w < 500 ? 180 : 210, x: [y0 - 1, y1 + 1], y: ye, ticksX: ticksAnios({ iw: w - 48 }, y0, y1), fmtY: f0,
          aria: nombre + " de cada año de " + y0 + " a " + y1 });
        barras(L, ys, vals, Math.max(1, L.iw / (y1 - y0 + 2) - 2), clase);
        linea(L, ys, mmv, "cl-tinta");
        interaccion(L, el, ys, function (i) {
          return tipHtml(String(ys[i]), [[nombre, f0(vals[i])], ["Normal " + N.ref.replace("-", "–"), f0(normal)]]);
        });
      });
    }
    grafico($("g-heladas"), C.map(function (a) { return a.hel; }), "cl-frio-b", "Días con helada", N.hel);
    var u = $("cl-umbral").value;
    grafico($("g-calor"), C.map(function (a) { return u === "30" ? a.c30 : a.c35; }), "cl-calor-b", "Días de " + u + " °C o más", u === "30" ? N.c30 : N.c35);
    var h61 = media(C.filter(function (a) { return a.y >= 1961 && a.y <= 1990; }).map(function (a) { return a.hel; }));
    var hN = media(C.slice(-10).map(function (a) { return a.hel; }));
    var c61 = media(C.filter(function (a) { return a.y >= 1961 && a.y <= 1990; }).map(function (a) { return a.c30; }));
    var cN = media(C.slice(-10).map(function (a) { return a.c30; }));
    $("cl-extremos-txt").textContent = "Entre 1961 y 1990 helaba de media " + f0(h61) + " días al año; en los diez últimos años, " + f0(hN) +
      ". Los días de 30\u00a0°C o más han pasado de " + f0(c61) + " a " + f0(cN) + " al año.";
  }

  // ---------------------------------------------------------------- récords
  function records() {
    var hasta = A.prov >= 0 ? A.prov - 1 : A.ultimo, idx = [];
    for (var i = 0; i <= hasta; i++) if (A.d.tx[i] != null) idx.push(i);
    function top(cmp, n) { return idx.slice().sort(cmp).slice(0, n); }
    var calor = top(function (a, b) { return A.d.tx[b] - A.d.tx[a]; }, 10);
    var frio = top(function (a, b) { return A.d.tn[a] - A.d.tn[b]; }, 10);
    var lluvia = top(function (a, b) { return A.d.p[b] - A.d.p[a]; }, 10);
    function tabla(titulo, lista, v, u) {
      return '<div class="tabla-env"><table class="tabla cl-top"><caption>' + esc(titulo) + "</caption><tbody>" + lista.map(function (i, k) {
        return '<tr><td class="num">' + (k + 1) + "</td><td>" + fechaLarga(i) + '</td><td class="num">' + u(v[i]) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    }
    var C = A.completos;
    function ext(key, mayor) { return C.reduce(function (a, b) { return (mayor ? b[key] > a[key] : b[key] < a[key]) ? b : a; }); }
    var ac = ext("tm", true), af = ext("tm", false), al = ext("p", true), as = ext("p", false);
    var anios = '<div class="tabla-env"><table class="tabla"><caption>Años extremos</caption><tbody>' +
      "<tr><td>Más cálido</td><td>" + ac.y + '</td><td class="num">' + grados(ac.tm) + "</td></tr>" +
      "<tr><td>Más frío</td><td>" + af.y + '</td><td class="num">' + grados(af.tm) + "</td></tr>" +
      "<tr><td>Más lluvioso</td><td>" + al.y + '</td><td class="num">' + mm(al.p) + "</td></tr>" +
      "<tr><td>Más seco</td><td>" + as.y + '</td><td class="num">' + mm(as.p) + "</td></tr></tbody></table></div>";
    $("t-records").innerHTML = tabla("Los días más calurosos", calor, A.d.tx, grados) + tabla("Las noches más frías", frio, A.d.tn, grados) +
      tabla("Los días más lluviosos", lluvia, A.d.p, mm) + anios;
  }

  // ---------------------------------------------------------------- un día concreto
  function verDia() {
    var inp = $("cl-fecha"), out = $("cl-dia");
    if (!inp.value) { out.innerHTML = ""; return; }
    var i = indice(inp.value);
    if (i < 0 || i > A.ultimo || A.d.tx[i] == null) { out.innerHTML = "<p>No hay datos de esa fecha. Hay desde el 1 de enero de 1940 hasta el " + fechaLarga(A.ultimo) + ".</p>"; return; }
    var s = A.S[i], y = A.Y[i], m = A.M[i], a = A.anios[y], mes = a.meses[m];
    var dx = A.d.tx[i] - N.txN[s], dn = A.d.tn[i] - N.tnN[s];
    var notas = [];
    if (A.txRecI[s] === i) notas.push("Es la máxima más alta registrada en un " + A.Dd[i] + " de " + MESES[m] + ".");
    if (A.tnRecI[s] === i) notas.push("Es la mínima más baja registrada en un " + A.Dd[i] + " de " + MESES[m] + ".");
    if (A.pRecI[s] === i && A.d.p[i] > 0) notas.push("Es el " + A.Dd[i] + " de " + MESES[m] + " más lluvioso registrado.");
    var mesTxt = mes.completo ? "Todo " + MESES[m] + " de " + y + ": " + mm(mes.p) + " de lluvia (lo normal son " + mm(N.meses[m].p) + ") y " + grados(mes.tm) + " de media (normal " + grados(N.meses[m].tm) + ")." : "";
    function dif(v) { return Math.abs(v) < 0.5 ? "lo normal para esa fecha" : f1(Math.abs(v)) + " °C " + (v > 0 ? "más" : "menos") + " de lo normal"; }
    out.innerHTML = '<div class="cl-ficha cl-ficha-dia"><span class="cl-fe">' + esc(fechaLarga(i)) + (provisional(i) ? " · dato provisional" : "") + "</span>" +
      '<ul><li>Máxima: <b>' + grados(A.d.tx[i]) + "</b>, " + dif(dx) + "</li>" +
      "<li>Mínima: <b>" + grados(A.d.tn[i]) + "</b>, " + dif(dn) + "</li>" +
      "<li>Lluvia: <b>" + (A.d.p[i] >= 0.1 ? mm(A.d.p[i]) : "no llovió") + "</b></li></ul>" +
      (notas.length ? "<p><strong>" + esc(notas.join(" ")) + "</strong></p>" : "") + (mesTxt ? '<p class="cl-fd">' + esc(mesTxt) + "</p>" : "") + "</div>";
  }

  // ---------------------------------------------------------------- comparación y descarga
  function comparacion() {
    var C = A.completos.filter(function (a) { return a.y >= PLUVIOMETRO.desde && a.y <= PLUVIOMETRO.hasta; });
    if (!C.length) return;
    var pm = media(C.map(function (a) { return a.p; })), dif = (pm / PLUVIOMETRO.media - 1) * 100;
    var p = $("cl-comparacion"), extra = document.createElement("span");
    extra.textContent = " Para esos mismos años, ERA5 da " + f0(pm) + " litros de media" +
      (Math.abs(dif) < 10 ? ": una cifra muy parecida." :
        ", un " + f0(Math.abs(dif)) + " % " + (dif > 0 ? "más" : "menos") + " que el pluviómetro. Por eso, para las cantidades exactas de lluvia vale más el pluviómetro; estos datos sirven para comparar unos años con otros.");
    p.appendChild(extra);
  }
  function csv() {
    var b = $("cl-csv");
    b.disabled = false;
    b.addEventListener("click", function () {
      var filas = ["fecha,maxima_C,minima_C,media_C,lluvia_mm,provisional"];
      for (var i = 0; i <= A.ultimo; i++) {
        filas.push([fechaIso(i), A.d.tx[i], A.d.tn[i], A.d.tm[i], A.d.p[i], provisional(i) ? "si" : ""].map(function (v) { return v == null ? "" : v; }).join(","));
      }
      var url = URL.createObjectURL(new Blob([filas.join("\n") + "\n"], { type: "text/csv" }));
      var a = document.createElement("a");
      a.href = url; a.download = "clima-alaejos-1940-" + A.Y[A.ultimo] + ".csv";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    });
  }

  // ---------------------------------------------------------------- arranque
  function dibujarTodo() {
    N = normales(REF);
    verAnio(+$("cl-anio").value);
    anioAnio();
    heladasCalor();
    verDia();
  }
  function iniciar(d, aviso) {
    A = preparar(d);
    raiz.classList.add("cl-listo");
    var ult = A.ultimo, selA = $("cl-anio");
    selA.innerHTML = A.lista.slice().reverse().map(function (a) { return '<option value="' + a.y + '">' + a.y + (a.completo ? "" : " (en curso)") + "</option>"; }).join("");
    var inp = $("cl-fecha");
    inp.min = d.t0; inp.max = fechaIso(ult); inp.value = fechaIso(ult);
    estado.textContent = (aviso ? aviso + " " : "") + "Datos diarios del 1 de enero de 1940 al " + fechaLarga(ult) +
      (A.prov >= 0 ? " (desde el " + fechaLarga(A.prov).replace(/ de \d{4}$/, "") + ", provisionales)" : "") + ".";
    mesAMes();
    dibujarTodo();
    records();
    comparacion();
    csv();
    selA.addEventListener("change", function () { verAnio(+selA.value); });
    $("cl-ref").addEventListener("change", function (e) { REF = e.target.value; dibujarTodo(); });
    $("cl-umbral").addEventListener("change", heladasCalor);
    inp.addEventListener("change", verDia);
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", function () { anioAnio(); });
    }
  }
  function fallo(e) {
    if (window.console) console.warn("Clima: no se pudieron descargar los datos", e);
    // Sin datos, los gráficos quedarían vacíos: se ocultan y queda solo la explicación de las fuentes.
    Array.prototype.forEach.call(document.querySelectorAll(".cl-sec, .cl-barra .cl-control"), function (s) {
      if (s.getAttribute("aria-labelledby") !== "de-donde-salen-los-datos") s.style.display = "none";
    });
    raiz.classList.add("cl-listo");
    estado.innerHTML = "";
    estado.appendChild(document.createTextNode("El servicio que da los datos del tiempo no responde ahora mismo. Pruebe dentro de un rato. "));
    var b = document.createElement("button");
    b.type = "button"; b.className = "cl-boton"; b.textContent = "Volver a intentarlo";
    b.addEventListener("click", function () { location.reload(); });
    estado.appendChild(b);
  }

  var hoy = hoyMadrid(), cache = leerCache();
  if (cache && cache.hoy === hoy && cache.d && cache.d.p && cache.d.p.length) {
    iniciar(cache.d);
  } else {
    descargar(hoy).then(function (d) {
      if (!d.p.length) throw new Error("respuesta vacía");
      guardarCache(hoy, d);
      iniciar(d);
    }).catch(function (e) {
      if (cache && cache.d && cache.d.p && cache.d.p.length) iniciar(cache.d, "No se ha podido actualizar; se muestran los datos guardados del " + cache.hoy.split("-").reverse().join("/") + ".");
      else fallo(e);
    });
  }
})();
