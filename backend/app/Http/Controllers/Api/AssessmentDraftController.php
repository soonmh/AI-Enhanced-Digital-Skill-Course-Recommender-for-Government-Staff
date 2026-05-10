<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssessmentDraftController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $draft = $request->user()->assessmentDrafts()->latest()->first();

        if (!$draft) {
            return response()->json(['draft' => null]);
        }

        return response()->json([
            'draft' => [
                'id' => $draft->id,
                'answers' => $draft->answers,
                'current_section' => $draft->current_section,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }

    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'answers' => 'required|array',
            'current_section' => 'required|integer|min:0',
        ]);

        $draft = $request->user()->assessmentDrafts()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'answers' => $validated['answers'],
                'current_section' => $validated['current_section'],
            ]
        );

        return response()->json([
            'message' => 'Draft saved',
            'draft' => [
                'id' => $draft->id,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->user()->assessmentDrafts()->delete();

        return response()->json(['message' => 'Draft cleared']);
    }
}
