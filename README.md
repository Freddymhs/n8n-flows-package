# n8n-flows-package

Repositorio para almacenar y versionar flujos exportados de n8n en formato JSON.

Este proyecto facilita la gestión, reutilización y distribución de workflows n8n como paquetes npm, permitiendo integrarlos fácilmente en distintos proyectos y automatizar su despliegue mediante scripts o CI/CD.

---

## Estructura

```
.
├── flows
│   └── email_alert.json
└── package.json
```

---

## Publicar paquete en GitHub Packages

1. Configura tu archivo `.npmrc` con:

```
@freddymhs:registry=https://npm.pkg.github.com
```

2. Haz login en GitHub Packages:

```bash
npm login --registry=https://npm.pkg.github.com
```

3. Publica el paquete:

```bash
npm publish
```

4. Para publicar una nueva versión, cambia la versión en package.json y vuelve a publicar.

---

## Usar el paquete en otro proyecto

1. Configura `.npmrc` igual que arriba.

2. Instala el paquete:

```bash
npm install @freddymhs/n8n-flows-packages
```

3. Usa el script `import-n8n-flows.js` para importar los flujos automáticamente a tu instancia n8n.

```javascript
// Requiere axios instalado: npm install axios
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Cambia la URL y API_KEY por las de tu instancia n8n
const N8N_URL = 'https://primary-production-085f.up.railway.app';
const API_KEY = 'TU_API_KEY_DE_N8N';

const FLOWS_PATH = path.resolve(
  __dirname,
  'node_modules/@freddymhs/n8n-flows-packages/flows'
);

async function importFlow(flowJson) {
  try {
    const res = await axios.post(
      `${N8N_URL}/rest/workflows/import`,
      flowJson,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      }
    );
    console.log(`Flujo importado: ${res.data.name}`);
  } catch (error) {
    console.error('Error importando flujo:', error.response?.data || error.message);
  }
}

async function main() {
  const files = fs.readdirSync(FLOWS_PATH).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const flowJson = JSON.parse(fs.readFileSync(path.join(FLOWS_PATH, file), 'utf-8'));
    await importFlow(flowJson);
  }
}

main();
```

---

## Notas adicionales

- Asegúrate de tener permisos de escritura en el registry de GitHub Packages
- Los flujos JSON deben estar en la carpeta `flows/` del paquete
- Recuerda actualizar la versión en `package.json` antes de cada publicación
- El script de importación requiere que tengas configurada correctamente tu API key de n8n