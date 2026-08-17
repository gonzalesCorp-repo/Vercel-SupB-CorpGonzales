# 🏛️ 01. Arquitectura del Sistema & Base de Datos (Supabase PostgreSQL)
*Documento vivo compatible con Obsidian • Vaikuntha ERP v2.0*

---

## 📊 1. Diagrama Entidad-Relación Completo (ERD)

```mermaid
erDiagram
    sedes ||--o{ agentes : "emplea"
    sedes ||--o{ clientes : "atiende"
    sedes ||--o{ oatc : "aloja"
    sedes ||--o{ estaciones_piso : "contiene"
    sedes ||--o{ cola_peticiones : "gestiona"
    sedes ||--o{ sesiones_caja : "opera"
    
    agentes ||--o{ oatc : "especialista_asignado"
    agentes ||--o{ asistencias_log : "registra_marcacion"
    agentes ||--o{ pedidos_insumos : "solicita_lab"
    agentes ||--o{ cola_peticiones : "solicita_asistencia"
    
    clientes ||--o{ oatc : "recibe_servicio"
    clientes ||--o{ comprobantes_pago : "factura"
    
    oatc ||--o{ comprobantes_pago : "genera"
    oatc ||--o{ pedidos_insumos : "asocia_tintes"
    
    sesiones_caja ||--o{ comprobantes_pago : "recauda"
    sesiones_caja ||--o{ movimientos_caja : "registra_flujo"

    sedes {
        uuid id PK
        text nombre
        text direccion
        jsonb atributos "Toggles de sede y features"
        timestamptz created_at
    }

    agentes {
        uuid id PK
        text nombre
        text email
        text rol "SUPERADMIN | ADMIN | SOPORTE | STAFF | OPERACION"
        text estado "ACTIVO | INACTIVO (Cuenta Contable)"
        text estado_operativo "DISPONIBLE | OCUPADO | EN_REFRIGERIO | FUERA_DE_TURNO"
        varchar pin "PIN 4 dígitos (1111, 4444, etc.)"
        text especialidad
        timestamptz ultimo_cambio_estado
    }

    clientes {
        uuid id PK
        text nombre
        text dni
        text celular
        uuid sede_id FK
        timestamptz created_at
    }

    oatc {
        uuid id PK
        uuid cliente_id FK
        text cliente_nombre
        uuid agente_id FK
        text agente_nombre
        uuid sede_id FK
        text estado_proceso "EN_ESPERA | ASESORIA | EN_PROCESO | PRE_COBRADO | FINALIZADO | CANCELADO"
        text estado_pago "Pendiente | Pagado | Anulado"
        text tipo_demanda "Cliente | Recepción | Autogestión"
        jsonb punto_partida "Array de servicios y productos"
        jsonb cambios_pendientes "Upselling para aprobación"
        timestamptz hora_inicio_atencion
        timestamptz hora_fin_atencion
        timestamptz created_at
    }

    comprobantes_pago {
        uuid id PK
        uuid sesion_caja_id FK
        uuid oatc_id FK
        uuid sede_id FK
        text tipo_comprobante "BOLETA | FACTURA | TICKET"
        text serie
        text numero
        text cliente_nombre
        text cliente_documento
        numeric subtotal
        numeric igv
        numeric total
        numeric descuento
        jsonb desglose_items
        jsonb pagos "Desglose por método: Efectivo, Tarjeta, Yape"
        text estado "EMITIDO | ANULADO"
        timestamptz created_at
    }

    cola_peticiones {
        uuid id PK
        uuid sede_id FK
        uuid agente_id FK
        uuid oatc_id FK
        uuid tipo_id FK "Tipo de petición (Inicio Turno, Bar, etc.)"
        text estado "PENDIENTE | APROBADO | RECHAZADO"
        timestamptz created_at
    }

    estaciones_piso {
        uuid id PK
        uuid sede_id FK
        text codigo "Sillon_01, Cabina_02"
        text nombre
        text estado_ocupacion "LIBRE | OCUPADO | LIMPIEZA | RESERVADO"
        uuid oatc_activa_id FK
        uuid agente_actual_id FK
        timestamptz updated_at
    }

    reglas_etiquetas_clientes {
        uuid id PK
        text nombre "Cliente VIP, Retail VIP, etc."
        text codigo_slug
        text icono "Crown, Sparkles, HeartHandshake"
        text color_badge
        int prioridad
        bool activo
        jsonb criterios "min_visitas_30d, min_consumo_total_30d, etc."
        timestamptz created_at
    }
```

---

## 🔒 2. Taxonomía Estricta de Estados en `agentes`

Para evitar bloqueos administrativos y desacoplar el estado laboral del estado transaccional en piso:

| Columna | Valores Permitidos | Propósito & Reglas de Modificación |
| :--- | :--- | :--- |
| **`estado`** | `'ACTIVO'` \| `'INACTIVO'` | **Estado Administrativo de Contrato / Cuenta**. Solo puede ser modificado por el Superadmin en el panel `/admin/usuarios`. Ningún botón operativo, tag NFC o proceso WFM puede cambiar este valor. |
| **`estado_operativo`** | `'DISPONIBLE'` \| `'OCUPADO'` \| `'EN_REFRIGERIO'` \| `'FUERA_DE_TURNO'` | **Estado Dinámico en Piso**. Modificado en vivo por marcaciones NFC, Tótem Kiosko con PIN, asignación de OATC en Recepción y finalización de cobro en POS. |

---

## 🛡️ 3. Políticas de Seguridad (Row Level Security - RLS)

Todas las tablas operan con RLS habilitado en Supabase, con políticas simétricas para permitir funcionamiento sin fricción en terminales públicas de quiosco y POS:

1. **`public.oatc`**: Política `Permitir todo en oatc a public` para actualizaciones en tiempo real de recepción, quiosco y caja.
2. **`public.clientes`**: Política `Permitir todo en clientes a public` para autogestión y registro táctil en el Tótem Kiosko.
3. **`public.cola_peticiones`**: Política `Permitir todo en cola_peticiones a public` para solicitudes de cortesía de bar y autorizaciones con PIN.
4. **`public.comprobantes_pago`**: Política para emisión y cierre de sesiones de caja.

---

## 🔄 4. Flujo Realtime de Notificaciones (PostgreSQL Replication)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as 👥 Cliente en Kiosko
    participant Totem as 🖥️ Totem Kiosko (/kiosk)
    participant Supabase as 🗄️ Supabase DB
    participant Channel as 📡 Realtime Channel
    actor Especialista as 💈 App Móvil Especialista (/mobile)
    actor Recepcion as 🛎️ Monitor Recepción (/recepcion)

    Cliente->>Totem: Presiona "🎟️ Registrar mi Llegada"
    Totem->>Supabase: INSERT INTO public.oatc (estado_proceso: 'EN_ESPERA')
    Supabase-->>Channel: Broadcast evento 'postgres_changes' (INSERT)
    Channel-->>Recepcion: Actualiza Cola en Vivo + Sonido Campana
    Channel-->>Especialista: Alerta Háptica (Vibración) + Chime en Móvil
    Totem-->>Cliente: Muestra "#1 en Sala de Espera" + Tiempo estimado
```

---

## 🩺 5. Arquitectura de Auto-Sanación (*Self-Healing State*)

Para evitar errores como **HTTP 406 (Not Acceptable)** causados por memorias residuales en el `localStorage` de navegadores antiguos:
- El servicio [`sedesConfig.ts`](file:///C:/Users/Admin/.gemini/antigravity/scratch/ERP-Supabase-VERCEL-Gonzales/src/services/sedesConfig.ts) utiliza `.maybeSingle()` en lugar de `.single()`.
- Si el ID almacenado en la caché del navegador fue eliminado o modificado en Supabase, el sistema busca automáticamente la primera sede activa válida (`Unidad de Prueba (Sandbox)`), actualiza el `store` de Zustand (`useAppStore`) y sobreescribe el `localStorage` silenciosamente.
