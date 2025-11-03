# Xano /signup Endpoint - Korrigierte Konfiguration

## ⚠️ KORREKTUR: Function 4 Tabellennamen-Fehler

In der ursprünglichen Anleitung gab es einen Fehler in **Function 4**:
- ❌ Tabelle war fälschlicherweise als `working_time` angegeben
- ✓ Korrekt sind **ZWEI separate Records** zu erstellen

---

## Korrigierte Function Stack (Schritt 2)

### Function 1: Prüfe ob Email bereits existiert
**Add Function** → **Database Request** → **Get Record**
- **Table**: `user`
- **Field**: `email`
- **Value**: `input.email`
- **Variable name**: `existing_user`

### Function 2: Precondition
**Add Function** → **Control Flow** → **Precondition**
- **Condition**: `existing_user == null`
- **Error Type**: `inputerror`
- **Error Message**: `"Email already registered"`

### Function 3: Erstelle neuen User
**Add Function** → **Database Request** → **Add Record**
- **Table**: `user`
- **Mapping**:
  - `email` → `input.email`
  - `password` → `input.password`
  - `name` → `input.name`
  - `role` → `"user"`
  - `is_active` → `true`
- **Variable name**: `new_user`

### Function 4: Erstelle Working Time (Arbeitszeiten)
**Add Function** → **Database Request** → **Add Record**
- **Table**: `working_time`
- **Mapping**:
  - `user_id` → `new_user.id`
  - `valid_from` → Heute's Datum (z.B. `"2025-01-01"` oder `format(now(), "YYYY-MM-DD")`)
  - `monday_hours` → `8`
  - `tuesday_hours` → `8`
  - `wednesday_hours` → `8`
  - `thursday_hours` → `8`
  - `friday_hours` → `8`
  - `saturday_hours` → `0`
  - `sunday_hours` → `0`
  - `works_on_public_holiday` → `false`
- **Variable name**: `working_time`

### Function 5: Erstelle Overtime Account
**Add Function** → **Database Request** → **Add Record**
- **Table**: `overtime_account`
- **Mapping**:
  - `user_id` → `new_user.id`
  - `current_balance` → `0`
  - `max_allowed_overtime` → `100`
- **Variable name**: `overtime_account`

### Function 6: Erstelle Authentication Token
**Add Function** → **Authentication** → **Create Authentication Token**
- **Table**: `user`
- **User ID**: `new_user.id`
- **Expiration**: `2592000` (30 Tage)
- **Variable name**: `auth_token`

### Function 7: Response
**Add Function** → **Utility** → **Response**

```json
{
  "authToken": auth_token,
  "user": {
    "id": new_user.id,
    "email": new_user.email,
    "name": new_user.name,
    "role": new_user.role,
    "is_active": new_user.is_active
  }
}
```

---

## Zusammenfassung: Korrigierter Function Stack

```
1. Get Record (user by email) → existing_user
2. Precondition (existing_user == null)
3. Add Record (user) → new_user
4. Add Record (working_time) → working_time          ← KORRIGIERT
5. Add Record (overtime_account) → overtime_account  ← NEU HINZUGEFÜGT
6. Create Auth Token → auth_token
7. Response { authToken, user }
```

---

## Was wurde korrigiert?

1. **Function 4** erstellt jetzt `working_time` mit korrekten Feldern
2. **Function 5** (NEU) erstellt `overtime_account`
3. Variable names passen jetzt zu den Tabellen

---

**Erstellt**: 1. November 2025
**Version**: 1.1 (Korrigiert)
