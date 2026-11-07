# Contributing to AccessMap

Thank you for your interest in contributing to **AccessMap**! AccessMap is an open, community-driven platform dedicated to delivering verifiable, physical accessibility intelligence for people with mobility challenges.

We welcome contributions ranging from bug fixes and documentation improvements to new accessibility feature definitions and spatial optimization algorithms.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone, regardless of disability, physical mobility, gender identity, sexual orientation, race, or background.

Please treat all maintainers and contributors with respect, empathy, and professional courtesy.

---

## 2. Development Prerequisites

Ensure your local development environment has the following installed:

- **Java Development Kit (JDK):** Version 21 (Eclipse Temurin or OpenJDK recommended)
- **Node.js & npm:** Node.js v18+ and npm v9+
- **Docker & Docker Compose:** Optional for local PostgreSQL/PostGIS (or run local Spring Boot with H2GIS profile)
- **Git:** Version 2.30+

---

## 3. Local Development Setup

### 3.1 Clone the Repository
```bash
git clone https://github.com/fraaznasim12/WAYZA-Smart-Nearby-Discovery-Implementation.git AccessMap
cd AccessMap
```

### 3.2 Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the project and run verification tests:
   ```bash
   # Linux / macOS
   ./mvnw clean test

   # Windows PowerShell
   .\mvnw.cmd clean test
   ```
3. Start the backend development server (defaults to `dev` profile with H2GIS spatial support):
   ```bash
   # Windows PowerShell
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
   ```
   The backend API will be available at `http://localhost:8080`.

### 3.3 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (or `http://localhost:5174`).

---

## 4. Coding & Quality Standards

To maintain high architectural standards, please follow these guidelines:

1. **Accessibility Standards (WCAG 2.1 AA):**
   - Every interactive element must be keyboard-accessible and focusable.
   - Status must never be conveyed by color alone — always pair semantic icons with visible text and ARIA attributes.
   - 3D features must gracefully fall back to accessible 2D vector diagrams when `prefers-reduced-motion` is active.
2. **Backend (Java 21 / Spring Boot 3):**
   - Follow clean code principles and modular separation of concerns (Controller -> Service -> Repository).
   - Use Data Transfer Objects (DTOs) with Bean Validation annotations for all incoming requests.
   - Ensure all database queries leverage parameterized inputs and PostGIS spatial indexing.
3. **Frontend (React 18 / TypeScript / Tailwind CSS):**
   - Enforce strict TypeScript typing (`noImplicitAny`).
   - Use utility classes consistently with the unified design tokens.
   - Run `npm run build` before submitting a pull request to verify zero TypeScript errors.

---

## 5. Submitting Pull Requests

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/accessible-parking-filters
   ```
2. Commit your changes using conventional commit messages:
   ```bash
   git commit -m "feat(filters): add accessible parking multi-feature predicate"
   ```
3. Ensure all automated tests pass:
   ```bash
   cd backend && .\mvnw.cmd test
   cd ../frontend && npm run build
   ```
4. Push your branch to GitHub and open a Pull Request against the `main` branch.
5. Provide a clear PR description detailing what was changed and including steps to test.

---

## 6. Project Licensing Notice

The AccessMap repository is currently evaluating its formal open-source license. Available options under review by the project owner include:

- **MIT License:** Permissive, allows free use, modification, and distribution with attribution.
- **Apache 2.0 License:** Permissive with explicit patent protection grants and trademark restrictions.
- **GNU AGPLv3:** Strong copyleft license ensuring community accessibility platforms remain open when served over networks.

Until a formal `LICENSE` file is committed by the project owner, all rights are reserved by the original author (**Mohammad Fraaz Nasim**).
