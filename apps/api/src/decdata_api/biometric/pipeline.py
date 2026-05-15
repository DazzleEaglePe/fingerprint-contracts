"""Pipeline biométrico completo.

Orquesta todas las etapas del procesamiento de huellas digitales:
1. Carga y preprocesamiento de imagen
2. Binarización adaptativa
3. Esqueletización
4. Extracción de minutiae
5. Filtrado de espurias
6. Matching contra plantilla maestra
"""

from decdata_api.biometric.preprocessing import load_image, normalize_image, apply_gabor_filter
from decdata_api.biometric.binarization import binarize
from decdata_api.biometric.skeletonization import skeletonize_image
from decdata_api.biometric.minutiae_extractor import extract_minutiae
from decdata_api.biometric.minutiae_filter import filter_spurious_minutiae
from decdata_api.biometric.matcher import match_minutiae
from decdata_api.biometric.types import Minutia


class BiometricPipeline:
    """Orquestador del pipeline biométrico completo."""

    def extract_template(self, image_bytes: bytes) -> dict:
        """Procesa una imagen de huella y extrae su plantilla de minutiae.

        Pipeline:
        1. Carga (bytes → NumPy array grayscale)
        2. Normalización (resize + ajuste intensidad)
        3. Filtro Gabor (realzar crestas)
        4. Binarización adaptativa (crestas → negro)
        5. Esqueletización (crestas a 1 píxel)
        6. Extracción de minutiae (crossing number)
        7. Filtrado de espurias

        Returns:
            Dict con minutiae (lista de dicts), minutiae_count, quality_score
        """
        # 1. Carga
        img = load_image(image_bytes)
        original_shape = img.shape

        # 2. Normalización
        normalized = normalize_image(img)

        # 3. Filtro Gabor
        enhanced = apply_gabor_filter(normalized)

        # 4. Binarización
        binary = binarize(enhanced)

        # 5. Esqueletización
        skeleton = skeletonize_image(binary)

        # 6. Extracción de minutiae
        raw_minutiae = extract_minutiae(skeleton)

        # 7. Filtrado de espurias
        filtered_minutiae = filter_spurious_minutiae(
            raw_minutiae, skeleton.shape
        )

        # Calcular quality score basado en la cantidad de minutiae
        quality_score = min(1.0, len(filtered_minutiae) / 40.0)

        return {
            "minutiae": [m.to_dict() for m in filtered_minutiae],
            "minutiae_count": len(filtered_minutiae),
            "quality_score": round(quality_score, 4),
            "raw_minutiae_count": len(raw_minutiae),
        }

    def match(self, query_minutiae: list[dict], template_minutiae: list[dict]) -> dict:
        """Compara minutiae de una huella query contra una plantilla maestra.

        Args:
            query_minutiae: Lista de dicts con minutiae de la huella a verificar
            template_minutiae: Lista de dicts con minutiae de la plantilla maestra

        Returns:
            Dict con score, matched, query_count, template_count
        """
        query = [Minutia.from_dict(m) for m in query_minutiae]
        template = [Minutia.from_dict(m) for m in template_minutiae]

        return match_minutiae(query, template)
