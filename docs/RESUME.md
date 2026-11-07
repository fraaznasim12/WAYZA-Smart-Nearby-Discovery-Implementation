# AccessMap — Software Engineering Resume & Interview Guide

This guide provides resume-ready bullet points, technical deep dives, architectural talking points, and interview discussions based on the actual implementation of AccessMap.

---

## 1. Professional One-Line Heading
**AccessMap — Full-Stack Geospatial Accessibility Intelligence & Community Verification Platform**  
*(React 18, TypeScript, Tailwind CSS, MapLibre GL, Java 21, Spring Boot 3, PostgreSQL 16, PostGIS 3.4, Cloudflare R2, Docker)*

---

## 2. Concise Project Description
AccessMap is an enterprise-grade, full-stack geospatial platform designed to eliminate physical accessibility uncertainty for individuals with mobility challenges. Backed by PostgreSQL and PostGIS spatial indexing, it enables real-time device location detection and sub-50ms proximity queries across physical venues. The platform enforces a domain-specific Four-State Verification Model (`AVAILABLE`, `NOT_AVAILABLE`, `UNKNOWN`, `NOT_VERIFIED`), pairs interactive vector maps with 3D architectural cutaways (and accessible 2D fallbacks), and provides peer-reviewed community auditing, image evidence sanitization, and administrative moderation queues.

---

## 3. Resume-Ready Bullet Points

### Full-Stack / Backend Focused Bullet Points
- Architected and deployed a modular monolith using **Java 21**, **Spring Boot 3**, and **PostgreSQL 16 + PostGIS 3.4**, executing spatial proximity queries (`ST_DWithin`) across physical venues using GiST spatial indexing.
- Designed a domain-enforced **Four-State Verification Model** (`AVAILABLE`, `NOT_AVAILABLE`, `UNKNOWN`, `NOT_VERIFIED`) with automated 180-day staleness tracking to eliminate false accessibility guarantees.
- Implemented stateless **Spring Security 6** with HMAC-SHA256 JWT tokens and 4-tier Role-Based Access Control (`ROLE_USER`, `ROLE_CONTRIBUTOR`, `ROLE_BUSINESS`, `ROLE_ADMIN`).
- Built an asynchronous media pipeline integrating **TwelveMonkeys ImageIO** and **MinIO S3 / Cloudflare R2**, stripping sensitive EXIF metadata and transcoding evidence photos before storage.
- Engineered real-time push notifications using **Server-Sent Events (SSE)** with concurrent client registries to broadcast audit verification alerts and dispute resolutions.
- Containerized the backend using a hardened **multi-stage Alpine Dockerfile** with an unprivileged system user (`appuser:10001`), dynamic `$PORT` binding, and graceful SIGTERM signal handling.

### Frontend / Full-Stack Focused Bullet Points
- Developed a responsive, accessible client in **React 18**, **TypeScript**, and **Tailwind CSS v4**, integrating **MapLibre GL JS** for vector tile spatial rendering and custom venue pin clustering.
- Implemented real-time phone location detection leveraging the browser **Geolocation API**, handling permission states, mobile device orientation, and dynamic proximity map centering.
- Created interactive 3D architectural spatial cutaways with **Three.js** and **React Three Fiber**, engineering a resilient 2D SVG fallback conforming to WCAG 2.1 AA `prefers-reduced-motion` standards.
- Designed comprehensive state management and typed API clients with **Axios** and **React Router DOM v7**, enforcing route guards and authentication persistence.

---

## 4. Technical Architecture Deep Dive (For System Design Interviews)

### Spatial Geometry & PostGIS Indexing
In generic directories, proximity search is often performed by querying a bounding box using plain float coordinates (`min_lat`, `max_lat`), resulting in slow table scans and distortion across geographic latitudes. In AccessMap, venue coordinates are stored as native PostGIS geometries: `GEOMETRY(Point, 4326)`. Spatial searches utilize spherical geography calculations via `ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radiusMeters)`. Because this query targets a Generalized Search Tree (**GiST**) index, index lookups resolve in sub-50ms even as dataset size scales.

### Domain Integrity: The Four-State Model
Physical accessibility is frequently misrepresented by binary booleans (`is_accessible: true/false`). A venue without audit data might be labeled as inaccessible, or a broken elevator might leave a wheelchair user stranded. AccessMap models each feature as an explicit state:
1. `AVAILABLE`: Verified present, operational, and unblocked.
2. `NOT_AVAILABLE`: Audited as absent or out-of-order.
3. `UNKNOWN`: No audit data recorded yet (**strictly never displayed as not available**).
4. `NOT_VERIFIED`: Submitted community report awaiting peer review or exceeding the 180-day freshness SLA (`UNVERIFIED_STALE`).

---

## 5. Five Key Engineering Challenges & Solutions

### Challenge 1: Supabase PostGIS Extension Schema Resolution
- **Problem:** Supabase isolates the PostGIS extension into the `extensions` schema rather than `public`. Spring Boot's standard Hibernate Spatial dialect failed to resolve native PostGIS functions (`ST_DWithin`, `ST_MakePoint`) without explicit schema qualification.
- **Solution:** Configured the HikariCP connection pool with `connection-init-sql: "SET search_path TO public, extensions"` and injected `options=-csearch_path%3Dpublic,extensions` into the JDBC connection string, ensuring seamless spatial function resolution across both JPA queries and Flyway migrations.

### Challenge 2: Headless Docker Image Watermarking & Native Libraries
- **Problem:** When generating thumbnail previews and watermarks in Java 21 inside lightweight Alpine Linux containers, `java.awt.HeadlessException` and `UnsatisfiedLinkError: libfontconfig.so.1` crashed the service due to missing native rendering libraries.
- **Solution:** Updated the production multi-stage Alpine Dockerfile to install `fontconfig`, `ttf-dejavu`, and `freetype`, and configured the JVM runtime flag `-Djava.awt.headless=true`, enabling clean headless image processing in a minimal container footprint.

### Challenge 3: Real-Time Phone Location UX & Geolocation Failures
- **Problem:** When requesting device location on mobile browsers over HTTPS, mobile browsers frequently time out or throw silent permission denials if accurate GPS satellite lock is delayed.
- **Solution:** Built a multi-stage geolocation handler using `navigator.geolocation.getCurrentPosition` with a 10-second timeout, `enableHighAccuracy: true`, and graceful fallback to cached positions. Designed explicit, empathetic UI error toasts (explaining permission recovery steps) while retaining existing map coordinates.

### Challenge 4: EXIF Data Sanitization & Image Transcoding
- **Problem:** Mobile photos uploaded for community report evidence contain embedded GPS coordinates, camera metadata, and timestamps in EXIF headers, which pose user privacy risks and potential steganographic attack vectors.
- **Solution:** Implemented an in-memory image sanitization pipeline in `MediaStorageService.java` that strips all EXIF metadata using Java ImageIO, re-encodes photos into standardized JPEG/PNG buffers, and validates MIME headers before persisting to Cloudflare R2.

### Challenge 5: Dynamic Port Binding on Containerized Cloud Hosts
- **Problem:** Modern cloud platforms (like Render) assign dynamic port numbers via the `$PORT` environment variable at container startup, causing containers configured with static ports (e.g. `8080`) to fail platform health checks.
- **Solution:** Configured `application-prod.yml` to bind to `server.port: ${PORT:8080}` on `0.0.0.0` and structured the container entrypoint with `exec java -Dserver.port=${PORT} -jar app.jar` to ensure instantaneous port binding and direct SIGTERM signal propagation for graceful shutdown.

---

## 6. Suggested Interview Questions & Talking Points

**Q: Why choose PostgreSQL/PostGIS over MongoDB or Elasticsearch for this geospatial application?**  
> *"While MongoDB and Elasticsearch offer basic geo-queries, PostGIS is the gold standard for spatial computation. It adheres strictly to OGC (Open Geospatial Consortium) standards, handles accurate geodetic calculations on the WGS84 spheroid (accounting for Earth's curvature), and allows spatial operations (`ST_DWithin`, `ST_MakeEnvelope`) to be joined natively with relational business data (users, audit trails, and multi-feature foreign keys) under full ACID transactions."*

**Q: How do you handle security when accepting user-generated image uploads?**  
> *"We enforce defense-in-depth: uploads are restricted to 10MB at both the reverse proxy and Spring servlet limits; files are transcoded in memory through native ImageIO to strip EXIF GPS metadata and kill polyglot exploits; and files are written directly to private S3/R2 storage with randomized UUID keys, never executed on or served directly from the application container filesystem."*

**Q: How does the application maintain WCAG 2.1 AA accessibility?**  
> *"Accessibility is built into the architecture: status is never conveyed by color alone—all status badges combine distinct high-contrast icons, ARIA attributes, and explicit text labels. Our 3D Three.js visualizations inspect the user's OS `prefers-reduced-motion` settings and automatically fall back to an accessible, high-contrast 2D SVG architectural plan."*
