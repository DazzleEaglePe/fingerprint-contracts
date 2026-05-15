"""Esqueletización de la imagen binarizada.

Reduce las crestas a un grosor de 1 píxel usando el algoritmo Zhang-Suen
implementado en scikit-image.
"""

import numpy as np
from skimage.morphology import skeletonize


def skeletonize_image(binary: np.ndarray) -> np.ndarray:
    """Esqueletiza la imagen binarizada.

    Las crestas (valor 255) se reducen a 1 píxel de grosor.

    Args:
        binary: Imagen binarizada con crestas en blanco (255)

    Returns:
        Imagen esqueletizada (0 y 255)
    """
    # scikit-image espera booleanos
    bool_img = binary > 0
    skeleton = skeletonize(bool_img)
    # Convertir de vuelta a uint8
    return (skeleton.astype(np.uint8)) * 255
