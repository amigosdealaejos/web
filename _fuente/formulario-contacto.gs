/**
 * Formulario de contacto de www.amigosdealaejos.org
 *
 * Recibe los mensajes de la página «Colabora» y los reenvía por correo a la cuenta
 * de Google desde la que se publica este script. La dirección no aparece en la web.
 *
 * Instalación (una sola vez):
 *  1. En https://script.google.com, «Nuevo proyecto». Pega este código y guarda.
 *  2. Elige la función «probarEnvio» y pulsa «Ejecutar». Acepta los permisos.
 *     Debe llegarte un correo de prueba.
 *  3. «Implementar» → «Nueva implementación» → tipo «Aplicación web».
 *     Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario.
 *  4. Copia la URL que termina en /exec y ponla en ENDPOINT_FORMULARIO,
 *     en _fuente/construir.py.
 */

const CLAVE = 'ada-web-2026';          // la misma que CLAVE_FORMULARIO en construir.py
const MAX_MENSAJES_POR_HORA = 20;      // freno contra envíos masivos
const TIEMPO_MINIMO_MS = 3000;         // un humano tarda más de 3 s en rellenarlo

const MOTIVOS = {
  material: 'Tengo fotografías, programas o documentos',
  correccion: 'Una corrección o un dato',
  otra: 'Otra consulta',
};

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    // Filtros contra robots: clave, campo trampa y tiempo de relleno
    if (d.k !== CLAVE) return respuesta('ok');
    if (d.web) return respuesta('ok');
    if (Number(d.t) < TIEMPO_MINIMO_MS) return respuesta('ok');

    const nombre = limpiar(d.nombre, 120);
    const email = limpiar(d.email, 200);
    const motivo = MOTIVOS[d.motivo] || MOTIVOS.otra;
    const mensaje = limpiar(d.mensaje, 5000);
    if (!nombre || !mensaje || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respuesta('error');
    if (!dentroDelLimite()) return respuesta('error');

    const destino = Session.getEffectiveUser().getEmail();
    const fecha = Utilities.formatDate(new Date(), 'Europe/Madrid', "d/MM/yyyy 'a las' HH:mm");

    MailApp.sendEmail({
      to: destino,
      replyTo: email,
      name: 'Web Amigos de Alaejos',
      subject: 'Amigos de Alaejos · ' + motivo + ' · ' + nombre,
      body:
        'Nuevo mensaje desde amigosdealaejos.org\n\n' +
        'Nombre: ' + nombre + '\nCorreo: ' + email + '\nMotivo: ' + motivo + '\nFecha: ' + fecha + '\n\n' +
        mensaje + '\n\n— Responde a este correo para contestar directamente a ' + nombre + '.',
      htmlBody:
        '<div style="font-family:Georgia,serif;font-size:16px;line-height:1.55;color:#221E19">' +
        '<p style="color:#8B7355;font-size:18px;margin:0 0 12px"><b>Nuevo mensaje desde amigosdealaejos.org</b></p>' +
        '<p style="margin:0 0 4px"><b>Nombre:</b> ' + html(nombre) + '</p>' +
        '<p style="margin:0 0 4px"><b>Correo:</b> ' + html(email) + '</p>' +
        '<p style="margin:0 0 4px"><b>Motivo:</b> ' + html(motivo) + '</p>' +
        '<p style="margin:0 0 16px;color:#6B6359"><b>Fecha:</b> ' + html(fecha) + '</p>' +
        '<div style="border-left:3px solid #8B7355;padding:8px 14px;background:#F4F0E9;white-space:pre-wrap">' + html(mensaje) + '</div>' +
        '<p style="color:#6B6359;font-size:14px;margin-top:16px">Responde a este correo para contestar directamente a ' + html(nombre) + '.</p>' +
        '</div>',
    });
    return respuesta('ok');
  } catch (err) {
    console.error(err);
    return respuesta('error');
  }
}

// Abre la URL /exec en el navegador para comprobar que el script está publicado.
function doGet() {
  return respuesta('El formulario de Amigos de Alaejos está activo.');
}

// Ejecútala una vez desde el editor para dar permisos y comprobar que el correo llega.
function probarEnvio() {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Prueba del formulario de Amigos de Alaejos',
    'Si lees esto, el formulario de amigosdealaejos.org puede enviarte correos.');
}

function dentroDelLimite() {
  const cache = CacheService.getScriptCache();
  const clave = 'envios-' + Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyyMMddHH');
  const n = Number(cache.get(clave) || 0);
  if (n >= MAX_MENSAJES_POR_HORA) return false;
  cache.put(clave, String(n + 1), 3700);
  return true;
}

function limpiar(valor, max) {
  return String(valor || '').replace(/\r\n?/g, '\n').trim().slice(0, max);
}

function html(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function respuesta(texto) {
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.TEXT);
}
