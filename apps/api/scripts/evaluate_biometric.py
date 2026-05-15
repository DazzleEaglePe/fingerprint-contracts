"""Script de evaluación del motor biométrico para calcular FAR y FRR."""

import os
import sys
import glob
import time
import re
from typing import List

# Agregar src al sys.path para imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from decdata_api.biometric.pipeline import BiometricPipeline

def get_fingerprint_id(filename: str) -> str:
    """Extrae el identificador único del dedo (ej: '100__M_Left_index_finger')."""
    # Eliminar extensión y sufijos de alteración (_CR, _Obl, _Zcut)
    base = filename.replace('.BMP', '')
    base = re.sub(r'_(CR|Obl|Zcut)$', '', base)
    return base

def evaluate():
    pipeline = BiometricPipeline()
    MATCH_THRESHOLD = 0.45  # Nuestro umbral de confianza
    
    # Ruta al dataset extraído
    dataset_base = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../DATA/SOCOfing/SOCOFing'))
    real_path = os.path.join(dataset_base, 'Real')
    altered_path = os.path.join(dataset_base, 'Altered/Altered-Hard')
    
    if not os.path.exists(real_path) or not os.path.exists(altered_path):
        print(f"❌ Directorios SOCOFing no encontrados en: {dataset_base}")
        return

    print("🚀 Iniciando Evaluación Biométrica (Cálculo de FAR y FRR)...")
    
    # Tomar 20 imágenes reales como muestra (puedes aumentar esto para tu tesis)
    real_images = glob.glob(os.path.join(real_path, "*.BMP"))[:20]
    altered_images = glob.glob(os.path.join(altered_path, "*.BMP"))
    
    print(f"Procesando {len(real_images)} huellas reales contra el dataset Altered-Hard...\n")
    
    genuine_attempts = 0
    false_rejections = 0  # FRR: Huella correcta rechazada
    
    imposter_attempts = 0
    false_acceptances = 0 # FAR: Huella incorrecta aceptada
    
    start_total = time.time()
    
    for i, real_img_path in enumerate(real_images):
        real_filename = os.path.basename(real_img_path)
        real_id = get_fingerprint_id(real_filename)
        
        with open(real_img_path, 'rb') as f:
            real_bytes = f.read()
            
        print(f"[{i+1}/{len(real_images)}] Cruzando sujeto {real_id}...")
        
        # Seleccionar 5 alteradas que sean del mismo dedo (Genuinas)
        genuine_matches = [img for img in altered_images if get_fingerprint_id(os.path.basename(img)) == real_id][:5]
        
        # Seleccionar 10 alteradas que sean de OTROS dedos (Impostoras)
        imposter_matches = [img for img in altered_images if get_fingerprint_id(os.path.basename(img)) != real_id][:10]
        
        # Extraer minutiae reales una vez
        real_template = pipeline.extract_template(real_bytes)['minutiae']
        
        # Prueba Genuina (FRR)
        for gen_img in genuine_matches:
            with open(gen_img, 'rb') as f:
                gen_bytes = f.read()
            gen_template = pipeline.extract_template(gen_bytes)['minutiae']
            res = pipeline.match(gen_template, real_template)
            genuine_attempts += 1
            if res['score'] < MATCH_THRESHOLD:
                false_rejections += 1
                
        # Prueba Impostora (FAR)
        for imp_img in imposter_matches:
            with open(imp_img, 'rb') as f:
                imp_bytes = f.read()
            imp_template = pipeline.extract_template(imp_bytes)['minutiae']
            res = pipeline.match(imp_template, real_template)
            imposter_attempts += 1
            if res['score'] >= MATCH_THRESHOLD:
                false_acceptances += 1

    elapsed_total = time.time() - start_total
    
    # Cálculos
    frr = (false_rejections / genuine_attempts) * 100 if genuine_attempts > 0 else 0
    far = (false_acceptances / imposter_attempts) * 100 if imposter_attempts > 0 else 0
    accuracy = 100 - ((frr + far) / 2)
    
    print("\n" + "="*40)
    print("🏆 REPORTE ACADÉMICO BIOMÉTRICO (SOCOFING)")
    print("="*40)
    print(f"Umbral de Confianza: {MATCH_THRESHOLD}")
    print(f"Tiempo de Evaluación: {elapsed_total:.2f} segundos")
    print(f"\n[+] PRUEBAS GENUINAS (Debe Aceptar)")
    print(f"    Total intentos: {genuine_attempts}")
    print(f"    Falsos Rechazos (FRR): {false_rejections}")
    print(f"    -> FRR %: {frr:.2f}%")
    
    print(f"\n[-] PRUEBAS IMPOSTORAS (Debe Rechazar)")
    print(f"    Total intentos: {imposter_attempts}")
    print(f"    Falsos Aceptados (FAR): {false_acceptances}")
    print(f"    -> FAR %: {far:.2f}%")
    
    print(f"\n📊 PRECISIÓN ESTIMADA DEL SISTEMA: {accuracy:.2f}%")
    print("="*40)
    print("Nota para tesis: Un FAR bajo (seguridad alta) es preferible en sistemas agrícolas.")

if __name__ == "__main__":
    evaluate()
