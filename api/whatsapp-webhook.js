// api/whatsapp-webhook.js
// Recibe los mensajes entrantes de WhatsApp Cloud API y conduce la conversación
// de calificación de leads: pregunta filtro -> ramificación sí/no -> preguntas
// de seguimiento -> oferta de asesoría -> link de calendario.
//
// DÓNDE VA: /api/whatsapp-webhook.js (mismo proyecto de Vercel que webhook.js)
//
// VARIABLES DE ENTORNO que debes configurar en Vercel:
//   WHATSAPP_VERIFY_TOKEN     -> un token que tú inventes (puede ser distinto al de Instagram)
//   WHATSAPP_TOKEN            -> token permanente de WhatsApp Cloud API (te lo da Meta)
//   WHATSAPP_PHONE_NUMBER_ID  -> ID del número de WhatsApp (NO es el número, es un ID, te lo da Meta)
//   KV_REST_API_URL           -> se agrega SOLO al conectar "Vercel KV" desde tu dashboard de Vercel
//   KV_REST_API_TOKEN         -> igual, se agrega automático al conectar Vercel KV

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const CALENDAR_LINK = "https://calendar.app.google/umEA1EJWG8k4Caw29";

module.exports = async (req, res) => {
  // --- Verificación inicial del webhook ---
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verificación fallida.");
  }

  // --- Mensajes entrantes ---
  if (req.method === "POST") {
    try {
      const body = req.body;
      const value = body?.entry?.[0]?.changes?.[0]?.value;
      const message = value?.messages?.[0];

      if (message?.type === "text") {
        const from = message.from; // número del usuario (formato internacional, sin '+')
        const text = message.text.body;
        await handleIncomingMessage(from, text);
      }
    } catch (err) {
      console.error("Error procesando mensaje de WhatsApp:", err);
    }
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(405).send("Método no permitido");
};

// ===================================================================
// LÓGICA DE LA CONVERSACIÓN (el "árbol" de preguntas)
// ===================================================================
async function handleIncomingMessage(from, text) {
  const answer = normalize(text);
  const state = await getState(from);

  // --- Conversación nueva: nadie ha hablado con este número antes ---
  if (!state) {
    await sendMessages(from, [
      "Hola 👋 gracias por escribir.",
      "Para poder ayudarte mejor, necesito hacerte unas preguntas rápidas (menos de 1 minuto).",
      "1. ¿Tienes actualmente un terreno o estás evaluando invertir?",
    ]);
    await setState(from, { step: "awaiting_filter" });
    return;
  }

  switch (state.step) {
    // Pregunta filtro principal: ¿tiene terreno o no?
    case "awaiting_filter": {
      if (isYes(answer)) {
        await sendMessages(from, [
          "Perfecto.",
          "2. ¿En qué ciudad o zona se encuentra tu terreno?",
        ]);
        await setState(from, { step: "awaiting_zone" });
      } else if (isNo(answer)) {
        await sendMessages(from, [
          "Entiendo.",
          "¿Qué tipo de asesoría estás buscando? (por ejemplo: inversión, desarrollo, análisis de proyecto, etc.)",
        ]);
        await setState(from, { step: "awaiting_type" });
      } else {
        await sendMessages(from, [
          "Disculpa, ¿me confirmas con un sí o un no? ¿Tienes actualmente un terreno o estás evaluando invertir?",
        ]);
      }
      break;
    }

    // CASO 1 (tiene terreno) - pregunta de zona
    case "awaiting_zone": {
      await sendMessages(from, [
        "Gracias.",
        "3. ¿Qué te gustaría hacer con ese terreno o proyecto?",
      ]);
      await setState(from, { ...state, step: "awaiting_purpose", zone: text });
      break;
    }

    // CASO 1 - pregunta de propósito -> transición a oferta
    case "awaiting_purpose": {
      await sendMessages(from, [
        "Perfecto, con la información que me compartes ya hay varios puntos importantes que se deben analizar antes de tomar una decisión, especialmente en temas de viabilidad, tipo de desarrollo y rentabilidad.",
        "El siguiente paso es agendar una sesión personalizada de 45 minutos, donde se analiza tu caso a detalle y se te da una recomendación clara basada en números, no suposiciones.\n\nLa inversión de la asesoría es de $2,000 pesos.",
        "Si estás de acuerdo, te puedo compartir el calendario para que elijas el horario que mejor te funcione.",
      ]);
      await setState(from, { ...state, step: "awaiting_offer", purpose: text });
      break;
    }

    // CASO 2 (no tiene terreno) - tipo de asesoría -> oferta directa
    case "awaiting_type": {
      await sendMessages(from, [
        "Perfecto, gracias por compartirlo.",
        "Cualquier consulta se trabaja a través de una asesoría personalizada de 45 minutos, donde se analizan tus dudas y se te da claridad sobre cómo proceder.\n\nLa inversión es de $2,000 pesos.",
        "Si estás de acuerdo, te puedo compartir el calendario para que agendes tu sesión.",
      ]);
      await setState(from, { ...state, step: "awaiting_offer", type: text });
      break;
    }

    // Punto de decisión final: ¿agenda o no?
    case "awaiting_offer": {
      if (isYes(answer)) {
        await sendMessages(from, [
          `Perfecto, aquí puedes seleccionar tu horario disponible:\n${CALENDAR_LINK}`,
        ]);
        await setState(from, { ...state, step: "scheduled" });
      } else if (isNo(answer)) {
        await sendMessages(from, [
          "Entendido, quedamos a tus órdenes. Estamos disponibles cuando gustes 🙌",
        ]);
        await setState(from, { ...state, step: "closed" });
      } else {
        await sendMessages(from, [
          "¿Me confirmas con un sí o un no si quieres agendar la sesión?",
        ]);
      }
      break;
    }

    // Conversación ya cerrada (agendó o declinó) - no se hace nada más automático
    default:
      break;
  }
}

function isYes(t) {
  return /\b(si|sí|claro|tengo|correcto|exacto|dale|va)\b/.test(t);
}
function isNo(t) {
  return /\b(no|nel|nop|negativo)\b/.test(t);
}

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ===================================================================
// ENVÍO DE MENSAJES (WhatsApp Cloud API)
// ===================================================================
async function sendMessages(to, texts) {
  for (const text of texts) {
    await sendWhatsAppMessage(to, text);
  }
}

async function sendWhatsAppMessage(to, text) {
  const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Error enviando mensaje de WhatsApp:", data);
  }
  return data;
}

// ===================================================================
// GUARDAR / LEER EN QUÉ PASO VA CADA CONVERSACIÓN (Vercel KV)
// ===================================================================
async function getState(phone) {
  const res = await fetch(`${KV_URL}/get/conv:${phone}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function setState(phone, state) {
  const value = encodeURIComponent(JSON.stringify(state));
  await fetch(`${KV_URL}/set/conv:${phone}/${value}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}
