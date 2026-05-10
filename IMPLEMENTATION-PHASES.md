# Implementation Phases — Digital Skills Readiness Assessment

## Phase 1: Foundation (COMPLETED)

Auth, Dashboard, Assessment, Settings — fully implemented and building.

### What was built
- Laravel 11 backend with PostgreSQL + Sanctum SPA auth
- 10 database migrations, 8 Eloquent models
- Auth flow (register, login, logout, forgot-password, reset-password)
- Dashboard with DSRI score, stats, competency breakdown, assessment history
- Assessment flow (landing → multi-section quiz → submit → results)
- DSRI Calculation Service with verified weighted formula
- Settings (profile edit, password change, language switcher)
- Next.js 14 frontend with NextAuth, SWR, Shadcn/ui, Tailwind CSS
- Permission-based sidebar navigation
- Bilingual support (English / Bahasa Melayu)
- Seeders with 4 demo accounts, 8 courses, sample assessment data
- AI service scaffold (method signatures only, no implementation)

---

## Phase 2: Courses

**Goal:** Full course management, enrollment, progress tracking, and personalized recommendations.

### Backend — New Files

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Api/CourseController.php` | CRUD: index (paginated list), store, show, update, destroy, recommended |
| `app/Http/Controllers/Api/UserCourseController.php` | enroll (start course), updateProgress, complete |
| `app/Http/Controllers/Api/CourseRatingController.php` | submit course rating |
| `app/Http/Requests/UpdateCourseRequest.php` | Validation for course edit |
| `app/Http/Requests/StoreUserCourseRequest.php` | Validation for enrollment |
| `app/Services/CourseRecommendationService.php` | Match weak assessment categories to courses via competency mappings |

### Backend — New API Routes

```
GET    /api/courses                              → CourseController@index         (paginated, 12/page)
POST   /api/courses                              → CourseController@store         (permission: course-management)
GET    /api/courses/recommended                  → CourseController@recommended   (based on weak DSRI areas)
GET    /api/courses/{id}                         → CourseController@show
PUT    /api/courses/{id}                         → CourseController@update        (permission: course-management)
DELETE /api/courses/{id}                         → CourseController@destroy       (permission: course-management)
POST   /api/courses/{id}/start                   → UserCourseController@enroll
PUT    /api/courses/{id}/progress                → UserCourseController@updateProgress
POST   /api/courses/{id}/rating                  → CourseRatingController@store
POST   /api/courses/{id}/mappings                → CourseController@addMapping    (permission: course-management)
DELETE /api/courses/{id}/mappings/{mappingId}    → CourseController@deleteMapping (permission: course-management)
```

### Backend — CourseRecommendationService Logic

1. Get user's latest assessment response
2. Calculate percentage score for each competency (cN_score / cN_max_score)
3. Sort competencies by score ascending (weakest first)
4. Query `course_competency_mappings` for courses mapped to the weakest categories
5. Exclude courses the user has already enrolled in
6. Return paginated results ordered by relevance

### Frontend — New Pages

| Route | File | Description |
|-------|------|-------------|
| `/courses` | `(main)/courses/page.tsx` | Paginated course list with search/filter |
| `/courses/create` | `(main)/courses/create/page.tsx` | Course creation form (permission-gated) |
| `/courses/recommended` | `(main)/courses/recommended/page.tsx` | Recommended courses based on assessment |
| `/courses/[id]` | `(main)/courses/[id]/page.tsx` | Course detail with enrollment button |
| `/courses/[id]/edit` | `(main)/courses/[id]/edit/page.tsx` | Course edit form (permission-gated) |
| `/courses/[id]/play` | `(main)/courses/[id]/play/page.tsx` | Course player with progress tracking |

### Frontend — New Components

| Component | Purpose |
|-----------|---------|
| `components/courses/CourseCard.tsx` | Card displaying course title, level, description, bilingual |
| `components/courses/CourseForm.tsx` | Shared form for create/edit with bilingual fields + competency mapping |
| `components/courses/CoursePlayer.tsx` | External URL iframe or embedded video with progress bar |
| `components/courses/CompetencyMappingManager.tsx` | UI to add/remove C1-C10 mappings on a course |

### Frontend — New SWR Hooks

```ts
// hooks/useApi.ts additions
useCourses(page: number)                    // GET /api/courses?page=N
useCourse(id: number)                       // GET /api/courses/{id}
useRecommendedCourses()                     // GET /api/courses/recommended
enrollInCourse(courseId: number)            // POST /api/courses/{id}/start
updateCourseProgress(courseId, progress)    // PUT /api/courses/{id}/progress
rateCourse(courseId, rating)                // POST /api/courses/{id}/rating
createCourse(data)                          // POST /api/courses
updateCourse(id, data)                      // PUT /api/courses/{id}
deleteCourse(id)                            // DELETE /api/courses/{id}
```

### Frontend — New Types

```ts
interface CourseForm {
  title: string;
  description: string;
  url?: string;
  level: "beginner" | "intermediate" | "advanced";
  title_bm?: string;
  description_bm?: string;
  competency_codes?: string[];
}
```

### Verification Checklist
- [ ] Admin/Trainer can create a course with bilingual fields and competency mappings
- [ ] Staff can view course list and enroll in a course
- [ ] Course player shows progress bar that updates
- [ ] Recommended courses page shows courses matching weak assessment areas
- [ ] Trainer can edit their own courses
- [ ] Admin can delete any course

---

## Phase 3: Reports + Admin

**Goal:** All reporting dashboards, staff analysis, and user management.

### Backend — New Files

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Api/Admin/UserController.php` | CRUD for user management |
| `app/Http/Controllers/Api/Report/UserReportController.php` | Aggregated DSRI scores per user |
| `app/Http/Controllers/Api/Report/StaffAnalysisController.php` | Individual staff drill-down with actions |
| `app/Http/Controllers/Api/Report/CourseReportController.php` | Course progress and enrollment stats |
| `app/Http/Requests/StoreUserRequest.php` | Validation for admin creating users |
| `app/Http/Requests/UpdateUserRequest.php` | Validation for admin editing users |
| `app/Http/Resources/StaffAnalysisResource.php` | Transforms staff data for analysis view |
| `app/Http/Resources/CourseProgressResource.php` | Transforms course progress data |
| `app/Services/StaffAnalysisService.php` | Computes risk levels, performance scores, trends |

### Backend — New API Routes

```
# Admin User Management (permission: user-management)
GET    /api/admin/users                         → Admin\UserController@index       (paginated, 10/page)
POST   /api/admin/users                         → Admin\UserController@store
GET    /api/admin/users/{id}                    → Admin\UserController@show
PUT    /api/admin/users/{id}                    → Admin\UserController@update
DELETE /api/admin/users/{id}                    → Admin\UserController@destroy

# User Report (permission: user-reporting)
GET    /api/reports/users                       → UserReportController@index

# Staff Analysis (permission: user-reporting)
GET    /api/reports/staff-analysis              → StaffAnalysisController@index        (paginated list + overview stats)
GET    /api/reports/staff-analysis/{id}         → StaffAnalysisController@show         (individual drill-down)
GET    /api/reports/staff-analysis/{id}/export  → StaffAnalysisController@exportIndividual (PDF/CSV)
GET    /api/reports/staff-analysis/export       → StaffAnalysisController@exportAll    (bulk export)
POST   /api/reports/staff-analysis/{id}/reminder → StaffAnalysisController@sendReminder (email notification)
POST   /api/reports/staff-analysis/{id}/assign  → StaffAnalysisController@assignCourse (auto-enroll)
POST   /api/reports/staff-analysis/{id}/checkin → StaffAnalysisController@scheduleCheckin (calendar event)

# Course Report (permission: course-reporting)
GET    /api/reports/courses                     → CourseReportController@index         (aggregated stats)
GET    /api/reports/courses/progress            → CourseReportController@progress      (per-course per-user progress)
```

### Backend — StaffAnalysisService Logic

1. **Overview stats**: total staff, average DSRI, completion rate, at-risk count
2. **Individual staff report**:
   - Full assessment history with trend line
   - Risk level classification: High (DSRI < 40), Medium (40-70), Low (> 70)
   - Performance score relative to team average
   - Weak competency areas identified
   - Recommended courses based on gaps
3. **Field performance breakdown**: average DSRI by `working_field`
4. **Completion trends**: assessment completion rate over time (monthly)
5. **Actions**: send reminder email, auto-assign course, schedule check-in

### Frontend — New Pages

| Route | File | Description |
|-------|------|-------------|
| `/admin/users` | `(main)/admin/users/page.tsx` | User list with role badges, create/delete |
| `/admin/users/create` | `(main)/admin/users/create/page.tsx` | Create user form with role assignment |
| `/admin/users/[id]/edit` | `(main)/admin/users/[id]/edit/page.tsx` | Edit user form |
| `/reports/users` | `(main)/reports/users/page.tsx` | User report table with DSRI scores |
| `/reports/staff-analysis` | `(main)/reports/staff-analysis/page.tsx` | Staff analysis with filters and overview stats |
| `/reports/staff-analysis/[id]` | `(main)/reports/staff-analysis/[id]/page.tsx` | Individual staff drill-down |
| `/reports/courses` | `(main)/reports/courses/page.tsx` | Course report with aggregated stats |
| `/reports/courses/progress` | `(main)/reports/courses/progress/page.tsx` | Per-course progress table |

### Frontend — New Components

| Component | Purpose |
|-----------|---------|
| `components/reports/UserReportTable.tsx` | Sortable table of users with DSRI scores and status |
| `components/reports/StaffAnalysisTable.tsx` | Paginated staff list with risk level badges |
| `components/reports/StaffReportCard.tsx` | Individual staff: history chart, competency radar, action buttons |
| `components/reports/CourseProgressTable.tsx` | Per-course table showing each user's progress |
| `components/admin/UserForm.tsx` | Create/edit user form with role/permission assignment |
| `components/admin/UserTable.tsx` | User management table with actions |

### Frontend — New SWR Hooks

```ts
useUsers(page)                             // GET /api/admin/users?page=N
createUser(data)                           // POST /api/admin/users
updateUser(id, data)                       // PUT /api/admin/users/{id}
deleteUser(id)                             // DELETE /api/admin/users/{id}
useUserReport()                            // GET /api/reports/users
useStaffAnalysis(page?)                    // GET /api/reports/staff-analysis
useStaffReport(id)                         // GET /api/reports/staff-analysis/{id}
exportStaffReport(id)                      // GET /api/reports/staff-analysis/{id}/export
sendReminder(id)                           // POST /api/reports/staff-analysis/{id}/reminder
assignCourse(staffId, courseId)            // POST /api/reports/staff-analysis/{id}/assign
scheduleCheckin(id, date)                  // POST /api/reports/staff-analysis/{id}/checkin
useCourseReport()                          // GET /api/reports/courses
useCourseProgress()                        // GET /api/reports/courses/progress
```

### Verification Checklist
- [ ] Admin can create/edit/delete users with role assignment
- [ ] Admin/Management can view user report with all staff DSRI scores
- [ ] Staff analysis page shows overview stats and paginated staff list
- [ ] Individual staff report shows assessment history, risk level, weak areas
- [ ] Management can send reminders, assign courses, schedule check-ins
- [ ] Course report shows enrollment and completion stats
- [ ] Course progress page shows per-user progress for each course

---

## Phase 4: Polish + Future Prep

**Goal:** Final QA, optional AI integration, and Phase 2 realtime preparation.

### AI Integration (Optional)

The `AiInsightService` scaffold exists at `backend/app/Services/AiInsightService.php`. If implemented:

1. Add `composer require guzzlehttp/guzzle` (likely already installed with Laravel)
2. Add to `.env`: `ANTHROPIC_API_KEY=sk-...` or `OPENAI_API_KEY=sk-...`
3. Implement the three methods:
   - `generateRecommendations(AssessmentResponse $response)` — analyze assessment scores, suggest specific learning paths
   - `analyzeStaffPerformance(Collection $staffData)` — generate team-level insights
   - `predictSkillGaps(User $user)` — forecast future skill needs based on trends
4. Use Laravel Queues (already configured with `database` driver) for background AI calls
5. Add a `POST /api/ai/insights` endpoint that dispatches a queued job

### Realtime Layer (Phase 2 — Optional)

The `realtime/` directory structure (not created yet):

```
realtime/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # Express + Socket.io server on port 3001
    └── events.ts         # Event type definitions
```

**Integration strategy:**
- Node.js server validates tokens issued by Laravel Sanctum
- Frontend connects conditionally via `NEXT_PUBLIC_ENABLE_REALTIME=true` feature flag
- Shares the same PostgreSQL database
- Events: `assessment.submitted`, `course.progress.updated`, `user.reminder.sent`, `notification.new`
- Adding/removing `realtime/` has zero impact on `frontend/` or `backend/`

### Polish Tasks

- [ ] Add chart library (e.g., recharts or chart.js) for dashboard assessment history graph
- [ ] Add loading skeletons for all pages
- [ ] Add toast notifications for form submissions (sonner or react-hot-toast)
- [ ] Add responsive mobile layout (collapsible sidebar)
- [ ] Add export buttons (CSV download) on report pages
- [ ] Write Laravel feature tests for auth, assessment, and permission middleware
- [ ] Write Jest/Vitest tests for frontend components and hooks
- [ ] Add `.github/CI.yml` for automated testing
- [ ] Production deployment guide (Nginx + PM2 + PostgreSQL)
