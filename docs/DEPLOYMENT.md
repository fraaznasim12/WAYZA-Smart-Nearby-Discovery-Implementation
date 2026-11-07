# AccessMap — Production Deployment & Cloud Architecture Guide

This guide details the complete production deployment procedure for **AccessMap**, including architecture, service configuration, database migration, environment variables, security guidelines, and disaster recovery procedures.

---

## 1. Deployment Architecture

AccessMap uses a modern, cost-efficient, decoupled cloud architecture designed for high availability, security, and low operational overhead:

```
                          ┌─────────────────────────────┐
                          │   End Users (Mobile / Web)  │
                          └──────────────┬──────────────┘
                                         │ HTTPS
                 ┌───────────────────────┴────────────────────────┐
                 │                                                │
                 ▼                                                ▼
   ┌───────────────────────────┐                    ┌───────────────────────────┐
   │      Vercel Hosting       │                    │    Cloudflare CDN / R2    │
   │  React + Vite TypeScript  │                    │   S3-Compatible Storage   │
   │   (SPA Static / Edge)     │                    │  (Avatars & Report Media) │
   └─────────────┬─────────────┘                    └─────────────▲─────────────┘
                 │                                                │
                 │ HTTPS REST API                                 │ Presigned / S3 API
                 ▼                                                │
   ┌───────────────────────────┐                                  │
   │      Render Hosting       │──────────────────────────────────┘
   │ Spring Boot 3.3 (Docker)  │
   │      Java 21 JRE          │
   └─────────────┬─────────────┘
                 │
                 │ PostgreSQL Wire Protocol + TLS / SSL
                 │ (search_path: public, extensions)
                 ▼
   ┌───────────────────────────┐
   │    Supabase Managed DB    │
   │ PostgreSQL 16 + PostGIS   │
   │  (Geographic SRID 4326)   │
   └───────────────────────────┘
```

| Component | Cloud Provider | Technology | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | React 18, TypeScript, Vite, Tailwind CSS, MapLibre GL | Global CDN distribution, SPA client-side routing, accessibility visualization. |
| **Backend** | **Render** | Spring Boot 3.3.5, Java 21, Docker | RESTful API, authentication (JWT), PostGIS proximity queries, moderation, SSE notifications. |
| **Database** | **Supabase** | PostgreSQL 16, PostGIS 3.4 | Relational entity storage, spatial indexing (GIST SRID 4326), Flyway migrations. |
| **Object Storage** | **Cloudflare R2** | S3-Compatible Object Store | Storage for user profile avatars and community report evidence photos. |

---

## 2. Required Accounts & Services

Before initiating live deployment, the following cloud accounts are required:

1. **GitHub**: Repository hosting, version control, and GitHub Actions CI runner.
2. **Vercel**: Free or Pro tier account for frontend hosting.
3. **Render**: Free or Starter Web Service account for Dockerized Spring Boot backend hosting.
4. **Supabase**: Free or Pro tier PostgreSQL database project with PostGIS extension.
5. **Cloudflare**: Cloudflare dashboard account with an active R2 bucket and API tokens.

---

## 3. Environment Variable Reference

### A. Backend Variables (Configured in Render Dashboard)

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` | Activates production profile (`application-prod.yml`). |
| `PORT` | Auto | `8080` | Render dynamically allocates this port; application binds to `0.0.0.0:${PORT}`. |
| `DB_URL` | Yes | `jdbc:postgresql://db.<ref>.supabase.co:5432/postgres?sslmode=require&options=-csearch_path%3Dpublic,extensions` | JDBC URL for Supabase PostgreSQL with SSL and search_path. |
| `DB_USER` | Yes | `postgres` | Database username. |
| `DB_PASSWORD` | Yes | *(Secret)* | Database password. |
| `DB_POOL_MAX_SIZE` | No | `10` | Maximum HikariCP database connections. |
| `DB_POOL_MIN_IDLE` | No | `2` | Minimum idle connections in the pool. |
| `JWT_SECRET` | Yes | *(Secret, min 256 bits)* | Cryptographic HMAC-SHA256 secret key for signing tokens. |
| `JWT_EXPIRATION_MS` | No | `3600000` (1 hour) | Access token validity duration in milliseconds. |
| `JWT_REFRESH_EXPIRATION_MS` | No | `604800000` (7 days) | Refresh token validity duration. |
| `CORS_ORIGINS` | Yes | `https://<your-app>.vercel.app` | Comma-separated list of permitted frontend HTTPS origins. |
| `STORAGE_PROVIDER` | Yes | `s3` | Storage engine (`s3` for Cloudflare R2 / AWS S3). |
| `STORAGE_ENDPOINT` | Yes | `https://<account_id>.r2.cloudflarestorage.com` | Cloudflare R2 S3-compatible API endpoint. |
| `STORAGE_ACCESS_KEY` | Yes | *(Secret)* | Cloudflare R2 API Token Access Key ID. |
| `STORAGE_SECRET_KEY` | Yes | *(Secret)* | Cloudflare R2 API Token Secret Access Key. |
| `STORAGE_BUCKET` | Yes | `accessmap-media` | Name of the bucket in Cloudflare R2. |
| `STORAGE_REGION` | No | `auto` | Region identifier (`auto` or `us-east-1` for R2). |
| `STORAGE_PUBLIC_URL_PREFIX` | No | `https://media.accessmap.org` | Optional public CDN domain or Cloudflare R2 custom domain. |
| `STORAGE_PRESIGNED_URL_EXPIRY_MINUTES`| No | `60` | Validity period for generated media access URLs. |
| `OSM_ENABLED` | No | `true` | Enables Overpass OpenStreetMap sync. |
| `OVERPASS_ENDPOINT` | No | `https://overpass-api.de/api/interpreter` | Overpass API gateway. |
| `AI_ENABLED` | No | `true` | Enables AI Assistant feature. |
| `AI_PROVIDER` | No | `mock` / `openai-compatible` | Selected AI inference provider. |
| `AI_API_KEY` | If enabled | *(Secret)* | API key for OpenAI or Groq/LLM provider. |

### B. Frontend Variables (Configured in Vercel Project Settings)

| Variable | Required | Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | `https://accessmap-backend.onrender.com` | Public HTTPS URL of the backend API. |
| `VITE_MAP_STYLE_URL` | No | `https://demotiles.maplibre.org/style.json` | Vector tile stylesheet URL for MapLibre GL. |

---

## 4. Vercel Frontend Setup

1. In the Vercel Dashboard, click **Add New** → **Project**.
2. Import the `AccessMap` GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. In the **Environment Variables** section, add:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-name>.onrender.com`
   - `VITE_MAP_STYLE_URL`: `https://demotiles.maplibre.org/style.json`
5. Click **Deploy**. Vercel will run `tsc -b && vite build` and deploy the output to its global edge network.
6. The included `frontend/vercel.json` automatically provides SPA routing rewrites (`/(.*) -> /index.html`) so refreshing any subpath (e.g. `/explore`, `/dashboard`, `/admin`) succeeds without 404s.

---

## 5. Render Backend Setup

1. In the Render Dashboard, click **New** → **Web Service** (or use the Blueprint from `render.yaml`).
2. Select your `AccessMap` repository.
3. Choose **Docker** as the environment.
4. Configure the service settings:
   - **Name**: `accessmap-backend`
   - **Region**: Oregon (or your preferred region closest to your Supabase instance)
   - **Branch**: `main` or `master`
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile` (or `backend/Dockerfile` if deploying from repo root)
   - **Health Check Path**: `/actuator/health`
5. In **Environment Variables**, provide the values from the Backend Variables reference table above.
6. Click **Create Web Service**. Render will execute the multi-stage Docker build, start the unprivileged `appuser` container, bind to `0.0.0.0:$PORT`, and monitor the `/actuator/health` probe.

---

## 6. Supabase PostgreSQL/PostGIS Setup

Supabase hosts PostgreSQL with native PostGIS capability.

### A. Enable PostGIS Extension
1. In the Supabase project dashboard, navigate to **Database** → **Extensions**.
2. Search for `postgis` and confirm it is enabled. By default, Supabase installs extensions in the `extensions` schema.

### B. Configure Schema Search Path
Because PostGIS functions (`ST_DWithin`, `ST_MakePoint`, `ST_MakeEnvelope`) and geometric types reside in the `extensions` schema, execute the following SQL in the Supabase SQL Editor once:
```sql
ALTER DATABASE postgres SET search_path TO public, extensions;
```
*(Note: As an extra layer of reliability, `application-prod.yml` also includes `options=-csearch_path=public,extensions` in the JDBC URL and sets `connection-init-sql: "SET search_path TO public, extensions"` in HikariCP).*

### C. Connection String
Retrieve your project connection string from **Project Settings** → **Database** → **Connection string** (URI):
- Use Port `5432` for direct connection or Port `6543` for the transaction pooler (PgBouncer).
- Replace `[YOUR-PASSWORD]` with your actual database password.
- Ensure `sslmode=require` is appended to the JDBC URL.

---

## 7. Cloudflare R2 Setup

Cloudflare R2 provides zero-egress-fee, S3-compatible object storage for venue evidence and user profile avatars.

1. In the Cloudflare Dashboard, select **R2** → **Create bucket**.
2. Name the bucket `accessmap-media` and select location preference (Automatic).
3. Under **Manage R2 API Tokens**, click **Create API token**:
   - **Permissions**: `Object Read & Write`
   - **Apply to**: Specific bucket (`accessmap-media`)
   - **TTL**: Specify as needed.
4. Copy the resulting **Access Key ID**, **Secret Access Key**, and the **S3 API endpoint** URL (format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
5. (Optional but recommended): Under Bucket Settings, enable **Public Access** (either via `pub-xxxx.r2.dev` or by connecting a Custom Domain such as `media.accessmap.org`). If enabled, set `STORAGE_PUBLIC_URL_PREFIX` to this domain to serve images directly through Cloudflare's global edge cache.

---

## 8. GitHub Integration & CI Workflow

The repository includes a production-grade CI workflow in `.github/workflows/ci.yml`.

Every push or pull request to `main` / `master` triggers automated parallel checks:
- **Backend Build & Test**: Runs `./mvnw clean verify` on Temurin JDK 21 on `ubuntu-latest`.
- **Frontend Build & Check**: Runs `npm ci` and `npm run build` (`tsc -b && vite build`) on Node.js 20 on `ubuntu-latest`.

---

## 9. CORS, HTTPS, and Device Geolocation

### HTTPS Requirement
Browser Geolocation (`navigator.geolocation.getCurrentPosition`) strictly requires a **Secure Context (HTTPS)**.
- Both Vercel and Render provide automatic TLS/SSL certificates for custom domains and default subdomains (`*.vercel.app` and `*.onrender.com`).
- Over HTTPS, the browser prompts the user for GPS permission when they click **"Use My Current Location"**.

### Cross-Origin Resource Sharing (CORS)
To prevent cross-site request forgery and unauthorized API access:
- Set `CORS_ORIGINS` on Render to your exact frontend domain, e.g.:
  ```
  CORS_ORIGINS=https://accessmap.vercel.app
  ```
- If using multiple domains (e.g. preview and production), separate them with commas:
  ```
  CORS_ORIGINS=https://accessmap.vercel.app,https://accessmap.org
  ```

---

## 10. Database Migration Procedure

Flyway handles database migrations automatically upon application startup.

### Initial Migration Execution
When the backend starts with `SPRING_PROFILES_ACTIVE=prod` and connects to an empty Supabase database:
1. Flyway creates the `flyway_schema_history` table.
2. It executes all migrations in sequential order (`V1` through `V13`).
3. It sets spatial indexes, tables, constraints, foreign keys, and pre-seeded reference data.

### Production Migration Safety Rules
- **Never Clean in Production**: `spring.flyway.clean-disabled: true` is enforced in `application-prod.yml` to prevent accidental drops.
- **Additive Migrations Only**: Future database changes must be added as new versioned scripts (e.g. `V14__...sql`). Never modify or reorder previously applied migrations.
- **Validating Existing Schemas**: If connecting to a pre-existing database, `baseline-on-migrate: true` ensures Flyway baselines cleanly at the current version.

---

## 11. Health-Check & Operational Verification

Once deployed, verify application health via the following checks:

### 1. Backend Health Check
```bash
curl -I https://accessmap-backend.onrender.com/actuator/health
# Response: HTTP/1.1 200 OK
```

### 2. Proximity API Verification
```bash
curl -s "https://accessmap-backend.onrender.com/api/v1/places/nearby?lat=19.0760&lng=72.8777&radiusMeters=5000" | jq .
# Response: {"success": true, "data": { "content": [...] }}
```

### 3. Frontend Reachability
Navigate to `https://accessmap.vercel.app/explore` in your browser:
- Confirm venues populate the list view and map view.
- Click **"Use My Current Location"** to verify browser geolocation prompt and nearby venue auto-filtering.

---

## 12. Rollback, Recovery & Disaster Planning

1. **Frontend Instant Rollback**: In the Vercel Dashboard, go to **Deployments** → locate the previous successful deployment → click **Instant Rollback**.
2. **Backend Rollback**: In the Render Dashboard, select **Events** or **Deployments** and click **Rollback to this deploy** on any previous successful release.
3. **Database Point-in-Time Recovery**: Supabase automatically captures daily backups (and Point-in-Time Recovery on Pro tier). Restore can be triggered from the Supabase Database Backups tab.
4. **Storage Durability**: Cloudflare R2 provides 99.999999999% (11 9's) data durability. Media files are stored redundantly across multiple geographic regions.

---

## 13. Cost and Resource Considerations

This architecture is 100% compatible with the **Free Tiers** of each cloud provider during development and staging:

| Service | Free Tier Allowance | Upgrade Threshold |
| :--- | :--- | :--- |
| **Vercel** | 100 GB bandwidth, unlimited deployments | Team collaboration / custom SLA |
| **Render** | 750 free instance hours / month (sleeps after 15m inactivity) | $7/mo Starter plan for 24/7 always-on instance |
| **Supabase** | 500 MB database, 50,000 monthly active users | $25/mo Pro tier for 8 GB+ storage and daily backups |
| **Cloudflare R2** | 10 GB storage / month, 10M read requests, **$0 egress** | $0.015 / GB-month beyond 10 GB |

---

## 14. Production Security Checklist

- [x] **No Hardcoded Secrets**: All keys, passwords, and tokens read from environment variables.
- [x] **Secure Random JWT Secret**: Minimum 256-bit random key generated via `openssl rand -base64 48`.
- [x] **Non-Root Container**: Docker container executes as unprivileged user `appuser` (UID 10001).
- [x] **TLS/SSL Encryption**: All traffic served over HTTPS (Vercel edge, Render TLS termination, Supabase SSL).
- [x] **Flyway Clean Disabled**: Destructive schema wipe commands strictly prohibited in production configuration.
- [x] **Sanitized Error Envelopes**: Stack traces and internal server error messages suppressed from client responses.
- [x] **Restricted Actuator Endpoints**: Only `/health` and `/info` exposed; sensitive environment/metrics details restricted.
- [x] **Metadata & EXIF Stripping**: Media upload service normalizes images and removes GPS/EXIF metadata prior to storage.
- [x] **MIME Type Validation**: Apache Tika binary inspection prevents spoofed file extensions on uploads.
- [x] **Rate Limiting**: Proximity and AI assistant endpoints equipped with token and rate-limiting throttles.
- [x] **Least Privilege Permissions**: Database credentials and storage tokens scoped strictly to application needs.

