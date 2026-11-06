# AccessMap: Technical Architecture Specification

## 1. High-Level System Architecture

AccessMap is engineered as a **Modular Monolith** with a decoupled Single Page Application (SPA) frontend, a containerized PostGIS spatial database, and a robust Java 21 / Spring Boot 3 backend service.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application (React 19 + TypeScript + Vite)"]
        UI["UI Layer: Tailwind CSS v4, Lucide Icons, Framer Motion"]
        MapLibre["Map Engine: MapLibre GL JS (Vector Tiles)"]
        ThreeCanvas["3D Layer: Three.js + React Three Fiber + Drei"]
        Fallback2D["Accessible 2D SVG Architectural Fallback"]
        ApiClient["HTTP API Client: Axios (Strictly Typed)"]
    end

    subgraph SecurityBoundary["Network & Security Boundary"]
        ReverseProxy["Nginx / Spring Security Filter Chain"]
        RateLimiter["Rate Limiting & CORS Filter"]
        JwtFilter["JWT Authentication & RBAC Filter"]
    end

    subgraph BackendService["Backend Application (Java 21 + Spring Boot 3)"]
        Controllers["REST Controllers: Places, Verifications, Disputes, Auth"]
        Services["Business Services: PlaceService, StalenessEngine, DisputeService"]
        Repositories["Spring Data JPA + Hibernate Spatial Repositories"]
    end

    subgraph DataTier["Spatial Data Engine (PostgreSQL 16 + PostGIS 3.4)"]
        UsersTable["users & user_roles"]
        PreferencesTable["user_preference_profiles"]
        PlacesTable["places (geom Point 4326)"]
        FeaturesTable["accessibility_features (4-state model)"]
        ReportsTable["accessibility_reports (audit trail)"]
        PhotosTable["report_photos"]
        DisputesTable["report_disputes"]
        SpatialIndex["GIST Spatial Index on geom"]
    end

    UI --> ApiClient
    MapLibre --> ApiClient
    ThreeCanvas -.->|Fallback on Reduced Motion or WebGL Failure| Fallback2D
    ApiClient -->|HTTP REST JSON| ReverseProxy
    ReverseProxy --> RateLimiter --> JwtFilter --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories -->|ST_DWithin Spatial Query| DataTier
```

---

## 2. Domain Model & The Four-State Verification State Machine

Accessibility features must never be represented as binary booleans. The domain model enforces four distinct states:

```mermaid
stateDiagram-v2
    [*] --> UNKNOWN: Place Added without Audit
    UNKNOWN --> AVAILABLE: Field Audit Confirms Feature Operational
    UNKNOWN --> NOT_AVAILABLE: Field Audit Confirms Obstruction / Absence
    AVAILABLE --> NOT_VERIFIED: Verification Age > 180 Days (Stale)
    NOT_AVAILABLE --> NOT_VERIFIED: Verification Age > 180 Days (Stale)
    NOT_VERIFIED --> AVAILABLE: Re-verification Confirms Feature
    NOT_VERIFIED --> NOT_AVAILABLE: Re-verification Confirms Obstruction
```

### State Definitions & Rules
1. **`AVAILABLE`**: Verified present and operational within the last 180 days.
2. **`NOT_AVAILABLE`**: Verified absent or non-functional.
3. **`UNKNOWN`**: No audit data recorded yet. **STRICT DOMAIN RULE: `UNKNOWN` is never treated or filtered as `NOT_AVAILABLE`.** It indicates lack of information.
4. **`NOT_VERIFIED`**: Reported by a user but awaiting verification or exceeding the 180-day freshness SLA (`UNVERIFIED_STALE`).

---

## 3. Database Design Plan (PostgreSQL 16 + PostGIS)

### Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ACCESSIBILITY_REPORTS : submits
    USERS ||--o{ USER_PREFERENCE_PROFILES : configures
    USERS ||--o{ REPORT_DISPUTES : flags
    PLACES ||--|{ ACCESSIBILITY_FEATURES : contains
    PLACES ||--o{ ACCESSIBILITY_REPORTS : receives
    ACCESSIBILITY_REPORTS ||--o{ REPORT_PHOTOS : includes
    ACCESSIBILITY_REPORTS ||--o{ REPORT_DISPUTES : disputed_by

    USERS {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role
        timestamp created_at
    }

    USER_PREFERENCE_PROFILES {
        uuid id PK
        uuid user_id FK
        boolean requires_step_free
        boolean requires_elevator
        boolean requires_ramp
        boolean requires_accessible_restroom
    }

    PLACES {
        uuid id PK
        varchar name
        varchar category
        text address
        geometry geom_point
        timestamp created_at
        timestamp updated_at
    }

    ACCESSIBILITY_FEATURES {
        uuid id PK
        uuid place_id FK
        varchar feature_type
        varchar status
        text notes
        timestamp last_verified_at
    }

    ACCESSIBILITY_REPORTS {
        uuid id PK
        uuid place_id FK
        uuid user_id FK
        varchar feature_type
        varchar reported_status
        text notes
        varchar source
        varchar verification_status
        timestamp submitted_at
        timestamp verified_at
    }

    REPORT_PHOTOS {
        uuid id PK
        uuid report_id FK
        varchar photo_url
        varchar caption
        boolean verified
        timestamp uploaded_at
    }

    REPORT_DISPUTES {
        uuid id PK
        uuid report_id FK
        uuid user_id FK
        text reason
        varchar dispute_status
        timestamp created_at
    }
```

### Spatial Query Optimization
Spatial searches execute against PostGIS using `ST_DWithin` with geography casts and an optimized GIST index:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE INDEX idx_places_geom ON places USING GIST (geom);

-- Example Nearby Places Query (sub-50ms execution)
SELECT id, name, category, address,
       ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters
FROM places
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radiusMeters)
ORDER BY distance_meters ASC;
```

---

## 4. Frontend Architecture & Progressive 3D Strategy

### 4.1 Component Hierarchy & Dual View
- **Dual View Synchronization:**
  - `MapView` (MapLibre GL JS vector tiles, custom accessibility pins).
  - `PlacesTableView` (Accessible HTML5 table with screen-reader live regions).
  - Both views consume the same reactive state hook (`usePlacesQuery`), ensuring immediate synchronization when panning or filtering.

### 4.2 Progressive 3D Architecture & 2D Fallback (Rule 10)
- **3D Isometric View:** React Three Fiber (`Canvas`) loads lightweight architectural floor cutaways with ramps, entrance doors, and elevator shafts.
- **Dynamic Fallback Pipeline:**
  1. Detects `window.matchMedia('(prefers-reduced-motion: reduce)')`.
  2. Detects WebGL context support or canvas crashes.
  3. Seamlessly swaps in a high-contrast 2D architectural SVG diagram with accessible callouts.

---

## 5. Backend Architecture (Clean Layered Modular Monolith)

### Layer Responsibilities
1. **Controller Layer (`com.accessmap.controller`):**
   - Handles HTTP routing, input validation (`@Valid`), and response formatting.
2. **Service Layer (`com.accessmap.service`):**
   - Enforces business logic:
     - Staleness calculation engine (audits > 180 days -> `NOT_VERIFIED`).
     - Aggregation of venue overall accessibility status.
     - Dispute queue workflow.
3. **Repository Layer (`com.accessmap.repository`):**
   - Spring Data JPA repositories with native PostGIS spatial queries.
4. **Security Filter Chain (`com.accessmap.config.security`):**
   - Stateless JWT authentication filter, CORS configuration, and method-level security (`@PreAuthorize`).

---

## 6. API Communication Standards

All REST endpoints follow strict JSON envelopes:

### Standard Success Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "City General Hospital",
    "category": "HOSPITAL",
    "features": [
      {
        "featureType": "STEP_FREE_ENTRANCE",
        "status": "AVAILABLE",
        "lastVerifiedAt": "2026-10-15T09:30:00Z"
      }
    ]
  },
  "timestamp": "2026-11-06T10:25:00Z"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid latitude or longitude coordinates",
    "details": ["latitude must be between -90 and 90"]
  },
  "timestamp": "2026-11-06T10:25:00Z"
}
```

---

## 7. Authentication, Authorization & Security Considerations

### 7.1 Role-Based Access Control (RBAC)
- `ROLE_USER`: Search places, view details, bookmark venues.
- `ROLE_CONTRIBUTOR`: Submit accessibility audits, upload photo proof, submit disputes.
- `ROLE_BUSINESS`: Manage claimed facility profile, submit official facility updates.
- `ROLE_ADMIN`: Review photo queue, resolve disputes, manage categories, inspect audit logs.

### 7.2 Security Defenses
- **Zero Secrets in Git:** Strict `.env` usage; checked against `.gitignore`.
- **SQL & Spatial Injection Prevention:** All spatial operations use parameterized Hibernate Spatial criteria.
- **Strict CORS & CSP:** Restrict origins to authorized frontend domains; deny framing (`X-Frame-Options: DENY`).
- **File Upload Protection:** Validate MIME types (JPEG, PNG, WebP), enforce 5MB maximum file size, and sanitize filenames.
