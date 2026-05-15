---
title: Guía de Uso
description: Manual de usuario para operar el sistema DecData.
---

## Acceso al Sistema

### Inicio de Sesión

1. Navegar a `http://localhost:3000/login`
2. Ingresar las credenciales proporcionadas por el administrador
3. Al autenticarse correctamente, el sistema redirige automáticamente al **Dashboard**

:::note[Seguridad]
El sistema utiliza **JSON Web Tokens (JWT)** con expiración configurable. La sesión se persiste en `localStorage` a través de Zustand para mantener al usuario conectado entre recargas de página.
:::

## Módulos del Sistema

### 1. Dashboard Principal

Vista general del sistema con acceso rápido a todos los módulos desde el **menú lateral (Sidebar)**:

- 🏠 **Inicio** — Resumen general del sistema
- 👤 **Dueños** — Gestión de firmantes
- 🌾 **Fundos** — Administración de predios agrícolas
- 📄 **Contratos** — Gestión de documentos contractuales
- 🔐 **Biometría** — Escáner de huellas dactilares

### 2. Módulo de Dueños (Owners)

Permite gestionar los propietarios/firmantes de contratos agrícolas.

**Operaciones disponibles:**
- **Listar** — Visualización en tarjetas con datos del firmante
- **Crear** — Formulario modal con validación de campos (solo rol Admin)
- **Copiar ID** — Para uso en el módulo biométrico

**Campos del formulario:**

| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombres | Texto | ✅ |
| Apellidos | Texto | ✅ |
| Tipo Documento | Select (DNI/CE/Pasaporte) | ✅ |
| Número Documento | Texto | ✅ |
| Correo | Email | ✅ |
| Teléfono | Texto | ✅ |
| Fundo Asignado | Select (dinámico) | ✅ |

### 3. Módulo de Fundos

Gestión de predios agrícolas asociados al sistema.

**Datos visibles:**
- Nombre del fundo
- Ubicación (departamento, provincia, distrito)
- Área en hectáreas
- Estado activo/inactivo

### 4. Módulo de Contratos

Visualización y gestión de contratos agrícolas vinculados a fundos y dueños.

**Información mostrada:**
- Código de contrato
- Tipo de contrato
- Fechas de inicio y fin
- Estado (activo, finalizado, cancelado)
- Dueño y fundo asociado

### 5. Módulo de Biometría (Enrollment)

Interfaz de escaneo biométrico para registrar huellas dactilares.

**Flujo de uso:**
1. Ingresar el **ID del dueño** (copiado desde el módulo de Dueños)
2. Seleccionar el dedo a escanear desde el selector visual
3. Subir la imagen de huella dactilar (formato `.BMP`)
4. El sistema procesa la huella a través del pipeline biométrico
5. Se muestra el resultado: cantidad de minucias, score de calidad, y tiempo de procesamiento

:::caution[Formato de Imagen]
El escáner acepta exclusivamente imágenes en formato **BMP** (bitmap). Las imágenes deben ser de huella dactilar en escala de grises, idealmente de 96×96 píxeles como las del dataset SOCOFing.
:::

## Control de Acceso por Roles

| Funcionalidad | Admin | Viewer |
|--------------|-------|--------|
| Ver módulos | ✅ | ✅ |
| Crear registros | ✅ | ❌ |
| Escaneo biométrico | ✅ | ✅ |
| Acceder al dashboard | ✅ | ✅ |

## Cerrar Sesión

Hacer clic en el botón **"Cerrar Sesión"** ubicado en la parte inferior del menú lateral. El sistema limpia el token JWT del almacenamiento local y redirige al login.
