# Amigos de Alaejos

Web de **www.amigosdealaejos.org**: archivo abierto de historia, patrimonio y memoria de la villa de Alaejos (Valladolid).

Es un sitio estático, sin dependencias, pensado para GitHub Pages. Comparte imagen con la [Biblioteca de los programas de fiestas](https://biblioteca.amigosdealaejos.org/).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` y carpetas (`historia-del-pueblo/`, `patrimonio/`…) | Páginas publicadas (se generan, no se editan a mano) |
| `_fuente/paginas/` | Texto de cada página. **Aquí se corrige el contenido.** |
| `_fuente/novedades.json` | Entradas de Novedades, con su fecha; las tres últimas salen en la portada |
| `_fuente/personas.json` | Lista de personas (cada una tiene su texto en `_fuente/paginas/persona-*.html`) |
| `_fuente/construir.py` | Une cada texto con la cabecera, el menú y el pie, y genera páginas, `sitemap.xml`, `robots.txt`, `404.html` y las redirecciones de las direcciones antiguas de Google Sites |
| `assets/` | Estilos, tipografías propias (`fuentes/`), escudo, horizonte, fotos (`img/` y sus versiones ligeras `img/800/`), imagen para compartir de cada página (`og/`), scripts (`js/`) e índice del buscador (`buscar.json`) |

## Cómo cambiar un texto o añadir una página

1. Edita el archivo correspondiente en `_fuente/paginas/` (o crea uno nuevo y añádelo a `PAGINAS` en `_fuente/construir.py`).
2. Ejecuta `python3 _fuente/construir.py` (necesita `beautifulsoup4` y `Pillow`). Además de las páginas, genera el buscador, la página de Preguntas abiertas (reúne los recuadros «En estudio»), el índice de las páginas largas, las versiones ligeras de las fotos y la imagen para compartir de cada página.
3. Sube los cambios.

## Formulario de contacto

El formulario de la página «Colabora» envía los mensajes a un script de Google Apps Script (`_fuente/formulario-contacto.gs`), que los reenvía por correo a la cuenta que lo publica, sin mostrar la dirección en la web. Las instrucciones de instalación están al principio del script. Su dirección `/exec` se pone en `ENDPOINT_FORMULARIO`, al principio de `_fuente/construir.py`.

## Criterios

Lo que no está documentado se dice. Donde las fuentes no coinciden, se marca como **en estudio** en lugar de elegir una versión.
