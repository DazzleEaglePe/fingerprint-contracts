# Estructura del Proyecto (Monorepo Turborepo)

**Proyecto:** Sistema de Gestión de Contratos con Validación Biométrica por Huella Digital
**Versión:** 1.0
**Tipo de repositorio:** Monorepo
**Herramienta:** Turborepo + pnpm workspaces

---

## 1. Por qué monorepo Turborepo

Un monorepo se justifica cuando hay **al menos un activo compartido real** entre apps. En este proyecto ese activo son los **tipos TypeScript del API** que el frontend consume.

Razones concretas para esta decisión:

1. **Tipos compartidos automáticos.** El frontend Next.js consume el API FastAPI. Los tipos de DTOs (Contract, Owner, BiometricVerification, etc.) se generan desde el esquema OpenAPI de FastAPI y se publican en `packages/shared-types`. Cualquier cambio en el backend dispara errores de tipo en el frontend antes del deploy.

2. **Documentación junto al código.** El sitio Astro Starlight vive en el mismo repo. Los markdowns de arquitectura, BD, etc. se sirven desde ahí sin duplicación.

3. **CI unificado.** Un solo pipeline de GitHub Actions cubre web + api + docs. Turborepo cachea por afectación: si solo cambió el frontend, no se corren los tests del backend.

4. **DX consistente.** Un `pnpm install` configura todo. Un `pnpm dev` levanta web + api + docs en paralelo.

**Lo que NO justifica monorepo aquí:**
- No vamos a publicar paquetes npm públicos
- No tenemos múltiples equipos
- El backend Python tiene sus propios scripts; no es un workspace pnpm puro

Por eso es un monorepo **híbrido**: workspaces pnpm para JS/TS (web, docs, shared-types, config) y la API Python convive con sus propios scripts pero respeta los comandos del Turborepo via `package.json` puente.

---

## 2. Estructura de carpetas completa

```
decdata-contratos/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + tests en cada PR
│       ├── deploy-web.yml            # Deploy del frontend
│       └── deploy-docs.yml           # Deploy del sitio docs
│
├── .vscode/
│   ├── settings.json                 # Configuración recomendada del editor
│   └── extensions.json               # Extensiones sugeridas
│
├── apps/
│   │
│   ├── web/                          # ──── FRONTEND NEXT.JS ────
│   │   ├── src/
│   │   │   ├── app/                  # App Router de Next 15
│   │   │   │   ├── (auth)/           # Layout/rutas de auth
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (dashboard)/      # Layout/rutas autenticadas
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── fundos/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── nuevo/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── biometria/
│   │   │   │   │   ├── contratos/
│   │   │   │   │   │   ├── page.tsx          # Listado
│   │   │   │   │   │   ├── nuevo/
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx      # Detalle
│   │   │   │   │   │       ├── editar/
│   │   │   │   │   │       └── firmar/       # Flujo biométrico
│   │   │   │   │   │           └── page.tsx
│   │   │   │   │   ├── auditoria/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/              # API routes de Next (solo proxies si hace falta)
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx        # Root layout
│   │   │   │   └── page.tsx          # Landing
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui generados
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── form.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── table.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── layout/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   └── user-menu.tsx
│   │   │   │   ├── contracts/
│   │   │   │   │   ├── contract-list.tsx
│   │   │   │   │   ├── contract-form.tsx
│   │   │   │   │   ├── contract-detail.tsx
│   │   │   │   │   ├── contract-status-badge.tsx
│   │   │   │   │   └── contract-filters.tsx
│   │   │   │   ├── biometric/
│   │   │   │   │   ├── fingerprint-uploader.tsx
│   │   │   │   │   ├── minutiae-overlay.tsx     # Visualiza minutiae sobre la huella
│   │   │   │   │   ├── verification-result.tsx
│   │   │   │   │   └── enrollment-flow.tsx
│   │   │   │   ├── fundos/
│   │   │   │   │   ├── fundo-form.tsx
│   │   │   │   │   └── fundo-card.tsx
│   │   │   │   └── audit/
│   │   │   │       └── audit-table.tsx
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api/              # Cliente HTTP tipado
│   │   │   │   │   ├── client.ts     # fetch wrapper con auth
│   │   │   │   │   ├── contracts.ts  # contracts.list(), contracts.create()...
│   │   │   │   │   ├── fundos.ts
│   │   │   │   │   ├── biometric.ts
│   │   │   │   │   └── audit.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── session.ts    # Manejo del JWT
│   │   │   │   │   └── server.ts     # Helpers server-side
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── use-contracts.ts        # TanStack Query hooks
│   │   │   │   │   ├── use-biometric-verify.ts
│   │   │   │   │   └── use-fundo.ts
│   │   │   │   ├── stores/           # Zustand
│   │   │   │   │   ├── ui-store.ts
│   │   │   │   │   └── filters-store.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── cn.ts         # className merger
│   │   │   │   │   ├── format.ts     # formatters de fecha, moneda
│   │   │   │   │   └── validators.ts # Validadores zod
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   └── types/                # Tipos locales del frontend
│   │   │       └── index.ts
│   │   │
│   │   ├── public/
│   │   │   ├── logo.svg
│   │   │   ├── favicon.ico
│   │   │   └── samples/              # Imágenes de muestra para demos
│   │   │
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── e2e/                  # Playwright si se decide
│   │   │
│   │   ├── .env.local.example
│   │   ├── .eslintrc.json
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── components.json           # Config de shadcn/ui
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── api/                          # ──── BACKEND FASTAPI ────
│   │   ├── src/
│   │   │   └── decdata_api/
│   │   │       ├── __init__.py
│   │   │       ├── main.py           # Entry point, ASGI app
│   │   │       ├── config.py         # Settings con Pydantic Settings
│   │   │       │
│   │   │       ├── routers/          # Capa HTTP
│   │   │       │   ├── __init__.py
│   │   │       │   ├── auth.py
│   │   │       │   ├── users.py
│   │   │       │   ├── fundos.py
│   │   │       │   ├── owners.py
│   │   │       │   ├── contracts.py
│   │   │       │   ├── biometric.py
│   │   │       │   └── audit.py
│   │   │       │
│   │   │       ├── services/         # Lógica de negocio
│   │   │       │   ├── __init__.py
│   │   │       │   ├── auth_service.py
│   │   │       │   ├── contract_service.py
│   │   │       │   ├── biometric_service.py    # Coordina pipeline + matcher
│   │   │       │   ├── alert_service.py
│   │   │       │   ├── audit_service.py
│   │   │       │   └── storage_service.py      # Filesystem o S3
│   │   │       │
│   │   │       ├── repositories/     # Acceso a datos
│   │   │       │   ├── __init__.py
│   │   │       │   ├── base.py
│   │   │       │   ├── user_repo.py
│   │   │       │   ├── fundo_repo.py
│   │   │       │   ├── owner_repo.py
│   │   │       │   ├── contract_repo.py
│   │   │       │   ├── biometric_template_repo.py
│   │   │       │   └── biometric_verification_repo.py
│   │   │       │
│   │   │       ├── models/           # SQLAlchemy entities
│   │   │       │   ├── __init__.py
│   │   │       │   ├── base.py       # Base, Mixins (TimestampMixin)
│   │   │       │   ├── user.py
│   │   │       │   ├── fundo.py
│   │   │       │   ├── owner.py
│   │   │       │   ├── contract.py
│   │   │       │   ├── contract_party.py
│   │   │       │   ├── contract_clause.py
│   │   │       │   ├── contract_type.py
│   │   │       │   ├── biometric_template.py
│   │   │       │   ├── biometric_verification.py
│   │   │       │   └── audit_log.py
│   │   │       │
│   │   │       ├── schemas/          # Pydantic DTOs
│   │   │       │   ├── __init__.py
│   │   │       │   ├── user.py
│   │   │       │   ├── fundo.py
│   │   │       │   ├── owner.py
│   │   │       │   ├── contract.py
│   │   │       │   ├── biometric.py
│   │   │       │   └── common.py     # Paginación, responses comunes
│   │   │       │
│   │   │       ├── biometric/        # ★★★ NÚCLEO BIOMÉTRICO ★★★
│   │   │       │   ├── __init__.py
│   │   │       │   ├── pipeline.py            # Orquestador del pipeline
│   │   │       │   ├── preprocessing.py       # Normalización, Gabor
│   │   │       │   ├── binarization.py        # Adaptive threshold
│   │   │       │   ├── skeletonization.py     # Wrapper de scikit-image
│   │   │       │   ├── minutiae_extractor.py  # Wrapper de la librería
│   │   │       │   ├── minutiae_filter.py     # Filtrado de espurias [propio]
│   │   │       │   ├── alignment.py           # Alineación [propio]
│   │   │       │   ├── matcher.py             # Matching [propio]
│   │   │       │   ├── scoring.py             # Cálculo de score [propio]
│   │   │       │   ├── metrics.py             # FAR, FRR, EER [propio]
│   │   │       │   └── types.py               # Minutia, Template, MatchResult
│   │   │       │
│   │   │       ├── db/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── session.py             # async_session_maker
│   │   │       │   └── seed.py                # Datos iniciales (tipos de contrato)
│   │   │       │
│   │   │       ├── core/
│   │   │       │   ├── __init__.py
│   │   │       │   ├── security.py            # JWT, hash
│   │   │       │   ├── dependencies.py        # FastAPI Depends comunes
│   │   │       │   ├── exceptions.py          # Excepciones de dominio
│   │   │       │   ├── middleware.py
│   │   │       │   └── logging.py             # structlog config
│   │   │       │
│   │   │       └── utils/
│   │   │           ├── __init__.py
│   │   │           ├── files.py
│   │   │           └── dates.py
│   │   │
│   │   ├── alembic/                  # Migraciones de BD
│   │   │   ├── versions/
│   │   │   │   ├── 001_create_users.py
│   │   │   │   ├── 002_create_fundos_owners.py
│   │   │   │   ├── 003_create_biometric_templates.py
│   │   │   │   ├── 004_create_contract_types.py
│   │   │   │   ├── 005_create_contracts.py
│   │   │   │   ├── 006_create_contract_parties.py
│   │   │   │   ├── 007_create_contract_clauses.py
│   │   │   │   ├── 008_create_biometric_verifications.py
│   │   │   │   ├── 009_create_audit_log.py
│   │   │   │   ├── 010_create_views.py
│   │   │   │   └── 011_create_triggers.py
│   │   │   ├── env.py
│   │   │   └── script.py.mako
│   │   ├── alembic.ini
│   │   │
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── conftest.py
│   │   │   ├── unit/
│   │   │   │   ├── biometric/
│   │   │   │   │   ├── test_matcher.py
│   │   │   │   │   ├── test_scoring.py
│   │   │   │   │   └── test_alignment.py
│   │   │   │   └── services/
│   │   │   │       ├── test_contract_service.py
│   │   │   │       └── test_biometric_service.py
│   │   │   ├── integration/
│   │   │   │   ├── test_contracts_api.py
│   │   │   │   └── test_biometric_api.py
│   │   │   └── fixtures/
│   │   │       ├── fingerprints/             # Imágenes de muestra para tests
│   │   │       └── contracts.json
│   │   │
│   │   ├── scripts/
│   │   │   ├── evaluate_biometric.py         # Calcula FAR/FRR/EER sobre dataset
│   │   │   ├── seed_db.py                    # Carga datos demo
│   │   │   └── generate_openapi.py           # Exporta openapi.json
│   │   │
│   │   ├── storage/                          # Storage local de imágenes
│   │   │   ├── fingerprints/
│   │   │   │   ├── enrolled/
│   │   │   │   └── verifications/
│   │   │   └── .gitkeep
│   │   │
│   │   ├── datasets/                         # Datasets biométricos para evaluación
│   │   │   └── README.md                     # Cómo descargar FVC2002 / SOCOFing
│   │   │
│   │   ├── .env.example
│   │   ├── pyproject.toml                    # Poetry o uv
│   │   ├── uv.lock                           # O poetry.lock
│   │   ├── ruff.toml
│   │   ├── pytest.ini
│   │   ├── Dockerfile
│   │   ├── package.json                      # Puente con Turborepo (scripts)
│   │   └── README.md
│   │
│   └── docs/                         # ──── SITIO DE DOCUMENTACIÓN ────
│       ├── src/
│       │   ├── content/
│       │   │   ├── docs/
│       │   │   │   ├── index.mdx
│       │   │   │   ├── analisis-negocio.md   # ← El doc 1
│       │   │   │   ├── arquitectura.md       # ← El doc 2
│       │   │   │   ├── modelo-bd.md          # ← El doc 3
│       │   │   │   ├── estructura-proyecto.md # ← Este doc
│       │   │   │   ├── diagrama-bd.md        # ← El doc 5
│       │   │   │   ├── biometria/
│       │   │   │   │   ├── pipeline.md
│       │   │   │   │   ├── matcher.md
│       │   │   │   │   └── metricas.md
│       │   │   │   └── guias/
│       │   │   │       ├── setup.md
│       │   │   │       ├── deployment.md
│       │   │   │       └── demo-presentacion.md
│       │   │   └── config.ts
│       │   └── assets/
│       │       └── diagrams/
│       ├── astro.config.mjs
│       ├── tsconfig.json
│       ├── package.json
│       └── README.md
│
├── packages/
│   │
│   ├── shared-types/                 # ──── TIPOS COMPARTIDOS ────
│   │   ├── src/
│   │   │   ├── index.ts              # Exports públicos
│   │   │   ├── api.ts                # Generado desde OpenAPI (no editar a mano)
│   │   │   └── domain/               # Tipos de dominio extra
│   │   │       ├── contract.ts
│   │   │       └── biometric.ts
│   │   ├── scripts/
│   │   │   └── generate.ts           # Llama a openapi-typescript
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── config/                       # ──── CONFIG COMPARTIDA ────
│       ├── tsconfig/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── astro.json
│       ├── eslint/
│       │   ├── base.js
│       │   └── nextjs.js
│       ├── prettier/
│       │   └── index.js
│       └── package.json
│
├── .editorconfig
├── .gitignore
├── .nvmrc                            # Versión de Node fija
├── .python-version                   # Versión de Python fija
├── package.json                      # Root, define workspaces
├── pnpm-workspace.yaml
├── turbo.json                        # Pipeline de Turborepo
├── docker-compose.yml                # PostgreSQL + opcionalmente la API
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 3. Configuración de los archivos clave

### 3.1 `package.json` (root)

```json
{
  "name": "decdata-contratos",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "types:generate": "turbo run types:generate",
    "db:migrate": "pnpm --filter @decdata/api db:migrate",
    "db:seed": "pnpm --filter @decdata/api db:seed",
    "biometric:evaluate": "pnpm --filter @decdata/api biometric:evaluate"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "prettier": "^3.4.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.14.0"
}
```

### 3.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 3.3 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*"],
  "tasks": {
    "build": {
      "dependsOn": ["^build", "types:generate"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "types:generate": {
      "outputs": ["src/api.ts"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 3.4 `apps/api/package.json` (puente Turborepo)

El backend Python no es un workspace pnpm real, pero tiene un `package.json` mínimo que expone los scripts al pipeline de Turborepo:

```json
{
  "name": "@decdata/api",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "uvicorn src.decdata_api.main:app --reload --host 0.0.0.0 --port 8000",
    "build": "python -m build",
    "lint": "ruff check src tests && ruff format --check src tests",
    "test": "pytest",
    "db:migrate": "alembic upgrade head",
    "db:seed": "python scripts/seed_db.py",
    "biometric:evaluate": "python scripts/evaluate_biometric.py",
    "openapi:export": "python scripts/generate_openapi.py"
  }
}
```

Así `turbo run dev` levanta web + api + docs sin que Turborepo sepa que la API es Python.

### 3.5 `apps/api/pyproject.toml`

```toml
[project]
name = "decdata-api"
version = "0.1.0"
description = "API del sistema de gestión de contratos con biometría"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "pydantic>=2.9.0",
    "pydantic-settings>=2.6.0",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30.0",
    "alembic>=1.14.0",
    "python-jose[cryptography]>=3.3.0",
    "passlib[bcrypt]>=1.7.4",
    "python-multipart>=0.0.12",
    "opencv-python>=4.10.0",
    "scikit-image>=0.24.0",
    "numpy>=2.1.0",
    "fingerprint-feature-extractor>=0.0.6",
    "structlog>=24.4.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.27.0",
    "ruff>=0.7.0",
    "mypy>=1.13.0",
]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "UP", "RUF"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### 3.6 `packages/shared-types/package.json`

```json
{
  "name": "@decdata/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "types:generate": "openapi-typescript http://localhost:8000/openapi.json -o ./src/api.ts",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "openapi-typescript": "^7.4.0",
    "typescript": "^5.7.0"
  }
}
```

### 3.7 `docker-compose.yml` (raíz)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: decdata
      POSTGRES_PASSWORD: decdata_dev_pwd
      POSTGRES_DB: decdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Opcionalmente la API también
  # api:
  #   build: ./apps/api
  #   depends_on: [postgres]
  #   ports: ["8000:8000"]
  #   env_file: ./apps/api/.env

volumes:
  postgres_data:
```

---

## 4. Comandos cotidianos del proyecto

### Setup inicial (una sola vez)

```bash
# Clonar e instalar dependencias JS/TS
git clone <repo>
cd decdata-contratos
pnpm install

# Levantar PostgreSQL
docker-compose up -d postgres

# Instalar dependencias del backend Python
cd apps/api
uv sync   # o "poetry install" según tu gestor

# Configurar .env
cp .env.example .env
# editar con la URL de DB, JWT_SECRET, etc.

# Correr migraciones y seed
pnpm db:migrate
pnpm db:seed

# Generar tipos compartidos
# (necesita la API corriendo en otra terminal: pnpm --filter @decdata/api dev)
pnpm types:generate
```

### Desarrollo diario

```bash
# Levantar todo en paralelo
pnpm dev
# → web en http://localhost:3000
# → api en http://localhost:8000  (docs OpenAPI en /docs)
# → docs en http://localhost:4321

# Solo el frontend
pnpm --filter @decdata/web dev

# Solo el backend
pnpm --filter @decdata/api dev

# Correr tests
pnpm test

# Lint
pnpm lint

# Evaluar el matcher biométrico contra el dataset
pnpm biometric:evaluate
```

### Cuando cambia el backend

```bash
# Asegurar que la API está corriendo
pnpm --filter @decdata/api dev

# En otra terminal, regenerar tipos del frontend
pnpm types:generate
```

---

## 5. Convenciones de código y commits

### 5.1 Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase, archivo kebab-case | `contract-form.tsx` exporta `ContractForm` |
| Hook | camelCase con prefijo `use` | `useContracts` |
| Función Python | snake_case | `extract_minutiae` |
| Clase Python | PascalCase | `BiometricService` |
| Constante | SCREAMING_SNAKE_CASE | `MATCH_THRESHOLD` |
| Variable de entorno | SCREAMING_SNAKE_CASE | `DATABASE_URL` |
| Tabla BD | snake_case plural | `biometric_verifications` |
| Endpoint REST | kebab-case, plural | `/contracts/{id}/sign` |

### 5.2 Conventional Commits

```
feat(biometric): implement Hough-based alignment for minutiae
fix(contracts): prevent signing of already-signed contracts
docs(arch): add ADR-005 about JSONB for templates
chore(deps): bump fastapi to 0.115.4
test(matcher): add coverage for edge case with no minutiae
refactor(api): extract storage service interface
```

### 5.3 Estructura de PRs

- Branch desde `main`: `feat/biometric-matcher`, `fix/contract-signing-bug`
- PR pequeños, idealmente < 400 líneas cambiadas
- Cada PR pasa lint + tests en CI antes de merge
- Squash merge al main

---

## 6. Variables de entorno

### 6.1 `apps/api/.env.example`

```bash
# Database
DATABASE_URL=postgresql+asyncpg://decdata:decdata_dev_pwd@localhost:5432/decdata

# Security
JWT_SECRET=change-me-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=8
BCRYPT_COST=12

# Biometric
MATCH_THRESHOLD=0.45
ALGORITHM_VERSION=v1.0-gabor-zhang-suen
MAX_IMAGE_SIZE_MB=5
ALLOWED_IMAGE_FORMATS=png,jpg,jpeg,bmp,tif

# Storage
STORAGE_BACKEND=local
STORAGE_LOCAL_PATH=./storage

# CORS
CORS_ORIGINS=http://localhost:3000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### 6.2 `apps/web/.env.local.example`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 7. CI/CD (referencial)

### 7.1 `.github/workflows/ci.yml`

Pipeline básico que se dispara en cada push y PR:

```yaml
name: CI
on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: testpwd
          POSTGRES_DB: decdata_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @decdata/api... install-python  # script custom
      - run: pnpm lint
      - run: pnpm test
```

---

## 8. Crecimiento futuro de la estructura

Si en algún momento se decide expandir, la estructura admite:

| Necesidad futura | Cómo encaja |
|---|---|
| App móvil | `apps/mobile/` (Expo React Native), consume mismos tipos |
| Chatbot RAG embebido | `apps/chatbot/` (FastAPI + LlamaIndex) o módulo dentro de `apps/api` |
| Admin separado | `apps/admin/` o feature flag dentro de `apps/web` |
| Microservicio biométrico | Extraer `apps/api/src/decdata_api/biometric/` a `apps/biometric-service/` |
| SDK público | `packages/sdk-js`, `packages/sdk-py` |
| Worker de jobs | `apps/worker/` (Celery o RQ) para tareas pesadas |

---

## 9. Estimación de tiempo de setup inicial

Para un developer solo, partiendo de cero:

| Tarea | Tiempo |
|---|---|
| Crear estructura de carpetas + workspaces pnpm + Turborepo | 2-3 h |
| Configurar Next.js + Tailwind + shadcn/ui | 2-3 h |
| Configurar FastAPI + SQLAlchemy + Alembic | 3-4 h |
| Configurar Astro Starlight | 1-2 h |
| Configurar shared-types + openapi-typescript | 1-2 h |
| Docker Compose con PostgreSQL | 1 h |
| Configurar ESLint + Prettier + Ruff | 1-2 h |
| GitHub Actions básico | 1-2 h |
| README inicial y documentación de setup | 1-2 h |
| **Total setup inicial** | **13-21 horas** |

Esto es **antes** de escribir lógica de negocio. Es trabajo invisible pero fundamental para que el resto fluya rápido.

---

## 10. Resumen ejecutivo

Tres apps que viven juntas y se hablan limpio:

- **`apps/web`** — Lo que ve el usuario. Next.js 15 + shadcn/ui.
- **`apps/api`** — Donde vive la lógica y la biometría. FastAPI + OpenCV.
- **`apps/docs`** — Documentación pública del proyecto. Astro Starlight.

Conectadas por **`packages/shared-types`** (tipos generados desde OpenAPI) que justifica el monorepo. Comparten configuración base vía **`packages/config`**. Coordinadas por **Turborepo** con pipeline cacheado e incremental.

El núcleo biométrico vive en `apps/api/src/decdata_api/biometric/` como módulo Python autocontenido. Es lo que el curso de Sistemas Inteligentes va a evaluar, y por eso se documenta y testea con detalle especial.
