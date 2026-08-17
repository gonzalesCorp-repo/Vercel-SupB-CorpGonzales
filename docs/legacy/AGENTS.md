# 🤖 AGENTS.md — Directrices de Desarrollo para Agentes Autónomos (Jules & AI Agents)

Bienvenido, agente de IA (Jules / Google Agent). Este archivo contiene las reglas arquitecturales, estándares de código y convenciones que debes seguir estrictamente al generar código, pruebas o refactorizaciones en este repositorio.

---

## 🛠️ 1. Stack Tecnológico & Entorno

- **Framework**: Next.js 14+ (App Router con TypeScript estricto).
- **Base de Datos & Backend**: Supabase (PostgreSQL, Realtime subscriptions, Row Level Security - RLS).
- **Estilos**: TailwindCSS y CSS Modules / Vanilla CSS.
- **Hardware Drivers**: ESC/POS para impresoras térmicas (58mm / 80mm), Web Bluetooth y Balanzas IoT.
- **Facturación Electrónica**: Conector SUNAT PSE (Nubefact / SUNAT REST API homologado con QR legal e IGV 18%).

---

## 📋 2. Reglas Arquitecturales y de Calidad (Strict Rules)

1. **Tipado Estricto TypeScript (Anti-Any)**:
   - Prohibido el uso de `any` injustificado. Define interfaces explícitas para DTOs, tablas de base de datos y payloads de API.
   - Antes de finalizar cualquier tarea, debes validar que no existan errores ejecutando:
     ```bash
     npx tsc --noEmit
     ```
2. **Arquitectura Limpia & Desacoplamiento**:
   - **`src/services/`**: Contiene la lógica de negocio, consultas a Supabase y conectores externos (APIs, hardware).
   - **`src/components/` & `src/app/`**: Componentes visuales y páginas que consumen los servicios; no incrustar lógica de negocio pesada directamente en JSX.
   - **`src/lib/`**: Utilidades puras y drivers de hardware.
3. **Resiliencia & Manejo de Errores (Anti-Symptom-Patching)**:
   - Siempre ataca la causa raíz (*Root Cause*). Prohibido silenciar errores con `try/catch` vacíos o directivas `@ts-ignore`.
   - Proporciona retroalimentación clara a través de `useUIStore.getState().showAlert(...)` o mensajes descriptivos en la UI.
4. **Seguridad & Políticas RLS en Supabase**:
   - Todo acceso a tablas debe considerar políticas RLS (`authenticated` / `anon`). Nunca asumas permisos de superusuario.

---

## 🔄 3. Convenciones de Commits y Flujo Git

- Realiza commits atómicos y descriptivos siguiendo la convención Conventional Commits:
  - `feat: ...` (Nuevas capacidades o módulos)
  - `fix: ...` (Corrección de bugs y causa raíz)
  - `test: ...` (Pruebas unitarias o de integración)
  - `refactor: ...` (Mejoras de código sin cambiar funcionalidad)
  - `docs: ...` (Actualizaciones de documentación)
- Antes de commitear cambios a la rama principal o abrir un PR, asegúrate de haber incorporado los cambios más recientes del repositorio (`git pull --rebase`).
