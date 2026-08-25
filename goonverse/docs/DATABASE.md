# Goonverse Database Architecture & Schema

## Entity Relationship Overview

The database uses PostgreSQL with Prisma ORM. Strict referential integrity and indexes are configured for multi-tenant data isolation per user.

### Models

1. **`users`**
   - `id` (UUID, Primary Key)
   - `email` (VarChar 255, Unique)
   - `username` (VarChar 50, Unique)
   - `password_hash` (VarChar 255, Argon2id)
   - `role` (Enum: `USER`, `MODERATOR`, `SUPER_ADMIN`)
   - `age_verified` (Boolean, mandatory `true` for 18+ compliance)
   - `created_at` (Timestamptz)
   - `updated_at` (Timestamptz)
   - `deleted_at` (Timestamptz, nullable for soft deletes)

2. **`people`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `name` (VarChar 100)
   - `notes` (Text, optional)
   - `created_at` (Timestamptz)
   - `updated_at` (Timestamptz)
   - `deleted_at` (Timestamptz, nullable for soft deletes)
   - *Index*: `[user_id, deleted_at]`

3. **`images`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `person_id` (UUID, Foreign Key -> `people.id` ON DELETE SET NULL)
   - `storage_key` (VarChar 500, Unique, private S3 key)
   - `original_filename` (VarChar 255)
   - `mime_type` (VarChar 100)
   - `file_size` (Int, bytes)
   - `created_at` (Timestamptz)
   - `deleted_at` (Timestamptz, nullable for soft deletes)
   - *Indexes*: `[user_id, deleted_at]`, `[person_id]`

4. **`activities`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `person_id` (UUID, Foreign Key -> `people.id` ON DELETE SET NULL)
   - `image_id` (UUID, Foreign Key -> `images.id` ON DELETE SET NULL)
   - `occurred_at` (Timestamptz)
   - `notes` (Text, optional)
   - `created_at` (Timestamptz)
   - *Indexes*: `[user_id, occurred_at]`, `[person_id]`, `[image_id]`

5. **`tags`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `name` (VarChar 50)
   - *Unique Constraint*: `[user_id, name]`

6. **`image_tags`**
   - `image_id` (UUID, Foreign Key -> `images.id` ON DELETE CASCADE)
   - `tag_id` (UUID, Foreign Key -> `tags.id` ON DELETE CASCADE)
   - *Primary Key*: `[image_id, tag_id]`

7. **`refresh_tokens`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `token_hash` (VarChar 255, SHA-256)
   - `expires_at` (Timestamptz)
   - `revoked_at` (Timestamptz, nullable)
   - `created_at` (Timestamptz)
   - *Index*: `[user_id, revoked_at]`

8. **`admin_audit_logs`**
   - `id` (UUID, Primary Key)
   - `admin_user_id` (UUID, Foreign Key -> `users.id` ON DELETE CASCADE)
   - `action` (VarChar 100)
   - `target_type` (VarChar 100)
   - `target_id` (VarChar 255, optional)
   - `metadata` (JSONB, optional)
   - `created_at` (Timestamptz)
   - *Indexes*: `[admin_user_id, created_at]`, `[target_type, target_id]`
