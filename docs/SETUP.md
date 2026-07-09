# SETUP — Bootstrap del monorepo (paso a paso)

> Guía para inicializar el workspace NX en **tu máquina**, subirlo a git y clonarlo donde
> vayamos a trabajar. Sigue el diseño de [`docs/PLAN.md`](./PLAN.md):
> **scope `@asistente`**, **Screaming Architecture**, **Agenda (MVP)**, **máx. 150 líneas/archivo**.
>
> Copia y pega bloque por bloque. Cada paso indica qué debe pasar.

---

## 0. Requisitos previos

```bash
node -v      # >= 20 (probado con 22.x)
npm -v       # >= 10.x
git --version
```

> Si Node es menor a 20, instala Node 22 LTS antes de continuar (nvm recomendado).

---

## 1. Crear el workspace NX

El **nombre del workspace define el scope npm**. Usamos `asistente` → los imports quedan
como `@asistente/...`.

```bash
# Ubícate en la carpeta PADRE donde quieres que se cree el proyecto
cd ~/proyectos        # ajusta a tu gusto

npx create-nx-workspace@latest asistente \
  --preset=apps \
  --workspaceType=integrated \
  --nxCloud=skip \
  --packageManager=npm \
  --formatter=prettier \
  --interactive=false
```

- Se crea la carpeta `asistente/` con un monorepo NX integrado vacío.
- Deja que instale dependencias (tarda unos minutos).

```bash
cd asistente
npx nx --version     # confirma que NX responde (Local: 23.x)
```

> **Si falla con `nx: Permission denied`** → tu `/tmp` está montado `noexec`. Solución:
> ```bash
> mkdir -p ~/.nxtmp
> export TMPDIR=~/.nxtmp
> ```
> y repite el comando de creación. (Este fue justo el problema en la VM.)

---

## 2. Instalar plugins de framework

```bash
npm i -D @nx/next @nx/nest @nx/js @nx/react @nx/eslint @nx/jest
```

---

## 3. Generar las apps (delgadas)

```bash
# Frontend Next.js (App Router)
npx nx g @nx/next:application client \
  --directory=apps/client --style=css --appDir=true --e2eTestRunner=none

# Backend NestJS
npx nx g @nx/nest:application api \
  --directory=apps/api --e2eTestRunner=none
```

Verifica que arrancan:

```bash
npx nx serve api      # http://localhost:3000/api
npx nx dev client  # http://localhost:4200
# Ctrl+C para parar cada uno
```

---

## 4. Generar las libs de dominio (Screaming Architecture)

Cada lib lleva **tags** (`scope:*`, `type:*`) para las fronteras NX.

> ⚠️ **Dos aprendizajes del scaffold real (imprescindibles):**
> 1. Hay que pasar **`--name` único** por lib. Si no, NX 23 toma el nombre de la última
>    carpeta (`libs/tasks/ui` → `ui`) y colisiona con `libs/shared/ui` → `ui`.
> 2. El **`--importPath` no puede llevar dos `/`**: un nombre de paquete npm sólo admite
>    `@scope/nombre`. Por eso usamos **guion**: `@asistente/tasks-feature` (no `.../tasks/feature`).
>
> Cada comando incluye además `--bundler=none --unitTestRunner=jest --linter=eslint
> --no-interactive` para no responder prompts uno a uno.

```bash
# --- shared ---
npx nx g @nx/js:lib    --name=shared-types --directory=libs/shared/types --importPath=@asistente/shared-types --tags=scope:shared,type:model --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib    --name=shared-utils --directory=libs/shared/utils --importPath=@asistente/shared-utils --tags=scope:shared,type:util  --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/react:lib --name=shared-ui    --directory=libs/shared/ui    --importPath=@asistente/shared-ui    --tags=scope:shared,type:ui    --bundler=none --unitTestRunner=jest --linter=eslint --style=css --no-interactive

# --- auth ---
npx nx g @nx/js:lib --name=auth-model       --directory=libs/auth/model       --importPath=@asistente/auth-model       --tags=scope:auth,type:model       --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=auth-data-access --directory=libs/auth/data-access --importPath=@asistente/auth-data-access --tags=scope:auth,type:data-access --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=auth-feature     --directory=libs/auth/feature     --importPath=@asistente/auth-feature     --tags=scope:auth,type:feature     --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive

# --- tasks ---
npx nx g @nx/js:lib    --name=tasks-model       --directory=libs/tasks/model       --importPath=@asistente/tasks-model       --tags=scope:tasks,type:model       --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib    --name=tasks-data-access --directory=libs/tasks/data-access --importPath=@asistente/tasks-data-access --tags=scope:tasks,type:data-access --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib    --name=tasks-feature     --directory=libs/tasks/feature     --importPath=@asistente/tasks-feature     --tags=scope:tasks,type:feature     --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/react:lib --name=tasks-ui          --directory=libs/tasks/ui          --importPath=@asistente/tasks-ui          --tags=scope:tasks,type:ui          --bundler=none --unitTestRunner=jest --linter=eslint --style=css --no-interactive

# --- reminders ---
npx nx g @nx/js:lib --name=reminders-model       --directory=libs/reminders/model       --importPath=@asistente/reminders-model       --tags=scope:reminders,type:model       --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=reminders-data-access --directory=libs/reminders/data-access --importPath=@asistente/reminders-data-access --tags=scope:reminders,type:data-access --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=reminders-feature     --directory=libs/reminders/feature     --importPath=@asistente/reminders-feature     --tags=scope:reminders,type:feature     --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive

# --- notifications ---
npx nx g @nx/js:lib --name=notifications-model       --directory=libs/notifications/model       --importPath=@asistente/notifications-model       --tags=scope:notifications,type:model       --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=notifications-data-access --directory=libs/notifications/data-access --importPath=@asistente/notifications-data-access --tags=scope:notifications,type:data-access --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/js:lib --name=notifications-feature     --directory=libs/notifications/feature     --importPath=@asistente/notifications-feature     --tags=scope:notifications,type:feature     --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive

# --- avatar ---
npx nx g @nx/js:lib    --name=avatar-model --directory=libs/avatar/model --importPath=@asistente/avatar-model --tags=scope:avatar,type:model --bundler=none --unitTestRunner=jest --linter=eslint --no-interactive
npx nx g @nx/react:lib --name=avatar-ui    --directory=libs/avatar/ui    --importPath=@asistente/avatar-ui    --tags=scope:avatar,type:ui    --bundler=none --unitTestRunner=jest --linter=eslint --style=css --no-interactive
```

Verifica el grafo (debe "gritar" los dominios):

```bash
npx nx graph
```

---

## 5. Instalar paquetes de dominio

```bash
# Backend (Nest + Mongo + Auth + WebSocket + validación + scheduler MVP)
npm i @nestjs/mongoose mongoose @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt \
      class-validator class-transformer @nestjs/websockets @nestjs/platform-socket.io socket.io \
      bcrypt agenda
npm i -D @types/passport-jwt @types/bcrypt

# Frontend (avatar + realtime)
npm i framer-motion socket.io-client
```

> BullMQ/Redis se dejan para más adelante (`npm i bullmq ioredis`); en MVP usamos Agenda.

---

## 6. Configuración base (modularidad + fronteras)

### 6.1 Regla dura: máx. 150 líneas por archivo (ESLint)

Edita el ESLint raíz del workspace (`eslint.config.mjs` o `.eslintrc.json` según versión).

**Flat config (`eslint.config.mjs`)** — añade dentro del bloque de reglas general:

```js
rules: {
  'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }],
}
```

**Legacy (`.eslintrc.json`)**:

```jsonc
{
  "overrides": [
    {
      "files": ["*.ts", "*.tsx", "*.js", "*.jsx"],
      "rules": {
        "max-lines": ["error", { "max": 150, "skipBlankLines": true, "skipComments": true }]
      }
    }
  ]
}
```

Comprueba:

```bash
npx nx run-many -t lint
```

### 6.2 Fronteras de módulos (Screaming Architecture)

En la config ESLint raíz, la regla `@nx/enforce-module-boundaries` ya existe; ajusta
`depConstraints` para nuestros tags:

```jsonc
"@nx/enforce-module-boundaries": ["error", {
  "depConstraints": [
    { "sourceTag": "type:feature",     "onlyDependOnLibsWithTags": ["type:feature","type:data-access","type:ui","type:model","scope:shared"] },
    { "sourceTag": "type:data-access", "onlyDependOnLibsWithTags": ["type:data-access","type:model","scope:shared"] },
    { "sourceTag": "type:ui",          "onlyDependOnLibsWithTags": ["type:ui","type:model","scope:shared"] },
    { "sourceTag": "type:model",       "onlyDependOnLibsWithTags": ["type:model","scope:shared"] },

    { "sourceTag": "scope:auth",          "onlyDependOnLibsWithTags": ["scope:auth","scope:shared"] },
    { "sourceTag": "scope:tasks",         "onlyDependOnLibsWithTags": ["scope:tasks","scope:shared"] },
    { "sourceTag": "scope:reminders",     "onlyDependOnLibsWithTags": ["scope:reminders","scope:shared"] },
    { "sourceTag": "scope:notifications", "onlyDependOnLibsWithTags": ["scope:notifications","scope:shared"] },
    { "sourceTag": "scope:avatar",        "onlyDependOnLibsWithTags": ["scope:avatar","scope:shared"] },
    { "sourceTag": "scope:shared",        "onlyDependOnLibsWithTags": ["scope:shared"] }
  ]
}]
```

> Los tags están en el `project.json` (o `package.json`) de cada lib, en `"tags"`.

### 6.3 Variables de entorno

Crea `.env.example` en la raíz:

```bash
cat > .env.example <<'EOF'
# --- API ---
PORT=3000
MONGODB_URI=mongodb://localhost:27017/asistente
JWT_ACCESS_SECRET=changeme-access
JWT_REFRESH_SECRET=changeme-refresh
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
# --- NLU / LLM (opcional, fase 6) ---
LLM_PROVIDER=anthropic
LLM_API_KEY=
EOF
cp .env.example .env
```

---

## 7. Verificación final

```bash
npx nx graph                 # estructura por dominios
npx nx run-many -t lint      # incluye la regla max-lines (150)
npx nx run-many -t test      # tests generados por defecto
npx nx serve api             # backend arriba
npx nx serve client         # frontend arriba
```

---

## 8. Subir a git y clonar donde trabajaremos

### 8.1 Desde tu máquina (donde creaste `asistente/`)

```bash
cd asistente
git init                      # create-nx-workspace ya pudo hacerlo; si no, este
git add -A
git commit -m "chore(nx): scaffold inicial monorepo asistente (apps + libs + config)"

# Crea el repo remoto (GitHub) — con gh o a mano en la web
gh repo create asistente --private --source=. --remote=origin --push
# ...o manual:
# git remote add origin git@github.com:<tu-usuario>/asistente.git
# git branch -M main
# git push -u origin main
```

### 8.2 Clonar en el entorno de trabajo

```bash
cd ~/                         # o donde corresponda
git clone git@github.com:<tu-usuario>/asistente.git
cd asistente
npm install                   # restaura node_modules
cp .env.example .env          # y rellena secretos
npx nx graph                  # smoke test
```

> Recuerda copiar también `docs/PLAN.md` (y este `docs/SETUP.md`) al nuevo repo si los
> quieres versionar allí. Puedes moverlos a la carpeta `asistente/docs/` antes del commit
> del paso 8.1.

---

## 9. Checklist rápido

- [ ] Workspace `asistente` creado (scope `@asistente`).
- [ ] Apps `client` (Next) y `api` (Nest) arrancan.
- [ ] 18 libs de dominio generadas con sus tags.
- [ ] Paquetes de dominio instalados.
- [ ] Regla `max-lines: 150` activa y lint en verde.
- [ ] `enforce-module-boundaries` con los `depConstraints` del paso 6.2.
- [ ] `.env.example` creado.
- [ ] Repo subido a git y clonado en el entorno de trabajo.

Cuando lo tengas clonado aquí, seguimos con **T-07 (agentes Claude por carpeta)** y la
**Fase 1 (dominio Tasks)** de [`docs/PLAN.md`](./PLAN.md).
