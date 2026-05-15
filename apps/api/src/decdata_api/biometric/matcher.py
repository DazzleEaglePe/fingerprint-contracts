"""Matcher de minutiae [IMPLEMENTACIÓN PROPIA].

Compara dos conjuntos de minutiae para determinar si pertenecen a la misma huella.

Algoritmo:
1. Alineación: Para cada par de minutiae ancla, calcula la transformación
   (rotación + traslación) que las alinea.
2. Matching: Cuenta cuántas minutiae coinciden bajo la transformación.
3. Score: Calcula la similitud como fracción de minutiae coincidentes.
"""

import math

from decdata_api.biometric.types import Minutia


def match_minutiae(
    query: list[Minutia],
    template: list[Minutia],
    distance_threshold: float = 15.0,
    angle_threshold: float = math.radians(15),
) -> dict:
    """Matching de minutiae entre una huella query y una plantilla template.

    Prueba múltiples pares de minutiae ancla para encontrar la mejor alineación.

    Args:
        query: Minutiae extraídas de la huella a verificar
        template: Minutiae de la plantilla maestra
        distance_threshold: Radio de tolerancia espacial (píxeles)
        angle_threshold: Tolerancia angular (radianes)

    Returns:
        Dict con score, matched, query_count, template_count
    """
    if not query or not template:
        return {
            "score": 0.0,
            "matched": 0,
            "query_count": len(query),
            "template_count": len(template),
        }

    best_matched = 0
    best_score = 0.0

    # Probar diferentes pares de minutiae ancla para alineación
    # Limitar iteraciones para rendimiento
    max_anchors_q = min(len(query), 15)
    max_anchors_t = min(len(template), 15)

    for i in range(max_anchors_q):
        for j in range(max_anchors_t):
            # Solo alinear minutiae del mismo tipo
            if query[i].type != template[j].type:
                continue

            # Calcular transformación para alinear query[i] con template[j]
            dx = template[j].x - query[i].x
            dy = template[j].y - query[i].y
            d_theta = template[j].theta - query[i].theta

            # Aplicar transformación y contar coincidencias
            matched = _count_matches(
                query, template, dx, dy, d_theta, distance_threshold, angle_threshold
            )

            if matched > best_matched:
                best_matched = matched
                best_score = _compute_score(matched, len(query), len(template))

    return {
        "score": round(best_score, 4),
        "matched": best_matched,
        "query_count": len(query),
        "template_count": len(template),
    }


def _count_matches(
    query: list[Minutia],
    template: list[Minutia],
    dx: float,
    dy: float,
    d_theta: float,
    dist_thresh: float,
    angle_thresh: float,
) -> int:
    """Cuenta cuántas minutiae coinciden bajo una transformación dada.

    Para cada minutia de query (transformada), busca si hay una coincidencia
    en template que cumpla:
    - Distancia espacial < dist_thresh
    - Diferencia angular < angle_thresh
    - Mismo tipo de minutia
    """
    matched = 0
    used_template = set()

    for qm in query:
        # Aplicar transformación
        tx = qm.x + dx
        ty = qm.y + dy
        t_theta = _normalize_angle(qm.theta + d_theta)

        best_dist = float("inf")
        best_idx = -1

        for k, tm in enumerate(template):
            if k in used_template:
                continue

            # Verificar tipo
            if qm.type != tm.type:
                continue

            # Distancia espacial
            dist = math.sqrt((tx - tm.x) ** 2 + (ty - tm.y) ** 2)
            if dist > dist_thresh:
                continue

            # Distancia angular
            angle_diff = abs(_normalize_angle(t_theta - tm.theta))
            if angle_diff > angle_thresh:
                continue

            if dist < best_dist:
                best_dist = dist
                best_idx = k

        if best_idx >= 0:
            matched += 1
            used_template.add(best_idx)

    return matched


def _compute_score(matched: int, query_count: int, template_count: int) -> float:
    """Calcula el score de similitud.

    Formula: score = (2 * matched) / (query_count + template_count)
    Rango: [0, 1]
    """
    total = query_count + template_count
    if total == 0:
        return 0.0
    return (2.0 * matched) / total


def _normalize_angle(angle: float) -> float:
    """Normaliza un ángulo al rango [0, π]."""
    angle = angle % math.pi
    if angle < 0:
        angle += math.pi
    return angle
