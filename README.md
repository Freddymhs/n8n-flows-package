# n8n-flows-package

Workflows n8n como paquete npm reutilizable. Agrega flows a `flows/` y estarán disponibles automáticamente.

> **📦 Publicado en:** https://www.npmjs.com/package/@freddymhs/n8n-flows-packages

---

## Estructura

```
.
├── index.js                   # Carga automática de flows/*.json
├── flows/                     # Workflows (código embebido en JSONs)
│   └── *.json
├── scripts/
│   └── import-to-n8n.js       # Importar flows a n8n vía API
├── .env.example               # Template de configuración
└── package.json
```

---

## Instalación

```bash
npm install @freddymhs/n8n-flows-packages
```

---

## Uso

```javascript
// Importar todos los flows
const flows = require("@freddymhs/n8n-flows-packages");

console.log(Object.keys(flows)); // ['email_alert', 'email_claasifier', 'nutricionista', ...]

// Acceder a un flow específico
const { email_alert, nutricionista } = flows;
```

Los flows se cargan automáticamente desde `flows/*.json`.

---

## Importar a n8n (opcional)

Script para importar todos los flows automáticamente a tu instancia n8n vía API.

```bash
cp .env.example .env        # Copiar template
# Editar .env con tu API key (obtener en n8n: Settings → API)
node scripts/import-to-n8n.js
```

---

## Publicar nueva versión

```bash
# 1. Actualizar versión en package.json (ej: 1.0.1 → 1.0.2)
# 2. Ejecutar
npm publish
```

Consulta [PUBLISH.md](./PUBLISH.md) para más detalles sobre configuración de GitHub Packages.
