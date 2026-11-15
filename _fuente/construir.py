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

# Subapartados de Historia, en orden cronológico y después los temáticos
HISTORIA = [
    ("Orígenes y Edad Media", "historia-del-pueblo/origenes-y-edad-media/"),
    ("La villa de señorío", "historia-del-pueblo/la-villa-de-senorio/"),
    ("Siglos XVI y XVII", "historia-del-pueblo/siglos-xvi-y-xvii/"),
    ("El vino de Alaejos", "historia-del-pueblo/el-vino-de-alaejos/"),
    ("El siglo XVIII", "historia-del-pueblo/el-siglo-xviii/"),
    ("El siglo XIX", "historia-del-pueblo/el-siglo-xix/"),
    ("El siglo XX", "historia-del-pueblo/el-siglo-xx/"),
    ("Oficios, agua y vida diaria", "historia-del-pueblo/oficios-agua-y-vida-diaria/"),
    ("Dichos, cabañuelas y habla", "historia-del-pueblo/dichos-cabanuelas-y-habla/"),
]

# Subapartados de Fiestas
FIESTAS = [
    ("Fiestas y tradiciones", "fiestas-y-eventos/fiestas-y-tradiciones-de-alaejos/"),
    ("Semana Santa", "fiestas-y-eventos/semana-santa/"),
    ("Fiestas de la Casita", "fiestas-y-eventos/fiestas-de-la-virgen-de-la-casita/"),
    ("Toros", "fiestas-y-eventos/toros-en-alaejos/"),
    ("Los quintos", "fiestas-y-eventos/los-quintos/"),
]

# Secciones con submenú: clave del menú -> (título, ruta de la presentación, subapartados)
SECCIONES = {
    "historia": ("Historia", "historia-del-pueblo/", HISTORIA),
    "patrimonio": ("Patrimonio", "patrimonio/", PATRIMONIO),
    "fiestas": ("Fiestas", "fiestas-y-eventos/", FIESTAS),
}

# Páginas: (ruta, fragmento, clave del menú, título, descripción)
PAGINAS = [
    ("", "inicio", "inicio", NOMBRE + " · " + LEMA,
     "Archivo abierto sobre Alaejos (Valladolid): historia, patrimonio, fiestas y personas de la villa, reunidos desde archivos, publicaciones y colecciones particulares."),
    ("biblioteca/", "biblioteca", "biblioteca", "Biblioteca",
     "Textos sobre Alaejos para leer y descargar: los 178 artículos de los programas de fiestas (1954–2026) y otras publicaciones."),
    ("biblioteca/novena-de-la-virgen-de-la-casita/", "novena", "biblioteca", "La novena de la Virgen de la Casita",
     "Las novenas a Nuestra Señora de la Casita, patrona de Alaejos, para descargar en PDF: la original de 1865, la «Historia y novena» de 1952 y la edición en castellano actual de 2026."),
    ("historia-del-pueblo/", "historia", "historia", "Historia del pueblo",
     "La historia de Alaejos (Valladolid), de la aldea fronteriza de la Tierra de Medina a hoy: cronología, población a lo largo de los siglos y nueve capítulos documentados con los programas de fiestas."),
    ("historia-del-pueblo/origenes-y-edad-media/", "h-origenes", "historia", "Orígenes y Edad Media",
     "Los orígenes de Alaejos: los bifaces del Trabancos, el nombre de Falafeios, la repoblación, la frontera con León, los cuatro linajes y el paso a los Fonseca en 1452."),
    ("historia-del-pueblo/la-villa-de-senorio/", "h-senorio", "historia", "La villa de señorío",
     "Alaejos, villa de señorío de 1452 a 1837: cómo se gobernaba, la sucesión de señores de los Fonseca a los duques de Alba, la visita de Felipe III en 1600 y la rebelión de 1593."),
    ("historia-del-pueblo/siglos-xvi-y-xvii/", "h-siglos-xvi-xvii", "historia", "Siglos XVI y XVII: esplendor y crisis",
     "Alaejos en el Siglo de Oro: las ordenanzas de 1580, el pleito con la Mesta, el convento de los franciscanos descalzos, fray Miguel de Alaejos, la escuela y la crisis del siglo XVII."),
    ("historia-del-pueblo/el-vino-de-alaejos/", "h-vino", "historia", "El vino de Alaejos",
     "El blanco de Alaejos, vino famoso del siglo XVI citado por Cervantes y Quevedo: su comercio, sus bodegas y lagares y su decadencia hasta la filoxera."),
    ("historia-del-pueblo/el-siglo-xviii/", "h-siglo-xviii", "historia", "El siglo XVIII: el Catastro y los ilustrados",
     "Alaejos en 1751 según el Catastro de Ensenada, la cilla de los diezmos, la Real Sociedad Caritativo-Económica de 1785 y la Real Fábrica de paños."),
    ("historia-del-pueblo/el-siglo-xix/", "h-siglo-xix", "historia", "El siglo XIX: guerra, epidemias y libertades",
     "Alaejos en el siglo XIX: Marmont y Wellington en 1812, el cólera de 1834, la villa según Madoz, la república federal de tres días de 1873 y el fuego de las eras de 1881."),
    ("historia-del-pueblo/el-siglo-xx/", "h-siglo-xx", "historia", "El siglo XX",
     "Alaejos en el siglo XX: las fiestas de 1905, el ferrocarril que no llegó, la paz con Nava del Rey de 1928, la guerra civil, la emigración y el primer Ayuntamiento democrático."),
    ("historia-del-pueblo/oficios-agua-y-vida-diaria/", "h-oficios", "historia", "Oficios, agua y vida diaria",
     "El Caño y el Arca Madre, los pastores, los cantareros y los oficios desaparecidos de Alaejos: aguador, sereno, pregonero, capador, casitera."),
    ("historia-del-pueblo/dichos-cabanuelas-y-habla/", "h-tradicion-oral", "historia", "Dichos, cabañuelas y habla",
     "La tradición oral de Alaejos: las cabañuelas, los dichos sobre el pueblo y sobre Nava, los ramos de segadores, las supersticiones, palabras propias y grabaciones de su música."),
    ("patrimonio/", "patrimonio", "patrimonio", "Patrimonio",
     "Las iglesias de Santa María y San Pedro, la ermita de la Virgen de la Casita y el castillo de los Fonseca: el patrimonio monumental de Alaejos."),
    ("patrimonio/iglesia-de-santa-maria/", "santa-maria", "patrimonio", "Iglesia de Santa María",
     "La iglesia de Santa María de Alaejos: templo de ladrillo de finales del siglo XVI, armaduras mudéjares, retablo mayor de Esteban Jordán y museo de arte sacro."),
    ("patrimonio/iglesia-de-san-pedro/", "san-pedro", "patrimonio", "Iglesia de San Pedro",
     "La iglesia de San Pedro Apóstol de Alaejos, en la Plaza Mayor: la torre más alta de la villa, bóvedas de yesería, grisallas y retablo mayor romanista."),
    ("patrimonio/la-ermita-de-la-virgen-de-la-casita/", "casita", "patrimonio", "Ermita de la Virgen de la Casita",
     "El santuario de Nuestra Señora de la Casita, patrona de Alaejos: la talla del siglo XIII, la ermita de 1490 y 1699, la Cofradía de Pastores, la charambita y las fiestas de mayo y septiembre."),
    ("patrimonio/el-castillo/", "castillo", "patrimonio", "El castillo",
     "El castillo de los Fonseca en Alaejos según los documentos: la licencia de 1453, la reina Juana de Portugal, la «sala rica» morisca, el cerco comunero de 1520, la ruina y las excavaciones."),
    ("fiestas-y-eventos/", "fiestas", "fiestas", "Fiestas y eventos",
     "El año festivo de Alaejos, de los Quintos a las fiestas de la Virgen de la Casita, y la colección de programas de fiestas desde 1954."),
    ("fiestas-y-eventos/fiestas-y-tradiciones-de-alaejos/", "fiestas-tradiciones", "fiestas", "Fiestas y tradiciones de Alaejos",
     "El año festivo de Alaejos mes a mes: quintos, San Antón, Semana Santa, la romería de mayo, la Mariseca, las fiestas de la Virgen de la Casita, los toros desde 1583, el vino, las cabañuelas y la charambita."),
    ("fiestas-y-eventos/semana-santa/", "fiestas-semana-santa", "fiestas", "Cuaresma y Semana Santa",
     "La Semana Santa de Alaejos: el Cristo de la Caridad en Carnaval, los viernes de Jesús Nazareno, el vino del Cristo de la Salud, el Silencio y el Encuentro, y sus nueve cofradías."),
    ("fiestas-y-eventos/fiestas-de-la-virgen-de-la-casita/", "fiestas-casita", "fiestas", "Las fiestas de la Virgen de la Casita",
     "Las fiestas de la patrona de Alaejos: la romería del 10 de mayo, la bajada, la Mariseca de agosto, las fiestas de septiembre desde 1905 y la charambita de los danzantes."),
    ("fiestas-y-eventos/toros-en-alaejos/", "fiestas-toros", "fiestas", "Toros en Alaejos",
     "Los toros en Alaejos desde 1583: las corridas de las cofradías, las novilladas en la Plaza Mayor, las ganaderías del entorno y los encierros y festejos de hoy."),
    ("fiestas-y-eventos/los-quintos/", "fiestas-quintos", "fiestas", "Los quintos",
     "Los quintos de Alaejos: el rito de paso descrito en 1988, el aguinaldo y la hoguera de Nochevieja, la fiesta de Reyes y el álamo de mayo."),
    ("personas-de-alaejos/", "personas", "personas", "Personas de Alaejos",
     "Alaejanos de los que ha quedado memoria: el cardenal Arias y Porres, Hernández Morejón, Alejandro Ramírez, el beato Donato, Gonzala Santana y otros, con sus fuentes."),
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
    if clave in SECCIONES:
        titulo, raiz, lista = SECCIONES[clave]
        cur = ' aria-current="page"' if ruta == raiz else ""
        sub = [f'<a href="{base}{raiz}"{cur}>Presentación</a>']
        for etiqueta, destino in lista:
            cur = ' aria-current="page"' if destino == ruta else ""
            sub.append(f'<a href="{base}{destino}"{cur}>{etiqueta}</a>')
        out += (f'<nav class="submenu" aria-label="{titulo}"><span class="submenu-tit">{titulo}</span>'
                + "".join(sub) + '</nav>')
    return out


def vecinos(ruta, base):
    """Anterior / siguiente dentro de una sección con subapartados (Historia, Patrimonio)."""
    for titulo, raiz, lista in SECCIONES.values():
        orden = [(titulo, raiz)] + lista
        rutas = [r for _, r in orden]
        if ruta in rutas:
            break
    else:
        return ""
    i = rutas.index(ruta)
    partes = []
    if i > 0:
        partes.append(f'<a href="{base}{orden[i-1][1]}"><span>Anterior</span>{orden[i-1][0]}</a>')
    if i < len(orden) - 1:
        partes.append(f'<a class="sig" href="{base}{orden[i+1][1]}"><span>Siguiente</span>{orden[i+1][0]}</a>')
    articulo = {"Historia": "la historia", "Patrimonio": "el patrimonio", "Fiestas": "las fiestas"}.get(titulo, titulo.lower())
    return f'<nav class="vecinos" aria-label="Recorrido por {articulo}">' + "".join(partes) + '</nav>'


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
