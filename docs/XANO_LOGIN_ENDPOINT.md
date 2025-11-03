# Xano /login Endpoint - Manuelle Konfiguration

## Übersicht
Login Endpoint für bestehende User mit Email und Password.

---

## Schritt 1: Inputs definieren

1. Öffne den `/login` Endpoint in Xano
2. Klicke auf **"Inputs"** (links in der Sidebar)
3. Klicke auf **"+ Add Input"** für jeden Input:

### Input 1: Email
- **Name**: `email`
- **Type**: `text`
- **Required**: ✓ (Häkchen setzen)
- **Filters**:
  - Klicke auf "Filters"
  - Wähle: `trim`, `lower`

### Input 2: Password
- **Name**: `password`
- **Type**: `text` ⚠️ **NICHT "password"!**
- **Required**: ✓ (Häkchen setzen)

---

## Schritt 2: Function Stack aufbauen

### Function 1: Xano Authentication Login

**Add Function** → **Authentication** → **Login**

**Konfiguration:**
- **Table**: `user`
- **Login Field**: `email`
- **Password Field**: `password`
- **Email/Username**: Klicke Icon → Wähle `input.email`
- **Password**: Klicke Icon → Wähle `input.password`
- **Expiration**: `2592000` (30 Tage in Sekunden)
- **Variable name**: `login_result`

**Hinweis**: Diese Function gibt automatisch ein Object mit `authToken` und `user` zurück!

### Function 2: Response

**Add Function** → **Utility** → **Response**

**Konfiguration:**
```json
{
  "authToken": login_result.authToken,
  "user": {
    "id": login_result.user.id,
    "email": login_result.user.email,
    "name": login_result.user.name,
    "role": login_result.user.role,
    "is_active": login_result.user.is_active
  }
}
```

---

## Schritt 3: Endpoint-Einstellungen

1. Klicke oben auf **"Settings"** (⚙️ Icon)
2. **Auth Required**: `No` (Login braucht keine Authentifizierung)
3. **Method**: `POST`
4. **Path**: `/login`

---

## Schritt 4: Testen

1. Erstelle zuerst einen User über `/signup`
2. Klicke auf **"Run & Debug"** (oben rechts)
3. Gib die Login-Daten ein:

```json
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

4. Klicke auf **"Run"**

### Erwartete Response:

```json
{
  "authToken": "eyJhbGciOiJBMjU2S1ciLC...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user",
    "is_active": true
  }
}
```

---

## Fehlersuche

### Problem: "Invalid credentials"
- **Ursache 1**: Falsche Email oder Password
- **Ursache 2**: User existiert nicht (zuerst via `/signup` erstellen)
- **Ursache 3**: Password wurde beim Signup doppelt gehasht
  - **Lösung**: Stelle sicher dass `/signup` Input Type "text" verwendet

### Problem: User nicht aktiv
- **Ursache**: `is_active` ist `false`
- **Lösung**: Setze `is_active` in der Datenbank auf `true`

---

## Zusammenfassung: Function Stack

```
1. Authentication Login → login_result
2. Response { authToken, user }
```

**Sehr einfach!** Xano's Login Function macht die ganze Arbeit.

---

**Erstellt**: 1. November 2025
**Version**: 1.0
