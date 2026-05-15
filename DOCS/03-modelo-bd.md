# Modelo de Base de Datos Relacional

**Proyecto:** Sistema de Gestión de Contratos con Validación Biométrica por Huella Digital
**Motor:** PostgreSQL 16
**ORM:** SQLAlchemy 2.x (modo async)
**Migraciones:** Alembic
**Versión:** 1.0

---

## 1. Visión general

El modelo de datos se organiza en cinco dominios lógicos, cada uno con sus tablas:

1. **Identidad y acceso** — `users` (operadores del sistema)
2. **Organización** — `fundos`, `owners`
3. **Biometría** — `biometric_templates`, `biometric_verifications`
4. **Contratos** — `contracts`, `contract_parties`, `contract_clauses`, `contract_types`
5. **Auditoría** — `audit_log` (registro transversal de eventos)

Todas las tablas usan **UUID v4** como clave primaria. Las razones: evita colisiones, no expone cardinalidad pública, permite generación en cliente cuando convenga, y es estándar moderno en sistemas con potencial multi-tenant en el futuro.

Todas las tablas incluyen los campos de auditoría:
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` (trigger lo actualiza en cada UPDATE)

Para entidades que pueden eliminarse lógicamente:
- `deleted_at TIMESTAMPTZ NULL` (soft delete)

---

## 2. Convenciones del esquema

| Aspecto | Convención |
|---|---|
| Nombres de tabla | `snake_case`, plural (`contracts`, no `contract`) |
| Nombres de columna | `snake_case`, singular (`first_name`, no `first_names`) |
| Claves primarias | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Foreign keys | `<entidad>_id` (`fundo_id`, `contract_id`) |
| Booleanos | Prefijo `is_` (`is_active`) o `has_` (`has_alert`) |
| Timestamps | Sufijo `_at` (`created_at`, `signed_at`, `expires_at`) |
| Fechas sin hora | Sufijo `_on` o `_date` (`birth_date`) |
| Montos | `NUMERIC(15, 2)` (no `FLOAT`, no `DECIMAL` sin precisión) |
| Estados enumerados | Tipo `ENUM` de PostgreSQL, no strings libres |
| JSON estructurado | `JSONB` (no `JSON`, para indexabilidad) |
| Texto largo | `TEXT` |
| Texto corto con límite | `VARCHAR(n)` |

---

## 3. Tipos enumerados (PostgreSQL ENUMs)

```sql
-- Roles del sistema
CREATE TYPE user_role AS ENUM ('ADMIN', 'AUDITOR');

-- Estados de un contrato
CREATE TYPE contract_status AS ENUM (
    'DRAFT',       -- Borrador, aún no firmado
    'SIGNED',      -- Firmado con validación biométrica exitosa
    'ACTIVE',      -- Firmado y vigente (post-firma, durante ejecución)
    'EXPIRED',     -- Vencido sin renovación
    'TERMINATED',  -- Terminado anticipadamente
    'RENEWED'      -- Renovado (apunta a un nuevo contrato)
);

-- Tipos de parte en un contrato
CREATE TYPE party_type AS ENUM (
    'INDIVIDUAL',  -- Persona natural
    'COMPANY'      -- Persona jurídica
);

-- Rol de una parte en un contrato
CREATE TYPE party_role AS ENUM (
    'OWNER',          -- El dueño del fundo (firma biométrica)
    'COUNTERPARTY'    -- Contraparte (compradores, proveedores, jornaleros)
);

-- Resultado de una verificación biométrica
CREATE TYPE biometric_result AS ENUM (
    'MATCH',          -- Score supera el umbral, validación exitosa
    'NO_MATCH',       -- Score bajo el umbral, rechazada
    'POOR_QUALITY'    -- Imagen no procesable (muy borrosa, sin minutiae suficientes)
);

-- Tipo de minutia
CREATE TYPE minutia_type AS ENUM (
    'TERMINATION',    -- Terminación de cresta
    'BIFURCATION'     -- Bifurcación de cresta
);

-- Severidad de evento de auditoría
CREATE TYPE audit_severity AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);
```

---

## 4. Definición de tablas

### 4.1 `users` — Operadores del sistema

Usuarios que operan el sistema (administradores, auditores). **No** son los dueños de fundos ni las contrapartes contractuales.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            user_role NOT NULL DEFAULT 'ADMIN',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ NULL
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = TRUE;
```

**Notas:**
- `password_hash` guarda bcrypt cost 12.
- Email es único entre usuarios activos (el filtro `WHERE deleted_at IS NULL` permite reutilizar emails de usuarios borrados).

### 4.2 `fundos` — Fundos agrícolas

Cada instancia del sistema sirve a uno o varios fundos. En MVP académico habrá uno o dos para demo.

```sql
CREATE TABLE fundos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    legal_name      VARCHAR(255) NULL,         -- Razón social si es jurídica
    ruc             VARCHAR(11) NULL,          -- RUC peruano (11 dígitos)
    address         TEXT NULL,
    region          VARCHAR(100) NULL,         -- Ej: "Ica"
    province        VARCHAR(100) NULL,         -- Ej: "Ica"
    district        VARCHAR(100) NULL,
    total_hectares  NUMERIC(10, 2) NULL,
    main_crops      TEXT[] NULL,               -- Array Postgres: {"uva","palto","esparrago"}
    phone           VARCHAR(30) NULL,
    email           VARCHAR(255) NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX idx_fundos_ruc ON fundos(ruc) WHERE ruc IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_fundos_active ON fundos(is_active) WHERE deleted_at IS NULL;
```

**Notas:**
- `main_crops` usa array nativo de Postgres. En SQLAlchemy se mapea con `ARRAY(String)`.
- RUC es único cuando existe (algunos fundos pequeños pueden no estar formalizados).

### 4.3 `owners` — Dueños de fundos

El dueño firmante autorizado. Tiene relación 1:1 con `fundos` en el MVP (un fundo, un dueño). Se modela en tabla separada para preparar evolución futura (copropietarios, sucesión).

```sql
CREATE TABLE owners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fundo_id        UUID NOT NULL REFERENCES fundos(id) ON DELETE RESTRICT,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    document_type   VARCHAR(20) NOT NULL DEFAULT 'DNI',  -- DNI, CE, RUC
    document_number VARCHAR(20) NOT NULL,
    birth_date      DATE NULL,
    phone           VARCHAR(30) NULL,
    email           VARCHAR(255) NULL,
    address         TEXT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_owners_fundo ON owners(fundo_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_owners_document ON owners(document_type, document_number);
CREATE INDEX idx_owners_fundo_lookup ON owners(fundo_id);
```

**Notas:**
- Constraint único parcial: un fundo solo puede tener un dueño activo a la vez.
- `ON DELETE RESTRICT` en `fundo_id`: no se puede eliminar un fundo con dueño asociado.

### 4.4 `biometric_templates` — Plantillas biométricas maestras

Almacena las minutiae extraídas de la huella del dueño durante el enrollment. Es la **plantilla maestra** contra la que se compararán las huellas entrantes.

```sql
CREATE TABLE biometric_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id            UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
    finger              VARCHAR(20) NOT NULL DEFAULT 'RIGHT_THUMB',
    minutiae            JSONB NOT NULL,            -- Array de minutiae: [{x,y,theta,type,quality}]
    minutiae_count      INTEGER NOT NULL,
    image_path          TEXT NULL,                 -- Ruta a la imagen original
    image_quality_score NUMERIC(5, 4) NULL,        -- Calidad estimada de la imagen [0-1]
    algorithm_version   VARCHAR(50) NOT NULL,      -- Ej: "v1.0-gabor-zhang-suen"
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_minutiae_count_positive CHECK (minutiae_count > 0),
    CONSTRAINT chk_quality_range CHECK (image_quality_score IS NULL OR (image_quality_score >= 0 AND image_quality_score <= 1))
);

CREATE INDEX idx_bio_templates_owner ON biometric_templates(owner_id) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_bio_templates_owner_finger_active
    ON biometric_templates(owner_id, finger)
    WHERE is_active = TRUE;
```

**Estructura del JSONB `minutiae`:**
```json
[
  { "x": 142, "y": 87, "theta": 1.57, "type": "TERMINATION", "quality": 0.85 },
  { "x": 203, "y": 156, "theta": 2.31, "type": "BIFURCATION", "quality": 0.91 },
  ...
]
```

**Notas:**
- Una sola plantilla activa por (owner, finger). Si se re-enrolla, se desactiva la anterior (preserva historial).
- `algorithm_version` permite saber con qué versión del pipeline se extrajo, útil para invalidar plantillas si se cambia el algoritmo.
- En producción real, `minutiae` se almacenaría cifrado con `pgcrypto` (`PGP_SYM_ENCRYPT`). En MVP se documenta como deuda técnica.

### 4.5 `contract_types` — Catálogo de tipos de contrato

Tabla de catálogo. Pre-poblada con los tipos comunes de un fundo agrícola.

```sql
CREATE TABLE contract_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE,    -- ej: "LAND_LEASE"
    name            VARCHAR(150) NOT NULL,           -- ej: "Arrendamiento de tierras"
    description     TEXT NULL,
    default_clauses TEXT[] NULL,                     -- Cláusulas sugeridas por defecto
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contract_types_active ON contract_types(is_active);
```

**Seed inicial (migración Alembic):**
```sql
INSERT INTO contract_types (code, name, description) VALUES
('LAND_LEASE',      'Arrendamiento de tierras',  'Cesión del uso de parcela a cambio de pago periódico'),
('HARVEST_SALE',    'Compraventa de cosecha',    'Venta de producción agrícola a comprador'),
('SUPPLY',          'Suministro de insumos',     'Entrega periódica de fertilizantes, semillas, pesticidas, agua'),
('TECH_SERVICE',    'Servicios técnicos',        'Ingenieros agrónomos, fumigación, mantenimiento de maquinaria'),
('LABOR',           'Contrato laboral',          'Trabajadores permanentes o jornaleros temporales'),
('TRANSPORT',       'Transporte y logística',    'Traslado de producción a centros de acopio o puertos'),
('AGRI_CREDIT',     'Crédito agrícola',          'Préstamo con entidad financiera para financiar campaña'),
('SHARECROPPING',   'Aparcería',                 'Dueño cede la tierra y aparcero la trabaja, comparten frutos');
```

### 4.6 `contracts` — Contratos

Tabla central. Cada fila es un contrato del fundo.

```sql
CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fundo_id            UUID NOT NULL REFERENCES fundos(id) ON DELETE RESTRICT,
    contract_type_id    UUID NOT NULL REFERENCES contract_types(id) ON DELETE RESTRICT,
    code                VARCHAR(50) NOT NULL,                -- Código interno del contrato
    title               VARCHAR(300) NOT NULL,
    description         TEXT NULL,                           -- Objeto del contrato
    status              contract_status NOT NULL DEFAULT 'DRAFT',

    -- Fechas
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    signed_at           TIMESTAMPTZ NULL,                    -- Cuándo se firmó biométricamente

    -- Económico
    amount              NUMERIC(15, 2) NULL,                 -- Monto total
    currency            VARCHAR(3) NOT NULL DEFAULT 'PEN',   -- ISO 4217: PEN, USD
    payment_terms       TEXT NULL,                           -- "Mensual", "Al cierre de cosecha", etc.

    -- Firma biométrica
    signed_by_owner_id          UUID NULL REFERENCES owners(id),
    biometric_verification_id   UUID NULL,                   -- FK a biometric_verifications (se agrega después)
    biometric_score             NUMERIC(5, 4) NULL,          -- Score de la firma exitosa

    -- Renovación
    renewed_from_id     UUID NULL REFERENCES contracts(id) ON DELETE SET NULL,

    -- Metadatos flexibles
    metadata            JSONB NULL,                          -- Campos extra específicos por tipo
    notes               TEXT NULL,

    -- Trazabilidad
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ NULL,

    CONSTRAINT chk_dates_valid CHECK (end_date >= start_date),
    CONSTRAINT chk_amount_positive CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT chk_score_range CHECK (biometric_score IS NULL OR (biometric_score >= 0 AND biometric_score <= 1)),
    CONSTRAINT chk_signed_requires_owner CHECK (
        (status NOT IN ('SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED')) OR
        (signed_by_owner_id IS NOT NULL AND signed_at IS NOT NULL AND biometric_score IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_contracts_code_per_fundo
    ON contracts(fundo_id, code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_contracts_fundo_status ON contracts(fundo_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_status ON contracts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contracts_end_date ON contracts(end_date) WHERE status IN ('SIGNED', 'ACTIVE') AND deleted_at IS NULL;
CREATE INDEX idx_contracts_type ON contracts(contract_type_id);
```

**Notas críticas:**
- El `CHECK` constraint `chk_signed_requires_owner` garantiza integridad: un contrato firmado **debe** tener owner, timestamp y score. No se puede burlar al marcar status sin pasar por el flujo biométrico.
- El índice parcial `idx_contracts_end_date` solo cubre contratos activos, optimizando el cálculo de "próximos a vencer".
- `code` es único dentro de cada fundo (no globalmente).

### 4.7 `contract_parties` — Partes de cada contrato

Relación N:M entre contratos y sus partes. El dueño se referencia desde `contracts.signed_by_owner_id`; las contrapartes viven aquí.

```sql
CREATE TABLE contract_parties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    party_type      party_type NOT NULL,
    party_role      party_role NOT NULL DEFAULT 'COUNTERPARTY',

    -- Identificación
    full_name       VARCHAR(255) NOT NULL,        -- Nombre completo o razón social
    document_type   VARCHAR(20) NOT NULL,         -- DNI, CE, RUC
    document_number VARCHAR(20) NOT NULL,

    -- Contacto
    phone           VARCHAR(30) NULL,
    email           VARCHAR(255) NULL,
    address         TEXT NULL,

    -- Representante legal (si party_type = COMPANY)
    legal_rep_name      VARCHAR(255) NULL,
    legal_rep_document  VARCHAR(20) NULL,

    -- Trazabilidad
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_company_has_rep CHECK (
        party_type = 'INDIVIDUAL' OR
        (party_type = 'COMPANY' AND legal_rep_name IS NOT NULL)
    )
);

CREATE INDEX idx_parties_contract ON contract_parties(contract_id);
CREATE INDEX idx_parties_document ON contract_parties(document_type, document_number);
```

### 4.8 `contract_clauses` — Cláusulas de contratos

Cláusulas específicas de cada contrato. Permite registrar las condiciones particulares más allá de los campos estructurados.

```sql
CREATE TABLE contract_clauses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    order_index     INTEGER NOT NULL,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_order_positive CHECK (order_index > 0)
);

CREATE INDEX idx_clauses_contract_order ON contract_clauses(contract_id, order_index);
```

### 4.9 `biometric_verifications` — Historial de verificaciones biométricas

**Tabla crítica para auditoría.** Registra cada intento de validación biométrica, exitoso o fallido. Es el respaldo legal del sistema.

```sql
CREATE TABLE biometric_verifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Contexto
    contract_id         UUID NULL REFERENCES contracts(id) ON DELETE SET NULL,
    owner_id            UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
    template_id         UUID NOT NULL REFERENCES biometric_templates(id) ON DELETE RESTRICT,
    initiated_by_user   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Resultado
    result              biometric_result NOT NULL,
    score               NUMERIC(5, 4) NOT NULL,
    threshold_used      NUMERIC(5, 4) NOT NULL,
    minutiae_matched    INTEGER NOT NULL,
    minutiae_query      INTEGER NOT NULL,
    minutiae_template   INTEGER NOT NULL,

    -- Pipeline
    algorithm_version   VARCHAR(50) NOT NULL,
    processing_ms       INTEGER NOT NULL,                    -- Latencia total en ms
    image_quality_score NUMERIC(5, 4) NULL,

    -- Imagen capturada (para auditoría)
    query_image_path    TEXT NULL,

    -- Cliente
    user_ip             INET NULL,
    user_agent          TEXT NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_score_range CHECK (score >= 0 AND score <= 1),
    CONSTRAINT chk_threshold_range CHECK (threshold_used >= 0 AND threshold_used <= 1),
    CONSTRAINT chk_minutiae_non_negative CHECK (
        minutiae_matched >= 0 AND
        minutiae_query >= 0 AND
        minutiae_template >= 0
    ),
    CONSTRAINT chk_matched_consistency CHECK (
        minutiae_matched <= LEAST(minutiae_query, minutiae_template)
    )
);

CREATE INDEX idx_bio_verif_contract ON biometric_verifications(contract_id);
CREATE INDEX idx_bio_verif_owner ON biometric_verifications(owner_id);
CREATE INDEX idx_bio_verif_result ON biometric_verifications(result);
CREATE INDEX idx_bio_verif_created ON biometric_verifications(created_at DESC);
CREATE INDEX idx_bio_verif_failed ON biometric_verifications(owner_id, created_at DESC)
    WHERE result = 'NO_MATCH';
```

**Ahora podemos añadir la FK que faltaba en `contracts`:**

```sql
ALTER TABLE contracts
    ADD CONSTRAINT fk_contracts_biometric_verification
    FOREIGN KEY (biometric_verification_id)
    REFERENCES biometric_verifications(id)
    ON DELETE SET NULL;
```

**Notas:**
- `contract_id` es NULL-able: permite registrar intentos de validación que no terminaron asociados a un contrato (ej: pruebas, ataques).
- Las imágenes de query se guardan en filesystem; la BD solo guarda la ruta. Retención sugerida: 90 días para auditoría.
- El índice `idx_bio_verif_failed` permite detectar patrones sospechosos rápidamente.

### 4.10 `audit_log` — Log de auditoría general

Tabla transversal que registra eventos importantes del sistema más allá de la biometría.

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,           -- ej: "CONTRACT_CREATED"
    entity_type     VARCHAR(50) NOT NULL,            -- ej: "contract"
    entity_id       UUID NULL,
    severity        audit_severity NOT NULL DEFAULT 'INFO',
    details         JSONB NULL,                      -- Cambios, contexto adicional
    ip_address      INET NULL,
    user_agent      TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_severity ON audit_log(severity) WHERE severity IN ('WARNING', 'CRITICAL');
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

**Acciones típicas a registrar:**
- `USER_LOGIN_SUCCESS`, `USER_LOGIN_FAILED`
- `CONTRACT_CREATED`, `CONTRACT_UPDATED`, `CONTRACT_SIGNED`, `CONTRACT_TERMINATED`
- `BIOMETRIC_ENROLLED`, `BIOMETRIC_VERIFICATION_FAILED` (CRITICAL si hay múltiples fallos)
- `OWNER_REGISTERED`, `OWNER_UPDATED`
- `FUNDO_CREATED`

---

## 5. Triggers

### 5.1 Trigger de `updated_at`

Función reutilizable que actualiza `updated_at` en cada UPDATE.

```sql
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a cada tabla con updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_fundos_updated_at BEFORE UPDATE ON fundos
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_owners_updated_at BEFORE UPDATE ON owners
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_biometric_templates_updated_at BEFORE UPDATE ON biometric_templates
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_contract_parties_updated_at BEFORE UPDATE ON contract_parties
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_contract_clauses_updated_at BEFORE UPDATE ON contract_clauses
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
```

### 5.2 Trigger de transición de estado de contrato a EXPIRED

Se ejecuta en un job (no trigger), pero documentado aquí:

```sql
-- Job diario: marcar como EXPIRED contratos vencidos
UPDATE contracts
SET status = 'EXPIRED', updated_at = NOW()
WHERE status IN ('SIGNED', 'ACTIVE')
  AND end_date < CURRENT_DATE
  AND deleted_at IS NULL;
```

En FastAPI esto se ejecuta con un scheduler (APScheduler o un cron job externo llamando a un endpoint admin).

---

## 6. Vistas materializadas y consultas frecuentes

### 6.1 Vista: contratos próximos a vencer

```sql
CREATE VIEW v_expiring_contracts AS
SELECT
    c.id,
    c.fundo_id,
    c.code,
    c.title,
    c.end_date,
    (c.end_date - CURRENT_DATE) AS days_to_expire,
    c.amount,
    c.currency,
    ct.name AS contract_type_name,
    f.name AS fundo_name
FROM contracts c
JOIN contract_types ct ON ct.id = c.contract_type_id
JOIN fundos f ON f.id = c.fundo_id
WHERE c.status IN ('SIGNED', 'ACTIVE')
  AND c.deleted_at IS NULL
  AND c.end_date >= CURRENT_DATE
  AND (c.end_date - CURRENT_DATE) <= 30
ORDER BY c.end_date ASC;
```

### 6.2 Consulta: dashboard del fundo

```sql
-- Resumen ejecutivo para el dashboard
SELECT
    (SELECT COUNT(*) FROM contracts WHERE fundo_id = $1 AND status = 'DRAFT' AND deleted_at IS NULL) AS drafts,
    (SELECT COUNT(*) FROM contracts WHERE fundo_id = $1 AND status IN ('SIGNED', 'ACTIVE') AND deleted_at IS NULL) AS active,
    (SELECT COUNT(*) FROM contracts WHERE fundo_id = $1 AND status = 'EXPIRED' AND deleted_at IS NULL) AS expired,
    (SELECT COUNT(*) FROM v_expiring_contracts WHERE fundo_id = $1) AS expiring_soon,
    (SELECT COALESCE(SUM(amount), 0) FROM contracts WHERE fundo_id = $1 AND status IN ('SIGNED', 'ACTIVE') AND deleted_at IS NULL) AS active_amount;
```

### 6.3 Consulta: alertas de validaciones fallidas recientes

```sql
SELECT
    bv.id,
    bv.created_at,
    bv.score,
    bv.threshold_used,
    o.first_name || ' ' || o.last_name AS owner_name,
    f.name AS fundo_name,
    c.code AS contract_code,
    u.full_name AS initiated_by
FROM biometric_verifications bv
JOIN owners o ON o.id = bv.owner_id
JOIN fundos f ON f.id = o.fundo_id
LEFT JOIN contracts c ON c.id = bv.contract_id
JOIN users u ON u.id = bv.initiated_by_user
WHERE bv.result = 'NO_MATCH'
  AND bv.created_at >= NOW() - INTERVAL '7 days'
ORDER BY bv.created_at DESC;
```

---

## 7. Estrategia de cifrado (futuro)

Para producción, las plantillas biométricas deberían cifrarse en reposo. PostgreSQL ofrece `pgcrypto`:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Al guardar (la app pasa la clave por sesión, no se guarda en BD)
INSERT INTO biometric_templates (owner_id, finger, minutiae, ...)
VALUES (
    $1,
    $2,
    PGP_SYM_ENCRYPT($3::TEXT, $key)::JSONB,
    ...
);

-- Al recuperar
SELECT PGP_SYM_DECRYPT(minutiae::BYTEA, $key) AS minutiae_decrypted ...
```

**Esto NO se implementa en el MVP académico**, pero queda documentado como deuda técnica explícita.

---

## 8. Esquema de migraciones (Alembic)

Las migraciones se versionan en `apps/api/alembic/versions/`. Orden inicial:

1. `001_create_users.py` — Tabla `users` + ENUM `user_role`
2. `002_create_fundos_owners.py` — `fundos` y `owners`
3. `003_create_biometric_templates.py` — `biometric_templates`
4. `004_create_contract_types.py` — `contract_types` + seed inicial
5. `005_create_contracts.py` — `contracts` + ENUMs `contract_status`
6. `006_create_contract_parties.py` — `contract_parties` + ENUMs `party_type`, `party_role`
7. `007_create_contract_clauses.py` — `contract_clauses`
8. `008_create_biometric_verifications.py` — `biometric_verifications` + FK desde `contracts`
9. `009_create_audit_log.py` — `audit_log`
10. `010_create_views.py` — Vistas (`v_expiring_contracts`)
11. `011_create_triggers.py` — Triggers de `updated_at`

---

## 9. Estimación de volumetría

Para dimensionar correctamente y elegir índices:

| Tabla | Filas esperadas (1 año, 1 fundo) | Filas esperadas (5 años, 5 fundos) |
|---|---|---|
| `users` | 5-10 | 20-50 |
| `fundos` | 1 | 5 |
| `owners` | 1 | 5 |
| `biometric_templates` | 1-3 | 10-25 |
| `contract_types` | 8 (catálogo fijo) | 8-15 |
| `contracts` | 50-200 | 1,000-5,000 |
| `contract_parties` | 100-400 | 2,000-10,000 |
| `contract_clauses` | 300-1,500 | 5,000-25,000 |
| `biometric_verifications` | 100-500 | 5,000-30,000 |
| `audit_log` | 5,000-20,000 | 100,000-500,000 |

**Conclusión:** Los volúmenes son perfectamente manejables por PostgreSQL en un servidor modesto. Los índices definidos son suficientes para queries < 50ms en todas las consultas comunes.

---

## 10. Resumen de relaciones

```
users (1) ─────────── (N) contracts.created_by
                       (N) biometric_verifications.initiated_by_user
                       (N) audit_log.user_id

fundos (1) ────────── (1) owners
                       (N) contracts.fundo_id

owners (1) ────────── (1) biometric_templates [activa]
                       (N) biometric_verifications.owner_id
                       (N) contracts.signed_by_owner_id

biometric_templates (1) ─── (N) biometric_verifications.template_id

contracts (1) ─────── (N) contract_parties
                       (N) contract_clauses
                       (1) biometric_verifications.contract_id  [la firma]
                       (1) contracts.renewed_from_id [auto-referencia]

contract_types (1) ── (N) contracts.contract_type_id
```

El diagrama ER visual se documenta en el archivo `05-diagrama-bd.md`.
