# Backend — Arquitectura y progreso

> Documento **vivo** del servidor. Recoge la arquitectura de la API, las convenciones de dominio y el
> roadmap del backend. Complementa a [`PLAN.md`](./PLAN.md) (backlog por fases) y a
> [`FRONTEND.md`](./FRONTEND.md) (cliente) / [`AVATAR.md`](./AVATAR.md) (el avatar).

- **App:** `apps/api` — **NestJS**, corre en **:3001**, prefijo global `/api`. Cliente Next en :3000.
- **DB:** **MongoDB Atlas** (Mongoose), `MONGODB_URI` en `.env`. Conexión ya verificada end-to-end.
- **Regla del repo:** app **delgada** (solo `main.ts` + `AppModule`); la lógica vive en `libs/<dominio>/*`.

---

## 1. Estado actual (qué existe hoy)

| Dominio | Estado |
|---|---|
| **Auth** (`libs/auth/**`) | ✅ Completo: registro/login, JWT access+refresh, `JwtStrategy`, `AuthGuard('jwt')`. |
| **Tasks** (`libs/tasks/**`) | ✅ Vertical completo (model→data-access→feature) contra Atlas. **Es la plantilla de dominio.** |
| **Reminders** (`libs/reminders/**`) | ⏳ Stubs del generador (3 líneas c/u). **Se construye ahora.** |
| **Notifications** (`libs/notifications/**`) | ✅ Gateway WebSocket (Socket.IO), auth JWT por handshake, sala por usuario; empuja el aviso del disparo al cliente. |

`apps/api/src/app/app.module.ts` hoy registra `ConfigModule` (global), `MongooseModule.forRootAsync`,
`ValidationPipe` (global, `whitelist`/`forbidNonWhitelisted`/`transform`), CORS, y los módulos
**`TasksModule`** y **`AuthModule`**. Falta registrar `RemindersModule`.

---

## 2. Arquitectura — dominio por capas (plantilla)

Cada dominio de servidor son **tres libs** (patrón calcado de **Tasks**):

| Capa | Lib | Contiene | Fronteras NX |
|---|---|---|---|
| **model** | `@asistente/<d>-model` | Tipos/entidad puros, enums, **DTOs** (`class-validator`). Sin Mongoose. | `type:model` → solo `model` + `shared`. **Importable por el cliente.** |
| **data-access** | `@asistente/<d>-data-access` | **Schema Mongoose** (`@Schema`/`@Prop`, `timestamps`), **repositorio owner-aware**, `MongooseModule.forFeature`. | `type:data-access` → `data-access`/`model`/`shared`. |
| **feature** | `@asistente/<d>-feature` | Módulo Nest: **controller** (rutas REST, `@UseGuards(AuthGuard('jwt'))`, DTOs, `@CurrentUser`) + **service**. | `type:feature` → todo menos apps. |

- **Auth en las rutas:** `@UseGuards(AuthGuard('jwt'))` a nivel de clase; el usuario se lee con
  `@CurrentUser() user: AuthenticatedUser` (`libs/shared/types`) → **`user.userId`**. Todo recurso es
  **owner-aware**: `ownerId` indexado en el schema y filtrado en cada método del repo.
- **Registro:** basta importar `<D>Module` de `@asistente/<d>-feature` y añadirlo a `imports` de `AppModule`
  (lo hace el agente `back`; las libs las hace el agente de dominio).
- **DTOs compartidos FE↔BE** viven en `*/model`; el **schema Mongoose** vive en `data-access` (no puede
  estar en `model` por las fronteras NX). El cliente importa `@asistente/<d>-model` para tipos y funciones puras.

---

## 3. Feature: **Recordatorios (Reminders)** 📅 — EN CURSO

Objetivo: crear recordatorios desde el modal de un día del calendario y verlos en su día (y en los días
repetidos). Decidido con el usuario. Ver la vista en [`FRONTEND.md`](./FRONTEND.md) §5.2 (C-2/C-3).

### 3.1 Modelo (`reminders/model` — `@asistente/reminders-model`)

```ts
type ReminderType = 'medicina' | 'cita' | 'tarea' | 'personal' | 'otro';
type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly';   // una vez / diario / semanal / mensual

interface Reminder {
  id: string;
  ownerId: string;                 // del JWT, indexado
  type: ReminderType;
  text: string;                    // el texto del recordatorio
  date: string;                    // YYYY-MM-DD — el día donde se crea (celda del calendario)
  time: string;                    // HH:mm (24h) — la hora exacta
  frequency: ReminderFrequency;    // una vez / diario / semanal / mensual
  count: number;                   // "las veces que se repite" (nº de ocurrencias, ≥1)
  createdAt: string; updatedAt: string;
}
```

- **Ocurrencias (función pura en `model`):** un recordatorio genera `count` ocurrencias desde `date`,
  desplazando por `frequency` (`daily` → +i días, `weekly` → +i semanas, `monthly` → +i meses; `once` →
  1 sola). El **cliente** expande las ocurrencias que caen en el mes visible → `EventsByDay`
  (`YYYY-MM-DD → CalendarEvent[]`). El backend guarda **un** documento (base + recurrencia), no N filas.
- **DTO** `CreateReminderDto` con `class-validator` (campos **planos**, no anidados): `type` `@IsEnum`,
  `text` `@IsString @IsNotEmpty @MaxLength`, `date` patrón `YYYY-MM-DD`, `time` `@Matches(HH:mm)`,
  `frequency` `@IsEnum`, `count` `@IsInt @Min(1) @Max(365)`.

### 3.2 API (`reminders/feature`)

`@Controller('reminders')` + `@UseGuards(AuthGuard('jwt'))`. Todo owner-aware (`user.userId`).

| Método | Ruta | Qué |
|---|---|---|
| `POST` | `/api/reminders` | Crea (body `CreateReminderDto`) → 201 con el `Reminder`. |
| `GET` | `/api/reminders` | Lista los del usuario (v1: todos; rango/mes como optimización futura). |
| `DELETE` | `/api/reminders/:id` | *(siguiente)* borra uno del usuario → 204. |

### 3.3 Contrato FE↔BE (cliente)

- **Tipos + expansión de ocurrencias:** el cliente importa `@asistente/reminders-model` (sustituye el
  `CalendarEvent`/mock de `calendar-events.ts`).
- **Cliente HTTP:** `reminders-api.ts` (front) con el patrón de `auth-api.ts` (`fetch`, base
  `NEXT_PUBLIC_API_URL`, `Authorization: Bearer ${accessToken}` de `useAuth()`). *(Candidato a extraer un
  cliente HTTP compartido más adelante.)*
- **Calendario:** `useCalendarMonth`/`useMonthEvents` deja de usar `mockEventsFor` y hace `GET
  /api/reminders` → expande al mes visible → `EventsByDay`. El botón **"Crear recordatorio"**
  (`day-modal.tsx`, hoy `disabled`) abre el **formulario** (type / hora / frecuencia / nº de veces /
  texto) → `POST` → refresca.

### 3.4 Alcance v1 y lo que queda fuera

- **v1 (ahora):** crear + guardar + **verlo** en el calendario. Entrada **escrita**.
- **Después (fases siguientes):**
  - **Disparo real** a la hora: **Agenda** (Mongo, MVP) tras un `SchedulerPort` (PLAN D-03/T-18/T-19) +
    **gateway de notificaciones** WebSocket (T-15/T-16) → el recordatorio "suena". Requiere resolver
    **zona horaria** (disparar a la hora local del usuario).
  - **Entrada por voz** y **IA (gratis) para crear recordatorios con prompts** (texto/voz → intención →
    `CreateReminderDto`; PLAN T-24). El robot del calendario será el vehículo de esa conversación.

---

## 4. Roadmap del backend de reminders

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho.

- [x] **R-1 — `reminders/model` + `data-access`.** Entidad, enums, DTO (`class-validator`), función de
      ocurrencias; schema Mongoose owner-aware + repositorio + `RemindersDataAccessModule`. **Hecho.**
- [x] **R-2 — `reminders/feature` + wiring.** Controller (`POST`/`GET`, JWT) + service; `RemindersModule`
      en `AppModule`. **Hecho** — verificado: arranque real, rutas mapeadas, `401` sin token.
- [x] **R-3 — Cliente (lectura).** `reminders-api.ts`; `useCalendarMonth` lee de la API y expande
      ocurrencias → el calendario muestra recordatorios reales. **Hecho.**
- [x] **R-4 — Cliente (crear).** "Crear recordatorio" → formulario escrito (reemplaza el modal) → `POST`
      → refresca. **Hecho.** → **v1 cerrado: crear + guardar + ver.**
- [x] **R-5 — Editar / borrar.** Backend `PATCH`/`DELETE` (`UpdateReminderDto`, repo `update`, endpoints
      owner-aware) + UI: cada recordatorio del día con **editar** (form pre-rellenado → `PATCH`) y **borrar**
      (confirmación inline; avisa si es recurrente → `DELETE`). **Hecho.** → **CRUD completo.**
- [x] **R-6 — Disparo en tiempo real.** Agenda (tras `SchedulerPort`) programa/cancela un job por ocurrencia
      y dispara a su hora (F-1); emite un evento de dominio (`reminder.fired`, contrato en `shared`) que el
      **gateway WebSocket** de `notifications` (Socket.IO + auth JWT) empuja a la sala del usuario (F-2); el
      cliente conecta, muestra un **aviso in-app** y el **robot reacciona** (`notify`) (F-3). Zona horaria =
      **local del servidor** (correcto para un usuario; multi-zona luego). **Hecho.**
- [ ] **R-7+ — Futuro.** Voz + IA por prompts (texto/voz → recordatorio). Entrega **offline** (push/email
      cuando la app está cerrada; hoy el aviso solo llega con la app abierta).

---

## 5. Decisiones

- **BD-01 Dominio calcado de Tasks** · reminders sigue el mismo patrón model/data-access/feature,
  owner-aware, DTOs `class-validator`, guard JWT. *Pro:* consistencia y cero sorpresas.
- **BD-02 Recurrencia = `frequency` + `count`** (no cron/rrule en v1) · *Pro:* cubre "cada día/semana/mes ×
  N veces" con un modelo trivial y expandible en el cliente. *Con:* no cubre patrones complejos (se puede
  migrar a rrule si hiciera falta, PLAN T-17).
- **BD-03 v1 sin disparo** · guardar + mostrar primero; el scheduler (Agenda) y el gateway WS se montan
  después, cuando el valor visible (crear y ver) ya esté. Alinea con "sencillo".
- **BD-04 Ocurrencias expandidas en el cliente** · el backend guarda 1 documento; el cliente calcula en
  qué días aparece (mes visible). *Pro:* backend simple, sin duplicar filas.

---

## 6. Log

- 2026-07-16 — Documento creado. Backend mapeado: Atlas + Auth + Tasks (plantilla) listos; reminders y
  notifications son stubs. Se arranca la feature **Reminders** (v1: crear + guardar + ver, entrada
  escrita; disparo y IA/voz después). Modelo decidido con el usuario (type / date / time /
  frequency+count). Roadmap R-1…R-5 (§4).
- 2026-07-16 — **v1 de Reminders COMPLETO (R-1…R-4).** Dominio `reminders/{model,data-access,feature}`
  calcado de Tasks, `RemindersModule` en `apps/api` (arranque + `401` verificados), el calendario lee de
  la API expandiendo ocurrencias, y el formulario "Crear recordatorio" (reemplaza el modal) crea vía
  `POST` y refresca. Pendiente R-5+: `DELETE`/editar, **disparo** (Agenda + gateway WS), voz + IA.
- 2026-07-18 — **R-5: editar/borrar (CRUD completo).** Backend `PATCH`/`DELETE` owner-aware
  (`UpdateReminderDto`, repo `update`; arranque + `401` verificados). UI: en la agenda del día, cada
  recordatorio con lápiz (form en modo edición → `PATCH`) y papelera (confirmación inline, con aviso de
  repeticiones si es recurrente → `DELETE`); `refetch` tras cualquier cambio. Pendiente R-6+: disparo
  (Agenda + gateway WS) y voz + IA por prompts.
- 2026-07-22 — **R-6: disparo en tiempo real (F-1/F-2/F-3).** **F-1** scheduler `Agenda` tras
  `SchedulerPort` (misma conexión Mongo; job `reminder-fire`; agenda/cancela por ocurrencia; hora local del
  servidor) — verificado con un job real disparándose contra Atlas. **F-2** desacople por evento de dominio
  `reminder.fired` (tipo en `shared`) + **`NotificationsGateway`** (Socket.IO, auth JWT por handshake, sala
  por `userId`, `@OnEvent` → emite `'reminder'`); `EventEmitterModule` + `NotificationsModule` en `apps/api`
  — arranque real verificado sin errores de DI. **F-3** cliente: `RealtimeProvider`/`useReminderSocket`
  (socket.io-client con el token), **toasts** app-wide y el **robot** del calendario pasa a `notify` al
  dispararse. Pendiente R-7+: voz + IA por prompts, y entrega offline. Detalle en §3.4/§4.
- 2026-07-22 — **R-6 pulido (cliente).** Al dispararse: un **"ding"** corto (Web Audio, sin archivo de
  audio) y el toast dura **~20s** (antes se iba rápido). Además, el calendario **no deja crear
  recordatorios en días pasados** (solo verlos/editarlos) — detalle en [`FRONTEND.md`](./FRONTEND.md) §5.2 C-4.
