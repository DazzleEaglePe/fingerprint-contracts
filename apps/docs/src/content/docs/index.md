---
title: DecData — Sistema de Gestión de Contratos Agrícolas
description: Documentación técnica del sistema de contratos con validación biométrica por huella dactilar.
hero:
  tagline: Sistema Full-Stack para la gestión de contratos agrícolas con validación biométrica por huella dactilar, basado en el algoritmo de Zhang-Suen y extracción de minucias (Crossing Number).
  actions:
    - text: Manual de Usuario
      link: /manual/instalacion/
      icon: right-arrow
    - text: Arquitectura del Sistema
      link: /arquitectura/general/
      variant: minimal
---

## 📋 Resumen del Proyecto

Este sistema fue desarrollado como proyecto de tesis para la gestión integral de contratos agrícolas en fundos rurales del Perú, incorporando **autenticación biométrica por huella dactilar** como mecanismo de validación de identidad de los firmantes.

### Componentes Principales

- 🖥️ **Backend (FastAPI)** — API REST en Python con SQLAlchemy, autenticación JWT, CRUD de entidades y motor biométrico propio.
- 💻 **Frontend (Next.js 15)** — Interfaz moderna con Tailwind CSS v4, Shadcn/UI, TanStack Query y tipografía Google Sans.
- 🔐 **Motor Biométrico** — Pipeline completo: Preprocessing → Gabor → Binarización → Zhang-Suen → Crossing Number → Matching.
- 📊 **Evaluación (SOCOFing)** — Evaluación con 6,000 huellas reales y 55,000+ alteradas. FAR: 0.00% | Precisión: 67.59%.

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Backend** | Python + FastAPI + SQLAlchemy | 3.12+ |
| **Frontend** | Next.js + React + Tailwind CSS | 15 / 19 / 4 |
| **Base de Datos** | PostgreSQL (Supabase) | 15 |
| **Documentación** | Astro Starlight | 4.x |
| **Biometría** | OpenCV + NumPy + SciPy | Custom |
