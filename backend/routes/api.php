<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\AssessmentDraftController;
use App\Http\Controllers\Api\AiInsightController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Public certificate verification
Route::get('/c/verify/{code}', [CertificateController::class, 'verify']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/benchmark', [DashboardController::class, 'benchmark']);

    // Manager — my team
    Route::get('/reports/my-team', [ReportController::class, 'myTeam']);
    Route::get('/reports/team-member/{id}', [ReportController::class, 'teamMemberReport']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // Online users
    Route::get('/online-users', function () {
        $userIds = Illuminate\Support\Facades\Redis::smembers('online_users');
        return response()->json(['user_ids' => array_map('intval', $userIds)]);
    });

    // AI Insights
    Route::get('/ai/insights', [AiInsightController::class, 'personalInsights']);
    Route::get('/ai/learning-path', [AiInsightController::class, 'learningPath']);
    Route::get('/ai/peer-comparison', [AiInsightController::class, 'peerComparison']);
    Route::get('/ai/readiness', [AiInsightController::class, 'readinessCheck']);
    Route::get('/ai/action-plan', [AiInsightController::class, 'actionPlan']);
    Route::middleware('permission:user-reporting')->group(function () {
        Route::get('/ai/department-insights', [AiInsightController::class, 'departmentInsights']);
    });

    // Settings
    Route::put('/user/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/user/password', [SettingsController::class, 'updatePassword']);
    Route::put('/user/language', [SettingsController::class, 'updateLanguage']);

    // Assessment
    Route::middleware('permission:take-assessment')->group(function () {
        Route::get('/assessment', [AssessmentController::class, 'landing']);
        Route::get('/assessment/start', [AssessmentController::class, 'start']);
        Route::post('/assessment/submit', [AssessmentController::class, 'submit']);
        Route::post('/assessment/submit-section', [AssessmentController::class, 'submitSection']);
        Route::get('/assessment/results', [AssessmentController::class, 'results']);
        Route::get('/assessment/role-profiles', [AssessmentController::class, 'roleProfiles']);
        Route::post('/assessment/role-gap', [AssessmentController::class, 'roleGap']);

        // Assessment drafts
        Route::get('/assessment/draft', [AssessmentDraftController::class, 'show']);
        Route::post('/assessment/draft', [AssessmentDraftController::class, 'save']);
        Route::delete('/assessment/draft', [AssessmentDraftController::class, 'destroy']);
    });

    // Courses
    Route::get('/courses', [CourseController::class, 'list']);
    Route::get('/courses/recommended', [CourseController::class, 'recommended']);
    Route::post('/courses/recommendations/track', [CourseController::class, 'trackInteraction']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::post('/courses/{id}/enroll', [CourseController::class, 'enroll']);
    Route::post('/courses/{id}/rate', [CourseController::class, 'rate']);
    Route::put('/courses/{id}/progress', [CourseController::class, 'updateProgress']);

    // Course management (CRUD)
    Route::middleware('permission:course-management')->group(function () {
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{id}', [CourseController::class, 'update']);
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    });

    // Reports
    Route::middleware('permission:user-reporting')->group(function () {
        Route::get('/reports/staff-analysis', [ReportController::class, 'staffAnalysis']);
        Route::get('/reports/staff/{id}', [ReportController::class, 'staffReport']);
        Route::get('/reports/department-comparison', [ReportController::class, 'departmentComparison']);
    });

    Route::middleware('permission:course-reporting')->group(function () {
        Route::get('/reports/course-progress', [ReportController::class, 'courseProgress']);
    });

    // Admin - User management
    Route::middleware('permission:user-management')->group(function () {
        Route::get('/admin/users', [AdminController::class, 'users']);
        Route::post('/admin/users', [AdminController::class, 'storeUser']);
        Route::get('/admin/users/{id}/assigned-courses', [AdminController::class, 'assignedCourses']);
        Route::post('/admin/users/{id}/assign-courses', [AdminController::class, 'assignCourses']);
        Route::delete('/admin/users/{id}/unassign-courses', [AdminController::class, 'unassignCourses']);
        Route::get('/admin/courses/{id}/assigned-users', [AdminController::class, 'assignedUsers']);
        Route::post('/admin/courses/{id}/assign-users', [AdminController::class, 'assignUsers']);
        Route::delete('/admin/courses/{id}/unassign-users', [AdminController::class, 'unassignUsers']);
        Route::put('/admin/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/admin/users/{id}', [AdminController::class, 'destroyUser']);
    });
});
