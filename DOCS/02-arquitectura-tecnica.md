# Arquitectura Técnica

**Proyecto:** Sistema de Gestión de Contratos con Validación Biométrica por Huella Digital
**Versión:** 1.0
**Fecha:** Mayo 2026

---

## 1. Visión arquitectónica

El sistema sigue una arquitectura **cliente-servidor desacoplada** organizada como **monorepo Turborepo**, con tres aplicaciones independientes que se comunican por HTTP:

- **Frontend web (Next.js 15)** — Interfaz de usuario donde el administrador opera el sistema
- **API backend (FastAPI Python)** — Lógica de negocio, persistencia y núcleo biométrico
- **Sitio de documentación (Astro Starlight)** — Documentación técnica y de usuario

La separación frontend/backend responde a tres razones concretas:

1. **El núcleo biométrico (OpenCV, scikit-image, NumPy) vive obligatoriamente en Python.** No tiene sentido tratar de hacerlo en Node.
2. **La UI rica de gestión documental se hace mejor en React/Next.** Tablas, formularios complejos, visualizaciones de minutiae sobre la huella.
3. **Permite que cada capa evolucione independiente.** El frontend puede mejorarse sin tocar la biometría, y viceversa.

---

## 2. Diagrama de arquitectura de alto nivel

```
┌────────────────────────────────────────────────────────────────────┐
│                       NAVEGADOR (Cliente)                          │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐     │
│   │           apps/web — Next.js 15 (App Router)             │     │
│   │                                                          │     │
│   │   • Páginas de contratos, fundos, biometría, historial   │     │
│   │   • UI con shadcn/ui + Tailwind CSS                      │     │
│   │   • Estado servidor: TanStack Query                      │     │
│   │   • Estado cliente: Zustand                              │     │
│   │   • Validación de formularios: react-hook-form + zod     │     │
│   └──────────────────────────┬───────────────────────────────┘     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
                               │ HTTP / JSON (REST)
                               │ JWT en Authorization header
                               │
┌──────────────────────────────▼─────────────────────────────────────┐
│                                                                    │
│           apps/api — FastAPI Python 3.11+                          │
│                                                                    │
│   ┌────────────────────┐  ┌────────────────────┐                   │
│   │  Capa HTTP         │  │  Capa de servicios │                   │
│   │  (routers FastAPI) │──▶│  (lógica negocio) │                   │
│   │                    │  │                    │                   │
│   │  • /auth           │  │  • ContractService │                   │
│   │  • /fundos         │  │  • BiometricSvc    │                   │
│   │  • /contracts      │  │  • AlertService    │                   │
│   │  • /biometric      │  │  • AuditService    │                   │
│   │  • /audit          │  │                    │                   │
│   └────────────────────┘  └─────────┬──────────┘                   │
│                                     │                              │
│   ┌─────────────────────────────────▼──────────────────────────┐   │
│   │              Núcleo biométrico (Python puro)               │   │
│   │                                                            │   │
│   │   ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │   │
│   │   │ Preprocess   │─▶│ Extracción de │─▶│   Matcher    │    │   │
│   │   │ (OpenCV)     │  │   minutiae    │  │  (propio)    │    │   │
│   │   │              │  │ (librería)    │  │              │    │   │
│   │   └──────────────┘  └───────────────┘  └──────────────┘    │   │
│   └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│   ┌────────────────────┐  ┌────────────────────────────────────┐   │
│   │  Capa de datos     │  │  Storage de imágenes               │   │
│   │  (SQLAlchemy ORM)  │  │  (filesystem local en MVP,         │   │
│   │                    │  │   S3-compatible en producción)     │   │
│   └─────────┬──────────┘  └────────────────────────────────────┘   │
│             │                                                      │
└─────────────┼──────────────────────────────────────────────────────┘
              │
              │ asyncpg
              │
┌─────────────▼──────────────────────────────────────────────────────┐
│              PostgreSQL 16 (BD relacional)                         │
│                                                                    │
│   Esquemas: fundos, contratos, partes, biometría, auditoría        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes principales

### 3.1 Frontend — `apps/web`

**Framework:** Next.js 15 con App Router
**Lenguaje:** TypeScript estricto
**Runtime:** Node.js 20+

#### Stack interno

| Capa | Herramienta | Justificación |
|---|---|---|
| Framework | Next.js 15 | SSR/SSG cuando convenga, routing por archivos, ecosistema maduro |
| UI components | shadcn/ui + Radix UI | Componentes accesibles, copy-paste, sin dependencia pesada |
| Estilos | Tailwind CSS 3.x | Velocidad de iteración, consistencia visual |
| Estado servidor | TanStack Query v5 | Caching, refetch, optimistic updates contra la API |
| Estado cliente | Zustand | Liviano, sin boilerplate, para UI state (modales, filtros) |
| Formularios | react-hook-form + zod | Validación tipada, performance, integración con shadcn |
| HTTP client | fetch nativo con wrapper tipado | Sin dependencias adicionales, usa los tipos de `packages/shared-types` |
| Iconos | lucide-react | Consistencia con shadcn/ui |
| Notificaciones | sonner | Toast moderno, integrado con shadcn |
| Tablas | TanStack Table v8 | Listados de contratos con sorting, filtros, paginación |
| Visualización biométrica | react-konva o canvas API | Dibujar minutiae sobre la imagen de huella |

#### Responsabilidades

- Renderizar la UI de gestión documental (listados, formularios, detalles)
- Subir imágenes de huella (multipart/form-data) al API
- Mostrar visualización de las minutiae detectadas sobre la huella original
- Mostrar resultados de validación biométrica con su score
- Gestionar el estado de sesión con JWT (almacenado en httpOnly cookie o localStorage)
- Manejar errores de red y mostrar feedback al usuario

#### Lo que NO hace

- No procesa imágenes de huella en el navegador (todo va al backend Python)
- No ejecuta lógica biométrica
- No accede directamente a la BD

### 3.2 Backend — `apps/api`

**Framework:** FastAPI 0.115+
**Lenguaje:** Python 3.11+
**Servidor ASGI:** Uvicorn (con --workers en producción)

#### Stack interno

| Capa | Herramienta | Justificación |
|---|---|---|
| Framework web | FastAPI | Async nativo, validación con Pydantic, OpenAPI automático |
| ORM | SQLAlchemy 2.x (modo async) | Maduro, soporta async, ecosistema rico |
| Validación | Pydantic v2 | Integrado con FastAPI, performance, type safety |
| Migraciones | Alembic | Estándar de facto para SQLAlchemy |
| Auth | python-jose + passlib[bcrypt] | JWT firmado, hash de passwords |
| Procesamiento imagen | OpenCV (opencv-python) | Filtros, binarización, manipulación de imagen |
| Procesamiento imagen 2 | scikit-image | Esqueletización (Zhang-Suen), operaciones morfológicas |
| Cálculo numérico | NumPy | Operaciones vectoriales, manejo de matrices de imagen |
| Extracción minutiae | fingerprint-feature-extractor | Librería que da minutiae con sus coordenadas y orientaciones |
| Storage local | filesystem (`apps/api/storage/`) | Suficiente para MVP local |
| Storage cloud (opcional) | boto3 + MinIO/S3 | Si se decide cloud en producción |
| Testing | pytest + pytest-asyncio + httpx | Estándar Python moderno |
| Linting | Ruff | Formato + lint rapidísimo, reemplaza black+isort+flake8 |

#### Estructura de capas

El backend se organiza en capas claras (clean architecture light):

1. **Routers (capa HTTP)** — Definen los endpoints, validan input/output con Pydantic. No tienen lógica de negocio. Solo orquestan llamadas a servicios.

2. **Services (capa de negocio)** — Contienen la lógica del dominio. No saben de HTTP. Reciben datos planos, llaman al repositorio o al núcleo biométrico, retornan resultados.

3. **Repositories (capa de datos)** — Acceso a la BD via SQLAlchemy. Solo consultas/persistencia, sin lógica de negocio.

4. **Núcleo biométrico (módulo separado)** — Funciones puras Python. No saben de HTTP, no saben de BD. Reciben imágenes/arrays NumPy y retornan minutiae o scores.

5. **Models (Pydantic + SQLAlchemy)** — DTOs (Pydantic) y entidades (SQLAlchemy). Separación entre modelos de transporte y modelos de persistencia.

### 3.3 Núcleo biométrico (dentro de `apps/api`)

El componente más sensible del sistema. Se documenta en detalle por su criticidad académica.

#### Pipeline completo

```
Imagen huella (PNG/JPG)
        │
        ▼
┌───────────────────────────┐
│  1. Carga (OpenCV)        │  cv2.imread() → array NumPy (H, W) grayscale
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  2. Normalización         │  Resize a tamaño estándar, ajuste de
│  (OpenCV)                 │  intensidad media y varianza
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  3. Mejora con filtro     │  Filtro Gabor con orientación local
│  Gabor (OpenCV)           │  para realzar crestas
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  4. Binarización          │  cv2.adaptiveThreshold()
│  adaptativa (OpenCV)      │  Crestas → negro, valles → blanco
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  5. Esqueletización       │  skimage.morphology.skeletonize()
│  (scikit-image)           │  Crestas reducidas a 1 píxel de grosor
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  6. Extracción minutiae   │  fingerprint-feature-extractor
│  (librería)               │  → lista de minutiae: (x, y, θ, tipo)
└───────────┬───────────────┘
            ▼
┌───────────────────────────┐
│  7. Filtrado de minutiae  │  Eliminar minutiae en bordes, espurias,
│  espurias (propio)        │  o muy cercanas entre sí
└───────────┬───────────────┘
            ▼
        Plantilla
       (lista de
        minutiae)
```

#### Algoritmo de matching (implementación propia)

Cuando llega una huella a verificar contra una plantilla maestra:

1. **Alineación.** Antes de comparar, se alinea la huella entrante con la plantilla. Se usa un enfoque basado en Hough Transform sobre las orientaciones de las minutiae, o alternativamente se elige un par de minutiae "ancla" de cada huella y se calcula la transformación de rotación + traslación que las hace coincidir.

2. **Matching de minutiae.** Por cada minutia de la plantilla, se busca si existe una minutia en la huella entrante que cumpla:
   - Distancia espacial menor a un radio de tolerancia (típico: 15 píxeles)
   - Diferencia de orientación menor a un umbral angular (típico: 10°)
   - Mismo tipo (terminación con terminación, bifurcación con bifurcación)

3. **Score de similitud.** Se calcula como:
   ```
   score = (2 * minutiae_matched) / (minutiae_template + minutiae_query)
   ```
   Score entre 0 y 1.

4. **Decisión.** Si `score >= threshold` → válida. Si no → rechazada.

5. **Evaluación.** Para calibrar el umbral, se evalúa el sistema sobre el dataset con métricas FAR (False Accept Rate), FRR (False Reject Rate) y EER (Equal Error Rate).

#### Lo que tú implementas vs lo que te da la librería

| Etapa | Implementación |
|---|---|
| Preprocesamiento de imagen | OpenCV (librería, parámetros tuyos) |
| Filtro Gabor | OpenCV (librería) |
| Binarización | OpenCV (librería) |
| Esqueletización | scikit-image (librería) |
| Extracción de minutiae | `fingerprint-feature-extractor` (librería) |
| **Filtrado de minutiae espurias** | **Implementación propia** |
| **Alineación de plantillas** | **Implementación propia** |
| **Matching de minutiae** | **Implementación propia** |
| **Cálculo de score** | **Implementación propia** |
| **Cálculo de métricas FAR/FRR/EER** | **Implementación propia** |
| **Calibración de umbral** | **Implementación propia** |

Esta separación es deliberada: usas librerías para lo que es ingeniería estándar (preprocesamiento), e implementas tú lo que es contenido académico real del curso de Sistemas Inteligentes (matching, scoring, métricas, decisiones por umbral).

### 3.4 Base de datos — PostgreSQL 16

**Por qué PostgreSQL:**
- Tipos de datos ricos (`JSONB` para metadatos flexibles, `BYTEA` para plantillas binarias, `TIMESTAMP WITH TIME ZONE` correcto)
- Constraints sólidos (foreign keys, check constraints, unique compuestos)
- Madurez para auditoría y reportes
- Disponible gratis local y en Supabase si se quiere hosting cloud
- Soporte first-class en SQLAlchemy

**Por qué no MongoDB / no documental:**
- Los datos son altamente relacionales: contrato pertenece a fundo, contrato tiene N partes, contrato tiene N intentos de validación, fundo tiene 1 dueño. Esto es exactamente lo que las relaciones hacen bien.
- Las consultas comunes son JOIN: "muéstrame los contratos firmados del fundo X en los últimos 30 días con su contraparte y resultado biométrico". En documental esto se complica.
- Auditoría requiere integridad referencial estricta.

**Por qué no SQLite:**
- SQLite es perfecto para el chatbot RAG o para apps móviles. Pero un sistema que pretende ser realista para un fundo agrícola debe usar BD real.
- Tipos como `TIMESTAMP WITH TIME ZONE` no existen en SQLite.

### 3.5 Sitio de documentación — `apps/docs`

**Framework:** Astro 5 + Starlight
**Por qué:**
- Genera sitio estático rápido
- Starlight da tema documentación-ready (sidebar, búsqueda, navegación)
- Markdown nativo, los documentos de este proyecto se sirven directamente
- Despliegue trivial a Vercel/Netlify/Cloudflare Pages

Alternativa considerada: Nextra. Astro Starlight gana por ser más liviano y porque al estar Astro fuera del stack de la app web no hay conflicto de versiones de Next.

---

## 4. Paquetes compartidos

### 4.1 `packages/shared-types`

Tipos TypeScript generados automáticamente desde el esquema OpenAPI que FastAPI expone.

**Flujo:**
1. FastAPI expone `/openapi.json` con el esquema completo de su API.
2. Script `pnpm generate-types` corre `openapi-typescript` contra ese endpoint y genera `packages/shared-types/src/api.ts`.
3. El frontend importa los tipos: `import type { components } from "@decdata/shared-types"`.
4. Cuando el backend cambia un endpoint, regenerar tipos detecta los breaking changes en build.

Esto es lo que **justifica genuinamente el monorepo Turborepo**. Sin este package compartido, tener Next y FastAPI separados no necesita monorepo.

### 4.2 `packages/config`

Configuraciones compartidas:
- `tsconfig.base.json` extendido por web y docs
- `eslint.config.js` base
- `prettier.config.js`

---

## 5. Decisiones arquitectónicas relevantes (ADRs resumidos)

### ADR-001: Monorepo con Turborepo

**Decisión:** Usar Turborepo con pnpm workspaces.
**Alternativas consideradas:** Repos separados, Nx, Lerna.
**Razón:** Turborepo es liviano, su caché remota es opcional, integra bien con pnpm, y es lo que te permite compartir tipos entre web y api sin esfuerzo.
**Consecuencia:** Setup inicial cuesta 1 día, pero compensa con DX consistente.

### ADR-002: FastAPI sobre Django/Flask para el backend

**Decisión:** FastAPI.
**Alternativas consideradas:** Django, Flask, NestJS.
**Razón:**
- FastAPI tiene async nativo (importante si en algún punto se quieren procesos biométricos paralelos)
- Pydantic v2 da validación + serialización + tipos en uno
- Genera OpenAPI automático que alimenta `packages/shared-types`
- Más ligero que Django para este caso (no necesitamos admin, ORM Django, ni templates)
- Tu memoria indica que ya manejas FastAPI

**Consecuencia:** Hay que armar a mano cosas que Django da gratis (admin, auth completa), pero para el alcance del MVP no las necesitamos.

### ADR-003: Núcleo biométrico como módulo Python dentro del backend, no como microservicio separado

**Decisión:** El núcleo biométrico vive en `apps/api/biometric/` como módulo importable.
**Alternativas consideradas:** Microservicio biométrico separado con cola de mensajes.
**Razón:** Para MVP académico, un microservicio agrega complejidad sin beneficio. La biometría es síncrona (latencia objetivo < 4 segundos extremo a extremo) y no necesita escalar separado.
**Consecuencia:** Si en producción real el procesamiento biométrico crece, se puede extraer a su propio servicio. Por ahora vive embebido.

### ADR-004: Storage de imágenes en filesystem local para MVP

**Decisión:** Las imágenes de huella se guardan en `apps/api/storage/fingerprints/` en el filesystem local.
**Alternativas consideradas:** S3, MinIO, almacenarlas como BYTEA en PostgreSQL.
**Razón:** Filesystem es lo más simple para MVP. La BD guarda solo la ruta. Si se quiere migrar a S3 después, se cambia el `StorageService` y no se toca el resto.
**Consecuencia:** No es escalable horizontalmente, pero el MVP es local. La interfaz `StorageService` queda preparada para reemplazo.

### ADR-005: Plantillas biométricas como JSONB en PostgreSQL

**Decisión:** Las plantillas (listas de minutiae) se almacenan como columna `JSONB` en la tabla `biometric_templates`.
**Alternativas consideradas:** Tabla separada con una fila por minutia, BYTEA serializado.
**Razón:**
- JSONB permite consultar, validar y versionar el formato sin migrar tablas
- Una plantilla típica tiene 30-80 minutiae; cabe perfectamente en una columna
- Mantiene atomicidad: una plantilla = un registro
- Para una BD posta de producción se podría cifrar (`pgcrypto`), aclarado en el documento de BD

**Consecuencia:** No se puede consultar SQL sobre minutiae individuales (no es necesario para los casos de uso).

### ADR-006: Auth con JWT simple, no OAuth ni sesiones server-side

**Decisión:** JWT firmado con clave simétrica, expira en 8 horas.
**Alternativas consideradas:** Sesiones server-side con Redis, OAuth con Google.
**Razón:** MVP académico con pocos usuarios operadores. No necesita SSO ni revocación granular. JWT es suficiente y se documenta como decisión consciente.
**Consecuencia:** En producción real con multi-tenant, se debe migrar a algo más robusto (refresh tokens, revocación, etc.).

---

## 6. Flujo end-to-end de validación biométrica

Para clarificar cómo conviven las capas, este es el flujo completo de "firmar un contrato":

```
USUARIO (en navegador)
   │
   │ 1. Selecciona contrato en estado "Borrador"
   │    Click en "Firmar con huella"
   │    Sube imagen de huella desde su computadora
   │
   ▼
FRONTEND Next.js
   │
   │ 2. Valida formato de imagen (PNG/JPG, max 5MB)
   │    Construye FormData con imagen + contractId
   │
   │ 3. POST /api/contracts/{id}/sign con multipart/form-data
   │    Authorization: Bearer <jwt>
   │
   ▼
BACKEND FastAPI - Router /contracts
   │
   │ 4. Middleware: valida JWT, extrae user_id
   │ 5. Router recibe imagen y contractId
   │    Valida con Pydantic (UploadFile, contractId UUID)
   │
   │ 6. Llama a ContractService.sign(contract_id, image, user)
   │
   ▼
BACKEND - ContractService
   │
   │ 7. Recupera el contrato y verifica que está en estado "Borrador"
   │    Recupera el fundo asociado y la plantilla biométrica del dueño
   │
   │ 8. Llama a BiometricService.verify(query_image, master_template)
   │
   ▼
BACKEND - BiometricService
   │
   │ 9. Llama al pipeline del núcleo biométrico:
   │    a. preprocess(query_image) → imagen normalizada
   │    b. binarize_and_skeletonize(image) → imagen esqueleto
   │    c. extract_minutiae(skeleton) → lista de minutiae
   │    d. filter_spurious(minutiae) → minutiae depuradas
   │
   │ 10. Llama al matcher (implementación propia):
   │     a. align(query_template, master_template) → transformación
   │     b. count_matched_minutiae(aligned_query, master)
   │     c. score = compute_score(matched, total_query, total_master)
   │
   │ 11. Decisión:
   │     match = score >= settings.MATCH_THRESHOLD
   │
   │ 12. Retorna BiometricVerificationResult { match, score, ... }
   │
   ▼
BACKEND - ContractService (continuación)
   │
   │ 13. Llama a AuditService.log_verification(contract_id, user_id, score, match)
   │
   │ 14. Si match == True:
   │       Actualiza contrato.estado = "Firmado"
   │       Actualiza contrato.firmado_en = now()
   │     Si match == False:
   │       Contrato permanece en "Borrador"
   │       Levanta AlertService.log_failed_attempt() (posible suplantación)
   │
   │ 15. Commit transacción de BD
   │
   ▼
BACKEND - Respuesta HTTP
   │
   │ 16. Retorna JSON: { success, contract, biometricResult: { score, match } }
   │
   ▼
FRONTEND Next.js
   │
   │ 17. TanStack Query invalida cache de "contract detail"
   │     Muestra toast: "Contrato firmado exitosamente" o "Validación fallida"
   │     Si match, redirige a vista de contrato firmado con badge biométrico
   │     Si no match, muestra modal de alerta con detalle del intento
   │
   ▼
USUARIO ve el resultado
```

Latencia objetivo extremo a extremo: **< 4 segundos**.

---

## 7. Modelo de seguridad

### 7.1 Autenticación

- Login con email + password
- Password hasheado con `bcrypt` (cost 12)
- JWT firmado con HS256, secret en variable de entorno
- Expiración: 8 horas
- Token en `Authorization: Bearer <token>` header

### 7.2 Autorización

Roles simples en el MVP:
- `ADMIN` — Acceso total al fundo y sus contratos
- `AUDITOR` — Solo lectura sobre contratos e historial biométrico

Decisiones de autorización a nivel de servicio (no en router) para evitar lógica de auth dispersa.

### 7.3 Datos sensibles

- **Plantillas biométricas:** Almacenadas como JSONB. En producción real, cifrar con `pgcrypto` o equivalente. En MVP académico se documenta como deuda técnica.
- **Imágenes de huella originales:** Se almacenan en filesystem solo durante el enrollment y para auditoría. Se documenta política de retención.
- **Datos de contrapartes (DNI, RUC):** Almacenados en claro en MVP. En producción se enmascararían en logs.

### 7.4 Comunicaciones

- HTTPS obligatorio en producción (TLS 1.2+).
- En desarrollo local, HTTP en localhost es aceptable.

---

## 8. Observabilidad

### 8.1 Logging

- Backend: logs estructurados JSON con `structlog`
- Niveles: DEBUG (dev), INFO (default), WARN, ERROR
- Cada request HTTP loguea: method, path, status, duration, user_id
- Cada operación biométrica loguea: contract_id, score, decision, duration
- No se loguean: passwords, JWTs, imágenes binarias, contenido de plantillas

### 8.2 Métricas (opcional en MVP)

Si se decide instrumentar:
- Latencia p50/p95/p99 por endpoint
- Distribución de scores biométricos
- FAR/FRR observados en producción

### 8.3 Errores

- Backend: errores controlados → `HTTPException` con código apropiado
- Frontend: TanStack Query maneja retries, errores se muestran como toast
- Sentry o equivalente queda como trabajo futuro

---

## 9. Despliegue (referencial, fuera del MVP)

Aunque el MVP corre local, la arquitectura es deployable así si se decide:

| Componente | Hosting recomendado |
|---|---|
| `apps/web` | Vercel (Next.js nativo) |
| `apps/api` | Render, Fly.io o Railway con Docker |
| PostgreSQL | Supabase, Neon o Railway |
| Storage de imágenes | Supabase Storage o S3 |
| `apps/docs` | Vercel o Cloudflare Pages |

CI/CD con GitHub Actions: lint + tests + build en cada PR, deploy automático en main para web y docs (la api requiere migraciones manuales o automatizadas con cuidado).

---

## 10. Resumen de stack final

| Capa | Tecnología |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 15, TypeScript, Tailwind, shadcn/ui, TanStack Query, Zustand, react-hook-form + zod |
| Backend | FastAPI, Python 3.11+, Pydantic v2, SQLAlchemy 2 (async), Alembic |
| Biometría | OpenCV, scikit-image, NumPy, fingerprint-feature-extractor + matcher propio |
| BD | PostgreSQL 16 |
| Storage | Filesystem local (MVP), S3-compatible (futuro) |
| Auth | JWT con python-jose + bcrypt con passlib |
| Docs | Astro 5 + Starlight |
| Testing | pytest (api), Vitest + Testing Library (web) |
| Linting | Ruff (Python), ESLint + Prettier (TS) |
| Tipos compartidos | openapi-typescript |
