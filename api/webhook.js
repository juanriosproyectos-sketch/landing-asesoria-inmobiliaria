// api/webhook.js
// Función serverless de Vercel: recibe los webhooks de comentarios de Instagram/Facebook
// y, si el comentario contiene una palabra clave, manda una respuesta privada (DM)
// con un link a WhatsApp.
//
// DÓNDE VA: copia este archivo dentro de la carpeta /api de tu proyecto de Vercel
// (mismo repo que tu landing page), como /api/webhook.js
//
// VARIABLES DE ENTORNO que debes configurar en Vercel (Settings > Environment Variables):
//   WEBHOOK_VERIFY_TOKEN  -> el token que generamos (debe ser IDÉNTICO al que pongas en Meta)
//   PAGE_ACCESS_TOKEN     -> el token que te da Meta en el paso "2. Generar tokens de acceso"

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const DM_MESSAGE =
  "Hola 👋 Para darte una recomendación sobre el potencial de tu terreno o proyecto, sigamos por WhatsApp — ahí te hago unas preguntas rápidas (1 min) 👇 https://wa.me/523113973738?text=Hola%2C%20quiero%20más%20información";

// Variantes de la respuesta PÚBLICA al comentario (se elige una al azar para no repetir siempre lo mismo)
const PUBLIC_REPLY_VARIATIONS = [
  "¡Gracias por tu interés! Te escribí al DM 📩",
  "¡Va! Revisa tu bandeja de mensajes directos 📩",
  "Te mandé toda la info al DM 👀📩",
];

// Palabras clave que disparan la automatización
const KEYWORDS = ["proyecto", "mercado", "terreno", "valor", "decision"];

module.exports = async (req, res) => {
  // --- Verificación inicial del webhook (Meta la manda UNA vez al guardar la configuración) ---
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verificado correctamente.");
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verificación fallida: token incorrecto.");
  }

  // --- Eventos reales (cada vez que alguien comenta) ---
  if (req.method === "POST") {
    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];

      if (change?.field === "comments") {
        const commentText = normalize(change.value?.text || "");
        const commentId = change.value?.id;

        const matched = KEYWORDS.find((kw) => commentText.includes(kw));

        if (matched && commentId) {
          const publicReply =
            PUBLIC_REPLY_VARIATIONS[
              Math.floor(Math.random() * PUBLIC_REPLY_VARIATIONS.length)
            ];
          await sendPublicReply(commentId, publicReply);
          await sendPrivateReply(commentId, DM_MESSAGE);
          console.log(`Palabra clave "${matched}" detectada, respuestas enviadas.`);
        }
      }
    } catch (err) {
      console.error("Error procesando el webhook:", err);
    }

    // Meta necesita un 200 rápido o reintenta el envío del evento.
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(405).send("Método no permitido");
};

// Quita acentos y pasa a minúsculas, para que "decision" y "decisión" hagan match igual.
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Manda una respuesta PÚBLICA visible debajo del comentario original.
async function sendPublicReply(commentId, message) {
  const url = `https://graph.facebook.com/v21.0/${commentId}/replies`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: PAGE_ACCESS_TOKEN,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Error al enviar la respuesta pública:", data);
  }
  return data;
}

// Manda una respuesta privada (DM) como reacción a un comentario específico.
async function sendPrivateReply(commentId, message) {
  const url = `https://graph.facebook.com/v21.0/${commentId}/private_replies`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      access_token: PAGE_ACCESS_TOKEN,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Error al enviar la respuesta privada:", data);
  }
  return data;
}
