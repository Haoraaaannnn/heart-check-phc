# Patient Phone Number Encryption & Security Architecture

## Overview & Threat Model

Patient phone numbers collected at self-service kiosks constitute Personally Identifiable Information (PII) and Sensitive Personal Data under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). To protect patient confidentiality against unauthorized disclosure, shoulder-surfing, data dumps, and database snooping, phone numbers are encrypted using authenticated symmetric encryption (AES-256-GCM).

---

## Cryptographic Architecture

### 1. Algorithm & Mode
- **Cipher:** AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode).
- **Key Length:** 256 bits (32 bytes).
- **Key Derivation:** PBKDF2 / scrypt derived from `PHONE_ENCRYPTION_SECRET` (with deterministic salt `phc_phone_salt_v1_2026`).
- **Nonce / IV:** 12-byte cryptographically secure pseudorandom number (`crypto.randomBytes(12)`) generated fresh for every encryption.
- **Authentication Tag:** 16-byte (128-bit) GCM authentication tag verifying ciphertext authenticity and preventing tampering.

### 2. Ciphertext Serialization Format
Encrypted tokens adhere to the following colon-delimited string format:
```text
enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
```

Example payload:
```text
enc:v1:83a2c427f7a22eae587db368:5e4775605fe661836446cc734b2a7c32:7c99412ccdbac828c78d25
```

### 3. Graceful Backwards Compatibility
The decryption helper `decryptPhoneNumber()` automatically detects whether a phone value is an `enc:v1` ciphertext or a legacy plain number (`int8` or string digits). Legacy patient records display and function seamlessly without requiring immediate mass re-encryption.

---

## Developer Editing Guide ("Where to Edit")

The table below provides direct file paths for modifying any part of the phone number security subsystem:

| Action / Responsibility | File Path |
| :--- | :--- |
| **Core encryption / decryption logic & AES-256-GCM cipher** | [lib/crypto/phoneEncryption.ts](file:///home/jensen/Github-Repositories/heart-check-phc/lib/crypto/phoneEncryption.ts) |
| **Next.js Server Actions for client-safe encryption & decryption** | [app/actions/phoneSecurity.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/phoneSecurity.ts) |
| **Kiosk phone number entry & ticket registration** | [KioskPhoneEntry.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/kiosk/pages/sms-input/components/KioskPhoneEntry.tsx) |
| **Automated SMS dispatch & gateway normalization** | [app/actions/sendSMS.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/actions/sendSMS.ts) |
| **Dashboard patient table & protected phone rendering** | [RecentPatientTable.tsx](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/components/RecentPatientTable.tsx) |
| **Dashboard patient query hook & record mapping** | [usePatientsData.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/hooks/usePatientsData.ts) |
| **Dashboard patient text tokens & copy** | [patientsTexts.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patientsTexts.ts) |
| **Dashboard patient style definitions & badge tokens** | [patients.ts](file:///home/jensen/Github-Repositories/heart-check-phc/app/dashboard/pages/patients/constants/patients.ts) |
| **Shared patient TypeScript definitions** | [types/Types.ts](file:///home/jensen/Github-Repositories/heart-check-phc/types/Types.ts) |
| **Supabase database migration script** | [docs/migrations/encrypt_phone_number.sql](file:///home/jensen/Github-Repositories/heart-check-phc/docs/migrations/encrypt_phone_number.sql) |

---

## Database Migration Instructions

To migrate the live Supabase PostgreSQL database to support encrypted text phone numbers:

1. Open the **Supabase Dashboard** for the project.
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy and run the script in `docs/migrations/encrypt_phone_number.sql`.
4. The script performs:
   - Changes `patients.phoneNum` column type from `bigint` to `text`.
   - Recreates the `create_patient` stored procedure with `p_phone text`.
   - Grants appropriate execution privileges to `anon`, `authenticated`, and `service_role`.

---

## Environment Variable Configuration

Add the encryption secret to `.env.local`:
```bash
PHONE_ENCRYPTION_SECRET=your-secure-32-byte-hex-or-passphrase-here
```
If not specified, the system uses a fallback seed for local development and build phases. In staging and production, always supply a cryptographically strong secret.
