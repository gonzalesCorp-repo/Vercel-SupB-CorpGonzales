---
tipo: documento_estrategico_maestro
nombre: "Vaikuntha ERP — Filosofía Comercial, Concepto de Bienes, Estaciones por Etapas & Gobernanza Agnóstica"
estado: "Documentado & Masterizado (Ampliación Universal FOH/BOH, Cocina/Lab & Sub-recetas)"
prioridad: "Crítica"
tech_stack:
  - PostgreSQL 15 JSONB GIN Indexing
  - Multi-Sede & Multi-Marca Single-Tenant
  - Web Serial / Web Bluetooth IoT Scale Adapter
  - Motor de Recetas & Sub-recetas (Mise en Place / Bienes Intermedios)
  - Pipeline de Estaciones por Etapas de Proceso
  - Fichas de Diagnóstico & CRM Técnico/Clínico
  - Árbol Jerárquico de 3 Niveles (Divisiones ➔ Líneas ➔ Bienes)
  - Matriz de Habilidades con Herencia y Override Granular
  - Sintetizador Web Audio API & Alertas Hápticas de Cartera
tags:
  - erp/pitch-comercial
  - arquitectura/bienes-mutables
  - procesos/estaciones-pipeline
  - foh-boh/cocina-laboratorio
  - logistica/mise-en-place-subrecetas
  - gobernanza/delegacion-escalabilidad
---

# 🏛️ Vaikuntha ERP: Filosofía Comercial, Estaciones por Etapas & Gobernanza Agnóstica

> *"Vaikuntha ERP está diseñado bajo un principio fundamental: **reducir la fricción operativa en tareas con demanda variable**, mientras otorga **control, trazabilidad y gobernanza quirúrgica** al dueño o administrador para moldear su portafolio de bienes, calibrar la rentabilidad por línea y coordinar la cadena de valor física y virtual de su negocio."*

---

## 🎯 1. Pitch Comercial B2B: Cómo Vender el Producto sin Marear al Comprador

Para presentar Vaikuntha ERP a un dueño de negocio, inversionista o gerente sin abrumarlo con tecnicismos, la narrativa se estructura en **3 capas intuitivas**:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │          🏛️ CAPA 1: ACTIVIDADES TRANSVERSALES           │
                  │   CRM & Front  •  Caja POS  •  WMS Stock  •  WFM Piso   │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                  ┌────────────────────────────▼────────────────────────────┐
                  │          👑 CAPA 2: GOBERNANZA & DELEGACIÓN             │
                  │   SuperAdmin ➔ Admin ➔ Jefe Piso ➔ Soporte ➔ Staff     │
                  └────────────────────────────┬────────────────────────────┘
                                               │
                  ┌────────────────────────────▼────────────────────────────┐
                  │          📈 CAPA 3: ESCALABILIDAD MULTI-SEDE            │
                  │      Multi-Sede  •  Multi-Marca  •  Multi-RUC SUNAT     │
                  └─────────────────────────────────────────────────────────┘
```

### A. Capa 1: Cobertura de las 4 Áreas Universales
Todo negocio de servicios físicos o transformación (salones, barberías, clínicas, odontología, spas, coworking, restaurantes o talleres) realiza exactamente 4 actividades:
1. **Recepción & CRM**: Registro de clientes, citas, llegada y hospitalidad.
2. **Punto de Venta (POS & Finanzas)**: Emisión de boletas/facturas, formas de pago flexibles y arqueo ciego de caja.
3. **Logística & Almacén (WMS & Transformación)**: Control de productos terminados, insumos fraccionados por gramos/unidades y productos intermedios (sub-recetas).
4. **Talento & Estaciones (WFM)**: Asignación de colaboradores a estaciones y cálculo automático de comisiones.

### B. Capa 2: Gobernanza y la Ecuación Control-Delegación
El ERP resuelve el dilema del fundador: *"¿Cómo delego responsabilidades sin que me roben o baje la calidad?"*:
- **Control & Trazabilidad**: Cada movimiento de inventario, cambio de precio, descuento o venta queda auditado con autor y hora.
- **Delegación Quirúrgica**: El `ADMIN` puede habilitar o deshabilitar herramientas una por una al personal de `SOPORTE` desde la Matriz de Usuarios (`/admin/usuarios`), permitiendo que los colaboradores crezcan dentro de la empresa asumiendo más funciones sin riesgo.

### C. Capa 3: Crecimiento Multi-Sede y Portafolio Multi-Marca
El sistema está preparado para operar una sola sede o una cadena de franquicias con distintas razones sociales (Multi-RUC SUNAT) y diferentes marcas bajo un mismo tablero central.

---

## 🔄 2. La Filosofía del Bloque WORKSPACE: La Estación Virtual de Trabajo & Pipeline por Etapas

En la barra de navegación del ERP, la sección **WORKSPACE** no es una carpeta más de opciones; representa el núcleo operativo:

> **Definición de Workspace**: Es el espacio digital que reúne las actividades del equipo de soporte (Recepción, Caja, Taller/Cocina) en torno a una **Estación de Trabajo** para servir a un cliente.

```mermaid
graph LR
    subgraph WORKSPACE ["🔄 BLOQUE WORKSPACE"]
        REC["🛎️ Workspace Recepción<br/>(Anfitrionaje & Citas)"]
        POS["💵 Punto de Venta / Caja<br/>(Cobranza & Arqueo)"]
        ODI["🧪 Despacho Lab / Cocina (ODI)<br/>(Pesaje & Transformación)"]
    end

    ESTACION["💈 ESTACIÓN FÍSICA / VIRTUAL<br/>(Dibujada en el Mapa WFM)"]
    CLIENTE["👤 CLIENTE EN ATENCIÓN"]

    REC --> ESTACION
    POS --> ESTACION
    ODI --> ESTACION
    ESTACION --> CLIENTE
```

### A. La Estación como Eslabón de un Proceso Fluyente (Pipeline Operativo)
Una estación no es un punto estático aislado, sino una etapa dedicada dentro de un flujo secuencial donde el colaborador cuenta con herramientas específicas para su tarea:

```mermaid
flowchart LR
    subgraph SALON_BELLEZA ["💇 CASO SALÓN DE BELLEZA & SPA"]
        E1["1. Sillón de Diagnóstico<br/>(Tricoscopía / Ficha Técnica)"] 
        --> E2["2. Lavacabezas<br/>(Preparación & Lavado)"]
        --> E3["3. Silla de Coloración<br/>(Aplicación de Fórmula)"]
        --> E4["4. Zona de Styling<br/>(Corte & Acabado)"]
        --> E5["5. Caja POS<br/>(Cobro & Despacho Retail)"]
    end
```

```mermaid
flowchart LR
    subgraph RESTAURANTE ["🍽️ CASO GASTRONOMÍA & RESTAURANTE"]
        M1["1. Mesa / FOH<br/>(Recepción & Comanda en Vivo)"]
        --> M2["2. Cocina Partida Fría / Caliente<br/>(Mise en Place & Cocción)"]
        --> M3["3. Zona de Pase / Emplatado<br/>(Control de Calidad & Salida)"]
        --> M4["4. Servicio en Mesa<br/>(Consumo & Atención Anfitrión)"]
        --> M5["5. Caja POS<br/>(Split Billing & Facturación)"]
    end
```

---

## 🧪 3. El Módulo de Laboratorio como Centro Universal de Transformación (Cocina, Lab Químico o Taller de Preparación)

El **Módulo de Laboratorio / Despacho ODI (`/lab/despacho`)** es el motor de transformación y fraccionamiento del negocio. 

### A. Productos a Medio Terminar / Sub-Recetas (Mise en Place)
Muchos negocios no solo despachan materias primas puras o productos finales enlatados; elaboran **Bienes Intermedios** para que el servicio final sea ultrarrápido:

| Industria | Insumo Base (Materia Prima) | Bien Intermedio / Sub-Receta (Mise en Place) | Producto / Servicio Final Despachado |
| :--- | :--- | :--- | :--- |
| **💇 Salón de Belleza** | Tubo de Tinte 60g + Galonera Oxidante 20V | Bol de Mezcla de Coloración Balayage (120g) | Servicio de Balayage Signature en Silla |
| **🍽️ Restaurante** | Tomates, Cebollas, Ajos, Aceite de Oliva | Salsa Pomodoro Madre (Lote 5 kg en frío) | Plato de Pasta Fresca al Pomodoro en Mesa |
| **🥩 Restaurante Carnes** | Lomo Fino entero, Sal marina, Especias | Cortes porcionados y marinados (Cortes 300g) | Bife Angosto a la Parrilla en Mesa |
| **🍸 Bar & Coctelería** | Pisco Quebranta, Limón, Jarabe de goma | Mix Sour Base pre-elaborado (Lote 2L) | Cóctel Pisco Sour Clásico servido en barra |
| **🦷 Clínica Dental** | Polímero en polvo + Líquido monómero | Mezcla de Acrílico Dental Temporal | Corona Provisoria colocada al paciente |

```mermaid
flowchart TD
    MP["📦 MATERIAS PRIMAS (Kardex Almacén Central)<br/>(Harina, Aceite, Tintes, Polímeros)"]
    -->|Fase 1: Transformación en Lote| SUB["🧪 BIEN INTERMEDIO / SUB-RECETA (Lab / Cocina)<br/>(Salsas Madre, Mezcla Tintes, Marinados)"]
    SUB -->|Fase 2: Despacho Asistido en Comanda| FINAL["🍽️ SERVICIO O PLATO FINAL AL CLIENTE<br/>(Consumo en Silla / Mesa + Facturación POS)"]
```

- **Kardex en Dos Tiempos**:
  1. **Fase 1 (Producción del Lote Intermedio)**: Se descuentan materias primas primarias del almacén general y se da de alta stock en gramos/porciones del bien intermedio.
  2. **Fase 2 (Consumo por Comanda/OATC)**: Al solicitarse el plato o servicio, la balanza IoT o la comanda digital descuenta la porción exacta del bien intermedio en segundos.

---

## ⚖️ 4. La Dinámica FOH (Front of House) vs BOH (Back of House)

Vaikuntha ERP modela a la perfección la tensión y coordinación entre el frente y la retaguardia del negocio:

| Dimensión | 👥 Front of House (FOH) | 🍳 Back of House (BOH) / Laboratorio |
| :--- | :--- | :--- |
| **Ubicación Física** | Sala de Atención, Sillones, Mesas, Barra de Bar. | Cocina, Laboratorio de Tintes, Taller Químico, Sala de Esterilización. |
| **Perfil de Rol** | **`SOPORTE`** (Anfitriones, Meseros, Recepción). | **`STAFF / TÉCNICO`** (Cocineros, Chefs, Coloristas, Farmacéuticos). |
| **Contacto con Cliente** | **Directo y Permanente**. Hospitalidad, empatía, ritmo y resolución. | **Indirecto / Cero Contacto**. Enfoque total en el producto y receta. |
| **Naturaleza de Tareas** | Tareas cortas, ágiles, alta rotación, atención a pedidos y cobros. | Tareas de precisión, tiempos de cocción/mezcla, pesaje exacto y estandarización. |
| **Objetivo / Métrica Clave** | **Velocidad de respuesta, rotación de silla/mesa y ticket promedio**. | **Precisión en gramajes, tiempo de entrega de comanda y Cero Merma (Zero Waste)**. |
| **Herramienta ERP** | Tótem Kiosko, Monitor de Recepción, App Móvil FOH y POS. | Despacho ODI (`/lab/despacho`), Balanzas IoT y KDS (Kitchen Display System). |

---

## 📦 5. El Catálogo Jerárquico de Bienes (3 Niveles) & Rentabilidad

El portafolio se estructura en un **Árbol de 3 Niveles** que unifica servicios, productos terminados e insumos intermedios con trazabilidad financiera:

```mermaid
graph TD
    D["1. División Raíz / Categoría Madre<br/>(ej. Estilismo & Capilar, Cocina Caliente, Bar, Cosmiatría, Retail)"]
    L["2. Línea / Subcategoría de Negocio<br/>(ej. Colorimetría & Mechas, Pastas Artesanales, Coctelería de Autor)"]
    B["3. Bien / Ítem Específico<br/>(ej. Balayage Signature, Pasta Pomodoro con Burrata, Pisco Sour)"]

    D --> L --> B
```

### Cálculo Automático de Rentabilidad por Ítem:
$$\text{Margen Bruto} = \text{Precio Venta} - \text{Costo Insumos / Sub-recetas} - \left(\text{Precio Venta} \times \frac{\text{Comisión \%}}{100}\right)$$
$$\text{\% Margen} = \left(\frac{\text{Margen Bruto}}{\text{Precio Venta}}\right) \times 100$$

---

## 👥 6. Matriz de Habilidades del Staff (Herencia + Override Granular)

En lugar de listas rígidas de un solo oficio, Vaikuntha ERP implementa un modelo híbrido:
1. **Herencia por Línea**: Asignar a un colaborador una línea de negocio lo habilita automáticamente para todos los servicios de esa categoría.
2. **Override Granular (Inclusiones / Exclusiones)**: El administrador puede excluir preparaciones complejas para aprendices o incluir preparaciones cruzadas.
3. **Reflejo en Piso y Móvil**: En la Cola en Vivo ([`TabCola.tsx`](file:///C:/Users/Admin/.gemini/antigravity/scratch/ERP-Supabase-VERCEL-Gonzales/src/components/mobile/TabCola.tsx)), el colaborador figura dinámicamente en todas las ramas donde posee destreza.

---

## 🔔 7. Autogestión de Demanda de Cartera, Alertas Web Audio & Leads CRM

Cuando un cliente llega solicitando a su profesional preferido (`Demanda: Cliente`) y dicho colaborador ya se encuentra ocupado:
1. **Alerta Háptica + Tono Web Audio**: El teléfono del especialista emite un acorde armónico (`reproducirChimeNuevaOrden`) y vibra de forma pulsante.
2. **Modal de Autogestión**: El profesional puede solicitar esperar al cliente, agendar una cita próxima o, si el cliente no puede esperar, generar automáticamente un **Lead de Recuperación CRM** en `public.crm_leads`.
