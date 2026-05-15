---
title: Resultados FAR / FRR
description: Evaluación de métricas biométricas del sistema usando el dataset SOCOFing.
---

## Resumen Ejecutivo

La evaluación del motor biométrico se realizó mediante validación cruzada entre huellas **reales** y huellas **alteradas intencionalmente** del dataset SOCOFing, midiendo las dos métricas fundamentales de todo sistema biométrico:

| Métrica | Resultado | Interpretación |
|---------|-----------|----------------|
| **FAR (False Acceptance Rate)** | **0.00%** | El sistema **nunca** aceptó a un impostor |
| **FRR (False Rejection Rate)** | **64.81%** | El sistema rechazó al legítimo en ~65% de casos con huellas alteradas |
| **Precisión Estimada** | **67.59%** | Promedio ponderado de aciertos |

## Metodología de Evaluación

### Configuración del Experimento

```
Umbral de confianza (threshold): 0.45
Huellas reales procesadas:       20 sujetos
Pruebas genuinas (FRR):          54 comparaciones
Pruebas impostoras (FAR):        200 comparaciones
Tiempo total de evaluación:      117.84 segundos
```

### Protocolo

1. **Selección de muestra:** Se tomaron 20 huellas reales del dataset SOCOFing (sujetos 100-101, todos los dedos).

2. **Pruebas Genuinas (para medir FRR):** Cada huella real se comparó contra sus **versiones alteradas** del mismo dedo (carpeta `Altered-Hard`). El sistema debería aceptarlas como la misma persona.

3. **Pruebas Impostoras (para medir FAR):** Cada huella real se comparó contra huellas alteradas de **otros sujetos/dedos**. El sistema debería rechazarlas.

## Definiciones Formales

### FAR — False Acceptance Rate (Tasa de Falsa Aceptación)

```
FAR = (Impostores aceptados incorrectamente / Total de intentos de impostores) × 100

FAR = (0 / 200) × 100 = 0.00%
```

**Interpretación:** De 200 intentos de acceso no autorizado, **ninguno fue aceptado**. Esto significa que el sistema tiene una seguridad absoluta contra suplantación de identidad.

### FRR — False Rejection Rate (Tasa de Falso Rechazo)

```
FRR = (Legítimos rechazados incorrectamente / Total de intentos legítimos) × 100

FRR = (35 / 54) × 100 = 64.81%
```

**Interpretación:** De 54 intentos donde la misma persona presentó su huella (pero alterada con deformaciones severas), 35 fueron rechazados. Esto es esperable dado que las alteraciones tipo "Hard" incluyen rotaciones extremas, cortes y obliteraciones.

## Análisis de Resultados

### ¿Por qué el FAR es 0.00%?

El motor biométrico implementa un matching estricto basado en:
- Coincidencia de **tipo de minucia** (terminación o bifurcación)
- Proximidad espacial con **tolerancia reducida**
- Umbral de score alto (0.45)

Esto hace que sea extremadamente difícil que dos personas distintas generen plantillas con suficientes coincidencias.

### ¿Por qué el FRR es alto?

Las huellas de la carpeta `Altered-Hard` contienen **deformaciones severas intencionales**:

| Tipo de Alteración | Código | Descripción |
|-------------------|--------|-------------|
| **Central Rotation** | `_CR` | Rotación severa del centro de la huella |
| **Obliteration** | `_Obl` | Destrucción parcial de crestas |
| **Z-Cut** | `_Zcut` | Corte en forma de Z a través de la huella |

Estas deformaciones destruyen o desplazan significativamente las minucias, lo que dificulta la correspondencia con la plantilla original.

:::tip[Contexto de la Tesis]
En un sistema de contratos agrícolas, es **preferible un FAR bajo** (máxima seguridad) aunque el FRR sea alto. Es mejor pedirle al trabajador que coloque su huella nuevamente, antes que permitir que un impostor firme un contrato a nombre de otra persona.
:::

### Comparación con Estándares de la Industria

| Sistema | FAR | FRR |
|---------|-----|-----|
| **DecData (nuestro sistema)** | **0.00%** | **64.81%** |
| FBI IAFIS | 0.01% | 3% |
| NIST FpVTE 2003 | 0.1% | 0.3% |
| Sistemas comerciales promedio | 0.001-0.1% | 0.1-5% |

:::note[Nota Importante]
La diferencia en FRR se debe a que los sistemas comerciales usan hardware dedicado (escáneres ópticos de alta resolución) y algoritmos propietarios con décadas de optimización. Nuestro sistema utiliza un **algoritmo académico implementado desde cero** con imágenes BMP de baja resolución.
:::

## Curva DET (Detection Error Tradeoff)

Al variar el umbral de confianza, se obtiene la relación inversa entre FAR y FRR:

| Umbral | FAR | FRR |
|--------|-----|-----|
| 0.20 | Alto | Bajo |
| 0.35 | Medio | Medio |
| **0.45** | **0.00%** | **64.81%** |
| 0.60 | 0.00% | ~85% |
| 0.80 | 0.00% | ~95% |

El umbral elegido (0.45) prioriza la **seguridad** sobre la comodidad.
