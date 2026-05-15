---
title: API REST (FastAPI)
description: Documentación de los endpoints de la API del sistema.
---

## Información General

| Propiedad | Valor |
|-----------|-------|
| **Framework** | FastAPI 0.115+ |
| **Python** | 3.12+ |
| **ORM** | SQLAlchemy 2.x (async) |
| **Auth** | JWT Bearer Token (bcrypt) |
| **Base URL** | `http://localhost:8000` |
| **Swagger UI** | `http://localhost:8000/docs` |

## Autenticación

Todos los endpoints (excepto `/api/auth/login`) requieren un header de autenticación:

```http
Authorization: Bearer <jwt_token>
```

### POST `/api/auth/login`

Inicia sesión y retorna un JWT.

**Request Body:**
```json
{
  "email": "admin@fundo.com",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin@fundo.com",
    "full_name": "Admin Principal",
    "role": "admin"
  }
}
```

## Endpoints de Owners (Dueños)

### GET `/api/owners/`
Lista todos los dueños activos. Permite filtrar por `fundo_id`.

**Query Params:** `?fundo_id=<uuid>` (opcional)

### GET `/api/owners/{owner_id}`
Obtiene un dueño por su UUID.

### POST `/api/owners/`
Crea un nuevo dueño. **Requiere rol Admin.**

**Request Body:**
```json
{
  "fundo_id": "uuid",
  "first_name": "Juan",
  "last_name": "Pérez",
  "document_type": "DNI",
  "document_number": "12345678",
  "email": "juan@email.com",
  "phone": "999888777"
}
```

## Endpoints de Fundos

### GET `/api/fundos/`
Lista todos los fundos registrados.

### GET `/api/fundos/{fundo_id}`
Obtiene un fundo por su UUID.

### POST `/api/fundos/`
Crea un nuevo fundo. **Requiere rol Admin.**

## Endpoints de Contratos

### GET `/api/contracts/`
Lista todos los contratos con relaciones a owner y fundo.

### GET `/api/contracts/{contract_id}`
Obtiene un contrato por su UUID.

### POST `/api/contracts/`
Crea un nuevo contrato. **Requiere rol Admin.**

## Endpoints Biométricos

### POST `/api/biometric/enroll`
Registra una huella dactilar para un dueño.

**Request:** `multipart/form-data`
- `owner_id`: UUID del dueño
- `finger`: Nombre del dedo (ej: "right_index")
- `file`: Imagen BMP de la huella

**Response 200:**
```json
{
  "minutiae_count": 120,
  "quality_score": 1.0,
  "processing_time_ms": 76,
  "message": "Huella registrada exitosamente"
}
```

### POST `/api/biometric/verify`
Verifica una huella contra la plantilla almacenada.

## Dependencias de Seguridad

| Función | Descripción |
|---------|-------------|
| `get_current_user` | Extrae y valida el JWT del header. Retorna el usuario actual. |
| `require_admin` | Extiende `get_current_user` y verifica que el rol sea `admin`. |

## Códigos de Error

| Código | Significado |
|--------|-------------|
| `401` | Token inválido, expirado o no proporcionado |
| `403` | Sin permisos (rol insuficiente) |
| `404` | Recurso no encontrado |
| `400` | Validación de datos fallida |
| `500` | Error interno del servidor |
