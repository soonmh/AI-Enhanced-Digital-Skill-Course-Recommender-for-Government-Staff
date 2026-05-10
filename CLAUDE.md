# CLAUDE.md

## Project

Digital Skills Readiness Assessment — a full-stack web application for assessing and improving digital skills readiness. FYP-1 project.

Monorepo with `backend/` (Laravel API) and `frontend/` (Next.js).

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Axios, SWR, NextAuth.js, Shadcn/ui
- **Backend:** Laravel 11, Sanctum (SPA auth), Eloquent ORM
- **Database:** PostgreSQL
- **AI (scaffolded):** Service class only — `backend/app/Services/AiInsightService.php`
- **Future Phase 2:** Node.js + Express + Socket.io (port 3001) — `realtime/` directory

## Running Locally

1. `docker compose up -d` — PostgreSQL
2. `cd backend && cp .env.example .env && php artisan key:generate && php artisan migrate --seed && php artisan serve`
3. `cd frontend && npm install && npm run dev`
4. Open http://localhost:3000

## Demo Accounts

Password: `pass123`

| Email | Role |
|-------|------|
| admin01@test.com | Admin |
| staff01@test.com | Staff |
| mgmt01@test.com | Top Management |
| trainer01@test.com | Trainer |

## Roles & Permissions

| Role | Permissions |
|------|------------|
| Admin | user-management, course-management, take-assessment, user-reporting, course-reporting |
| Staff | take-assessment |
| Top Management | user-reporting, course-reporting |
| Trainer | course-management, take-assessment, course-reporting |

## Competency Framework (C1–C10)

DSRI = Σ (cN_score / cN_max_score × cN_weight). Max DSRI = 100.

| Code | Category | Weight | Max |
|------|----------|--------|-----|
| C1 | Digital Literacy | 15 | 75 |
| C2 | Digital Skills | 15 | 75 |
| C3 | Communication & Collaboration | 10 | 50 |
| C4 | Problem-Solving & Critical Thinking | 10 | 50 |
| C5 | Digital Safety & Security | 10 | 50 |
| C6 | Professional Development & Engagement | 10 | 50 |
| C7 | Digital Transformation & Governance | 11 | 55 |
| C8 | Digital Creation & Innovation | 4 | 20 |
| C9 | Digital Ethics & Inclusion | 5 | 25 |
| C10 | Functional Skills & Applications | 10 | 50 |

## Key Backend Files

- `backend/app/Services/DsriCalculationService.php` — DSRI scoring logic
- `backend/app/Http/Middleware/EnsureHasPermission.php` — permission middleware
- `backend/routes/api.php` — all API routes
- `backend/database/seeders/` — demo data

## Key Frontend Files

- `frontend/src/lib/auth.ts` — NextAuth config (CredentialsProvider → Sanctum)
- `frontend/src/lib/axios.ts` — Axios with CSRF + 401 interceptor
- `frontend/src/hooks/useApi.ts` — SWR hooks for all API calls
- `frontend/src/lib/constants.ts` — competency definitions
- `frontend/src/middleware.ts` — route protection
- `frontend/src/i18n/` — bilingual support (en/ms)

## Localization

Bilingual: English (`en`) and Bahasa Melayu (`ms`). UI strings in `src/i18n/locales/`. Courses have `title`/`title_bm` fields.

## Constraints

- Minimal code changes only
- No unrelated edits
- No automatic refactors
- No formatting outside touched lines
- No dependency upgrades
- No file moves/renames
- Ask before architectural changes
- Preserve backward compatibility

## Coding Principles

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Workflow

1. Analyze task
2. List files to modify
3. Wait for approval if scope expands
4. Implement smallest possible fix
5. Provide concise diff summary
