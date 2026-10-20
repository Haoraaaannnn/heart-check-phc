# Database Troubleshooting & Verification Guide

This document outlines diagnostic queries, cryptographic verification procedures, and migration troubleshooting steps for the PostgreSQL database in **Heart Check PHC**.

---

## 1. Verifying Row-Level Security (RLS) Policies

To audit which policies are actively enforced on database tables:

```sql
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;
```

### Testing Anonymous Check-In Permissions
Verify that the `anon` role can insert live patient check-ins but cannot mutate historical rows:
```sql
-- Should succeed for anon:
INSERT INTO patients (service, phoneNum, patientNum, status, is_historical)
VALUES ('Consultation', 'enc:v1:test', 'C999', 'waiting', false);

-- Should fail for anon (restricted by RLS):
UPDATE patients SET status = 'Done' WHERE patientNum = 'C999';
```

---

## 2. Phone Number Encryption Verification

Patient phone numbers must always be stored with the `enc:v1:` prefix representing authenticated AES-256-GCM ciphertext.

### Verification Query
```sql
-- Count unencrypted legacy phone numbers:
SELECT count(*) 
FROM patients 
WHERE phoneNum IS NOT NULL 
  AND phoneNum::text NOT LIKE 'enc:v1:%';
```
If the count is greater than zero, run the phone encryption migration script to backfill ciphertexts.

### Validating the Encryption Utility
You can test `lib/crypto/phoneEncryption.ts` using Node.js:
```typescript
import { encryptPhoneNumber, decryptPhoneNumber, maskPhoneNumber } from '@/lib/crypto/phoneEncryption';

const raw = '09171234567';
const encrypted = encryptPhoneNumber(raw);
console.log('Encrypted:', encrypted); // Starts with "enc:v1:"
console.log('Decrypted:', decryptPhoneNumber(encrypted)); // Matches "09171234567"
console.log('Masked:', maskPhoneNumber(raw)); // "0917 •••• 567"
```

---

## 3. Protecting Historical Research Data (`is_historical`)

Always verify that queries affecting patient records guard historical entries:

```sql
-- Audit count of historical records:
SELECT count(*) FROM patients WHERE is_historical = true;

-- Verification: ensure no historical record has a kiosk ticket code
SELECT count(*) FROM patients WHERE is_historical = true AND patientNum IS NOT NULL;
-- Expected output: 0
```

---

## 4. Applying Database Migrations

Database migration scripts reside in `docs/migrations/`:
- `docs/migrations/encrypt_phone_number.sql`: Sets up pgcrypto functions and cipher routines.

### Migration Application Steps
1. Open the Supabase Project Dashboard -> SQL Editor.
2. Load the contents of the target `.sql` migration file.
3. Execute within a transaction block (`BEGIN; ... COMMIT;`).
4. Re-run policy audit query to ensure RLS definitions are updated cleanly.

---

## Cross-References

- [Database & RLS Policies](../architecture/database-and-rls.md)
- [Security Model & Route Guarding](../architecture/security-model.md)
- [Common System Issues](./common-issues.md)
