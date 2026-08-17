# MANUAL TÉCNICO: ERP GONZALES SALÓN SPA

## 1. Arquitectura del Sistema
- **Backend / Hosting:** Google Apps Script (GAS) interactuando mediante funciones en `Code.gs`.
- **Base de Datos:** Cloud Firebase / Firestore (Ecosistema NoSQL Orientado a Documentos).
- **Frontend:** Single Page Application (SPA) montada en `Index.html` procesada por el HtmlService de GAS.
- **UI Stack:** Tailwind CSS (vía CDN), componentes de Flowbite y reactividad ágil con Alpine.js.

## 2. Modelo de Datos (Colecciones Firestore)

### Colección: `usuarios`
Súperclase "Persona" que unifica identidades, credenciales y perfiles especializados de WFM.
- `usuario_id` (String, Identificador Único)
- `dni`, `nombre`, `apellido`, `celular`, `email`, `fecha_nacimiento`, `genero`
- `login`: { `username`, `password_hash`, `estado` }
- `roles`: Arreglo de strings (ej: ["agente", "recepcion"])
- `perfil_agente`: { `ficha_id`, `apodo`, `salon`, `hr_entrada`, `hr_salida`, `dia_descanso`, `especialidad`, `wfm_estado` }
- `perfil_cliente`: { `origen_captacion`, `perfil_preferencias`: { `alergias`, `notas_esteticas` } }

### Colección: `bienes`
Catálogo unificado para inventario (WMS) y portafolio de servicios.
- `bien_id` (String)
- `tipo_bien`: "servicio" o "producto"
- `nombre`, `categoria`, `precio_venta`
- `atributos_producto`: { `stock_actual`, `stock_minimo`, `unidad_medida`, `es_insumo_laboratorio` }
- `atributos_servicio`: { `duracion_estimada_minutos`, `tiempo_tolerancia_minutos`, `requiere_exposicion`, `estacion_inicial` }

### Colección: `oatc` (Orden de Atención en Cola)
Controlador del ciclo de vida del proceso en el salón en tiempo real.
- `oatc_id`, `correlativo`, `fecha`, `tipo_oatc`, `prioridad`, `estado_proceso`
- `cliente`: { `id`, `nombre_completo` }
- `agente_asignado`: { `id`, `apodo` }
- `estaciones_ocupadas`: Arreglo de strings (ej: ["tocador_02"])
- `linea_tiempo_trazabilidad`: { `hora_registro_ingreso`, `inicio_espera`, `fin_espera_inicio_atencion`, `ingreso_laboratorio`, `salida_laboratorio`, `hora_resuelto` }
- `tiempo_exposicion_manual_minutos`: (Integer, editable manualmente si el servicio lo requiere)
- `alertas_calidad`: { `alerta_espera_excedida`, `alerta_tiempo_servicio_excedido` }

### Colección: `ventas_caja`
Estructura inmutable para el POS minorista y de servicios.
- `venta_id`, `ticket_id`, `oatc_id`, `fecha_transaccion`, `canal_venta`, `cliente_id`, `agente_id`
- `items_vendidos`: Lista de objetos { `bien_id`, `tipo`, `nombre`, `cantidad`, `precio_unitario`, `subtotal` }
- `totales`: { `monto_original`, `monto_descuento`, `monto_final`, `comision_agente_calculada` }
- `documento_pago`: { `tipo`, `numero`, `ruc_asociado`, `metodo_pago` }

## 3. Infraestructura y Reglas Físicas de los 5 Salones
- **Estaciones Estilismo:** Tocadores iniciales de trabajo.
- **Estaciones Cosmiatría:** Mesas iniciales de trabajo.
- **Áreas Comunes:** Espera, Lavado de cabeza y Cabinas con camillas (masajes, faciales, pestañas).
- **Laboratorio:** Espacio físico exclusivo para el control, pesaje y despacho de insumos para servicios en curso.