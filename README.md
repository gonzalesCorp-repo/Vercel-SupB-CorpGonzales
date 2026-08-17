# 💎 Vaikuntha Enterprise ERP

> *"Un lugar libre de ansiedad o de toda obstrucción"* — Arquitectura operativa integral para salones de belleza y centros de estética de alto rendimiento.

Plataforma ERP Enterprise construida sobre **Next.js 14 (App Router) + Supabase Realtime + Zustand + Watermelon UI Patterns**, que centraliza el flujo de atención al cliente, facturación SUNAT, gestión de inventarios WMS/IoT, Workforce Management (WFM) y experiencia móvil para colaboradores.

---

## ⚡ Capacidades Principales

### 🛎️ 1. Workspace de Recepción Multitarea
- **Transiciones Optimistas a 0ms**: Creación, actualización y cancelación de OATCs con actualización instantánea de interfaz y rollback automático en caso de fallo de red.
- **Autocompletado Inteligente (`SmartClientAutocomplete`)**: Búsqueda fuzzy debounced por DNI, Nombre o Celular, detección automática de clientes VIP y modal de creación rápida en 1-clic.
- **Barra Ejecutiva en Tiempo Real (`Live Status Strip`)**: Métricas conectadas a base de datos (Atenciones en Curso, Staff en Piso Activo y Tiempo Promedio Actual).

### 💵 2. Caja & Facturación POS
- Cobros con pagos mixtos (Efectivo, Tarjeta, Yape/Plin), arqueo ciego por turno, comprobantes electrónicos (Boletas y Facturas) con emisión correlativa.

### 🧪 3. WMS & Laboratorio de Colorimetría (`/lab/stock`)
- **Inventario Distribuido**: Control sincronizado entre Almacén Central y Laboratorio de Color.
- **Traslado Rápido a Lab**: Mover insumos en 1-toque deduciendo de Central y registrando el Kardex en tiempo real.
- **Métricas & Alertas**: Monitoreo de stock crítico ($< 10$ unidades) y reposición programada.

### 📱 4. Suite Operativa Móvil (PWA)
- Shell móvil minimalista con **Selector de Modo Claro / Oscuro** y paleta de acentos personalizable.
- **Cola de Piso Dinámica**: Rotación de turnos en tiempo real con detección precisa de estado en piso vs. fuera de turno.
- Vinculación de estaciones físicas mediante **Web NFC**.

### 🎨 5. Gobernanza Visual & Catálogo de Skins (`/admin/config`)
- Colección de skins de alta fidelidad (*EVA-01 Test Type, EVA-02 Production, Cyberpunk 2077 Night City, Matrix Code, Lumina Gold Luxury*).
- Controles de brillo reactivo con CSS Houdini y gestión de sellos visuales por sede.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|:---|:---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript (Strict Mode) |
| **Estilos & UI** | Vanilla Tailwind CSS, Watermelon Patterns, Motion Primitives, Framer Motion |
| **Estado Global** | Zustand (Store modular desacoplado) |
| **Backend & BD** | Supabase (PostgreSQL) + Realtime Channels (WebSockets) |
| **Autenticación** | Supabase Auth (JWT con sesión persistente resiliente) |
| **Testing** | Playwright E2E Test Suite (Multi-rol & UI Crawler) |
| **Despliegue** | Vercel CI/CD Automático |

---

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js >= 18.17.0
- npm >= 9.0.0

### Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/gonzalesCorp-repo/Vercel-SupB-CorpGonzales.git
cd Vercel-SupB-CorpGonzales

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-publica

# 4. Iniciar servidor de desarrollo (http://localhost:3000)
npm run dev
```

### Comprobación de Calidad & Tests

```bash
# Verificación de Tipos TypeScript (0 errores)
npx tsc --noEmit

# Ejecutar Suite Completa de Pruebas E2E (Playwright)
npm run test:e2e
```

---

## 👑 Cuentas de Acceso Sandbox (1-Clic)

El sistema incluye botones de ingreso directo en `/login` para pruebas y demostraciones:

| Rol | Correo Sandbox | Acceso Principal |
|:---|:---|:---|
| 👑 **SUPERADMIN** | `cristian@gonzales.page` | Acceso Global a todos los módulos y `/admin/config` |
| 🏢 **ADMIN** | `platon@vaikuntha.com` | Gestión de Sedes, Personal y Catálogo Maestro |
| 🛎️ **RECEPCIÓN** | `socrates@vaikuntha.com` | Workspace de Recepción & Monitor de Cola |
| 💵 **CAJA & POS** | `tales@vaikuntha.com` | Workspace de Venta, Cobros y SUNAT |
| 💈 **STAFF** | `democrito@vaikuntha.com` | Suite Móvil de Estación & Cola de Piso |

---

## 📁 Estructura del Repositorio

```
📦 Vercel-SupB-CorpGonzales/
├── 📁 src/                      # Código fuente de la aplicación
│   ├── 📁 app/                  # Next.js App Router (Dashboard, Mobile, Kiosk)
│   ├── 📁 components/           # Componentes UI (Recepción, WMS, Watermelon, Motion)
│   ├── 📁 lib/                  # Clientes Supabase y utilidades
│   ├── 📁 services/             # Servicios desacoplados de backend
│   └── 📁 store/                # Stores de Zustand (App, Theme, UI)
├── 📁 supabase/
│   └── 📁 migrations/           # Migraciones SQL consolidadas de base de datos
├── 📁 scripts/
│   └── 📁 dev/                  # Scripts de diagnóstico, seed y utilidades
├── 📁 docs/                     # Documentación técnica organizada
│   └── 📁 legacy/               # Archivos históricos y datos de migración
├── 📁 tests/                    # Tests E2E de Playwright
├── 📄 package.json              # Dependencias y scripts de ejecución
├── 📄 playwright.config.ts      # Configuración de pruebas automatizadas
└── 📄 README.md                 # Documentación principal del proyecto
```

---

## 🔒 Licencia y Propiedad

Desarrollado para **Vaikuntha Enterprise ERP** por Corporación Gonzales. Todos los derechos reservados.
