<?php

namespace App\Http\Middleware;

use App\Support\Installer\InstallToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Optional anti-hijack gate for the web installer.
 *
 * When an installer token is configured (see InstallToken), every mutating step
 * requires the operator to have unlocked this session by entering it. The welcome
 * page and the unlock attempt are always reachable; without a token configured the
 * gate is inert. The CLI installer does not pass through here.
 */
class EnsureInstallerUnlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (InstallToken::current() === null) {
            return $next($request);
        }

        if ((bool) $request->session()->get('installer_unlocked')) {
            return $next($request);
        }

        if ($request->routeIs('install.index') || $request->routeIs('install.unlock')) {
            return $next($request);
        }

        if ($request->isMethod('post') || $request->expectsJson()) {
            abort(403, 'The installer is locked. Enter the installer token to continue.');
        }

        return redirect()->route('install.index');
    }
}
