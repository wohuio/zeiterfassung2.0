# CRM Datenbank-Schema

Erweiterung der Zeiterfassung zu einem vollständigen CRM-System.

## 📊 Kernkonzept

Die bestehende `user` Tabelle wird zur zentralen User-Verwaltung für:
- **Zeiterfassung** (Mitarbeiter)
- **CRM** (Vertrieb, Office)

## 🏢 CRM Basis-Tabellen

### 1. organizations

Firmen und Organisationen (Kunden).

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  organization_number VARCHAR(50) UNIQUE NOT NULL,  -- z.B. "ORG-2025-001"
  name VARCHAR(255) NOT NULL,
  legal_form VARCHAR(50),                            -- GmbH, AG, e.K., etc.

  -- Finanzen
  payment_terms INT DEFAULT 30,                      -- Zahlungsziel in Tagen
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  credit_limit DECIMAL(10,2),

  -- Kategorisierung
  industry VARCHAR(100),                             -- Branche
  customer_type VARCHAR(50),                         -- B2B, B2C
  status VARCHAR(50) DEFAULT 'active',               -- active, inactive, prospect

  -- Steuer
  vat_id VARCHAR(50),                                -- USt-ID
  tax_number VARCHAR(50),

  -- Metadata
  website VARCHAR(255),
  notes TEXT,
  created_by INT REFERENCES user(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_organizations_number ON organizations(organization_number);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_name ON organizations(name);
```

### 2. persons

Kontaktpersonen (Ansprechpartner bei Firmen).

```sql
CREATE TABLE persons (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,

  -- Name
  salutation VARCHAR(20),                            -- Herr, Frau, Divers
  title VARCHAR(50),                                 -- Dr., Prof., etc.
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,

  -- Kontakt
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),

  -- Position
  position VARCHAR(100),                             -- Geschäftsführer, Einkauf, etc.
  department VARCHAR(100),

  -- Flags
  is_primary_contact BOOLEAN DEFAULT FALSE,
  is_billing_contact BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  birthday DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_persons_organization ON persons(organization_id);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_name ON persons(last_name, first_name);
```

### 3. addresses

Adressen (flexibel für Organizations und Persons).

```sql
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,

  -- Polymorphe Zuordnung
  addressable_type VARCHAR(50) NOT NULL,             -- 'organization', 'person'
  addressable_id INT NOT NULL,

  -- Adress-Typ
  address_type VARCHAR(50) DEFAULT 'billing',        -- billing, shipping, office, home

  -- Adresse
  street VARCHAR(255),
  street_number VARCHAR(20),
  additional_info VARCHAR(255),                      -- Stockwerk, Abteilung, etc.
  zip VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Deutschland',

  -- Flags
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_addressable ON addresses(addressable_type, addressable_id);
CREATE INDEX idx_addresses_type ON addresses(address_type);
CREATE INDEX idx_addresses_city ON addresses(city);
```

## 🔗 Integration mit Zeiterfassung

### Erweiterte time_entry Tabelle

```sql
-- Bestehende Spalten bleiben
ALTER TABLE time_entry ADD COLUMN organization_id INT REFERENCES organizations(id);
ALTER TABLE time_entry ADD COLUMN billable BOOLEAN DEFAULT TRUE;
ALTER TABLE time_entry ADD COLUMN hourly_rate DECIMAL(10,2);

CREATE INDEX idx_time_entry_organization ON time_entry(organization_id);
```

## 📈 Zusätzliche Beziehungen

### organization_contacts (Many-to-Many)

Alternative zu `persons.organization_id` wenn eine Person mehrere Firmen haben kann:

```sql
CREATE TABLE organization_contacts (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
  person_id INT REFERENCES persons(id) ON DELETE CASCADE,
  role VARCHAR(100),                                 -- Hauptansprechpartner, Einkauf, etc.
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id, person_id)
);
```

## 🎯 Vorteile dieser Struktur

### Flexibilität
- ✅ Mehrere Adressen pro Firma (Billing, Shipping, Office)
- ✅ Kontakte können auch ohne Firma existieren
- ✅ Kontakte können mehreren Firmen zugeordnet werden

### Skalierbarkeit
- ✅ Einfache Erweiterung um weitere Adresstypen
- ✅ Zeiterfassung direkt auf Kunden buchbar
- ✅ Stundenzettel pro Kunde abrechnbar

### Integration
- ✅ Zentrale `user` Tabelle für Zeiterfassung + CRM
- ✅ Alle CRM-Dokumente (Quotes, Orders, etc.) referenzieren `organizations`
- ✅ Time Entries können auf Organizations gebucht werden

## 📝 Nächste Schritte

1. ✅ **organizations, persons, addresses** Tabellen in Xano erstellen
2. **Dashboard** für Firmenübersicht (Frontend)
3. **CRUD** Operations für Organizations
4. **Kontaktverwaltung** (Persons mit Organization verknüpfen)
5. **Adressverwaltung** (Multiple Adressen pro Firma)
6. **Integration** mit Quotes/Orders aus dem ERD
