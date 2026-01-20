require("dotenv").config();
const fs = require("fs");
const path = require("path");

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";
const API_KEY = process.env.N8N_API_KEY || "";

const FLOWS_DIR = path.join(__dirname, "../flows");

async function importFlow(flowPath) {
  const flowName = path.basename(flowPath, ".json");

  console.log(`Importando: ${flowName}...`);

  try {
    const flowData = JSON.parse(fs.readFileSync(flowPath, "utf-8"));

    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": API_KEY,
      },
      body: JSON.stringify(flowData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ ${flowName} importado con ID: ${result.id}`);
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
    files = fs
      .readdirSync(FLOWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(FLOWS_DIR, f));
  } catch (error) {
    const { message } = error;
    console.error(`❌ Error leyendo directorio ${FLOWS_DIR}:`, message);
    process.exit(1);
  }

  for (const file of files) {
    await importFlow(file);
  }

  console.log("\n✅ Importación completa");
}

main().catch((err) => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
