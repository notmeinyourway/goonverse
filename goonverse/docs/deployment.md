# Goonverse — Production Deployment Guide

## 1. Production Prerequisites
- Managed PostgreSQL 15+ instance (e.g. AWS RDS, Supabase, Neon) with SSL required.
- Backblaze B2 bucket configured as **PRIVATE** with an Application Key restricted to that bucket.
- Node.js 20+ runtime environment (Docker container, ECS, or Kubernetes).

## 2. Environment Variables Checklist

### Backend (`.env`)
```bash
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:securepass@db-host:5432/goonverse?sslmode=require"

# JWT
JWT_ACCESS_SECRET="generate-64-byte-random-hex-string"
JWT_REFRESH_SECRET="generate-64-byte-random-hex-string"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="30d"

# Backblaze B2 Storage
B2_ENDPOINT="https://s3.us-west-004.backblazeb2.com"
B2_REGION="us-west-004"
B2_BUCKET_NAME="goonverse-vault-prod"
B2_KEY_ID="your-b2-app-key-id"
B2_APPLICATION_KEY="your-b2-app-key"
```

### Admin Dashboard (`.env.local` or container env)
```bash
NEXT_PUBLIC_API_URL="https://api.goonverse.app"
```

## 3. Docker Deployment
```bash
# Build backend image
docker build -t goonverse-backend:latest ./backend

# Build admin dashboard image
docker build -t goonverse-admin:latest ./admin
```

## 4. Health Checks & Verification
- `GET /health` returns `{ "status": "ok", "timestamp": "..." }`
- Database migration runner: `npx prisma migrate deploy`
