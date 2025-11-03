# Xano /me Endpoint - Manuelle Konfiguration

## Übersicht
Gibt die Daten des aktuell eingeloggten Users zurück. Dieser Endpoint ist **authentifiziert**.

---

## Schritt 1: Inputs definieren

**KEINE INPUTS** - Dieser Endpoint verwendet nur den Auth Token aus dem Header.

---

## Schritt 2: Function Stack aufbauen

### Function 1: Response

**Add Function** → **Utility** → **Response**

**Konfiguration:**
Verwende die eingebaute Variable `authUser` (automatisch verfügbar bei authentifizierten Endpoints):

```json
{
  "id": authUser.id,
  "email": authUser.email,
  "name": authUser.name,
  "role": authUser.role,
  "is_active": authUser.is_active,
  "created_at": authUser.created_at,
  "avatar_url": authUser.avatar_url,
  "employee_id": authUser.employee_id
}
```

**Alternative (einfacher):**
Du kannst auch einfach direkt `authUser` zurückgeben:

```json
authUser
```

---

## Schritt 3: Endpoint-Einstellungen

1. Klicke oben auf **"Settings"** (⚙️ Icon)
2. **Auth Required**: `Yes` ✓ **WICHTIG!**
3. **Method**: `GET`
4. **Path**: `/me`

---

## Schritt 4: Testen

1. Erstelle zuerst einen Auth Token via `/login`
2. Kopiere den `authToken` aus der Response
3. Klicke auf **"Run & Debug"** (oben rechts)
4. Klicke auf **"Headers"** (Tab oben)
5. Füge Header hinzu:
   - **Key**: `Authorization`
   - **Value**: `Bearer <dein-token-hier>`
6. Klicke auf **"Run"**

**ODER** in Xano direkt:
- Wähle einen User aus dem Dropdown "Run as User"
- Klicke auf "Run"

### Erwartete Response:

```json
{
  "id": 1,
  "email": "test@example.com",
  "name": "Test User",
  "role": "user",
  "is_active": true,
  "created_at": 1698765432000,
  "avatar_url": null,
  "employee_id": null
}
```

---

## Fehlersuche

### Problem: "Unauthorized" oder 401 Error
- **Ursache**: Kein oder ungültiger Auth Token
- **Lösung**:
  1. Stelle sicher "Auth Required" ist auf `Yes`
  2. Sende einen gültigen Bearer Token im Authorization Header
  3. Token muss von `/login` oder `/signup` kommen

### Problem: authUser ist undefined
- **Ursache**: "Auth Required" ist nicht aktiviert
- **Lösung**: Gehe zu Settings → Setze "Auth Required" auf `Yes`

---

## Zusammenfassung: Function Stack

```
1. Response → authUser
```

**Sehr einfach!** Der `authUser` wird automatisch von Xano bereitgestellt wenn der Endpoint authentifiziert ist.

---

## Verwendung im Frontend

```typescript
// Mit Bearer Token im Header
const response = await fetch('https://...xano.io/api:eltyNUzq/me', {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

const user = await response.json();
console.log(user);
```

---

**Erstellt**: 1. November 2025
**Version**: 1.0
