<?php

namespace App\Http\Middleware;

use App\Modules\Facades\Modules;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks routes belonging to a module the current tenant has not installed.
 *
 * Module routes are always registered, so this is the only thing standing between
 * an uninstalled module and its controllers. It must run before `permission`, and
 * unlike permission checks it has no admin bypass — a workspace admin is exactly
 * the user who would otherwise reach a controller whose tables do not exist.
 */
class RequiresModule
{
    /**
     * @param  \Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        if (! Modules::installed($module)) {
            abort(404);
        }

        return $next($request);
    }
}
