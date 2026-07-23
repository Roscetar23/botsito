# Asistente Virtual — Plan Maestro

> Documento vivo. Recoge la visión, la arquitectura, el scaffold inicial de NX y el
> backlog de tareas. Se actualiza a medida que avanzamos.

- **Orquestador:** Oscar Javier Gomez Manrique
- **Fecha inicial:** 2026-07-09
- **Repo:** `/home/ogomez/bot` (branch `main`, remoto `botsito`)
- **Estado:** Fases 1, 2 y 5 ✅ (Backend Tasks + Auth contra Atlas; **avatar 2D+3D TERMINADO**;
  **auth en el cliente** listo, T-14b). **En curso: FE-2 — Home** (pantalla base del producto, se
  itera hasta completarla; ver Fase FE y `FRONTEND.md` §5.1). Luego: **Fase 3 realtime** + backend.

**Documentos del proyecto:**
- [`SETUP.md`](./SETUP.md) — bootstrap del monorepo NX (paso a paso).
- [`AVATAR.md`](./AVATAR.md) — ⭐ plan maestro del avatar (núcleo del producto), con fases propias AV-0…AV-6.
- [`FRONTEND.md`](./FRONTEND.md) — 🎨 diseño y progreso **visual** del cliente (estructura, estilos, tokens, roadmap FE-1…).

---

## 1. Visión

Asistente virtual web con un **avatar 2D** que reacciona a eventos (`idle`, `speaking`,
`notify`) y ayuda al usuario a gestionar **tareas**, **recordatorios** y **notificaciones
en tiempo real**. Opcionalmente incorpora un servicio de **NLU basado en LLM** para
interpretar lenguaje natural.

Principio rector: **MVP pequeño y ejecutable primero**, complejidad después.

---

## 2. Stack técnico

| Capa | Tecnología | Notas |
|---|---|---|
| Monorepo | **NX 23** | Presets oficiales Next + Nest |
| Frontend | **Next.js** (App Router) + React 18 + TS | Avatar SVG + Framer Motion |
| Backend | **NestJS** + TS | REST + WebSocket Gateway |
| DB | **MongoDB** + Mongoose | Instancia personal |
| Realtime | **Socket.IO** (Nest Gateway) | Eventos de notificación al avatar |
| Jobs | **Agenda (Mongo)** en MVP → **BullMQ (Redis)** al escalar | Ver decisión D-03 |
| Auth | **JWT local** (Passport) | Access + refresh |
| NLU (opcional) | Servicio LLM encapsulado (Claude u otro) | Keys por env, ver D-05 |
| Infra local | **Docker Compose** (Mongo, Redis opc., Minio opc.) | |

**Tooling base:** Node 22.x, npm 10.x, Nx CLI 23.x.

---

## 3. Principios de diseño: Modularidad + Screaming Architecture

### 3.0 Modularidad estricta (regla dura del proyecto)

- **Ningún archivo supera las 150 líneas de código.** Aplica a front y back por igual.
- Si un archivo se acerca al límite → se **divide por responsabilidad** (un caso de uso por
  archivo, un handler por archivo, un componente por archivo, un hook por archivo).
- Se **automatiza con ESLint** (`max-lines`) para que romper la regla falle el lint/CI:

  ```jsonc
  // regla aplicada en la config ESLint del workspace
  "max-lines": ["error", { "max": 150, "skipBlankLines": true, "skipComments": true }]
  ```
- Patrones para mantenerse por debajo de 150 líneas:
  - Backend: separar `controller` / `service` / `repository` / `schema` / `dto` en archivos
    propios; un DTO por archivo; un caso de uso por archivo (`create-task.usecase.ts`).
  - Frontend: un componente por archivo; extraer lógica a hooks (`useTasks.ts`), estilos y
    subcomponentes aparte; el avatar se descompone en partes SVG + máquina de estados.
  - Compartido: helpers puros pequeños y cohesivos en `shared/utils`.

> Consecuencia de diseño: **muchos archivos pequeños y cohesivos** en lugar de pocos grandes.
> Esto encaja de forma natural con la estrategia de agentes por carpeta (§4).

### 3.1 Screaming Architecture

> "La arquitectura debe gritar el **dominio**, no el framework." (R. C. Martin)
> Las carpetas de primer nivel nombran **lo que hace el sistema** (auth, tasks, reminders,
> notifications, avatar), no *cómo* está construido (controllers, services, components).

Regla transversal (Nest y Next):

- Primer nivel = **dominios de negocio**.
- Dentro de cada dominio, capas técnicas (`data-access`, `feature`, `ui`, `model`).
- El **shared kernel** (`shared/*`) contiene lo genuinamente transversal: tipos, utils,
  UI atómica. Nunca lógica de un dominio concreto.
- Dependencias permitidas: `feature → data-access → model`; `ui → model`. Un dominio
  **no** importa el `feature` interno de otro dominio; se comunica por sus interfaces
  públicas (barrel `index.ts`) o por eventos.

### 3.2 Estructura del monorepo NX

Scope npm: **`@asistente`** (confirmado, ver D-02).

```
bot/
├─ apps/
│  ├─ client/                     # Next.js  (thin: sólo composición y rutas)
│  └─ api/                        # NestJS    (thin: sólo bootstrap y wiring de módulos)
│
├─ libs/
│  ├─ auth/          { feature, data-access, model }
│  ├─ tasks/         { feature, data-access, ui, model }
│  ├─ reminders/     { feature, data-access, model }
│  ├─ notifications/ { feature, data-access, model }
│  ├─ avatar/        { ui, model }
│  └─ shared/        { types, ui, utils }
│
├─ .claude/
│  └─ agents/                     # agentes Claude por carpeta/dominio (§4)
├─ docs/PLAN.md                   # este documento
├─ docker-compose.yml             # infra local (fase infra)
├─ .env.example
└─ nx.json / tsconfig.base.json / package.json
```

Detalle por lib (ejemplo `tasks`, misma forma para el resto):

```
libs/tasks/model/src/lib/        # task.entity.ts, create-task.dto.ts, task.types.ts
libs/tasks/data-access/src/lib/  # task.schema.ts, task.repository.ts
libs/tasks/feature/src/lib/      # tasks.module.ts, tasks.controller.ts, tasks.service.ts, dto/
libs/tasks/ui/src/lib/           # TasksBoard.tsx, TaskItem.tsx, useTasks.ts
```

### 3.3 Backend Nest — apps delgadas

`apps/api` sólo `main.ts` + `AppModule` que registra los `FeatureModule` de cada dominio
(que viven en `libs/<dominio>/feature`). Cada dominio expone su módulo Nest desde su lib.

### 3.4 Frontend Next — apps delgadas

`apps/client` (App Router) sólo compone features y layout. La UI/lógica de cada dominio
vive en `libs/<dominio>/ui` y `libs/<dominio>/feature`. Ej.: `libs/avatar/ui` →
`<Avatar state=... />`; `libs/notifications/feature` (cliente) → `useRealtime()`.

### 3.5 NX module boundaries (tags)

Se aplican reglas con `@nx/enforce-module-boundaries`:

- Scopes: `scope:auth | scope:tasks | scope:reminders | scope:notifications | scope:avatar | scope:shared`
- Tipos: `type:feature | type:data-access | type:ui | type:model`

`type:feature` → puede usar `data-access`, `ui`, `model`, `scope:shared`.
`type:data-access` → sólo `model` y `scope:shared`. `model`/`shared` → sin dependencias de
dominio. Un `scope:X` no importa `type:feature` de otro `scope:Y`.

### 3.6 Visual / diseño del frontend 🎨

Todo lo que se **ve en pantalla** (estructura del cliente, estilos, sistema de diseño y roadmap
visual) vive en su documento propio: **[`FRONTEND.md`](./FRONTEND.md)**. Resumen:

- **App delgada** (`apps/client`) + UI en `libs/*/ui`; **CSS Modules** + **tokens** de marca (variables CSS).
- **Vistas independientes/aisladas:** cada pantalla es un módulo autocontenido (error boundary + carga
  diferida) → si una falla, no tumba el resto. Ver `FRONTEND.md` §2.1.
- **Fase de trabajo:** ver **Fase FE** en el backlog (§6). Estado: **FE-1** (acceso) y **FE-3** (tema)
  hechos; avatar **terminado**. **En curso: FE-2 — Home (pantalla base)**, la vista clave antes de backend.

---

## 4. Estrategia de agentes Claude por carpeta

**Objetivo:** que cada carpeta/dominio tenga **su propio agente Claude con contexto acotado**.
Al trabajar en el front, invoco al agente del front; para tareas, al agente de `tasks`; etc.
Así el agente no necesita escanear todo el proyecto — arranca ya sabiendo sus rutas,
convenciones y fronteras.

### 4.1 Cómo se implementa

Cada agente es un archivo Markdown en `.claude/agents/<nombre>.md` con frontmatter y un
system prompt que fija **su carpeta, sus rutas y sus reglas**. Se invoca por nombre.

Plantilla base de un agente de dominio:

```markdown
---
name: tasks
description: >
  Experto EXCLUSIVO del dominio Tasks. Úsalo para cualquier cambio en
  libs/tasks/** (model, data-access, feature, ui). No toca otros dominios.
tools: Read, Edit, Write, Bash, Grep, Glob
model: sonnet
---

Eres el agente del dominio **Tasks**. Tu contexto se limita a:
- libs/tasks/model, libs/tasks/data-access, libs/tasks/feature, libs/tasks/ui

Reglas:
- Ningún archivo supera 150 líneas; si crece, divídelo por responsabilidad.
- Respeta Screaming Architecture y las fronteras NX (no importar feature de otros dominios).
- DTOs/entidades en libs/tasks/model; validación con class-validator en feature.
- Antes de tocar código, lee sólo los archivos de tu carpeta (Grep/Glob acotado a libs/tasks/**).
- Al terminar: type-check + lint del proyecto afectado (`nx lint tasks-*`, `nx test tasks-*`).
```

### 4.2 Catálogo de agentes previsto

**Nivel app (amplios):**
- `front` → `apps/client/**` + todos los `libs/*/ui`. Cambios de UI, rutas, integración avatar.
- `back` → `apps/api/**` + `libs/*/{feature,data-access,model}` del lado servidor.

**Nivel dominio (acotados, el uso más frecuente):**
- `auth` → `libs/auth/**`
- `tasks` → `libs/tasks/**`
- `reminders` → `libs/reminders/**`
- `notifications` → `libs/notifications/**`
- `avatar` → `libs/avatar/**`
- `shared` → `libs/shared/**` (cambios transversales; con cautela porque afecta a todos)

**Nivel orquestación:**
- `nx-infra` → scaffold, generators, tags, boundaries, docker-compose, tsconfig/paths.

> Regla de oro: para un cambio localizado se usa el agente **más específico** (dominio).
> Los agentes `front`/`back` se reservan para cambios que cruzan varios dominios de un lado.

### 4.3 Convenciones comunes a todos los agentes

- Cada agente lleva en su prompt: sus rutas, el límite de 150 líneas, las fronteras NX y
  los comandos de verificación de su proyecto NX.
- Un agente **no edita fuera de su carpeta**; si necesita un cambio en otro dominio, lo
  declara para que lo orqueste yo (o el agente de ese dominio).
- Contexto mínimo: los agentes buscan con Glob/Grep **acotado a su carpeta**, no al repo.

---

## 5. Scaffold inicial de NX — comandos exactos

> Ejecutar en `/home/ogomez/bot`. Repo ya inicializado en git (branch `master`).

### 5.1 Crear el workspace (scope `@asistente`)

```bash
npx create-nx-workspace@latest bot \
  --preset=apps --workspaceType=integrated \
  --nxCloud=skip --packageManager=npm --npmScope=asistente
# Alternativa si NX se queja por la carpeta con .git: npx nx@latest init  (+ añadir plugins)
```

### 5.2 Plugins de framework

```bash
npm i -D @nx/next @nx/nest @nx/js @nx/react @nx/eslint @nx/jest
```

### 5.3 Apps

```bash
npx nx g @nx/next:application client --directory=apps/client --style=css --appDir=true --e2eTestRunner=none
npx nx g @nx/nest:application api    --directory=apps/api    --e2eTestRunner=none
```

### 5.4 Libs de dominio (screaming) con tags

> ⚠️ Comandos ejecutables y probados en [`docs/SETUP.md`](./SETUP.md) §4. Deben incluir
> **`--name` único** e **`--importPath=@asistente/<dominio>-<tipo>`** (npm sólo admite un `/`).
> El bloque de abajo es el esquema conceptual; usa el de SETUP para correr.

```bash
# shared kernel
npx nx g @nx/js:lib shared-types  --directory=libs/shared/types --tags=scope:shared,type:model
npx nx g @nx/js:lib shared-utils  --directory=libs/shared/utils --tags=scope:shared,type:util
npx nx g @nx/react:lib shared-ui  --directory=libs/shared/ui    --tags=scope:shared,type:ui

# auth
npx nx g @nx/js:lib auth-model       --directory=libs/auth/model       --tags=scope:auth,type:model
npx nx g @nx/js:lib auth-data-access --directory=libs/auth/data-access --tags=scope:auth,type:data-access
npx nx g @nx/js:lib auth-feature     --directory=libs/auth/feature     --tags=scope:auth,type:feature

# tasks
npx nx g @nx/js:lib tasks-model       --directory=libs/tasks/model       --tags=scope:tasks,type:model
npx nx g @nx/js:lib tasks-data-access --directory=libs/tasks/data-access --tags=scope:tasks,type:data-access
npx nx g @nx/js:lib tasks-feature     --directory=libs/tasks/feature     --tags=scope:tasks,type:feature
npx nx g @nx/react:lib tasks-ui       --directory=libs/tasks/ui          --tags=scope:tasks,type:ui

# reminders
npx nx g @nx/js:lib reminders-model       --directory=libs/reminders/model       --tags=scope:reminders,type:model
npx nx g @nx/js:lib reminders-data-access --directory=libs/reminders/data-access --tags=scope:reminders,type:data-access
npx nx g @nx/js:lib reminders-feature     --directory=libs/reminders/feature     --tags=scope:reminders,type:feature

# notifications
npx nx g @nx/js:lib notifications-model       --directory=libs/notifications/model       --tags=scope:notifications,type:model
npx nx g @nx/js:lib notifications-data-access --directory=libs/notifications/data-access --tags=scope:notifications,type:data-access
npx nx g @nx/js:lib notifications-feature     --directory=libs/notifications/feature     --tags=scope:notifications,type:feature

# avatar
npx nx g @nx/js:lib avatar-model --directory=libs/avatar/model --tags=scope:avatar,type:model
npx nx g @nx/react:lib avatar-ui --directory=libs/avatar/ui    --tags=scope:avatar,type:ui
```

### 5.5 Paquetes npm de dominio (por fase)

```bash
# Backend
npm i @nestjs/mongoose mongoose @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt \
      class-validator class-transformer @nestjs/websockets @nestjs/platform-socket.io socket.io
npm i agenda                      # scheduler MVP (Mongo)
# npm i bullmq ioredis            # variante al escalar (Redis)

# Frontend
npm i framer-motion socket.io-client
```

### 5.6 Verificación

```bash
npx nx graph                 # grafo de dependencias (valida el screaming)
npx nx run-many -t lint      # incluye la regla max-lines (150)
npx nx serve api
npx nx serve client
```

---

## 6. Backlog de tareas

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

### Fase 0 — Fundaciones
- [x] **T-01** Scaffold NX: workspace + apps `client`/`api` (bajo `apps/`) + 18 libs de dominio con tags (§5).
- [x] **T-02** `@nx/enforce-module-boundaries` con las reglas de §3.5 (en `eslint.config.mjs`).
- [x] **T-03** ESLint: `max-lines` = 150 (skipBlankLines/skipComments), ignorando specs y `*.config.*`.
- [x] **T-04** Imports `@asistente/<dominio>-<tipo>` + barrels `src/index.ts` por lib.
- [~] **T-05** Prettier activo (NX). Falta `.editorconfig` (+ husky/lint-staged opcional).
- [x] **T-06** `.env.example` creado. Falta cargar `@nestjs/config` en `api` (se hará en Fase 1).
- [x] **T-07** Agentes Claude en `.claude/agents/`: `front`, `back`, `auth`, `tasks`,
      `reminders`, `notifications`, `avatar`, `shared`, `nx-infra` (§4).

### Fase 1 — Dominio Tasks (primer vertical funcional)
- [x] **T-08** `tasks/model`: `Task` + enums + `CreateTaskDto`/`UpdateTaskDto` (`class-validator`, un DTO por archivo).
- [x] **T-09** `tasks/data-access`: `TaskSchema` (Mongoose) + `TaskRepository` owner-aware + `TasksDataAccessModule`.
- [x] **T-10** `tasks/feature`: `TasksModule` + `TasksController` (CRUD REST) + `TasksService` (`NotFoundException`). `DEMO_OWNER_ID` temporal hasta T-14.
- [x] **T-11** Wiring en `apps/api` (`ConfigModule`, `MongooseModule.forRootAsync`, `TasksModule`, `ValidationPipe`+CORS). Verificado lint/typecheck/build **y smoke test curl end-to-end** contra MongoDB Atlas (POST 201 / GET 200 / validación 400). Fase 1 ✅.

### Fase 2 — Auth
- [x] **T-12** `auth/model` (`User`, `RegisterDto`/`LoginDto`, `JwtPayload`/`AuthTokens`) + `auth/data-access` (`UserSchema` email único, `UserRepository`).
- [x] **T-13** `auth/feature`: register/login/refresh (bcrypt salt 12), JWT access+refresh (`TokenService`), `JwtStrategy`, `JwtAuthGuard`, `@CurrentUser`. Rutas `/api/auth/*`. `AuthenticatedUser` en `shared-types`.
- [x] **T-14** Tasks protegido con `@UseGuards(AuthGuard('jwt'))`; `ownerId` tomado del usuario autenticado (fin de `DEMO_OWNER_ID`). `AuthModule` registrado en `apps/api`. Verificado lint/typecheck/build. Smoke test curl pendiente (usuario).
- [x] **T-14b** *(fase intermedia)* **Auth en el cliente** (`libs/auth/ui` = `@asistente/auth-ui`):
  cliente API (register/login/refresh/me), tokens en `localStorage`, contexto `AuthProvider`/`useAuth`
  (rehidrata con refresh) y `AuthPanel` (login/registro). `apps/client` se puertea tras login
  (`AppShell`) y expone el `accessToken` — necesario para el handshake del realtime (Fase 3).
  Verificado lint/typecheck/test/build. Falta: probar login real contra el backend (usuario).

### Fase 3 — Realtime + Notifications
- [x] **T-15** `notifications/feature`: `NotificationsGateway` (Socket.IO) con auth de handshake (JWT),
      sala por usuario, `@OnEvent(reminder.fired)` → emite `'reminder'`. **Hecho** (disparo, BACKEND F-2). ✅
- [x] **T-16** Cliente: `RealtimeProvider`/`useReminderSocket` (socket.io-client con el token); avisos in-app
      y el robot del calendario reacciona (`notify`). **Hecho** (BACKEND F-3). ✅

### Fase 4 — Reminders (recordatorios)

> Detalle y roadmap fino (R-1…R-5) en **[`docs/BACKEND.md`](./BACKEND.md)** §3-4. Modelo decidido con el
> usuario: `type` (medicina/cita/tarea/personal/otro) · `text` · `date` (el día) · `time` (hora exacta) ·
> `recurrence { frequency: una vez/diario/semanal/mensual, count }`. **v1 = crear + guardar + ver** en el
> calendario (entrada **escrita**); **disparo** (Agenda + WS) y **voz/IA por prompts** en fases posteriores.

- [x] **T-17** `reminders/model` + `data-access`: entidad `Reminder` + enums + DTO (`class-validator`) +
      función de ocurrencias; schema Mongoose **owner-aware** + repo + módulo. (BACKEND **R-1**) ✅
- [x] **T-17b** `reminders/feature` + wiring + cliente: controller `POST`/`GET` (JWT) + service;
      `RemindersModule` en `AppModule` (arranque + `401` verificados); el calendario **lee y crea**. (BACKEND **R-2..R-4**) ✅
- [x] **T-18** **Disparo**: scheduler con **Agenda** (tras `SchedulerPort`) → **Job → evento de dominio →
      notificación WS** (gateway de Fase 3) → aviso in-app + robot. Zona horaria = local del servidor
      (multi-zona luego). **Hecho** (BACKEND **R-6** / F-1..F-3). ✅
      *Recurrencia v1 = `frequency`+`count`; migrable a cron/rrule si hiciera falta.*
- [ ] **T-19** Variante documentada **BullMQ + Redis** (misma interfaz `SchedulerPort`).

### Fase 5 — Avatar (frontend) ⭐ **NÚCLEO DEL PRODUCTO**

> El avatar es lo más importante del proyecto y tiene su **plan maestro propio** con fases
> detalladas (AV-0…AV-6) en **[`docs/AVATAR.md`](./AVATAR.md)**. Esta fase se gobierna desde
> ese documento; las tareas de abajo son el resumen.

- [x] **T-20** Definición + arte del personaje (robot con audífonos) + `docs/AVATAR.md`. → **AV-0** ✅.
- [x] **T-21** `avatar/model` + `avatar/ui`: rig por capas del personaje real, comportamientos idle
  (respirar/parpadear), máquina de estados y emociones con Framer Motion. → **AV-1…AV-4** ✅ (lint/typecheck/tests verde).
- [x] **T-22** Avatar **3D real** (React Three Fiber): gestos por hueso (saludo/parpadeo/cejas/boca),
  **emociones** que los combinan (`AvatarState`), caminado y sombras. Panel de pruebas Emociones/Manual.
  → **AV-5…AV-8 ✅ (personaje TERMINADO, 2026-07-12)**. Ver [`AVATAR.md`](./AVATAR.md) / [`AVATAR-ANIMACIONES.md`](./AVATAR-ANIMACIONES.md).
- [ ] **T-22b** *(futuro)* Reaccionar a **eventos realtime/acciones** (**AV-6**, tras Fase 3): mapear
  eventos → `AvatarState` para que el muñeco cambie de emoción solo.

### Fase FE — Frontend / Vistas (UI) 🎨

> Gobernada por **[`FRONTEND.md`](./FRONTEND.md)** (rama de este plan). Principio: cada **vista es
> independiente/aislada** (error boundary + carga diferida) → si una falla, no tumba el resto.

- [x] **FE-1** **Acceso** (login/registro): rediseño split-screen de marca, claro/oscuro (ver T-14b).
- [x] **FE-3** **Tokens + tema** claro/oscuro (`ThemeToggle`, logo por tema, fuente Exo 2).
- [~] **FE-2** **Home (pantalla base)** ⭐ — la vista **base del producto**: sobre ella se conectan
  tareas, recordatorios, notificaciones y el avatar reactivo. **Se construye iterando** hasta
  completarla; detalle e iteraciones (H-0…H-4) en [`FRONTEND.md`](./FRONTEND.md) §5.1. **Prioritaria
  antes de retomar backend.**
- [x] **FE-6** **Calendario** — ruta `/calendario` (rejilla + modal del día), **conectada a reminders**:
  crear/ver/editar/borrar, colores por tipo, **disparo en tiempo real** (aviso + robot); no se crea en
  días pasados. Detalle en [`FRONTEND.md`](./FRONTEND.md) §5.2.
- [x] **FE-7** **Vista Tareas** 🗂️ — tablero **Kanban** en `/tareas` (3 columnas por estado, alta rápida,
  card con notas + progreso + prioridad, modal editar/borrar) y **recordatorios adjuntos** desde la card
  (`taskId`) que **aparecen en el calendario** (Tareas↔Reminders). Backend: `Task.progress` +
  `Reminder.taskId` (CRUD de Tasks sin cambios). Ver [`FRONTEND.md`](./FRONTEND.md) §5.3.
- [ ] **FE-4/FE-5** marca (metadata/favicon) + responsive/accesibilidad.

### Fase 6 — NLU (opcional)
- [ ] **T-23** `LlmService` con interfaz `NluPort` (provider-agnostic), keys por env.
- [ ] **T-24** Endpoint texto → intención (crear tarea / recordatorio).

### Fase 7 — Infra local
- [ ] **T-25** `docker-compose.yml`: Mongo (+ Redis opc. + Minio opc.) y scripts dev.

---

## 7. Decisiones (pros/cons)

- **D-01 Screaming Architecture** · *Pro:* el código comunica el negocio y escala por dominio.
  *Con:* más carpetas/libs al inicio.
- **D-02 Scope `@asistente`** (confirmado) · *Pro:* imports legibles y descriptivos del dominio.
  *Con:* renombrar luego cuesta.
- **D-03 Agenda en MVP** (confirmado) · *Pro:* cero infra extra, usa el Mongo existente. *Con:* menos
  throughput que BullMQ; se aísla tras `SchedulerPort` para migrar a Redis sin tocar dominio.
- **D-04 Socket.IO vs WS puro** · *Pro:* reconexión/rooms/fallback. *Con:* algo más de overhead.
- **D-05 LLM tras `NluPort`** · *Pro:* provider-agnostic, keys por env, testeable. *Con:* indirección extra.
- **D-06 Next thin + libs** · *Pro:* apps delgadas, lógica testeable en libs. *Con:* disciplina para no engordar apps.
- **D-07 Límite 150 líneas** · *Pro:* archivos cohesivos, revisables y con contexto ideal para agentes por carpeta.
  *Con:* más archivos e imports; obliga a extraer temprano.
- **D-08 Agentes por carpeta** · *Pro:* contexto acotado, respuestas más rápidas y baratas, menos ruido.
  *Con:* mantener los prompts de agentes al día si cambia la estructura.

---

## 8. Convenciones

- **TypeScript estricto** (`strict: true`), sin `any` implícito.
- **Máx. 150 líneas por archivo** (ESLint `max-lines`). Un componente/hook/caso de uso por archivo.
- Cada lib expone su API pública por `index.ts` (barrel). Nada por ruta profunda.
- DTOs compartidos FE/BE en `*/model` o `shared/types`; validación con `class-validator` en BE.
- Commits: Conventional Commits (`feat(tasks): ...`, `chore(nx): ...`).
- Cada cambio se hace, preferentemente, con el **agente de su carpeta** (§4).

---

## 9. Decisiones confirmadas (2026-07-09)

1. **Scheduler:** Agenda (Mongo) en MVP, aislado tras `SchedulerPort`.
2. **Scope npm:** `@asistente`.
3. **Ubicación:** scaffold aquí en `/home/ogomez/bot`.

---

## 10. Log de cambios del documento
- 2026-07-09 — Creación del plan maestro (Fase 0).
- 2026-07-09 — Añadidos: modularidad estricta (150 líneas) y agentes Claude por carpeta.
- 2026-07-09 — Decisiones confirmadas: Agenda (MVP), scope `@asistente`, scaffold en `/home/ogomez/bot`.
- 2026-07-09 — Scaffold ejecutado (21 proyectos: 3 apps + 18 libs). Convención de import
  fijada a `@asistente/<dominio>-<tipo>` (npm sólo admite un `/`). SETUP §4 corregido.
- 2026-07-16 — Arranca **Fase 4 (Reminders)** con doc propio **[`docs/BACKEND.md`](./BACKEND.md)**. Modelo
  decidido con el usuario (`type`/`date`/`time`/`recurrence{frequency,count}`); **v1 = crear + guardar +
  ver** en el calendario, entrada escrita (disparo con Agenda + WS y voz/IA por prompts, después). Fase 4
  reestructurada (T-17/T-17b/T-18) mapeada al roadmap R-1…R-5 de BACKEND.md.
- 2026-07-22 — **Reminders CRUD (R-5) + disparo en tiempo real (R-6) hechos.** Editar/borrar (T-17b amplía),
  y **T-15/T-16/T-18 completadas**: Agenda dispara → evento de dominio → `NotificationsGateway` (Socket.IO,
  auth JWT) → cliente (`RealtimeProvider`) con aviso in-app + el robot reacciona. Detalle en BACKEND.md
  (R-5/R-6, F-1…F-3). Pendiente R-7+: voz + IA por prompts, y entrega offline.
- 2026-07-22 — Calendario cerrado (reminders + disparo + "ding" + no crear en días pasados). **FE-7 (Vista
  Tareas — cards tipo Notion) anotada** para una sesión aparte: cards del usuario con notas, progreso y
  recordatorios adjuntos al calendario (Tareas↔Reminders); base = dominio Tasks (Fase 1) a extender.
- 2026-07-23 — **FE-7 implementada (v1).** Tablero Kanban `/tareas` (3 columnas por estado, alta rápida,
  card con notas/progreso/prioridad, modal editar-borrar) + **recordatorios enlazados** desde la card
  (`taskId`) que aparecen en el calendario. Backend: `Task.progress` + `Reminder.taskId`. En 6 partes
  (backend modelo → API/hook → tablero → modal → recordatorios → docs). Detalle en `FRONTEND.md` §5.3.
