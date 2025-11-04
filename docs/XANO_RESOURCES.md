# Xano Resources & Documentation

## Official XanoScript Documentation

### Database Table Creation
- **URL**: https://docs.xano.com/xanoscript/db
- **Purpose**: Complete syntax for creating database tables using XanoScript
- **Key Features**:
  - Table schema definitions with field types and constraints
  - Index creation (primary, btree, gin, unique)
  - Field modifiers (required, optional, nullable, defaults)
  - Filters for validation and transformation
  - Relationships between tables

### Table Schema Syntax
```xs
table table_name {
  schema {
    int id                        // Primary key
    text field filters=trim       // Required field with filter
    text? optional?               // Optional nullable field
    text field?="default"         // Optional with default value
    int? foreign_key? {           // Foreign key relationship
      table = "other_table"
    }
    timestamp created_at?=now     // Auto timestamp
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "field_name"}]}
    {type: "btree", field: [{name: "field1"}, {name: "field2"}]}
  ]
}
```

### Field Modifiers
- `field` — Required, non-nullable
- `field?` — Optional, non-nullable
- `?field?` — Required, nullable
- `field?=value` — Optional with default value

### Common Filters
- **Validation**: `min:n`, `max:n`, `minAlpha:n`, `minDigit:n`, `pattern:regex`
- **Transformation**: `trim`, `lower`, `upper`
- **Restrictions**: `startsWith:prefix`, `prevent:blacklist`

## CRM Database Schema Status

### ✅ Created Tables

1. **organizations** - Company/customer master data
2. **persons** - Contact persons (linked to organizations)
3. **addresses** - Polymorphic address management

All tables have been created in Xano using XanoScript.

### Table Relationships

```
user (existing)
  ↓ (created_by)
organizations
  ↓ (organization_id)
persons

addresses (polymorphic)
  ├─→ organizations (when addressable_type = "organization")
  └─→ persons (when addressable_type = "person")
```

## Local XanoScript Files

### Database Tables
- `/Users/keller/Desktop/XANO_ORGANIZATIONS.xs`
- `/Users/keller/Desktop/XANO_PERSONS.xs`
- `/Users/keller/Desktop/XANO_ADDRESSES.xs`

### Documentation
- `/Users/keller/code/zeiterfassung-xano/docs/CRM_DATABASE_SCHEMA.md`
- `/Users/keller/Desktop/XANO_CRM_TABELLEN_ANLEITUNG.md`

## Additional Xano Resources

### Local Xano Documentation
- `/Users/keller/xano/test2/docs/db_query_guideline.md`
- `/Users/keller/xano/test2/docs/api_query_guideline.md`
- `/Users/keller/xano/test2/docs/expression_guideline.md`
- `/Users/keller/xano/test2/docs/functions.md`
- `/Users/keller/xano/test2/docs/tips_and_tricks.md`
- `/Users/keller/xano/test2/docs/input_guideline.md`

### Custom References
- `/Users/keller/Desktop/xanoscript-db-query-reference.md`
- `/Users/keller/Desktop/xano-lambda-reference.md`

## Next Steps

1. Create API endpoints for CRM tables (CRUD operations)
2. Create TypeScript interfaces in frontend
3. Build Organizations dashboard
4. Integrate time tracking with organizations
