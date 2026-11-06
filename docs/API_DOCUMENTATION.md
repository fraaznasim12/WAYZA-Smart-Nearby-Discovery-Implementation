# AccessMap — REST API & Authentication Documentation

## 1. Overview & Authentication Model

AccessMap uses **stateless, token-based authentication** powered by Spring Security and JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).

- **Authentication Type:** Bearer Token
- **Header Format:** `Authorization: Bearer <access_token>`
- **Token Lifetime:** Configurable via `JWT_EXPIRATION_MS` (default: 3,600,000 ms = 1 hour)
- **Token Payload Claims:**
  - `sub`: User's normalized email address
  - `userId`: UUID string identifying the user
  - `role`: User's assigned RBAC role (e.g. `ROLE_USER`, `ROLE_ADMIN`)
  - `iat`: Timestamp of token issuance
  - `exp`: Timestamp of token expiration
- **Stateless Logout:** Because JWT authentication is stateless on the server, logout is performed on the client by deleting the stored token.

---

## 2. Role-Based Access Control (RBAC) Hierarchy

| Role | Description | Permissions |
|------|-------------|-------------|
| `ROLE_USER` | Standard registered consumer | Search places, view accessibility details, retrieve own profile (`GET /me`). |
| `ROLE_CONTRIBUTOR` | Community accessibility auditor | All `ROLE_USER` permissions + submit audits, upload photo evidence, submit disputes. |
| `ROLE_BUSINESS` / `ROLE_BUSINESS_OWNER` | Venue owner / manager | Manage claimed venue profiles, update verified accessibility features (`/api/v1/business/**`). |
| `ROLE_ADMIN` | Platform administrator | Full access to moderation queues, user administration, dispute resolution (`/api/v1/admin/**`). |

> **Security Rule:** Public registration (`POST /api/v1/auth/register`) strictly assigns `ROLE_USER`. Callers cannot specify or escalate roles. Role assignment to privileged roles is strictly managed by administrators.

---

## 3. Endpoints

### 3.1 Register User

- **Method:** `POST`
- **Path:** `/api/v1/auth/register`
- **Auth Required:** No (Public)
- **Status Codes:**
  - `201 Created`: Account created successfully
  - `400 Bad Request`: Validation failure or duplicate email

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "fullName": "Jane Doe"
}
```

#### Constraints
- `email`: Required, valid email format, normalized to lowercase and trimmed.
- `password`: Required, minimum 8 characters, maximum 72 characters (BCrypt limit).
- `fullName`: Required, maximum 100 characters.

#### Response Body (`201 Created`)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "role": "ROLE_USER"
  },
  "timestamp": "2026-11-06T13:30:00Z"
}
```

---

### 3.2 User Login

- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Auth Required:** No (Public)
- **Status Codes:**
  - `200 OK`: Authentication successful
  - `401 Unauthorized`: Invalid email or password

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "role": "ROLE_USER"
  },
  "timestamp": "2026-11-06T13:30:00Z"
}
```

---

### 3.3 Get Current User Profile

- **Method:** `GET`
- **Path:** `/api/v1/auth/me`
- **Auth Required:** Yes (`Bearer <token>`)
- **Status Codes:**
  - `200 OK`: Profile retrieved
  - `401 Unauthorized`: Missing, expired, or invalid token

#### Request Headers
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "user@example.com",
    "fullName": "Jane Doe",
    "role": "ROLE_USER",
    "memberSince": "2026-11-06T10:00:00Z"
  },
  "timestamp": "2026-11-06T13:30:00Z"
}
```

---

## 4. Standardized Error Response Format

All API errors return a uniform envelope with `success: false`:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation of error",
    "details": null
  },
  "timestamp": "2026-11-06T13:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | `400 Bad Request` | Input validation failed; `details` contains field errors. |
| `BAD_REQUEST` | `400 Bad Request` | Business rule violated (e.g. duplicate email). |
| `INVALID_CREDENTIALS` | `401 Unauthorized` | Invalid email address or password provided. |
| `UNAUTHORIZED` | `401 Unauthorized` | Missing, malformed, or missing Bearer token. |
| `TOKEN_EXPIRED` | `401 Unauthorized` | The provided JWT has passed its expiration time. |
| `INVALID_TOKEN` | `401 Unauthorized` | Signature verification failed or token is corrupted. |
| `ACCESS_DENIED` | `403 Forbidden` | Authenticated user lacks required role permissions. |
| `RESOURCE_NOT_FOUND` | `404 Not Found` | Requested entity does not exist. |
| `INTERNAL_SERVER_ERROR` | `500 Internal Server Error` | Unexpected server failure (stack traces suppressed). |

---

## 5. Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `accessmap` | Database name |
| `DB_USER` | `accessmap_user` | Database username |
| `DB_PASSWORD` | `accessmap_dev_password` | Database password |
| `JWT_SECRET` | *(Development placeholder)* | Minimum 256-bit secret key for HMAC-SHA256 signing |
| `JWT_EXPIRATION_MS` | `3600000` (1 hour) | Access token lifetime in milliseconds |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 days) | Refresh token lifetime in milliseconds |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed origin domains |
| `PORT` | `8080` | Spring Boot HTTP server port |

