# Xano Backend Setup für Zeiterfassung App

## 🔧 API Endpoints Configuration

### Base URLs
- **Auth Group**: `https://xv05-su7k-rvc8.f2.xano.io/api:eltyNUzq`
- **Time Clock Group**: `https://xv05-su7k-rvc8.f2.xano.io/api:uMXZ3Fde`

## ⚠️ Wichtige Hinweise

**Schema Design**:
- Die `time_clock` Tabelle speichert **NUR AKTIVE Timer** (kein `ended_at` Feld!)
- Beim Stoppen wird der Timer **gelöscht** und als `time_entry` gespeichert
- Ein User kann nur **EINEN** aktiven Timer haben (UNIQUE constraint auf `user_id`)

---

## ⏱️ Time Clock Endpoints (Time Clock Group)

### 1. GET `/current` - Aktiven Timer abrufen

**Zweck**: Gibt den aktuell laufenden Timer des eingeloggten Benutzers zurück.

**Authentication**: ✅ Required (Bearer Token)

**XanoScript Logic**:
```javascript
// Function Stack:
// 1. Query time_clock table (single record per user)
db.query time_clock {
  where = $db.time_clock.user_id == $auth.id
  return = {type: "single"}
} as $active_timer

// 2. Calculate elapsed_seconds if timer exists
if ($active_timer != null) {
  var $elapsed_seconds = (now - $active_timer.started_at) / 1000
}

// 3. Response:
response = $active_timer != null ? {
  id: $active_timer.id,
  user_id: $active_timer.user_id,
  started_at: $active_timer.started_at,
  is_break: $active_timer.is_break,
  comment: $active_timer.comment,
  elapsed_seconds: $elapsed_seconds
} : null
```

**Wichtig**:
- `time_clock` hat **kein `ended_at` Feld** - nur aktive Timer!
- Unique Index auf `user_id` - ein User = max. ein Timer
- Wenn kein Timer: `null` zurückgeben (nicht 404)

**Response** (200 OK):
```json
{
  "id": 123,
  "user_id": 5,
  "started_at": 1730500800000,
  "is_break": false,
  "comment": "Feature Development"
}
```

**Response** (wenn kein Timer läuft):
- Status: `204 No Content` oder `404 Not Found`

---

### 2. POST `/start` - Timer starten

**Zweck**: Startet einen neuen Timer für den eingeloggten Benutzer.

**Authentication**: ✅ Required (Bearer Token)

**Input** (JSON Body):
```json
{
  "is_break": false,
  "comment": "Optional description"
}
```

**XanoScript Logic**:
```javascript
// Function Stack:
// 1. Get Auth User -> var: auth_user

// 2. Check for existing active timer:
var existing_timer = db.query('time_clocks')
  .where('user_id', '==', auth_user.id)
  .where('ended_at', '==', null)
  .first();

// 3. Conditional - Prevent duplicate timers:
if (existing_timer) {
  // Return error
  return {
    message: 'Ein Timer läuft bereits. Bitte zuerst stoppen.',
    code: 'TIMER_ALREADY_RUNNING'
  };
}

// 4. Create new timer:
var new_timer = db.add_record('time_clocks', {
  user_id: auth_user.id,
  started_at: Date.now(),
  is_break: input.is_break || false,
  comment: input.comment || null,
  ended_at: null
});

// 5. Response:
return {
  id: new_timer.id,
  user_id: new_timer.user_id,
  started_at: new_timer.started_at,
  is_break: new_timer.is_break,
  comment: new_timer.comment
};
```

**Response** (200 OK):
```json
{
  "id": 124,
  "user_id": 5,
  "started_at": 1730501000000,
  "is_break": false,
  "comment": "Feature Development"
}
```

---

### 3. POST `/stop` - Timer stoppen

**Zweck**: Stoppt den laufenden Timer und erstellt einen TimeEntry.

**Authentication**: ✅ Required (Bearer Token)

**Input** (JSON Body - Optional):
```json
{
  "comment": "Updated comment"
}
```

**XanoScript Logic**:
```javascript
// Function Stack:
// 1. Get Auth User -> var: auth_user

// 2. Find active timer:
var active_timer = db.query('time_clocks')
  .where('user_id', '==', auth_user.id)
  .where('ended_at', '==', null)
  .first();

// 3. Conditional - Check if timer exists:
if (!active_timer) {
  // Return error
  return {
    message: 'Kein aktiver Timer gefunden.',
    code: 'NO_ACTIVE_TIMER'
  };
}

// 4. Calculate duration:
var ended_at = Date.now();
var duration_seconds = Math.floor((ended_at - active_timer.started_at) / 1000);
var break_duration = active_timer.is_break ? Math.floor(duration_seconds / 60) : 0;

// 5. Create TimeEntry:
var time_entry = db.add_record('time_entries', {
  user_id: auth_user.id,
  start_time: active_timer.started_at,
  end_time: ended_at,
  break_duration: break_duration,
  is_manual: false,
  comment: input.comment || active_timer.comment
});

// 6. Update timer (mark as ended):
db.update_record('time_clocks', active_timer.id, {
  ended_at: ended_at,
  comment: input.comment || active_timer.comment
});

// 7. Response:
return {
  time_entry: {
    id: time_entry.id,
    user_id: time_entry.user_id,
    start_time: time_entry.start_time,
    end_time: time_entry.end_time,
    break_duration: time_entry.break_duration,
    is_manual: time_entry.is_manual,
    comment: time_entry.comment,
    created_at: time_entry.created_at
  }
};
```

**Response** (200 OK):
```json
{
  "time_entry": {
    "id": 456,
    "user_id": 5,
    "start_time": 1730501000000,
    "end_time": 1730508000000,
    "break_duration": 0,
    "is_manual": false,
    "comment": "Feature Development",
    "created_at": 1730508000000
  }
}
```

---

## 📊 Database Schema

### `time_clock` Table (Aktive Timer)

**Wichtig**: Diese Tabelle speichert **nur aktive/laufende Timer**. Gestoppte Timer werden **gelöscht** und als `time_entry` gespeichert!

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary Key, Auto-increment |
| `user_id` | Integer | Foreign Key -> user.id (**UNIQUE!**) |
| `started_at` | Timestamp | Wann wurde Timer gestartet |
| `is_break` | Boolean | Ist es eine Pause? (nullable) |
| `comment` | Text | Optionaler Kommentar (nullable, trim filter) |
| `created_at` | Timestamp | Auto-generated (nullable, default=now) |

**Indexes**:
- Primary Key on `id`
- **UNIQUE btree** Index on `user_id` (nur ein Timer pro User!)

### `time_entry` Table (Gespeicherte Einträge)

**Wichtig**: Hier werden **abgeschlossene** Zeit-Einträge gespeichert (aus gestoppten Timern oder manuell erstellt).

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary Key, Auto-increment |
| `user_id` | Integer | Foreign Key -> user.id |
| `start` | Timestamp | Arbeitsstart |
| `end` | Timestamp | Arbeitsende |
| `is_break` | Boolean | War es eine Pause? (nullable) |
| `comment` | Text | Kommentar (nullable, trim filter) |
| `created_at` | Timestamp | Auto-generated (nullable, default=now) |
| `updated_at` | Timestamp | Auto-generated (nullable, default=now) |

**Indexes**:
- Primary Key on `id`
- Btree Index on `user_id` (ascending)
- Btree Index on `start` (descending - für chronologische Queries)
- Compound Btree Index on `user_id + start` (für User-spezifische Abfragen)

---

## 🔒 Sicherheits-Checks

### Wichtig für alle Endpoints:

1. **User Isolation**: Alle Queries MÜSSEN `auth_user.id` verwenden:
   ```javascript
   .where('user_id', '==', auth_user.id)
   ```

2. **Prevent Multiple Active Timers**: Im `/start` Endpoint prüfen, ob bereits ein Timer läuft

3. **Validate Timestamps**: Sicherstellen, dass `end_time > start_time`

4. **Authorization**: Alle Endpoints benötigen gültigen Bearer Token

---

## ✅ Testing Checklist

- [ ] `/current` gibt `null` zurück wenn kein Timer läuft
- [ ] `/current` gibt nur Timer des eingeloggten Users zurück
- [ ] `/start` erstellt neuen Timer mit korrektem `user_id`
- [ ] `/start` verhindert doppelte Timer
- [ ] `/stop` erstellt TimeEntry in Datenbank
- [ ] `/stop` setzt `ended_at` im time_clocks Eintrag
- [ ] `/stop` berechnet `break_duration` korrekt (nur wenn `is_break = true`)
- [ ] User A sieht nicht die Timer von User B

---

## 🐛 Bekannte Issues

### Issue 1: Timer wird nicht in time_entries gespeichert
**Symptom**: Timer läuft, aber nach Stop kein Eintrag in Datenbank

**Ursache**: `/stop` Endpoint erstellt kein TimeEntry Record

**Lösung**: XanoScript in `/stop` Endpoint ergänzen (siehe oben, Schritt 5)

### Issue 2: Timer stoppt bei Tab-Wechsel
**Symptom**: Timer zählt nicht weiter wenn Browser-Tab gewechselt wird

**Lösung**: ✅ **FIXED** - Frontend berechnet jetzt Zeit basierend auf `started_at` Timestamp

---

## 📝 Notes

- Alle Timestamps sind in **Millisekunden** (JavaScript `Date.now()` format)
- `break_duration` wird in **Minuten** gespeichert
- Wenn `is_break = true`, wird die gesamte Timer-Dauer als `break_duration` gespeichert
- Wenn `is_break = false`, ist `break_duration = 0`
