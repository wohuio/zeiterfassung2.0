# Xano API Endpoints - Zeiterfassung App

## Übersicht
Alle API-Endpunkte für die Zeiterfassungs-App. Basiert auf Xano Best Practices.

**Base URL**: `https://your-instance.xano.io/api:v1`

---

## 🔐 Authentication Endpoints

### 1. POST `/auth/signup`
Neuen Benutzer registrieren.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Max Mustermann"
}
```

**Response** (201 Created):
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Max Mustermann",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Xano Function Stack**:
1. Input validation (email format, password min length)
2. Check if email exists → Error if duplicate
3. Create user with hashed password (Xano auto-handles)
4. Set default role: "user"
5. Create initial `working_time` entry (8h Mo-Fr)
6. Create `overtime_account` with balance 0
7. Return JWT token + user object

---

### 2. POST `/auth/login`
Benutzer anmelden.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Max Mustermann",
    "role": "user",
    "is_active": true
  }
}
```

**Errors**:
- 401: Invalid credentials
- 403: Account deactivated (`is_active=false`)

---

### 3. GET `/auth/me`
Aktuellen Benutzer abrufen (mit JWT).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Max Mustermann",
  "role": "user",
  "is_active": true,
  "active_timer": {
    "id": 5,
    "started_at": "2024-01-15T14:30:00Z",
    "is_break": false,
    "comment": "Projektarbeit"
  },
  "overtime_account": {
    "current_balance": 12.5,
    "max_allowed_overtime": 100.0
  }
}
```

**Xano Function Stack**:
1. Get authenticated user from JWT
2. Add `active_timer` via Add-on (nullable)
3. Add `overtime_account` via Add-on
4. Return full user object

---

## ⏱️ Time Clock Endpoints (Stoppuhr)

### 4. POST `/time-clock/start`
Timer starten (Einstempeln).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body**:
```json
{
  "is_break": false,
  "comment": "Projektarbeit"
}
```

**Response** (201 Created):
```json
{
  "id": 5,
  "user_id": 1,
  "started_at": "2024-01-15T14:30:00Z",
  "is_break": false,
  "comment": "Projektarbeit"
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Check if user already has active timer → Error 400 if exists
3. Create `time_clock` entry with current timestamp
4. Return created timer

**Errors**:
- 400: Timer already running

---

### 5. POST `/time-clock/stop`
Timer stoppen (Ausstempeln).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body** (optional):
```json
{
  "comment": "Aktualisierter Kommentar"
}
```

**Response** (200 OK):
```json
{
  "time_entry": {
    "id": 42,
    "user_id": 1,
    "start": "2024-01-15T14:30:00Z",
    "end": "2024-01-15T18:30:00Z",
    "is_break": false,
    "comment": "Projektarbeit",
    "duration_hours": 4.0
  }
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Find active `time_clock` for user → Error 404 if none
3. Create `time_entry`:
   - `start` = time_clock.started_at
   - `end` = current timestamp
   - `is_break` = time_clock.is_break
   - `comment` = updated comment OR time_clock.comment
4. Delete `time_clock` entry
5. Trigger overtime recalculation (async)
6. Return created time_entry

**Errors**:
- 404: No active timer found

---

### 6. GET `/time-clock/current`
Aktuellen Timer abrufen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "id": 5,
  "started_at": "2024-01-15T14:30:00Z",
  "is_break": false,
  "comment": "Projektarbeit",
  "elapsed_seconds": 7200
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Query `time_clock` WHERE user_id = auth.user.id
3. Calculate `elapsed_seconds` = NOW() - started_at
4. Return timer OR null

**Response** (204 No Content) if no active timer

---

## 📝 Time Entry Endpoints (Manuelle Einträge)

### 7. POST `/time-entries`
Manuellen Zeiteintrag erstellen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body**:
```json
{
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T17:00:00Z",
  "is_break": false,
  "comment": "Büroarbeit"
}
```

**Response** (201 Created):
```json
{
  "id": 43,
  "user_id": 1,
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T17:00:00Z",
  "is_break": false,
  "comment": "Büroarbeit",
  "duration_hours": 8.0,
  "created_at": "2024-01-15T18:00:00Z"
}
```

**Xano Function Stack**:
1. Validate: `end` > `start`
2. Validate: Duration <= 24 hours
3. Check for overlaps:
   ```
   db.query('time_entry')
     .where({user_id: auth.user.id})
     .where({is_break: false})
     .where({
       OR: [
         {start: {between: [input.start, input.end]}},
         {end: {between: [input.start, input.end]}},
         {AND: [{start: {lte: input.start}}, {end: {gte: input.end}}]}
       ]
     })
   ```
   → Error 409 if overlap found
4. Create `time_entry`
5. Trigger overtime recalculation
6. Return created entry

**Errors**:
- 400: Invalid time range
- 409: Overlapping entry exists

---

### 8. GET `/time-entries`
Liste aller Zeiteinträge (mit Filtern).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**:
- `start_date` (optional): Filter ab Datum (ISO 8601)
- `end_date` (optional): Filter bis Datum (ISO 8601)
- `is_break` (optional): true/false
- `page` (optional, default: 1): Seitennummer
- `per_page` (optional, default: 50): Einträge pro Seite

**Example Request**:
```
GET /time-entries?start_date=2024-01-01&end_date=2024-01-31&page=1&per_page=20
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 43,
      "start": "2024-01-15T09:00:00Z",
      "end": "2024-01-15T17:00:00Z",
      "is_break": false,
      "comment": "Büroarbeit",
      "duration_hours": 8.0
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Query `time_entry` WHERE user_id = auth.user.id
3. Apply filters (start_date, end_date, is_break)
4. Order by start DESC
5. Apply pagination (offset/limit)
6. Return items + pagination metadata

---

### 9. GET `/time-entries/:id`
Einzelnen Zeiteintrag abrufen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "id": 43,
  "user_id": 1,
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T17:00:00Z",
  "is_break": false,
  "comment": "Büroarbeit",
  "duration_hours": 8.0,
  "created_at": "2024-01-15T18:00:00Z",
  "updated_at": "2024-01-15T18:00:00Z"
}
```

**Xano Function Stack**:
1. Get entry by ID
2. Check: entry.user_id == auth.user.id OR auth.user.role == 'admin'
3. Return entry OR 404

---

### 10. PATCH `/time-entries/:id`
Zeiteintrag bearbeiten.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body** (alle Felder optional):
```json
{
  "start": "2024-01-15T09:30:00Z",
  "end": "2024-01-15T17:30:00Z",
  "comment": "Aktualisierter Kommentar"
}
```

**Response** (200 OK):
```json
{
  "id": 43,
  "user_id": 1,
  "start": "2024-01-15T09:30:00Z",
  "end": "2024-01-15T17:30:00Z",
  "is_break": false,
  "comment": "Aktualisierter Kommentar",
  "duration_hours": 8.0,
  "updated_at": "2024-01-16T10:00:00Z"
}
```

**Xano Function Stack**:
1. Get entry by ID
2. Check ownership (user_id == auth.user.id OR admin)
3. Validate: end > start (if times changed)
4. Check for overlaps (excluding current entry)
5. Update entry
6. Set `updated_at` = NOW()
7. Trigger overtime recalculation
8. Return updated entry

**Errors**:
- 403: Not authorized
- 409: Overlapping entry

---

### 11. DELETE `/time-entries/:id`
Zeiteintrag löschen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (204 No Content)

**Xano Function Stack**:
1. Get entry by ID
2. Check ownership (user_id == auth.user.id OR admin)
3. Delete entry
4. Trigger overtime recalculation
5. Return 204

**Errors**:
- 403: Not authorized
- 404: Entry not found

---

## 📊 Reports & Overtime Endpoints

### 12. GET `/reports/week`
Wochenbericht für aktuellen Benutzer.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**:
- `date` (required): Datum innerhalb der gewünschten Woche (ISO 8601)

**Example**:
```
GET /reports/week?date=2024-01-15
```

**Response** (200 OK):
```json
{
  "week_start": "2024-01-15",
  "week_end": "2024-01-21",
  "days": [
    {
      "date": "2024-01-15",
      "weekday": "Monday",
      "worked_hours": 8.5,
      "should_hours": 8.0,
      "difference": 0.5,
      "entries": [
        {
          "id": 43,
          "start": "2024-01-15T09:00:00Z",
          "end": "2024-01-15T17:30:00Z",
          "is_break": false,
          "comment": "Büroarbeit",
          "duration_hours": 8.5
        }
      ]
    },
    ...
  ],
  "summary": {
    "total_worked": 42.5,
    "total_should": 40.0,
    "difference": 2.5
  }
}
```

**Xano Function Stack** (Complex!):
1. Get user from JWT
2. Calculate week start (Monday) and end (Sunday) from `date` parameter
3. Query `working_time` for user (valid_from <= week_start, ORDER BY valid_from DESC, LIMIT 1)
4. For each day in week:
   a. Get all `time_entry` WHERE user_id AND start BETWEEN day_start AND day_end
   b. Calculate worked_hours = SUM(duration) WHERE is_break=false
   c. Get should_hours from working_time (e.g. monday_hours for Monday)
   d. Check `absence` table for this day → should_hours = 0 if absent
5. Calculate summary totals
6. Return structured response

---

### 13. GET `/reports/month`
Monatsbericht für aktuellen Benutzer.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**:
- `year` (required): Jahr (z.B. 2024)
- `month` (required): Monat (1-12)

**Example**:
```
GET /reports/month?year=2024&month=1
```

**Response** (200 OK):
```json
{
  "year": 2024,
  "month": 1,
  "month_name": "January",
  "weeks": [
    {
      "week_number": 1,
      "week_start": "2024-01-01",
      "week_end": "2024-01-07",
      "worked_hours": 32.0,
      "should_hours": 40.0,
      "difference": -8.0
    },
    ...
  ],
  "summary": {
    "total_worked": 168.5,
    "total_should": 160.0,
    "difference": 8.5,
    "overtime_balance": 12.5
  }
}
```

**Xano Function Stack**:
Similar to week report, but aggregated by week.

---

### 14. GET `/overtime/balance`
Aktuellen Überstunden-Saldo abrufen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "user_id": 1,
  "current_balance": 12.5,
  "max_allowed_overtime": 100.0,
  "percentage_used": 12.5,
  "last_updated": "2024-01-16T10:00:00Z"
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Query `overtime_account` WHERE user_id = auth.user.id
3. Calculate percentage_used = (current_balance / max_allowed_overtime) * 100
4. Return account data

---

### 15. POST `/overtime/recalculate`
Überstunden neu berechnen (Admin oder automatisch nach Änderungen).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "user_id": 1,
  "previous_balance": 12.5,
  "new_balance": 13.0,
  "calculated_at": "2024-01-16T11:00:00Z"
}
```

**Xano Function Stack** (Complex Calculation!):
1. Get user from JWT
2. Get all `time_entry` for user WHERE is_break=false
3. Group by date, SUM(duration_hours) per day
4. For each day:
   a. Get `working_time` configuration (valid at that date)
   b. Get should_hours for weekday
   c. Check `absence` → reduce should_hours if absent
   d. Calculate difference = worked - should
5. SUM all differences = new_balance
6. Update `overtime_account.current_balance`
7. Set `updated_at` = NOW()
8. Return before/after balance

**Trigger**: This endpoint is called automatically after:
- Creating time_entry
- Updating time_entry
- Deleting time_entry
- Stopping time_clock

---

## 👥 Admin Endpoints (Role: admin/office)

### 16. GET `/admin/users`
Liste aller Benutzer (nur Admin/Office).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**:
- `is_active` (optional): true/false
- `role` (optional): user/office/admin
- `page` (optional): Pagination
- `per_page` (optional): Items per page

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "Max Mustermann",
      "role": "user",
      "is_active": true,
      "overtime_balance": 12.5
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 25
  }
}
```

**Xano Function Stack**:
1. Check: auth.user.role IN ['admin', 'office'] → 403 if not
2. Query `user` with filters
3. Add `overtime_balance` via Add-on (overtime_account.current_balance)
4. Order by name ASC
5. Pagination
6. Return list

---

### 17. GET `/admin/users/:id/time-entries`
Zeiteinträge eines anderen Benutzers ansehen (Admin/Office).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**: Same as `/time-entries`

**Response**: Same structure as GET `/time-entries`

**Xano Function Stack**:
1. Check: auth.user.role IN ['admin', 'office'] → 403 if not
2. Query `time_entry` WHERE user_id = path.id
3. Apply filters and pagination
4. Return list

---

### 18. PATCH `/admin/users/:id`
Benutzer bearbeiten (Admin only).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body**:
```json
{
  "role": "office",
  "is_active": false
}
```

**Response** (200 OK):
```json
{
  "id": 2,
  "email": "user@example.com",
  "name": "Max Mustermann",
  "role": "office",
  "is_active": false,
  "updated_at": "2024-01-16T12:00:00Z"
}
```

**Xano Function Stack**:
1. Check: auth.user.role == 'admin' → 403 if not
2. Get user by ID
3. Update allowed fields (role, is_active)
4. Set updated_at
5. Return updated user

---

## 🏢 Working Time Endpoints

### 19. GET `/working-time`
Aktuelle Arbeitszeitkonfiguration des Benutzers.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Response** (200 OK):
```json
{
  "id": 5,
  "user_id": 1,
  "valid_from": "2024-01-01",
  "monday_hours": 8.0,
  "tuesday_hours": 8.0,
  "wednesday_hours": 8.0,
  "thursday_hours": 8.0,
  "friday_hours": 8.0,
  "saturday_hours": 0.0,
  "sunday_hours": 0.0,
  "federal_state": "Baden-Württemberg",
  "works_on_public_holiday": false
}
```

**Xano Function Stack**:
1. Get user from JWT
2. Query `working_time` WHERE user_id = auth.user.id
3. Order by valid_from DESC
4. LIMIT 1 (most recent)
5. Return config

---

### 20. POST `/working-time`
Neue Arbeitszeitkonfiguration erstellen (ab bestimmtem Datum).

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body**:
```json
{
  "valid_from": "2024-02-01",
  "monday_hours": 6.0,
  "tuesday_hours": 6.0,
  "wednesday_hours": 6.0,
  "thursday_hours": 6.0,
  "friday_hours": 6.0,
  "federal_state": "Bayern"
}
```

**Response** (201 Created):
```json
{
  "id": 6,
  "user_id": 1,
  "valid_from": "2024-02-01",
  "monday_hours": 6.0,
  ...
}
```

**Xano Function Stack**:
1. Get user from JWT OR admin can set for other user
2. Check: No existing config with same valid_from
3. Create `working_time` entry
4. Trigger overtime recalculation (if valid_from is past)
5. Return created config

---

## 📅 Absence Endpoints

### 21. POST `/absences`
Abwesenheit erfassen.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Request Body**:
```json
{
  "absence_type": "vacation",
  "start_date": "2024-02-10",
  "end_date": "2024-02-14",
  "day_length": "full",
  "reason": "Urlaub"
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "user_id": 1,
  "absence_type": "vacation",
  "start_date": "2024-02-10",
  "end_date": "2024-02-14",
  "day_length": "full",
  "reason": "Urlaub",
  "created_at": "2024-01-16T12:00:00Z"
}
```

**Xano Function Stack**:
1. Validate: end_date >= start_date
2. Validate: absence_type IN ['vacation', 'sick_leave', 'holiday', 'other']
3. Validate: day_length IN ['full', 'morning', 'afternoon']
4. Create `absence` entry
5. Trigger overtime recalculation
6. Return created absence

---

### 22. GET `/absences`
Liste aller Abwesenheiten des Benutzers.

**Headers**:
```
Authorization: Bearer <authToken>
```

**Query Parameters**:
- `start_date` (optional): Filter ab
- `end_date` (optional): Filter bis
- `absence_type` (optional): Filter nach Typ

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 3,
      "absence_type": "vacation",
      "start_date": "2024-02-10",
      "end_date": "2024-02-14",
      "day_length": "full",
      "reason": "Urlaub"
    },
    ...
  ]
}
```

---

## 🔧 Utility Endpoints

### 23. GET `/health`
Health Check (kein Auth erforderlich).

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-16T12:00:00Z"
}
```

---

## 🚀 Xano Implementation Checklist

### Phase 1: Setup
- [ ] Create all database tables
- [ ] Configure Add-ons (relationships)
- [ ] Set unique constraints
- [ ] Enable Xano Authentication

### Phase 2: Auth Endpoints
- [ ] POST /auth/signup
- [ ] POST /auth/login
- [ ] GET /auth/me

### Phase 3: Core Time Tracking
- [ ] POST /time-clock/start
- [ ] POST /time-clock/stop
- [ ] GET /time-clock/current
- [ ] POST /time-entries
- [ ] GET /time-entries
- [ ] PATCH /time-entries/:id
- [ ] DELETE /time-entries/:id

### Phase 4: Reporting
- [ ] GET /reports/week
- [ ] GET /reports/month
- [ ] GET /overtime/balance
- [ ] POST /overtime/recalculate (helper function)

### Phase 5: Admin Features
- [ ] GET /admin/users
- [ ] GET /admin/users/:id/time-entries
- [ ] PATCH /admin/users/:id

### Phase 6: Working Time & Absences
- [ ] GET /working-time
- [ ] POST /working-time
- [ ] POST /absences
- [ ] GET /absences

---

**Nächster Schritt**: Frontend TypeScript Types und API Client (siehe `lib/xano-client.ts`)
