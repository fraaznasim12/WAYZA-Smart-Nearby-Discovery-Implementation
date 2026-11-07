# AccessMap — REST API Specification

This document provides a comprehensive reference for the AccessMap REST API, version `v1`.

- **Base URL:** `http://localhost:8080/api/v1` (Local) or `https://<deployed-domain>/api/v1` (Production)
- **Content Type:** `application/json` (unless multipart upload)
- **Authentication:** `Authorization: Bearer <jwt-token>`
- **Standard Envelope:** Responses return JSON with standard status, data, and timestamp fields.

---

## 1. Authentication & Users

### 1.1 Register New Account
- **Endpoint:** `POST /api/v1/auth/register`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!",
    "fullName": "Jane Doe"
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "role": "ROLE_USER"
    },
    "timestamp": "2026-11-07T12:00:00Z"
  }
  ```
- **Errors:** `400 Bad Request` (Duplicate email, weak password, invalid fields).

### 1.2 User Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (`200 OK`):** Same authentication envelope containing JWT and user profile.
- **Errors:** `401 Unauthorized` (Invalid credentials).

### 1.3 Get Current User Profile
- **Endpoint:** `GET /api/v1/auth/me`
- **Auth:** Required (`Bearer <token>`)
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "user@example.com",
      "fullName": "Jane Doe",
      "role": "ROLE_USER",
      "avatarUrl": "https://storage.accessmap.org/avatars/user-9b1deb4d.png",
      "isEnabled": true
    }
  }
  ```

### 1.4 Upload User Profile Avatar
- **Endpoint:** `POST /api/v1/users/avatar`
- **Auth:** Required
- **Request:** `multipart/form-data` with form field `file` (JPEG, PNG, WebP up to 5MB).
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "avatarUrl": "https://storage.accessmap.org/avatars/avatar-9b1deb4d.png"
    }
  }
  ```

---

## 2. Places & Geospatial Discovery

### 2.1 Discover Nearby Places (PostGIS Spatial Radius)
- **Endpoint:** `GET /api/v1/places/nearby`
- **Auth:** Public
- **Query Parameters:**
  - `lat` (double, required): Latitude of search center (e.g. `28.6139`)
  - `lng` (double, required): Longitude of search center (e.g. `77.2090`)
  - `radiusMeters` (integer, optional, default: `5000`): Search radius in meters
  - `category` (string, optional): Filter by category (`HOSPITAL`, `COLLEGE`, `TRANSIT_STATION`, `RESTAURANT`, etc.)
  - `requiredFeatures` (comma-separated string, optional): e.g. `STEP_FREE_ENTRANCE,ELEVATOR`
  - `limit` (integer, default: `50`): Maximum results
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "City General Hospital",
        "category": "HOSPITAL",
        "address": "45 Healthcare Blvd",
        "city": "Metro City",
        "country": "India",
        "latitude": 28.6142,
        "longitude": 77.2095,
        "distanceMeters": 48.7,
        "overallAccessibilityScore": 92,
        "features": [
          {
            "featureType": "STEP_FREE_ENTRANCE",
            "status": "AVAILABLE",
            "lastVerifiedAt": "2026-10-15T10:00:00Z"
          },
          {
            "featureType": "RAMP",
            "status": "AVAILABLE",
            "lastVerifiedAt": "2026-10-15T10:00:00Z"
          },
          {
            "featureType": "ELEVATOR",
            "status": "AVAILABLE",
            "lastVerifiedAt": "2026-10-15T10:00:00Z"
          },
          {
            "featureType": "ACCESSIBLE_RESTROOM",
            "status": "AVAILABLE",
            "lastVerifiedAt": "2026-10-15T10:00:00Z"
          }
        ]
      }
    ]
  }
  ```

### 2.2 Get Place Details by ID
- **Endpoint:** `GET /api/v1/places/{id}`
- **Auth:** Public
- **Response (`200 OK`):** Full venue details including contact info, operating hours, and comprehensive 4-state feature list.
- **Errors:** `404 Not Found` if the place UUID does not exist.

### 2.3 Search Places by Keyword
- **Endpoint:** `GET /api/v1/places/search`
- **Auth:** Public
- **Query Parameters:** `q` (string, required), `city` (string, optional)
- **Response (`200 OK`):** List of matching places.

---

## 3. Community Reports & Verification

### 3.1 Submit Community Accessibility Report
- **Endpoint:** `POST /api/v1/places/{placeId}/reports`
- **Auth:** Required (`ROLE_USER` or higher)
- **Request Body:**
  ```json
  {
    "featureType": "ELEVATOR",
    "reportedStatus": "NOT_AVAILABLE",
    "notes": "Elevator in West Wing is under repair until next week.",
    "photoUrls": [
      "https://storage.accessmap.org/reports/evidence-123.jpg"
    ]
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "success": true,
    "data": {
      "reportId": "e3b0c442-98fc-1c14-9afb-f4c59620b78a",
      "placeId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "featureType": "ELEVATOR",
      "reportedStatus": "NOT_AVAILABLE",
      "verificationStatus": "PENDING",
      "submittedAt": "2026-11-07T14:30:00Z"
    }
  }
  ```

### 3.2 Peer-Verify or Upvote a Report
- **Endpoint:** `POST /api/v1/reports/{id}/verify`
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "confirmed": true,
    "notes": "Confirmed on-site today."
  }
  ```
- **Response (`200 OK`):** Updated report confirmation counts.

---

## 4. Community Disputes

### 4.1 Raise a Dispute on Inaccurate Data
- **Endpoint:** `POST /api/v1/disputes`
- **Auth:** Required
- **Request Body:**
  ```json
  {
    "reportId": "e3b0c442-98fc-1c14-9afb-f4c59620b78a",
    "category": "INCORRECT_INFORMATION",
    "reason": "Elevator has been fixed and tested by maintenance.",
    "photoUrls": []
  }
  ```
- **Response (`201 Created`):** Registered dispute in moderation queue.

---

## 5. Real-Time Notifications

### 5.1 Real-Time Server-Sent Events (SSE) Stream
- **Endpoint:** `GET /api/v1/notifications/stream`
- **Auth:** Required (`Bearer <token>` in header or query parameter)
- **Headers:** `Accept: text/event-stream`
- **Behavior:** Keeps connection open, streaming instant alerts when a report is verified, disputed, or status updated.

### 5.2 List User Notifications
- **Endpoint:** `GET /api/v1/notifications`
- **Auth:** Required
- **Response (`200 OK`):** List of alerts with unread counter.

---

## 6. Business Facility Management

### 6.1 Claim Venue Ownership
- **Endpoint:** `POST /api/v1/business/claims`
- **Auth:** Required (`ROLE_BUSINESS`)
- **Request Body:**
  ```json
  {
    "placeId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "businessRegistrationNumber": "BRN-998811",
    "verificationDocumentUrl": "https://storage.accessmap.org/docs/claim-proof.pdf"
  }
  ```
- **Response (`201 Created`):** Claim submitted for administrative review.

---

## 7. AI Accessibility Assistant

### 7.1 Natural Language Query
- **Endpoint:** `POST /api/v1/ai/chat`
- **Auth:** Public / Authenticated
- **Request Body:**
  ```json
  {
    "message": "Find wheelchair-accessible hospitals near Connaught Place with an elevator.",
    "currentLat": 28.6315,
    "currentLng": 77.2167
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "success": true,
    "data": {
      "reply": "I found 3 wheelchair-accessible hospitals nearby with verified elevators and step-free entrances...",
      "suggestedPlaces": [
        {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "name": "City General Hospital",
          "distanceMeters": 450
        }
      ]
    }
  }
  ```

---

## 8. Administrative Portal (`ROLE_ADMIN`)

All admin routes strictly require `ROLE_ADMIN`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard/overview` | Platform summary counts (places, users, open disputes, reports) |
| `GET` | `/api/v1/admin/dashboard/stats` | Detailed time-series metrics |
| `GET` | `/api/v1/admin/users` | Paginated user management table |
| `PUT` | `/api/v1/admin/users/{id}/role` | Update user RBAC role |
| `PUT` | `/api/v1/admin/users/{id}/status` | Enable or disable user access |
| `GET` | `/api/v1/admin/places` | Manage venue listings |
| `POST` | `/api/v1/admin/places` | Create new venue manually |
| `PUT` | `/api/v1/admin/places/{id}` | Update venue profile |
| `DELETE` | `/api/v1/admin/places/{id}` | Soft-delete venue |
| `GET` | `/api/v1/admin/reports` | Moderation queue of pending community reports |
| `PUT` | `/api/v1/admin/reports/{id}/status`| Approve (`VERIFIED`) or reject community report |
| `GET` | `/api/v1/admin/disputes` | Open disputes queue |
| `POST` | `/api/v1/admin/disputes/{id}/resolve`| Resolve or dismiss dispute with audit notes |
| `GET` | `/api/v1/admin/business-claims` | Venue ownership claims queue |
| `POST` | `/api/v1/admin/business-claims/{id}/review`| Approve or reject business venue claim |
| `GET` | `/api/v1/admin/audit-logs` | Immutable administrative audit log trail |

---

## 9. System Health & Probes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/actuator/health` | Spring Boot Actuator liveness and readiness probe |
| `GET` | `/actuator/info` | Application metadata and build version |

