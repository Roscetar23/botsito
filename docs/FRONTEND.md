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
<AppShell>                            ← ThemeProvider + AuthProvider, puertea por sesión
 ├─ cargando…                         (rehidratando sesión)
 ├─ SIN sesión → pantalla split:
 │    ├─ izq: AccessPanel (logo + tarjeta con MODELO 3D feliz + "acceso seguro")
 │    └─ der: header (toggle de tema) + AuthPanel (portal, tabs login/registro, campos)
 └─ CON sesión → topbar (logo + usuario + toggle + salir) + AvatarPlayground
```

- **Acceso (login/registro):** rediseño **split-screen** de marca (BotCito). Panel izquierdo con el
  **modelo 3D real** (feliz, mirada al cursor); derecho con **tabs** login/registro, campos con iconos
  SVG, mostrar/ocultar contraseña y transición suave al alternar. `@asistente/auth-ui` = el formulario;
  `AccessPanel`/`AppShell` (en `apps/client`) = el layout y el 3D. **Funcional y con diseño.**
- **Tema claro/oscuro:** `ThemeProvider`/`useTheme` + `ThemeToggle` (oscuro por defecto). Ver §4/§FE-3.
- **Avatar:** `@asistente/avatar-ui` → `AvatarPlayground` (toggle 2D/3D, emociones, controles). **TERMINADO**
  visualmente (ver [`AVATAR.md`](./AVATAR.md) / [`AVATAR-ANIMACIONES.md`](./AVATAR-ANIMACIONES.md)).
- **Estilos:** **CSS Modules por componente** + **tokens** (variables CSS) de marca en `global.css`.
  Tipografía **Exo 2**, metadata real ("BotCito").

---

## 2. Estructura del frontend

App delgada + UI en libs (D-06). Todo componente con estado/efectos lleva `'use client'`.

| Lib / carpeta | Qué contiene |
|---|---|
| `apps/client/src/app` | Composición y rutas: `page.tsx`, `layout.tsx`, `_components/*` (app-shell, avatar-playground, three-controls, state-buttons, mode-toggle, avatar-3d-lazy). |
| `libs/auth/ui` (`@asistente/auth-ui`) | `AuthPanel`, `AuthProvider`/`useAuth`, cliente API, storage de tokens. |
| `libs/avatar/ui` (`@asistente/avatar-ui`) | Avatar 2D (rig por capas) + 3D (R3F), máquina de estados, partes, gestos. |
| `libs/shared/ui` (`@asistente/shared-ui`) | Átomos/utilidades UI compartidas (poco poblada; candidata para los tokens/átomos). |

### 2.1 Vistas independientes (aisladas) 🔒

Cada **vista/pantalla** (acceso, Home, …) es un **módulo propio y autocontenido** (screaming
modular). **Regla dura: si una vista falla, no debe tumbar el resto de la app.**

- **Aislamiento por error:** cada vista se envuelve en un **error boundary**; si lanza, muestra un
  fallback local y las demás siguen vivas.
- **Carga diferida:** las vistas pesadas (p. ej. las que traen el 3D/WebGL) se montan con
  `next/dynamic`/lazy, para no arrastrar su código —ni sus fallos— a otras.
- **Sin acoplamiento cruzado:** una vista no importa el interior de otra; comparten solo vía
  `shared`/contextos (auth, tema). Se respetan las fronteras de módulos NX (§3.5 de `PLAN.md`).

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
Lo pinta `BrandLogo` (sensible al tema, `<img>` con alto fijo → mismo tamaño en ambos temas).
En la pantalla de acceso aparece **solo en el panel izquierdo**; con sesión, en el topbar.

| Archivo fuente | Tema | Texto | Copia en el cliente |
|---|---|---|---|
| `myDesign/Logotipo/Logotipo Final.png` | **Oscuro** (principal) | blanco | `apps/client/public/brand/logo-dark.png` |
| `myDesign/Logotipo/LogotipoClaroFinal.png` | **Claro** | oscuro (`#1E1E1E`) | `apps/client/public/brand/logo-light.png` |

> Variantes de **icono sin texto** disponibles (`Frame.png`/`logoBotcito 1.png` → `icon-dark/-light.png`),
> hoy sin uso activo tras el rediseño split.

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

- [x] **FE-1 — Login / Registro con diseño.** Rediseño **split-screen** de marca: panel izquierdo
      (logo + tarjeta con el modelo 3D feliz) y derecho (tabs login/registro, campos con iconos,
      mostrar/ocultar contraseña, transición suave). Claro/oscuro. **Hecho** (afinado con el usuario).
- [~] **FE-2 — Vista Home (pantalla base).** Dashboard con el avatar como protagonista + secciones
      (tareas, etc.). **Fase propia detallada en §5.1** — se itera hasta completarla. **En curso.**
- [x] **FE-3 — Tokens + tema claro/oscuro.** Variables CSS en `global.css` (oscuro + `[data-theme='light']`),
      `ThemeProvider`/`useTheme` (persiste en `localStorage`, script anti-flash), `ThemeToggle` (sol/luna).
      Logo sensible al tema (`Logotipo Final` oscuro / `LogoClaro` claro), **solo en el panel izquierdo**.
- [ ] **FE-4 — Layout & marca.** `metadata` real (título/descr.), favicon, tipografía.
- [ ] **FE-5 — Responsive + a11y pass.** Revisión de breakpoints, foco y contraste.

### 5.1 Fase FE-2 — Home (pantalla base) 🏠 — EN CURSO

La **Home** es la pantalla principal tras el login y **la base del producto**: sobre ella se
conectará el backend (tareas, recordatorios, notificaciones) y el avatar reactivo. Es la vista más
importante antes de retomar backend. Se construye **iterando varias veces** con el usuario (yo no
veo el navegador → cada paso se valida visualmente). Es una **vista independiente/aislada** (§2.1).

Iteraciones previstas (se refinan sobre la marcha, no son fijas):

- [ ] **H-0 — Estructura aislada.** La Home como vista propia y autocontenida (módulo + **error
      boundary** + carga diferida), montada tras el login en lugar del playground de avatar. Shell base.
- [ ] **H-1 — Layout de marca.** Distribución (barra/nav + área principal) con el **avatar** como
      presencia protagonista. Según el diseño/mockup que dé el usuario.
- [ ] **H-2 — Secciones (placeholders).** Zonas/tarjetas para **tareas**, **recordatorios** y
      **notificaciones** con estados vacíos, listas para cablear al backend.
- [ ] **H-3 — Avatar integrado.** El avatar presente (idle) y preparado para reaccionar a eventos/estado.
- [ ] **H-4 — Pulido.** Tokens, responsive, a11y y coherencia claro/oscuro.

> Resumen en [`PLAN.md`](./PLAN.md) (fase Frontend); el detalle fino y el avance por iteración, aquí.

---

## 6. Decisiones visuales

- **FD-01 CSS Modules (no framework CSS)** · *Pro:* cero deps, co-localizado, coherente con lo hecho.
  *Con:* sin utilidades; se compensa con tokens/átomos compartidos.
- **FD-02 Tokens por variables CSS** · *Pro:* tema consistente, cambia en un sitio, funciona sin build.
- **FD-03 Tema oscuro por defecto (principal)** · decisión de marca; el claro es secundario.
- **FD-04 Marca BotCito** · primario `#44237B` + terciario `#3944E7`; fuente **Exo 2**; logo con dos
  variantes (oscuro/claro). Ver §4.
- **FD-05 Vistas independientes/aisladas** · cada pantalla es un módulo autocontenido con error
  boundary y carga diferida → si una falla, no tumba el resto. *Pro:* robustez y desacople.
  *Con:* algo más de estructura por vista (se paga una vez). Ver §2.1.

---

## 7. Log

- 2026-07-12 — Documento creado. Estado: auth (login/registro) funcional con diseño básico; avatar
  terminado; sin sistema de diseño aún. Próximo: **FE-1** (diseño de login/registro).
- 2026-07-12 — **Identidad de marca añadida** (§4): colores exactos (primario `#44237B`, terciario
  `#3944E7`, secundarios `#1E1E1E`/`#FFFFFF`), fuente **Exo 2**, logo en dos variantes (oscuro=principal
  / claro). Guía de layout del login por captura del usuario. Arranca la implementación de **FE-1**.
- 2026-07-13 — **FE-1 login/registro** con marca: primero card centrada + bot 3D al lado; luego
  **rediseño split-screen** (según nuevo mockup del usuario): panel izquierdo (logo + tarjeta con el
  modelo 3D **feliz**, mirada al cursor) + derecho (tabs, campos con iconos SVG, ojo, transición suave).
- 2026-07-13 — **FE-3 tema claro/oscuro** con `ThemeToggle`; logo sensible al tema. Ajustes finales:
  logo claro = **`LogotipoClaroFinal.png`** (mismo estilo/tamaño que el oscuro) y logo **solo en el
  panel izquierdo**. Bug de mirada del bot (eje Y invertido) corregido en `usePointerRotation`.
  En oscuro se invirtieron los lados (izq. oscuro / der. morado).
- 2026-07-13 — Arranca **FE-2 Home (pantalla base)**: se añade su fase propia con iteraciones (§5.1)
  y el principio de **vistas independientes/aisladas** (§2.1, FD-05). Es la vista clave antes de
  retomar backend; se itera hasta completarla.
