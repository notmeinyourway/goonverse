# Goonverse — Architecture & Data Isolation

## 1. Overview
Goonverse is designed with strict multi-tenant isolation, defense-in-depth, and hardware-secured client operations.

```
                    ┌─────────────────────────┐
                    │      Android Client     │
                    │ (Compose, Room, KeyStore)│
                    └───────────┬─────────────┘
                                │ Bearer Token / HTTPS
                                ▼
                    ┌─────────────────────────┐
                    │      NestJS Gateway     │
                    │  (Guards, Interceptors) │
                    └─────┬──────────────┬────┘
                          │              │
             Private SQL  │              │ S3 Signed URLs (15m)
                          ▼              ▼
                    ┌───────────┐  ┌───────────┐
                    │PostgreSQL │  │Backblaze  │
                    │  (Prisma) │  │B2 Vault   │
                    └───────────┘  └───────────┘
```

## 2. Multi-Tenant Owner Isolation
Every query and mutation in `PeopleService`, `ImagesService`, `ActivitiesService`, and `StatsService` enforces the tenant context:
```typescript
where: {
  id: resourceId,
  user_id: authenticatedUserId,
  deleted_at: null
}
```
Cross-user access returns `404 Not Found` rather than leaking existence (`403 Forbidden`).

## 3. Storage Abstraction
Storage is encapsulated behind `StorageService`:
- `uploadObject(key, buffer, contentType)`
- `getSignedDownloadUrl(key, expiresInSeconds)`
- `deleteObject(key)`
- `deleteObjects(keys)`

Switching providers (e.g. from Backblaze B2 to AWS S3 or Cloudflare R2) requires only updating configuration without changing business logic or Android client code.

## 4. Admin Mediation Layer
Admin operations bypass direct database access and connect exclusively through the audited NestJS Admin API:
- `ADMIN_VIEW_IMAGE` logged before issuing signed URL for preview.
- `ADMIN_SUSPEND_USER` requiring explicit reason.
- `ADMIN_DELETE_IMAGE` cascading physical deletion to B2 storage.
