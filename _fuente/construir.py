#!/usr/bin/env python3
"""Genera las páginas de www.amigosdealaejos.org a partir de los textos de _fuente/paginas/.

    _fuente/paginas/NOMBRE.html   texto de cada página (solo el contenido)
    -> RUTA/index.html            página completa, con cabecera, menú y pie

Uso:  python3 _fuente/construir.py
Para añadir una página: escribe su texto en _fuente/paginas/ y añádela a PAGINAS.
"""
from pathlib import Path
from datetime import date
import html

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "_fuente" / "paginas"
URL_BASE = "https://www.amigosdealaejos.org/"
NOMBRE = "Amigos de Alaejos"
LEMA = "Historia, patrimonio y memoria de la villa"

# Formulario de contacto (página «Colabora"). Los mensajes los recibe un script de Google
# Apps Script (_fuente/formulario-contacto.gs) y los reenvía por correo sin mostrar la dirección.
# ENDPOINT_FORMULARIO es la URL /exec de ese script; mientras esté vacía, el formulario no envía.
ENDPOINT_FORMULARIO = "https://script.google.com/macros/s/AKfycbz3MEZs8WffWujrJs6xeLY4Q9Nj5Z9IMLr7p3caSVsItI-HrvT3oBBd1hXvb9rl51zqBw/exec"
CLAVE_FORMULARIO = "ada-web-2026"  # la misma que CLAVE en el script

REDES = [
    ("Instagram", "https://www.instagram.com/amigosdealaejos"),
    ("Facebook", "https://www.facebook.com/profile.php?id=61578701685714"),
    ("YouTube", "https://www.youtube.com/channel/UCeJp_c3fFBxIgiIaiYS2_iQ"),
]
OTRAS_WEBS = [
    ("Biblioteca de los programas de fiestas", "https://biblioteca.amigosdealaejos.org/"),
    ("Beato Donato Jiménez Bibiano", "https://beatodonato.com/"),
]

# Menú principal: (clave, etiqueta, ruta)
MENU = [
    ("inicio", "Inicio", ""),
    ("biblioteca", "Biblioteca", "biblioteca/"),
    ("historia", "Historia", "historia-del-pueblo/"),
    ("patrimonio", "Patrimonio", "patrimonio/"),
    ("fiestas", "Fiestas", "fiestas-y-eventos/"),
    ("personas", "Personas", "personas-de-alaejos/"),
    ("novedades", "Novedades", "novedades/"),
    ("colabora", "Colabora", "colabora/"),
]

# Subapartados de Patrimonio, en el orden en que se leen
PATRIMONIO = [
    ("Iglesia de Santa María", "patrimonio/iglesia-de-santa-maria/"),
    ("Iglesia de San Pedro", "patrimonio/iglesia-de-san-pedro/"),
    ("Ermita de la Virgen de la Casita", "patrimonio/la-ermita-de-la-virgen-de-la-casita/"),
    ("El castillo", "patrimonio/el-castillo/"),
]

# Páginas: (ruta, fragmento, clave del menú, título, descripción)
PAGINAS = [
    ("", "inicio", "inicio", NOMBRE + " · " + LEMA,
     "Archivo abierto sobre Alaejos (Valladolid): historia, patrimonio, fiestas y personas de la villa, reunidos desde archivos, publicaciones y colecciones particulares."),
    ("biblioteca/", "biblioteca", "biblioteca", "Biblioteca",
     "Textos sobre Alaejos para leer y descargar: los 178 artículos de los programas de fiestas (1954–2026) y otras publicaciones."),
    ("historia-del-pueblo/", "historia", "historia", "Historia del pueblo",
     "Alaejos, villa de señorío de los Fonseca en Tierra de Medina: el encierro de la reina Juana de Portugal, el cerco comunero de 1520 y el despoblado de Valdefuentes."),
    ("patrimonio/", "patrimonio", "patrimonio", "Patrimonio",
     "Las iglesias de Santa María y San Pedro, la ermita de la Virgen de la Casita y el castillo de los Fonseca: el patrimonio monumental de Alaejos."),
    ("patrimonio/iglesia-de-santa-maria/", "santa-maria", "patrimonio", "Iglesia de Santa María",
     "La iglesia parroquial de Santa María de Alaejos: edificio del siglo XVI en ladrillo, torre de 64 metros y retablo mayor de Esteban Jordán."),
    ("patrimonio/iglesia-de-san-pedro/", "san-pedro", "patrimonio", "Iglesia de San Pedro",
     "La iglesia de San Pedro Apóstol de Alaejos, en la Plaza Mayor: bóvedas de yesería, grisallas del presbiterio y retablo de Juan Sáenz de la Torrecilla (1602)."),
    ("patrimonio/la-ermita-de-la-virgen-de-la-casita/", "casita", "patrimonio", "Ermita de la Virgen de la Casita",
     "El santuario de Nuestra Señora de la Casita, patrona de Alaejos: origen de la devoción, la ermita, la romería del 10 de mayo y las fiestas de septiembre."),
    ("patrimonio/el-castillo/", "castillo", "patrimonio", "El castillo",
     "Las ruinas del castillo de los Fonseca en Alaejos: su construcción hacia 1453, el cerco comunero de 1520 y lo que se conserva hoy."),
    ("fiestas-y-eventos/", "fiestas", "fiestas", "Fiestas y eventos",
     "El año festivo de Alaejos, de los Quintos a las fiestas de la Virgen de la Casita, y la colección de programas de fiestas desde 1954."),
    ("personas-de-alaejos/", "personas", "personas", "Personas de Alaejos",
     "Alaejanos de los que ha quedado memoria: semblanzas y documentación."),
    ("novedades/", "novedades", "novedades", "Novedades",
     "Lo último que se ha incorporado a Amigos de Alaejos."),
    ("colabora/", "colabora", "colabora", "Colabora",
     "Cómo aportar fotografías, programas de fiestas y documentos sobre Alaejos para que se digitalicen y se publiquen."),
]

# Direcciones antiguas de Google Sites que deben seguir funcionando
REDIRECCIONES = {
    "inicio/": "",
    "patrimonio/iglesia-de-santa-maría/": "patrimonio/iglesia-de-santa-maria/",
    "programas-de-las-fiestas-de-alaejos/": "fiestas-y-eventos/#programas",
}

FUENTES_WEB = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
               '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
               '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+DW+Pica:ital@0;1'
               '&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&family=Source+Sans+3:wght@400;600&display=swap">')


def profundidad(ruta: str) -> str:
    """Prefijo relativo para llegar a la raíz desde una ruta ('', 'a/', 'a/b/')."""
    return "../" * ruta.count("/")


def esc(t: str) -> str:
    return html.escape(t, quote=True)


def cabecera(ruta, clave, base):
    enlaces = []
    for k, etiqueta, destino in MENU:
        atr = ""
        if destino == ruta:
            atr = ' aria-current="page"'
        elif k == clave:
            atr = ' class="dentro"'
        enlaces.append(f'<a href="{base}{destino}"{atr}>{etiqueta}</a>')
    out = (f'<header class="cab"><div class="cab-in"><a class="marca" href="{base}">'
           f'<span class="escudo" aria-hidden="true"></span><span class="marca-txt">'
           f'<span class="marca-1">{NOMBRE}</span><span class="marca-2">{LEMA}</span></span></a>'
           f'<nav class="menu" aria-label="Secciones">{"".join(enlaces)}</nav></div></header>')
    if clave == "patrimonio":
        cur = ' aria-current="page"' if ruta == "patrimonio/" else ""
        sub = [f'<a href="{base}patrimonio/"{cur}>Presentación</a>']
        for etiqueta, destino in PATRIMONIO:
            cur = ' aria-current="page"' if destino == ruta else ""
            sub.append(f'<a href="{base}{destino}"{cur}>{etiqueta}</a>')
        out += ('<nav class="submenu" aria-label="Patrimonio"><span class="submenu-tit">Patrimonio</span>'
                + "".join(sub) + '</nav>')
    return out


def vecinos(ruta, base):
    """Anterior / siguiente dentro de Patrimonio."""
    orden = [("Patrimonio", "patrimonio/")] + PATRIMONIO
    rutas = [r for _, r in orden]
    if ruta not in rutas:
        return ""
    i = rutas.index(ruta)
    partes = []
    if i > 0:
        partes.append(f'<a href="{base}{orden[i-1][1]}"><span>Anterior</span>{orden[i-1][0]}</a>')
    if i < len(orden) - 1:
        partes.append(f'<a class="sig" href="{base}{orden[i+1][1]}"><span>Siguiente</span>{orden[i+1][0]}</a>')
    return '<nav class="vecinos" aria-label="Recorrido por el patrimonio">' + "".join(partes) + '</nav>'


def pie(base):
    redes = "".join(f'<a href="{u}" rel="me">{n}</a>' for n, u in REDES)
    otras = "".join(f'<a href="{u}">{n}</a>' for n, u in OTRAS_WEBS)
    return (f'<footer class="pie"><div class="pie-in"><div class="horizonte" aria-hidden="true"></div>'
            f'<p><strong>{NOMBRE}.</strong> Archivo abierto de historia, patrimonio y memoria de la villa de Alaejos (Valladolid).</p>'
            f'<p>Los materiales se publican con fines de consulta, estudio y divulgación, sin ánimo de lucro e indicando siempre que es posible su procedencia. '
            f'Si es titular de algún contenido y prefiere que no figure aquí, <a href="{base}colabora/">díganoslo</a> y lo retiraremos.</p>'
            f'<div class="redes">{redes}</div><div class="otras">{otras}</div></div></footer>')


def pagina(ruta, titulo, descripcion, cuerpo, clave, es_portada=False):
    base = profundidad(ruta)
    titulo_completo = titulo if es_portada else f"{titulo} · {NOMBRE}"
    url = URL_BASE + ruta
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(titulo_completo)}</title>
<meta name="description" content="{esc(descripcion)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{esc(titulo_completo)}"><meta property="og:description" content="{esc(descripcion)}"><meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="{NOMBRE}"><meta property="og:image" content="{URL_BASE}assets/og.png">
<meta name="theme-color" content="#FDFCFA">
<link rel="icon" href="{base}assets/escudo.png">
{FUENTES_WEB}
<link rel="stylesheet" href="{base}assets/estilo.css">
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
{cabecera(ruta, clave, base)}
{cuerpo}
{pie(base)}
</body>
</html>
"""


def redireccion(destino_abs):
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>{NOMBRE}</title>
<link rel="canonical" href="{destino_abs}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={destino_abs}"></head>
<body><p>Esta página ha cambiado de dirección: <a href="{destino_abs}">{destino_abs}</a></p></body></html>
"""


def construir():
    hoy = date.today().isoformat()
    urls = []
    for ruta, frag, clave, titulo, desc in PAGINAS:
        texto = (FUENTE / f"{frag}.html").read_text(encoding="utf-8")
        base = profundidad(ruta)
        texto = texto.replace("{{BASE}}", base)
        if frag == "colabora":
            texto = texto.replace("{{CONTACTO}}", contacto())
        if ruta == "":
            cuerpo = f'<main id="contenido">{texto}</main>'
        else:
            cuerpo = f'<main id="contenido" class="lectura">{texto}{vecinos(ruta, base)}</main>'
        destino = RAIZ / ruta / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(pagina(ruta, titulo, desc, cuerpo, clave, es_portada=(ruta == "")), encoding="utf-8")
        urls.append(URL_BASE + ruta)

    for vieja, nueva in REDIRECCIONES.items():
        destino = RAIZ / vieja / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(redireccion(URL_BASE + nueva), encoding="utf-8")

    # 404: rutas absolutas, porque GitHub la sirve desde cualquier carpeta
    cuerpo404 = ('<main id="contenido" class="lectura"><h1 class="h-pag">No encontramos esa página</h1>'
                 '<p>Puede que la dirección esté mal escrita o que la página haya cambiado de sitio al trasladar la web. '
                 'Vuelva a la <a href="/">portada</a> o busque en la <a href="https://biblioteca.amigosdealaejos.org/">biblioteca</a>.</p></main>')
    t404 = pagina("x/", "Página no encontrada", "Página no encontrada.", cuerpo404, "")
    t404 = t404.replace('href="../', 'href="/').replace('<link rel="canonical" href="https://www.amigosdealaejos.org/x/">', '')
    (RAIZ / "404.html").write_text(t404, encoding="utf-8")

    mapa = "".join(f"<url><loc>{u}</loc><lastmod>{hoy}</lastmod></url>" for u in urls)
    (RAIZ / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + mapa + "</urlset>\n", encoding="utf-8")
    (RAIZ / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {URL_BASE}sitemap.xml\n", encoding="utf-8")
    print(f"{len(PAGINAS)} páginas y {len(REDIRECCIONES)} redirecciones generadas.")


def contacto():
    return FORMULARIO.replace("{{ENDPOINT}}", ENDPOINT_FORMULARIO).replace("{{CLAVE}}", CLAVE_FORMULARIO)


FORMULARIO = """<form class="form" id="form-contacto" novalidate>
  <div class="fila">
    <div class="campo"><label for="f-nombre">Nombre</label><input id="f-nombre" name="nombre" type="text" autocomplete="name" required></div>
    <div class="campo"><label for="f-email">Su correo electrónico</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
  </div>
  <div class="campo"><label for="f-motivo">Motivo</label>
    <select id="f-motivo" name="motivo">
      <option value="material">Tengo fotografías, programas o documentos</option>
      <option value="correccion">Una corrección o un dato</option>
      <option value="otra">Otra consulta</option>
    </select></div>
  <div class="campo"><label for="f-mensaje">Mensaje</label><textarea id="f-mensaje" name="mensaje" required></textarea></div>
  <div class="trampa" aria-hidden="true"><label for="f-web">No rellenar</label><input id="f-web" name="web" type="text" tabindex="-1" autocomplete="off"></div>
  <label class="consent" for="f-acepto"><input id="f-acepto" name="acepto" type="checkbox" required><span>Acepto que mis datos se usen solo para responder a este mensaje.</span></label>
  <button class="btn enviar" id="f-enviar" type="submit">Enviar mensaje</button>
  <p class="estado" id="f-estado" role="status" aria-live="polite"></p>
</form>
<script>
(function(){
  var ENDPOINT="{{ENDPOINT}}", CLAVE="{{CLAVE}}", abierto=Date.now();
  var form=document.getElementById('form-contacto'), estado=document.getElementById('f-estado'), btn=document.getElementById('f-enviar');
  function aviso(t,tipo){estado.textContent=t;estado.className='estado'+(tipo?' '+tipo:'');}
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var d={nombre:form.nombre.value.trim(),email:form.email.value.trim(),motivo:form.motivo.value,
           mensaje:form.mensaje.value.trim(),web:form.web.value,k:CLAVE,t:Date.now()-abierto};
    if(!d.nombre||!d.email||!d.mensaje){aviso('Escriba su nombre, su correo y el mensaje.','error');return;}
    if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(d.email)){aviso('Revise su correo: parece que falta algo.','error');form.email.focus();return;}
    if(!form.acepto.checked){aviso('Marque la casilla para que podamos responderle.','error');return;}
    if(d.web){aviso('Gracias. Hemos recibido su mensaje.','ok');form.reset();return;}
    if(!ENDPOINT){aviso('El formulario todavía no está activo. Vuelva a intentarlo en unos días.','error');return;}
    btn.disabled=true;aviso('Enviando…');
    fetch(ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)})
      .then(function(){aviso('Gracias. Hemos recibido su mensaje y le contestaremos pronto.','ok');form.reset();})
      .catch(function(){aviso('No se ha podido enviar. Compruebe su conexión e inténtelo de nuevo.','error');})
      .then(function(){btn.disabled=false;});
  });
})();
</script>"""


if __name__ == "__main__":
    construir()
