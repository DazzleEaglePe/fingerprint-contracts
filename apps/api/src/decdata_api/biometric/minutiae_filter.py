"""Filtrado de minutiae espurias [IMPLEMENTACIÓN PROPIA].

Elimina minutiae que son artefactos del procesamiento, no características reales:
1. Minutiae en los bordes de la imagen
2. Minutiae demasiado cercanas entre sí (clusters)
3. Minutiae aisladas (sin otras cercanas — probablemente ruido)
"""

import math

from decdata_api.biometric.types import Minutia


def filter_spurious_minutiae(
    minutiae: list[Minutia],
    image_shape: tuple[int, int],
    min_distance: int = 10,
    border_margin: int = 20,
    max_minutiae: int = 120,
) -> list[Minutia]:
    """Filtra minutiae espurias aplicando tres reglas.

    Args:
        minutiae: Lista de minutiae sin filtrar
        image_shape: (height, width) de la imagen
        min_distance: Distancia mínima entre minutiae (píxeles)
        border_margin: Margen desde los bordes a excluir
        max_minutiae: Máximo de minutiae a retener

    Returns:
        Lista filtrada de minutiae
    """
    h, w = image_shape

    # Paso 1: Eliminar minutiae en bordes
    filtered = [
        m
        for m in minutiae
        if border_margin < m.x < w - border_margin and border_margin < m.y < h - border_margin
    ]

    # Paso 2: Eliminar clusters (minutiae demasiado cercanas)
    filtered = _remove_close_minutiae(filtered, min_distance)

    # Paso 3: Ordenar por calidad y limitar cantidad
    filtered.sort(key=lambda m: m.quality, reverse=True)
    if len(filtered) > max_minutiae:
        filtered = filtered[:max_minutiae]

    return filtered


def _remove_close_minutiae(minutiae: list[Minutia], min_distance: int) -> list[Minutia]:
    """Elimina minutiae que están demasiado cerca entre sí.

    Mantiene la de mayor calidad en cada cluster.
    """
    if not minutiae:
        return []

    # Ordenar por calidad descendente
    sorted_minutiae = sorted(minutiae, key=lambda m: m.quality, reverse=True)
    kept = []
    removed_indices = set()

    for i, m1 in enumerate(sorted_minutiae):
        if i in removed_indices:
            continue

        kept.append(m1)

        # Marcar las cercanas como removidas
        for j in range(i + 1, len(sorted_minutiae)):
            if j in removed_indices:
                continue
            m2 = sorted_minutiae[j]
            dist = math.sqrt((m1.x - m2.x) ** 2 + (m1.y - m2.y) ** 2)
            if dist < min_distance:
                removed_indices.add(j)

    return kept
