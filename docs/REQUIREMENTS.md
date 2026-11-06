# AccessMap: Software Requirements Specification (SRS)

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Navigating the physical world presents immense challenges for individuals with disabilities, reduced mobility, wheelchair users, elderly citizens, and parents with strollers. Real-world accessibility infrastructure—such as wheelchair ramps, level step-free entrances, operational elevators, and accessible washrooms—is frequently unrecorded, out of service, or inaccurately documented.

Existing map directories and search engines treat accessibility as an afterthought, often reducing it to a simplistic binary checkbox (`wheelchair_accessible: true/false`). This causes frequent frustration, wasted journeys, and safety hazards when a "wheelchair accessible" venue turns out to have steep steps, locked gates, or a broken elevator.

### 1.2 The AccessMap Solution
**AccessMap** is an intelligent accessibility discovery and verification platform. It couples interactive spatial mapping with a rigorous **Four-State Verification Model**, community-driven field audits, photo verification, and intuitive 3D architectural cutaways to deliver accurate, dependable, and real-time physical accessibility intelligence.

---

## 2. Target User Personas

| Persona | Needs & Goals | Core Features Utilized |
| :--- | :--- | :--- |
| **Mobility Device Users (Wheelchair, Scooter)** | Needs guaranteed step-free paths, ramp slope clarity, and operating elevator status before traveling. | Map discovery, 4-state badges, 3D building cutaway, proximity search. |
| **Elderly & Semi-Ambulatory Citizens** | Needs to avoid excessive stairs, find handrails, rest seating, and nearby accessible parking. | Accessibility preference profiles, multi-feature filters, detailed venue views. |
| **Parents with Strollers** | Needs wide entrances, working lifts, and level access in public transit and malls. | Category search (transit, parks, malls), community verification status. |
| **Community Contributors & Advocates** | Desires to audit local venues, upload photo proof, and update stale accessibility data. | Community report submission, photo evidence upload, dispute reporting. |
| **Facility & Business Managers** | Wants to claim their venue profile, showcase accessibility investments, and respond to audits. | Business dashboard, verified official response, facility profile updates. |
| **System Administrators** | Needs to monitor community contributions, resolve disputed claims, and safeguard data integrity. | Admin moderation dashboard, audit trail, user role management. |

---

## 3. Functional Requirements (10 Core Modules)

### Module 1: User Authentication & Profiles
- **FR-1.1:** System shall support user registration, login, and token refresh via stateless JWT authentication.
- **FR-1.2:** System shall support Role-Based Access Control (RBAC): `USER`, `CONTRIBUTOR`, `BUSINESS`, `ADMIN`.
- **FR-1.3:** Users can view and manage their personal profile, contribution history, and bookmarked venues.

### Module 2: Accessibility Preference Profiles
- **FR-2.1:** Users can configure individual mobility preference presets (e.g., "Full Wheelchair Access", "Walking Aid / No Steep Stairs", "Stroller Friendly").
- **FR-2.2:** The system shall automatically tailor search results and highlight venues matching the active preference profile.
- **FR-2.3:** Preference profiles shall persist across sessions for authenticated users, with guest session fallback.

### Module 3: Interactive Map & Place Discovery
- **FR-3.1:** High-performance vector tile map powered by **MapLibre GL JS** showing customizable accessibility pins.
- **FR-3.2:** Support GPS auto-detection and address geocoding to center the map on the user's current location.
- **FR-3.3:** Viewport synchronization: Panning or zooming dynamically queries and refreshes the places list.
- **FR-3.4:** Dual View Mode: Accessible toggle between interactive map view and a structured, screen-reader-friendly table/list view.

### Module 4: Accessibility Filters
- **FR-4.1:** Multi-criteria filtering by venue category (`HOSPITAL`, `COLLEGE`, `TRANSIT_STATION`, `RESTAURANT`, `PUBLIC_OFFICE`, `SHOPPING_MALL`).
- **FR-4.2:** Proximity radius filter (e.g., 500m, 1km, 5km, 10km) backed by PostGIS spatial index calculations.
- **FR-4.3:** Granular feature filter: Filter places requiring specific features in `AVAILABLE` state (e.g., Step-Free Entrance AND Elevator).

### Module 5: Place Details & Feature Intelligence (The 4-State Model)
- **FR-5.1:** Detailed venue view displaying name, category, complete address, contact details, and opening hours.
- **FR-5.2:** Comprehensive audit breakdown of monitored features:
  - `STEP_FREE_ENTRANCE`
  - `RAMP`
  - `ELEVATOR`
  - `ACCESSIBLE_RESTROOM`
  - `ACCESSIBLE_PARKING`
- **FR-5.3 (CRITICAL DATA RULE):** Every feature must display one of four verified states:
  1. **`AVAILABLE`**: In-person verified present and operational within the last 180 days.
  2. **`NOT_AVAILABLE`**: In-person verified absent or obstructed.
  3. **`UNKNOWN`**: No audit data exists. **UNKNOWN must NEVER be treated as NOT_AVAILABLE.**
  4. **`NOT_VERIFIED`**: Reported by a user but awaiting verification or older than 180 days (`UNVERIFIED_STALE`).
- **FR-5.4:** 3D Spatial Visualizer: Purposeful Three.js isometric building cutaway displaying ingress ramps and elevators, with an automated high-contrast 2D SVG fallback.

### Module 6: Community-Based Accessibility Reports
- **FR-6.1:** Any authenticated contributor can submit an accessibility status update for any venue feature.
- **FR-6.2:** Every report MUST capture:
  - Source identifier (User ID / Contributor ID / Official Business).
  - Submission timestamp.
  - Verification status (`PENDING`, `VERIFIED`, `REJECTED`, `STALE`).
  - Last verified date.
  - Descriptive notes on conditions (e.g., "Ramp handrail loose", "Automatic door operational").
- **FR-6.3:** Staleness Engine: Automated backend calculation flagging verifications older than 180 days as `NOT_VERIFIED` / `UNVERIFIED_STALE`.

### Module 7: Photo Evidence & Verification
- **FR-7.1:** Contributors can attach photographic evidence to audit reports (e.g., photos of ramp slope, bathroom grab bars).
- **FR-7.2:** Secure file upload pipeline: MIME type validation, file size limits (max 5MB), and EXIF metadata extraction (timestamp and GPS match verification).

### Module 8: Report Disputes & Moderation
- **FR-8.1:** Users can flag or dispute inaccurate reports (e.g., "Ramp was removed during renovation").
- **FR-8.2:** Disputes enter an administrative review queue with priority scoring based on user reputation.
- **FR-8.3:** Disputed features display a cautionary indicator until resolved by moderation.

### Module 9: Business & Facility Dashboard
- **FR-9.1:** Venue owners or institutional managers can claim their facility profile through administrative verification.
- **FR-9.2:** Business managers can submit official accessibility updates, post scheduled maintenance alerts (e.g., "Elevator modernization in progress until Nov 15"), and respond to community audit reports.

### Module 10: Admin Dashboard
- **FR-10.1:** Centralized management of places, categories, and feature definitions.
- **FR-10.2:** Moderation queue for reviewing pending photo evidence, resolving disputes, and sanctioning malicious reports.
- **FR-10.3:** System telemetry: Total audited places, verified feature percentages, active contributors, and spatial query metrics.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Accessibility Standards (WCAG 2.1 AA)
- Contrast ratio ≥ 4.5:1 for normal text and 3:1 for graphical UI elements and borders.
- 100% keyboard accessibility: All interactive elements reachable and operable via standard keyboard sequences.
- Screen reader semantic compliance: Valid ARIA landmarks, roles, live regions for map updates, and descriptive alt text.
- Reduced motion: Strict adherence to OS `prefers-reduced-motion: reduce`.

### 4.2 Performance & Scalability
- PostGIS spatial proximity searches (`ST_DWithin`) must execute in under 50ms at scale using GIST spatial indexes.
- Frontend initial bundle size optimized via code-splitting for 3D and mapping modules.
- REST API response time < 150ms for standard CRUD and place queries.

### 4.3 Security & Reliability
- Zero secrets committed to source repository.
- Parameterized SQL / Hibernate Spatial queries to prevent spatial or SQL injection.
- Restrictive Cross-Origin Resource Sharing (CORS) and standard HTTP security headers.
- Graceful degradation: Service continues operating in 2D mode if WebGL fails.

---

## 5. Scope Boundaries

### 5.1 MVP Scope (Milestones 0 to 7)
- Core database schema with PostGIS spatial point support.
- Spring Boot 3 modular backend with places, features, and verification REST APIs.
- React 19 + TypeScript frontend featuring the landing page, interactive map discovery, dual table view, and 3D architectural cutaway with 2D fallback.
- The 4-state feature model fully integrated across frontend and backend.
- Community report submission and staleness calculation engine.

### 5.2 Future Enhancements (Post-MVP)
- Turn-by-turn wheelchair-accessible routing with sidewalk curb-cut detection.
- Indoor beacon/QR navigation for multi-story hospitals and transit stations.
- AI-assisted computer vision for automatic ramp gradient and doorway width calculation from uploaded photos.
- Native mobile applications (React Native / iOS / Android).
