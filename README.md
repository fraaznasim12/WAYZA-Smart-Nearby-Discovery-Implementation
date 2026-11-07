# 🗺️ AccessMap: Intelligent Physical Accessibility Discovery & Verification Platform

[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-0D9488?style=for-the-badge)](docs/PROJECT_RULES.md)
[![Frontend: React + TypeScript + Vite](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![Styling: Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](frontend/)
[![3D: Three.js + R3F](https://img.shields.io/badge/3D-Three.js%20%2F%20R3F-000000?style=for-the-badge&logo=three.js)](frontend/)
[![Maps: MapLibre GL](https://img.shields.io/badge/Maps-MapLibre%20GL%20JS-396B99?style=for-the-badge&logo=maplibre)](frontend/)
[![Backend: Java 21 + Spring Boot 3](https://img.shields.io/badge/Backend-Java%2021%20%2B%20Spring%20Boot%203-6DB33F?style=for-the-badge&logo=springboot)](backend/)
[![Database: PostgreSQL + PostGIS](https://img.shields.io/badge/Database-PostgreSQL%2016%20%2B%20PostGIS-336791?style=for-the-badge&logo=postgresql)](docker-compose.yml)

**AccessMap** is an enterprise-grade, full-stack software engineering platform designed to eliminate accessibility uncertainty in the physical world. It empowers individuals with mobility impairments, wheelchair users, elderly citizens, and parents with strollers to discover, inspect, and verify real-world accessibility infrastructure (such as step-free entrances, ramps, elevators, and accessible washrooms) across hospitals, colleges, transit hubs, restaurants, shopping malls, and civic centers.

Unlike generic directories that treat accessibility as a trivial binary checkbox (`true`/`false`), **AccessMap** enforces a rigorous **Four-State Verification Model**, pairs interactive spatial mapping with purposeful 3D architectural spatial cutaways, and provides an active community auditing and dispute resolution engine.

---

## 🌟 Core Pillars & Domain Innovations

### 1. The Four-State Verification Model
Physical accessibility is nuanced and dynamic. AccessMap treats all architectural features according to four distinct, unambiguous states:

| Feature State | Indicator Badge | Definition & System Rule |
| :--- | :--- | :--- |
| **`AVAILABLE`** | `[Verified: Available]` | In-person verified present, operational, and unobstructed within the last 180 days. |
| **`NOT_AVAILABLE`** | `[Confirmed: Not Available]` | Explicitly audited as absent or non-functional (e.g., steep stairs only, out-of-order lift). |
| **`UNKNOWN`** | `[Status: Unknown]` | No verified audit data recorded yet. **Strict Rule: Unknown is NEVER treated as Not Available.** Prompts community submission. |
| **`NOT_VERIFIED`** | `[Status: Not Verified]` | A report exists but has not completed peer verification or exceeds the 180-day freshness SLA (`UNVERIFIED_STALE`). |

> **Accessibility Standard:** Status is never communicated by color alone. Every indicator pairs high-contrast text, unique semantic icon glyphs, and ARIA attributes for screen readers.

### 2. Purposeful 3D Micro-Visualizations with Resilient 2D Fallback
- **3D Spatial Cutaway (Three.js / React Three Fiber / Drei):** Visualizes multi-level accessible ingress paths, ramp inclines, and elevator cores in an interactive isometric view.
- **Progressive Enhancement & Fallback:** If WebGL is unavailable or the user has enabled OS `prefers-reduced-motion`, the system automatically renders an accessible, high-contrast 2D architectural SVG diagram.

### 3. Spatial Proximity & Accessibility Filtering
- Powered by **PostgreSQL 16 + PostGIS**, enabling sub-50ms radius queries (`ST_DWithin`) based on latitude, longitude, and custom distance buffers.
- Supports strict multi-feature filtering (e.g., "Must have step-free entrance AND operational elevator AND accessible restroom").

### 4. Community Auditing & Dispute Moderation
- Every report records its **source** (User, Certified Auditor, Business Owner), **submission date**, **verification status**, and **last verified timestamp**.
- Multi-photo evidence upload with EXIF metadata extraction for tamper-resistant field auditing.
- Dispute queue enabling community members and facility managers to flag outdated or incorrect data.

---

## 🧩 Architectural Modules

The platform is designed as a **Modular Monolith** comprising 10 distinct functional modules:

1. **User Authentication & Profiles:** Secure JWT stateless auth, role-based access control (`USER`, `CONTRIBUTOR`, `BUSINESS`, `ADMIN`).
2. **Accessibility Preference Profiles:** Personalized mobility profiles that highlight relevant accessibility features and automatically pre-filter discovery results.
3. **Interactive Map & Place Discovery:** Dynamic MapLibre GL JS vector map synchronized with an accessible, keyboard-navigable list/table view.
4. **Accessibility Filters:** Granular filtering by facility category, distance radius, and multi-feature availability.
5. **Place Details & Feature Intelligence:** Deep dive view of venue accessibility, operating hours, contact details, and feature-by-feature audits.
6. **Community Accessibility Reports:** User-submitted audits tracking changes, ramp obstacles, or broken elevators.
7. **Photo Evidence & Verification:** Visual proof submission with secure image validation.
8. **Report Disputes & Moderation:** Community flagging system with administrative review queues.
9. **Business & Facility Dashboard:** Facility managers can claim locations, respond to audits, and post official facility updates.
10. **Admin Dashboard:** System metrics, user role management, dispute resolution, and audit logs.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript + Vite | Lightning-fast modern client runtime with strict static typing |
| **Styling & UI** | Tailwind CSS v4 + Lucide React | High-contrast design system, utility-first responsive layout |
| **Animation & 3D** | Framer Motion + Three.js + R3F + Drei | Smooth accessible transitions and progressive 3D spatial cutaways |
| **Mapping Engine** | MapLibre GL JS | Open-source vector tile spatial maps |
| **Networking & Routing** | Axios + React Router DOM v7 | Typed REST HTTP client and client-side routing |
| **Backend Framework** | Java 21 + Spring Boot 3 | Enterprise-grade modular monolith REST API |
| **Security** | Spring Security + JWT | Stateless role-based authentication and endpoint authorization |
| **Persistence** | Spring Data JPA + Hibernate Spatial | Object-relational mapping with native spatial geometry support |
| **Database** | PostgreSQL 16 + PostGIS 3.4 (Supabase) | High-performance spatial indexing (`GIST`) and geospatial queries |
| **Object Storage** | Cloudflare R2 (S3-compatible) | EXIF-sanitized storage for avatars and report evidence photos |
| **Cloud Hosting** | Vercel (Frontend) + Render (Backend) | Production edge CDN distribution and containerized web services |

---

## 📁 Repository Structure

```text
AccessMap/
├── frontend/               # React + TypeScript + Vite client application
├── backend/                # Java 21 + Spring Boot 3 modular monolith application
├── docs/                   # Engineering specifications and guidelines
│   ├── PROJECT_RULES.md    # Coding standards, a11y mandates, and security rules
│   ├── REQUIREMENTS.md     # Software Requirements Specification (SRS) & 10 modules
│   ├── ROADMAP.md          # Phased development roadmap with testable milestones
│   └── ARCHITECTURE.md     # System architecture, database schema & data flows
├── docker-compose.yml      # PostGIS 16 spatial database service definition
├── README.md               # Project overview and documentation index
└── .gitignore              # Repository git ignore rules
```

---

## 📖 Documentation Index

* **[Production Deployment Guide](docs/DEPLOYMENT.md):** Cloud hosting architecture, Vercel, Render, Supabase, Cloudflare R2, security checklist, and step-by-step deployment instructions.
* **[Engineering Rules & Standards](docs/PROJECT_RULES.md):** 13 mandatory principles covering code style, security, a11y, and solo development workflow.
* **[Requirements Specification](docs/REQUIREMENTS.md):** Detailed breakdown of all 10 modules, functional requirements, and non-functional SLAs.
* **[Implementation Roadmap](docs/ROADMAP.md):** Milestone-by-milestone implementation plan with verifiable checkpoints.
* **[Architecture Specification](docs/ARCHITECTURE.md):** System diagrams, PostGIS database DDL, API contracts, and security boundaries.

---

## 🚀 Development Status

* **Current Stage:** Phase 16 — Production Deployment & Cloud Hosting Preparation completed.
* **Hosting Targets:** Vercel (Frontend), Render Docker (Backend), Supabase (PostgreSQL + PostGIS), Cloudflare R2 (Media Storage).
