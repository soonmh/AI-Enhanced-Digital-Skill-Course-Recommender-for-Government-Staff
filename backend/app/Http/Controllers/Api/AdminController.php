<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Role;
use App\Models\User;
use App\Models\UserCourse;
use App\Services\CourseAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function __construct(private CourseAssignmentService $assignments) {}

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
            'hod_id' => $user->hod_id,
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

        $role = Role::where('name', $validated['role'])->first();
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
            'hod_id' => 'nullable|integer|exists:users,id',
            'is_active' => 'boolean',
            'role' => 'sometimes|string|in:Admin,Staff,Top Management,Trainer',
        ]);

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->first();
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
        $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'integer|exists:courses,id',
        ]);

        User::findOrFail($id); // ensure user exists

        return response()->json(
            $this->assignments->assignCoursesToUser($id, $request->course_ids)
        );
    }

    public function assignUsers(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        Course::findOrFail($id); // ensure course exists

        return response()->json(
            $this->assignments->assignUsersToCourse($id, $request->user_ids)
        );
    }

    public function assignedCourses(int $id): JsonResponse
    {
        User::findOrFail($id);
        $courseIds = UserCourse::where('user_id', $id)
            ->where('status', '!=', 'removed')
            ->pluck('course_id')
            ->toArray();

        return response()->json($courseIds);
    }

    public function assignedUsers(int $id): JsonResponse
    {
        Course::findOrFail($id);
        $userIds = UserCourse::where('course_id', $id)
            ->where('status', '!=', 'removed')
            ->pluck('user_id')
            ->toArray();

        return response()->json($userIds);
    }

    public function unassignUsers(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $count = $this->assignments->unassignUsersFromCourse($id, $request->user_ids);

        return response()->json([
            'message' => "{$count} user(s) removed",
            'removed' => $count,
        ]);
    }

    public function unassignCourses(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'course_ids' => 'required|array',
            'course_ids.*' => 'integer|exists:courses,id',
        ]);

        $count = $this->assignments->unassignCoursesFromUser($id, $request->course_ids);

        return response()->json([
            'message' => "{$count} course(s) removed",
            'removed' => $count,
        ]);
    }
}
