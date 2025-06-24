const cleanContent = (content) => {
  if (!content) return "";

  return content
    .replace(
      /<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<!--[\s\S]*?-->|<[^>]+>/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .replace(/(?:https?|ftp):\/\/[\n\S]+/gi, " ")
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, " ")
    .trim()
    .substring(0, 1000);
};

const isSpamJobs = (content, subject) => {
  const contentPatternsSpam = [
    // Patrones numéricos de ofertas
    /\d+\s*(nuevas?|oportunidades?|ofertas?|vacantes?|puestos?)\s*(laborales?|de empleo|disponibles?)/i,
    /\d+\s*new jobs?\s*(in|matches|for|available)/i,

    // Frases comunes en alertas
    /job alert/i,
    /alerta de empleo/i,
    /alertas? (laboral|de trabajo)/i,
    /(seleccionamos|encontramos|encontr[oó])\s*para\s*ti/i,
    /matches your (profile|preferences)/i,
    /(reactivate|activate|mejora)\s*(tu|your)?\s*(alerta|premium)/i,
    /your job alert for/i,
    /empresas que están buscando nuevos talentos/i,
    /si (las vacantes|este puesto) encaja(n)? contigo/i,
    /aplica (hoy mismo|ahora)/i,
    /(mejora|actualiza) tu (alerta|búsqueda)/i,
    /(eliminar|cancelar|dejar de recibir)\s*(esta|las)?\s*alertas?/i,
    /(ver|revisa|consulta) (este|los) (trabajo|empleo|puesto)s?/i,
    /(últimos|nuevos) (proyectos|concursos) que coinciden/i,

    // Plataformas específicas
    /(computrabajo|jooble|glassdoor|indeed|bebee|freelancer)/i,

    // Ofertas genéricas
    /(ofertas? de empleo|trabajos? disponibles)/i,
    /puestos? disponibles de/i,
    /(coinciden|match) con tu (perfil|alert)/i,
    /estos (anuncios|puestos) (coinciden|son para)/i,

    // Invitaciones a acción
    /postúlate (rápidamente|ahora)/i,
    /ver (todos|ofertas)/i,
    /(click|ver|visita) (aquí|para más)/i,

    // Footer típico
    /pol[ií]tica de privacidad/i,
    /términos y condiciones/i,
    /cancelar suscripción/i,
  ];

  const subjectPatterns = [
    /(alertas?|ofertas?) (de empleo|laborales)/i,
    /job alert/i,
    /nuev(a|o)s? (oportunidades|puestos)/i,
    /trabajos para ti/i,
    /(coincidencias|matches) para tu perfil/i,
  ];

  // Verificar patrones en el contenido
  const contentCheck = contentPatternsSpam.some((pattern) =>
    pattern.test(content)
  );

  // Verificar patrones en el asunto
  const subjectCheck = subjectPatterns.some((pattern) => pattern.test(subject));

  // Detectar muchos números (ofertas masivas)
  const manyOpportunities = content.match(
    /(\d+)\s*(nuevas?|oportunidades?|ofertas?|jobs?|puestos?)/gi
  );
  const highVolumeCheck =
    manyOpportunities &&
    manyOpportunities.some((match) => parseInt(match.replace(/\D/g, "")) >= 3);

  // Detectar listados de trabajos
  const jobListingsCheck =
    content.match(/(puesto|trabajo|empleo):?.+\n.+\n.+\$/gi)?.length >= 2;

  // Detectar footers típicos de plataformas
  const platformFooterCheck = [
    /indeed\.com/i,
    /glassdoor\.com/i,
    /computrabajo\.com/i,
    /jooble\.org/i,
    /freelancer\.com/i,
    /bebee\.com/i,
  ].some((pattern) => pattern.test(content));

  return (
    contentCheck ||
    subjectCheck ||
    highVolumeCheck ||
    jobListingsCheck ||
    platformFooterCheck
  );
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

  const bodyContent = {
    html: item.json?.html || "",
    text: item.json?.text || "",
    cleanText: cleanContent(item.json?.text || item.json?.html || ""),
  };
  const isSpam = isSpamJobs(bodyContent.cleanText, metadata.subject);

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

  const emailType = isSpam
    ? "Alerta de Spam"
    : bodyContent.cleanText.includes("oportunidad")
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
