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
    agentes ||--o{ system_logs : "genera"
    
    sedes {
        uuid id PK
        string nombre
        string direccion
        timestamp created_at
    }

    agentes {
        uuid id PK "Matches auth.users id"
        string nombre
        string email
        string rol "SUPERADMIN | ADMIN | RECEPCION | CAJA | DESPACHO | STAFF"
        string estado "DISPONIBLE | OCUPADO | PAUSA | INACTIVO"
        timestamp updated_at
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
