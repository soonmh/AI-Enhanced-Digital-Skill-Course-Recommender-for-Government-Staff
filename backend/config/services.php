<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.1-flash-lite'),
    ],

    'recommendations' => [
        // Master switch for A/B testing between the legacy (control) and hybrid
        // recommendation algorithms. Disabled by default to keep the hybrid
        // algorithm as the canonical experience; flip to true to run an
        // experiment comparing engagement between the two.
        'ab_testing' => env('RECOMMENDATION_AB_TESTING', false),

        // Fraction of users assigned to the control group (0.0 - 1.0).
        // Only takes effect when ab_testing is true.
        'control_ratio' => env('RECOMMENDATION_CONTROL_RATIO', 0.5),
    ],

];
