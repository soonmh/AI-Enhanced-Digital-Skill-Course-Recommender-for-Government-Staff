# Digital Skills Course Recommendation System

[![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-3.1_Flash_Lite-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A full-stack web-based **Digital Skill Course Recommendation System** designed for Malaysian government staff. The system assesses digital skills readiness through a structured questionnaire, calculates a composite DSRI score, identifies skill gaps, and recommends relevant courses using AI-powered analysis.

> **FYP-1 Project** — Final Year Project for Bachelor's Degree in Computer Science

---

## Table of Contents

- [Objectives](#objectives)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Docker Setup](#docker-setup)
  - [Backend Setup](#backend-setup-laravel)
  - [Frontend Setup](#frontend-setup-nextjs)
  - [Real-time Server (Optional)](#real-time-server-optional)
- [Demo Accounts](#demo-accounts)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [DSRI Calculation](#dsri-calculation)
- [Course Recommendation System](#course-recommendation-system)
- [AI Integration](#ai-integration)
- [Roles & Permissions](#roles--permissions)
- [Localization](#localization)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Objectives

1. **Assess** digital skills readiness of government staff across 10 competency categories aligned with Malaysia's Digital Competency Framework
2. **Calculate** a composite DSRI (Digital Skills Readiness Index) score to quantify each staff member's digital proficiency
3. **Identify** individual and departmental skill gaps through AI-powered analysis
4. **Recommend** personalized courses based on identified weaknesses using competency mapping and AI explanations
5. **Track** learning progress and course completion over time
6. **Provide** management with analytics dashboards for department-wide and organization-wide insights

---

## Key Features

### Assessment System (DSRA)
- 10-section Digital Skills Readiness Assessment questionnaire
- 1–5 confidence rating scale per question, with auto-save drafts every 2 seconds
- Section-by-section navigation with progress tracking
- Historical assessment tracking with trend analysis and comparison between attempts

### DSRI Scoring
- Weighted composite score (0–100) across 10 competency categories
- Per-category breakdown with visual radar charts
- Trend visualization across multiple assessment attempts

### Course Management
- Course CRUD with bilingual titles (English/Bahasa Melayu)
- Competency-based course mapping (courses linked to C1–C10 categories)
- Enrollment, progress tracking, and completion flow
- Course ratings and reviews (1–5 stars)
- Admin course assignment to individual users or groups

### AI-Powered Recommendations
- **Hybrid recommendation engine** combining content-based filtering (cosine similarity) and collaborative filtering (user-user similarity)
- Continuous scoring — no binary weak/not-weak cutoff; uses deficit vectors and difficulty matching
- Adaptive blending — shifts from content-only (new users) to 50/50 hybrid (users with peer data)
- AI-generated explanations referencing specific scores and peer comparison data
- Per-course competency breakdown showing user's exact scores for each covered skill
- Powered by Google Gemini 3.1 Flash Lite

### Analytics & Reporting
- Individual assessment history with trend charts
- Staff analysis with competency heatmaps for management
- Department comparison dashboard
- Course progress reporting with enrollment and completion metrics
- CSV data export

### Real-time Features
- Live user online status indicators
- Push notifications for course completion and system events
- WebSocket-based dashboard updates via Socket.io and Redis pub/sub

### Admin Management
- User management (create, edit, deactivate)
- Role assignment and permission control
- Course assignment/unassignment to users
- Bulk user operations

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 14.2 |
| | React | 18 |
| | TypeScript | 5 |
| | Tailwind CSS | 3.4 |
| | shadcn/ui | 4.7 |
| | NextAuth.js | 4.24 |
| | SWR | 2.4 |
| | Axios | 1.16 |
| | Recharts | 3.8 |
| | Socket.io Client | 4.8 |
| **Backend** | Laravel | 11 |
| | PHP | 8.3 |
| | Laravel Sanctum | 4.0 |
| | Eloquent ORM | — |
| | Predis | 3.4 |
| **Database** | PostgreSQL | 16 |
| **Cache / Queue** | Redis | 7 |
| **AI** | Google Gemini API | 3.1 Flash Lite |
| **Real-time** | Node.js + Express | — |
| | Socket.io | 4.8 |
| | ioredis | 5.4 |
| **DevOps** | Docker Compose | — |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│            Next.js 14 + React + Tailwind CSS             │
└────────────┬──────────────────────┬──────────────────────┘
             │ HTTP (REST API)      │ WebSocket
             │ Axios + SWR          │ Socket.io Client
             ▼                      ▼
┌────────────────────┐   ┌────────────────────────┐
│   Laravel 11 API   │   │  Real-time Server       │
│   (Port 8000)      │   │  Express + Socket.io    │
│                    │   │  (Port 3001)             │
│  ┌──────────────┐  │   │                          │
│  │ Sanctum SPA  │  │   │  Online status,          │
│  │ Auth         │  │   │  Notifications,          │
│  └──────────────┘  │   │  Dashboard updates       │
│  ┌──────────────┐  │   └────────────┬─────────────┘
│  │ DSRI Engine  │  │                │
│  └──────────────┘  │                │
│  ┌──────────────┐  │                │
│  │ Gemini AI    │  │                │
│  │ Integration  │  │                │
│  └──────────────┘  │                │
└────────┬───────────┘                │
         │                            │
         ▼                            ▼
┌─────────────────┐     ┌──────────────────┐
│  PostgreSQL 16  │     │    Redis 7       │
│  (Primary DB)   │     │ (Cache/Queue/    │
│                 │     │  Pub-Sub)        │
└─────────────────┘     └──────────────────┘
```

**Request Flow:**
1. Browser sends request to Next.js frontend (port 3000)
2. Next.js API routes proxy to Laravel backend (port 8000) via Sanctum CSRF-based SPA authentication
3. Laravel handles business logic, DSRI calculation, and AI calls
4. Real-time events are published to Redis and delivered to clients via Socket.io server (port 3001)

---

## Project Structure

```
fyp1/
├── backend/                          # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/      # API controllers
│   │   │   │   ├── AdminController           # User management, course assignment
│   │   │   │   ├── AssessmentController      # Assessment flow & scoring
│   │   │   │   ├── AssessmentDraftController # Draft auto-save
│   │   │   │   ├── AuthController            # Register, login, logout
│   │   │   │   ├── CourseController          # Course CRUD, enrollment, recommendations
│   │   │   │   ├── DashboardController       # Dashboard aggregation
│   │   │   │   ├── NotificationController    # Notification management
│   │   │   │   ├── ReportController          # Analytics & reporting
│   │   │   │   └── SettingsController        # User profile & preferences
│   │   │   └── Middleware/
│   │   │       ├── EnsureHasPermission.php   # Permission guard
│   │   │       └── EnsureHasRole.php         # Role guard
│   │   ├── Models/                   # Eloquent models (12 models)
│   │   ├── Services/
│   │   │   ├── DsriCalculationService.php             # DSRI scoring engine
│   │   │   ├── AiInsightService.php                   # Gemini AI integration
│   │   │   ├── ContentBasedRecommendationService.php  # Cosine similarity + difficulty matching
│   │   │   ├── CollaborativeFilteringService.php      # User-user collaborative filtering
│   │   │   ├── HybridRecommendationService.php        # Adaptive hybrid orchestrator
│   │   │   └── RealtimePublisher.php                  # Redis event publisher
│   │   ├── Events/                   # AssessmentSubmitted, CourseCompleted
│   │   └── Listeners/                # GenerateAiInsights, InvalidateRecommendationCache
│   ├── database/
│   │   ├── migrations/               # 19 migrations
│   │   └── seeders/                  # Demo data seeders
│   └── routes/api.php               # All API routes
│
├── frontend/                         # Next.js 14 application
│   └── src/
│       ├── app/
│       │   ├── (auth)/              # Public auth pages
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   ├── forgot-password/
│       │   │   └── reset-password/
│       │   ├── (main)/              # Protected app pages
│       │   │   ├── dashboard/       # Main dashboard with stats & charts
│       │   │   ├── assessment/      # Assessment landing, taking, results
│       │   │   ├── courses/         # Course list, detail, my-learning, recommended
│       │   │   ├── admin/users/     # User management (Admin only)
│       │   │   ├── staff-analysis/  # Staff analytics (Management)
│       │   │   ├── course-report/   # Course progress reports
│       │   │   ├── settings/        # Profile, password, appearance
│       │   │   └── recommended/     # AI-recommended courses
│       │   ├── api/auth/            # NextAuth route handler
│       │   └── api/[...path]/       # API proxy to Laravel
│       ├── components/
│       │   ├── charts/              # Recharts visualizations
│       │   ├── dashboard/           # Dashboard-specific components
│       │   ├── layout/              # AppShell, Sidebar, Header
│       │   ├── providers/           # ThemeProvider, RealtimeProvider
│       │   ├── shared/              # PermissionGate, OnlineIndicator
│       │   └── ui/                  # shadcn/ui components
│       ├── hooks/
│       │   ├── useApi.ts            # SWR hooks for all API calls
│       │   └── useRealtime.ts       # Socket.io hook
│       ├── lib/
│       │   ├── auth.ts              # NextAuth configuration
│       │   ├── axios.ts             # Axios instance with CSRF & interceptors
│       │   ├── constants.ts         # Competency framework definitions
│       │   ├── export.ts            # CSV export utilities
│       │   └── socket.ts            # Socket.io client setup
│       └── i18n/                    # Bilingual locale files (en/ms)
│
├── realtime/                         # Socket.io real-time server
│   └── src/index.js                 # Express + Socket.io + Redis subscriber
│
├── docker-compose.yml               # PostgreSQL + Redis containers
└── .env.example                     # Environment variables template
```

---

## Getting Started

### Prerequisites

- **PHP** >= 8.3
- **Node.js** >= 18
- **Composer** >= 2
- **Docker** & Docker Compose

### Environment Variables

**Root `.env` (for Docker Compose):**

```env
POSTGRES_DB=fyp_digital_skills
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Backend `backend/.env`:**

```env
APP_NAME="DSRS"
APP_ENV=local
APP_KEY=                           # Generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fyp_digital_skills
DB_USERNAME=postgres
DB_PASSWORD=postgres

SESSION_DRIVER=database
BROADCAST_CONNECTION=redis
QUEUE_CONNECTION=database

REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

GEMINI_API_KEY=                    # Google Gemini API key
GEMINI_MODEL=gemini-3.1-flash-lite

RECOMMENDATION_AB_TESTING=false    # Enable A/B testing for recommendation engine
RECOMMENDATION_CONTROL_RATIO=0.5   # Ratio of users in control group
```

**Frontend `frontend/.env.local`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Docker Setup

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432`
- **Redis 7** on port `6379`

### Backend Setup (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Update .env with your database credentials, then:
php artisan migrate --seed

# Build the user similarity matrix for collaborative filtering
php artisan recommendations:precompute --force

# Start the development server
php artisan serve
```

The API runs at `http://localhost:8000`.

### Frontend Setup (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:3000`.

### Real-time Server (Optional)

```bash
cd realtime

# Install dependencies
npm install

# Start the server
npm run dev
```

The real-time server runs at `http://localhost:3001`. Requires Redis to be running.

### Quick Start (All Services)

```bash
# Terminal 1 — Infrastructure
docker compose up -d

# Terminal 2 — Backend
cd backend && cp .env.example .env && php artisan key:generate
php artisan migrate --seed && php artisan serve

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev

# Terminal 4 — Real-time (optional)
cd realtime && npm install && npm run dev
```

Open **http://localhost:3000** and log in with a demo account.

---

## Demo Accounts

All accounts use the password: `pass123`

| Email | Role | Permissions |
|-------|------|-------------|
| admin01@test.com | Admin | Full access |
| staff01@test.com | Staff | Assessment only |
| mgmt01@test.com | Top Management | Reporting & analytics |
| trainer01@test.com | Trainer | Course management & assessment |

Additional demo users (staff02–staff07) are seeded with varied profiles, assessment results, and course enrollments for testing.

---

## Database Schema

### Core Models

```
User ──┬── hasMany ── AssessmentResponse (DSRI scores per attempt)
       ├── hasMany ── AssessmentDraft (in-progress assessments)
       ├── hasMany ── UserCourse (course enrollments + progress)
       ├── hasMany ── CourseRating (course ratings)
       ├── hasMany ── Notification (user notifications)
       ├── hasMany ── AiRecommendation (AI-generated insights)
       └── belongsToMany ── Role ── belongsToMany ── Permission

Course ──┬── hasMany ── UserCourse (enrollments)
         ├── hasMany ── CourseRating (ratings & reviews)
         ├── hasMany ── CourseCompetencyMapping (C1–C10 mappings)
         └── belongsTo ── User (creator)

Assessment ── hasMany ── AssessmentResponse
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Staff accounts with profile info |
| `roles` | Admin, Staff, Top Management, Trainer |
| `permissions` | Granular access control entries |
| `courses` | Training courses with bilingual content |
| `user_courses` | Enrollment tracking with progress & status |
| `assessments` | Assessment definitions |
| `assessment_responses` | Completed assessments with C1–C10 scores and DSRI |
| `assessment_drafts` | Auto-saved in-progress assessments |
| `course_competency_mappings` | Maps courses to competency categories (C1–C10) |
| `course_ratings` | User ratings (1–5 stars) with timestamps |
| `notifications` | System notifications with read status |
| `ai_recommendations` | AI-generated insights linked to assessment responses |
| `user_similarity_cache` | Precomputed pairwise user similarity scores for collaborative filtering |
| `recommendation_interactions` | Tracks impressions, clicks, enrollments for recommendation evaluation |

---

## API Documentation

### Base URL

```
http://localhost:8000/api
```

All protected endpoints require a valid Sanctum session cookie (obtained via `/login`).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and start session |
| `POST` | `/logout` | End session |
| `GET` | `/user` | Get current authenticated user |
| `PUT` | `/user/profile` | Update profile |
| `PUT` | `/user/password` | Change password |

### Assessment

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/assessment` | `take-assessment` | Get assessment overview |
| `GET` | `/assessment/start` | `take-assessment` | Get all questions |
| `POST` | `/assessment/submit` | `take-assessment` | Submit completed assessment |
| `GET` | `/assessment/results` | `take-assessment` | Get all past results |
| `GET` | `/assessment/draft` | `take-assessment` | Load saved draft |
| `POST` | `/assessment/draft` | `take-assessment` | Save draft |
| `DELETE` | `/assessment/draft` | `take-assessment` | Discard draft |

**Sample — Submit Assessment:**

```json
// POST /api/assessment/submit
{
  "assessment_id": 1,
  "answers": {
    "c1": [4, 3, 5],
    "c2": [2, 4, 3],
    "c3": [5, 4],
    "c4": [3, 2],
    "c5": [4, 4],
    "c6": [3, 5],
    "c7": [2, 3, 4],
    "c8": [1],
    "c9": [2, 3],
    "c10": [4, 3]
  }
}

// Response
{
  "dsri_score": 68.5,
  "category_scores": {
    "c1": { "score": 12, "max": 15, "percentage": 80 },
    "c2": { "score": 9, "max": 15, "percentage": 60 },
    "...": "..."
  },
  "weak_sections": ["C4", "C8", "C9"]
}
```

### Courses

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/courses` | auth | List all courses |
| `GET` | `/courses/recommended` | auth | AI-personalized recommendations |
| `POST` | `/courses/recommendations/track` | auth | Track recommendation interaction |
| `GET` | `/courses/{id}` | auth | Course detail |
| `POST` | `/courses/{id}/enroll` | auth | Enroll in course |
| `PUT` | `/courses/{id}/progress` | auth | Update progress |
| `POST` | `/courses/{id}/rate` | auth | Rate course (1–5) |
| `POST` | `/courses` | `course-management` | Create course |
| `PUT` | `/courses/{id}` | `course-management` | Update course |
| `DELETE` | `/courses/{id}` | `course-management` | Delete course |

**Sample — Recommended Courses:**

```json
// GET /api/courses/recommended
{
  "courses": [
    {
      "id": 3,
      "title": "Cybersecurity Fundamentals",
      "level": "beginner",
      "match_percentage": 75,
      "competency_codes": ["C5"],
      "ai_explanation": "Your Digital Safety score of 30% makes this course a priority...",
      "content_score": 0.82,
      "collaborative_score": 0.65,
      "hybrid_score": 0.76,
      "score_method": "hybrid",
      "peer_count": 7,
      "difficulty_match": 1.0,
      "competency_breakdown": [
        { "code": "C5", "name": "Digital Safety & Security", "user_pct": 30 }
      ]
    }
  ],
  "has_assessment": true,
  "weak_sections": ["C4", "C5", "C8"],
  "recommendation_method": "hybrid",
  "content_weight": 0.5,
  "collaborative_weight": 0.5,
  "total_peers": 7
}
```

### Reports

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/reports/staff-analysis` | `user-reporting` | Staff overview with DSRI stats |
| `GET` | `/reports/staff/{id}` | `user-reporting` | Individual staff detail |
| `GET` | `/reports/department-comparison` | `user-reporting` | Department comparison |
| `GET` | `/reports/course-progress` | `course-reporting` | Course enrollment & completion |

### Admin

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| `GET` | `/admin/users` | `user-management` | List all users |
| `POST` | `/admin/users` | `user-management` | Create user |
| `PUT` | `/admin/users/{id}` | `user-management` | Update user |
| `DELETE` | `/admin/users/{id}` | `user-management` | Deactivate user |
| `POST` | `/admin/users/{id}/assign-courses` | `user-management` | Assign courses to user |
| `DELETE` | `/admin/users/{id}/unassign-courses` | `user-management` | Unassign courses from user |

---

## Authentication Flow

The system uses **Laravel Sanctum SPA Authentication** proxied through Next.js:

```
Browser                     Next.js (3000)              Laravel (8000)
  │                             │                           │
  │  1. POST /login             │                           │
  │  (email, password)          │                           │
  │─────────────────────────────▶│  2. GET /sanctum/csrf    │
  │                             │──────────────────────────▶│
  │                             │  ◀─── Set CSRF cookie ───│
  │                             │  3. POST /api/login       │
  │                             │  (with CSRF token)        │
  │                             │──────────────────────────▶│
  │                             │  ◀─── Session cookie ────│
  │  ◀── Set session cookie ───│                           │
  │                             │                           │
  │  4. GET /api/courses        │                           │
  │  (with session cookie)      │                           │
  │─────────────────────────────▶│  5. Proxy to Laravel     │
  │                             │──────────────────────────▶│
  │                             │  ◀─── JSON response ─────│
  │  ◀── JSON data ────────────│                           │
```

1. Next.js fetches a CSRF cookie from Laravel's `/sanctum/csrf-cookie` endpoint
2. Frontend sends login credentials with the CSRF token to `/api/login`
3. Laravel validates credentials, creates a Sanctum session, and returns a session cookie
4. Next.js API routes proxy subsequent requests to Laravel, forwarding the session cookie
5. Laravel's `EnsureHasPermission` middleware checks authorization on protected routes

---

## DSRI Calculation

The **Digital Skills Readiness Index (DSRI)** is a weighted composite score (0–100) calculated from 10 competency categories:

```
DSRI = Σ (category_score / category_max_score × category_weight)
```

### Competency Framework

| Code | Category | Weight | Max Score | Questions |
|------|----------|--------|-----------|-----------|
| C1 | Digital Literacy | 15 | 75 | 15 questions (×5) |
| C2 | Digital Skills | 15 | 75 | 15 questions (×5) |
| C3 | Communication & Collaboration | 10 | 50 | 10 questions (×5) |
| C4 | Problem-Solving & Critical Thinking | 10 | 50 | 10 questions (×5) |
| C5 | Digital Safety & Security | 10 | 50 | 10 questions (×5) |
| C6 | Professional Development & Engagement | 10 | 50 | 10 questions (×5) |
| C7 | Digital Transformation & Governance | 11 | 55 | 11 questions (×5) |
| C8 | Digital Creation & Innovation | 4 | 20 | 4 questions (×5) |
| C9 | Digital Ethics & Inclusion | 5 | 25 | 5 questions (×5) |
| C10 | Functional Skills & Applications | 10 | 50 | 10 questions (×5) |

**Total: 100 points maximum**

The calculation is implemented in `DsriCalculationService.php`. Categories scoring below 50% are flagged as "weak sections" and used to drive course recommendations.

---

## Course Recommendation System

The system uses a **hybrid recommendation engine** combining three layers:

### Content-Based Filtering
- Builds a **deficit vector** for the user: `D[Ci] = 1.0 - (score / max_score)` for each competency
- Builds a **coverage vector** for each course: `V[Ci] = 1.0` if the course maps to that competency
- Computes **cosine similarity** between the two vectors
- Applies a **difficulty factor** based on DSRI level vs course level (e.g. advanced courses penalized for beginners)
- Produces a continuous 0–1 score — no binary weak/not-weak cutoff

### Collaborative Filtering
- Computes **cosine similarity** between users' normalized competency score vectors
- Similarity matrix is **precomputed daily** via `php artisan recommendations:precompute` and stored in `user_similarity_cache`
- For each candidate course, computes a **weighted average of ratings** from similar users
- Handles cold start: users without assessments or with fewer than 3 similar peers get no collaborative contribution

### Hybrid Merging
- Uses **adaptive weights** based on peer availability:
  - < 3 similar peers → 100% content-based
  - 3–9 similar peers → linear blend ramping up to 50% collaborative
  - 10+ similar peers → 50/50 split
- Final score: `hybrid = w_content × content_score + w_collab × collab_score`

### AI Explanations
- Gemini generates personalized explanations referencing the user's specific scores and peer data
- Cached for 12 hours per course + user combination

```
Request → HybridRecommendationService
              ├── ContentBasedRecommendationService (cosine similarity + difficulty factor)
              ├── CollaborativeFilteringService (user-user CF from precomputed similarity)
              ├── adaptive weight blending
              └── AiInsightService (enhanced explanations)
         → Cached JSON response (6h TTL)
```

### Artisan Commands

```bash
php artisan recommendations:precompute        # Build user similarity matrix (scheduled daily at 02:00)
php artisan recommendations:precompute --force # Force full recomputation
```

### A/B Testing

Set `RECOMMENDATION_AB_TESTING=true` in `.env` to enable. Users are deterministically assigned to `control` (old binary algorithm) or `hybrid` group. Interaction events are tracked in the `recommendation_interactions` table for measuring CTR, click-to-enroll rate, and completion rate per group.

---

## AI Integration

The system integrates with **Google Gemini 3.1 Flash Lite** for four AI-powered features:

| Feature | Trigger | Output |
|---------|---------|--------|
| **Personalized Insights** | Assessment submitted | Narrative analysis of strengths and weaknesses |
| **Course Explanations** | Recommendation page loaded | Personalized explanation referencing scores and peer data |
| **Department Analysis** | Manager views reports | Department-wide skill gap narrative |
| **Skill Gap Prediction** | Historical data available | Predicted future skill development needs |
| **Learning Path** | AI Insights page | Step-by-step course sequence with timelines |
| **Peer Comparison** | AI Insights page | How user compares to colleagues in same field |
| **Assessment Readiness** | AI Insights page | Whether user should retake the assessment |

**Implementation:** `AiInsightService.php` sends contextual prompts to the Gemini API. Responses are cached for 3–12 hours to avoid redundant API calls.

> **Note:** AI features require a valid `GEMINI_API_KEY` in the backend `.env`. Without it, the system functions normally but AI-powered features return fallback content.

---

## Roles & Permissions

### Role Access Matrix

| Feature | Admin | Staff | Top Management | Trainer |
|---------|-------|-------|----------------|---------|
| Dashboard | Yes | Yes | Yes | Yes |
| Take Assessment | Yes | Yes | — | Yes |
| View Own Results | Yes | Yes | — | Yes |
| Recommended Courses | Yes | Yes | — | Yes |
| My Learning | Yes | Yes | — | Yes |
| Manage Courses | Yes | — | — | Yes |
| Create / Edit Course | Yes | — | — | Yes |
| User Reporting | Yes | — | Yes | — |
| Course Reporting | Yes | — | Yes | Yes |
| Staff Analysis | Yes | — | Yes | — |
| User Management | Yes | — | — | — |
| Settings | Yes | Yes | Yes | Yes |

### Permissions per Role

| Role | Permissions |
|------|------------|
| **Admin** | `user-management`, `course-management`, `take-assessment`, `user-reporting`, `course-reporting` |
| **Staff** | `take-assessment` |
| **Top Management** | `user-reporting`, `course-reporting` |
| **Trainer** | `course-management`, `take-assessment`, `course-reporting` |

---

## Localization

The system supports **bilingual content**:

- **English** (`en`) — default
- **Bahasa Melayu** (`ms`) — Malaysian national language

Courses store both `title`/`title_bm` and `description`/`description_bm` fields. UI string translations are managed in `frontend/src/i18n/locales/`. Users can switch their preferred language via Settings.

---

## Future Improvements

- **Mobile-responsive optimization** — Enhanced mobile experience for field staff
- **Advanced analytics** — ML-based predictive modeling for skill development
- **Integration with HR systems** — Sync with government HR databases (HRMIS)
- **Certificate generation** — Auto-generated certificates upon course completion
- **Gamification** — Badges, leaderboards, and achievement tracking
- **Offline assessment** — PWA-based offline assessment capability
- **Multi-tenancy** — Support for multiple government agencies
- **Assessment validation** — Manager verification of self-assessed scores

---

## License

This project is developed as part of a Final Year Project (FYP) for academic purposes. All rights reserved.
