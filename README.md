# Amigos de Alaejos

Web de **www.amigosdealaejos.org**: archivo abierto de historia, patrimonio y memoria de la villa de Alaejos (Valladolid).

Es un sitio estático, sin dependencias, pensado para GitHub Pages. Comparte imagen con la [Biblioteca de los programas de fiestas](https://biblioteca.amigosdealaejos.org/).

## Estructura

| Ruta | Qué es |
|---|---|
| `index.html` y carpetas (`historia-del-pueblo/`, `patrimonio/`…) | Páginas publicadas (se generan, no se editan a mano) |
| `_fuente/paginas/` | Texto de cada página. **Aquí se corrige el contenido.** |
| `_fuente/construir.py` | Une cada texto con la cabecera, el menú y el pie, y genera páginas, `sitemap.xml`, `robots.txt`, `404.html` y las redirecciones de las direcciones antiguas de Google Sites |
| `assets/` | Estilos, escudo, horizonte e imagen para redes sociales (`og.png`) |

## Cómo cambiar un texto o añadir una página

1. Edita el archivo correspondiente en `_fuente/paginas/` (o crea uno nuevo y añádelo a `PAGINAS` en `_fuente/construir.py`).
2. Ejecuta `python3 _fuente/construir.py`.
3. Sube los cambios.

## Formulario de contacto

El formulario de la página «Colabora» envía los mensajes a un script de Google Apps Script (`_fuente/formulario-contacto.gs`), que los reenvía por correo a la cuenta que lo publica, sin mostrar la dirección en la web. Las instrucciones de instalación están al principio del script. Su dirección `/exec` se pone en `ENDPOINT_FORMULARIO`, al principio de `_fuente/construir.py`.

## Criterios

Lo que no está documentado se dice. Donde las fuentes no coinciden, se marca como **en estudio** en lugar de elegir una versión.
