"""Binarización de la imagen de huella.

Convierte la imagen mejorada a binaria: crestas → negro (0), valles → blanco (255).
"""

import numpy as np
import cv2


def binarize(img: np.ndarray) -> np.ndarray:
    """Binarización adaptativa de la huella.

    Usa adaptive threshold para manejar variaciones locales de iluminación.
    """
    # Aplicar Gaussian blur para reducir ruido
    blurred = cv2.GaussianBlur(img, (5, 5), 1.0)

    # Binarización adaptativa (crestas quedan en negro = 0)
    binary = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,  # Invertir: crestas en blanco para esqueletización
        blockSize=25,
        C=8,
    )

    # Limpieza morfológica
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)

    return binary
