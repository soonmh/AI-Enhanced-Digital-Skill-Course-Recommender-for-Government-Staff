<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureHasPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!$request->user() || !$request->user()->hasPermission($permission)) {
            abort(403, 'Unauthorized action.');
        }
        return $next($request);
    }
}
