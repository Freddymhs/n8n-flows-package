const cleanContent = (content) => {
  if (!content) return "";

  return content
    .replace(
      /<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|<[^>]+>/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .replace(/(?:https?|ftp):\/\/[\n\S]+/gi, " ") // Eliminar URLs no deseadas
    .trim()
    .substring(0, 1000); // Limitar a 1000 caracteres
};

const iterador = (item) => {
  const metadata = {
    from: item.json?.from?.value?.[0]?.name || "Desconocido",
    fromEmail: item.json?.from?.value?.[0]?.address || "",
    to: item.json?.to?.value?.[0]?.address || "",
    subject: item.json?.subject || "",
    date: item.json?.date
      ? new Date(item.json.date).toLocaleDateString("es-CL", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Fecha no disponible",
    messageId: item.json?.messageId || "",
  };
  z;

  const bodyContent = {
    html: item.json?.html || "",
    text: item.json?.text || "",
    cleanText: cleanContent(item.json?.text || item.json?.html || ""),
  };

  const keyElements = {
    oportunidades:
      (bodyContent.cleanText.match(
        /(\d+)\s*(nuevas?|oportunidades?|ofertas?)/i
      ) || [])[1] || "No especificado",
    puesto:
      (bodyContent.cleanText.match(
        /(puesto|rol|posición)(?: de |:\s*)([\w\sáéíóúñ]+)/i
      ) || [])[2] || "No especificado",
    ubicacion:
      (bodyContent.cleanText.match(/(en |ubicación:?)\s*([\w\sáéíóúñ.,-]+)/i) ||
        [])[2] || "No especificada",
    empresas:
      (bodyContent.cleanText.match(
        /(?:empresas?|companías?):?\s*([^.:!?]+)/i
      ) || [])[1] || "No especificadas",
    urls: [
      ...new Set([
        ...(bodyContent.html.match(/https?:\/\/[^\s"'<>]+/g) || []),
        ...(bodyContent.text.match(/https?:\/\/[^\s]+/g) || []),
      ]),
    ].filter(
      (url) =>
        !url.match(/\.(png|jpg|jpeg|gif|webp|css|js)\b/i) &&
        !url.includes("unsubscribe")
    ),
  };

  const emailType = bodyContent.cleanText.includes("oportunidad")
    ? "Oportunidad Laboral"
    : bodyContent.cleanText.includes("notificación")
    ? "Notificación"
    : bodyContent.cleanText.includes("confirmación")
    ? "Confirmación"
    : "General";

  const sections = [
    `📨 Tipo: ${emailType}`,
    `📅 Fecha: ${metadata.date}`,
    `👤 Remitente: ${metadata.from} <${metadata.fromEmail}>`,
    metadata.subject && `📌 Asunto: ${metadata.subject}`,
    keyElements.oportunidades !== "No especificado" &&
      `🔢 Oportunidades: ${keyElements.oportunidades}`,
    keyElements.puesto !== "No especificado" &&
      `💼 Puesto: ${keyElements.puesto}`,
    keyElements.ubicacion !== "No especificada" &&
      `📍 Ubicación: ${keyElements.ubicacion}`,
    keyElements.empresas !== "No especificadas" &&
      `🏢 Empresas: ${keyElements.empresas}`,
    keyElements.urls.length > 0 &&
      `🔗 Enlaces relevantes:\n${keyElements.urls.slice(0, 3).join("\n")}`,
    `📝 Contenido resumido:\n${bodyContent.cleanText.substring(0, 300)}...`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = {
    metadata,
    contentSummary: {
      characters: bodyContent.cleanText.length,
      words: bodyContent.cleanText.split(/\s+/).length,
      detectedElements: Object.keys(keyElements).filter(
        (k) => keyElements[k] !== "No especificado"
      ),
    },
    extractedData: keyElements,
    fullSummary: sections,
  };
  return res;
};
const extractEmailData = (item) => iterador(item);
const plainText = items.map(extractEmailData);
return plainText;
