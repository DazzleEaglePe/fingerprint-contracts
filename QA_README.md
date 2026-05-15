# 🕵️‍♂️ QA & Antigravity Context - Fingerprint Contracts

¡Bienvenido al entorno de Quality Assurance del sistema **DecData: Firma Biométrica de Contratos**! 
Este documento ha sido creado específicamente para que tanto ingenieros de QA como otras instancias de IAs (como Antigravity) entiendan rápidamente la arquitectura, el flujo y las validaciones críticas implementadas en el sistema.

---

## 🏗️ Arquitectura General

El proyecto es un monorepo gestionado con **Turborepo** y **pnpm**, dividido en dos aplicaciones principales:

1. **Backend (`apps/api`)**:
   - Construido con **FastAPI** (Python 3.11).
   - Motor de persistencia: **SQLAlchemy (Async)** con PostgreSQL.
   - Motor Biométrico: Pipeline nativo usando OpenCV y skimage (Filtros de Gabor, algoritmo de esqueletización Zhang-Suen y extracción de minutiae por Crossing Number).
   - *Start cmd:* `uv run uvicorn src.decdata_api.main:app --reload` (requiere `PYTHONPATH=src` o ejecutar desde la carpeta src).

2. **Frontend (`apps/web`)**:
   - Construido con **Next.js 14+** (App Router).
   - Estilización: **Tailwind CSS** + UI Components premium (shadcn/ui adaptado).
   - Estado y Fetching: **Zustand** (Auth) y **TanStack React Query** (Sincronización de caché).
   - *Start cmd:* `next dev` (o `pnpm dev` en la raíz).

---

## 🔄 Flujos Críticos a Validar

### 1. Motor Biométrico (Enrolamiento)
* **Endpoint:** `POST /api/biometric/enroll/{owner_id}`
* **Flujo UI:** `/dashboard/enrollment` -> Pestaña "Enrolamiento".
* **Validaciones (Backend):**
  * Si el dueño ya tiene una huella activa (`is_active=True`), la API rechaza el enrolamiento devolviendo `HTTP 400` ("Este dueño ya se encuentra enrolado con una huella activa").
  * Si la imagen no tiene calidad suficiente o el dataset está corrupto, la API responde con un fallo descriptivo.
  
### 2. Motor Biométrico (Firma / Matching)
* **Endpoint:** `POST /api/biometric/verify/{contract_id}`
* **Flujo UI:** `/dashboard/enrollment` -> Pestaña "Firma / Validación".
* **Validaciones Integradas:**
  * **Frontend:** El desplegable de "Contratos a Firmar" **excluye** cualquier contrato que ya esté firmado (`status === "SIGNED"`). Solo muestra borradores o pendientes.
  * **Backend Transaccional:** Al hacer *match* correcto (Score >= Threshold), se cambian tres cosas en base de datos *en la misma transacción*:
    1. Se guarda el log en `biometric_verifications`.
    2. El contrato pasa a estado `"SIGNED"`.
    3. Se inyecta el `biometric_score` obtenido directamente en la tabla del contrato.
  * **Persistencia Frontend:** Tras la respuesta HTTP 200, React Query dispara un `invalidateQueries(['contracts'])`, obligando al Dashboard y al listado a mostrar el contrato como firmado en tiempo real sin recargar la página.

### 3. Sincronización de Base de Datos
* **Script de Limpieza (Reset & Seed):** 
  - Archivo: `apps/api/scripts/reset_and_seed.py`
  - *Función:* Realiza un `TRUNCATE CASCADE` de las tablas y re-inyecta la data inicial (3 fundos, 3 dueños, 2 contratos). 
  - *Uso QA:* Correr esto siempre que se quiera limpiar la BD de registros duplicados por inserciones dobles o tests sucios.

---

## ✅ Plan de Pruebas Exhaustivas (Test Cases)

El equipo de QA debe validar los siguientes escenarios para garantizar la robustez del sistema:

### 🔐 1. Autenticación y Permisos
- [ ] **Login Exitoso:** Ingresar con credenciales válidas y ser redirigido al `/dashboard`.
- [ ] **Login Fallido:** Intentar ingresar con credenciales inválidas; verificar que aparezca la alerta de error y no permita el acceso.
- [ ] **Rutas Protegidas:** Intentar acceder a `/dashboard` sin haber iniciado sesión. Debe redirigir automáticamente a `/login`.
- [ ] **Logout:** Cerrar sesión y verificar que el token se elimina correctamente (las cookies se limpian).

### 🏢 2. Gestión de Entidades (Fundos y Dueños)
- [ ] **Crear Fundo:** Usar el modal premium para crear un nuevo fundo. Validar que aparezca inmediatamente en la lista y que el contador del dashboard aumente.
- [ ] **Crear Dueño:** Registrar a un dueño asociándolo a un fundo existente. Probar validación de formato (ej. enviar DNI vacío o mal formato) y verificar el rechazo.
- [ ] **Sincronización:** Asegurarse de que el nuevo dueño aparezca instantáneamente en la tabla sin necesidad de recargar la página.

### 📝 3. Gestión de Contratos
- [ ] **Crear Contrato:** Generar un nuevo contrato asignándolo a un fundo.
- [ ] **Estado Inicial:** Validar que el nuevo contrato nazca con el estado `PENDING_SIGNATURE` o `DRAFT`.
- [ ] **Renderizado:** Comprobar que en el Dashboard (Actividad) y en la lista de Contratos el diseño de las tarjetas y los badges de estado coincidan con la estética esperada.

### 🧬 4. Pruebas Biomédicas (Edge Cases)
- [ ] **TC-01: Enrolamiento Exitoso (Happy Path):** Enrolar la huella de un dueño sin plantilla previa. Verificar el Toast de éxito y las métricas (Score de calidad y extracción de minutiae).
- [ ] **TC-02: Doble Enrolamiento:** Intentar enrolar la huella de un dueño que *ya está enrolado*. Verificar que el Backend devuelve HTTP 400 y el Frontend muestra el error: "Este dueño ya se encuentra enrolado con una huella activa."
- [ ] **TC-03: Firma Exitosa (Matching Correcto):** Seleccionar un contrato pendiente y validar con la huella correcta. 
  - *Validación:* Verificar mensaje de éxito con Score alto (> Threshold).
  - *Sincronización:* Ir a `/dashboard/contracts` y confirmar que el contrato dice `SIGNED` con su Score Biométrico en color gris.
- [ ] **TC-04: Firma Fallida (Falso Positivo FAR):** Intentar firmar el contrato de "Juan" usando la huella de "María". Verificar que el algoritmo arroje un Score bajo y se deniegue la firma con el veredicto `RECHAZADO`.
- [ ] **TC-05: Filtro Inteligente de Desplegable:** Tras firmar un contrato, volver a la pantalla de validación biométrica. Confirmar que el contrato firmado **ya no aparece** en el menú `<select>` de contratos a firmar.
- [ ] **TC-06: Huella Corrupta:** Subir un archivo no válido (ej. un PDF con extensión `.bmp` o una imagen completamente negra) y asegurar que la API lo rechace por "Fallo en extracción de minutiae".

---

## 🧪 Notas para el Agente Antigravity de QA

Si estás ayudando a validar este proyecto, ten en cuenta las siguientes peculiaridades del estado actual:

1. **Timezones en SQLAlchemy:** En el modelo `Contract`, el campo `signed_at` es naive (`TIMESTAMP WITHOUT TIME ZONE`). En `biometric.py`, se implementó `.replace(tzinfo=None)` para evitar crashes con la librería `asyncpg`.
2. **Commit Explícito:** En `biometric.py`, asegúrate de que exista la instrucción `db.add(contract)` y `await db.commit()` antes de devolver la respuesta. De lo contrario, el interceptor de cierre de sesión de la dependencia de FastAPI podría no persistir las modificaciones en el estado de SQLAlchemy.
3. **Manejo de Caché:** El frontend utiliza Axios. La invalidación de caché ocurre a nivel global de React Query para mantener el contador del dashboard en sincronía con la tabla principal de contratos.

¡Éxitos con las pruebas! 🚀
