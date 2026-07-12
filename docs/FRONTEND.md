# Frontend — Diseño y progreso visual

> Documento **vivo**. Recoge todo lo que se ve en pantalla: estructura del cliente, convenciones de
> estilo, el sistema de diseño (tokens/tema) y el roadmap visual. Complementa a
> [`PLAN.md`](./PLAN.md) (apartado Visual) y a [`AVATAR.md`](./AVATAR.md) (el avatar es su propio mundo).

- **App:** `apps/client` — **Next.js 16** (App Router, React 19), corre en **:3000** (backend en :3001).
- **Regla del repo:** ≤150 líneas por archivo, Screaming Architecture, app **delgada** (UI en `libs/*/ui`).

---

## 1. Estado actual (qué se ve hoy)

Flujo de la pantalla principal (`apps/client/src/app/page.tsx`):

```
<main "Asistente">
 └─ <AppShell>                       ← puertea por sesión (useAuth)
     ├─ cargando…                    (rehidratando sesión)
     ├─ <AuthPanel>                  ← SIN sesión: login / registro
     └─ cabecera "Sesión: … / Salir" + <AvatarPlayground>   ← CON sesión
```

- **Auth (login/registro):** `@asistente/auth-ui` → `AuthPanel` (card oscura, acento morado `#7c5cff`,
  toggle login↔registro, errores legibles). **Funcional, diseño básico** — es lo próximo a pulir.
- **Avatar:** `@asistente/avatar-ui` → `AvatarPlayground` (toggle 2D/3D, emociones, controles). **TERMINADO**
  visualmente (ver [`AVATAR.md`](./AVATAR.md) / [`AVATAR-ANIMACIONES.md`](./AVATAR-ANIMACIONES.md)).
- **Estilos:** **CSS Modules por componente**, sin framework CSS. `global.css` es el reset base
  (preflight de create-nx). **Aún no hay sistema de diseño** (tokens): colores/espaciados ad-hoc.
- **Pendiente cosmético:** `layout.tsx` tiene metadata genérica ("Welcome to client") y no hay favicon/tema.

---

## 2. Estructura del frontend

App delgada + UI en libs (D-06). Todo componente con estado/efectos lleva `'use client'`.

| Lib / carpeta | Qué contiene |
|---|---|
| `apps/client/src/app` | Composición y rutas: `page.tsx`, `layout.tsx`, `_components/*` (app-shell, avatar-playground, three-controls, state-buttons, mode-toggle, avatar-3d-lazy). |
| `libs/auth/ui` (`@asistente/auth-ui`) | `AuthPanel`, `AuthProvider`/`useAuth`, cliente API, storage de tokens. |
| `libs/avatar/ui` (`@asistente/avatar-ui`) | Avatar 2D (rig por capas) + 3D (R3F), máquina de estados, partes, gestos. |
| `libs/shared/ui` (`@asistente/shared-ui`) | Átomos/utilidades UI compartidas (poco poblada; candidata para los tokens/átomos). |

---

## 3. Convenciones de estilo

- **CSS Modules** co-localizados (`componente.module.css`), clases en `camelCase`.
- **Tokens por variables CSS** (a introducir en §4) en vez de valores mágicos repetidos.
- **Accesibilidad:** `aria-*` donde aplique, foco visible, respetar `prefers-reduced-motion`
  (el avatar ya lo hace). Contraste AA como objetivo.
- **Responsive:** móvil-primero, unidades relativas, sin scroll horizontal.

---

## 4. Sistema de diseño (a construir)

Hoy no existe; se creará al pulir login/registro y se centraliza para reutilizar. Propuesta inicial
(partiendo del morado actual), como **variables CSS** globales:

| Token | Uso | Valor tentativo |
|---|---|---|
| `--bg` | Fondo de la app | `#0e0e14` (oscuro) |
| `--surface` | Tarjetas/paneles | `rgba(255,255,255,.04)` |
| `--text` / `--text-muted` | Texto | `#f3f3f7` / `rgba(243,243,247,.7)` |
| `--accent` / `--accent-soft` | Acento (botones/links) | `#7c5cff` / `#b3a2ff` |
| `--danger` | Errores | `#ff6b6b` |
| `--radius` / `--radius-lg` | Radios | `10px` / `16px` |
| `--space-*` | Espaciado | escala 4/8/12/16/24… |

> Dónde vivirán: variables globales en `global.css` (o un `theme.css`) y, si crecen los átomos
> reutilizables (botón, input, card), en `libs/shared/ui`. Decidir tema **claro/oscuro** (hoy oscuro).

---

## 5. Roadmap visual

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

- [~] **FE-1 — Login / Registro con diseño.** Pulir la vista de acceso (layout, jerarquía, estados,
      validación, marca). **En curso.**
- [ ] **FE-2 — Vista Home.** Dashboard con el avatar como protagonista + secciones (tareas, etc.).
- [ ] **FE-3 — Tokens/tema compartido.** Extraer las variables de §4 y (opcional) átomos en `shared-ui`.
- [ ] **FE-4 — Layout & marca.** `metadata` real (título/descr.), favicon, tipografía.
- [ ] **FE-5 — Responsive + a11y pass.** Revisión de breakpoints, foco y contraste.

---

## 6. Decisiones visuales

- **FD-01 CSS Modules (no framework CSS)** · *Pro:* cero deps, co-localizado, coherente con lo hecho.
  *Con:* sin utilidades; se compensa con tokens/átomos compartidos.
- **FD-02 Tokens por variables CSS** · *Pro:* tema consistente, cambia en un sitio, funciona sin build.
- **FD-03 Tema oscuro por defecto** (revisable) · alineado con el look actual del avatar/panel.

---

## 7. Log

- 2026-07-12 — Documento creado. Estado: auth (login/registro) funcional con diseño básico; avatar
  terminado; sin sistema de diseño aún. Próximo: **FE-1** (diseño de login/registro).
