# Security & Privacy Policy — AccessMap

At AccessMap, safeguarding user privacy, physical safety data, and platform infrastructure is a core engineering priority. This policy outlines our security practices, vulnerability disclosure procedures, and data handling policies.

---

## 1. Reporting Security Vulnerabilities

We welcome responsible security research. If you discover a vulnerability, misconfiguration, or security risk:

1. **Do not open a public GitHub issue.**
2. Send an email to the project maintainers at **`fraaznasim07@gmail.com`** with:
   - Vulnerability description and potential impact
   - Detailed step-by-step reproduction instructions or Proof-of-Concept (PoC)
   - Affected endpoints, parameters, or configurations
3. **Response SLA:** We acknowledge vulnerability reports within **48 hours** and provide triage updates within **5 business days**.

---

## 2. Authentication & Authorization Architecture

- **Stateless JWT Security:** Authentication is implemented via Spring Security 6 using HMAC-SHA256 (`HS256`) signed JSON Web Tokens.
- **Cryptographic Secrets:** In production, JWT signing keys must be a minimum of 256 bits (32 bytes) of cryptographic entropy and are injected strictly through external environment variables (`JWT_SECRET`).
- **Password Storage:** All passwords are salted and hashed using **BCrypt** with an adaptive work factor (`strength = 12`). Raw passwords are never logged, cached, or persisted.
- **Role-Based Access Control (RBAC):** Privileges are enforced across four tiers (`ROLE_USER`, `ROLE_CONTRIBUTOR`, `ROLE_BUSINESS`, `ROLE_ADMIN`) using method-level Spring Security annotations (`@PreAuthorize`).
- **Registration Privilege Gate:** Public registration strictly provisions `ROLE_USER`. Role escalation is guarded and can only be executed by administrators.

---

## 3. Location Permission & Privacy Safeguards

AccessMap utilizes physical coordinates to discover accessible places. We enforce the following strict privacy principles:

1. **Zero Server-Side Tracking:** Device coordinates (`latitude`, `longitude`) requested via the browser's HTML5 Geolocation API are used **strictly in-memory** during proximity search request dispatch (`/api/v1/places/nearby`).
2. **No Location History Persistence:** Coordinates are never logged, stored in persistent database tables, or linked to user account profiles.
3. **Explicit User Consent:** Location is queried only when the user explicitly clicks **"Use My Current Location"**. No silent or background location queries are executed.
4. **Resilient Fallback:** Users can decline location permissions at any time without loss of service; the interface provides full manual search, category browsing, and map panning.

---

## 4. Media Upload & Evidence Security

To protect users and platform integrity during photo uploads (avatars and report evidence):

1. **EXIF Metadata Stripping:** All uploaded JPEG/PNG images are automatically processed and stripped of EXIF metadata (including embedded GPS coordinates, camera model, and timestamps) before storage.
2. **Image Transcoding:** Uploads are decoded and re-encoded using native Java ImageIO / TwelveMonkeys to eliminate image-borne polyglots and steganographic payloads.
3. **Strict Content-Type Validation:** Only validated image MIME types (`image/jpeg`, `image/png`, `image/webp`) are accepted.
4. **File Size Restrictions:** Strict limits are enforced at the reverse proxy, servlet container, and service layers (5MB for avatars, 10MB for report evidence photos).
5. **Isolated Storage:** Media files are stored in private Cloudflare R2 / MinIO object storage buckets, isolated from application execution runtimes.

---

## 5. Secret Management & Infrastructure Hardening

- **Zero Hardcoded Credentials:** Application configuration files (`application-prod.yml`) rely entirely on environment variables (`DB_URL`, `DB_PASSWORD`, `JWT_SECRET`, `STORAGE_*`).
- **Container Isolation:** The production backend Docker container executes under a dedicated, unprivileged system user (`appuser:10001`) with read-only root filesystems where applicable.
- **Network Boundaries:** Database connections enforce SSL (`sslmode=require`), and CORS policies restrict browser origins to verified frontend domains.
