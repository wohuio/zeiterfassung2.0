# Xano Database Schema - Zeiterfassung App

## Übersicht
Diese Dokumentation beschreibt die komplette Xano-Datenbankstruktur für die Zeiterfassungs-App.

---

## 📊 Datenbank-Tabellen

### 1. **user** (Xano Built-in Authentication Table)
Verwendet die Standard-Xano-Authentifizierung mit erweiterten Feldern.

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Auto-increment Primary Key |
| email | text | Ja | Unique, Login-E-Mail |
| name | text | Ja | Vollständiger Name des Benutzers |
| created_at | timestamp | Ja | Registrierungszeitpunkt |
| role | text | Ja | Rolle: `user`, `office`, `admin` |
| is_active | boolean | Ja | Account aktiv (default: true) |
| avatar_url | text | Nein | Optionales Profilbild |
| employee_id | text | Nein | Optional: Mitarbeiter-ID |

**Hinweis**: Xano verwaltet `password_hash` automatisch. Niemals im Frontend zugänglich!

---

### 2. **working_time**
Definiert die Sollarbeitszeiten pro Benutzer und Woche.

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Primary Key |
| user_id | integer | Ja | Foreign Key → user.id |
| valid_from | date | Ja | Ab wann diese Arbeitszeitregelung gilt |
| monday_hours | float | Nein | Sollstunden Montag (default: 8.0) |
| tuesday_hours | float | Nein | Sollstunden Dienstag (default: 8.0) |
| wednesday_hours | float | Nein | Sollstunden Mittwoch (default: 8.0) |
| thursday_hours | float | Nein | Sollstunden Donnerstag (default: 8.0) |
| friday_hours | float | Nein | Sollstunden Freitag (default: 8.0) |
| saturday_hours | float | Nein | Sollstunden Samstag (default: 0.0) |
| sunday_hours | float | Nein | Sollstunden Sonntag (default: 0.0) |
| federal_state | text | Nein | Bundesland für Feiertage (z.B. "Baden-Württemberg") |
| works_on_public_holiday | boolean | Nein | Arbeitet an Feiertagen? (default: false) |
| created_at | timestamp | Ja | Erstellungszeitpunkt |

**Indizes**:
- `user_id` (für schnelle Abfragen pro Benutzer)
- Unique: `user_id + valid_from` (keine Duplikate)

---

### 3. **time_entry**
Erfasst abgeschlossene Zeiteinträge (manuelle Einträge oder gestoppte Timer).

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Primary Key |
| user_id | integer | Ja | Foreign Key → user.id |
| start | timestamp | Ja | Start-Zeitpunkt |
| end | timestamp | Ja | End-Zeitpunkt |
| is_break | boolean | Ja | Ist es eine Pause? (default: false) |
| comment | text | Nein | Optional: Kommentar zur Tätigkeit |
| created_at | timestamp | Ja | Wann wurde der Eintrag erstellt |
| updated_at | timestamp | Ja | Letzte Änderung |

**Indizes**:
- `user_id` (für Benutzer-spezifische Abfragen)
- `start` (für Datumsbereichs-Filter)
- Composite: `user_id + start` (Performance)

**Business Rules** (in Xano Function Stack):
- `end` muss nach `start` liegen
- Keine Überlappungen für denselben Benutzer (außer is_break=true)
- Maximale Dauer: 24 Stunden

---

### 4. **time_clock**
Aktive "laufende" Timer (Stoppuhr-Modus).

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Primary Key |
| user_id | integer | Ja | Foreign Key → user.id |
| started_at | timestamp | Ja | Wann wurde der Timer gestartet |
| is_break | boolean | Ja | Ist es eine Pause? (default: false) |
| comment | text | Nein | Optional: Was wird gerade gemacht |
| created_at | timestamp | Ja | Erstellungszeitpunkt |

**Unique Constraint**: `user_id` (Ein Benutzer kann nur EINEN aktiven Timer haben)

**Business Logic**:
- Beim "Stoppen": Eintrag wird zu `time_entry` konvertiert und aus `time_clock` gelöscht

---

### 5. **overtime_account**
Überstunden-Konto und Limits pro Benutzer.

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Primary Key |
| user_id | integer | Ja | Foreign Key → user.id (Unique) |
| max_allowed_overtime | float | Ja | Maximal erlaubte Überstunden (default: 100.0) |
| current_balance | float | Ja | Aktueller Überstunden-Saldo (auto-calculated) |
| updated_at | timestamp | Ja | Letzte Neuberechnung |

**Unique Constraint**: `user_id`

---

### 6. **absence**
Abwesenheiten (Urlaub, Krankheit, etc.) die bei Überstunden-Berechnung berücksichtigt werden.

| Feldname | Typ | Erforderlich | Beschreibung |
|----------|-----|--------------|--------------|
| id | integer | Ja | Primary Key |
| user_id | integer | Ja | Foreign Key → user.id |
| absence_type | text | Ja | Typ: `vacation`, `sick_leave`, `holiday`, `other` |
| start_date | date | Ja | Startdatum |
| end_date | date | Ja | Enddatum (inklusiv) |
| day_length | text | Ja | `full`, `morning`, `afternoon` |
| reason | text | Nein | Optional: Grund/Notizen |
| created_at | timestamp | Ja | Erstellungszeitpunkt |

**Indizes**:
- `user_id`
- Composite: `user_id + start_date`

---

## 🔗 Relationships (Add-ons in Xano)

Xano verwendet **Add-ons** statt klassische Joins für verschachtelte Objekte.

### user → time_entries (1:many)
```
user.time_entries (Add-on)
  - Related Table: time_entry
  - Foreign Key: time_entry.user_id → user.id
  - Type: Array
```

### user → working_times (1:many)
```
user.working_times (Add-on)
  - Related Table: working_time
  - Foreign Key: working_time.user_id → user.id
  - Type: Array
```

### user → active_timer (1:1)
```
user.active_timer (Add-on)
  - Related Table: time_clock
  - Foreign Key: time_clock.user_id → user.id
  - Type: Single Object (nullable)
```

### user → overtime_account (1:1)
```
user.overtime_account (Add-on)
  - Related Table: overtime_account
  - Foreign Key: overtime_account.user_id → user.id
  - Type: Single Object
```

### user → absences (1:many)
```
user.absences (Add-on)
  - Related Table: absence
  - Foreign Key: absence.user_id → user.id
  - Type: Array
```

---

## 🎯 Datenbank-Setup in Xano

### Schritt 1: Tabellen erstellen
1. Gehe zu **Database** in Xano
2. Erstelle jede Tabelle mit den oben genannten Feldern
3. Setze Primary Keys und Auto-increment
4. Aktiviere `created_at` und `updated_at` Timestamps wo nötig

### Schritt 2: Add-ons konfigurieren
1. Gehe zu jeder Tabelle (z.B. `user`)
2. Klicke auf **"Add-ons"** Tab
3. Füge die oben beschriebenen Relationships hinzu
4. Wähle **Related Table** und **Foreign Key Field**

### Schritt 3: Default Values setzen
- `working_time`: Montag-Freitag = 8.0, Wochenende = 0.0
- `time_entry.is_break`: false
- `user.is_active`: true
- `user.role`: 'user'

### Schritt 4: Unique Constraints
- `user.email`: Unique (wird von Xano Auth automatisch gesetzt)
- `time_clock.user_id`: Unique
- `overtime_account.user_id`: Unique
- `working_time (user_id, valid_from)`: Unique Composite

---

## 📝 Hinweise zur Implementierung

### Überstunden-Berechnung
Die `current_balance` in `overtime_account` wird automatisch berechnet über:
1. Summe aller `time_entry` (wo `is_break=false`)
2. Minus: Sollstunden aus `working_time` für jeden Tag
3. Minus: Sollstunden für `absence`-Tage (außer `sick_leave`)

Dies wird in einem **Custom Function Stack API** berechnet (siehe API-Dokumentation).

### Zeitzone-Handling
- Alle `timestamp` Felder in UTC speichern
- Frontend konvertiert zu lokaler Zeitzone
- Für Berichte: Date-Filter auf UTC-Basis

### Performance-Optimierungen
- Indizes auf `user_id` für alle Tabellen
- Composite Index auf `user_id + date` für time_entry
- Pagination für Listen-Endpoints (limit/offset)

---

Nächster Schritt: **API-Endpunkte** (siehe `XANO_API_ENDPOINTS.md`)
