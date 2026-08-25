# Goonverse — Private Storage Architecture

## 1. Backblaze B2 Private Vault
Goonverse media storage is built with an absolute zero-public-access posture:
- **Bucket Policy**: Private. No anonymous read/write allowed.
- **Key Namespace**: `users/{userId}/images/{imageId}-{timestamp}.{ext}`
- **Presigned URLs**: Signed with AWS SigV4, valid for 15 minutes max.

```text
Android Client                Backend API               Backblaze B2 Vault
     │                             │                           │
     │ 1. GET /images/:id/signed   │                           │
     │────────────────────────────>│                           │
     │                             │ 2. Generate SigV4 URL     │
     │                             │──────────────────────────>│
     │ 3. Return 15m Signed URL    │                           │
     │<────────────────────────────│                           │
     │                             │                           │
     │ 4. Stream Encrypted Media   │                           │
     │────────────────────────────────────────────────────────>│
```

## 2. Deletion Lifecycle & Cascade
- Soft deletion in PostgreSQL marks image record with `deleted_at = NOW()`.
- Hard deletion or user account purge cascades physical B2 object removal through `StorageService.deleteObject(storageKey)`.
- Batch cleanup jobs periodically purge soft-deleted records older than retention policy (30 days).
