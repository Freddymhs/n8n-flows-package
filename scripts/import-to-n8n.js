require("dotenv").config();
const fs = require("fs");
const path = require("path");

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const API_KEY = process.env.N8N_API_KEY || "";

function collectJsonFiles(dir) {
  const results = [];
  fs.readdirSync(dir).forEach((entry) => {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...collectJsonFiles(fullPath));
    } else if (entry.endsWith(".json")) {
      results.push(fullPath);
    }
  });
  return results;
}

const FLOWS_DIR = path.join(__dirname, "../flows");

async function fetchExistingWorkflowsByName() {
  const response = await fetch(`${N8N_URL}/api/v1/workflows?limit=250`, {
    headers: { "X-N8N-API-KEY": API_KEY },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const { data } = await response.json();
  return new Map(data.map((workflow) => [workflow.name, workflow.id]));
}

async function fetchExistingTagsByName() {
  const response = await fetch(`${N8N_URL}/api/v1/tags?limit=250`, {
    headers: { "X-N8N-API-KEY": API_KEY },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const { data } = await response.json();
  return new Map(data.map((tag) => [tag.name, tag.id]));
}

async function getOrCreateTagId(tagName, tagsByName) {
  if (tagsByName.has(tagName)) return tagsByName.get(tagName);

  const response = await fetch(`${N8N_URL}/api/v1/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": API_KEY,
    },
    body: JSON.stringify({ name: tagName }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const tag = await response.json();
  tagsByName.set(tagName, tag.id);
  return tag.id;
}

async function assignTag(workflowId, tagId) {
  const response = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/tags`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": API_KEY,
    },
    body: JSON.stringify([{ id: tagId }]),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }
}

async function importFlow(flowPath, existingByName, tagsByName) {
  const flowName = path.basename(flowPath, ".json");
  // El tag = nombre de la carpeta directa dentro de flows/ (ej: flows/todoist/x.json -> "todoist")
  const tagName = path.basename(path.dirname(flowPath));

  console.log(`Importando: ${flowName}...`);

  try {
    const flowData = JSON.parse(fs.readFileSync(flowPath, "utf-8"));

    // La API de n8n solo acepta estas propiedades — el resto
    // (id, active, tags, meta, pinData, versionId, createdAt...) viene del
    // export y rompe la validación si se manda tal cual.
    const payload = {
      name: flowData.name || flowName,
      nodes: flowData.nodes,
      connections: flowData.connections,
      settings: flowData.settings || {},
    };

    const existingId = existingByName.get(payload.name);
    const url = existingId
      ? `${N8N_URL}/api/v1/workflows/${existingId}`
      : `${N8N_URL}/api/v1/workflows`;
    const method = existingId ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    const action = existingId ? "actualizado" : "creado";

    if (tagName !== "flows") {
      const tagId = await getOrCreateTagId(tagName, tagsByName);
      await assignTag(result.id, tagId);
    }

    console.log(`✅ ${flowName} ${action} con ID: ${result.id} (tag: ${tagName})`);
  } catch (error) {
    const { message } = error;
    console.error(`❌ Error importando ${flowName}:`, message);
  }
}

async function main() {
  const isValidUrl = N8N_URL.startsWith("http://") || N8N_URL.startsWith("https://");
  if (!isValidUrl) {
    console.error(`❌ Error: N8N_URL inválida: ${N8N_URL}`);
    console.log("Debe comenzar con http:// o https://");
    process.exit(1);
  }

  if (!API_KEY) {
    console.error("❌ Error: N8N_API_KEY no está configurado");
    console.log("\nConfigura tu API key:");
    console.log("export N8N_API_KEY=tu_api_key_aqui");
    console.log("\nO ejecútalo inline:");
    console.log("N8N_API_KEY=tu_key node scripts/import-to-n8n.js");
    process.exit(1);
  }

  console.log(`🚀 Importando flows a ${N8N_URL}\n`);

  let files;
  try {
    files = collectJsonFiles(FLOWS_DIR);
  } catch (error) {
    const { message } = error;
    console.error(`❌ Error leyendo directorio ${FLOWS_DIR}:`, message);
    process.exit(1);
  }

  const existingByName = await fetchExistingWorkflowsByName();
  const tagsByName = await fetchExistingTagsByName();

  for (const file of files) {
    await importFlow(file, existingByName, tagsByName);
  }

  console.log("\n✅ Importación completa");
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
