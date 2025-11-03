# Quick Start Guide - Zeiterfassung mit Xano

Diese Anleitung führt dich Schritt für Schritt durch das Setup der Zeiterfassungs-App.

## ⚡ Schnellstart (5 Minuten)

### 1. Xano-Account erstellen
1. Gehe zu https://xano.com
2. Klicke "Sign Up" (kostenlos)
3. Erstelle eine neue **Instance**

### 2. Datenbank-Tabellen erstellen

#### a) User Table (Built-in Auth)
Xano hat bereits eine `user` Tabelle. Erweitere sie:

1. Gehe zu **Database** → Tabelle `user`
2. Füge folgende Felder hinzu:
   - `role` (text, default: 'user')
   - `is_active` (boolean, default: true)
   - `employee_id` (text, optional)
   - `avatar_url` (text, optional)

#### b) working_time Table
1. **Database** → "Add Table" → Name: `working_time`
2. Felder:
   ```
   id                      integer (Primary Key, Auto-increment)
   user_id                 integer (Foreign Key to user.id)
   valid_from              date
   monday_hours            float (default: 8.0)
   tuesday_hours           float (default: 8.0)
   wednesday_hours         float (default: 8.0)
   thursday_hours          float (default: 8.0)
   friday_hours            float (default: 8.0)
   saturday_hours          float (default: 0.0)
   sunday_hours            float (default: 0.0)
   federal_state           text (optional)
   works_on_public_holiday boolean (default: false)
   created_at              timestamp
   ```

#### c) time_entry Table
1. **Database** → "Add Table" → Name: `time_entry`
2. Felder:
   ```
   id          integer (Primary Key, Auto-increment)
   user_id     integer (Foreign Key to user.id)
   start       timestamp
   end         timestamp
   is_break    boolean (default: false)
   comment     text (optional)
   created_at  timestamp
   updated_at  timestamp
   ```

#### d) time_clock Table
1. **Database** → "Add Table" → Name: `time_clock`
2. Felder:
   ```
   id          integer (Primary Key, Auto-increment)
   user_id     integer (Foreign Key to user.id, UNIQUE!)
   started_at  timestamp
   is_break    boolean (default: false)
   comment     text (optional)
   created_at  timestamp
   ```
3. **Wichtig**: Setze `user_id` als **Unique** (ein User kann nur einen Timer haben)

#### e) overtime_account Table
1. **Database** → "Add Table" → Name: `overtime_account`
2. Felder:
   ```
   id                     integer (Primary Key, Auto-increment)
   user_id                integer (Foreign Key to user.id, UNIQUE!)
   max_allowed_overtime   float (default: 100.0)
   current_balance        float (default: 0.0)
   updated_at             timestamp
   ```

#### f) absence Table
1. **Database** → "Add Table" → Name: `absence`
2. Felder:
   ```
   id            integer (Primary Key, Auto-increment)
   user_id       integer (Foreign Key to user.id)
   absence_type  text (vacation/sick_leave/holiday/other)
   start_date    date
   end_date      date
   day_length    text (full/morning/afternoon)
   reason        text (optional)
   created_at    timestamp
   ```

### 3. Add-ons konfigurieren (Relationships)

#### user.active_timer (1:1)
1. Gehe zu Tabelle `user` → Tab **"Add-ons"**
2. Klicke "+ Add Field"
3. Name: `active_timer`
4. Type: **Relationship**
5. Related Table: `time_clock`
6. Foreign Key: `time_clock.user_id` → `user.id`
7. Type: **Single** (nullable)

#### user.overtime_account (1:1)
1. Tabelle `user` → **"Add-ons"**
2. Name: `overtime_account`
3. Related Table: `overtime_account`
4. Foreign Key: `overtime_account.user_id` → `user.id`
5. Type: **Single**

### 4. API-Endpunkte erstellen

#### Endpoint 1: POST /auth/signup
1. Gehe zu **API** → "+ Add API Endpoint"
2. Path: `/auth/signup`
3. Method: **POST**
4. **Function Stack**:

```
1. Input validation
   - email (text, required)
   - password (text, required, min 8 chars)
   - name (text, required)

2. Check if email exists
   - Query: db.query('user').where({email: input.email}).first()
   - If exists → Response 409 "Email already registered"

3. Create user (Xano auto-hashes password)
   - db.insert('user', {
       email: input.email,
       password: input.password,  // Xano hashed automatically
       name: input.name,
       role: 'user',
       is_active: true
     })

4. Create working_time for user
   - db.insert('working_time', {
       user_id: created_user.id,
       valid_from: today(),
       monday_hours: 8.0,
       tuesday_hours: 8.0,
       ... (all weekdays 8.0, weekend 0.0)
     })

5. Create overtime_account
   - db.insert('overtime_account', {
       user_id: created_user.id,
       max_allowed_overtime: 100.0,
       current_balance: 0.0
     })

6. Generate Auth Token
   - Use Xano's "Authentication: Generate Auth Token" function
   - Pass user.id

7. Response
   - Return { authToken: <token>, user: <user_object> }
```

#### Endpoint 2: POST /auth/login
1. **API** → "+ Add API Endpoint"
2. Path: `/auth/login`
3. Method: **POST**
4. **Function Stack**:

```
1. Input
   - email (text, required)
   - password (text, required)

2. Authenticate
   - Use Xano's "Authentication: Login" function
   - Email: input.email
   - Password: input.password
   - If fails → Response 401 "Invalid credentials"

3. Check if active
   - If user.is_active == false → Response 403 "Account deactivated"

4. Generate Auth Token
   - Authentication: Generate Auth Token (user.id)

5. Response
   - Return { authToken: <token>, user: <user_object> }
```

#### Endpoint 3: GET /auth/me
1. **API** → "+ Add API Endpoint"
2. Path: `/auth/me`
3. Method: **GET**
4. **Authentication**: Required (Enable "Require Authentication")
5. **Function Stack**:

```
1. Get authenticated user
   - var.authUser = Authentication: Get User

2. Add active_timer via Add-on
   - Add field: authUser.active_timer (auto via Add-on)

3. Add overtime_account via Add-on
   - Add field: authUser.overtime_account (auto via Add-on)

4. Response
   - Return authUser (with nested active_timer & overtime_account)
```

#### Endpoint 4: POST /time-clock/start
1. **API** → "+ Add API Endpoint"
2. Path: `/time-clock/start`
3. Method: **POST**
4. **Authentication**: Required
5. **Function Stack**:

```
1. Get user
   - var.user = Authentication: Get User

2. Check existing timer
   - var.existing = db.query('time_clock').where({user_id: user.id}).first()
   - If existing → Response 400 "Timer already running"

3. Create timer
   - var.timer = db.insert('time_clock', {
       user_id: user.id,
       started_at: now(),
       is_break: input.is_break (default: false),
       comment: input.comment
     })

4. Response
   - Return timer
```

#### Endpoint 5: POST /time-clock/stop
1. **API** → "+ Add API Endpoint"
2. Path: `/time-clock/stop`
3. Method: **POST**
4. **Authentication**: Required
5. **Function Stack**:

```
1. Get user
   - var.user = Authentication: Get User

2. Find active timer
   - var.timer = db.query('time_clock').where({user_id: user.id}).first()
   - If NOT found → Response 404 "No active timer"

3. Create time_entry
   - var.entry = db.insert('time_entry', {
       user_id: user.id,
       start: timer.started_at,
       end: now(),
       is_break: timer.is_break,
       comment: input.comment OR timer.comment
     })

4. Delete timer
   - db.delete('time_clock', {id: timer.id})

5. Response
   - Return { time_entry: entry }
```

#### Endpoint 6: GET /time-clock/current
1. **API** → "+ Add API Endpoint"
2. Path: `/time-clock/current`
3. Method: **GET**
4. **Authentication**: Required
5. **Function Stack**:

```
1. Get user
   - var.user = Authentication: Get User

2. Find timer
   - var.timer = db.query('time_clock').where({user_id: user.id}).first()

3. Calculate elapsed
   - If timer exists:
     - timer.elapsed_seconds = (now() - timer.started_at).total_seconds()

4. Response
   - Return timer (or 204 No Content if null)
```

### 5. Frontend Setup

1. In deinem Terminal:
   ```bash
   cd /Users/keller/code/zeiterfassung-xano
   ```

2. Erstelle `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

3. Bearbeite `.env.local` mit deiner Xano URL:
   ```env
   NEXT_PUBLIC_XANO_BASE_URL=https://xYOUR-INSTANCE.xano.io
   NEXT_PUBLIC_XANO_API_GROUP=api:v1
   ```

4. Starte die App:
   ```bash
   npm run dev
   ```

5. Öffne http://localhost:3000

### 6. Erste Schritte testen

1. **Registrieren**:
   - Gehe zu http://localhost:3000/auth/signup
   - Erstelle einen Account

2. **Anmelden**:
   - Login mit deinen Credentials

3. **Timer starten**:
   - Im Dashboard: Klicke "Start Timer"
   - Warte ein paar Sekunden
   - Klicke "Stop Timer"

4. **Zeiteintrag prüfen**:
   - Gehe zu "Zeiteinträge"
   - Du solltest deinen ersten Eintrag sehen!

## 🎉 Geschafft!

Du hast jetzt eine funktionierende Zeiterfassungs-App mit Xano Backend!

## 📋 Nächste Schritte

1. Erstelle weitere API-Endpunkte:
   - `GET /time-entries` (Liste)
   - `POST /time-entries` (Manuell erstellen)
   - `GET /reports/week` (Wochenbericht)

2. Baue die Frontend-Komponenten aus

3. Füge Admin-Features hinzu

## 🆘 Häufige Probleme

### "Cannot connect to Xano"
→ Prüfe deine `.env.local` URL

### "404 Endpoint not found"
→ Stelle sicher, dass der Endpunkt in Xano **deployed** ist (rechts oben: "Save & Deploy")

### "401 Unauthorized"
→ Token ungültig. Logout und neu einloggen.

### Xano Function Stack Fehler
→ Prüfe die Xano Debug Console (unten im Function Stack Editor)

---

**Viel Erfolg! 🚀**

Bei Fragen: Siehe `README.md` und die detaillierten Docs in `/docs`.
