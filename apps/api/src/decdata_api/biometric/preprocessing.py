"""Preprocesamiento de imágenes de huella digital.

Etapas:
1. Carga y conversión a grayscale
2. Normalización (resize, ajuste de intensidad/varianza)
3. Mejora con filtro Gabor para realzar crestas
"""

import numpy as np
import cv2


def load_image(image_bytes: bytes) -> np.ndarray:
    """Carga una imagen desde bytes y la convierte a grayscale."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("No se pudo decodificar la imagen. Formato inválido.")
    return img


def normalize_image(img: np.ndarray, target_size: tuple[int, int] = (400, 400)) -> np.ndarray:
    """Normaliza la imagen: resize y ajuste de intensidad.

    - Redimensiona a tamaño estándar manteniendo aspect ratio
    - Normaliza la media a 128 y la varianza a un valor estándar
    """
    # Resize manteniendo aspect ratio
    h, w = img.shape
    scale = min(target_size[0] / h, target_size[1] / w)
    new_h, new_w = int(h * scale), int(w * scale)
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    # Pad para llegar al target_size
    canvas = np.full(target_size, 255, dtype=np.uint8)
    y_offset = (target_size[0] - new_h) // 2
    x_offset = (target_size[1] - new_w) // 2
    canvas[y_offset : y_offset + new_h, x_offset : x_offset + new_w] = resized

    # Normalizar media y varianza
    mean = np.mean(canvas)
    std = np.std(canvas)
    if std > 0:
        normalized = ((canvas - mean) / std * 64 + 128).clip(0, 255).astype(np.uint8)
    else:
        normalized = canvas

    return normalized


def apply_gabor_filter(img: np.ndarray) -> np.ndarray:
    """Aplica un banco de filtros Gabor para realzar las crestas de la huella.

    Usa múltiples orientaciones para capturar crestas en todas las direcciones.
    """
    orientations = np.arange(0, np.pi, np.pi / 8)  # 8 orientaciones
    ksize = 31
    sigma = 4.0
    lambd = 10.0
    gamma = 0.5

    filtered = np.zeros_like(img, dtype=np.float64)

    for theta in orientations:
        kernel = cv2.getGaborKernel(
            (ksize, ksize), sigma, theta, lambd, gamma, psi=0, ktype=cv2.CV_64F
        )
        response = cv2.filter2D(img, cv2.CV_64F, kernel)
        filtered = np.maximum(filtered, response)

    # Normalizar a [0, 255]
    filtered = ((filtered - filtered.min()) / (filtered.max() - filtered.min() + 1e-8) * 255)
    return filtered.astype(np.uint8)
