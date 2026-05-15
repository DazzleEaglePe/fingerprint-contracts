---
title: Motor Biométrico
description: Documentación técnica del pipeline de procesamiento de huellas dactilares.
---

## Descripción General

El motor biométrico es un **pipeline secuencial de 7 etapas** implementado en Python puro con OpenCV y NumPy. Procesa una imagen de huella dactilar en formato BMP y extrae un conjunto de **puntos característicos (minucias)** que sirven como plantilla biométrica única de cada individuo.

## Pipeline de Procesamiento

```
Imagen BMP → [1] Carga → [2] Normalización → [3] Gabor → [4] Binarización
                                                              ↓
Template ← [7] Filtrado ← [6] Extracción ← [5] Esqueletización
```

### Etapa 1: Carga de Imagen

**Módulo:** `preprocessing.py → load_image()`

Convierte los bytes de la imagen BMP a un array NumPy en escala de grises usando `cv2.imdecode()`.

### Etapa 2: Normalización

**Módulo:** `preprocessing.py → normalize_image()`

- Redimensiona la imagen a un tamaño estándar (96×96 px)
- Ajusta la intensidad de los píxeles a un rango uniforme [0, 255]
- Esto garantiza que el algoritmo funcione sin importar la resolución del escáner original

### Etapa 3: Filtro de Gabor

**Módulo:** `preprocessing.py → apply_gabor_filter()`

Aplica un **banco de filtros de Gabor** en múltiples orientaciones para realzar las crestas de la huella dactilar. Los filtros de Gabor son ideales porque responden selectivamente a frecuencias y orientaciones específicas, que es exactamente lo que define las crestas papilares.

**Parámetros configurados:**
- Orientaciones: 0°, 45°, 90°, 135°
- Frecuencia: adaptativa según la imagen
- Sigma: calculado automáticamente

### Etapa 4: Binarización Adaptativa

**Módulo:** `binarization.py → binarize()`

Convierte la imagen de escala de grises a **blanco y negro puro** (binaria), donde:
- **Negro (0)** = Crestas (ridges)
- **Blanco (255)** = Valles (valleys)

Se usa binarización adaptativa (método Otsu) para manejar variaciones de iluminación.

### Etapa 5: Esqueletización (Zhang-Suen)

**Módulo:** `skeletonization.py → skeletonize_image()`

Aplica el **algoritmo de Zhang-Suen** para reducir las crestas a líneas de exactamente **1 píxel de ancho**. Este es un algoritmo de adelgazamiento iterativo que preserva la topología de las crestas.

**Pseudocódigo del algoritmo:**
```
repetir:
    para cada píxel negro P en la imagen:
        si P cumple las condiciones de Sub-iteración 1:
            marcar P para eliminar
    eliminar pixeles marcados

    para cada píxel negro P en la imagen:
        si P cumple las condiciones de Sub-iteración 2:
            marcar P para eliminar
    eliminar pixeles marcados
hasta que no se eliminen más píxeles
```

### Etapa 6: Extracción de Minucias (Crossing Number)

**Módulo:** `minutiae_extractor.py → extract_minutiae()`

Recorre cada píxel del esqueleto y calcula el **Crossing Number (CN)** analizando los 8 vecinos:

```
CN(P) = (1/2) × Σ |Pi - Pi+1|   para i = 1 hasta 8
```

Donde P9 = P1 (vecindario circular).

**Clasificación:**

| CN | Tipo de Minucia |
|----|----------------|
| 1 | **Terminación** (Ridge Ending) |
| 3 | **Bifurcación** (Ridge Bifurcation) |

### Etapa 7: Filtrado de Espurias

**Módulo:** `minutiae_filter.py → filter_spurious_minutiae()`

Elimina minucias falsas causadas por ruido o artefactos del esqueletizado:
- Minucias demasiado cerca del borde de la imagen
- Minucias con vecinos demasiado próximos (< 10px)
- Clusters densos que indican ruido

## Matching (Comparación)

**Módulo:** `matcher.py → match_minutiae()`

Compara dos conjuntos de minucias calculando la **distancia euclidiana** entre puntos candidatos y aplicando un umbral de tolerancia espacial:

```python
distancia = sqrt((x1-x2)² + (y1-y2)²)
match = distancia < TOLERANCE and tipo1 == tipo2
```

El score final es la proporción de minucias que encontraron correspondencia.

## Estructura de una Minucia

```python
@dataclass
class Minutia:
    x: int          # Coordenada X
    y: int          # Coordenada Y
    type: str       # 'termination' | 'bifurcation'
    angle: float    # Ángulo de orientación (radianes)
```

## Rendimiento Medido

| Métrica | Valor |
|---------|-------|
| Tiempo promedio por huella | **76 ms** |
| Minucias extraídas promedio | **120 puntos** |
| Imágenes procesadas/segundo | **~13** |
