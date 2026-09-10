# 🏛️ Procesos de Negocio Vaikuntha ERP (Gloss Salon & Relax) - Bizagi Modeler (BPMN 2.0)

Este directorio contiene la arquitectura integral de procesos de negocio de **Vaikuntha ERP**, modelada bajo el estándar internacional **BPMN 2.0 (Business Process Model and Notation)** de la OMG, 100% optimizada para su apertura, edición, simulación y publicación documental en **Bizagi Modeler**.

La suite incluye elementos de notación avanzada: **Subprocesos Colapsados e Hijos Dedicados**, **Eventos Intermedios de Mensaje (WebSockets Realtime)**, **Eventos de Temporizador (Cronómetros Químicos y Lounge)**, **Objetos de Datos (Documentos físicos/digitales)** y **Almacenes de Datos (Supabase PostgreSQL)**.

---

## 📁 Catálogo de Diagramas BPMN 2.0

| Archivo BPMN | Proceso Modelado | Notación Avanzada Incorporada | Elementos | Flujos |
| :--- | :--- | :--- | :---: | :---: |
| [**`macroproceso_operativo_vaikuntha.bpmn`**](./macroproceso_operativo_vaikuntha.bpmn) | **Macroproceso Operativo de Salón (End-to-End)**: Atención integral del cliente desde el Kiosko hasta Caja POS. | **Subproceso Colapsado `[+]` OATC**, 8 Eventos Intermedios (Mensaje Realtime y Temporizador), 3 Data Objects, 2 Data Stores. | **93** | **34** |
| [**`subproceso_oatc_impresion_termica.bpmn`**](./subproceso_oatc_impresion_termica.bpmn) | **Subproceso: Ciclo de Vida y Emisión Térmica OATC**: Generación, guardado en Supabase, renderizado ESC/POS (80mm) y enrutador a cualquier impresora térmica de la sede. | Enrutamiento Multi-Canal (Red IP, Web Serial USB), control de ACK/errores de hardware, 2 Data Objects (Buffer ESC/POS y Ticket Físico), 1 Data Store. | **48** | **18** |
| [**`wfm_control_asistencia_turnos.bpmn`**](./wfm_control_asistencia_turnos.bpmn) | **Workforce Management & Control de Turnos**: Marcaciones NFC, solicitudes asíncronas, auditoría de recepción y rotación de piso. | 4 Eventos Intermedios de Mensaje (solicitud, campana de alerta, WAL Realtime FULL, vibración háptica staff), 2 Data Stores. | **57** | **22** |
| [**`laboratorio_cadena_suministro.bpmn`**](./laboratorio_cadena_suministro.bpmn) | **Laboratorio Químico & Cadena de Suministro**: Formulación, pesaje en balanza Web Serial (±2g), Kardex y reposición con Opal AI. | Evento Intermedio de Temporizador (exposición química), 1 Data Object (Fórmula), 1 Data Store (Kardex). | **48** | **18** |

---

## 🖨️ Arquitectura del Subproceso OATC e Impresión Térmica

La Orden de Atención Técnica y Comercial (**OATC**) se concibe como un **Subproceso de Negocio** y no como una simple tarea:
1. **Generación de Correlativo Diario**: `OATC-YYYYMMDD-XXX` único por sede.
2. **Persistencia Transaccional**: Registro central en `public.oatc` y `public.oatc_items` en Supabase.
3. **Formateo del Payload ESC/POS**:
   - Ancho estándar: **80mm** (48 columnas).
   - Cabecera boutique: Logo de Gloss Salon & Relax y datos de la sede.
   - Código QR dinámico con URL de seguimiento para el cliente o escáner del staff.
   - Desglose de servicios, estilista asignado y notas de diagnóstico.
4. **Enrutador de Impresión por Sede**:
   - Permite al operador dirigir la comanda a la impresora térmica asignada de **Recepción**, **Laboratorio Químico** o **Bar Boutique**.
   - Soporte para canales de conexión: **Impresoras de Red LAN/WiFi (Socket TCP RAW puerto 9100)** y **Web Serial API (USB directo)**.
5. **Resiliencia de Hardware**:
   - Monitoreo de estado (ACK): Detección de falta de papel o cubierta abierta con opción de reintento o re-enrutamiento a impresora de respaldo.

---

## ⏱️ Catálogo de Eventos Intermedios en los Procesos

| Evento Intermedio | Tipo BPMN | Semántica Operativa en Vaikuntha ERP |
| :--- | :--- | :--- |
| **Llegada de Cliente en Sala** | Catch / Throw Message | Disparado por el Kiosko y capturado instantáneamente por el monitor de Recepción (`QueueMonitor.tsx`) vía Supabase Realtime Channel. |
| **Aviso: Bebida de Bar Lista** | Catch / Throw Message | Notificación emitida desde `/mobile/bar` (`BarWorkspaceView.tsx`) al sillón del estilista cuando el café o cóctel de cortesía está servido. |
| **Aviso: Mezcla Química Lista** | Catch / Throw Message | Notificación emitida por el Encargado de Laboratorio (`/lab/despacho`) tras el pesaje en la balanza digital hacia la suite del estilista. |
| **Notificación Háptica WFM** | Catch Message | Recepción en el móvil del staff del cambio de estado (`APROBADO` o `RECHAZADO` con motivo) con vibración física del dispositivo (`navigator.vibrate`). |
| **Espera en Lounge (Timer)** | Catch Timer | Temporizador visual estimado por Opal Concierge mientras se acondiciona el sillón de atención. |
| **Cronómetro Químico (Timer)** | Catch Timer | Alarma de cuenta regresiva en sillón (20-45 min) para control estricto de tintes, decoloraciones y plex sin sobre-procesar el cabello. |

---

## 📄 Objetos de Datos y Almacenes (BPMN Data Elements)

- **`[DataObject: Ticket OATC Térmico (80mm ESC/POS)]`**: Formato impreso con QR para control de salón.
- **`[DataObject: Ficha Técnica Capilar]`**: Historial clínico y formulación química del cliente (`StaffChairsideAssistant.tsx`).
- **`[DataObject: Comprobante SUNAT]`**: Boleta o factura electrónica emitida en Caja POS.
- **`[DataStore: public.oatc]`**: Almacén central de órdenes en Supabase PostgreSQL.
- **`[DataStore: public.cola_peticiones]`**: Cola asíncrona de solicitudes en tiempo real con `REPLICA IDENTITY FULL`.
- **`[DataStore: public.asistencias_turnos]`**: Tabla de auditoría laboral inmutable.
- **`[DataStore: public.inventario_movimientos]`**: Kardex continuo de insumos químicos por gramaje.

---

## 🚀 Cómo Abrir y Navegar los Diagramas en Bizagi Modeler

### Paso 1: Abrir Bizagi Modeler
Ejecuta **Bizagi Modeler** en tu computadora (v3.8 o superior).

### Paso 2: Importar los Procesos
1. Ve a la pestaña **Inicio** -> **Importar** -> **BPMN**.
2. Selecciona cualquiera de los archivos en:
   ```text
   ERP-Supabase-VERCEL-Gonzales\docs\procesos_bizagi\
   ```
3. Comienza importando `macroproceso_operativo_vaikuntha.bpmn`.
4. Observa el bloque de subproceso **`Subproceso: Gestión y Emisión Térmica de OATC`** con su ícono `[+]`.
5. En una segunda pestaña o ventana, importa `subproceso_oatc_impresion_termica.bpmn` para ver el detalle de ingeniería del ticket térmico y los canales de impresión.

### Paso 3: Consultar Documentación Técnica de Actividades
Presiona `F4` sobre cualquier tarea, evento o almacén de datos para ver su ficha técnica completa, incluyendo tablas de Supabase, hooks y componentes React asociados.

### Paso 4: Generar Documentación Institucional
Pestaña **Publicar** -> **Word** o **PDF**: Bizagi compilará automáticamente el manual de operaciones del salón con diagramas en alta resolución, descripción de eventos y matrices de responsabilidades.

---

## 🛠️ Pipeline Automatizado de Mantenimiento

Para regenerar o validar los 4 diagramas:
```bash
# 1. Regenerar los 4 archivos BPMN 2.0 XML
node scripts/generate-bizagi-bpmn.mjs

# 2. Validar estructura, referencias y conectores
node scripts/validate-bpmn.mjs
```
