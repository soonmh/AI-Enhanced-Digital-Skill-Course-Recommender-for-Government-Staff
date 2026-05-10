<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    protected $fillable = ['title', 'description'];

    public function responses()
    {
        return $this->hasMany(AssessmentResponse::class);
    }
}
