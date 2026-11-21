# Amigos de Alaejos

Web de **www.amigosdealaejos.org**: archivo abierto de historia, patrimonio y memoria de la villa de Alaejos (Valladolid).

Es un sitio estático, sin dependencias, pensado para GitHub Pages. Incluye la Biblioteca, con los artículos de los programas de fiestas, que hasta noviembre de 2026 estaban en biblioteca.amigosdealaejos.org (ese repositorio solo redirige ya a las direcciones nuevas).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` y carpetas (`historia-del-pueblo/`, `patrimonio/`…) | Páginas publicadas (se generan, no se editan a mano) |
| `_fuente/paginas/` | Texto de cada página. **Aquí se corrige el contenido.** |
| `_fuente/novedades.json` | Entradas de Novedades, con su fecha; las tres últimas salen en la portada |
| `_fuente/personas.json` | Lista de personas (cada una tiene su texto en `_fuente/paginas/persona-*.html`) |
| `_fuente/programas.json` | Los artículos de los programas de fiestas: título, autor, tema, año, página en el compendio impreso y cita. Su texto está en `_fuente/paginas/programas/AÑO/slug.html` |
| `documentos/` | PDF descargables: compendios de los programas, novenas, cancionero, autorizaciones de la torre |
| `_fuente/construir.py` | Une cada texto con la cabecera, el menú y el pie, y genera páginas, `sitemap.xml`, `robots.txt`, `404.html` y las redirecciones de las direcciones antiguas de Google Sites |
| `assets/` | Estilos, tipografías propias (`fuentes/`), escudo, horizonte, fotos (`img/` y sus versiones ligeras `img/800/`), imagen para compartir de cada página (`og/`), scripts (`js/`) e índice del buscador (`buscar.json`) |

## Cómo cambiar un texto o añadir una página

1. Edita el archivo correspondiente en `_fuente/paginas/` (o crea uno nuevo y añádelo a `PAGINAS` en `_fuente/construir.py`).
2. Ejecuta `python3 _fuente/construir.py` (necesita `beautifulsoup4` y `Pillow`). Además de las páginas, genera el buscador, la página de Preguntas abiertas (reúne los recuadros «En estudio»), el índice de las páginas largas, las versiones ligeras de las fotos y la imagen para compartir de cada página.
   - Las fechas de «Última revisión» y del sitemap salen del historial de git, así que el script se detiene si la copia no lo tiene completo (por ejemplo, tras `git clone --depth=1`). Se arregla con `git fetch --depth=100000 origin main`.
   - Al terminar avisa de las fotos de más de 1 MB o de más de 2.400 px de lado, y del tamaño total del sitio (GitHub Pages admite hasta 1 GB). Conviene reducir las fotos antes de subirlas: una vez subidas, quedan para siempre en el historial aunque luego se sustituyan.
3. Sube los cambios.

## Formulario de contacto

El formulario de la página «Colabora» envía los mensajes a un script de Google Apps Script (`_fuente/formulario-contacto.gs`), que los reenvía por correo a la cuenta que lo publica, sin mostrar la dirección en la web. Las instrucciones de instalación están al principio del script. Su dirección `/exec` se pone en `ENDPOINT_FORMULARIO`, al principio de `_fuente/construir.py`.

## Criterios

Lo que no está documentado se dice. Donde las fuentes no coinciden, se marca como **en estudio** en lugar de elegir una versión.

## Los artículos de los programas de fiestas

Cada artículo se publica en `biblioteca/programas-de-fiestas/AÑO/slug/`, con su autor, su tema, la cita, la página del compendio impreso, las páginas de la web que lo citan y otros artículos del mismo autor y tema. Los listados por años, temas y autores, la Bibliografía y el buscador se generan solos.

- Para corregir un artículo: su texto en `_fuente/paginas/programas/AÑO/slug.html`; sus datos en `_fuente/programas.json`.
- Para añadir uno: el texto en esa carpeta y una entrada en `programas.json`, en su lugar cronológico.
- Para citarlo desde otra página: `{{BASE}}biblioteca/programas-de-fiestas/AÑO/slug/`. Si se copia por error una dirección antigua de biblioteca.amigosdealaejos.org, el script la convierte y avisa.
