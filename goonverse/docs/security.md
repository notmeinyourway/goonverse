# Goonverse — Security & Threat Model

## 1. Authentication & Cryptography
- **Password Hashing**: Argon2id with memory cost 65536 KiB, iterations 3, parallelism 4.
- **JWT Lifecycles**:
  - Access Token: 15 minutes validity, signed with RS256 / HS256 secret.
  - Refresh Token: 30 days validity, hashed with SHA-256 in database for session tracking and single/multi-session revocation.
- **Session Revocation**:
  - `DELETE /auth/sessions/:id` (revoke individual device session)
  - `POST /auth/sessions/revoke-others` (terminate all other sessions)

## 2. File Upload Security
- **Magic Byte Signature Inspection**: Header verification for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`), and GIF (`GIF87a`/`GIF89a`).
- **File Size Caps**: 25 MB payload limit enforced at the reverse proxy and Express body-parser level.
- **Content-Disposition**: Downloads delivered as binary attachments or sandboxed previews.

## 3. Android Client Hardening
- **Android Keystore**: `MasterKey` with AES-256-GCM encryption for local preferences.
- **App Lock**: Salted SHA-256 PIN hash verification with configurable timeouts (`Immediately`, `1m`, `5m`, `15m`, `Never`).
- **Cache Eradication**: `appDatabase.clearAllTables()` executed on logout or account deletion.
- **Discreet Push Notifications**: Push notifications use generic copy (`Goonverse: You have a reminder`) to protect privacy on lock screens.

## 4. Admin Audit Trail
All administrative actions emit an immutable log in PostgreSQL:
| Action | Description | Mandatory Fields |
|---|---|---|
| `ADMIN_VIEW_IMAGE` | Admin rendered image preview | `admin_id`, `target_id`, `ip_address` |
| `ADMIN_DELETE_IMAGE` | Admin purged an image | `admin_id`, `target_id`, `reason` |
| `ADMIN_SUSPEND_USER` | Admin banned an account | `admin_id`, `target_id`, `reason` |
