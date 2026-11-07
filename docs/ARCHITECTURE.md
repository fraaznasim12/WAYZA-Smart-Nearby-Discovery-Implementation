# AccessMap — System Architecture Specification

## 1. System Overview

**AccessMap** is structured as a modern **Modular Monolith** pairing a high-performance **React 18 + TypeScript + Vite** Single Page Application (SPA) with an enterprise **Java 21 + Spring Boot 3** REST API, backed by **PostgreSQL 16 + PostGIS 3.4** and **S3-compatible object storage (Cloudflare R2 / MinIO)**.

```mermaid
flowchart TD
    subgraph Client["Client Tier (Vercel / Local)"]
        Browser["Desktop & Mobile Web Browsers"]
        GeoAPI["HTML5 Geolocation API (Device GPS)"]
        MapLibre["MapLibre GL JS (Vector Tile Maps)"]
        ThreeJS["Three.js / React Three Fiber (3D Visualizations)"]
    end

    subgraph CDN["Edge & Security Layer"]
        VercelCDN["Vercel Edge Network / Reverse Proxy"]
        CORS["CORS & Security Headers Filter"]
    end

    subgraph API["Backend Tier (Render Docker / Local Spring Boot)"]
        SpringSecurity["Spring Security 6 (Stateless JWT Filter)"]
        Controllers["Spring REST Controllers (v1 APIs)"]
        Services["Domain Services (Places, Reports, AI, Auth)"]
        StorageService["MediaStorageService (EXIF Stripping & S3/R2 Client)"]
        SSERegistry["SseNotificationRegistry (Real-time Server-Sent Events)"]
        OverpassClient["OpenStreetMap Overpass API Client"]
    end

    subgraph Persistence["Data & Storage Tier"]
        PostgreSQL[("PostgreSQL 16 + PostGIS 3.4 (Supabase)")]
        GISTIndex["GiST Spatial Index (Point 4326)"]
        ObjectStorage[("Cloudflare R2 / MinIO (S3 Object Storage)")]
    end

    subgraph External["External Cloud Services"]
        OSMAPI["OpenStreetMap Overpass API"]
        OpenAI["OpenAI Compatible LLM API (Optional)"]
    end

    Browser -->|HTTPS / WSS| VercelCDN
    GeoAPI -.->|GPS Coordinates| Browser
    VercelCDN -->|API Requests| CORS
    CORS --> SpringSecurity
    SpringSecurity --> Controllers
    Controllers --> Services
    Services --> StorageService
    Services --> SSERegistry
    Services --> OverpassClient
    Services -->|Hibernate Spatial JPA| PostgreSQL
    PostgreSQL --- GISTIndex
    StorageService -->|S3 REST API| ObjectStorage
    OverpassClient -.->|Spatial Sync| OSMAPI
    Services -.->|LLM Search| OpenAI
```

---

## 2. Frontend Module Structure

The client application is built with React 18, TypeScript, Tailwind CSS v4, and Vite:

```text
frontend/src/
├── components/
│   ├── 3d/                     # Three.js / React Three Fiber architectural cutaways
│   │   ├── CityHeroScene.tsx            # Isometric 3D landing hero scene
│   │   └── AccessibilityFeature3D.tsx   # Interactive 3D ramp/elevator model with 2D SVG fallback
│   ├── accessibility/          # Accessibility profiles and observation submission modals
│   ├── common/                 # Reusable UI primitives (StatusBadge, ProtectedRoute)
│   ├── dispute/                # Community dispute modals and evidence attachment
│   ├── layout/                 # Shell layouts (Navbar, Footer, PageLayout)
│   ├── map/                    # MapLibre GL JS map instance, layer controls, pins
│   ├── notifications/          # Real-time SSE notification bell and dropdown list
│   ├── profile/                # Avatar photo cropper, zoom controls, and uploader
│   └── report/                 # Community audit modals, camera capture preview
├── context/
│   └── AuthContext.tsx         # Global JWT authentication and user profile state
├── hooks/
│   └── usePrefersReducedMotion.ts  # Detects OS accessibility motion preferences
├── pages/
│   ├── admin/                  # Administrative management pages (Places, Reports, Disputes, Users, Logs)
│   ├── ExplorePage.tsx         # Unified interactive spatial map, nearby places, and category filters
│   ├── HomePage.tsx            # High-contrast hero, features overview, 4-state explainer
│   ├── DashboardPage.tsx       # User profile, mobility preferences, activity history
│   ├── BusinessPage.tsx        # Business owner venue claiming and verified profile management
│   ├── AiAssistantPage.tsx     # Natural language accessibility assistant
│   └── NotificationsPage.tsx   # Notification center and notification settings
├── services/                   # Typed Axios API clients matching backend endpoints
└── types/                      # TypeScript domain models, enums, and API contracts
```

---

## 3. Backend Module Structure

The backend is built as a clean Modular Monolith in Java 21 with Spring Boot 3.4.2:

```text
backend/src/main/java/com/accessmap/
├── ai/                         # Natural language assistant client (OpenAI-compatible & Rule-based fallback)
├── common/                     # Health check controllers and cross-cutting response envelopes
├── config/                     # Spring Security, JWT filters, HikariCP, and CORS configuration
├── controller/                 # 21 REST API controllers (Places, Auth, Reports, Disputes, Admin, etc.)
├── dto/                        # Request/Response Data Transfer Objects with Bean Validation
├── entity/                     # 31 JPA Entities mapped to PostgreSQL tables
├── exception/                  # Global exception handler (@ControllerAdvice) and custom domain exceptions
├── provider/                   # OpenStreetMap Overpass spatial provider and DTOs
├── repository/                 # Spring Data JPA repositories with PostGIS spatial queries
└── service/                    # Core business logic (PlaceService, MediaStorageService, SSERegistry, etc.)
```

---

## 4. Key Runtime Data Flows

### 4.1 Authentication Flow (Stateless JWT)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Auditor
    participant Browser as Web Browser (React)
    participant AuthCtrl as AuthController
    participant AuthSvc as AuthService
    participant DB as PostgreSQL
    participant SecFilter as JwtAuthenticationFilter

    User->>Browser: Enters credentials (email/password)
    Browser->>AuthCtrl: POST /api/v1/auth/login
    AuthCtrl->>AuthSvc: authenticate(email, rawPassword)
    AuthSvc->>DB: findByEmail(normalizedEmail)
    DB-->>AuthSvc: User entity (with BCrypt hash)
    AuthSvc->>AuthSvc: BCrypt.checkpw(rawPassword, hash)
    AuthSvc->>AuthSvc: Generate JWT (userId, role, 1hr exp)
    AuthSvc-->>AuthCtrl: AuthResponse (JWT + UserDTO)
    AuthCtrl-->>Browser: 200 OK + JWT
    Browser->>Browser: Store token in secure localStorage

    Note over Browser,SecFilter: Subsequent Authenticated Requests
    Browser->>SecFilter: GET /api/v1/users/me (Header: Bearer <JWT>)
    SecFilter->>SecFilter: Validate JWT signature & expiration
    SecFilter->>SecFilter: Populate SecurityContextHolder (UserPrincipal)
    SecFilter->>Controllers: Dispatch to protected endpoint
```

---

### 4.2 Nearby-Place Spatial Discovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Page as ExplorePage (React)
    participant Map as MapLibre GL JS
    participant PlaceSvc as PlaceService
    participant PostGIS as PostGIS (PostgreSQL)

    User->>Page: Selects radius (e.g. 5 km) & category (e.g. HOSPITAL)
    Page->>PlaceSvc: GET /api/v1/places/nearby?lat=...&lng=...&radiusMeters=5000&category=HOSPITAL
    PlaceSvc->>PostGIS: ST_DWithin(geom::geography, Point(:lng, :lat), 5000)
    Note over PostGIS: Evaluates spatial GiST index on geom column (sub-50ms)
    PostGIS-->>PlaceSvc: List of matching Places + calculated distance
    PlaceSvc->>PlaceSvc: Hydrate 4-State Accessibility Features per Place
    PlaceSvc-->>Page: 200 OK + List<PlaceResponseDto>
    Page->>Map: Update vector pins & fit viewport bounds
    Page->>Page: Render accessible list view with high-contrast status badges
```

---

### 4.3 Real-Time Device Phone Location Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Mobile / Desktop User
    participant UI as ExplorePage ("Use My Current Location")
    participant Geo as navigator.geolocation (Browser API)
    participant Map as MapLibre GL Engine
    participant API as PlaceController (/places/nearby)

    User->>UI: Clicks "Use My Current Location"
    UI->>UI: Set locationLoading = true
    UI->>Geo: getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    alt User Grants Permission
        Geo-->>UI: Coordinates (latitude, longitude, accuracyMeters)
        UI->>Map: flyTo([longitude, latitude], zoom: 15)
        UI->>Map: Render pulsing blue device marker with accuracy circle
        UI->>API: GET /api/v1/places/nearby?lat=...&lng=...&radiusMeters=3000
        API-->>UI: Return nearby accessible places
        UI->>UI: Set locationLoading = false, display success notice
    else Permission Denied or Timeout
        Geo-->>UI: GeolocationPositionError (code 1 / 3)
        UI->>UI: Display user-friendly notification ("Location permission denied")
        UI->>UI: Retain current map center and existing venue list
    end
```

---

## 5. Security & Boundary Architecture

1. **Stateless Backend:** No HTTP session state is persisted in memory; horizontal scaling across multiple instances requires no sticky sessions.
2. **Strict RBAC:** Role hierarchy is validated at the controller and method level via Spring Security `@PreAuthorize("hasRole('ADMIN')")`.
3. **Database Security:**
   - Password hashes stored strictly as BCrypt (`strength = 12`).
   - SQL queries are executed via JPA parameterized queries preventing SQL injection.
   - PostGIS queries use native types and validated numeric coordinates.
4. **Media Storage Security:**
   - All uploaded photos are transcoded and stripped of EXIF metadata before saving to object storage.
   - Files are stored in private Cloudflare R2 / MinIO buckets with short-lived presigned download URLs or public CDN caching.
5. **Privacy Guard:** Device GPS coordinates are processed exclusively in-memory for proximity query dispatch; user physical locations are never permanently persisted.
