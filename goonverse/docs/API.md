# Goonverse API Documentation (Phase 1)

## Base URL
- Development: `http://localhost:3000` (or `http://10.0.2.2:3000` from Android Emulator)

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

### 1. Register User (18+)
- **Endpoint**: `POST /auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "StrongPassword123!",
  "age_verified": true,
  "terms_accepted": true
}
```
- **Response**: `201 Created`
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "48-byte-hex-string",
  "expiresIn": 900,
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "username": "user123",
    "role": "USER",
    "age_verified": true,
    "created_at": "2026-08-25T10:00:00.000Z",
    "updated_at": "2026-08-25T10:00:00.000Z"
  }
}
```

---

### 2. Login
- **Endpoint**: `POST /auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "identifier": "user@example.com",
  "password": "StrongPassword123!"
}
```
- **Response**: `200 OK` (Same payload structure as register)

---

### 3. Refresh Session
- **Endpoint**: `POST /auth/refresh`
- **Access**: Public
- **Request Body**:
```json
{
  "refreshToken": "48-byte-hex-string"
}
```
- **Response**: `200 OK` (Rotated new `accessToken` and `refreshToken`)

---

### 4. Logout
- **Endpoint**: `POST /auth/logout`
- **Access**: Authenticated (JWT)
- **Request Body** (optional):
```json
{
  "refreshToken": "48-byte-hex-string"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. Get Current User Profile
- **Endpoint**: `GET /users/me`
- **Access**: Authenticated (JWT)
- **Response**: `200 OK`
```json
{
  "id": "uuid-v4",
  "email": "user@example.com",
  "username": "user123",
  "role": "USER",
  "age_verified": true,
  "created_at": "2026-08-25T10:00:00.000Z",
  "updated_at": "2026-08-25T10:00:00.000Z",
  "counts": {
    "people": 5,
    "images": 12,
    "activities": 45
  }
}
```

---

### 6. Update User Profile
- **Endpoint**: `PATCH /users/me`
- **Access**: Authenticated (JWT)
- **Request Body**:
```json
{
  "username": "new_username"
}
```
- **Response**: `200 OK`

---

### 7. Change Password
- **Endpoint**: `PATCH /users/me/password`
- **Access**: Authenticated (JWT)
- **Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```
- **Response**: `200 OK`

---

### 8. Delete Account (Soft Delete & Session Invalidation)
- **Endpoint**: `DELETE /users/me`
- **Access**: Authenticated (JWT)
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Account and associated data deleted successfully"
}
```
