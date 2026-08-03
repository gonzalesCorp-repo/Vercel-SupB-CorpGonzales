# Vaikuntha ERP

> *"Un lugar libre de ansiedad o de toda obstrucción"* — inspirado en el templo Vaikuntha Perumal

Sistema ERP de gestión operativa para salones de belleza, construido con Next.js 14 + Supabase + Realtime. Cubre el ciclo completo de atención al cliente con módulos de recepción, caja, inventario, WFM, gamificación Octalysis y portal de fidelización de clientes.

---

## Stack Tecnológico

| Capa | Tecnología |
|:---|:---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Estilos | Tailwind CSS, Framer Motion |
| Estado Global | Zustand |
| Base de Datos | Supabase (PostgreSQL) + Realtime |
| Autenticación | Supabase Auth (JWT + email/password) |
| Despliegue | Vercel (CI/CD automático desde GitHub) |
| Iconos | Lucide React |
| Hardware | Web NFC API (Android Chrome/Edge) |

---

## Prerequisitos

- Node.js >= 18
- npm >= 9
- Cuenta Supabase con proyecto activo
- Cuenta Vercel (para despliegue)

---

## Variables de Entorno

Copia `.env.example` a `.env.local` y completa con tus valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción | Dónde obtenerla |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon pública | Supabase → Project Settings → API |

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:3000)
npm run dev

# Verificar tipos TypeScript (sin compilar)
npx tsc --noEmit

# Build de producción
npm run build
```

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── (dashboard)/          # Rutas protegidas con AppShell
│   │   ├── recepcion/        # CRM + Cola de atención
│   │   ├── caja/             # Cobros, comprobantes, arqueo
│   │   ├── wfm/              # Workforce Management
│   │   ├── lab/              # Inventario y laboratorio
│   │   ├── operaciones/      # Vista operaria desktop (STAFF)
│   │   ├── admin/            # Panel administración
│   │   ├── perfil/           # Perfil de usuario
│   │   └── dev/              # Canal desarrollador (SUPERADMIN)
│   ├── mobile/               # Shell móvil multi-rol + Octalysis
│   ├── cliente/              # Portal público de fidelización (QR)
│   └── login/                # Autenticación
├── components/
│   ├── layout/               # AppShell, NotificationTicker
│   ├── recepcion/            # 10 componentes de recepción
│   ├── mobile/               # 9 componentes móviles + gamificación
│   ├── wfm/                  # PanelWFM, BotonAsistencia
│   └── ui/                   # Componentes genéricos compartidos
├── lib/
│   ├── gamification/         # Engine Octalysis (config, engine, clientEngine)
│   └── supabase/             # Cliente Supabase (server/client)
├── services/                 # 15 módulos de acceso a datos
└── store/                    # 4 stores Zustand
```

---

## Roles de Usuario

| Rol | Canal | Acceso |
|:---|:---|:---|
| `SUPERADMIN` | Desktop + Mobile | Todo, incluyendo `/dev` |
| `ADMIN` | Desktop + Mobile | Todos los módulos excepto `/dev` |
| `RECEPCION` | Desktop + Mobile | `/recepcion`, `/wfm` |
| `CAJA` | Desktop + Mobile | `/caja` |
| `STAFF` | Mobile | `/mobile` (vista STAFF) |
| `DESPACHO` | Mobile | `/mobile` (vista DESPACHO) |
| `CLIENTE` | Portal Público | `/cliente?id={uuid}` vía QR |

---

## Módulos Principales

### 🛎️ Recepción & CRM
Cola de atención en tiempo real con Supabase Realtime. Gestión de OATCs (Órdenes de Atención al Cliente), agenda de citas, directorio CRM, historial y reportes.

### 💵 Caja & Finanzas
Cobros con pagos mixtos, sesiones de caja, arqueo, comprobantes electrónicos (Boleta/Factura) con series de emisor y correlativo automático.

### 📋 WFM (Workforce Management)
Panel de marcación de asistencia, gestión de peticiones inter-rol (cola_peticiones), configuración de tipos de petición y estados de agente.

### 🧪 Lab & Inventario
Stock en almacén principal y laboratorio, movimientos (Kardex), despacho de insumos, transferencias entre almacenes, métricas de inventario.

### 🎮 Gamificación Octalysis
Motor de XP, niveles (1-20), streaks de asistencia, 22 badges, kudos entre colegas y Hall de la Fama con ciclo económico mensual. Marketplace de recompensas canjeables con monedas 💎.

### 👤 Portal Cliente
Accesible vía QR o enlace directo. Muestra perfil de fidelidad, progreso de nivel, badges por visitas y marketplace de recompensas.

---

## Despliegue

El proyecto se despliega automáticamente en Vercel al hacer `git push origin main`.

Variables requeridas en Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Estado del Proyecto

> ⚠️ **v1.0 — Pre-producción.** El sistema no ha sido probado en campo. El módulo `/lab` está implementado pero pendiente de validación operativa.

**Módulos estables:** recepcion, caja, wfm, mobile, gamificación, portal cliente  
**Módulos pendientes de prueba:** lab/inventario, comprobantes electrónicos  
**Deuda técnica:** Ver `docs/DEUDA_TECNICA.md`
