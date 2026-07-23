# Frontend — Diseño y progreso visual

> Documento **vivo**. Recoge todo lo que se ve en pantalla: estructura del cliente, convenciones de
> estilo, el sistema de diseño (tokens/tema) y el roadmap visual. Complementa a
> [`PLAN.md`](./PLAN.md) (apartado Visual) y a [`AVATAR.md`](./AVATAR.md) (el avatar es su propio mundo).

- **App:** `apps/client` — **Next.js 16** (App Router, React 19), corre en **:3000** (backend en :3001).
- **Regla del repo:** ≤150 líneas por archivo, Screaming Architecture, app **delgada** (UI en `libs/*/ui`).

---

## 1. Estado actual (qué se ve hoy)

Flujo de las pantallas autenticadas (`apps/client/src/app/(app)/layout.tsx`):

```
<AppShell>                            ← ThemeProvider + AuthProvider, puertea por sesión
 ├─ cargando…                         (rehidratando sesión)
 ├─ SIN sesión → pantalla split:
 │    ├─ izq: AccessPanel (logo + tarjeta con MODELO 3D feliz + "acceso seguro")
 │    └─ der: header (toggle de tema) + AuthPanel (portal, tabs login/registro, campos)
 └─ CON sesión → HomeView: barra lateral colapsable (logo + Inicio/Calendario + usuario/salir)
                 + topbar (toggle de tema) + la vista de la ruta activa:
                    ├─ `/`           → Visualizer (avatar 2D/3D con emociones, aislado)
                    └─ `/calendario` → CalendarView (rejilla del mes + modal del día)
```

**Rutas:** el grupo `(app)` monta el shell una sola vez; al navegar solo se recrea el `main`, así
la barra lateral conserva su estado (p. ej. colapsada). El item activo se deriva de `usePathname()`,
no de estado local → sobrevive a recargas y al botón "atrás".

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
| `apps/client/src/app` | Composición y rutas: `layout.tsx`, grupo **`(app)/`** (`layout` = shell, `page` = Inicio, `calendario/page`), `_components/*` (app-shell, **`home/`** [shell: view/sidebar/topbar/nav/user + visualizer], **`calendar/`** [vista aislada: view/card/grid-cell/day-modal + hook y utilidades de fecha], view-boundary, avatar-playground, three-controls, state-buttons, mode-toggle, avatar-3d-lazy). |
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
- [x] **FE-6 — Vista Calendario.** Ruta `/calendario` con la rejilla del mes y el modal de la agenda
      del día. **Conectada al backend de recordatorios**: crear/ver/editar/borrar, colores por tipo, y
      **disparo en tiempo real** (aviso in-app + ding + el robot reacciona). Ver §5.2 y
      [`BACKEND.md`](./BACKEND.md) (R-1…R-6).
- [x] **FE-7 — Vista Tareas (tablero de cards tipo Notion).** 🗂️ Vista propia (`/tareas`) con un
      **tablero Kanban de 3 columnas por estado** (Por hacer / En progreso / Hecho). Cada card lleva
      **notas** (reutiliza `description`), **barra de progreso** (0–100) y **prioridad** opcional; se
      crean con **alta rápida** por columna y se editan/borran en un **modal**. Desde la card se
      **adjuntan recordatorios** que quedan enlazados por `taskId` y **aparecen en el calendario**
      (enlaza **Tareas ↔ Reminders**). **Hecho** (v1). Ver §5.3.

### 5.1 Fase FE-2 — Home (pantalla base) 🏠 — EN CURSO

La **Home** es la pantalla principal tras el login y **la base del producto**: sobre ella se
conectará el backend (tareas, recordatorios, notificaciones) y el avatar reactivo. Es la vista más
importante antes de retomar backend. Se construye **iterando varias veces** con el usuario (yo no
veo el navegador → cada paso se valida visualmente). Es una **vista independiente/aislada** (§2.1).

Iteraciones previstas (se refinan sobre la marcha, no son fijas):

- [x] **H-0 — Estructura aislada.** La Home como vista propia y autocontenida (módulo `home/` +
      **error boundary** `ViewBoundary`), montada tras el login en lugar del playground. **Hecho** (Commit A).
- [x] **H-1 — Layout de marca.** Distribución (barra lateral colapsable + topbar + área principal)
      según el mockup del usuario. **Hecho**: shell (sidebar Inicio/Calendario + usuario/cerrar sesión;
      topbar solo con toggle de tema) + `Visualizer` en el `main` = avatar **2D/3D con emociones**
      (misma `emotion` para ambos modos; 3D contenido con la mirada al cursor, como el login).
- [ ] **H-2 — Secciones (placeholders).** Zonas/tarjetas para **tareas**, **recordatorios** y
      **notificaciones** con estados vacíos, listas para cablear al backend.
- [ ] **H-3 — Avatar integrado.** El avatar presente (idle) y preparado para reaccionar a eventos/estado.
- [ ] **H-4 — Pulido.** Tokens, responsive, a11y y coherencia claro/oscuro.

> Resumen en [`PLAN.md`](./PLAN.md) (fase Frontend); el detalle fino y el avance por iteración, aquí.

### 5.2 Fase FE-6 — Vista Calendario 📅 — EN CURSO

Ruta `/calendario`, según el mockup del usuario (`myDesign/Vistas/Calendario/CalendarioView.png` y
`ModalCalendario.png`). Vista independiente (§2.1): módulo `calendar/`, `ViewBoundary` propio y
carga diferida con `ssr: false` (la rejilla depende de la fecha/huso del navegador; renderizarla en
servidor daría un HTML distinto al del cliente).

- [x] **C-1 — Maqueta.** Cabecera de página + tarjeta "Planificador" (`‹ Hoy ›`, rejilla LUN–DOM de
      seis semanas, hoy en azul terciario, chips de eventos en morado) + modal "Agenda del día" con
      estado vacío. Semana en lunes, textos en español, sin librería de fechas.
- [x] **C-2 — Backend (v1).** Conectado al dominio `reminders` (ver [`BACKEND.md`](./BACKEND.md) §3):
      `useCalendarMonth` lee de `GET /api/reminders` y expande ocurrencias → `EventsByDay` (ya no hay
      mock), y "Crear recordatorio" abre un **formulario** (Tipo/Hora/Frecuencia/Nº veces/Texto) que
      reemplaza el modal y hace `POST`. **Hecho** (v1 escrito). Pendiente: **disparo** a la hora y
      **voz/IA por prompts** (BACKEND R-5+).

- [x] **C-3 — El robot sobre el calendario.** El modelo 3D flota en reposo sobre la vista y
      **coreografía la interacción con el modal**: clicar un día → viaja a su celda → la "toca" → abre el
      modal; cerrar (X/"Cerrar") → viaja al botón → lo pulsa → cierra → vuelve al reposo. Capa
      **decorativa** que **nunca bloquea la UI**. Detalle completo abajo. **Hecho** (afinado con el usuario).
- [x] **C-4 — Restricciones y avisos.** No se pueden **crear recordatorios en días pasados** (el día se
      abre y se ve, pero "Crear recordatorio" queda deshabilitado; hoy y futuros sí — `CalendarDay.isPast`);
      editar/borrar los existentes sigue disponible. Cuando un recordatorio **se dispara** a su hora
      (BACKEND R-6): **aviso in-app** (toast ~20s) **+ un "ding"** (Web Audio, sin archivo) y el **robot**
      del calendario reacciona (`notify`). **Hecho.**

**C-3 en detalle — el robot del calendario** 🤖 (`_components/calendar/calendar-robot.tsx` +
`use-robot-choreography.ts`; capacidades del avatar en [`AVATAR.md`](./AVATAR.md) AV-9)

- **Presencia (reposo).** `CalendarRobot` es una capa sobre `.view`: `position:absolute`,
  `pointer-events:none`, `aria-hidden`, con **su propio `ViewBoundary` y `fallback={null}`** — si el WebGL
  falla, ni se nota ni tumba el calendario. Va a `z-index:30`, **por encima** del overlay del modal, para
  verse junto al día. **Aparece ya en su reposo** (arriba-derecha, `REST_TARGET`) sin animación de entrada
  (el roam hace *snap* al objetivo en el primer frame). No camina (`walk={false}`).
- **Que siempre dé la cara.** El reposo cae ~25° fuera del eje de la cámara y se le veía de lado. Se
  arregla con **billboard** (`faceCamera`: `lookAt` a la cámara + el ladeo del vuelo compuesto encima) +
  **teleobjetivo** (`fov=15°`/`cameraZ=52`): el cizallamiento del billboard escala con `tan(fov/2)` y **no
  depende de `cameraZ`**, así que el tele lo baja de ~5.5° a ~1.9°. Con `faceCamera`, el `<Float>` deja de
  rotar (solo flota). **Ojo:** R3F crea la cámara del `<Canvas>` **solo al montar** → cambiar `fov`/`cameraZ`
  exige **recarga dura** del navegador.
- **Abrir un día.** Click → **viaja a la celda** (mano según el lado: mitad izquierda → mano izquierda de
  pantalla; derecha → derecha) → la **toca** (`usePressGesture`, impulso corto) → con el toque **abre el
  modal** y se **aparta a la izquierda** (`MODAL_TARGET`) para no taparlo.
- **Cerrar.** X o "Cerrar" → viaja al botón → lo **pulsa** (siempre con la **mano derecha** de pantalla) →
  **cierra** → **vuelve al reposo más despacio** (`roamEaseSpeed` lento solo en esa vuelta). Escape y
  click-fuera cierran al instante (no hay botón que pulsar).
- **Robustez.** El modal **siempre** abre/cierra: los timers viven en `use-robot-choreography.ts`, **fuera**
  de la capa 3D. Con `prefers-reduced-motion` no hay coreografía (abre/cierra al instante).
- **Perillas de ajuste** (en `_components/calendar/`): `REST_TARGET`/`MODAL_TARGET` (posiciones,
  normalizadas al rect de `.view`), `TRAVEL_MS`/`PRESS_MS` (ritmo click→acción), `REST_EASE_SLOW` (lentitud
  de la vuelta), `CAMERA_FOV`/`CAMERA_Z` (encuadre/tamaño — para el tamaño, mover solo `CAMERA_Z`),
  `pressHandFor` (umbral izquierda/derecha).

**Desviaciones del mockup** (decididas con el usuario):
- **Topbar mínima** (solo toggle de tema): se respeta la decisión de H-1; fuera el "+ Nuevo proyecto"
  y el "BOTCITO STUDIO / Espacio de creación" de la plantilla. La topbar es del shell y afectaría a Inicio.
- **Copy del dominio** en vez del de estudio de diseño ("Organiza tus recordatorios…", no "sesiones de diseño").
- **Punto de la leyenda en azul terciario** (`--brand-accent`) en vez del verde del mockup: el verde no
  está en la identidad de marca (§4.1).

### 5.3 Fase FE-7 — Vista Tareas (tablero Kanban) 🗂️ — HECHA (v1)

Vista propia y autocontenida en `apps/client/src/app/_components/tasks/` (ruta `/tareas`, con
`ViewBoundary` + carga diferida `ssr:false`, e item **"Tareas"** en la barra lateral). Sigue el mismo
patrón que el calendario (cliente REST + hook con `refetch`, modal estilo `day-modal`).

- **Tablero Kanban**: 3 columnas por `TaskStatus` (Por hacer / En progreso / Hecho) desde
  `task-status.ts` (`TASK_COLUMNS`, `groupTasksByStatus`). Alta rápida por columna (solo título → crea
  la card en ese estado).
- **Card** (`task-card.tsx`): título, vista previa de las **notas** (reutiliza `description`), **barra
  de progreso** (`progress` 0–100) y chip de **prioridad** opcional. Click → modal.
- **Modal de edición** (`task-modal.tsx` + `task-form.tsx` + `task-form-fields.tsx`): título, notas,
  progreso (`range` 0–100), estado (mueve de columna) y prioridad. Guardar = `PATCH`; borrar con
  confirmación inline (patrón `ReminderRow`).
- **Recordatorios enlazados** (`task-reminders.tsx` + `task-reminder-form.tsx`): desde la card se crean
  recordatorios **puntuales** (`ReminderFrequency.Once`, `count 1`) con `taskId` fijo; se listan
  filtrando por `taskId` y se borran. Como el calendario ya pinta **todos** los recordatorios, los
  enlazados **aparecen allí solos**. Reutiliza (sin duplicar) `reminders-api`, `reminder-form-options`
  y `reminder-type-style` del calendario → mismos colores/etiquetas por tipo.
- **Backend**: `Task` ganó `progress?` (0–100) y `Reminder` ganó `taskId?` (`@IsMongoId`). El CRUD
  genérico de `libs/tasks/**` no cambió. Ver [`BACKEND.md`](./BACKEND.md).

**Pendiente (futuro):** al borrar una tarea, sus recordatorios enlazados quedan (sin cascada);
notas ricas / drag&drop entre columnas; `min` de fecha "hoy" en el alta de recordatorio de la card
(el calendario ya restringe días pasados, este mini-form aún no).

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
- 2026-07-15 — **FE-2 H-0/H-1 (Commit A) — shell de la Home**: vista aislada (`home/` + `ViewBoundary`),
  montada tras el login en vez del playground. **Barra lateral colapsable** (logo esquina sup. izq. como
  el login + chevron; riel de iconos al cerrar) con **Inicio** (activo) y **Calendario**; abajo, usuario
  (iniciales+nombre reales) + **Cerrar sesión**. **Topbar mínima** (solo toggle de tema; fuera "Nuevo
  proyecto"). `main` = placeholder del visualizador. Falta llevar la **vista 2D/3D** al `main` (Commit B).
- 2026-07-15 — **FE-2 H-1 (Commit B) — visualizador en el `main`**: el `main` pasa de placeholder a
  `Visualizer` = tarjeta con **toggle 2D/3D** + el **avatar** (2D por capas / 3D contenido, mirada al
  cursor) + **botones de emoción** (la misma `emotion` alimenta ambos modos). Sin calibración manual.
  Los estilos compartidos de `ModeToggle`/`StateButtons` pasan a tokens de marca (theme-aware). Se borra
  el placeholder; `avatar-playground.tsx` queda de referencia, sin usarse.
- 2026-07-15 — **FE-2 · roam 3D en el `main`**: en 3D el visualizador pasa a un **campo de roam**
  (`VisualizerRoam`) que llena el área principal: el robot **deambula siguiendo el cursor y "camina"**
  (manos), con el toggle y las emociones **flotando** encima (`pointer-events`); acotado al `main`
  (`overflow:hidden`, no cubre la barra lateral/topbar). 2D sin cambios. En la lib del avatar,
  `usePointerViewportTarget` normaliza el cursor al **rect del `<canvas>`** (antes a la ventana) para que
  el seguimiento sea correcto con el canvas acotado; a pantalla completa queda idéntico (solo lo usa `RoamGroup`).
- 2026-07-15 — **FE-6 · vista Calendario (maqueta)**: se introducen **rutas reales** — grupo `(app)` con
  el shell en su `layout`, `/` = Inicio y `/calendario` = calendario; la barra lateral pasa a `<Link>` +
  `usePathname()` (antes botones sin handler) y cada vista trae su propio `ViewBoundary`. Nuevo módulo
  `calendar/` según el mockup: rejilla del mes (lunes primero, hoy en azul terciario, chips morados) y
  modal de la agenda del día con estado vacío. Eventos = **datos de ejemplo**; el dominio `reminders`
  del backend **no existe todavía** (es scaffold), así que "Crear recordatorio" queda deshabilitado. Ver §5.2.
- 2026-07-15 — **FE-6 C-3 · robot en reposo sobre el calendario**: el modelo 3D flota quieto arriba de la
  vista (`CalendarRobot`: capa `absolute` + `pointer-events:none` + `aria-hidden`, con `ViewBoundary`
  propio y `fallback={null}` → si el WebGL falla, ni se nota ni se lleva el calendario por delante).
  Lo habilita una prop nueva de la lib del avatar: **`Avatar3D#target`** (`{x,y}` normalizado igual que el
  cursor) hace que `RoamGroup` viaje a un punto fijo en vez de perseguir el ratón; **sin `target`, todo
  idéntico**. Reutiliza el ease/velocidad/orientación de siempre: al llegar, la velocidad cae sola a ~0 →
  dejan de moverse las manos y queda flotando. Falta la coreografía (viajar al día + tocar + abrir).
- 2026-07-15 — **FE-6 C-3 · la coreografía**: al clicar un día el robot **viaja** a su celda, la **toca**
  con la mano y con ese toque **se abre el modal**; sigue flotando ahí (capa a `z-index:30`, por encima
  del `.overlay`) y **vuelve al reposo** al cerrar. Nuevo en la lib del avatar: `usePressGesture` (impulso
  procedural de una sola pasada, 400 ms, mano derecha, que **restaura la pose base** al terminar) y
  `Avatar3D#pressTrigger` (**nonce edge-triggered**: el avatar no sabe que ha llegado — lo dispara el
  front). En `RoamGroup`, el modo `target` pasa a usar la **amplitud completa**: el `EDGE_MARGIN` (útil en
  roam libre para que el bot no se salga persiguiendo el cursor) comprimía el mapeo ~35% y dejaba al robot
  **una fila por encima** del día clicado. El roam libre de la Home no cambia. El robot es **decorativo**:
  el modal abre siempre (timer fuera de la capa 3D; al instante con `prefers-reduced-motion`).
- 2026-07-15 — **Bug (gotcha de R3F)**: el `<Canvas>` de R3F fija `pointer-events: auto` **inline** en su
  div (*"or else the canvas will block events from reaching the event source"*, comentario de su propio
  fuente). Un inline gana al `pointer-events: none` que hereda de la capa contenedora → la capa del robot,
  que cubre toda la vista a `z-index:30`, **dejaba todos los días sin poder clicarse**. `Avatar3D` pasa
  ahora `style={{ pointerEvents: 'none' }}` al `<Canvas>`: su `style` hace spread **después** de su
  `pointerEvents` interno, así que lo sobrescribe **sin `!important`**. Es seguro e incondicional porque
  **nada del avatar usa eventos de puntero del canvas** (`usePointerRotation` y `usePointerViewportTarget`
  escuchan en `window`; no hay meshes clicables ni `OrbitControls`). Arreglaba también el mismo bug
  **latente en la Home**, donde no se notaba porque los controles flotan por encima del canvas.
- 2026-07-16 — **FE-6 C-3 · robot del calendario, pulido (varias iteraciones con el usuario)**: **billboard**
  (`faceCamera`) + **teleobjetivo** (`fov=15`/`cameraZ=52`) para que siempre dé la cara sin ladearse — el
  ladeo era perspectiva fuera de eje (no rotación) y **no dependía de `cameraZ`**, así que se atacó con el
  `fov`, no con el tamaño; **snap** al reposo en el primer frame (sin viaje de entrada); tamaño afinado a
  ojo; **mano según el lado** del día al abrir y **mano derecha fija** al cerrar (de paso, `usePressGesture`
  **relee el hueso** al cambiar de mano — antes lo cacheaba y solo una mano se movía); **coreografía de
  cierre** simétrica a la de abrir (viaja al botón → pulsa → cierra → vuelve); **vuelta al reposo más
  lenta** (`roamEaseSpeed`). Detalle consolidado en §5.2 (C-3). Props del avatar en `AVATAR.md` (AV-9).
- 2026-07-22 — **FE-6 · disparo, avisos y restricciones (C-4).** El aviso en tiempo real llega al cliente
  (toast app-wide + el robot en `notify`; ver BACKEND F-3); se añade un **"ding"** al dispararse y el toast
  dura ~20s. Y no se pueden **crear recordatorios en días pasados** (`CalendarDay.isPast`: el día se ve y
  se editan/borran los existentes, pero no se crean; hoy no cuenta como pasado).
- 2026-07-22 — **FE-7 anotada — Vista Tareas (cards tipo Notion).** Visión registrada (tablero de cards del
  usuario con notas/progreso/recordatorios enlazados al calendario, Tareas↔Reminders); **se diseña e
  implementa en una sesión aparte con más contexto**. Ver §5 (FE-7).
- 2026-07-23 — **FE-7 implementada (v1).** Tablero Kanban en `/tareas` (3 columnas por estado, alta
  rápida, card con notas + progreso + prioridad, modal de edición/borrado) y **recordatorios enlazados**
  desde la card (`taskId`) que aparecen en el calendario. Backend: `Task.progress` + `Reminder.taskId`.
  Detalle en §5.3.
