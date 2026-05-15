---
title: Frontend (Next.js)
description: Documentación técnica del frontend del sistema DecData.
---

## Stack del Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Next.js** | 15 (App Router) | Framework React con SSR |
| **React** | 19 | Librería de UI |
| **Tailwind CSS** | v4 | Estilos utilitarios |
| **Shadcn/UI** | Latest | Componentes base (Radix) |
| **TanStack Query** | v5 | Estado del servidor (cache, refetch) |
| **Zustand** | v5 | Estado global (auth) |
| **Axios** | Latest | Cliente HTTP |
| **Sonner** | Latest | Notificaciones toast |
| **Lucide React** | Latest | Iconografía |

## Estructura de Carpetas

```
apps/web/src/
├── app/                        # App Router (Next.js 15)
│   ├── layout.tsx              # Layout raíz (fuente Google Sans)
│   ├── page.tsx                # Redirect → /login
│   ├── globals.css             # Variables Tailwind + tema
│   ├── login/
│   │   └── page.tsx            # Pantalla de login
│   └── dashboard/
│       ├── layout.tsx          # Guard de autenticación + Sidebar
│       ├── page.tsx            # Dashboard principal
│       ├── owners/page.tsx     # CRUD de dueños
│       ├── fundos/page.tsx     # Listado de fundos
│       ├── contracts/page.tsx  # Listado de contratos
│       └── enrollment/page.tsx # Escáner biométrico
├── components/
│   ├── Sidebar.tsx             # Menú lateral con navegación
│   └── ui/                     # Componentes Shadcn/UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── badge.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       └── sonner.tsx
├── fonts/                      # Google Sans (variable font local)
├── lib/
│   └── api.ts                  # Axios instance + interceptor JWT
└── store/
    └── authStore.ts            # Zustand store de autenticación
```

## Sistema de Autenticación

### Flujo de Login

```
[Login Page] → POST /api/auth/login → JWT Token
     ↓
[Zustand Store] → localStorage('token') + localStorage('auth-storage')
     ↓
[Axios Interceptor] → Authorization: Bearer <token> (en cada request)
     ↓
[Dashboard Layout Guard] → isAuthenticated ? render : redirect('/login')
```

### Interceptor de Axios (`lib/api.ts`)

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Guard de Rutas (`dashboard/layout.tsx`)

El layout del dashboard actúa como un **Auth Guard**:
1. Espera a que Zustand se hidrate en el cliente (`mounted` state)
2. Verifica `isAuthenticated` del store
3. Si no está autenticado → `router.push('/login')`
4. Mientras verifica → muestra spinner de "Verificando sesión..."

### Control por Roles

Los componentes verifican el rol del usuario antes de renderizar acciones administrativas:

```tsx
const { user } = useAuthStore();

{user?.role === 'admin' && (
  <Button>Crear Registro</Button>
)}
```

## Tipografía

Se utiliza **Google Sans** como fuente principal, cargada localmente mediante `next/font/local` para máximo rendimiento:

```typescript
const googleSans = localFont({
  src: './fonts/GoogleSans-Regular.woff2',
  variable: '--font-sans',
});
```

## Componentes Shadcn/UI Instalados

| Componente | Uso Principal |
|-----------|--------------|
| `Button` | Acciones primarias y secundarias |
| `Card` | Contenedores de información |
| `Dialog` | Modales de creación/edición |
| `Input` | Campos de formulario |
| `Label` | Etiquetas de formulario |
| `Badge` | Indicadores de estado |
| `Skeleton` | Placeholders de carga |
| `Table` | Listados tabulares |
| `Sonner` | Notificaciones toast |
| `Alert` | Mensajes informativos |
