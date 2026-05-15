"""Extracción de minutiae desde la imagen esqueletizada.

Usa el análisis de vecindad crossing number (CN) para detectar:
- Terminaciones (CN = 1): punto donde una cresta termina
- Bifurcaciones (CN = 3): punto donde una cresta se divide en dos
"""

import numpy as np
import math

from decdata_api.biometric.types import Minutia, MinutiaType


def extract_minutiae(skeleton: np.ndarray) -> list[Minutia]:
    """Extrae minutiae de la imagen esqueletizada usando crossing number.

    El crossing number se calcula como la mitad de la suma de diferencias
    absolutas entre píxeles consecutivos en el vecindario 3x3:

        CN = 0.5 * Σ|P(i+1) - P(i)| para i = 1..8

    Donde P(1)..P(8) son los 8 vecinos en orden circular.

    CN = 1 → Terminación (ridge ending)
    CN = 3 → Bifurcación (ridge bifurcation)

    Args:
        skeleton: Imagen esqueletizada (0 y 255)

    Returns:
        Lista de minutiae detectadas
    """
    # Normalizar a 0/1
    skel = (skeleton > 0).astype(np.uint8)
    h, w = skel.shape
    minutiae = []

    # Orden circular de vecinos (8-connected): P1-P8
    # P8 P1 P2
    # P7  X P3
    # P6 P5 P4
    neighbors_offsets = [
        (-1, 0),   # P1 - arriba
        (-1, 1),   # P2 - arriba-derecha
        (0, 1),    # P3 - derecha
        (1, 1),    # P4 - abajo-derecha
        (1, 0),    # P5 - abajo
        (1, -1),   # P6 - abajo-izquierda
        (0, -1),   # P7 - izquierda
        (-1, -1),  # P8 - arriba-izquierda
    ]

    # Margen para evitar bordes
    margin = 15

    for y in range(margin, h - margin):
        for x in range(margin, w - margin):
            if skel[y, x] == 0:
                continue

            # Obtener valores de vecinos en orden circular
            neighbors = []
            for dy, dx in neighbors_offsets:
                neighbors.append(skel[y + dy, x + dx])

            # Calcular crossing number
            cn = 0
            for i in range(8):
                cn += abs(int(neighbors[(i + 1) % 8]) - int(neighbors[i]))
            cn = cn // 2

            minutia_type = None
            if cn == 1:
                minutia_type = MinutiaType.TERMINATION
            elif cn == 3:
                minutia_type = MinutiaType.BIFURCATION

            if minutia_type is not None:
                # Calcular orientación basada en la dirección de la cresta
                theta = _compute_orientation(skel, y, x)

                minutiae.append(
                    Minutia(
                        x=x,
                        y=y,
                        theta=theta,
                        type=minutia_type,
                        quality=1.0,
                    )
                )

    return minutiae


def _compute_orientation(skel: np.ndarray, y: int, x: int, window: int = 7) -> float:
    """Calcula la orientación local de la cresta en el punto (x, y).

    Usa el gradiente local del campo de orientación en una ventana alrededor
    del punto.
    """
    h, w = skel.shape
    half = window // 2

    y_min = max(0, y - half)
    y_max = min(h, y + half + 1)
    x_min = max(0, x - half)
    x_max = min(w, x + half + 1)

    patch = skel[y_min:y_max, x_min:x_max].astype(np.float64)

    if patch.size == 0:
        return 0.0

    # Gradientes
    gy, gx = np.gradient(patch)

    # Orientación promedio
    vx = np.sum(2 * gx * gy)
    vy = np.sum(gx**2 - gy**2)

    theta = 0.5 * math.atan2(vx, vy)

    # Normalizar a [0, 2π]
    if theta < 0:
        theta += math.pi

    return theta
