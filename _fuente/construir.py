#!/usr/bin/env python3
"""Genera www.amigosdealaejos.org a partir de los textos de _fuente/.

    _fuente/paginas/NOMBRE.html   texto de cada página (solo el contenido)
    _fuente/novedades.json        entradas de Novedades (también salen en la portada)
    -> RUTA/index.html            página completa, con cabecera, menú, índice y pie

Además genera: el índice del buscador (assets/buscar.json), la página de
Preguntas abiertas (reúne los recuadros «En estudio»), las versiones ligeras de
las fotos (assets/img/800/), la imagen para compartir de cada página
(assets/og/), sitemap.xml, robots.txt, 404.html y las redirecciones.

Uso:  python3 _fuente/construir.py     (necesita beautifulsoup4 y Pillow)
Para añadir una página: escribe su texto en _fuente/paginas/ y añádela a PAGINAS.
"""
from pathlib import Path
from datetime import date
import html, json, re, unicodedata, hashlib

from bs4 import BeautifulSoup, NavigableString
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "_fuente" / "paginas"
URL_BASE = "https://www.amigosdealaejos.org/"
NOMBRE = "Amigos de Alaejos"
LEMA = "Historia, patrimonio y memoria de la villa"

# Formulario de contacto (página «Colabora»). Los mensajes los recibe un script de Google
# Apps Script (_fuente/formulario-contacto.gs) y los reenvía por correo sin mostrar la dirección.
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
    ("historia", "Historia", "historia-del-pueblo/"),
    ("patrimonio", "Patrimonio", "patrimonio/"),
    ("fiestas", "Fiestas", "fiestas-y-eventos/"),
    ("personas", "Personas", "personas-de-alaejos/"),
    ("biblioteca", "Biblioteca", "biblioteca/"),
    ("novedades", "Novedades", "novedades/"),
    ("colabora", "Colabora", "colabora/"),
]

PATRIMONIO = [
    ("Iglesia de Santa María", "patrimonio/iglesia-de-santa-maria/"),
    ("Iglesia de San Pedro", "patrimonio/iglesia-de-san-pedro/"),
    ("Ermita de la Virgen de la Casita", "patrimonio/la-ermita-de-la-virgen-de-la-casita/"),
    ("El castillo", "patrimonio/el-castillo/"),
    ("La Plaza Mayor", "patrimonio/la-plaza-mayor/"),
    ("Casas blasonadas", "patrimonio/casas-blasonadas/"),
    ("Visitar Alaejos", "patrimonio/visitar-alaejos/"),
    ("Mapa", "patrimonio/mapa/"),
]

# Historia en dos grupos: las épocas (con la cronología) y los temas de la vida del pueblo
HISTORIA_EPOCAS = [
    ("Edad Media", "historia-del-pueblo/origenes-y-edad-media/"),
    ("El señorío", "historia-del-pueblo/la-villa-de-senorio/"),
    ("Siglos XVI y XVII", "historia-del-pueblo/siglos-xvi-y-xvii/"),
    ("Valdefuentes", "historia-del-pueblo/el-despoblado-de-valdefuentes/"),
    ("El vino", "historia-del-pueblo/el-vino-de-alaejos/"),
    ("Siglo XVIII", "historia-del-pueblo/el-siglo-xviii/"),
    ("Real Sociedad", "historia-del-pueblo/la-real-sociedad-caritativo-economica/"),
    ("Siglo XIX", "historia-del-pueblo/el-siglo-xix/"),
    ("Siglo XX", "historia-del-pueblo/el-siglo-xx/"),
    ("Cronología", "historia-del-pueblo/cronologia/"),
]
HISTORIA_TEMAS = [
    ("Oficios y agua", "historia-del-pueblo/oficios-agua-y-vida-diaria/"),
    ("Juegos de antes", "historia-del-pueblo/juegos-de-antes/"),
    ("La matanza", "historia-del-pueblo/la-matanza/"),
    ("Cocina tradicional", "historia-del-pueblo/cocina-tradicional/"),
    ("Dichos y habla", "historia-del-pueblo/dichos-cabanuelas-y-habla/"),
    ("El término", "historia-del-pueblo/el-termino/"),
    ("El clima en datos", "historia-del-pueblo/el-clima-en-datos/"),
    ("Escudo y bandera", "historia-del-pueblo/escudo-y-bandera/"),
    ("Asociaciones", "historia-del-pueblo/asociaciones-y-lugares-de-encuentro/"),
    ("Fotografías antiguas", "historia-del-pueblo/fotografias-antiguas/"),
]
HISTORIA = HISTORIA_EPOCAS + HISTORIA_TEMAS
GRUPOS = {"historia": [("Por épocas", HISTORIA_EPOCAS, "historia-del-pueblo/#la-historia-por-epocas"),
                       ("Vida del pueblo", HISTORIA_TEMAS, "historia-del-pueblo/#la-vida-del-pueblo")]}


FIESTAS = [
    ("Semana Santa", "fiestas-y-eventos/semana-santa/"),
    ("Fiestas de la Casita", "fiestas-y-eventos/fiestas-de-la-virgen-de-la-casita/"),
    ("Toros", "fiestas-y-eventos/toros-en-alaejos/"),
    ("Los quintos", "fiestas-y-eventos/los-quintos/"),
]

# Personas: (ruta, fragmento, nombre, fechas). El texto de cada una está en persona-*.html
PERSONAS = [(f"personas-de-alaejos/{s}/", f"persona-{s}", n, f) for s, n, f in json.loads(
    (RAIZ / "_fuente" / "personas.json").read_text(encoding="utf-8"))]

# Secciones con subapartados: clave -> (título, ruta de la presentación, subapartados, ¿submenú?)
SECCIONES = {
    "historia": ("Historia", "historia-del-pueblo/", HISTORIA, True),
    "patrimonio": ("Patrimonio", "patrimonio/", PATRIMONIO, True),
    "fiestas": ("Fiestas", "fiestas-y-eventos/", FIESTAS, True),
    "personas": ("Personas", "personas-de-alaejos/", [(n, r) for r, _, n, _ in PERSONAS], False),
}

# Páginas: (ruta, fragmento, clave del menú, título, descripción)
PAGINAS = [
    ("", "inicio", "inicio", NOMBRE + " · " + LEMA,
     "Archivo abierto sobre Alaejos (Valladolid): historia, patrimonio, fiestas y personas, reunidos de archivos, publicaciones y colecciones particulares."),
    ("historia-del-pueblo/", "historia", "historia", "Historia del pueblo",
     "La historia de Alaejos (Valladolid), de aldea fronteriza de la Tierra de Medina a hoy: cronología, población y capítulos documentados con sus fuentes."),
    ("historia-del-pueblo/origenes-y-edad-media/", "h-origenes", "historia", "Orígenes y Edad Media",
     "Los orígenes de Alaejos: los bifaces del Trabancos, Falafeios, la repoblación, la frontera con León, los cuatro linajes y el paso a los Fonseca en 1452."),
    ("historia-del-pueblo/la-villa-de-senorio/", "h-senorio", "historia", "La villa de señorío",
     "Alaejos, villa de señorío de 1452 a 1837: cómo se gobernaba, de los Fonseca a los duques de Alba, la rebelión de 1593 y la visita de Felipe III en 1600."),
    ("historia-del-pueblo/siglos-xvi-y-xvii/", "h-siglos-xvi-xvii", "historia", "Siglos XVI y XVII: esplendor y crisis",
     "Alaejos en el Siglo de Oro: las ordenanzas de 1580, el pleito con la Mesta, el convento franciscano, la escuela y la crisis del siglo XVII."),
    ("historia-del-pueblo/el-despoblado-de-valdefuentes/", "h-valdefuentes", "historia", "El despoblado de Valdefuentes",
     "Valdefuentes, el lugar despoblado del término de Alaejos: su torre de frontera, el señorío de los Fonseca, su despoblamiento en el siglo XVII y lo que queda."),
    ("historia-del-pueblo/el-vino-de-alaejos/", "h-vino", "historia", "El vino de Alaejos",
     "El blanco de Alaejos, vino famoso del siglo XVI citado por Cervantes y Quevedo: su comercio, sus bodegas y lagares y su decadencia hasta la filoxera."),
    ("historia-del-pueblo/el-siglo-xviii/", "h-siglo-xviii", "historia", "Siglo XVIII: el Catastro y los ilustrados",
     "Alaejos en 1751 según el Catastro de Ensenada, la cilla de los diezmos, la Real Sociedad Caritativo-Económica de 1785 y la Real Fábrica de paños."),
    ("historia-del-pueblo/la-real-sociedad-caritativo-economica/", "h-real-sociedad", "historia", "La Real Sociedad Caritativo-Económica",
     "La sociedad ilustrada de Alaejos (1785): limosneros, padres de pobres, la Casa de Misericordia, el montepío y las fábricas de velas y esteras."),
    ("historia-del-pueblo/el-siglo-xix/", "h-siglo-xix", "historia", "Siglo XIX: guerra, epidemias y libertades",
     "Alaejos en el siglo XIX: Marmont y Wellington en 1812, el cólera de 1834, la villa según Madoz, la república de tres días de 1873 y el fuego de las eras."),
    ("historia-del-pueblo/el-siglo-xx/", "h-siglo-xx", "historia", "El siglo XX",
     "Alaejos en el siglo XX: el ferrocarril que no llegó, la paz con Nava de 1928, la guerra civil, la emigración y el primer Ayuntamiento democrático."),
    ("historia-del-pueblo/oficios-agua-y-vida-diaria/", "h-oficios", "historia", "Oficios, agua y vida diaria",
     "El Caño y el Arca Madre, los pastores, los cantareros y los oficios desaparecidos de Alaejos: aguador, sereno, pregonero, capador, casitera."),
    ("historia-del-pueblo/juegos-de-antes/", "h-juegos", "historia", "Juegos de antes",
     "A qué jugaban los niños de Alaejos a mediados del siglo XX, según Antonio Lucas Varela."),
    ("historia-del-pueblo/la-matanza/", "h-matanza", "historia", "La matanza",
     "El mondongo de Alaejos contado por Antonio Lucas Varela y las recetas tradicionales de la matanza: morcilla, longaniza, chorizo, morcón, salchichón, adobo y jamón."),
    ("historia-del-pueblo/cocina-tradicional/", "h-cocina", "historia", "Cocina tradicional",
     "Qué se comía en Alaejos en cada fiesta según el libro de 1991: flamencos, arrastraos, la alubiada de San Antón, torrijas y la empanada de San Isidro."),
    ("historia-del-pueblo/dichos-cabanuelas-y-habla/", "h-tradicion-oral", "historia", "Dichos, cabañuelas y habla",
     "La tradición oral de Alaejos: las cabañuelas, los dichos sobre el pueblo y sobre Nava, los ramos de segadores, palabras propias y su música."),
    ("historia-del-pueblo/el-termino/", "h-termino", "historia", "El término: clima, montes y prados",
     "El campo de Alaejos en quinientos años: el clima y las lluvias, el monte de encinas desaparecido, el prado de Carrealvar, la cerca y la cruz de Carrezamora."),
    ("historia-del-pueblo/el-clima-en-datos/", "clima", "historia", "El clima de Alaejos en datos",
     "Lluvias y temperaturas de Alaejos día a día desde 1940 hasta ayer: cada año comparado con lo normal, la subida de las temperaturas, heladas, récords y el tiempo de cualquier fecha."),
    ("historia-del-pueblo/escudo-y-bandera/", "h-escudo", "historia", "Escudo, bandera y distinciones",
     "El escudo de Alaejos y su estrella de los Fonseca, la bandera de 1996, los bastones de mando, los escudos de las casas nobles y los honores municipales."),
    ("historia-del-pueblo/asociaciones-y-lugares-de-encuentro/", "h-vida-social", "historia", "Asociaciones y lugares de encuentro",
     "Del hospital del Buen Pastor al centro de salud, las escuelas, la Asociación de Labradores, los amigos del patrimonio, el club ciclista y el teatro."),
    ("historia-del-pueblo/cronologia/", "h-cronologia", "historia", "Alaejos en fechas",
     "Cronología de Alaejos desde el siglo XII hasta hoy: señorío, iglesias, guerras, epidemias, fiestas y personas, con enlace a cada página."),
    ("historia-del-pueblo/fotografias-antiguas/", "h-fotos-antiguas", "historia", "Fotografías antiguas",
     "Alaejos en fotografías y grabados antiguos: el castillo en 1809, las iglesias, la Plaza Mayor y la Virgen de la Casita, con su procedencia."),
    ("patrimonio/", "patrimonio", "patrimonio", "Patrimonio",
     "Las iglesias de Santa María y San Pedro, la ermita de la Virgen de la Casita, el castillo de los Fonseca y la Plaza Mayor: el patrimonio monumental de Alaejos."),
    ("patrimonio/iglesia-de-santa-maria/", "santa-maria", "patrimonio", "Iglesia de Santa María",
     "La iglesia de Santa María de Alaejos: templo de ladrillo de finales del siglo XVI, armaduras mudéjares, retablo mayor de Esteban Jordán y museo de arte sacro."),
    ("patrimonio/iglesia-de-san-pedro/", "san-pedro", "patrimonio", "Iglesia de San Pedro",
     "La iglesia de San Pedro Apóstol de Alaejos, en la Plaza Mayor: la torre más alta de la villa, bóvedas de yesería, grisallas y retablo mayor romanista."),
    ("patrimonio/la-ermita-de-la-virgen-de-la-casita/", "casita", "patrimonio", "Ermita de la Virgen de la Casita",
     "El santuario de Nuestra Señora de la Casita, patrona de Alaejos: la talla del siglo XIII, la ermita, la Cofradía de Pastores y la devoción a la patrona."),
    ("patrimonio/el-castillo/", "castillo", "patrimonio", "El castillo",
     "El castillo de los Fonseca según los documentos: la licencia de 1453, la reina Juana de Portugal, el cerco comunero de 1520, la ruina y las excavaciones."),
    ("patrimonio/la-plaza-mayor/", "plaza-mayor", "patrimonio", "La Plaza Mayor",
     "La Plaza Mayor de Alaejos: el Ayuntamiento, los soportales, San Pedro y su balcón, el mercado, los toros y las casas blasonadas de la villa."),
    ("patrimonio/casas-blasonadas/", "casas-blasonadas", "patrimonio", "Casas blasonadas y edificios civiles",
     "Las casas de hidalgos con escudo de Alaejos, casa por casa, y el Ayuntamiento, el hospital del Buen Pastor y la cilla, según Adolfo M. Araújo (1991)."),
    ("patrimonio/visitar-alaejos/", "visitar", "patrimonio", "Visitar Alaejos",
     "Cómo visitar Alaejos: Oficina de Turismo, visitas guiadas gratuitas, museo de arte sacro, castillo y un paseo por el pueblo de la Plaza Mayor a la Casita."),
    ("patrimonio/mapa/", "mapa", "patrimonio", "Mapa de Alaejos",
     "Mapa de los lugares de Alaejos que aparecen en esta web: iglesias, ermita, castillo, Plaza Mayor, el Caño y otros, con enlace a cada página."),
    ("fiestas-y-eventos/", "fiestas", "fiestas", "Fiestas y tradiciones",
     "El año festivo de Alaejos mes a mes: quintos, San Antón, Semana Santa, la romería de mayo, la Mariseca, las fiestas de septiembre y los toros."),
    ("fiestas-y-eventos/semana-santa/", "fiestas-semana-santa", "fiestas", "Cuaresma y Semana Santa",
     "La Semana Santa de Alaejos: el Cristo de la Caridad, los viernes de Jesús Nazareno, el vino del Cristo de la Salud, el Silencio y el Encuentro."),
    ("fiestas-y-eventos/fiestas-de-la-virgen-de-la-casita/", "fiestas-casita", "fiestas", "Las fiestas de la Virgen de la Casita",
     "Las fiestas de la patrona de Alaejos: la romería del 10 de mayo, la Mariseca de agosto, las fiestas de septiembre y la charambita de los danzantes."),
    ("fiestas-y-eventos/toros-en-alaejos/", "fiestas-toros", "fiestas", "Toros en Alaejos",
     "Los toros en Alaejos desde 1583: las corridas de las cofradías, las novilladas en la Plaza Mayor, las ganaderías del entorno y los encierros y festejos de hoy."),
    ("fiestas-y-eventos/los-quintos/", "fiestas-quintos", "fiestas", "Los quintos",
     "Los quintos de Alaejos: el rito de paso descrito en 1988, el aguinaldo y la hoguera de Nochevieja, la fiesta de Reyes y el álamo de mayo."),
    ("personas-de-alaejos/", "personas", "personas", "Personas de Alaejos",
     "Alaejanos de los que ha quedado memoria: el cardenal Arias y Porres, Hernández Morejón, Alejandro Ramírez, el beato Donato y otros, con sus fuentes."),
] + [(r, frag, "personas", n, f"{n} ({f}): semblanza con sus fuentes, en Personas de Alaejos.") for r, frag, n, f in PERSONAS] + [
    ("biblioteca/", "biblioteca", "biblioteca", "Biblioteca",
     "Textos sobre Alaejos: los 178 artículos de los programas de fiestas (1954–2026), los programas originales, las novenas, el cancionero y el vocabulario de Arrecájel."),
    ("biblioteca/novena-de-la-virgen-de-la-casita/", "novena", "biblioteca", "La novena de la Virgen de la Casita",
     "Las novenas a la Virgen de la Casita, patrona de Alaejos, en PDF: la original de 1865, la «Historia y novena» de 1952 y la edición actual de 2026."),
    ("biblioteca/bibliografia/", "bibliografia", "biblioteca", "Bibliografía",
     "Libros, estudios y artículos de los programas de fiestas sobre Alaejos citados en esta web, con las páginas en las que se usan."),
    ("biblioteca/versos-y-recuerdos/", "versos", "biblioteca", "Versos y recuerdos de los programas",
     "Poemas y recuerdos de vecinos publicados en los programas de fiestas de Alaejos, de 1971 a 2025, con lo que cuenta cada uno y enlace al texto completo."),
    ("biblioteca/cancionero/", "cancionero", "biblioteca", "Cancionero de Alaejos",
     "Las 37 canciones de Alaejos que recogió Antonio Lucas Varela en Arrecájel (1998): partituras, melodías para escuchar y el himno del pueblo."),
    ("biblioteca/recuerdos-musicales-de-alaejos/", "recuerdos-musicales", "biblioteca", "Recuerdos musicales de Alaejos",
     "Las 20 grabaciones del disco Recuerdos musicales de Alaejos: gozos, cirios y rogativas a la Virgen de la Casita, el himno, las dianas y el ramo."),
    ("biblioteca/vocabulario/", "vocabulario", "biblioteca", "Vocabulario de Alaejos",
     "Las palabras de Alaejos que recogió Antonio Lucas Varela en Arrecájel (1998): 1.068 localismos, arcaísmos, pagos y lugares del término, y 190 locuciones."),
    ("biblioteca/glosario/", "glosario", "biblioteca", "Glosario",
     "Palabras de los documentos antiguos y del habla de Alaejos explicadas: beneficiado, cilla, diezmo, linaje, mayorazgo, Mesta, cabañuelas, lavajo y otras."),
    ("novedades/", "novedades", "novedades", "Novedades",
     "Lo último que se ha incorporado a Amigos de Alaejos, con su fecha: páginas nuevas, textos, fotografías, preguntas resueltas y correcciones. También por RSS."),
    ("colabora/", "colabora", "colabora", "Colabora",
     "Cómo aportar fotografías, programas de fiestas y documentos sobre Alaejos para que se digitalicen y se publiquen."),
    ("preguntas-abiertas/", "preguntas", "colabora", "Preguntas abiertas",
     "Lo que todavía no sabemos de la historia de Alaejos: todas las dudas que siguen en estudio en esta web, por si alguien puede resolverlas."),
    ("quienes-somos/", "quienes-somos", "", "Quiénes somos",
     "Qué es Amigos de Alaejos, con qué criterio se escribe, cómo citar esta web y de dónde proceden sus imágenes."),
    ("buscar/", "buscar", "", "Buscar",
     "Buscador de Amigos de Alaejos: encuentre cualquier nombre, lugar o fecha en las páginas de la web."),
]

# Direcciones antiguas que deben seguir funcionando
REDIRECCIONES = {
    "inicio/": "",
    "patrimonio/iglesia-de-santa-maría/": "patrimonio/iglesia-de-santa-maria/",
    "programas-de-las-fiestas-de-alaejos/": "biblioteca/#programas",
    "fiestas-y-eventos/fiestas-y-tradiciones-de-alaejos/": "fiestas-y-eventos/",
    "mapa/": "patrimonio/mapa/",
}

ICONO_BUSCAR = ('<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
                'stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>')


def profundidad(ruta: str) -> str:
    return "../" * ruta.count("/")


def esc(t: str) -> str:
    return html.escape(t, quote=True)


def slug(t: str) -> str:
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60] or "apartado"


def fecha_larga(f: str) -> str:
    meses = "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split()
    p = f.split("-")
    if len(p) == 3:
        return f"{int(p[2])} de {meses[int(p[1]) - 1]} de {p[0]}"
    return f"{meses[int(p[1]) - 1].capitalize()} de {p[0]}"


# ---------------------------------------------------------------- cabecera y pie

def cabecera(ruta, clave, base):
    enlaces = []
    for k, etiqueta, destino in MENU:
        atr = ' aria-current="page"' if destino == ruta else (' class="dentro"' if k == clave else "")
        enlaces.append(f'<a href="{base}{destino}"{atr}>{etiqueta}</a>')
    cur = ' aria-current="page"' if ruta == "buscar/" else ""
    out = (f'<header class="cab"><div class="cab-in">'
           f'<a class="marca" href="{base}"><span class="escudo" aria-hidden="true"></span><span class="marca-txt">'
           f'<span class="marca-1">{NOMBRE}</span><span class="marca-2">{LEMA}</span></span></a>'
           f'<div class="cab-acc"><a class="lupa" href="{base}buscar/" title="Buscar"{cur}>{ICONO_BUSCAR}<span>Buscar</span></a>'
           f'<button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu">Menú</button></div>'
           f'<nav class="menu" id="menu" aria-label="Secciones">{"".join(enlaces)}</nav></div></header>')
    if clave in SECCIONES and SECCIONES[clave][3]:
        titulo, raiz, lista, _ = SECCIONES[clave]
        cur = ' aria-current="page"' if ruta == raiz else ""
        sub = [f'<a href="{base}{raiz}"{cur}>Presentación</a>']
        otro = ""
        cab_tit = f'<span class="submenu-tit">{titulo}</span>'
        if clave in GRUPOS:
            cab_tit = f'<a class="submenu-tit" href="{base}{raiz}"{cur}>{titulo}</a>'
            sub = []
            grupos = GRUPOS[clave]
            g = next((k for k, (_, l, _) in enumerate(grupos) if ruta in [r for _, r in l]), 0)
            nombre, lista, _ = grupos[g]
            o_nombre, _, o_dest = grupos[1 - g]
            otro = (f'<a class="submenu-otro" href="{base}{o_dest}">{o_nombre} →</a>' if g == 0
                    else f'<a class="submenu-otro" href="{base}{o_dest}">← {o_nombre}</a>')
        for etiqueta, destino in lista:
            cur = ' aria-current="page"' if destino == ruta else ""
            sub.append(f'<a href="{base}{destino}"{cur}>{etiqueta}</a>')
        out += (f'<nav class="submenu" aria-label="{titulo}">{cab_tit}'
                f'<div class="submenu-in">{"".join(sub)}</div>{otro}</nav>')
    return out


def vecinos(ruta, base):
    for titulo, raiz, lista, _ in SECCIONES.values():
        orden = [(titulo if titulo != "Personas" else "Personas de Alaejos", raiz)] + lista
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
    articulo = {"Historia": "la historia", "Patrimonio": "el patrimonio", "Fiestas": "las fiestas", "Personas": "las personas"}.get(titulo, titulo.lower())
    return f'<nav class="vecinos" aria-label="Recorrido por {articulo}">' + "".join(partes) + '</nav>'


def acciones(ruta, titulo, base, frag):
    """Al pie de cada página: avisar de un error y compartir por WhatsApp."""
    from urllib.parse import quote
    if frag in ("buscar", "colabora"):
        return ""
    url = URL_BASE + ruta
    wa = "https://wa.me/?text=" + quote(f"{titulo} · {NOMBRE}\n{url}")
    return (f'<div class="acciones">'
            f'<a class="acc-error" href="{base}colabora/?motivo=correccion&amp;sobre={quote(titulo)}#contacto">¿Ha visto un error o sabe algo más? Cuéntenoslo</a>'
            f'<span class="acc-compartir"><a href="{wa}" rel="noopener">Compartir por WhatsApp</a>'
            f'<button type="button" class="acc-nativo" hidden data-titulo="{esc(titulo)}" data-url="{url}">Compartir…</button></span></div>')


def pie(base):
    redes = "".join(f'<a href="{u}" rel="me">{n}</a>' for n, u in REDES)
    otras = "".join(f'<a href="{u}">{n}</a>' for n, u in OTRAS_WEBS)
    propias = "".join(f'<a href="{base}{r}">{n}</a>' for n, r in [
        ("Quiénes somos", "quienes-somos/"), ("Preguntas abiertas", "preguntas-abiertas/"),
        ("Mapa", "patrimonio/mapa/"), ("Alaejos en fechas", "historia-del-pueblo/cronologia/"), ("Calendario de fiestas", "fiestas-y-eventos/#calendario"), ("Bibliografía", "biblioteca/bibliografia/"), ("Glosario", "biblioteca/glosario/"), ("Buscar", "buscar/"), ("Colabora", "colabora/")])
    return (f'<footer class="pie"><div class="pie-in"><div class="horizonte" aria-hidden="true"></div>'
            f'<p><strong>{NOMBRE}.</strong> Archivo abierto de historia, patrimonio y memoria de la villa de Alaejos (Valladolid).</p>'
            f'<div class="otras">{propias}</div>'
            f'<p>Los materiales se publican con fines de consulta, estudio y divulgación, sin ánimo de lucro e indicando siempre que es posible su procedencia. '
            f'Si es titular de algún contenido y prefiere que no figure aquí, <a href="{base}colabora/">díganoslo</a> y lo retiraremos.</p>'
            f'<div class="redes">{redes}</div><div class="otras">{otras}</div></div></footer>')


def pagina(ruta, titulo, descripcion, cuerpo, clave, og, es_portada=False, extra_head=""):
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
<meta property="og:title" content="{esc(titulo_completo)}"><meta property="og:description" content="{esc(descripcion)}"><meta property="og:type" content="website"><meta property="og:url" content="{url}"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="{NOMBRE}"><meta property="og:image" content="{URL_BASE}{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FDFCFA">
<link rel="icon" href="{base}assets/escudo.png">
<link rel="apple-touch-icon" href="{base}assets/icono-180.png">
<link rel="manifest" href="{base}manifest.webmanifest">
<link rel="preload" href="{base}assets/fuentes/literata-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{base}assets/fuentes/im-fell-dw-pica-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{base}assets/estilo.css">
<link rel="alternate" type="application/atom+xml" title="Novedades de {NOMBRE}" href="{URL_BASE}novedades.xml">{datos_estructurados(ruta, titulo, descripcion, clave)}{extra_head}
<script>document.documentElement.className+=' js';</script>
</head>
<body id="top">
<a class="saltar" href="#contenido">Saltar al contenido</a>
{cabecera(ruta, clave, base)}
{cuerpo}
{pie(base)}
<a class="arriba" href="#top" aria-label="Volver arriba">↑</a>
<script src="{base}assets/js/web.js" defer></script>
</body>
</html>
"""


def datos_estructurados(ruta, titulo, descripcion, clave):
    if ruta == "":
        d = {"@context": "https://schema.org", "@type": "WebSite", "name": NOMBRE, "url": URL_BASE,
             "inLanguage": "es", "description": descripcion,
             "potentialAction": {"@type": "SearchAction", "target": URL_BASE + "buscar/?q={q}", "query-input": "required name=q"}}
    else:
        migas = [("Inicio", URL_BASE)]
        for k, etiqueta, destino in MENU:
            if k == clave and destino and destino != ruta:
                migas.append((etiqueta, URL_BASE + destino))
        migas.append((titulo, URL_BASE + ruta))
        d = {"@context": "https://schema.org", "@type": "BreadcrumbList",
             "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(migas)]}
    return '\n<script type="application/ld+json">' + json.dumps(d, ensure_ascii=False) + '</script>'


def atom():
    items = []
    for e in novedades():
        f = e["fecha"] if len(e["fecha"]) == 10 else e["fecha"] + "-01"
        cont = e["html"].replace("{{BASE}}", URL_BASE)
        primero = BeautifulSoup(cont, "html.parser").find("a")
        enlace = primero["href"] if primero else URL_BASE + "novedades/"
        items.append(f"<entry><title>{esc(e['title'] if 'title' in e else e['titulo'])}</title><link href=\"{esc(enlace)}\"/>"
                     f"<id>{URL_BASE}novedades/#{f}-{slug(e['titulo'])}</id><updated>{f}T12:00:00+01:00</updated>"
                     f"<content type=\"html\">{esc(cont)}</content></entry>")
    ultima = (novedades()[0]["fecha"] + "-01")[:10]
    return ('<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es">'
            f'<title>{NOMBRE} · Novedades</title><subtitle>{LEMA}</subtitle>'
            f'<link href="{URL_BASE}"/><link rel="self" href="{URL_BASE}novedades.xml"/>'
            f'<id>{URL_BASE}</id><updated>{ultima}T12:00:00+01:00</updated><author><name>{NOMBRE}</name></author>'
            + "".join(items) + "</feed>\n")


def redireccion(destino_abs):
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>{NOMBRE}</title>
<link rel="canonical" href="{destino_abs}"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url={destino_abs}"></head>
<body><p>Esta página ha cambiado de dirección: <a href="{destino_abs}">{destino_abs}</a></p></body></html>
"""


# ---------------------------------------------------------------- imágenes

IMG_DIR = RAIZ / "assets" / "img"
LIGERA = 800


def version_ligera(nombre: str):
    """Crea assets/img/800/NOMBRE (800 px de ancho) si la foto es mayor; devuelve (ancho original, ¿hay ligera?)."""
    orig = IMG_DIR / nombre
    im = Image.open(orig)
    w, h = im.size
    if w <= LIGERA + 100:
        return w, False
    dest = IMG_DIR / str(LIGERA) / nombre
    if not dest.exists() or dest.stat().st_mtime < orig.stat().st_mtime:
        dest.parent.mkdir(exist_ok=True)
        im2 = im.copy()
        im2.thumbnail((LIGERA, 10000))
        if dest.suffix.lower() in (".jpg", ".jpeg"):
            im2.convert("RGB").save(dest, quality=80, optimize=True, progressive=True)
        else:
            im2.save(dest, optimize=True)
    return w, True


def procesar_imagenes(s, base):
    imgs = s.find_all("img")
    for i, im in enumerate(imgs):
        src = im.get("src", "")
        pref = f"{base}assets/img/"
        if not src.startswith(pref) or "/800/" in src:
            continue
        nombre = src[len(pref):]
        if not (IMG_DIR / nombre).exists():
            continue
        w, ligera = version_ligera(nombre)
        if ligera:
            im["src"] = f"{pref}{LIGERA}/{nombre}"
            im["srcset"] = f"{pref}{LIGERA}/{nombre} {LIGERA}w, {pref}{nombre} {w}w"
            par = "fotos-par" in " ".join(" ".join(p.get("class") or []) for p in im.parents if p.name == "div")
            im["sizes"] = "(max-width: 44rem) 50vw, 21rem" if par else "(max-width: 44rem) 100vw, 42rem"
        fig = im.find_parent("figure")
        vertical = fig is not None and "vertical" in (fig.get("class") or [])
        if vertical and im.get("width") and im.get("height"):
            # Las verticales se limitan a 34rem de alto. Se les da un ancho calculado
            # para que ocupen su sitio antes de cargar y la carga diferida funcione.
            fw, fh = int(im["width"]), int(im["height"])
            im["style"] = f"width:min(100%,{34 * fw / fh:.2f}rem,{fw}px)"
        if i > 0:
            im["loading"] = "lazy"
        im["decoding"] = "async"
        # Ampliar: enlace a la foto original (el visor lo abre en grande)
        if im.parent.name != "a" and im.find_parent("figure") is not None:
            a = s.new_tag("a", href=f"{pref}{nombre}", attrs={"class": "ampliar", "aria-label": "Ver la foto en grande"})
            im.wrap(a)


# ---------------------------------------------------------------- procesado de cada página

ESTUDIOS = []      # recuadros «En estudio» de toda la web
PETICIONES = []    # recuadros «Una petición»: lo que se busca (fotos, documentos, recuerdos)
INDICE = []        # entradas del buscador


def procesar(texto, ruta, base, titulo, frag):
    s = BeautifulSoup(texto, "html.parser")
    # 1. Anclas en los h2 (y h3 de personas, etc.)
    usados = set(t["id"] for t in s.find_all(id=True))
    for h in s.find_all(["h2"]):
        if not h.get("id"):
            i = base_id = slug(h.get_text(" ", strip=True))
            n = 2
            while i in usados:
                i = f"{base_id}-{n}"; n += 1
            h["id"] = i; usados.add(i)
    # 2. Recuadros «En estudio»: numerados y recogidos para Preguntas abiertas
    for n, e in enumerate(s.select(".estudio"), 1):
        if not e.get("id"):
            e["id"] = f"en-estudio-{n}"
        h = e.find_previous("h2")
        copia = BeautifulSoup(e.decode_contents(), "html.parser")
        st = copia.find("strong")
        peticion = bool(st and st.get_text(strip=True).lower().startswith("una petición"))
        en_estudio = bool(st and st.get_text(strip=True).lower().startswith("en estudio"))
        if not (peticion or en_estudio):
            continue   # otros recuadros (p. ej. «Aviso») no son preguntas abiertas
        st.decompose()
        (PETICIONES if peticion else ESTUDIOS).append(dict(ruta=ruta, titulo=titulo, apartado=h.get_text(" ", strip=True) if h else "",
                             ancla=e["id"], html=str(copia).strip()))
    # 3. Tablas de cuatro o más columnas: fichas en el móvil
    for t in s.select("table"):
        ths = [th.get_text(" ", strip=True) for th in (t.find("thead") or t).find_all("th")]
        if len(ths) >= 4:
            t["class"] = (t.get("class") or []) + ["fichas"]
            for tr in t.select("tbody tr"):
                for td, et in zip(tr.find_all(["td", "th"]), ths):
                    td["data-label"] = et
    # 4. Fotos ligeras, carga diferida y ampliables
    procesar_imagenes(s, base)
    # 4b. Términos del glosario
    enlazar_glosario(s, base, frag)
    # 5. Índice «En esta página» en las páginas largas
    h2s = [h for h in s.find_all("h2") if not h.find_parent(class_=["indice", "ficha", "persona-tarjeta"])]
    palabras = len(s.get_text(" ").split())
    if ruta and frag != "vocabulario" and len(h2s) >= 4 and palabras >= 1100:
        items = "".join(f'<li><a href="#{h["id"]}">{esc(h.get_text(" ", strip=True))}</a></li>' for h in h2s)
        ind = BeautifulSoup(f'<details class="indice"><summary>En esta página <span>({len(h2s)} apartados · {round(palabras/220)} min de lectura)</span></summary><ol>{items}</ol></details>', "html.parser")
        ancla = s.find(class_="entradilla") or s.find("h1")
        if ancla:
            ancla.insert_after(ind)
    # 6. Buscador: el texto de la página partido por apartados
    if frag not in ("buscar", "preguntas"):
        copia = BeautifulSoup(str(s), "html.parser")
        for t in copia.select("script, form, .indice, figcaption .credito, iframe"):
            t.decompose()
        if frag == "vocabulario":
            for dl in copia.select("dl.vocab"):
                for dt in dl.find_all("dt"):
                    dd = dt.find_next_sibling("dd")
                    lema = re.sub(r"\s+", " ", dt.get_text(" ", strip=True))
                    defi = re.sub(r"\s+", " ", dd.get_text(" ", strip=True)) if dd else ""
                    defi = re.sub(r"\s+([,.;:)»?!])", r"\1", re.sub(r"([(«¿¡])\s+", r"\1", defi))
                    INDICE.append({"t": titulo, "a": lema, "u": ruta + "#" + dt["id"], "x": defi})
                dl.decompose()
        MARCA = "⁣§§"
        for h in copia.find_all("h2"):
            h.insert_before(NavigableString(f"{MARCA}{h['id']}|{h.get_text(' ', strip=True)}{MARCA}"))
        trozos = copia.get_text(" ").split(MARCA)
        apartado, ancla = "", ""
        for k, tz in enumerate(trozos):
            if k % 2 == 1:
                ancla, apartado = tz.split("|", 1)
                continue
            limpio = re.sub(r"\s+", " ", tz).strip()
            limpio = re.sub(r"\s+([,.;:)»?!])", r"\1", re.sub(r"([(«¿¡])\s+", r"\1", limpio))
            if apartado:
                limpio = re.sub(r"^" + re.escape(apartado) + r"\s*", "", limpio)
            if len(limpio) < 20:
                continue
            INDICE.append({"t": titulo if ruta else "Portada", "a": apartado, "u": ruta + (f"#{ancla}" if ancla else ""), "x": limpio})
    return str(s)


# ---------------------------------------------------------------- glosario y fechas

# Formas en que aparece cada término del glosario en los textos (id del glosario → expresiones)
FORMAS_GLOSARIO = {
    "alcalde-ordinario": [r"alcaldes? ordinarios?"],
    "arca-madre": [r"Arca Madre"],
    "armadura": [r"armaduras? mudéjar(?:es)?"],
    "beneficiado": [r"beneficiados?"],
    "bic": [r"BIC", r"Bien(?:es)? de Interés Cultural"],
    "cabanuelas": [r"cabañuelas"],
    "camarera": [r"camareras? de la Virgen", r"camareras"],
    "carbunco": [r"carbuncos?"],
    "catastro": [r"Catastro de(?: la Ensenada| Ensenada)"],
    "cilla": [r"cillas?"],
    "comunidad": [r"Comunidad de Villa y Tierra"],
    "corregidor": [r"corregidor(?:es)?"],
    "despoblado": [r"despoblados?"],
    "diezmo": [r"diezmos?"],
    "escabel": [r"escabel"],
    "estado-noble": [r"estado noble", r"estado general"],
    "exvoto": [r"exvotos?"],
    "grisalla": [r"grisallas?"],
    "hidalgo": [r"hidalgos?"],
    "hijuelas": [r"hijuelas"],
    "lavajo": [r"lavajos?"],
    "librea": [r"libreas?"],
    "linaje": [r"linajes"],
    "mayorazgo": [r"mayorazgos?"],
    "mayordomo": [r"mayordom[oa]s?"],
    "mesta": [r"Mesta"],
    "munidor": [r"muñidor(?:es)?"],
    "obrada": [r"obradas?"],
    "ordenanzas": [r"ordenanzas"],
    "pino": [r"a pino"],
    "quintos": [r"quintos"],
    "realengo": [r"realengo"],
    "regidor": [r"regidor(?:es)?"],
    "senorio": [r"señoríos?"],
    "torrejon": [r"torrejon(?:es)?|torrejón"],
}
_GLOSARIO = {}


def glosario_datos():
    """id → (término, primera frase de la definición), leídos de la página del glosario."""
    if not _GLOSARIO:
        s = BeautifulSoup((FUENTE / "glosario.html").read_text(encoding="utf-8"), "html.parser")
        for dt in s.select("dl.glosario dt"):
            dd = dt.find_next_sibling("dd")
            copia = BeautifulSoup(str(dd), "html.parser")
            for a in copia.find_all("a"):
                a.decompose()
            txt = re.sub(r"\s+", " ", copia.get_text(" ", strip=True)).strip(" .")
            frase = re.split(r"(?<=[a-záéíóúñ)])\. ", txt)[0]
            _GLOSARIO[dt["id"]] = (dt.get_text(" ", strip=True), frase + ".")
    return _GLOSARIO


def enlazar_glosario(s, base, frag):
    """Primera aparición de cada término en el texto corrido: enlace discreto al glosario."""
    if frag in ("glosario", "vocabulario", "bibliografia", "buscar", "preguntas", "inicio", "novedades", "colabora", "quienes-somos"):
        return
    datos = glosario_datos()
    pendientes = {k: re.compile(r"(?<![\wáéíóúñÁÉÍÓÚÑ])(" + "|".join(v) + r")(?![\wáéíóúñÁÉÍÓÚÑ])")
                  for k, v in FORMAS_GLOSARIO.items() if k in datos}
    prohibidos = {"a", "h1", "h2", "h3", "figcaption", "caption", "th", "summary", "script", "em", "cite", "nav", "details", "dt"}
    bloques = {"p", "li", "dd", "td"}
    cola = list(s.find_all(string=True))
    while cola and pendientes:
        nodo = cola.pop(0)
        padre = nodo.parent
        if padre is None:
            continue
        cadena = [padre, *padre.parents]
        if not any(x.name in bloques for x in cadena):
            continue
        if any(x.name in prohibidos for x in cadena):
            continue
        if any(set(x.get("class") or []) & {"estudio", "serie", "remite", "acciones", "entradilla"} for x in cadena if getattr(x, "get", None)):
            continue
        texto = str(nodo)
        mejor = None
        for k, rx in pendientes.items():
            m = rx.search(texto)
            if m and (mejor is None or m.start() < mejor[1].start()):
                mejor = (k, m)
        if not mejor:
            continue
        k, m = mejor
        del pendientes[k]
        termino, frase = datos[k]
        a = s.new_tag("a", href=f"{base}biblioteca/glosario/#{k}", attrs={"class": "glosa", "title": f"{termino}: {frase}"})
        a.string = m.group(1)
        cola_txt = NavigableString(texto[m.end():])
        nodo.replace_with(NavigableString(texto[:m.start()]), a, cola_txt)
        cola.insert(0, cola_txt)


_FECHAS = {}


def fecha_fragmento(frag):
    """Fecha (AAAA-MM-DD) del último cambio del fragmento: la de git, o hoy si tiene cambios sin guardar."""
    if frag in _FECHAS:
        return _FECHAS[frag]
    import subprocess
    f = f"_fuente/paginas/{frag}.html"
    sucio = subprocess.run(["git", "status", "--porcelain", "--", f], cwd=RAIZ, capture_output=True, text=True).stdout.strip()
    if sucio:
        d = date.today().isoformat()
    else:
        d = subprocess.run(["git", "log", "-1", "--format=%cs", "--", f], cwd=RAIZ, capture_output=True, text=True).stdout.strip() or date.today().isoformat()
    _FECHAS[frag] = d
    return d


GENERADAS = ("inicio", "novedades", "preguntas", "bibliografia", "personas")


def fecha_pagina(frag):
    if frag in GENERADAS:
        return max(fecha_fragmento(f) for _, f, *_ in PAGINAS)
    return fecha_fragmento(frag)


def pie_lectura(ruta, titulo, frag):
    """Fecha de la última revisión y cómo citar la página."""
    if frag in ("buscar", "colabora"):
        return ""
    f = fecha_pagina(frag)
    d = f"{int(f[8:10])}/{int(f[5:7])}/{f[:4]}"
    cita = f"{NOMBRE}, «{esc(titulo)}», {URL_BASE}{ruta} (revisión del {d})."
    return (f'<div class="revision"><span>Última revisión: <time datetime="{f}">{fecha_larga(f)}</time></span>'
            f'<details class="citar"><summary>Cómo citar esta página</summary><p>{cita}</p></details></div>')


# ---------------------------------------------------------------- piezas generadas

def novedades():
    return json.loads((RAIZ / "_fuente" / "novedades.json").read_text(encoding="utf-8"))


def lista_novedades(base, n=None, compacta=False):
    items = []
    for e in novedades()[:n]:
        texto = e["html"].replace("{{BASE}}", base)
        if compacta:
            txt = BeautifulSoup(texto, "html.parser").get_text(" ", strip=True)
            txt = (txt[:170].rsplit(" ", 1)[0] + "…") if len(txt) > 175 else txt
            primero = BeautifulSoup(texto, "html.parser").find("a")
            destino = primero["href"] if primero else f"{base}novedades/"
            items.append(f'<li><time datetime="{e["fecha"]}">{fecha_larga(e["fecha"])}</time>'
                         f'<a href="{destino}">{esc(e["titulo"])}</a><span>{esc(txt)}</span></li>')
        else:
            items.append(f'<li><time class="nov-fecha" datetime="{e["fecha"]}">{fecha_larga(e["fecha"])}</time>'
                         f'<span class="nov-txt"><strong>{esc(e["titulo"])}</strong>{texto}</span></li>')
    return f'<ul class="{"ultimas" if compacta else "novedades"}">' + "".join(items) + "</ul>"


def tarjetas_personas(base):
    out = []
    for r, frag, n, f in PERSONAS:
        s = BeautifulSoup((FUENTE / f"{frag}.html").read_text(encoding="utf-8"), "html.parser")
        p = s.select_one(".texto p")
        txt = p.get_text(" ", strip=True) if p else ""
        frase = re.split(r"(?<=[a-záéíóúñ\)»])\. ", txt, maxsplit=1)[0].rstrip(".") + "."
        if len(frase) > 230:
            frase = frase[:225].rsplit(" ", 1)[0] + "…"
        out.append(f'<a class="persona-tarjeta" href="{base}{r}"><span class="p-tit">{esc(n)}</span>'
                   f'<span class="fechas">{esc(f)}</span><span class="p-txt">{esc(frase)}</span></a>')
    return '<div class="personas-lista">' + "".join(out) + "</div>"


def bibliografia(base):
    """Artículos de los programas citados en la web, por autores, con las páginas que los citan."""
    arts = json.loads((RAIZ / "_fuente" / "articulos.json").read_text(encoding="utf-8"))
    citas = {}
    for ruta, frag, clave, titulo, desc in PAGINAS:
        if frag in ("bibliografia", "glosario"):
            continue
        txt = (FUENTE / f"{frag}.html").read_text(encoding="utf-8")
        for u in re.findall(r'biblioteca\.amigosdealaejos\.org/(articulos/\d{4}/[^"#?]+\.html)', txt):
            if u in arts:
                lista = citas.setdefault(u, [])
                if (ruta, titulo) not in lista:
                    lista.append((ruta, titulo))
    autores = {}
    for u, pags in citas.items():
        t, a, y = arts[u]
        autores.setdefault(a, []).append((y, t, u, pags))
    clave_orden = lambda a: (a == "Sin firma", unicodedata.normalize("NFD", a).lower())
    orden = sorted(autores, key=clave_orden)
    saltos = " · ".join(f'<a href="#autor-{slug(a)}">{esc(a)}</a>' for a in orden)
    out = [f'<p class="resumen-preguntas"><strong>{len(citas)} artículos</strong> de {len(autores)} autores.</p>'
           f'<p class="saltos-autores">{saltos}</p>']
    for a in orden:
        items = []
        for y, t, u, pags in sorted(autores[a]):
            enl = ", ".join(f'<a href="{base}{r}">{esc(n)}</a>' for r, n in pags)
            items.append(f'<li><span class="anio">{y}</span> <a href="https://biblioteca.amigosdealaejos.org/{u}">«{esc(t)}»</a>'
                         f'<span class="citado">Citado en {enl}.</span></li>')
        out.append(f'<h3 id="autor-{slug(a)}">{esc(a)}</h3><ul class="biblio-prog">{"".join(items)}</ul>')
    return "".join(out)


def preguntas(base):
    from urllib.parse import quote
    claves = {r: k for r, _, k, _, _ in PAGINAS}
    nombres = {k: e for k, e, _ in MENU}
    por_pagina = {}
    for e in ESTUDIOS:
        por_pagina.setdefault((e["ruta"], e["titulo"]), []).append(e)
    orden = [r for r, *_ in PAGINAS]
    secciones = {}
    for (ruta, titulo), es in sorted(por_pagina.items(), key=lambda kv: orden.index(kv[0][0])):
        secciones.setdefault(claves.get(ruta, ""), []).append((ruta, titulo, es))
    bloques = []
    for clave, paginas in secciones.items():
        total = sum(len(es) for _, _, es in paginas)
        partes = []
        for ruta, titulo, es in paginas:
            items = []
            for e in es:
                sobre = quote(f'{titulo} — {e["apartado"]}' if e["apartado"] else titulo)
                items.append(
                    f'<li>{"<strong>" + esc(e["apartado"]) + ".</strong> " if e["apartado"] else ""}'
                    f'{esc(BeautifulSoup(e["html"], "html.parser").get_text(" ", strip=True))} '
                    f'<span class="preg-acc"><a href="{base}{ruta}#{e["ancla"]}">Ver en la página</a> · '
                    f'<a href="{base}colabora/?motivo=correccion&amp;sobre={sobre}#contacto">Puedo aclararlo</a></span></li>')
            partes.append(f'<details class="preg-pagina" id="{slug(titulo)}"><summary><span>{esc(titulo)}</span> '
                          f'<span class="cuenta">{len(es)}</span></summary><ol class="preguntas">{"".join(items)}</ol></details>')
        bloques.append(f'<h2 id="sec-{clave or "otras"}">{esc(nombres.get(clave, "Otras páginas"))} <span class="cuenta">{total}</span></h2>' + "".join(partes))
    pets = []
    for e in sorted(PETICIONES, key=lambda e: orden.index(e["ruta"])):
        sobre = quote(e["titulo"])
        pets.append(f'<li><strong>{esc(e["titulo"])}.</strong> {esc(BeautifulSoup(e["html"], "html.parser").get_text(" ", strip=True))} '
                    f'<span class="preg-acc"><a href="{base}{e["ruta"]}#{e["ancla"]}">Ver en la página</a> · '
                    f'<a href="{base}colabora/?motivo=material&amp;sobre={sobre}#contacto">Tengo algo</a></span></li>')
    buscamos = (f'<h2 id="que-buscamos">Qué buscamos <span class="cuenta">{len(PETICIONES)}</span></h2>'
                f'<p>Además de resolver dudas, nos ayudaría mucho reunir fotografías, documentos y recuerdos sobre estos temas:</p>'
                f'<ol class="preguntas">{"".join(pets)}</ol>') if pets else ""
    return (f'<p class="resumen-preguntas"><strong>{len(ESTUDIOS)} preguntas</strong> en {len(por_pagina)} páginas'
            f'{f" y <a href=\"#que-buscamos\">{len(PETICIONES)} peticiones</a> de materiales" if pets else ""}. '
            f'Pulse en una página para ver sus dudas.</p>' + "".join(bloques) + buscamos)


# ---------------------------------------------------------------- imagen para compartir

TTF = RAIZ / "_fuente" / "ttf"


def imagen_og(ruta, titulo, seccion):
    nombre = (slug(ruta.strip("/").replace("/", "-")) or "portada") + ".jpg"
    dest = RAIZ / "assets" / "og" / nombre
    huella = hashlib.md5(f"{titulo}|{seccion}|v2".encode()).hexdigest()[:10]
    marca = dest.with_suffix(".txt")
    if dest.exists() and marca.exists() and marca.read_text() == huella:
        return f"assets/og/{nombre}"
    dest.parent.mkdir(exist_ok=True)
    W, H = 1200, 630
    papel, sepia, tinta = (253, 252, 250), (139, 115, 85), (34, 30, 25)
    im = Image.new("RGB", (W, H), papel)
    d = ImageDraw.Draw(im)
    fell = lambda t: ImageFont.truetype(str(TTF / "im-fell-dw-pica-latin-400-normal.ttf"), t)
    util = ImageFont.truetype(str(TTF / "source-sans-3-latin-600-normal.ttf"), 30)
    esc_ = Image.open(RAIZ / "assets" / "escudo.png").convert("LA").split()[1]
    eh = 92; ew = int(esc_.width * eh / esc_.height)
    im.paste(Image.new("RGB", (ew, eh), sepia), (80, 64), esc_.resize((ew, eh), Image.LANCZOS))
    d.text((80 + ew + 22, 78), NOMBRE.upper(), font=util, fill=sepia)
    d.text((80 + ew + 22, 116), seccion, font=ImageFont.truetype(str(TTF / "source-sans-3-latin-400-normal.ttf"), 28), fill=(107, 99, 89))
    tam = 86
    while True:
        f = fell(tam); lineas = []; linea = ""
        for w in titulo.split():
            prueba = (linea + " " + w).strip()
            if d.textlength(prueba, font=f) > W - 160 and linea:
                lineas.append(linea); linea = w
            else:
                linea = prueba
        lineas.append(linea)
        if len(lineas) <= 3 or tam <= 56:
            break
        tam -= 8
    y = 210
    for l in lineas[:3]:
        d.text((80, y), l, font=f, fill=tinta); y += int(tam * 1.12)
    sk = Image.open(RAIZ / "assets" / "skyline.png").convert("LA").split()[1]
    sw = 720; sh = int(sk.height * sw / sk.width)
    im.paste(Image.new("RGB", (sw, sh), sepia), (W - sw - 60, H - sh - 30), sk.resize((sw, sh), Image.LANCZOS))
    im.save(dest, quality=84, optimize=True)
    marca.write_text(huella)
    return f"assets/og/{nombre}"


# ---------------------------------------------------------------- construcción

def construir():
    hoy = date.today().isoformat()
    ESTUDIOS.clear(); PETICIONES.clear(); INDICE.clear()
    titulos_seccion = {k: e for k, e, _ in MENU}
    cuerpos = {}
    for ruta, frag, clave, titulo, desc in PAGINAS:
        texto = (FUENTE / f"{frag}.html").read_text(encoding="utf-8")
        base = profundidad(ruta)
        texto = (texto.replace("{{CONTACTO}}", contacto())
                      .replace("{{NOVEDADES}}", lista_novedades(base))
                      .replace("{{NOVEDADES_PORTADA}}", lista_novedades(base, 3, compacta=True))
                      .replace("{{PERSONAS}}", tarjetas_personas(base))
                      .replace("{{BASE}}", base))
        cuerpos[ruta] = procesar(texto, ruta, base, titulo if ruta else NOMBRE, frag)
    # Preguntas abiertas: se rellena con lo recogido en todas las páginas
    for ruta, frag, clave, titulo, desc in PAGINAS:
        if frag == "preguntas":
            cuerpos[ruta] = cuerpos[ruta].replace("{{PREGUNTAS}}", preguntas(profundidad(ruta)))
        if frag == "bibliografia":
            cuerpos[ruta] = cuerpos[ruta].replace("{{BIBLIOGRAFIA}}", bibliografia(profundidad(ruta)))
    urls = []
    for ruta, frag, clave, titulo, desc in PAGINAS:
        base = profundidad(ruta)
        texto = cuerpos[ruta]
        if ruta == "":
            cuerpo = f'<main id="contenido">{texto}</main>'
        else:
            cuerpo = f'<main id="contenido" class="lectura">{texto}{acciones(ruta, titulo, base, frag)}{pie_lectura(ruta, titulo, frag)}{vecinos(ruta, base)}</main>'
        seccion = {"": LEMA}.get(ruta) or (titulos_seccion.get(clave) or "Amigos de Alaejos")
        if clave == "personas" and ruta != "personas-de-alaejos/":
            seccion = "Personas de Alaejos"
        og = imagen_og(ruta, NOMBRE if ruta == "" else titulo, seccion)
        extra = ""
        if frag == "mapa":
            extra = f'\n<link rel="stylesheet" href="{base}assets/js/leaflet.css">'
        destino = RAIZ / ruta / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(pagina(ruta, titulo, desc, cuerpo, clave, og, es_portada=(ruta == ""), extra_head=extra), encoding="utf-8")
        if frag != "buscar":
            urls.append((URL_BASE + ruta, fecha_pagina(frag)))

    (RAIZ / "novedades.xml").write_text(atom(), encoding="utf-8")
    (RAIZ / "assets" / "buscar.json").write_text(json.dumps(INDICE, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    for vieja, nueva in REDIRECCIONES.items():
        destino = RAIZ / vieja / "index.html"
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(redireccion(URL_BASE + nueva), encoding="utf-8")

    cuerpo404 = ('<main id="contenido" class="lectura"><h1 class="h-pag">No encontramos esa página</h1>'
                 '<p>Puede que la dirección esté mal escrita o que la página haya cambiado de sitio. '
                 'Pruebe con el <a href="/buscar/">buscador</a>, vuelva a la <a href="/">portada</a> o busque en la '
                 '<a href="https://biblioteca.amigosdealaejos.org/">biblioteca</a>.</p></main>')
    t404 = pagina("x/", "Página no encontrada", "Página no encontrada.", cuerpo404, "", "assets/og/portada.jpg")
    t404 = t404.replace('href="../', 'href="/').replace('src="../', 'src="/').replace('<link rel="canonical" href="https://www.amigosdealaejos.org/x/">', '')
    (RAIZ / "404.html").write_text(t404, encoding="utf-8")

    mapa = "".join(f"<url><loc>{u}</loc><lastmod>{f}</lastmod></url>" for u, f in urls)
    (RAIZ / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        + mapa + "</urlset>\n", encoding="utf-8")
    (RAIZ / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {URL_BASE}sitemap.xml\n", encoding="utf-8")
    print(f"{len(PAGINAS)} páginas, {len(REDIRECCIONES)} redirecciones, {len(ESTUDIOS)} preguntas abiertas, "
          f"{len(INDICE)} entradas en el buscador.")


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
  var q=new URLSearchParams(location.search);
  if(q.get('motivo')){form.motivo.value=q.get('motivo');}
  if(q.get('sobre')){form.mensaje.value='Sobre «'+q.get('sobre')+'»:\\n\\n';}
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
