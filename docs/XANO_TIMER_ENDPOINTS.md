# Xano Timer Endpoints - Konfiguration

## Übersicht
Timer-Funktionalität für Zeiterfassung (Start/Stop/Status).

---

## 1. GET `/time-clock/current` - Aktueller Timer

Gibt den laufenden Timer des eingeloggten Users zurück.

### Endpoint Settings
- **Path**: `/time-clock/current`
- **Method**: `GET`
- **Auth Required**: `Yes` ✓

### Inputs
**KEINE** - nutzt nur `authUser`

### Function Stack

#### Function 1: Query Running Timer
**Add Function** → **Database Request** → **Query Records**

**Konfiguration:**
- **Table**: `time_clock`
- **Add Filter**:
  - Field: `user_id`
  - Operator: `=`
  - Value: `authUser.id`
- **Limit**: `1`
- **Variable name**: `running_timer`

#### Function 2: Response
**Add Function** → **Utility** → **Response**

**Wenn Timer existiert, return:**
```
running_timer[0]
```

**Wenn kein Timer, return:**
```
null
```

**ODER einfacher**: Return direkt das Array-Element:
```
running_timer.0
```

---

## 2. POST `/time-clock/start` - Timer starten

Startet einen neuen Timer.

### Endpoint Settings
- **Path**: `/time-clock/start`
- **Method**: `POST`
- **Auth Required**: `Yes` ✓

### Inputs

#### Input 1: is_break
- **Name**: `is_break`
- **Type**: `boolean`
- **Required**: ✓
- **Default**: `false`

#### Input 2: comment
- **Name**: `comment`
- **Type**: `text`
- **Required**: ✗ (optional)

### Function Stack

#### Function 1: Check for existing timer
**Add Function** → **Database Request** → **Query Records**

**Konfiguration:**
- **Table**: `time_clock`
- **Add Filter**:
  - Field: `user_id`
  - Operator: `=`
  - Value: `authUser.id`
- **Limit**: `1`
- **Variable name**: `existing_timer`

#### Function 2: Precondition - No timer running
**Add Function** → **Control Flow** → **Precondition**

**Konfiguration:**
- **Condition**:
  ```
  existing_timer.length == 0
  ```
- **Error Type**: `inputerror`
- **Error Message**: `"Timer already running"`

#### Function 3: Create Timer
**Add Function** → **Database Request** → **Add Record**

**Konfiguration:**
- **Table**: `time_clock`
- **Mapping**:
  - `user_id` → `authUser.id`
  - `started_at` → `now()` (Xano function)
  - `is_break` → `input.is_break`
  - `comment` → `input.comment`
- **Variable name**: `new_timer`

#### Function 4: Response
**Add Function** → **Utility** → **Response**

```json
new_timer
```

---

## 3. POST `/time-clock/stop` - Timer stoppen

Stoppt den laufenden Timer und erstellt einen TimeEntry.

### Endpoint Settings
- **Path**: `/time-clock/stop`
- **Method**: `POST`
- **Auth Required**: `Yes` ✓

### Inputs

#### Input 1: comment (optional)
- **Name**: `comment`
- **Type**: `text`
- **Required**: ✗ (optional)

### Function Stack

#### Function 1: Get Running Timer
**Add Function** → **Database Request** → **Query Records**

**Konfiguration:**
- **Table**: `time_clock`
- **Add Filter**:
  - Field: `user_id`
  - Operator: `=`
  - Value: `authUser.id`
- **Limit**: `1`
- **Variable name**: `running_timer`

#### Function 2: Precondition - Timer exists
**Add Function** → **Control Flow** → **Precondition**

**Konfiguration:**
- **Condition**:
  ```
  running_timer.length > 0
  ```
- **Error Type**: `inputerror`
- **Error Message**: `"No timer running"`

#### Function 3: Create Time Entry
**Add Function** → **Database Request** → **Add Record**

**Konfiguration:**
- **Table**: `time_entry`
- **Mapping**:
  - `user_id` → `authUser.id`
  - `start_time` → `running_timer[0].started_at`
  - `end_time` → `now()`
  - `break_duration` → `0` (Minuten)
  - `is_manual` → `false`
  - `comment` → `input.comment` OR `running_timer[0].comment`
- **Variable name**: `time_entry`

#### Function 4: Delete Timer
**Add Function** → **Database Request** → **Delete Record**

**Konfiguration:**
- **Table**: `time_clock`
- **Record ID**: `running_timer[0].id`

#### Function 5: Response
**Add Function** → **Utility** → **Response**

```json
{
  "time_entry": time_entry
}
```

---

## Testing

### Test `/time-clock/current`
1. Run & Debug → Select User
2. Should return `null` if no timer
3. Start a timer manually in DB to test response

### Test `/time-clock/start`
**Request:**
```json
{
  "is_break": false,
  "comment": "Working on feature"
}
```

**Expected Response:**
```json
{
  "id": 1,
  "user_id": 7,
  "started_at": 1730487823000,
  "is_break": false,
  "comment": "Working on feature"
}
```

### Test `/time-clock/stop`
**Request:**
```json
{
  "comment": "Finished feature"
}
```

**Expected Response:**
```json
{
  "time_entry": {
    "id": 1,
    "user_id": 7,
    "start_time": 1730487823000,
    "end_time": 1730491423000,
    "break_duration": 0,
    "is_manual": false,
    "comment": "Finished feature"
  }
}
```

---

## Wichtige Hinweise

1. **Timestamps**: Xano speichert `started_at`, `start_time`, `end_time` automatisch als Millisekunden
2. **now()**: Xano Function für aktuellen Timestamp
3. **break_duration**: In **Minuten** speichern (nicht Sekunden!)
4. **Preconditions**: Verhindert doppelte Timer oder Stop ohne Timer

---

**Erstellt**: 1. November 2025
**Version**: 1.0
