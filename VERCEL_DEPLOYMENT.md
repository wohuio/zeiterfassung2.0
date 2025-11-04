# 🚀 Vercel Deployment Anleitung - Zeiterfassung App

Diese Anleitung führt dich Schritt für Schritt durch das Deployment deiner Zeiterfassung-App auf Vercel.

**Geschätzte Zeit:** 5-10 Minuten
**Kosten:** Kostenlos (Free Tier)
**Schwierigkeit:** Einfach

---

## 📋 Voraussetzungen

Bevor du startest, stelle sicher dass du hast:

- [ ] Einen GitHub Account (https://github.com/signup)
- [ ] Die App läuft lokal auf `localhost:3000`
- [ ] Git ist installiert und das Repository ist initialisiert ✅

---

## Schritt 1: GitHub Repository erstellen

### 1.1 Neues Repository auf GitHub

1. Öffne https://github.com/new in deinem Browser
2. Fülle das Formular aus:
   ```
   Repository name: zeiterfassung-xano
   Description: Zeiterfassung App mit Xano Backend (optional)
   Visibility: ⚪ Public oder 🔒 Private (empfohlen)
   ```
3. **WICHTIG:** Aktiviere KEINE dieser Optionen:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
4. Klicke **"Create repository"**

### 1.2 Code hochladen

Nach dem Erstellen zeigt dir GitHub eine Seite mit Befehlen. Du siehst etwas wie:

```
…or push an existing repository from the command line

git remote add origin https://github.com/DEIN_USERNAME/zeiterfassung-xano.git
git branch -M main
git push -u origin main
```

**Öffne dein Terminal** und führe diese Befehle aus:

```bash
cd /Users/keller/code/zeiterfassung-xano

# Ersetze DEIN_USERNAME mit deinem GitHub-Benutzernamen!
git remote add origin https://github.com/DEIN_USERNAME/zeiterfassung-xano.git

# Branch umbenennen (falls nötig)
git branch -M main

# Code hochladen
git push -u origin main
```

**Beispiel:** Wenn dein GitHub-Username `max.mustermann` ist:
```bash
git remote add origin https://github.com/max.mustermann/zeiterfassung-xano.git
```

### 1.3 Authentifizierung

GitHub fragt nach deinen Login-Daten:

- **Username:** Dein GitHub-Benutzername
- **Password:**
  - Bei 2FA: Personal Access Token (siehe unten)
  - Ohne 2FA: Dein GitHub-Passwort

#### Personal Access Token erstellen (falls 2FA aktiv)

1. Gehe zu https://github.com/settings/tokens
2. Klicke "Generate new token" → "Generate new token (classic)"
3. Name: `Vercel Deployment`
4. Expiration: `90 days` oder `No expiration`
5. Aktiviere: `repo` (alle Checkboxen darunter)
6. Klicke "Generate token"
7. **Kopiere den Token** (wird nur einmal angezeigt!)
8. Verwende diesen Token als Passwort beim `git push`

### 1.4 Erfolg prüfen

Nach dem Push solltest du sehen:

```
Enumerating objects: 52, done.
Counting objects: 100% (52/52), done.
...
To https://github.com/DEIN_USERNAME/zeiterfassung-xano.git
 * [new branch]      main -> main
```

✅ **Perfekt!** Dein Code ist jetzt auf GitHub.

---

## Schritt 2: Vercel Account erstellen

### 2.1 Bei Vercel registrieren

1. Öffne https://vercel.com/signup
2. Klicke **"Continue with GitHub"**
3. **Login** mit deinem GitHub Account
4. Vercel fragt nach Berechtigungen - Klicke **"Authorize Vercel"**

### 2.2 Installation bestätigen

GitHub fragt: "Where do you want to install Vercel?"

- **Option 1:** "All repositories" (empfohlen für einfache Nutzung)
- **Option 2:** "Only select repositories" → Wähle `zeiterfassung-xano`

Klicke **"Install"**

✅ Du wirst zu deinem **Vercel Dashboard** weitergeleitet.

---

## Schritt 3: Projekt deployen

### 3.1 Neues Projekt erstellen

Im Vercel Dashboard:

1. Klicke oben rechts auf **"Add New..."**
2. Wähle **"Project"**

### 3.2 Repository importieren

Du siehst jetzt eine Liste deiner GitHub-Repositories.

1. **Suche** nach `zeiterfassung-xano`
2. Klicke **"Import"** rechts neben dem Repository

Falls du das Repository nicht siehst:
- Klicke "Adjust GitHub App Permissions"
- Stelle sicher, dass Vercel Zugriff hat
- Zurück und nochmal versuchen

### 3.3 Projekt konfigurieren

Vercel zeigt dir jetzt die Projekt-Konfiguration:

#### Basic Settings (nicht ändern!)

```
Project Name: zeiterfassung-xano
Framework Preset: Next.js ✓ (automatisch erkannt)
Root Directory: ./
```

#### Build and Output Settings (automatisch korrekt!)

```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**Lass alle diese Werte unverändert!** Next.js wird automatisch erkannt.

### 3.4 Environment Variables hinzufügen

Das ist der **wichtigste Schritt!**

Scrolle nach unten bis zu **"Environment Variables"**.

Füge **alle 4 Variablen** einzeln hinzu:

#### Variable 1: XANO_BASE_URL

```
Key:   NEXT_PUBLIC_XANO_BASE_URL
Value: https://xv05-su7k-rvc8.f2.xano.io
```

Klicke **"Add"** (kleines + Symbol)

#### Variable 2: API_GROUP_AUTH

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_AUTH
Value: api:eltyNUzq
```

Klicke **"Add"**

#### Variable 3: API_GROUP_MAIN

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_MAIN
Value: api:uMXZ3Fde
```

Klicke **"Add"**

#### Variable 4: API_GROUP_REPORTS

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_REPORTS
Value: api:p3vCYW4E
```

Klicke **"Add"**

#### Variable 5: API_GROUP_TIME_ENTRIES

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_TIME_ENTRIES
Value: api:time_entries
```

Klicke **"Add"**

#### Variable 6: API_GROUP_CRM

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_CRM
Value: api:2dZRWuiU
```

Klicke **"Add"**

#### Variable 7: API_GROUP_ADMIN

```
Key:   NEXT_PUBLIC_XANO_API_GROUP_ADMIN
Value: api:xaFAyPfv
```

Klicke **"Add"**

**Wichtig:**
- ✅ Exakte Schreibweise beachten
- ✅ Keine Leerzeichen vor/nach den Werten
- ✅ Alle 7 Variablen müssen hinzugefügt sein

Du solltest jetzt **7 Environment Variables** sehen.

### 3.5 Deployment starten

Klicke den großen blauen Button: **"Deploy"**

---

## Schritt 4: Deployment beobachten

Vercel baut jetzt deine App. Du siehst einen Live-Log:

```
Cloning repository...
✓ Cloned repository in 2s

Installing dependencies...
✓ Installed dependencies in 15s

Building application...
✓ Build completed in 45s

Deploying...
✓ Deployment ready in 5s
```

**Dauer:** ~1-3 Minuten

### Was passiert im Hintergrund?

1. **Clone:** Code von GitHub herunterladen
2. **Install:** `npm install` - Dependencies installieren
3. **Build:** `npm run build` - Next.js App bauen
4. **Deploy:** App auf Vercel-Server hochladen
5. **Ready:** URL generieren und aktivieren

### Build-Log Details

Du kannst den vollständigen Log sehen:
- Klicke auf "Building..." für Details
- Grüne ✓ = Erfolgreich
- Rote ✗ = Fehler (siehe Troubleshooting unten)

---

## Schritt 5: Erfolg! 🎉

Nach ~2 Minuten siehst du:

```
🎉 Congratulations! Your project has been successfully deployed!
```

### Deine App ist jetzt live!

Vercel zeigt dir:

```
Production Deployment
https://zeiterfassung-xano.vercel.app

oder

https://zeiterfassung-xano-abc123.vercel.app
```

### App öffnen und testen

1. **Klicke auf "Visit"** oder die URL
2. Deine App öffnet sich in einem neuen Tab
3. **Teste alle Features:**
   - [ ] Login-Seite lädt
   - [ ] Signup funktioniert
   - [ ] Login funktioniert
   - [ ] Timer starten/stoppen
   - [ ] Manueller Eintrag erstellen
   - [ ] Monatsübersicht anzeigen
   - [ ] Wochenübersicht anzeigen

✅ **Alles funktioniert? Perfekt!**

---

## Schritt 6: URL teilen

Deine App ist jetzt öffentlich erreichbar (auch wenn das GitHub-Repo privat ist).

**Production URL:**
```
https://zeiterfassung-xano.vercel.app
```

Diese URL kannst du:
- ✅ Mit Kollegen teilen
- ✅ Als Lesezeichen speichern
- ✅ Auf Handy/Tablet nutzen
- ✅ In Teams/Slack posten

---

## 🔄 Updates deployen (ab jetzt)

Ab jetzt ist jedes Update super einfach:

### Änderungen machen

```bash
cd /Users/keller/code/zeiterfassung-xano

# Datei bearbeiten (z.B. in VSCode)
# ...

# Änderungen committen
git add .
git commit -m "Feature: Neue Funktion XYZ hinzugefügt"

# Zu GitHub pushen
git push
```

**Das war's!** 🚀

Vercel erkennt automatisch den Push und deployt in ~2 Minuten.

### Deployment-Status prüfen

1. Gehe zu https://vercel.com/dashboard
2. Klicke auf dein Projekt `zeiterfassung-xano`
3. Unter "Deployments" siehst du alle Deployments

**Du bekommst auch eine E-Mail** wenn das Deployment fertig ist!

### Preview Deployments

Bei jedem Push erstellt Vercel:
- **Production Deployment:** `zeiterfassung-xano.vercel.app` (nur bei Push auf `main`)
- **Preview Deployment:** `zeiterfassung-xano-git-feature-abc.vercel.app` (bei anderen Branches)

---

## 🌐 Custom Domain einrichten (optional)

Du willst statt `zeiterfassung-xano.vercel.app` lieber `zeit.meinefirma.de`?

### Domain hinzufügen

1. **Vercel Dashboard** → Dein Projekt → **"Settings"** → **"Domains"**
2. Klicke **"Add"**
3. Domain eingeben: `zeit.meinefirma.de` oder `zeiterfassung.meinefirma.de`
4. Klicke **"Add"**

### DNS-Records konfigurieren

Vercel zeigt dir jetzt, welche DNS-Records du brauchst:

#### Bei deinem Domain-Provider (z.B. Hetzner, Strato, 1&1):

**Für Subdomain** (z.B. `zeit.meinefirma.de`):
```
Type:  CNAME
Name:  zeit
Value: cname.vercel-dns.com
TTL:   3600
```

**Für Root-Domain** (z.B. `meinefirma.de`):
```
Type:  A
Name:  @
Value: 76.76.21.21
TTL:   3600
```

### Warten auf DNS-Propagation

- DNS-Änderungen brauchen **5-60 Minuten**
- Vercel prüft automatisch und aktiviert die Domain
- Du bekommst eine E-Mail wenn alles fertig ist

### SSL-Zertifikat

**Automatisch!** Vercel erstellt ein kostenloses SSL-Zertifikat (Let's Encrypt).

✅ Deine Domain ist HTTPS-gesichert!

---

## 🔧 Vercel Dashboard Features

### Analytics (kostenlos!)

**Vercel Dashboard** → Dein Projekt → **"Analytics"**

Siehst du:
- Seitenaufrufe
- Top-Seiten
- Geräte-Verteilung
- Länder-Verteilung

### Logs & Monitoring

**"Deployments"** → Klicke auf ein Deployment → **"View Function Logs"**

Hier siehst du:
- Console.logs aus deinem Code
- Fehler und Warnings
- API-Requests

### Environment Variables ändern

**"Settings"** → **"Environment Variables"**

- Werte ändern (z.B. neue Xano-URL)
- Neue Variablen hinzufügen
- **Wichtig:** Nach Änderung → **"Redeploy"** klicken!

---

## 🐛 Troubleshooting

### Build failed: "Module not found"

**Problem:** Dependencies fehlen

**Lösung:**
```bash
cd /Users/keller/code/zeiterfassung-xano
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Fix: Dependencies aktualisiert"
git push
```

### Build failed: Environment Variables

**Problem:** Environment Variables fehlen oder falsch

**Lösung:**
1. Vercel Dashboard → Projekt → Settings → Environment Variables
2. Prüfe alle 7 Variablen:
   - `NEXT_PUBLIC_XANO_BASE_URL`
   - `NEXT_PUBLIC_XANO_API_GROUP_AUTH`
   - `NEXT_PUBLIC_XANO_API_GROUP_MAIN`
   - `NEXT_PUBLIC_XANO_API_GROUP_REPORTS`
   - `NEXT_PUBLIC_XANO_API_GROUP_TIME_ENTRIES`
   - `NEXT_PUBLIC_XANO_API_GROUP_CRM`
   - `NEXT_PUBLIC_XANO_API_GROUP_ADMIN`
3. Keine Leerzeichen, exakte Schreibweise!
4. Nach Änderung: Deployments → ⋮ → "Redeploy"

### 401 Unauthorized / CORS Error

**Problem:** Xano blockiert Requests von Vercel-URL

**Lösung:**

1. Gehe zu deinem **Xano Workspace**
2. **Settings** → **API Settings**
3. Unter **"CORS Allowed Origins"** → **"Add Origin"**
4. Füge hinzu:
   ```
   https://zeiterfassung-xano.vercel.app
   ```
   (Ersetze mit deiner echten Vercel-URL)
5. Klicke **"Save"**
6. Teste nochmal

### App lädt, aber weiße Seite

**Problem:** JavaScript-Fehler

**Lösung:**
1. Öffne Browser DevTools (F12)
2. Gehe zu "Console"
3. Schaue nach Fehlermeldungen
4. Häufig: Environment Variables fehlen
5. Prüfe in Vercel Dashboard → Settings → Environment Variables

### Repository nicht sichtbar in Vercel

**Problem:** Vercel hat keinen Zugriff

**Lösung:**
1. Vercel Dashboard → "Add New..." → "Project"
2. Klicke **"Adjust GitHub App Permissions"**
3. Wähle:
   - "All repositories" ODER
   - "Only select repositories" → Wähle `zeiterfassung-xano`
4. Klicke **"Save"**
5. Zurück zu Vercel und nochmal "Add New..."

### Deployment hängt bei "Building..."

**Problem:** Build dauert zu lange oder ist stuck

**Lösung:**
1. Warte 5 Minuten (manchmal dauert es einfach)
2. Falls immer noch stuck:
   - Deployments → ⋮ (drei Punkte) → **"Cancel"**
   - Dann: Deployments → **"Redeploy"**

### Git Push fehlgeschlagen: "Authentication failed"

**Problem:** GitHub-Credentials falsch

**Lösung mit Personal Access Token:**
1. GitHub → https://github.com/settings/tokens
2. "Generate new token" → "Generate new token (classic)"
3. Name: `Git Push`
4. Expiration: `No expiration`
5. Scope: ✅ `repo` (alles darunter)
6. "Generate token"
7. **Kopiere den Token**
8. Bei `git push` verwende Token als Passwort:
   ```
   Username: dein-github-username
   Password: ghp_xxxxxxxxxxxxxxxxxxxx (dein Token)
   ```

---

## 📊 Free Tier Limits

Vercel Free ist großzügig:

```
✅ Unbegrenzte Deployments
✅ 100 GB Bandwidth/Monat (~1 Million Seitenaufrufe)
✅ 100 GB-Stunden Serverless Functions
✅ 6.000 Build-Minuten/Monat
✅ HTTPS inklusive
✅ Custom Domains inklusive
✅ Analytics inklusive
```

**Für deine Zeiterfassung mit 10-30 Nutzern:** Mehr als genug! 🚀

### Wann zum Pro Plan upgraden?

Nur wenn du:
- Mehr als 100 GB Traffic/Monat brauchst
- Mehr als 10 Team-Mitglieder hast
- Advanced Analytics brauchst
- Priority Support willst

**Pro Plan:** $20/Monat

---

## ✅ Deployment Checkliste

Nach erfolgreichem Deployment:

- [ ] GitHub Repository erstellt und Code gepusht
- [ ] Vercel Account mit GitHub verbunden
- [ ] Projekt in Vercel importiert
- [ ] Alle 4 Environment Variables gesetzt
- [ ] Deployment erfolgreich (grüner Status)
- [ ] Production URL funktioniert
- [ ] Login/Signup getestet
- [ ] Timer-Funktionen getestet
- [ ] Reports getestet (Monat + Woche)
- [ ] Xano CORS konfiguriert (falls nötig)
- [ ] URL mit Team/Kollegen geteilt

---

## 🎯 Nächste Schritte

### Jetzt:
1. ✅ App läuft auf Vercel
2. ✅ Automatische Deployments bei `git push`
3. ✅ HTTPS automatisch aktiviert

### Optional:
- [ ] Custom Domain einrichten
- [ ] Vercel Analytics aktivieren
- [ ] Team-Mitglieder zu Vercel-Projekt einladen
- [ ] GitHub Branch-Protection einrichten
- [ ] Monitoring-Alerts konfigurieren

### Später:
- [ ] Staging-Environment erstellen (via Git-Branches)
- [ ] Preview-Deployments für Features nutzen
- [ ] CI/CD mit Tests erweitern

---

## 📚 Wichtige Links

- **Dein Vercel Dashboard:** https://vercel.com/dashboard
- **Dein GitHub Repo:** https://github.com/DEIN_USERNAME/zeiterfassung-xano
- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support

---

## 💡 Tipps & Best Practices

### Git-Workflow

```bash
# Feature entwickeln
git checkout -b feature/neue-funktion
# ... Änderungen machen ...
git add .
git commit -m "Feature: Neue Funktion"
git push origin feature/neue-funktion

# In Vercel bekommst du automatisch eine Preview-URL!
# z.B.: https://zeiterfassung-xano-git-feature-neue-funktion.vercel.app

# Testen und wenn alles ok:
git checkout main
git merge feature/neue-funktion
git push

# Production-Deployment läuft automatisch!
```

### Commit-Messages

Gute Commit-Messages helfen später:

```bash
✅ git commit -m "Feature: Wochenübersicht mit Fortschrittsbalken"
✅ git commit -m "Fix: Timer stoppt nicht bei Seitenwechsel"
✅ git commit -m "Update: Xano API-Endpunkte aktualisiert"

❌ git commit -m "updates"
❌ git commit -m "fix"
❌ git commit -m "asdf"
```

### Environment Variables

Halte `.env.local` lokal und NIEMALS in Git:

```bash
# .gitignore enthält bereits:
.env.local
.env*.local
```

✅ Sicher: Werte nur in Vercel Dashboard
❌ Unsicher: Werte in Git committen

---

## 🎉 Geschafft!

**Deine Zeiterfassung-App ist jetzt live auf Vercel!**

Du hast gelernt:
- ✅ GitHub Repository erstellen und nutzen
- ✅ Vercel Account einrichten
- ✅ Next.js App deployen
- ✅ Environment Variables konfigurieren
- ✅ Automatische Deployments nutzen
- ✅ Troubleshooting bei Problemen

**Pro-Tipp:** Bookmark deine Vercel-Dashboard-URL für schnellen Zugriff!

---

**Fragen oder Probleme?**
Schau in die Troubleshooting-Sektion oben oder öffne ein Issue auf GitHub!

**Viel Erfolg mit deiner App!** 🚀
