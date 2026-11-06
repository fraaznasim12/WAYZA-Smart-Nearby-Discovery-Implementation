# AccessMap: Project Rules & Engineering Standards

## 1. Project Philosophy & Core Values
**AccessMap** is an enterprise-grade, full-stack software engineering project designed to eliminate accessibility uncertainty in real-world spaces. Because mobility, safety, and dignity depend on accurate accessibility data, every line of code must adhere to uncompromising engineering discipline, strict security, and accessible user experience standards.

As a solo developer project, maintainability, architectural clarity, and exhaustive automated testing take absolute precedence over premature optimization or needless complexity.

---

## 2. Directory & Folder Organization Rules

The project is structured as a **Modular Monolith** with absolute physical separation of responsibilities:

```text
AccessMap/
├── frontend/               # Single Page Application (SPA) client
│   ├── public/             # Static public assets (icons, manifest, fallback SVGs)
│   └── src/
│       ├── assets/         # Bundled styles, images, and fonts
│       ├── components/     # UI components (common, layout, 3d, map, forms)
│       ├── hooks/          # Custom reusable React hooks
│       ├── pages/          # Top-level route pages (Landing, Discovery, Dashboards)
│       ├── services/       # Typed HTTP API client calls via Axios
│       ├── types/          # Domain TypeScript interfaces and enums
│       ├── utils/          # Pure utility functions and formatters
│       ├── App.tsx         # Route configuration and top-level providers
│       └── main.tsx        # React entry point
├── backend/                # Java 21 + Spring Boot 3 REST API server
│   ├── src/main/java/com/accessmap/
│   │   ├── config/         # Security, CORS, OpenAPI, and PostGIS configuration
│   │   ├── controller/     # REST API Controllers (HTTP endpoints)
│   │   ├── dto/            # Request / Response Data Transfer Objects
│   │   ├── entity/         # JPA Domain Entities & Spatial mappings
│   │   ├── exception/      # Global exception handlers and custom error codes
│   │   ├── repository/     # Spring Data JPA + PostGIS spatial repositories
│   │   └── service/        # Business logic services and validation engines
│   └── src/main/resources/
│       ├── db/migration/   # Versioned Flyway/SQL migration scripts
│       └── application.yml # Externalized configuration
├── docs/                   # Architectural blueprints, SRS, rules, and roadmaps
├── docker-compose.yml      # Local containerized infrastructure (PostGIS 16)
├── README.md               # Repository orientation and documentation hub
└── .gitignore              # Repository git ignore configuration
```

### Isolation Constraints
1. **Frontend-Backend Independence:** The `frontend/` directory must never import or reference files from `backend/`, and vice versa. Communication occurs exclusively over typed REST JSON endpoints.
2. **No Project Leaks:** Never reference, import, or place files related to other projects (such as `AgroAI-main`).

---

## 3. Naming Conventions

### Backend (Java 21 / Spring Boot)
- **Packages:** All lowercase, reverse domain notation (`com.accessmap.service`, `com.accessmap.entity`).
- **Classes & Interfaces:** `UpperCamelCase` (`PlaceService`, `AccessibilityFeatureRepository`, `SecurityConfig`).
- **Methods & Variables:** `lowerCamelCase` (`findPlacesWithinRadius`, `lastVerifiedAt`).
- **Constants & Enums:** `UPPER_SNAKE_CASE` (`MAX_SEARCH_RADIUS_METERS`, `FeatureStatus.NOT_AVAILABLE`).
- **DTOs:** Suffix clearly by role (`PlaceCreateRequest`, `PlaceDetailResponse`, `VerificationReportDto`).

### Frontend (React / TypeScript)
- **Components & Layouts:** `UpperCamelCase` (`StatusBadge.tsx`, `PlaceDetailsModal.tsx`, `Hero3DCanvas.tsx`).
- **Hooks:** Prefix with `use` in `lowerCamelCase` (`useAccessibilityPreferences.ts`, `useGeolocation.ts`).
- **Types & Interfaces:** `UpperCamelCase` (`Place`, `AccessibilityFeature`, `UserPreferenceProfile`).
- **Utility Files & Helpers:** `kebab-case` or `lowerCamelCase` (`format-distance.ts`, `dateUtils.ts`).

### Database (PostgreSQL / PostGIS)
- **Tables:** Plural `snake_case` (`places`, `accessibility_features`, `verification_logs`, `report_disputes`).
- **Columns:** Singular `snake_case` (`id`, `place_id`, `feature_type`, `created_at`).
- **Foreign Keys:** `{singular_table_name}_id` (`place_id`, `user_id`).
- **Spatial Geometry Columns:** Named `geom` using EPSG:4326 (`GEOMETRY(Point, 4326)`).
- **Spatial Indexes:** Suffix with `_geom_idx` (`idx_places_geom`).

### REST API Endpoints
- **Resource URIs:** Plural nouns, lowercase, kebab-case (`/api/v1/places`, `/api/v1/verification-reports`).
- **Hierarchy:** Reflect parent-child relationships where applicable (`/api/v1/places/{placeId}/features`).
- **Actions via HTTP Verbs:**
  - `GET`: Retrieve resource(s).
  - `POST`: Create a new resource or initiate an action.
  - `PUT`: Complete update / replacement of a resource.
  - `PATCH`: Partial update of a resource.
  - `DELETE`: Remove a resource.

---

## 4. Coding Standards & Clean Architecture

1. **Explicit Strong Typing:**
   - Java: Utilize modern Java 21 features (records for immutable DTOs, sealed interfaces where appropriate, strong null-safety checks).
   - TypeScript: Strict mode enabled (`"strict": true`). Never use the `any` escape hatch; define comprehensive domain interfaces for all API payloads.
2. **Layered Monolith Architecture:**
   - Controllers handle HTTP routing, request deserialization, and HTTP response mapping.
   - Services contain pure business rules, transaction boundaries (`@Transactional`), and staleness calculations.
   - Repositories handle database interactions and PostGIS spatial queries.
3. **Immutability & Pure Functions:**
   - Prefer immutable collections and read-only data structures where feasible.
   - Separate state mutation from pure presentation logic.

---

## 5. Security & Data Integrity Requirements

1. **Zero Secrets in Source Control:**
   - Database credentials, JWT secrets, and external API keys must NEVER be committed to Git.
   - Always supply `.env.example` templates and load actual runtime credentials from environment variables.
2. **Stateless Authentication & Role-Based Access Control (RBAC):**
   - Authentication is powered by signed, short-lived JSON Web Tokens (JWT) with secure refresh token rotation.
   - Roles strictly enforced:
     - `ROLE_USER`: Standard consumer; search places, view details, bookmark favorites.
     - `ROLE_CONTRIBUTOR`: Submit accessibility audits, upload photo evidence, submit disputes.
     - `ROLE_BUSINESS`: Manage and verify claimed facilities, respond to audits.
     - `ROLE_ADMIN`: Global moderation, dispute resolution, user management, audit logs.
3. **Defensive Input Validation:**
   - Backend: Jakarta Bean Validation (`@NotNull`, `@Size`, `@DecimalMin`, `@Valid`) on all incoming request DTOs.
   - Frontend: Form schemas validated using client-side validation before submission.
4. **SQL & Spatial Injection Prevention:**
   - All database queries must use Spring Data JPA parameter binding or prepared statements with Hibernate Spatial. Never concatenate strings into raw SQL.
5. **CORS & HTTP Security Headers:**
   - Configure restrictive CORS whitelisting only trusted frontend origins.
   - Enforce Content Security Policy (CSP), X-Content-Type-Options (`nosniff`), and X-Frame-Options (`DENY`).

---

## 6. Accessibility (a11y) & UX Mandates

1. **WCAG 2.1 AA Compliance:**
   - All text and interactive components must satisfy minimum contrast ratios (4.5:1 for body copy, 3:1 for large text and UI boundaries).
2. **The 4-State Verification Model (Non-Negotiable):**
   - The system tracks four explicit accessibility states:
     - `AVAILABLE`
     - `NOT_AVAILABLE`
     - `UNKNOWN`
     - `NOT_VERIFIED`
   - **CRITICAL DATA RULE: `UNKNOWN` MUST NEVER BE TREATED AS `NOT_AVAILABLE`.** An unknown status means lack of audit data, not an absent feature.
3. **No Color-Only Indicators:**
   - Every status badge, map marker, or feature indicator must pair distinct colors with high-contrast text and recognizable icon glyphs (`CheckCircle2`, `XCircle`, `HelpCircle`, `ClockAlert`).
4. **Keyboard Operability:**
   - Every interactive control must be reachable and operable using `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape`.
   - Never suppress `:focus-visible` styling without providing an enhanced, visible focus ring.
5. **Progressive 3D Enhancement & Reduced Motion:**
   - Three.js / React Three Fiber visualizations are strictly progressive enhancements.
   - If the user's OS specifies `prefers-reduced-motion: reduce`, all 3D scene rotations, animations, and camera tweens must be paused or replaced with an accessible, high-contrast 2D SVG architectural diagram.
   - If WebGL initialization fails or context is lost, the 2D diagram must render seamlessly as a fallback.

---

## 7. Solo Developer Workflow & Verification Rules

1. **Step-by-Step Milestone Progression:**
   - Never generate large batches of unverified code across multiple tiers at once.
   - Work strictly within the current milestone, verify outcomes with real command output, and pause for user approval before moving forward.
2. **Honest Verification (Never Invent Results):**
   - Execute real terminal commands (linter, compiler, test runner, container health probes).
   - Inspect and report actual exit codes and command outputs. Never fabricate green checkboxes or fake passing test outputs.
3. **Preserve Workspace Integrity:**
   - Never overwrite or modify files in `AgroAI-main`.
   - Inspect files before modifying and explain technical choices in beginner-friendly, accessible terminology.
