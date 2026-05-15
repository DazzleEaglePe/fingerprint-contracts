---
title: Arquitectura General
description: Visión global de la arquitectura del sistema DecData.
---

## Diagrama de Arquitectura

El sistema sigue una **arquitectura de tres capas (3-Tier)** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────┐
│                   CLIENTE                        │
│   Next.js 15 (React 19 + Tailwind CSS v4)       │
│   ┌─────────┐ ┌──────────┐ ┌────────────────┐  │
│   │ Zustand  │ │ TanStack │ │  Shadcn/UI     │  │
│   │ (Auth)   │ │ (Query)  │ │  (Componentes) │  │
│   └─────────┘ └──────────┘ └────────────────┘  │
│           ↕ Axios (HTTP + JWT Bearer)            │
├─────────────────────────────────────────────────┤
│                   SERVIDOR                       │
│   FastAPI (Python 3.12+)                         │
│   ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│   │ Routers  │ │ Auth JWT │ │  Motor         │ │
│   │ (CRUD)   │ │ (bcrypt) │ │  Biométrico    │ │
│   └──────────┘ └──────────┘ └────────────────┘ │
│           ↕ SQLAlchemy Async                     │
├─────────────────────────────────────────────────┤
│               BASE DE DATOS                      │
│   PostgreSQL 15 (Supabase)                       │
│   ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│   │ users    │ │ owners   │ │ contracts      │ │
│   │ fundos   │ │ templates│ │ biometric_logs │ │
│   └──────────┘ └──────────┘ └────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Estructura del Monorepo

```
software-project/
├── apps/
│   ├── api/                  # Backend FastAPI
│   │   ├── src/
│   │   │   └── decdata_api/
│   │   │       ├── biometric/    # Motor biométrico
│   │   │       ├── core/         # Config, deps, seguridad
│   │   │       ├── models/       # Modelos SQLAlchemy
│   │   │       ├── routers/      # Endpoints REST
│   │   │       ├── schemas/      # Schemas Pydantic
│   │   │       └── main.py       # Entry point
│   │   └── scripts/              # Seeds y evaluación
│   ├── web/                  # Frontend Next.js
│   │   └── src/
│   │       ├── app/              # App Router (páginas)
│   │       ├── components/       # Componentes UI
│   │       ├── lib/              # Axios interceptor
│   │       └── store/            # Zustand (estado global)
│   └── docs/                 # Documentación Starlight
│       └── src/content/docs/     # Páginas MDX
└── DATA/
    └── SOCOfing/             # Dataset de huellas
```

## Flujo de Datos Principal

1. **Autenticación**: El usuario ingresa credenciales → Frontend envía `POST /api/auth/login` → Backend valida con bcrypt y retorna JWT → Zustand almacena el token.

2. **Consultas Protegidas**: Cada petición del frontend incluye `Authorization: Bearer <JWT>` → El middleware de FastAPI (`get_current_user`) decodifica y valida el token → Si es válido, permite el acceso al recurso.

3. **Operación Biométrica**: El usuario sube una imagen BMP → Frontend envía `POST /api/biometric/enroll` con el archivo → El pipeline biométrico procesa la huella y extrae minucias → Se almacena la plantilla en la base de datos.

## Patrones de Diseño Aplicados

| Patrón | Dónde se usa | Beneficio |
|--------|-------------|-----------|
| **Repository** | SQLAlchemy Models | Abstrae el acceso a datos |
| **Pipeline** | BiometricPipeline | Cadena de responsabilidad para procesamiento |
| **Observer** | TanStack Query | Reactividad automática ante cambios |
| **Singleton** | Zustand Store | Estado global único de autenticación |
| **Guard** | Dashboard Layout | Protección de rutas por sesión |
| **RBAC** | require_admin | Control de acceso por roles |
