require("dotenv").config();
const fs = require("fs");
const path = require("path");

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const API_KEY = process.env.N8N_API_KEY || "";
const FLOWS_DIR = path.join(__dirname, "../flows");

function toFileName(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
}

async function fetchWorkflows() {
  const response = await fetch(`${N8N_URL}/api/v1/workflows?limit=100`, {
    headers: { "X-N8N-API-KEY": API_KEY },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const { data } = await response.json();
  return data;
}

function saveWorkflow(workflow) {
  const tag = workflow.tags?.[0]?.name;
  const dir = tag ? path.join(FLOWS_DIR, toFileName(tag)) : FLOWS_DIR;
  const filePath = path.join(dir, `${toFileName(workflow.name)}.json`);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(workflow, null, 2));
  console.log(`✅ ${workflow.name} → ${path.relative(FLOWS_DIR, filePath)}`);
}

async function main() {
  const isValidUrl = N8N_URL.startsWith("http://") || N8N_URL.startsWith("https://");
  if (!isValidUrl) {
    console.error(`❌ N8N_URL inválida: ${N8N_URL}`);
    process.exit(1);
  }

  if (!API_KEY) {
    console.error("❌ N8N_API_KEY no está configurado");
    console.log("\nConfigura tu API key:");
    console.log("export N8N_API_KEY=tu_api_key_aqui");
    process.exit(1);
  }

  console.log(`⬇️  Descargando workflows desde ${N8N_URL}\n`);

  let workflows;
  try {
    workflows = await fetchWorkflows();
  } catch (error) {
    console.error("❌ Error conectando a n8n:", error.message);
    process.exit(1);
  }

  if (!workflows.length) {
    console.log("No hay workflows en esta instancia.");
    return;
  }

  for (const workflow of workflows) {
    try {
      saveWorkflow(workflow);
    } catch (error) {
      console.error(`❌ Error guardando ${workflow.name}:`, error.message);
    }
  }

  console.log(`\n✅ ${workflows.length} workflows guardados en flows/`);
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
