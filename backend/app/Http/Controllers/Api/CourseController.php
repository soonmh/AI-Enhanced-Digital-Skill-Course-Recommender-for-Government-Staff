<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCourseRequest;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\UserCourse;
use App\Events\CourseCompleted;
use App\Models\RecommendationInteraction;
use App\Services\CourseProfileService;
use App\Services\HybridRecommendationService;
use App\Services\RealtimePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(
        private HybridRecommendationService $hybridService,
        private CourseProfileService $profileService,
    ) {}
    public function index(Request $request): JsonResponse
    {
        $query = Course::with('creator', 'enrollments');

        if ($request->filled('working_field')) {
            $query->where('working_field', $request->working_field);
        }
        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                  ->orWhere('title_bm', 'ilike', "%{$search}%");
            });
        }

        $courses = $query->orderByDesc('created_at')->paginate($request->per_page ?? 15);

        $courses->getCollection()->transform(function ($course) {
            $course->enrollment_count = $course->enrollments->count();
            return $course;
        });

        return response()->json($courses);
    }

    public function list(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Course::with('creator')
            ->withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings');

        if ($request->filled('competency_code')) {
            $courseIds = \App\Models\CourseCompetencyMapping::where('competency_code', $request->competency_code)
                ->pluck('course_id');
            $query->whereIn('id', $courseIds);
        }

        // Get user's enrolled courses with progress
        $userEnrollments = [];
        if ($user) {
            $userEnrollments = UserCourse::where('user_id', $user->id)
                ->get()
                ->keyBy('course_id');
        }

        $courses = $query->orderByDesc('created_at')
            ->get()
            ->map(function ($c) use ($userEnrollments) {
                $enrollment = $userEnrollments->get($c->id);
                return [
                    'id' => $c->id,
                    'title' => $c->title,
                    'title_bm' => $c->title_bm,
                    'description' => $c->description,
                    'description_bm' => $c->description_bm,
                    'level' => $c->level,
                    'image' => $c->image,
                    'url' => $c->url,
                    'enrollment_count' => $c->enrollments_count,
                    'avg_rating' => $c->ratings_avg_rating ? round($c->ratings_avg_rating, 1) : null,
                    'ratings_count' => $c->ratings_count,
                    'created_by' => $c->creator?->name,
                    'created_at' => $c->created_at,
                    'enrolled' => $enrollment ? true : false,
                    'progress' => $enrollment ? (float) $enrollment->progress : 0,
                    'status' => $enrollment?->status,
                ];
            });

        return response()->json($courses);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $course = Course::with('creator')
            ->withCount('enrollments')
            ->withAvg('ratings', 'rating')
            ->withCount('ratings')
            ->findOrFail($id);

        return response()->json(
            $this->profileService->buildProfile($course, $request->user())
        );
    }

    public function store(StoreCourseRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;

        $course = Course::create($data);

        return response()->json([
            'message' => 'Course created successfully',
            'course' => $course,
        ], 201);
    }

    public function update(StoreCourseRequest $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->update($request->validated());

        return response()->json([
            'message' => 'Course updated successfully',
            'course' => $course->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

    public function enroll(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $user = $request->user();

        $existing = UserCourse::where('user_id', $user->id)
            ->where('course_id', $id)->first();

        if ($existing) {
            return response()->json(['message' => 'Already enrolled'], 409);
        }

        UserCourse::create([
            'user_id' => $user->id,
            'course_id' => $id,
            'started_at' => now(),
            'progress' => 0,
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Enrolled successfully'], 201);
    }

    public function updateProgress(Request $request, int $id): JsonResponse
    {
        $request->validate(['progress' => 'required|numeric|min:0|max:100']);

        $uc = UserCourse::where('user_id', $request->user()->id)
            ->where('course_id', $id)->firstOrFail();

        $uc->progress = $request->progress;
        if ($request->progress >= 100) {
            $uc->completed_at = now();
            $uc->status = 'completed';
        }
        $uc->save();

        if ($uc->status === 'completed') {
            CourseCompleted::dispatch($uc);

            try {
                $course = $uc->course;
                $publisher = new RealtimePublisher();
                $publisher->publishNotification($uc->user_id, [
                    'type' => 'course_completed',
                    'title' => 'Course Completed!',
                    'body' => "You completed: {$course->title}",
                    'data' => ['course_id' => $course->id],
                ]);
                $publisher->publishDashboardUpdate('course.completed', [
                    'user_id' => $uc->user_id,
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                ]);
            } catch (\Throwable $e) {
                log()->warning('Failed to send course completion notification: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Progress updated', 'progress' => $uc->progress]);
    }

    public function rate(Request $request, int $id): JsonResponse
    {
        $request->validate(['rating' => 'required|integer|min:1|max:5']);

        $course = Course::findOrFail($id);

        $enrolled = UserCourse::where('user_id', $request->user()->id)
            ->where('course_id', $id)->exists();

        if (!$enrolled) {
            return response()->json(['message' => 'You must be enrolled to rate this course'], 403);
        }

        CourseRating::updateOrCreate(
            ['user_id' => $request->user()->id, 'course_id' => $id],
            ['rating' => $request->rating]
        );

        $avg = $course->ratings()->avg('rating');

        return response()->json([
            'message' => 'Rating submitted',
            'avg_rating' => round($avg, 1),
            'ratings_count' => $course->ratings()->count(),
        ]);
    }

    public function recommended(Request $request): JsonResponse
    {
        $user = $request->user();
        $locale = $user->locale ?? 'en';

        $result = $this->hybridService->getRecommendations($user, $locale, 8);

        return response()->json($result);
    }

    public function trackInteraction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'interaction_type' => 'required|string|in:impression,click,enroll,complete',
            'source' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        RecommendationInteraction::create([
            'user_id' => $request->user()->id,
            'course_id' => $validated['course_id'],
            'interaction_type' => $validated['interaction_type'],
            'source' => $validated['source'] ?? 'recommended',
            'ab_group' => $validated['metadata']['ab_group'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        return response()->json(['message' => 'Tracked'], 201);
    }
}
