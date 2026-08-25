# Goonverse Backend

Production-grade NestJS backend for Goonverse — an adults-only (18+) private personal activity-tracking and media-organization platform.

## Features & Architecture

- **Clean Architecture & Multi-Tenant Data Isolation**: Every resource (people, images, activities, stats) is strictly owner-isolated. User A cannot access or mutate User B's resources even with known UUIDs.
- **Private Object Storage Abstraction**: Pluggable storage architecture compatible with Backblaze B2 (S3-compatible API). Bucket is strictly private with short-lived signed URLs for media delivery.
- **Graceful Unconfigured Storage Degradation**: The backend starts and operates seamlessly in development mode even before Backblaze B2 credentials are provided. Storage operations return clear 503 HTTP status until configured.
- **Deterministic Streak Engine**: Timezone-aware streak calculation computing current streaks, longest streaks, and milestones with midnight boundaries and same-day deduplication.
- **Authentication & Security**:
  - Argon2id password hashing
  - Short-lived JWT access tokens (15m) + SHA-256 hashed refresh tokens with automatic rotation and replay-theft revocation
  - Helmet security headers, CORS origin filtering, and global Throttler rate limiting
  - Global validation pipe rejecting non-whitelisted attributes
  - 18+ age verification and Terms/Privacy acceptance enforcement
- **Interactive Swagger / OpenAPI Docs**: Interactive API documentation at `/api/docs`.

---

## Requirements

- **Node.js**: >= 20.x
- **npm**: >= 10.x
- **PostgreSQL**: 16.x (or Docker container provided in `../database`)
- **Backblaze B2** (or S3-compatible storage for image uploads)

---

## Installation

```bash
cd goonverse/backend
npm install
```

---

## Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development` |
| `PORT` | HTTP port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://goonverse_user:goonverse_secret_password@localhost:5432/goonverse?schema=public` |
| `JWT_ACCESS_SECRET` | Secret key for signing JWT access tokens | `(generate 32+ random characters)` |
| `JWT_REFRESH_SECRET` | Secret key for refresh token hashing | `(generate 32+ random characters)` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `30d` |
| `B2_ENDPOINT` | Backblaze B2 S3 endpoint URL | `https://s3.us-east-005.backblazeb2.com` |
| `B2_REGION` | Backblaze B2 region | `us-east-005` |
| `B2_BUCKET_NAME` | Private bucket name | `goonverse-vault` |
| `B2_APPLICATION_KEY_ID` | Backblaze Application Key ID (`keyID`) | *(supplied by developer)* |
| `B2_APPLICATION_KEY` | Backblaze Application Key (`applicationKey`) | *(supplied by developer)* |
| `MAX_IMAGE_SIZE_MB` | Maximum allowed image upload size | `15` |
| `CORS_ORIGIN` | Allowed client origin (optional in development) | `http://localhost:3000` |

> [!NOTE]
> Backblaze B2 credentials are **not** required to start the server or run unit/isolation tests. When unconfigured, storage endpoints return a helpful `503 Service Unavailable` message.

---

## Database Migrations & Client Generation

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name init

# In production
npx prisma migrate deploy
```

---

## Running the Application

```bash
# Development mode with hot-reload
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

Once running:
- **REST API**: `http://localhost:3000`
- **Swagger OpenAPI Documentation**: `http://localhost:3000/api/docs`

---

## Running Tests

Run the full automated test suite (including Unit, Multi-Tenant Isolation, Streak Engine, and Storage tests):

```bash
npm test
```
