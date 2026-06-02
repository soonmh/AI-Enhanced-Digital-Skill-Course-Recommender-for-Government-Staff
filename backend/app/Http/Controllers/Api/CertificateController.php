<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\JsonResponse;

class CertificateController extends Controller
{
    public function verify(string $code): JsonResponse
    {
        $cert = Certificate::where('verification_code', $code)
            ->with('user', 'assessmentResponse')
            ->first();

        if (!$cert) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        return response()->json([
            'valid' => $cert->isValid(),
            'certificate' => [
                'id' => $cert->id,
                'type' => $cert->type,
                'dsri_score' => $cert->dsri_score,
                'maturity_level' => $cert->maturity_level,
                'maturity_code' => $cert->maturity_code,
                'maturity_label_en' => $cert->maturity_label_en,
                'maturity_label_ms' => $cert->maturity_label_ms,
                'competency_scores' => $cert->competency_scores,
                'user_name' => $cert->user->name,
                'user_field' => $cert->user->working_field,
                'issued_at' => $cert->issued_at->toIso8601String(),
                'expires_at' => $cert->expires_at?->toIso8601String(),
                'is_expired' => $cert->isExpired(),
            ],
        ]);
    }
}
