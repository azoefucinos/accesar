# AccesAR — Deploy a producción (Vercel + Turso)

Esta guía te lleva desde el código local hasta una URL pública (`https://accesar.vercel.app`)
que cualquiera puede abrir desde su celu para reportar barreras urbanas.

---

## ¿Por qué Turso + Vercel?

- **Vercel** es el hosting oficial de Next.js. Plan gratis generoso, deploy automático
  desde GitHub, URL pública global, HTTPS incluido.
- **Turso** es SQLite en la nube. Lo usamos porque el código ya está escrito para SQLite
  (Prisma + `provider = "sqlite"`). Si lo deployáramos en Vercel sin migrar la base,
  los reportes se perderían en cada deploy (Vercel es serverless y resetea el disco).

> La app detecta automáticamente si usar SQLite local o Turso según las variables de
> entorno. **No cambiaste ninguna línea de lógica de negocio.**

---

## Requisitos

- Cuenta gratis en https://github.com
- Cuenta gratis en https://vercel.com (podés loguearte con GitHub)
- Cuenta gratis en https://turso.tech
- Tu PC con `git` instalado

---

## Paso 1 — Crear la base de datos en Turso

1. Entrá a https://turso.tech → "Sign up" (podés usar GitHub).
2. Desde el dashboard, hacé clic en **"Create database"**.
3. **Name**: `accesar` (o el nombre que prefieras).
4. **Location**: elegí `aws-us-east-1` (gratuito, cerca de LatAm) o `sao` (São Paulo).
5. Hacé clic en **"Create"**.

Te lleva a la página de la base. De ahí vas a copiar dos cosas:

- **URL** (algo como `libsql://accesar-usuario.turso.io`) → la verás en la lista.
- **Auth Token**: andá a **"Settings" → "Database Authentication" → "Create auth token"**.
  Copialo (solo se ve una vez, guardalo en un lugar seguro).

> Conservá ambos valores para el Paso 4.

---

## Paso 2 — Crear las tablas en Turso

Desde la terminal de tu PC, en la carpeta del proyecto:

```bash
# 1. Configurá temporalmente las variables en tu .env local:
#    (editá el archivo .env y agregá estas dos líneas con tus valores reales)
TURSO_DATABASE_URL="libsql://accesar-usuario.turso.io"
TURSO_AUTH_TOKEN="eyJhbGciOi...tu-token-largo..."

# 2. Creá las tablas en Turso (usa el schema de prisma/schema.prisma):
bun run db:push:turso
```

> Esto crea la tabla `Report` en Turso. Si ya tenías reportes locales que querés
> preservar, corré el script de migración ahora:
> ```bash
> bun run scripts/migrate-to-turso.ts
> ```

---

## Paso 3 — Subir el código a GitHub

Si todavía no tenés el repo inicializado:

```bash
# En la carpeta del proyecto:
git init
git add .
git commit -m "AccesAR — listo para deploy"

# En GitHub, creá un repo NUEVO y vacío (sin README, sin .gitignore):
#   https://github.com/new
#   Name: accesar
#   Private o Public (da igual)
#   NO marques "Add a README"

# Conectá y subí:
git remote add origin https://github.com/TU_USUARIO/accesar.git
git branch -M main
git push -u origin main
```

> **Importante**: el `.env` está en `.gitignore` (no se sube). Las claves reales las
> vas a poner directo en Vercel en el Paso 4.

---

## Paso 4 — Deployar en Vercel

1. Entrá a https://vercel.com → "Log In" con GitHub.
2. Hacé clic en **"Add New..." → "Project"**.
3. En "Import Git Repository", buscá tu repo `accesar` y hacé clic en **"Import"**.
4. Vercel detecta Next.js automáticamente. **No cambies los defaults** del build.
5. **(Crítico) Antes de "Deploy", abrí "Environment Variables"** y agregá estas tres:

   | Name | Value | Environments |
   |------|-------|--------------|
   | `TURSO_DATABASE_URL` | `libsql://accesar-usuario.turso.io` | Production, Preview, Development |
   | `TURSO_AUTH_TOKEN` | `eyJhbGciOi...tu-token-largo` | Production, Preview, Development |
   | `DATABASE_URL` | `libsql://accesar-usuario.turso.io` | Production, Preview, Development |

   > `DATABASE_URL` debe apuntar a la misma URL de Turso porque el `datasource` del
   > schema Prisma la requiere para generar el cliente en el build.

6. Hacé clic en **"Deploy"**.

Vercel tarda ~2-3 minutos. Al final te da una URL tipo:
```
https://accesar.vercel.app
```

¡Listo! Entrá desde tu celu y reportá. Mandá la URL a quien quieras.

---

## Paso 5 — (Opcional) URL personalizada

En Vercel: **Project Settings → Domains → Add**. Podés:
- Usar un subdominio gratuito de Vercel: `accesar.vercel.app` (ya lo tenés).
- Conectar tu propio dominio: `accesar.org.ar` (necesitás comprarlo, ~$10/año).

---

## Verificación post-deploy

1. Abrí la URL pública desde tu celu.
2. Cargá un reporte real con foto y dirección.
3. Refrescá la página en otro dispositivo → el reporte debe aparecer.
4. Abrí la vista "Índice" → el barrio donde reportaste debe tener datos.

Si algo falla, en Vercel:
- **"Deployments" → click en el deploy → "Logs"** para ver errores de runtime.
- **"Project Settings → Environment Variables"** para verificar que las 3 variables
  están bien pegadas (sin espacios, sin comillas en Vercel — Vercel las pega sin comillas).

---

## Cómo seguir desarrollando

- Cualquier `git push` a `main` dispara un deploy automático en Vercel.
- Para cambios en el schema Prisma:
  1. Editá `prisma/schema.prisma`.
  2. `bun run db:push:turso` (aplica cambios a Turso).
  3. `git commit && git push` (redeploy con `prisma generate` en el build).

---

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `bun run dev` | Servidor de desarrollo local (http://localhost:3000) |
| `bun run lint` | Verificar calidad del código |
| `bun run db:push` | Aplicar schema al SQLite local |
| `bun run db:push:turso` | Aplicar schema a Turso (requiere vars de entorno) |
| `bun run scripts/migrate-to-turso.ts` | Copiar datos de SQLite local → Turso |
| `bun run build` | Build de producción (lo corre Vercel automáticamente) |

---

## Problemas comunes

**"PrismaClientInitializationError: Database URL is missing"**
→ Falta `DATABASE_URL` en las variables de entorno de Vercel. Debe ser la URL de Turso.

**"Authentication failed" en Turso**
→ El `TURSO_AUTH_TOKEN` está mal copiado o expiró. Generá uno nuevo en Turso.

**El deploy pasa pero la página carga sin datos**
→ Verificá que las variables de entorno estén marcadas para "Production".
→ En el log de Vercel buscá `prisma:query` — si no aparece, el cliente no se conectó.

**Quiero volver al desarrollo local**
→ Simplemente corré `bun run dev`. El código detecta que no hay `TURSO_DATABASE_URL`
  y usa el SQLite local (`prisma/dev.db`).

---

¡Listo para que la ciudad entera reporte! 🚀
