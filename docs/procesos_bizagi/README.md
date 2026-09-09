# 🏛️ Procesos de Negocio Vaikuntha ERP (Gloss Salon & Relax) - Bizagi Modeler (BPMN 2.0)

Este directorio contiene los diagramas oficiales de arquitectura de procesos de negocio de **Vaikuntha ERP** modelados bajo el estándar internacional **BPMN 2.0 (Business Process Model and Notation)** de la OMG, 100% optimizados para su apertura, edición, simulación y publicación documental en **Bizagi Modeler**.

---

## 📁 Catálogo de Diagramas BPMN 2.0

| Archivo BPMN | Proceso Modelado | Roles / Lanes Involucrados | Elementos | Flujos |
| :--- | :--- | :--- | :---: | :---: |
| [`macroproceso_operativo_vaikuntha.bpmn`](./macroproceso_operativo_vaikuntha.bpmn) | **Macroproceso Operativo de Salón (End-to-End)**: Desde la llegada y check-in del cliente hasta la liquidación en caja y fidelización. | Cliente VIP, Kiosko Táctil (Opal AI), Recepción Central, Estilista en Sillón, Laboratorio, Bar Boutique, Caja POS. | 69 | 30 |
| [`wfm_control_asistencia_turnos.bpmn`](./wfm_control_asistencia_turnos.bpmn) | **Workforce Management & Control de Turnos**: Marcación física NFC (Puerta/Comedor), peticiones asíncronas, aprobación en recepción y rotación de piso. | Colaborador (Staff Móvil), Recepción / Supervisor, Motor Supabase Realtime (WAL FULL), Algoritmo Rotación de Piso. | 49 | 21 |
| [`laboratorio_cadena_suministro.bpmn`](./laboratorio_cadena_suministro.bpmn) | **Laboratorio Químico & Cadena de Suministro**: Formulación química, pesaje en balanza Web Serial (±2g), deducción en Kardex y predicción Opal. | Estilista Solicitante, Encargado de Laboratorio, Motor de Kardex Supabase, Administración / Compras. | 42 | 17 |

---

## 🚀 Guía Rápida: Cómo Abrir los Procesos en Bizagi Modeler

### Paso 1: Descargar o Abrir Bizagi Modeler
Asegúrate de contar con **Bizagi Modeler** (versión de escritorio gratuita o empresarial, v3.8+ recomendada) en tu equipo.

### Paso 2: Importar el Archivo BPMN
1. Abre Bizagi Modeler.
2. En la cinta de opciones superior, ve a la pestaña **Inicio** (Home).
3. Haz clic en el botón **Importar** y selecciona la opción **BPMN** (o presiona `Ctrl + O` y cambia el filtro a `Archivos BPMN (*.bpmn)`).
4. Navega hasta la carpeta del proyecto:
   ```text
   ERP-Supabase-VERCEL-Gonzales/docs/procesos_bizagi/
   ```
5. Selecciona el diagrama deseado (ej. `macroproceso_operativo_vaikuntha.bpmn`) y haz clic en **Abrir**.

### Paso 3: Visualización y Edición
- El diagrama se cargará automáticamente con su **Pool principal**, sus **Lanes por rol** y todos los nodos distribuidos de izquierda a derecha.
- Al hacer clic en cualquier tarea y presionar `F4` (o clic derecho -> *Propiedades*), podrás ver la **Documentación Técnica embebida** que explica la regla de negocio, los componentes del frontend y las tablas de Supabase asociadas.

### Paso 4: Publicar Documentación Institucional
Desde Bizagi Modeler puedes generar automáticamente los manuales corporativos del salón:
- Pestaña **Publicar** -> **Word**, **PDF**, **Web** o **SharePoint**.
- Bizagi generará un documento estructurado con el índice, la imagen del diagrama y la ficha técnica de cada actividad.

---

## 🧬 Matriz de Trazabilidad Técnica: BPMN vs. Código Vaikuntha ERP

### 1. Macroproceso Operativo de Salón
| ID Nodo BPMN | Actividad | Tipo BPMN | Componente Frontend | Tabla / Servicio Backend |
| :--- | :--- | :--- | :--- | :--- |
| `Task_Cli_CheckIn` | Check-in en Kiosko | User Task | `KioskVipCheckIn.tsx` | `public.clientes` |
| `Task_Kiosk_Opal` | Bienvenida Opal Concierge | Service Task | `KioskConciergeAgent.tsx` | Inferencia Google Opal AI |
| `Task_Kiosk_OATC` | Registro de Orden en Espera | Service Task | `useAppStore.ts` | `public.oatc` (`estado: EN_ESPERA`) |
| `Task_Recep_Monitor` | Monitoreo de Cola en Recepción | User Task | `QueueMonitor.tsx` | Realtime Channel `cola_oatc` |
| `Task_Estil_Reclamar` | Reclamar Orden en Sillón | User Task | `TabCola.tsx` | `oatc.estado = 'EN_ATENCION'` |
| `Task_Estil_Diag` | Diagnóstico y Cronómetro | User Task | `StaffChairsideAssistant.tsx` | Web Timer + Ficha Técnica |
| `Task_Estil_PedBar` | Comanda de Bebida a Bar | User Task | `TabBar.tsx` | `cola_peticiones` (`BAR_BEBIDA`) |
| `Task_Bar_Prep` | Preparación en Bar | User Task | `BarWorkspaceView.tsx` | Notificación Web Audio API |
| `Task_Lab_Pesar` | Pesaje en Balanza Digital | User Task | `LabDespachoView.tsx` | Web Serial API (`±2g`) |
| `Task_Caja_Cargar` | Pre-cuenta y Liquidación | User Task | `CajaPosView.tsx` | `oatc`, `cortesias` |
| `Task_Caja_Boleta` | Emisión Boleta SUNAT | Service Task | `FacturacionService.ts` | `public.comprobantes`, `gamification_events` |

### 2. Workforce Management (WFM) y Asistencia
| ID Nodo BPMN | Actividad | Tipo BPMN | Componente Frontend | Tabla / Servicio Backend |
| :--- | :--- | :--- | :--- | :--- |
| `Task_Scan_NFC` | Escaneo de Tag Puerta/Comedor | User Task | `useNfcBackgroundListener.ts` | NDEF Web NFC Reader |
| `Task_Sel_Mov` | Selector Desambiguado (1-Tap) | User Task | `ModalPuertaNfc.tsx` | Entrada, Refrigerio, Salida |
| `Task_DB_InsertPet` | Registro de Solicitud | Service Task | `services/peticiones.ts` | `cola_peticiones` (`PENDIENTE`) |
| `Task_Recep_ModalRech`| Modal Rechazo con Motivo | User Task | `QueueMonitor.tsx` | `metadata.motivo_rechazo` |
| `Task_DB_WalBroadcast`| Emisión WAL Realtime | Service Task | PostgreSQL Engine | `REPLICA IDENTITY FULL` |
| `Task_Staff_Rechazo` | Banner Carmesí de Rechazo | User Task | `TabEstacion.tsx` | Vibración Háptica + Toast |
| `Task_DB_Audit` | Asistencia Inmutable | Service Task | `services/peticiones.ts` | `public.asistencias_turnos` |
| `Task_DB_SyncEstado` | Sincronización Diaria Dinámica| Service Task | `services/peticiones.ts` | `obtenerEstadoOperativoDinamicoAgente` |
| `Task_Piso_Recalc` | Posición en Piso (#X de Y) | Rule Task | `TabCola.tsx` | Rotación dinámica de estilistas |

### 3. Laboratorio Químico y Suministros
| ID Nodo BPMN | Actividad | Tipo BPMN | Componente Frontend | Tabla / Servicio Backend |
| :--- | :--- | :--- | :--- | :--- |
| `Task_Estil_Formulacion` | Selección de Fórmula en Móvil | User Task | `StaffChairsideAssistant.tsx`| Catálogo de Insumos Químicos |
| `Task_Lab_ConnectBalanza`| Lectura Balanza Digital | Service Task | `BalanzaWebSerial.ts` | Web Serial API (COM / USB) |
| `Task_Lab_TaraPesaje` | Tara y Dosificación | Manual Task | `LabDespachoView.tsx` | Validación tolerancia `±2g` |
| `Task_Kardex_Deduccion` | Deducción en Kardex | Service Task | `services/inventario.ts` | `public.inventario_movimientos` |
| `Task_Compras_OpalPredictor`| Proyección Demanda 7 Días | Service Task | `LabInsumosPredictorOpal.tsx`| Google Opal Copilot AI |

---

## 🛠️ Cómo Regenerar o Extender los Diagramas

El proyecto cuenta con scripts automatizados en Node.js para reconstruir o ampliar los diagramas BPMN 2.0 cuando se incorporen nuevas pantallas o reglas operativas:

1. **Regenerar los diagramas**:
   ```bash
   node scripts/generate-bizagi-bpmn.mjs
   ```
2. **Validar la integridad sintáctica y de flujos**:
   ```bash
   node scripts/validate-bpmn.mjs
   ```

Ambos scripts garantizan el cumplimiento de los esquemas XML oficiales de la OMG (`http://www.omg.org/spec/BPMN/20100524/MODEL` y `http://www.omg.org/spec/BPMN/20100524/DI`), asegurando que Bizagi Modeler siempre los abra sin errores de esquema.
