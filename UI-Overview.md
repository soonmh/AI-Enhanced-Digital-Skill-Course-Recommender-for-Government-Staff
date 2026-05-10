# Digital Skills Readiness Assessment — UI Overview

Static offline mirror of a Laravel + Inertia.js + Vue.js web application.
Source: `https://honeydew-squirrel-438862.hostingersite.com/`

---

## Platform Purpose

An organizational tool for **assessing and improving digital skills readiness** of staff members. Built for a Malaysian government/public sector context (bilingual English/Malay, references Malaysia's "Rakyat Digital" initiative at `rakyatdigital.gov.my`).

The platform measures readiness across **10 digital competency areas** and produces a **Digital Skills Readiness Index (DSRI)** score.

---

## Digital Competency Framework (C1–C10)

| Code | Competency                          | Weight | Max Score |
|------|-------------------------------------|--------|-----------|
| C1   | Digital Literacy                    | 15%    | 75        |
| C2   | Digital Skills                      | 15%    | 75        |
| C3   | Communication & Collaboration       | 10%    | 50        |
| C4   | Problem-Solving & Critical Thinking | 10%    | 50        |
| C5   | Digital Safety & Security           | 10%    | 50        |
| C6   | Professional Development & Engagement | 10%  | 50        |
| C7   | Digital Transformation & Governance | 11%   | 55        |
| C8   | Digital Creation & Innovation       | 4%     | 20        |
| C9   | Digital Ethics & Inclusion          | 5%     | 25        |
| C10  | Functional Skills & Applications    | 10%    | 50        |

Total DSRI is calculated out of a maximum of **500 points** (weighted).

---

## User Roles & Permissions

### Admin
- **Permissions:** `user-management`, `course-management`, `take-assessment`, `user-reporting`, `course-reporting`
- **Pages:** Dashboard, Courses (list/create/edit/play), User Management (list/create/edit/delete), User Report, Staff Analysis, Course Report, Settings

### Staff
- **Permissions:** `take-assessment`
- **Pages:** Dashboard, Assessment (landing/start/results), Courses (recommended/detail/play), Settings

### Top Management
- **Permissions:** `user-reporting`, `course-reporting`
- **Pages:** Dashboard, User Report, Staff Analysis (individual drill-down), Course Report (progress), Settings

### Trainer
- **Permissions:** `course-management`, `take-assessment`, `course-reporting`
- **Pages:** Dashboard, Courses (list/create/edit/play/recommended), Course Report (progress), Settings

---

## Demo Accounts

| Email                | Role            |
|----------------------|-----------------|
| admin01@test.com     | Admin           |
| staff01@test.com     | Staff           |
| mgmt01@test.com      | Top Management  |
| trainer01@test.com   | Trainer         |

Password: `pass123`

---

## Page-by-Page Breakdown

### Public Pages (`public/`)

| Page               | Component  | Description                                              |
|--------------------|------------|----------------------------------------------------------|
| Landing / Home     | `Welcome`  | Public landing page with app name and motivational quote |
| Login              | `Login`    | Email/password login form                                |
| Register           | `Register` | Registration form (name, email, password, working field, job level, experience years) |
| Forgot Password    | `ForgotPassword` | Password reset request form                        |

### Dashboard (`*/dashboard.html`)

Component: `Dashboard`

- **DSRI Score Card** — latest Digital Skills Readiness Index
- **Assessment History Chart** — line/bar graph of DSRI scores over time
- **Stats Summary** — total assessments taken, latest score, average score, courses in progress
- **Recommended Courses** — paginated list based on weak competency areas
- **Enrolled Courses** — courses the user has started with progress tracking

### Assessment Flow

| Page              | Component           | Description                                           |
|-------------------|---------------------|-------------------------------------------------------|
| Assessment Landing | `Assessment/Landing` | Introduction page explaining the assessment          |
| Assessment Start  | `Assessment/Start`  | Question-by-question assessment interface (requires live API) |
| Assessment Results | `Assessment/Results` | DSRI score display, 10-category breakdown with percentages, full submission history table |

Assessment results include per-category:
- Raw score and max score
- Score percentage
- Section weight

### Courses

| Page              | Component       | Description                                          |
|-------------------|-----------------|------------------------------------------------------|
| Course List       | `ListCourse`    | Paginated table of all courses with title, level, description |
| Course Create     | `CreateCourse`  | Form to create a new course (title, description, URL, level, bilingual fields) |
| Course Edit       | `EditCourse`    | Edit existing course details + manage competency mappings |
| Course Detail     | —               | Course overview with enrollment button               |
| Course Play       | —               | Video-based course player with progress tracking     |
| Recommended Courses | —             | Courses mapped to user's weak assessment categories  |

**Referenced courses:**
- CyberSAFE® for Citizens (`rakyatdigital.gov.my/courses/cybersafe-untuk-rakyat`)
- AI for Citizens / AI untuk Rakyat (`rakyatdigital.gov.my/courses/ai-untuk-rakyat`)
- Cloud for Citizens / Pengkomputeran Awan untuk Rakyat (`rakyatdigital.gov.my`)

### User Management (Admin only)

| Page              | Component | Description                               |
|-------------------|-----------|-------------------------------------------|
| Users List        | —         | Table of all users with name, email, role, status |
| Create User       | —         | Form with name, email, password, role assignment |
| Edit User         | —         | Edit user details, change role, reset password |

### Reporting & Analytics

| Page              | Component         | Description                                          |
|-------------------|-------------------|------------------------------------------------------|
| User Report       | —                 | Aggregated table of all staff with DSRI scores and completion status |
| Staff Analysis    | `StaffAnalysis`   | Detailed staff listing with drill-down to individual reports |
| Staff Report      | —                 | Individual staff: full assessment history, score trends, actions (send reminder, assign course, schedule check-in, export report) |
| Course Report     | —                 | Aggregated course completion and enrollment data     |
| Course Progress   | `CourseProgress`  | Detailed per-course progress tracking across all enrolled staff |

### Settings

| Page              | Component      | Description                                     |
|-------------------|----------------|-------------------------------------------------|
| Profile           | `Profile`      | Edit name, email, working field, job level, experience years |
| Password          | `ConfirmPassword` | Change password                              |
| Appearance        | `Appearance`   | Toggle language (English / Malay)               |

---

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| Backend      | Laravel (PHP)           |
| Frontend     | Vue.js via Inertia.js   |
| Build Tool   | Vite (91+ JS chunks)    |
| Routing      | Ziggy (Laravel routes → JS) |
| Auth         | Laravel Sanctum         |
| UI Framework | Shadcn-vue (Card, AlertDialog, Button, Input, Label, etc.) |
| Font         | Instrument Sans (Bunny Fonts) |

---

## Project File Structure

```
fyp1/
├── index.html              # Navigator / site map
├── README.md               # Setup & usage instructions
├── start.bat / start.sh    # Local server launch scripts
├── public/                 # Unauthenticated pages (landing, login, register, forgot-password)
├── admin/                  # Admin role pages
├── staff/                  # Staff role pages
├── mgmt/                   # Top Management role pages
├── trainer/                # Trainer role pages
├── build/                  # Vite-built CSS + JS assets
│   ├── manifest.json
│   └── assets/             # Vue component chunks (Dashboard-*.js, ListCourse-*.js, etc.)
├── inertia-json/           # Raw Inertia props (component name + data) per role/page
├── _offline/               # Client-side router (router.js) linking static pages
├── cookies/                # Session cookies used by scrape scripts
├── scrape.py               # Main scraper (login per role, save HTML + Inertia JSON)
├── scrape_extras.py        # Scrape course detail / user edit / staff report pages
├── fix_assets.py           # Pull Vite manifest, download assets, restructure
├── fix_ziggy.py            # Strip live origin from inline Ziggy config
├── inject_router.py        # Inject _offline/router.js into every HTML file
├── audit_links.py          # Verify all navigation targets resolve locally
└── rewrite_for_offline.py  # Rewrite URLs for offline use
```

---

## Localization

The platform supports **bilingual content**:
- **English (en)** — default
- **Bahasa Melayu (ms)** — Malay

Courses have bilingual fields (`title` / `title_bm`, `description` / `description_bm`). The locale can be switched in Settings > Appearance.

---

## Static Mirror Limitations

- Forms (create course, edit user, submit assessment) are **disabled** — they show a toast instead of POSTing
- Assessment Start page cannot load actual questions (requires live `/api/assessment/*` endpoints)
- Course playback won't run (live site requires `POST /courses/{id}/start` first)
- Fonts load from `fonts.bunny.net` — offline fallback to system fonts
