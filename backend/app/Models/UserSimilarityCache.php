<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSimilarityCache extends Model
{
    protected $table = 'user_similarity_cache';

    protected $fillable = [
        'user_id_a',
        'user_id_b',
        'similarity_score',
        'computed_at',
    ];

    protected $casts = [
        'similarity_score' => 'float',
        'computed_at' => 'datetime',
    ];
}
