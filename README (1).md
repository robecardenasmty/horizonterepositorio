# El Horizonte Express — Portal de subida de portada

Página web pública donde cualquiera puede subir la foto de la portada del
periódico. Al subirla, se manda automáticamente por correo (con la imagen
adjunta) **desde tu propia cuenta de Gmail** a la dirección que dispara el
Gmail Trigger de tu workflow en n8n — así el correo llega con el mismo
remitente de siempre (`robecardenas@gmail.com`), sin necesidad de tocar el
filtro de "Sender" que ya tienes configurado en n8n.

## 1. Generar una contraseña de aplicación de Gmail

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   (necesitas tener la verificación en 2 pasos activada; si no la tienes, Google
   te va a pedir activarla primero).
2. Genera una nueva, ponle un nombre como "Horizonte Upload".
3. Copia el código de 16 caracteres que te da (sin espacios) — lo vas a
   necesitar en el paso 3.

## 2. Subir el proyecto a GitHub

1. Crea un repo nuevo, ej. `horizonte-upload-portada`.
2. Sube estos archivos tal cual están: `public/index.html`,
   `api/enviar-portada.js`, `vercel.json`, `package.json`.

## 3. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Conecta el repo que acabas de crear.
3. Antes de darle "Deploy", en la sección **Environment Variables**, agrega:

   | Name | Value |
   |---|---|
   | `GMAIL_USER` | `robecardenas@gmail.com` (tu Gmail completo) |
   | `GMAIL_APP_PASSWORD` | los 16 caracteres del paso 1, sin espacios |
   | `DESTINO_EMAIL` | normalmente el mismo `robecardenas@gmail.com` |

4. Dale **Deploy**. En 1-2 minutos tendrás una URL tipo
   `https://horizonte-upload-portada.vercel.app`.

## 4. Probar

1. Abre la URL en tu celular o computadora.
2. Sube una foto de prueba (JPG o PNG).
3. Dale "Enviar portada".
4. Revisa tu Gmail — debería llegar en segundos, con la imagen adjunta y
   remitente `robecardenas@gmail.com` (el mismo de siempre).
5. Como el remitente coincide exactamente con tu filtro de "Sender" en el
   Gmail Trigger, el workflow debería arrancar solo, sin tocar nada en n8n.

## 5. Notas

- **Es pública, sin clave** — cualquiera con el link puede subir una imagen.
  Si más adelante quieres protegerla, se puede agregar una contraseña simple
  sin mucho esfuerzo adicional.
- **Límite de Gmail:** cuentas normales de Gmail permiten hasta ~500 correos
  salientes al día vía SMTP — de sobra para esta portada diaria.
- Este proyecto usa `nodemailer`, declarado en `package.json` — Vercel lo
  instala automáticamente al desplegar, no necesitas hacer nada manual.
- **Seguridad:** la contraseña de aplicación vive únicamente como variable de
  entorno en Vercel (nunca en el código ni en el repo de GitHub) — es la forma
  correcta y segura de manejarla.

