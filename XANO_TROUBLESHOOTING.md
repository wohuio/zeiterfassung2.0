# Xano Troubleshooting Guide

## 🔴 Aktueller Fehler: "Error: Not numeric"

### Fehleranalyse

**Error Messages aus Console:**
```
Failed to load resource: the server responded with a status of 500 ()
Failed to fetch user: Error: Not numeric.
  at XanoClient.request (xano-client.ts:71:13)
  at async AuthProvider.useEffect.initAuth (auth-context.tsx:28:31)

getCurrentTimer error: Error: Not numeric.
  at XanoClient.request (xano-client.ts:71:13)
  at async XanoClient.getCurrentTimer (xano-client.ts:147:14)
  at async loadCurrentTimer (TimeClock.tsx:55:28)
```

### Root Cause

Der Fehler "Not numeric" kommt vom **Xano Backend** und bedeutet:
- Ein Feld in der `time_clocks` Tabelle erwartet einen numerischen Wert
- Aber der gespeicherte/zurückgegebene Wert ist nicht numerisch (z.B. String, null, undefined)

**Wahrscheinlichste Ursache**: Das `started_at` Feld ist falsch konfiguriert.

---

## ✅ Schritt-für-Schritt Lösung

### 1. Überprüfe die `time_clocks` Tabelle in Xano

Gehe zu **Database** → **time_clocks** → **Table Schema**

Stelle sicher, dass die Feldtypen korrekt sind:

| Feldname | Typ | Einstellungen |
|----------|-----|---------------|
| `id` | Integer | Auto-increment, Primary Key |
| `user_id` | Integer | Foreign Key zu `users.id` |
| `started_at` | **Timestamp** | NOT NULL, Default: `null` entfernen! |
| `ended_at` | Timestamp | Nullable, Default: `null` |
| `is_break` | Boolean | Default: `false` |
| `comment` | Text | Nullable |
| `created_at` | Timestamp | Auto-generated |

**WICHTIG**: `started_at` darf NICHT nullable sein und sollte keinen Default-Wert haben.

---

### 2. Überprüfe den `/current` Endpoint

Gehe zu **API** → **uMXZ3Fde** → **GET /current**

#### Function Stack sollte sein:

**1. Get Auth User**
- Name: `auth_user`
- Type: Get Auth User

**2. Database Query**
```javascript
// Query time_clocks table
var timer = db.query('time_clocks')
  .where('user_id', '==', auth_user.id)
  .where('ended_at', '==', null)
  .first();
```

**3. Conditional Response**
```javascript
// If no timer found
if (!timer) {
  // Return null or 204 No Content
  response.status = 204;
  return null;
}

// Return timer data
return {
  id: timer.id,
  user_id: timer.user_id,
  started_at: timer.started_at,  // Must be a number (timestamp)
  is_break: timer.is_break,
  comment: timer.comment
};
```

**WICHTIG**:
- `timer.started_at` muss ein **Number** (Timestamp in Millisekunden) sein
- Wenn es `null`, `undefined` oder ein String ist, bekommst du "Not numeric"

---

### 3. Überprüfe bestehende Daten

Es könnte sein, dass alte/fehlerhafte Einträge in der Datenbank sind.

Gehe zu **Database** → **time_clocks** → **Browse Data**

**Prüfe**:
1. Gibt es Einträge mit `ended_at = null` (laufende Timer)?
2. Ist `started_at` ein gültiger Timestamp (z.B. `1730507000000`)?
3. Sind alle `started_at` Werte **numerisch** (nicht "null" oder "undefined" als String)?

**Lösung wenn fehlerhafte Daten gefunden:**
- Lösche alle fehlerhaften Einträge ODER
- Setze `ended_at` auf einen Timestamp, um den Timer als beendet zu markieren

---

### 4. Fix für `/start` Endpoint - "Timer already running"

Der Fehler zeigt, dass bereits ein Timer läuft, aber der `/current` Endpoint schlägt fehl.

**Problem**:
- Es existiert ein laufender Timer in der DB
- Aber `/current` gibt einen 500 Error wegen "Not numeric"
- Daher denkt das Frontend, kein Timer läuft
- Beim Versuch zu starten: 400 Error "Timer already running"

**Lösung**:
1. Finde den laufenden Timer in der DB (siehe Schritt 3)
2. Lösche ihn oder setze `ended_at` auf einen Timestamp
3. Stelle sicher, dass `started_at` in allen Einträgen numerisch ist

---

### 5. Korrektes `/start` Endpoint

**Input Validation**:
```javascript
// Validate input
if (typeof input.is_break !== 'boolean') {
  input.is_break = false;
}
```

**Check for existing timer**:
```javascript
var existing = db.query('time_clocks')
  .where('user_id', '==', auth_user.id)
  .where('ended_at', '==', null)
  .first();

if (existing) {
  response.status = 400;
  return {
    message: 'Timer already running',
    code: 'TIMER_ALREADY_RUNNING'
  };
}
```

**Create new timer**:
```javascript
// WICHTIG: Date.now() gibt Millisekunden zurück
var timer = db.add_record('time_clocks', {
  user_id: auth_user.id,
  started_at: Date.now(),  // MUSS eine Zahl sein!
  is_break: input.is_break,
  comment: input.comment || null,
  ended_at: null
});

return {
  id: timer.id,
  user_id: timer.user_id,
  started_at: timer.started_at,  // Timestamp (number)
  is_break: timer.is_break,
  comment: timer.comment
};
```

---

## 🔍 Debug Checklist

- [ ] `time_clocks` Tabelle hat korrektes Schema (siehe Schritt 1)
- [ ] `started_at` Feld ist Typ **Timestamp** (nicht Text!)
- [ ] Keine fehlerhaften Einträge in der Datenbank
- [ ] `/current` Endpoint gibt korrekten Response zurück
- [ ] `/start` Endpoint prüft auf existierenden Timer
- [ ] `/start` Endpoint erstellt Timer mit `Date.now()`
- [ ] Alle Endpoints verwenden `auth_user.id` für User-Isolation

---

## 🐛 Häufige Fehlerquellen

### Fehler 1: `started_at` ist Text statt Timestamp
**Symptom**: "Not numeric"
**Lösung**: Ändere Feldtyp zu Timestamp in Table Schema

### Fehler 2: `started_at` hat ungültigen Default-Wert
**Symptom**: Neue Timer haben leeren `started_at`
**Lösung**: Entferne Default-Wert, verwende `Date.now()` im Endpoint

### Fehler 3: Alte fehlerhafte Daten
**Symptom**: `/current` gibt 500 für alte Timer
**Lösung**: Lösche/korrigiere fehlerhafte Einträge

### Fehler 4: Timer wird nicht beendet
**Symptom**: "Timer already running" obwohl kein Timer sichtbar
**Lösung**: `/stop` Endpoint muss `ended_at = Date.now()` setzen

---

## 📝 Empfohlene Aktion

**Sofort**:
1. Gehe zu Xano Database → time_clocks
2. Prüfe alle Einträge mit `ended_at = null`
3. Lösche fehlerhafte Einträge oder setze `ended_at`
4. Verifiziere Feldtypen im Table Schema

**Dann**:
1. Teste `/current` Endpoint direkt in Xano (Test-Funktion)
2. Prüfe Response: Ist `started_at` eine Zahl?
3. Teste `/start` Endpoint
4. Verifiziere, dass Timer korrekt erstellt wird

---

## 🎯 Expected Behavior

**Wenn alles korrekt konfiguriert ist**:

1. **Kein Timer läuft**:
   - `/current` → 204 No Content oder `null`
   - `/start` → 200 OK mit Timer-Daten

2. **Timer läuft**:
   - `/current` → 200 OK mit Timer-Daten (started_at ist Zahl)
   - `/start` → 400 Bad Request "Timer already running"
   - `/stop` → 200 OK mit TimeEntry

3. **Timer gestoppt**:
   - Timer hat `ended_at` gesetzt
   - TimeEntry wurde erstellt
   - `/current` → 204 oder `null`
