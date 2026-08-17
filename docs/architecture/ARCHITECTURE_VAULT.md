# 🏛️ Vault de Arquitectura & Diagramas del ERP (Obsidian Ready)

Este documento sirve como la **Base de Conocimiento Vivo** y mapa conceptual del sistema **Vaikuntha Enterprise ERP (Next.js + Supabase + Realtime)**. Está formateado con sintaxis compatible con **Obsidian** y diagramas **Mermaid**.

---

## 📊 1. Diagrama Entidad-Relación (ERD Base de Datos Supabase)

```mermaid
erDiagram
    sedes ||--o{ sedes_usuarios : "pertenece a"
    agentes ||--o{ sedes_usuarios : "asignado a"
    agentes ||--o{ oatc : "atiende"
    clientes ||--o{ oatc : "solicita"
    sedes ||--o{ oatc : "registrada en"
    oatc ||--o{ comprobantes : "facturada en"
    clientes ||--o{ cuentas_corrientes : "mantiene línea"
    agentes ||--o{ asistencias_turnos : "registra asistencia"
    
    sedes {
        uuid id PK
        string nombre
        string direccion
        jsonb config_toggles
        timestamp created_at
    }

    agentes {
        uuid id PK "Matches auth.users id"
        string nombre
        string email
        string rol "SUPERADMIN | ADMIN | JEFE_OPERATIVO | SOPORTE | STAFF"
        string estado "ACTIVO | INACTIVO"
        string estado_operativo "DISPONIBLE | OCUPADO | EN_DESCANSO | FUERA_TURNO"
        string regimen_laboral "HONORARIOS_RHE | PLANILLA_5TA"
        numeric sueldo_base
        string tipo_pension "AFP | ONP"
        boolean asignacion_familiar
        numeric porcentaje_comision
        numeric tarifa_hora
        timestamp ultimo_cambio_estado
    }

    comprobantes {
        uuid id PK
        string tipo "BOLETA | FACTURA | NOTA_VENTA"
        string serie "B001 | F001"
        integer correlativo
        numeric subtotal
        numeric igv
        numeric total
        string medio_pago
        jsonb metadata_fiscal
        string estado_sunat
    }

    cuentas_corrientes {
        uuid id PK
        uuid cliente_id FK
        numeric limite_credito
        numeric saldo_utilizado
        string estado
    }

    asistencias_turnos {
        uuid id PK
        string agente_id
        string tipo_movimiento "ENTRADA | SALIDA | REFRIGERIO_IN | REFRIGERIO_OUT"
        string punto_acceso
        jsonb metadatos "requiere_validacion_horas"
        timestamp timestamp_registro
    }

    sedes_usuarios {
        uuid id PK
        uuid agente_id FK
        uuid sede_id FK
    }

    clientes {
        uuid id PK
        string nombre
        string dni
        string celular
        string email
    }

    oatc {
        uuid id PK
        string codigo_ticket
        uuid cliente_id FK
        uuid agente_id FK
        uuid sede_id FK
        string estado_proceso "EN_ESPERA | ASESORIA | EN_CURSO | PRE_COBRADO | FINALIZADO | CANCELADO"
        jsonb punto_partida "Servicios solicitados"
        numeric monto_total
        timestamp created_at
    }

    system_logs {
        uuid id PK
        uuid agente_id FK
        string tipo "WFM | ASISTENCIA | OPERACION | AUTH"
        string detalle
        timestamp created_at
    }
```

---

## 🔄 2. Flujo de Datos: Marcación WFM & Tag NFC (Sin Intermediación)

```mermaid
sequenceDiagram
    autonumber
    actor Operario as Operario Móvil (/mobile)
    participant NFC as Tag NFC / WebNFC
    participant DB as Supabase DB (agentes & system_logs)
    participant Realtime as Supabase Realtime Channel
    actor Recepcion as Monitor Recepción & Tótem

    Operario->>NFC: Toca Tag NFC de Sede o presiona Alerta Rápidas
    NFC->>DB: UPDATE agentes.estado DIRECTO (DISPONIBLE/PAUSA/INACTIVO)
    NFC->>DB: INSERT INTO system_logs (tipo: ASISTENCIA)
    DB-->>Realtime: Evento postgres_changes (*, table: agentes)
    Realtime-->>Operario: Actualiza Badge & Posición en Cola (#2)
    Realtime-->>Recepcion: Actualiza Dashboard de Asistencia sin requerir validación
```

---

## ⚡ 3. Flujo de Vida de una OATC (Atención Operativa)

```mermaid
flowchart TD
    A[🛎️ Recepción registra Cliente / OATC] -->|Estado: EN_ESPERA| B(📋 Cola de Espera en Sede)
    B -->|Asignación a Operario| C{📱 App Móvil Operario}
    C -->|Botón Iniciar| D[⚡ Estado: EN_CURSO]
    D -->|Servicios en atención| E[🎨 Peinado / Colorimetría / Corte]
    E -->|Botón Pre-Cobrar| F[💳 Estado: PRE_COBRADO]
    F -->|Envío a Caja / Despacho| G[🛍️ Módulo de Caja & Productos]
    G -->|Cobro Completado| H[🏁 Estado: FINALIZADO]
```

---

## 🤖 4. Estrategia de Subagentes & Mapeo Pre-Ejecución

Para cada requerimiento o refactorización futura en la webapp:

```mermaid
flowchart LR
    Sub1[🔍 Agent Researcher] -->|1. Consulta Vault & Schemas| Vault[(ARCHITECTURE_VAULT.md)]
    Vault -->|2. Retorna tipos e interfaces exactas| Sub2[🛠️ Agent Developer]
    Sub2 -->|3. Aplica cambios en código| Code[💻 Next.js / Supabase]
    Code -->|4. Validador TypeScript| Test[🧪 npx tsc --noEmit]
    Test -->|5. Actualiza Diagramas y Vault| Vault
```
