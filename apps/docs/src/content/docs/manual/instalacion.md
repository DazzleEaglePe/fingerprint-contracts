---
title: Instalación y Despliegue
description: Guía paso a paso para instalar y ejecutar el sistema DecData en un entorno local.
---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión Mínima | Verificar |
|------------|---------------|-----------|
| **Python** | 3.12+ | `python --version` |
| **Node.js** | 22+ | `node --version` |
| **pnpm** | 9+ | `pnpm --version` |
| **PostgreSQL** | 15+ | Supabase o local |
| **uv** (gestor Python) | 0.6+ | `uv --version` |

## 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd software-project
```

## 2. Configurar el Backend (API)

### 2.1 Instalar dependencias Python

```bash
cd apps/api
uv sync
```

### 2.2 Configurar variables de entorno

Crear un archivo `.env` en `apps/api/`:

```env
DATABASE_URL=postgresql+asyncpg://usuario:password@host:5432/nombre_db
JWT_SECRET_KEY=tu-clave-secreta-super-segura
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

### 2.3 Ejecutar migraciones y seed

```bash
# Aplicar el esquema a la base de datos
uv run alembic upgrade head

# Inyectar datos de prueba
uv run python scripts/seed_db.py
```

### 2.4 Iniciar el servidor API

```bash
uv run uvicorn decdata_api.main:app --reload --host 0.0.0.0 --port 8000
```

La API estará disponible en: `http://localhost:8000/docs` (Swagger UI)

## 3. Configurar el Frontend (Web)

### 3.1 Instalar dependencias

```bash
cd apps/web
pnpm install
```

### 3.2 Variables de entorno del frontend

Crear un archivo `.env.local` en `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.3 Iniciar el servidor de desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en: `http://localhost:3000`

## 4. Credenciales de Prueba

| Campo | Valor |
|-------|-------|
| **Email** | `admin@fundo.com` |
| **Contraseña** | `admin123` |
| **Rol** | Administrador |

## 5. Configurar la Documentación (Docs)

```bash
cd apps/docs
npm run dev
```

La documentación estará disponible en: `http://localhost:4321`

:::tip[Tip de Producción]
Para generar un build estático de la documentación, ejecuta `npm run build`. Los archivos se generarán en `dist/` listos para subir a cualquier hosting estático (Vercel, Netlify, GitHub Pages).
:::
