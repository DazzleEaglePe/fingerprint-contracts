---
title: Dataset SOCOFing
description: Información sobre el dataset de huellas dactilares utilizado para la evaluación.
---

## Descripción del Dataset

**SOCOFing** (Sokoto Coventry Fingerprint Dataset) es un dataset público de huellas dactilares ampliamente utilizado en investigación biométrica, creado por la Universidad de Sokoto (Nigeria) en colaboración con la Universidad de Coventry (Reino Unido).

### Estadísticas del Dataset

| Propiedad | Valor |
|-----------|-------|
| **Total de imágenes** | ~55,000+ |
| **Huellas reales** | 6,000 |
| **Huellas alteradas** | ~49,000+ |
| **Sujetos** | 600 personas |
| **Dedos por sujeto** | 10 (ambas manos) |
| **Formato** | BMP (Bitmap) |
| **Resolución** | 96×96 píxeles |
| **Escala** | Grises (8-bit) |

### Referencia Académica

```
Shehu, Y.I., Ruiz-Garcia, A., Palade, V. and James, A. (2018).
"Sokoto Coventry Fingerprint Dataset."
arXiv preprint arXiv:1807.10609.
```

## Estructura del Dataset

```
DATA/SOCOfing/SOCOFing/
├── Real/                          # Huellas originales sin alterar
│   ├── 100__M_Left_index_finger.BMP
│   ├── 100__M_Left_little_finger.BMP
│   ├── 100__M_Left_middle_finger.BMP
│   └── ... (6,000 imágenes)
│
└── Altered/                       # Huellas con deformaciones
    ├── Altered-Easy/              # Alteraciones leves
    ├── Altered-Medium/            # Alteraciones moderadas
    └── Altered-Hard/              # Alteraciones severas
        ├── 100__M_Left_index_finger_CR.BMP
        ├── 100__M_Left_index_finger_Obl.BMP
        ├── 100__M_Left_index_finger_Zcut.BMP
        └── ...
```

## Nomenclatura de Archivos

El formato del nombre sigue el patrón:

```
{ID}__{Género}_{Mano}_{Dedo}_{Alteración}.BMP
```

| Componente | Valores | Ejemplo |
|-----------|---------|---------|
| **ID** | 1-600 | `100` |
| **Género** | M (Masculino), F (Femenino) | `M` |
| **Mano** | Left, Right | `Left` |
| **Dedo** | index, middle, ring, little, thumb | `index_finger` |
| **Alteración** | CR, Obl, Zcut (solo en Altered) | `CR` |

## Tipos de Alteración

### Central Rotation (CR)
Rotación severa aplicada al centro de la huella. Simula una colocación incorrecta del dedo en el escáner.

### Obliteration (Obl)
Destrucción parcial de las crestas papilares. Simula desgaste por trabajo manual (común en trabajadores agrícolas).

### Z-Cut (Zcut)
Corte diagonal en forma de "Z" que atraviesa la huella. Simula cicatrices o lesiones en el dedo.

## Uso en Nuestro Sistema

Para la evaluación biométrica se utilizaron:

- **20 huellas reales** como plantillas maestras (templates)
- **~54 huellas alteradas genuinas** (mismo dedo, alterado) para medir FRR
- **200 huellas impostoras** (dedos de otros sujetos) para medir FAR

:::note[Nota]
Se usó la carpeta `Altered-Hard` intencionalmente para probar el sistema en el peor escenario posible. Con alteraciones leves o medianas, los resultados de FRR mejorarían significativamente.
:::

## Licencia

El dataset SOCOFing es de **uso libre para investigación académica** bajo los términos de su publicación original. No requiere licencia comercial para proyectos de tesis y publicaciones científicas.
