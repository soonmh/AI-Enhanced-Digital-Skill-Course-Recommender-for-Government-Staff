<?php

namespace App\Services;

use App\Models\Course;
use App\Models\UserCourse;

class CourseAssignmentService
{
    public function __construct(private RealtimePublisher $publisher) {}

    /**
     * Assign multiple courses to one user. Reactivates removed enrollments.
     */
    public function assignCoursesToUser(int $userId, array $courseIds): array
    {
        $reactivated = $this->reactivate('user_id', $userId, 'course_id', $courseIds);
        $existing = $this->existingIds('user_id', $userId, 'course_id', $courseIds);
        $newIds = array_values(array_diff($courseIds, $existing));

        foreach ($newIds as $courseId) {
            $this->createEnrollment($userId, $courseId);
        }

        $this->notifyAssigned(
            recipientId: $userId,
            items: $newIds,
            titleKey: 'course_assigned',
            title: 'New Course Assigned',
            bodyTemplate: 'You have been assigned: {name}',
            modelClass: Course::class,
            idKey: 'course_id',
        );

        return [
            'assigned' => count($newIds) + $reactivated,
            'skipped' => count($existing) - $reactivated,
            'message' => (count($newIds) + $reactivated) . ' course(s) assigned',
        ];
    }

    /**
     * Assign multiple users to one course. Reactivates removed enrollments.
     */
    public function assignUsersToCourse(int $courseId, array $userIds): array
    {
        $reactivated = $this->reactivate('course_id', $courseId, 'user_id', $userIds);
        $existing = $this->existingIds('course_id', $courseId, 'user_id', $userIds);
        $newIds = array_values(array_diff($userIds, $existing));

        foreach ($newIds as $userId) {
            $this->createEnrollment($userId, $courseId);
        }

        $course = Course::find($courseId);
        foreach ($newIds as $userId) {
            $this->publisher->publishNotification($userId, [
                'type' => 'course_assigned',
                'title' => 'New Course Assigned',
                'body' => "You have been assigned: {$course?->title}",
                'data' => ['course_id' => $courseId],
            ]);
        }

        return [
            'assigned' => count($newIds) + $reactivated,
            'skipped' => count($existing) - $reactivated,
            'message' => (count($newIds) + $reactivated) . ' user(s) assigned',
        ];
    }

    /**
     * Mark enrollments removed (soft delete style). Notifies the affected user.
     */
    public function unassignUsersFromCourse(int $courseId, array $userIds): int
    {
        $count = $this->markRemoved('course_id', $courseId, 'user_id', $userIds);

        $course = Course::find($courseId);
        foreach ($userIds as $userId) {
            $this->publisher->publishNotification($userId, [
                'type' => 'course_removed',
                'title' => 'Course Removed',
                'body' => "An admin removed: {$course?->title}",
                'data' => ['course_id' => $courseId],
            ]);
        }

        return $count;
    }

    public function unassignCoursesFromUser(int $userId, array $courseIds): int
    {
        $count = $this->markRemoved('user_id', $userId, 'course_id', $courseIds);

        foreach ($courseIds as $courseId) {
            $course = Course::find($courseId);
            $this->publisher->publishNotification($userId, [
                'type' => 'course_removed',
                'title' => 'Course Removed',
                'body' => "An admin removed: {$course?->title}",
                'data' => ['course_id' => $courseId],
            ]);
        }

        return $count;
    }

    private function reactivate(string $ownerCol, int $ownerId, string $targetCol, array $targetIds): int
    {
        return UserCourse::where($ownerCol, $ownerId)
            ->whereIn($targetCol, $targetIds)
            ->where('status', 'removed')
            ->update([
                'status' => 'active',
                'progress' => 0,
                'started_at' => now(),
                'completed_at' => null,
            ]);
    }

    private function existingIds(string $ownerCol, int $ownerId, string $targetCol, array $targetIds): array
    {
        return UserCourse::where($ownerCol, $ownerId)
            ->whereIn($targetCol, $targetIds)
            ->where('status', '!=', 'removed')
            ->pluck($targetCol)
            ->toArray();
    }

    private function createEnrollment(int $userId, int $courseId): void
    {
        UserCourse::create([
            'user_id' => $userId,
            'course_id' => $courseId,
            'started_at' => now(),
            'progress' => 0,
            'status' => 'active',
        ]);
    }

    private function markRemoved(string $ownerCol, int $ownerId, string $targetCol, array $targetIds): int
    {
        return UserCourse::where($ownerCol, $ownerId)
            ->whereIn($targetCol, $targetIds)
            ->where('status', '!=', 'removed')
            ->update(['status' => 'removed']);
    }

    /**
     * Notify a single recipient about multiple newly-assigned items (courses or, if needed, users).
     */
    private function notifyAssigned(
        int $recipientId,
        array $items,
        string $titleKey,
        string $title,
        string $bodyTemplate,
        string $modelClass,
        string $idKey,
    ): void {
        foreach ($items as $id) {
            $model = $modelClass::find($id);
            if (!$model) {
                continue;
            }
            $this->publisher->publishNotification($recipientId, [
                'type' => $titleKey,
                'title' => $title,
                'body' => str_replace('{name}', $model->title ?? $model->name, $bodyTemplate),
                'data' => [$idKey => $id],
            ]);
        }
    }
}
