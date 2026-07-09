// api/enviar-portada.js
// Función serverless de Vercel. Recibe la imagen de la portada (multipart/form-data)
// y la reenvía por correo, como adjunto, usando el propio Gmail (SMTP) para que
// el remitente coincida exactamente con el filtro "Sender" del Gmail Trigger en n8n.

import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false, // necesitamos el body crudo para parsear multipart nosotros mismos
  },
};

const GMAIL_USER = process.env.GMAIL_USER;         // ej. robecardenas@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD; // los 16 caracteres, sin espacios
const DESTINO_EMAIL = process.env.DESTINO_EMAIL;   // normalmente el mismo GMAIL_USER

// Parser simple de multipart/form-data (evita depender de librerías externas)
async function parseMultipart(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);

  const contentType = req.headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch) throw new Error('No se encontró el boundary de multipart');
  const boundary = '--' + boundaryMatch[1];

  const parts = buffer.toString('binary').split(boundary);
  for (const part of parts) {
    if (part.includes('filename=')) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const header = part.slice(0, headerEnd);
      const filenameMatch = header.match(/filename="(.+?)"/);
      const typeMatch = header.match(/Content-Type:\s*(.+)/i);
      const filename = filenameMatch ? filenameMatch[1] : 'portada.jpg';
      const mimeType = typeMatch ? typeMatch[1].trim() : 'image/jpeg';

      let content = part.slice(headerEnd + 4);
      content = content.slice(0, content.lastIndexOf('\r\n'));

      const fileBuffer = Buffer.from(content, 'binary');
      return { filename, mimeType, fileBuffer };
    }
  }
  throw new Error('No se encontró ningún archivo en el request');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !DESTINO_EMAIL) {
    return res.status(500).json({
      error: 'Faltan variables de entorno (GMAIL_USER, GMAIL_APP_PASSWORD o DESTINO_EMAIL) en Vercel'
    });
  }

  try {
    const { filename, mimeType, fileBuffer } = await parseMultipart(req);

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'El archivo debe ser una imagen' });
    }

    const fechaHoy = new Date().toLocaleDateString('es-MX', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const base64Data = fileBuffer.toString('base64');
    // Normaliza el tipo a algo que el regex del workflow reconozca (png|jpeg|jpg|webp)
    const tipoNormalizado = mimeType.includes('png') ? 'png'
      : mimeType.includes('webp') ? 'webp'
      : 'jpeg';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `Portada El Horizonte <${GMAIL_USER}>`,
      to: DESTINO_EMAIL,
      subject: `Portada El Horizonte — ${fechaHoy}`,
      // La imagen va INCRUSTADA en el HTML como base64 (data URI),
      // no como adjunto — así es como el workflow de n8n la espera leer.
      html: `<p>Portada recibida vía formulario web el ${fechaHoy}.</p>
             <img src="data:image/${tipoNormalizado};base64,${base64Data}" alt="portada" />`,
      text: `Portada recibida vía formulario web el ${fechaHoy}. (imagen incrustada en el HTML)`,
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error enviando portada:', err);
    return res.status(500).json({ error: err.message });
  }
}
