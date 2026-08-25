# Goonverse — Private Activity & Vault System

Goonverse is an adults-only (18+) private personal activity-tracking and media-vault application with zero-knowledge-style isolation, private Backblaze B2 cloud storage, an Android native client, and a dedicated Next.js Admin & Moderation Dashboard.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Android Native App                   │
│   (Jetpack Compose, MVVM, Room Cache, Keystore Crypto) │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT Auth
                            ▼
┌────────────────────────────────────────────────────────┐
│                   NestJS API Gateway                   │
│      (Role-based Auth, Argon2id, Audit Logger,         │
│       Magic Byte Validation, Rate Limiter)             │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│     PostgreSQL Database   │ │   Backblaze B2 Storage    │
│  (Prisma ORM, Soft Delete)│ │  (Private S3 Bucket Vault)│
└───────────────────────────┘ └───────────────────────────┘
              ▲
              │ Internal Admin REST API (Audited)
┌─────────────┴──────────────────────────────────────────┐
│              Next.js Admin Dashboard (Web)             │
│      (Moderation Queue, User Management, Audit Logs)   │
└────────────────────────────────────────────────────────┘
```

---

## 🔒 Core Privacy & Security Principles

1. **Zero Public URLs**: Cloud storage objects reside in a 100% private Backblaze B2 bucket. All access is mediated via short-lived HMAC-signed URLs (15 minutes expiry) or stream proxies.
2. **Owner Data Isolation**: Queries and mutations strictly enforce `user_id` matching on every database operation. Cross-tenant access is impossible.
3. **Hardware-Backed Device Security**: Sensitive auth tokens and PIN hashes are encrypted with AES-256-GCM using keys stored in the hardware Android Keystore (`EncryptedSharedPreferences`).
4. **Audit Trail**: Every administrative action (viewing an image, suspending an account, resolving a report) creates an immutable audit record in PostgreSQL.
5. **Magic Byte Signature Inspection**: Image uploads are verified by inspecting byte headers (JPEG, PNG, WebP, GIF) to prevent MIME spoofing and payload injection.

---

## 🚀 Repository Layout

- [`android/`](file:///c:/Users/naksh/Desktop/g/goonverse/android): Native Android client (Kotlin, Jetpack Compose, Material 3, Room, Retrofit, OkHttp).
- [`backend/`](file:///c:/Users/naksh/Desktop/g/goonverse/backend): NestJS REST API with PostgreSQL/Prisma, Argon2id hashing, and Backblaze B2 integration.
- [`admin/`](file:///c:/Users/naksh/Desktop/g/goonverse/admin): Next.js 14 Admin Dashboard with Tailwind CSS, TanStack Query, and moderation tools.
- [`docs/`](file:///c:/Users/naksh/Desktop/g/goonverse/docs): Production architecture, security models, deployment guides, and storage runbooks.

---

## 🛠️ Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env # Configure DATABASE_URL, B2_*, and JWT_*
npx prisma db push
npm run start:dev
```

### 2. Admin Dashboard
```bash
cd admin
npm install
cp .env.local.example .env.local # Point NEXT_PUBLIC_API_URL to backend
npm run dev
```

### 3. Android Client
```bash
cd android
# Build Release APK
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📜 Documentation Index

- [Architecture & Isolation](docs/architecture.md)
- [Security & Threat Model](docs/security.md)
- [Deployment Runbook](docs/deployment.md)
- [Android Build & Proguard](docs/android-build.md)
- [Storage Architecture](docs/storage.md)
- [Backup & Disaster Recovery](docs/backup-recovery.md)
