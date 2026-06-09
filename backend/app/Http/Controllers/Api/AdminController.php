<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\UserCourse;
use App\Services\RealtimePublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function users(Request $request): JsonResponse
    {
        $query = User::with('roles');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->whereHas('roles', fn($q) => $q->where('name', $request->role));
        }

        $users = $query->orderBy('name')->get()->map(fn($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'working_field' => $user->working_field,
            'job_level' => $user->job_level,
            'locale' => $user->locale,
            'roles' => $user->roles->pluck('name'),
            'role' => $user->roles->first()?->name,
            'is_active' => $user->is_active,
            'manager_id' => $user->manager_id,
            'created_at' => $user->created_at,
        ]);

        return response()->json($users);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'working_field' => 'nullable|string|max:255',
            'job_level' => 'nullable|string|max:255',
            'role' => 'required|string|in:Admin,Staff,Top Management,Trainer',
            'is_active' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'working_field' => $validated['working_field'] ?? null,
            'job_level' => $validated['job_level'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $role = \App\Models\Role::where('name', $validated['role'])->first();
        $user->roles()->attach($role);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load('roles'),
        ], 201);
    }

    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $id,
            'working_field' => 'nullable|string|max:255',
            'job_level' => 'nullable|string|max:255',
            'experience_years' => 'nullable|string|max:255',
            'manager_id' => 'nullable|integer|exists:users,id',
            'is_active' => 'boolean',
            'role' => 'sometimes|string|in:Admin,Staff,Top Management,Trainer',
        ]);

        if (isset($validated['role'])) {
            $role = \App\Models\Role::where('name', $validated['role'])->first();
            $user->roles()->sync([$role->id]);
            unset($validated['role']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->fresh()->load('roles'),
        ]);
    }

    public function destroyUser(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->roles->pluck('name')->contains('Admin')) {
            $adminCount = User::whereHas('roles', fn($q) => $q->where('name', 'Admin'))->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the last admin user'], 403);
            }
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function assignCourses(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'integer|exists:courses,id',
        ]);

        // Reactivate removed records
        $reactivated = UserCourse::where('user_id', $user->id)
            ->whereIn('course_id', $validated['course_ids'])
            ->where('status', 'removed')
            ->update([
                'status' => 'active',
                'progress' => 0,
                'started_at' => now(),
                'completed_at' => null,
            ]);

        $existing = UserCourse::where('user_id', $user->id)
            ->whereIn('course_id', $validated['course_ids'])
            ->where('status', '!=', 'removed')
            ->pluck('course_id')
            ->toArray();

        $newIds = array_diff($validated['course_ids'], $existing);

        foreach ($newIds as $courseId) {
            UserCourse::create([
                'user_id' => $user->id,
                'course_id' => $courseId,
                'started_at' => now(),
                'progress' => 0,
                'status' => 'active',
            ]);
        }

        // Send real-time notifications (non-blocking)
        if (count($newIds) > 0) {
            try {
                $publisher = new RealtimePublisher();
                foreach ($newIds as $courseId) {
                    $course = Course::find($courseId);
                    if ($course) {
                        $publisher->publishNotification($user->id, [
                            'type' => 'course_assigned',
                            'title' => 'New Course Assigned',
                            'body' => "You have been assigned: {$course->title}",
                            'data' => ['course_id' => $courseId],
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                log()->warning('Failed to send assignment notification: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => (count($newIds) + $reactivated) . ' course(s) assigned',
            'assigned' => count($newIds) + $reactivated,
            'skipped' => count($existing) - $reactivated,
        ]);
    }

    public function assignUsers(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        // Reactivate removed records
        $reactivated = UserCourse::where('course_id', $course->id)
            ->whereIn('user_id', $validated['user_ids'])
            ->where('status', 'removed')
            ->update([
                'status' => 'active',
                'progress' => 0,
                'started_at' => now(),
                'completed_at' => null,
            ]);

        $existing = UserCourse::where('course_id', $course->id)
            ->whereIn('user_id', $validated['user_ids'])
            ->where('status', '!=', 'removed')
            ->pluck('user_id')
            ->toArray();

        $newIds = array_diff($validated['user_ids'], $existing);

        foreach ($newIds as $userId) {
            UserCourse::create([
                'user_id' => $userId,
                'course_id' => $course->id,
                'started_at' => now(),
                'progress' => 0,
                'status' => 'active',
            ]);
        }

        // Send real-time notifications (non-blocking)
        if (count($newIds) > 0) {
            try {
                $publisher = new RealtimePublisher();
                foreach ($newIds as $userId) {
                    $publisher->publishNotification((int) $userId, [
                        'type' => 'course_assigned',
                        'title' => 'New Course Assigned',
                        'body' => "You have been assigned: {$course->title}",
                        'data' => ['course_id' => $course->id],
                    ]);
                }
            } catch (\Throwable $e) {
                log()->warning('Failed to send assignment notification: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => (count($newIds) + $reactivated) . ' user(s) assigned',
            'assigned' => count($newIds) + $reactivated,
            'skipped' => count($existing) - $reactivated,
        ]);
    }

    public function assignedCourses(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $courseIds = UserCourse::where('user_id', $user->id)
            ->where('status', '!=', 'removed')
            ->pluck('course_id')
            ->toArray();

        return response()->json($courseIds);
    }

    public function assignedUsers(int $id): JsonResponse
    {
        $course = Course::findOrFail($id);
        $userIds = UserCourse::where('course_id', $course->id)
            ->where('status', '!=', 'removed')
            ->pluck('user_id')
            ->toArray();

        return response()->json($userIds);
    }

    public function unassignUsers(Request $request, int $id): JsonResponse
    {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $count = UserCourse::where('course_id', $course->id)
            ->whereIn('user_id', $validated['user_ids'])
            ->where('status', '!=', 'removed')
            ->update(['status' => 'removed']);

        try {
            $publisher = new RealtimePublisher();
            foreach ($validated['user_ids'] as $userId) {
                $publisher->publishNotification((int) $userId, [
                    'type' => 'course_removed',
                    'title' => 'Course Removed',
                    'body' => "An admin removed: {$course->title}",
                    'data' => ['course_id' => $course->id],
                ]);
            }
        } catch (\Throwable $e) {
            log()->warning('Failed to send removal notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => "{$count} user(s) removed",
            'removed' => $count,
        ]);
    }

    public function unassignCourses(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'integer|exists:courses,id',
        ]);

        $count = UserCourse::where('user_id', $user->id)
            ->whereIn('course_id', $validated['course_ids'])
            ->where('status', '!=', 'removed')
            ->update(['status' => 'removed']);

        try {
            $publisher = new RealtimePublisher();
            foreach ($validated['course_ids'] as $courseId) {
                $course = Course::find($courseId);
                if ($course) {
                    $publisher->publishNotification($user->id, [
                        'type' => 'course_removed',
                        'title' => 'Course Removed',
                        'body' => "An admin removed: {$course->title}",
                        'data' => ['course_id' => $courseId],
                    ]);
                }
            }
        } catch (\Throwable $e) {
            log()->warning('Failed to send removal notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => "{$count} course(s) removed",
            'removed' => $count,
        ]);
    }
}
