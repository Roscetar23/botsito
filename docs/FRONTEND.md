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

## 4. Identidad de marca 🎨

Fuente: `myDesign/IdentidadDeMarca/Colores.png` y `myDesign/Logotipo/`. **Tema oscuro = principal.**

### 4.1 Colores (hex exactos de la guía de marca)

| Rol | Nombre en la guía | Hex | Uso |
|---|---|---|---|
| **Primario** | Morado | `#44237B` | Base de la app y del robot; **todo gira en torno a él**. Marca, botones, iconos. |
| **Terciario** | Azul | `#3944E7` | Acento secundario, en menor medida pero **siempre presente** (brillos, detalles, foco). |
| **Secundario oscuro** | Negro | `#1E1E1E` | Fondo del **tema oscuro (principal)**. |
| **Secundario claro** | Blanco | `#FFFFFF` | Fondo del tema claro / texto sobre oscuro. |

> El morado es intenso y oscuro; para elementos interactivos (botón, hover) se usa una **variante
> más brillante** derivada (p. ej. `#6E3FD0`) manteniendo `#44237B` como base de marca.

### 4.2 Tipografía

- **Exo 2** para **toda la aplicación** (Google Fonts). Se carga con `next/font/google` en
  `layout.tsx` y se expone como variable (`--font-exo2`) aplicada al `body`. Pesos: 400/600/700.

### 4.3 Logotipo (dos variantes por tema)

Robot con audífonos morados + dos "ojos" (uno blanco, uno azul terciario) + wordmark **"BotCito"**.

| Archivo fuente | Tema | Texto | Copia en el cliente |
|---|---|---|---|
| `myDesign/Logotipo/Logotipo Final.png` | **Oscuro** (principal) | blanco | `apps/client/public/brand/logo-dark.png` |
| `myDesign/Logotipo/Group 3.png` | **Claro** | oscuro (`#1E1E1E`) | `apps/client/public/brand/logo-light.png` |

### 4.4 Tokens (variables CSS — tema oscuro por defecto)

Viven en `global.css` (o `theme.css`); si crecen los átomos (botón/input/card), pasan a `libs/shared/ui`.

| Token | Valor (oscuro) |
|---|---|
| `--bg` | `#141018` → `#1E1E1E` (fondo, con leve tinte morado) |
| `--surface` | `rgba(255,255,255,.04)` (tarjetas) |
| `--border` | `rgba(255,255,255,.10)` |
| `--text` / `--text-muted` | `#FFFFFF` / `rgba(255,255,255,.65)` |
| `--primary` / `--primary-bright` | `#44237B` / `#6E3FD0` |
| `--accent` (terciario) | `#3944E7` |
| `--danger` | `#ff6b6b` |
| `--radius` / `--radius-lg` | `10px` / `16px` |
| `--font-exo2` | (lo inyecta `next/font`) |

---

## 5. Roadmap visual

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

- [~] **FE-1 — Login / Registro con diseño.** Pulir la vista de acceso (layout, jerarquía, estados,
      validación, marca). **En curso.**
- [ ] **FE-2 — Vista Home.** Dashboard con el avatar como protagonista + secciones (tareas, etc.).
- [x] **FE-3 — Tokens + tema claro/oscuro.** Variables CSS en `global.css` (oscuro + `[data-theme='light']`),
      `ThemeProvider`/`useTheme` (persiste en `localStorage`, script anti-flash), `ThemeToggle` (sol/luna).
      Logo sensible al tema (`Logotipo Final` oscuro / `Group 3` claro) en ambos lados del split.
- [ ] **FE-4 — Layout & marca.** `metadata` real (título/descr.), favicon, tipografía.
- [ ] **FE-5 — Responsive + a11y pass.** Revisión de breakpoints, foco y contraste.

---

## 6. Decisiones visuales

- **FD-01 CSS Modules (no framework CSS)** · *Pro:* cero deps, co-localizado, coherente con lo hecho.
  *Con:* sin utilidades; se compensa con tokens/átomos compartidos.
- **FD-02 Tokens por variables CSS** · *Pro:* tema consistente, cambia en un sitio, funciona sin build.
- **FD-03 Tema oscuro por defecto (principal)** · decisión de marca; el claro es secundario.
- **FD-04 Marca BotCito** · primario `#44237B` + terciario `#3944E7`; fuente **Exo 2**; logo con dos
  variantes (oscuro/claro). Ver §4.

---

## 7. Log

- 2026-07-12 — Documento creado. Estado: auth (login/registro) funcional con diseño básico; avatar
  terminado; sin sistema de diseño aún. Próximo: **FE-1** (diseño de login/registro).
- 2026-07-12 — **Identidad de marca añadida** (§4): colores exactos (primario `#44237B`, terciario
  `#3944E7`, secundarios `#1E1E1E`/`#FFFFFF`), fuente **Exo 2**, logo en dos variantes (oscuro=principal
  / claro). Guía de layout del login por captura del usuario. Arranca la implementación de **FE-1**.
