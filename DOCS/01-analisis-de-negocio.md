# Análisis de Negocio

**Proyecto:** Sistema de Gestión de Contratos con Validación Biométrica por Huella Digital
**Contexto:** Fundo agrícola — Región Ica, Perú
**Curso:** Sistemas Inteligentes — Semestre 2026-1
**Versión:** 1.0
**Fecha:** Mayo 2026

---

## 1. Resumen ejecutivo

El proyecto propone el diseño e implementación de un sistema informático que centraliza la gestión documental de contratos de un fundo agrícola y añade una capa de validación biométrica por huella digital para garantizar que la persona que firma un contrato es efectivamente el dueño autorizado del fundo.

La solución reemplaza el manejo manual de contratos en archivadores físicos por un repositorio digital consultable, con búsqueda, alertas de vencimiento e historial auditable de validaciones biométricas. El componente biométrico aplica técnicas de procesamiento digital de imágenes y reconocimiento de patrones para extraer minutiae de huellas dactilares y compararlas contra una plantilla maestra registrada al alta del fundo.

El sistema se construye como una aplicación web (frontend Next.js + API Python con FastAPI) usando como fuente de imágenes biométricas un dataset público estandarizado (FVC2002 / SOCOFing), lo que permite reproducibilidad académica sin dependencia de hardware especializado.

---

## 2. Problema de negocio

### 2.1 Contexto del sector

Los fundos agrícolas en la región Ica manejan operaciones contractuales intensas durante todo el año productivo: arrendamiento de hectáreas, venta de cosecha (uva, espárrago, palto), contratación de jornaleros temporales, acuerdos con proveedores de insumos, contratos de transporte, créditos de campaña, entre otros. La gestión tradicional de estos documentos se realiza en archivadores físicos, hojas de cálculo dispersas o, en el mejor de los casos, en repositorios digitales no estructurados.

### 2.2 Dolores identificados

1. **Riesgo de fraude por suplantación de identidad.** La firma manuscrita es fácilmente imitable. En un fundo donde un solo contrato puede mover decenas de miles de soles, una firma falsificada genera pérdidas económicas directas y disputas legales prolongadas.

2. **Pérdida y deterioro de documentos físicos.** Los contratos en papel se extravían, se dañan por humedad o roedores, o quedan inaccesibles cuando la persona que los archivó no está disponible.

3. **Olvido de fechas críticas.** Vencimientos de arrendamientos, renovaciones, pagos pactados, plazos de entrega de cosecha. La falta de un sistema de alertas se traduce en penalizaciones, contratos vencidos sin renovar o entregas tardías.

4. **Conocimiento concentrado en una sola persona.** Típicamente el administrador del fundo es el único que sabe dónde está cada documento. Su ausencia paraliza consultas.

5. **Auditoría limitada.** Ante una disputa, no hay registro confiable de quién firmó qué, cuándo y bajo qué condiciones.

6. **Demoras en búsqueda de cláusulas específicas.** Buscar una cláusula concreta en cientos de páginas físicas puede tomar horas o días.

### 2.3 Costo del problema

Aunque no se cuantifica en este documento, los dolores listados se traducen en pérdidas económicas (fraudes, penalidades por vencimiento, costos legales), pérdidas operativas (tiempo de búsqueda, parálisis por ausencia de personas clave) y pérdida de confianza con contrapartes comerciales.

---

## 3. Solución propuesta

### 3.1 Descripción general

Un sistema web que actúa como repositorio único de los contratos del fundo, con tres capacidades centrales:

1. **Gestión documental** — Registro, búsqueda, consulta y seguimiento de contratos con sus metadatos clave (partes, objeto, plazos, montos, estado).

2. **Validación biométrica** — Verificación de la identidad del dueño firmante mediante comparación de huella digital contra una plantilla previamente registrada.

3. **Alertas y auditoría** — Notificación automática de vencimientos y registro histórico de todos los intentos de validación biométrica para fines de auditoría legal.

### 3.2 Diferenciadores frente a la situación actual

| Situación actual | Con el sistema |
|---|---|
| Archivadores físicos dispersos | Repositorio digital único y consultable |
| Firma manuscrita imitable | Firma respaldada por huella digital biométrica |
| Búsqueda manual de cláusulas | Búsqueda por filtros y criterios estructurados |
| Vencimientos sin control | Alertas automáticas configurables |
| Sin registro de quién firmó | Historial biométrico auditable con timestamp |
| Dependencia de una sola persona | Sistema accesible para múltiples operadores |

### 3.3 Alcance del MVP académico

**Incluye:**
- CRUD completo de contratos con sus partes, cláusulas básicas y metadatos
- Registro biométrico del dueño (enrollment) a partir de imagen de huella subida
- Validación biométrica al firmar un contrato (verification 1:1)
- Búsqueda y filtrado de contratos por tipo, estado, fecha, contraparte
- Alertas de vencimiento (cálculo de contratos próximos a vencer)
- Historial de intentos de validación biométrica (exitosos y fallidos)
- UI web responsive
- Documentación técnica y de usuario

**No incluye en el MVP (queda como trabajo futuro):**
- Captura biométrica con lector físico en vivo (se trabaja con dataset)
- Firma electrónica con valor legal pleno (certificación digital ante INDECOPI o RENIEC)
- Integración con SUNAT, SUNARP o entidades financieras
- Reconocimiento facial como segundo factor
- Despliegue en producción con escalamiento cloud
- Chatbot RAG complementario (documentado por separado, opcional como anexo)
- App móvil nativa
- Multi-tenant (múltiples fundos en una misma instancia)

---

## 4. Stakeholders

| Stakeholder | Rol | Interés en el sistema |
|---|---|---|
| **Dueño del fundo** | Usuario biométrico principal | Su huella es la plantilla maestra. Es quien firma los contratos. |
| **Administrador del fundo** | Operador principal | Registra contratos, gestiona el repositorio, consulta el historial |
| **Contrapartes (compradores, proveedores, jornaleros)** | Firmantes externos | Firman manualmente; el sistema solo valida la huella del dueño |
| **Auditor / contador del fundo** | Consultor periódico | Revisa el historial de contratos y validaciones para reportes |
| **Profesor del curso** | Evaluador académico | Verifica que el sistema aplica técnicas de Sistemas Inteligentes |
| **Desarrollador (autor)** | Implementador | Diseña, construye, documenta y presenta el sistema |

---

## 5. Casos de uso principales

### 5.1 CU-01: Registrar dueño del fundo (enrollment biométrico)

**Actor:** Administrador
**Precondición:** El fundo está dado de alta en el sistema
**Flujo:**
1. El administrador accede a la sección de configuración del fundo
2. Sube una imagen de la huella digital del dueño (formato PNG/JPG)
3. El sistema procesa la imagen: preprocesamiento, binarización, esqueletización, extracción de minutiae
4. El sistema almacena la plantilla de minutiae como referencia maestra del dueño
5. El sistema confirma el registro exitoso

**Postcondición:** El fundo tiene una plantilla biométrica maestra asociada al dueño

### 5.2 CU-02: Registrar un nuevo contrato

**Actor:** Administrador
**Precondición:** Existe al menos un fundo con dueño registrado
**Flujo:**
1. El administrador inicia la creación de un nuevo contrato
2. Selecciona el tipo de contrato (arrendamiento, compraventa, suministro, laboral, etc.)
3. Registra los datos de las partes (contraparte: nombre, DNI/RUC, contacto)
4. Define objeto, plazos, monto, forma de pago, cláusulas
5. Guarda el contrato en estado "Borrador"

**Postcondición:** El contrato queda registrado pendiente de validación biométrica para pasar a "Firmado"

### 5.3 CU-03: Firmar contrato con validación biométrica

**Actor:** Administrador (operando) + Dueño (firmante)
**Precondición:** Existe un contrato en estado "Borrador" y el dueño tiene plantilla registrada
**Flujo:**
1. El administrador selecciona el contrato a firmar
2. El sistema solicita la huella del dueño (subida de imagen capturada en el momento)
3. El sistema procesa la huella entrante y extrae sus minutiae
4. El sistema ejecuta el matcher: alineación con la plantilla maestra y comparación de minutiae
5. El sistema calcula un score de similitud
6. **Si el score supera el umbral:** el contrato pasa a estado "Firmado", se registra timestamp y score en el historial
7. **Si el score no supera el umbral:** el contrato permanece en "Borrador", se registra el intento fallido como alerta de posible suplantación

**Postcondición:** El contrato queda firmado y trazado biométricamente, o se levanta una alerta

### 5.4 CU-04: Consultar y buscar contratos

**Actor:** Administrador, Auditor
**Flujo:**
1. El usuario accede al listado de contratos
2. Aplica filtros: tipo de contrato, estado, contraparte, rango de fechas, monto
3. El sistema muestra los contratos coincidentes paginados
4. El usuario puede abrir el detalle de cualquier contrato

**Postcondición:** El usuario accede a la información estructurada del contrato

### 5.5 CU-05: Recibir alertas de vencimiento

**Actor:** Administrador
**Flujo:**
1. El sistema calcula periódicamente los contratos próximos a vencer (umbral configurable: 7, 15, 30 días)
2. En el dashboard del administrador se muestran los contratos por vencer
3. El administrador puede tomar acción: renovar, modificar (adenda) o dar por terminado

**Postcondición:** El administrador tiene visibilidad temprana de los vencimientos

### 5.6 CU-06: Auditar historial de validaciones biométricas

**Actor:** Auditor, Administrador
**Flujo:**
1. El usuario accede al historial biométrico
2. Filtra por rango de fechas, contrato o resultado (exitoso/fallido)
3. El sistema muestra cada intento con timestamp, contrato asociado, score de similitud y resultado
4. El usuario puede exportar el reporte

**Postcondición:** Trazabilidad completa de quién intentó firmar qué y cuándo

---

## 6. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-01 | El sistema permite registrar fundos con sus datos básicos | Alta |
| RF-02 | El sistema permite registrar un dueño por fundo con su plantilla biométrica | Alta |
| RF-03 | El sistema permite subir imágenes de huella digital en formato PNG/JPG | Alta |
| RF-04 | El sistema procesa imágenes de huella y extrae minutiae | Alta |
| RF-05 | El sistema permite crear contratos con sus partes, objeto, plazo y monto | Alta |
| RF-06 | El sistema permite asociar contratos a tipos predefinidos (arrendamiento, compraventa, etc.) | Alta |
| RF-07 | El sistema valida la huella del dueño antes de marcar un contrato como firmado | Alta |
| RF-08 | El sistema calcula un score de similitud entre dos plantillas de minutiae | Alta |
| RF-09 | El sistema decide firma válida/inválida según umbral configurable | Alta |
| RF-10 | El sistema registra cada intento de validación biométrica con timestamp y score | Alta |
| RF-11 | El sistema permite buscar contratos por múltiples criterios | Media |
| RF-12 | El sistema notifica contratos próximos a vencer | Media |
| RF-13 | El sistema permite visualizar las minutiae detectadas sobre la imagen original | Media |
| RF-14 | El sistema permite exportar el historial de validaciones en CSV | Baja |
| RF-15 | El sistema permite registrar adendas a contratos existentes | Baja |

---

## 7. Requerimientos no funcionales

| ID | Requerimiento | Métrica objetivo |
|---|---|---|
| RNF-01 | Tiempo de procesamiento de una huella (extracción de minutiae) | < 3 segundos |
| RNF-02 | Tiempo de matching entre dos plantillas | < 1 segundo |
| RNF-03 | Tasa de falsos positivos (FAR) del matcher | < 5% |
| RNF-04 | Tasa de falsos negativos (FRR) del matcher | < 15% |
| RNF-05 | El sistema debe ser usable en navegadores Chrome, Firefox y Edge actualizados | 100% compatibilidad |
| RNF-06 | El sistema debe ser responsive (escritorio y tablet) | Breakpoints estándar |
| RNF-07 | Las contraseñas de operadores se almacenan con hash bcrypt | bcrypt con cost 12+ |
| RNF-08 | Las plantillas biométricas se almacenan cifradas en reposo | AES-256 o similar |
| RNF-09 | El código fuente sigue convenciones de linting (ESLint, Ruff) | 0 errores en CI |
| RNF-10 | Documentación técnica completa (este documento + arquitectura + BD + estructura) | Markdown versionado |

> **Nota sobre RNF-03 y RNF-04:** los valores objetivo de FAR/FRR son orientativos para un MVP académico trabajando con dataset estandarizado. Sistemas biométricos comerciales apuntan a FAR < 0.01% y FRR < 2%, lo cual requiere algoritmos mucho más sofisticados y datasets de entrenamiento masivos. El MVP debe documentar honestamente sus métricas obtenidas en evaluación con FVC2002 o SOCOFing.

---

## 8. Restricciones del proyecto

### 8.1 Restricciones técnicas

- **Captura biométrica:** Se usa dataset público de imágenes de huella (FVC2002 / SOCOFing). No se integra hardware lector.
- **Stack obligatorio para biometría:** Python (OpenCV, scikit-image, NumPy). Es lo que el curso requiere para aplicar Sistemas Inteligentes.
- **Despliegue:** Solo entorno local en el MVP. No se despliega a cloud productivo.
- **Datos sensibles:** Las plantillas biométricas son datos personales sensibles según legislación peruana (Ley 29733 de Protección de Datos Personales). En un sistema productivo real, esto exigiría medidas adicionales no cubiertas por el MVP académico.

### 8.2 Restricciones de tiempo

- **Plazo:** Mayor a 8 semanas con dedicación efectiva estimada de 20+ horas semanales
- **Total estimado de esfuerzo:** 130-170 horas

### 8.3 Restricciones de equipo

- **Modalidad:** Desarrollo individual (un solo autor responsable de todas las capas)

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Curva de aprendizaje de OpenCV / procesamiento de huellas | Alta | Alto | Usar librerías de alto nivel para extracción (`fingerprint-feature-extractor`); implementar solo el matcher desde cero |
| Métricas FAR/FRR pobres por dataset complicado | Media | Medio | Calibrar umbrales empíricamente; documentar honestamente las métricas; usar SOCOFing que tiene huellas más limpias que FVC2002 |
| Sobrediseño del monorepo Turborepo consume tiempo de features | Media | Medio | Setup mínimo viable de monorepo; no agregar workspaces ni packages innecesarios al inicio |
| Cuello de botella por ser proyecto individual | Media | Alto | Priorizar features de alto valor; aceptar que la UI puede ser funcional sin ser premium |
| Conflicto de tiempo con sprint WCAG en CMAC (deadline fin de mayo) | Alta | Medio | Acelerar el setup inicial antes de fin de mayo; concentrar el grueso del desarrollo después |
| Confusión entre proyecto principal y chatbot durante la expo | Baja | Medio | Documentación clara: el chatbot es anexo opcional, no parte del MVP evaluado |

---

## 10. Criterios de éxito

El proyecto se considera exitoso si cumple lo siguiente al momento de la entrega/exposición:

1. **Funcionalidad biométrica operativa** — Se puede registrar una huella maestra, subir una huella nueva, y el sistema decide correctamente si pertenecen a la misma persona en al menos el 80% de los casos probados con dataset.

2. **CRUD de contratos completo** — Se pueden crear, listar, buscar, modificar y consultar contratos con todos sus datos relevantes.

3. **Flujo de firma con validación biométrica integrado** — Un contrato no pasa a estado "Firmado" sin pasar la validación biométrica exitosa.

4. **Historial auditable** — Todo intento de validación queda registrado y es consultable.

5. **Documentación técnica entregada** — Los 5 documentos solicitados (análisis de negocio, arquitectura, modelo BD, estructura de proyecto, diagrama ER) están terminados y versionados.

6. **Demo presentable** — Se puede demostrar el flujo completo: registrar dueño → crear contrato → intentar firma con huella correcta (acepta) → intentar firma con huella incorrecta (rechaza y alerta) → consultar historial.

7. **Aplicación clara de conceptos de Sistemas Inteligentes** — En la exposición se puede explicar y justificar: extracción de minutiae, alineación de plantillas, scoring de similitud, decisión por umbral, métricas FAR/FRR.

---

## 11. Beneficios esperados

### 11.1 Para el caso de negocio (fundo agrícola)

- Reducción del riesgo de suplantación de identidad en la firma de contratos
- Centralización ordenada de la documentación contractual
- Acceso rápido a información histórica
- Trazabilidad auditable de firmas
- Reducción de pérdidas por contratos vencidos sin gestión

### 11.2 Para el aporte académico (curso Sistemas Inteligentes)

- Aplicación práctica de procesamiento digital de imágenes (filtros, binarización, esqueletización)
- Implementación de extracción automática de características en patrones visuales
- Desarrollo de algoritmo propio de matching y scoring
- Toma de decisiones basada en umbrales y métricas de confianza
- Evaluación con métricas estandarizadas (FAR, FRR, EER)

### 11.3 Para el desarrollador (portfolio profesional)

- Pieza técnica significativa para portfolio (no es un "RAG wrapper")
- Demostración de stack full-stack moderno (Next.js + FastAPI + biometría)
- Caso de uso vertical (sector agroindustrial peruano) que aporta diferenciación
- Material para Fiverr (categoría "Custom Full Stack Web Apps")

---

## 12. Trabajo futuro (fuera del MVP)

Estas extensiones quedan documentadas como dirección de crecimiento, pero no forman parte del MVP evaluado:

1. **Integración con lector biométrico físico real** (Digital Persona, SecuGen) para captura en vivo
2. **Firma electrónica con valor legal pleno** ante INDECOPI/RENIEC
3. **Reconocimiento facial** como segundo factor biométrico
4. **Integración con SUNAT, SUNARP** y entidades financieras
5. **Migración a arquitectura cloud** (AWS / GCP) con multi-tenant
6. **Aprendizaje profundo (CNN)** para mejorar la precisión del matching biométrico
7. **App móvil nativa** (React Native o Flutter)
8. **Chatbot RAG embebido** sobre los contratos reales del sistema (ya documentado por separado)
9. **OCR de contratos escaneados** para extraer cláusulas automáticamente
10. **Dashboards analíticos** sobre la cartera contractual del fundo

---

## 13. Glosario

| Término | Definición |
|---|---|
| **Biometría** | Ciencia que reconoce personas por características físicas únicas |
| **Huella digital (dactilar)** | Patrón único de crestas y valles en la yema del dedo |
| **Minutiae** | Puntos característicos de una huella: terminaciones y bifurcaciones de crestas |
| **Plantilla biométrica** | Conjunto de minutiae extraídas y almacenadas como referencia |
| **Enrollment** | Proceso de registrar y almacenar la plantilla de un usuario nuevo |
| **Verification (1:1)** | Confirmar si una huella corresponde a una plantilla específica |
| **Identification (1:N)** | Determinar a cuál de varias plantillas pertenece una huella |
| **FAR (False Accept Rate)** | Porcentaje de impostores aceptados por error |
| **FRR (False Reject Rate)** | Porcentaje de usuarios legítimos rechazados por error |
| **EER (Equal Error Rate)** | Punto donde FAR y FRR son iguales; métrica resumen de desempeño |
| **Umbral / threshold** | Valor mínimo de score para considerar una huella como coincidente |
| **Esqueletización** | Reducción del grosor de las crestas a un solo píxel |
| **Binarización** | Conversión de imagen a blanco y negro puro |
| **Filtro Gabor** | Filtro orientado usado para realzar crestas de huella |
| **Aparcería** | Contrato agrícola donde dueño y aparcero comparten frutos del trabajo |
| **Adenda** | Documento que modifica o complementa un contrato existente |
