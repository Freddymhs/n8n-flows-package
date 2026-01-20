# Guía de Publicación

## Primera vez - Configuración de npmjs.com

### 1. Crear cuenta en npmjs.com

Ve a https://www.npmjs.com/signup y crea una cuenta.

### 2. Login en npm

```bash
npm login
```

Ingresa tu username, password y email de npmjs.com.

### 3. Verificar que estás logueado

```bash
npm whoami
```

Debería mostrar tu username.

---

## Publicar nueva versión

```bash
# 1. Actualizar versión en package.json
# Ej: "1.0.1" → "1.0.2"

# 2. Commit cambios
git add .
git commit -m "v1.0.2: Descripción de cambios"

# 3. Publicar
npm publish --access public

# 4. (Opcional) Crear tag de git
git tag v1.0.2
git push origin v1.0.2
```

**Nota:** `--access public` es necesario para paquetes scoped (`@freddymhs/...`) gratuitos.

---

## Instalar desde npmjs.com

```bash
npm install @freddymhs/n8n-flows-packages
```

Sin configuración adicional necesaria.

---

## Troubleshooting

**Error: 402 Payment Required**
- Los paquetes scoped privados requieren cuenta de pago
- Solución: Usa `npm publish --access public`

**Error: 403 Forbidden**
- No tienes permisos para publicar bajo el scope `@freddymhs`
- Verifica que estés logueado: `npm whoami`
- O cambia el nombre del paquete en `package.json`

**Error: Package already exists**
- La versión ya fue publicada
- Incrementa la versión en `package.json` y vuelve a publicar
