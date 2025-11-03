# Zeiterfassung - Xano Edition

Eine moderne Zeiterfassungs-App gebaut mit **Next.js 15**, **React 19**, **TypeScript** und **Xano** als Backend.

## 🚀 Features

- ⏱️ **Zeiterfassung**
  - Stoppuhr-Modus (Start/Stop Timer)
  - Manuelle Zeiteinträge
  - Pausen-Tracking

- 📊 **Berichte & Analysen**
  - Wochenberichte mit Soll/Ist-Vergleich
  - Monatsberichte
  - Überstunden-Tracking
  - Visualisierungen

- 👥 **Benutzerverwaltung**
  - Multi-User Support
  - Rollen: User, Office, Admin
  - Xano JWT Authentication

- 🏢 **Arbeitszeitverwaltung**
  - Individuelle Arbeitszeiten pro Wochentag
  - Bundesland-spezifische Feiertage
  - Abwesenheiten (Urlaub, Krankheit)

## 📋 Voraussetzungen

- Node.js 18+ und npm
- Xano-Account (kostenlos: https://xano.com)

## 🛠️ Setup

### 1. Repository klonen

```bash
cd /Users/keller/code/zeiterfassung-xano
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Xano-Backend einrichten

#### a) Xano-Account erstellen
1. Gehe zu https://xano.com und erstelle einen kostenlosen Account
2. Erstelle eine neue Instance

#### b) Datenbank-Tabellen erstellen

Folge der Anleitung in `docs/XANO_DATABASE_SCHEMA.md`:

**Tabellen** (in dieser Reihenfolge):
1. `user` (nutze Xano's Built-in Auth Table und erweitere sie)
2. `working_time`
3. `time_entry`
4. `time_clock`
5. `overtime_account`
6. `absence`

**Wichtige Schritte**:
- Setze alle Primary Keys auf Auto-increment
- Konfiguriere die **Add-ons** (Relationships) wie beschrieben
- Setze **Unique Constraints**:
  - `user.email`
  - `time_clock.user_id`
  - `overtime_account.user_id`
  - `working_time (user_id, valid_from)`

#### c) API-Endpunkte erstellen

Folge der Anleitung in `docs/XANO_API_ENDPOINTS.md`:

**Mindestens diese Endpunkte erstellen**:
1. **Auth**: `/auth/signup`, `/auth/login`, `/auth/me`
2. **Time Clock**: `/time-clock/start`, `/time-clock/stop`, `/time-clock/current`
3. **Time Entries**: `/time-entries` (GET, POST, PATCH, DELETE)
4. **Reports**: `/reports/week`, `/reports/month`
5. **Overtime**: `/overtime/balance`

**Xano Function Stack Beispiele**:

```
POST /time-clock/start:
1. Get authenticated user (from JWT)
2. Check if time_clock exists for user → Error if yes
3. Create time_clock record
4. Return created record
```

```
POST /time-clock/stop:
1. Get authenticated user
2. Find time_clock for user → Error if not found
3. Create time_entry with:
   - start = time_clock.started_at
   - end = NOW()
   - Calculate duration
4. Delete time_clock record
5. Return time_entry
```

```
GET /auth/me:
1. Get authenticated user (Xano auto-validates JWT)
2. Add "active_timer" via Add-on (time_clock relationship)
3. Add "overtime_account" via Add-on
4. Return user with nested objects
```

### 4. Environment Variables

Erstelle `.env.local` basierend auf `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Bearbeite `.env.local`:

```env
NEXT_PUBLIC_XANO_BASE_URL=https://xYOUR-INSTANCE.xano.io
NEXT_PUBLIC_XANO_API_GROUP=api:v1
```

**Deine Xano URL findest du**:
1. Gehe zu Xano → API
2. Klicke auf einen Endpunkt
3. Kopiere die Base URL (z.B. `https://xv05-su7k-rvc8.f2.xano.io`)

### 5. App starten

```bash
npm run dev
```

Öffne http://localhost:3000

## 📚 Projektstruktur

```
zeiterfassung-xano/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing Page
│   ├── layout.tsx           # Root Layout
│   ├── globals.css          # TailwindCSS Styles
│   ├── auth/                # Auth Pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/           # Dashboard (nach Login)
│   ├── time-entries/        # Zeiteinträge verwalten
│   ├── reports/             # Berichte
│   └── admin/               # Admin-Bereich
│
├── components/              # React Components
│   ├── TimeClock.tsx       # Stoppuhr-Komponente
│   ├── TimeEntryForm.tsx   # Formular für manuelle Einträge
│   ├── WeekReport.tsx      # Wochenbericht-Komponente
│   └── ...
│
├── lib/                     # Utilities & API Client
│   ├── types.ts            # TypeScript Types
│   ├── xano-client.ts      # Xano API Client (Singleton)
│   └── utils.ts            # Helper Functions
│
├── docs/                    # Dokumentation
│   ├── XANO_DATABASE_SCHEMA.md     # Datenbank-Struktur
│   └── XANO_API_ENDPOINTS.md       # API-Endpunkte
│
├── public/                  # Static Assets
├── .env.local.example      # Environment Template
├── next.config.ts          # Next.js Config
├── tailwind.config.ts      # TailwindCSS Config
└── package.json
```

## 🔧 Technologie-Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS 4.1
- **Build Tool**: Turbopack (via Next.js)

### Backend
- **BaaS**: Xano (Database + API + Auth)
- **Authentication**: Xano JWT
- **Database**: PostgreSQL (managed by Xano)

## 🎯 Xano API Client Usage

Die App verwendet einen TypeScript API Client (`lib/xano-client.ts`):

```typescript
import { xanoClient } from '@/lib/xano-client';

// Login
const { authToken, user } = await xanoClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Timer starten
const timer = await xanoClient.startTimer({
  is_break: false,
  comment: 'Projektarbeit'
});

// Timer stoppen
const { time_entry } = await xanoClient.stopTimer();

// Zeiteinträge abrufen
const { items, pagination } = await xanoClient.getTimeEntries({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  page: 1,
  per_page: 20
});

// Wochenbericht
const report = await xanoClient.getWeekReport('2024-01-15');
```

## 📖 Xano Setup Guides

### Detaillierte Anleitungen:

1. **Datenbank-Schema**: `docs/XANO_DATABASE_SCHEMA.md`
   - Alle 6 Tabellen mit Feldtypen
   - Add-ons (Relationships) Konfiguration
   - Indizes und Constraints

2. **API-Endpunkte**: `docs/XANO_API_ENDPOINTS.md`
   - 23 vollständige API-Endpunkte
   - Request/Response Beispiele
   - Xano Function Stack Implementierung
   - Business Logic (Validierungen, Berechnungen)

## 🔐 Authentication Flow

1. **Signup**: User registriert sich → Xano erstellt User + JWT Token
2. **Login**: User meldet sich an → Xano validiert & gibt JWT zurück
3. **Authenticated Requests**: Frontend sendet JWT im `Authorization` Header
4. **Token Storage**: JWT wird in `localStorage` gespeichert (client-side)

```typescript
// Nach Login/Signup automatisch gesetzt
xanoClient.setAuthToken(authToken);

// Bei jedem Request automatisch im Header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚦 Nächste Schritte

### Phase 1: Xano Backend fertigstellen ✅
- [x] Datenbank-Tabellen erstellen
- [x] Add-ons konfigurieren
- [ ] Auth-Endpunkte implementieren (`/auth/signup`, `/auth/login`, `/auth/me`)
- [ ] Time-Clock-Endpunkte (`/time-clock/*`)
- [ ] Time-Entry-Endpunkte (`/time-entries/*`)

### Phase 2: Frontend Components bauen
- [ ] Login/Signup Pages
- [ ] Dashboard mit Übersicht
- [ ] Timer-Komponente (Start/Stop)
- [ ] Zeiteinträge-Liste
- [ ] Wochenbericht-Komponente
- [ ] Monatsbericht-Komponente

### Phase 3: Advanced Features
- [ ] Admin-Bereich (Benutzerverwaltung)
- [ ] Arbeitszeiteinstellungen
- [ ] Abwesenheiten erfassen
- [ ] CSV-Export
- [ ] Dark Mode

## 📝 Entwicklung

### Dev Server starten
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

## 🆘 Troubleshooting

### "NEXT_PUBLIC_XANO_BASE_URL is not defined"
→ Erstelle `.env.local` und setze deine Xano URL

### "401 Unauthorized"
→ Token abgelaufen oder ungültig. Neu einloggen.

### "Cannot connect to Xano"
→ Prüfe deine Xano Instance URL in `.env.local`

### Xano API gibt 404
→ Stelle sicher, dass der Endpunkt in Xano existiert und deployed ist

## 🎨 UI/UX Features

- Responsive Design (Mobile, Tablet, Desktop)
- TailwindCSS für konsistentes Styling
- Loading States & Error Handling
- Form Validation
- Toast Notifications (via React Toast Library - noch zu installieren)

## 📊 Datenfluss-Beispiel: Timer starten & stoppen

```
1. User klickt "Start Timer"
   ↓
2. Frontend: xanoClient.startTimer({ is_break: false, comment: "..." })
   ↓
3. POST https://your-instance.xano.io/api:v1/time-clock/start
   Headers: Authorization: Bearer <JWT>
   Body: { is_break: false, comment: "..." }
   ↓
4. Xano Function Stack:
   a) Validate JWT → Get user.id
   b) Check: No existing time_clock for user
   c) db.insert('time_clock', { user_id, started_at: NOW(), ... })
   d) Return created record
   ↓
5. Frontend: Timer-UI zeigt laufende Zeit
   ↓
6. User klickt "Stop Timer"
   ↓
7. Frontend: xanoClient.stopTimer()
   ↓
8. POST https://your-instance.xano.io/api:v1/time-clock/stop
   ↓
9. Xano Function Stack:
   a) Find time_clock for user
   b) Create time_entry { start: time_clock.started_at, end: NOW() }
   c) Delete time_clock
   d) Trigger overtime recalculation (async)
   e) Return time_entry
   ↓
10. Frontend: Zeigt neu erstellten Zeiteintrag
```

## 🤝 Contributing

Dies ist ein Demo-Projekt. Für Production-Use:
- Füge Error Boundaries hinzu
- Implementiere Retry Logic
- Füge Analytics hinzu
- Implementiere E2E Tests (Playwright)

## 📄 Lizenz

MIT License - Frei verwendbar für eigene Projekte

## 🔗 Links

- **Xano Docs**: https://docs.xano.com
- **Next.js Docs**: https://nextjs.org/docs
- **TailwindCSS**: https://tailwindcss.com/docs

---

**Entwickelt mit ❤️ und Claude Code**

Basierend auf der [urlaubsverwaltung/zeiterfassung](https://github.com/urlaubsverwaltung/zeiterfassung) App
