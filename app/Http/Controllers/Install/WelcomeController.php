<?php

namespace App\Http\Controllers\Install;

use App\Http\Controllers\Controller;
use App\Support\Installer\InstallToken;
use App\Support\Installer\RequirementsChecker;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Entry point of the first-run installer: renders the Inertia wizard shell. The
 * wizard walks welcome → requirements → database → migrate → platform → admin →
 * complete client-side, submitting each step to its own endpoint.
 */
class WelcomeController extends Controller
{
    public function index(Request $request, RequirementsChecker $checker): Response
    {
        return Inertia::render('Install/Wizard', [
            'requirements' => $checker->checks(),
            'requirementsPass' => $checker->passes(),
            'defaults' => [
                'app_name' => config('app.name'),
                'app_url' => config('app.url'),
                'tenant_base_domain' => (string) config('tenancy.tenant_base_domain', ''),
            ],
            'drivers' => ['pgsql', 'mysql', 'sqlite'],
            'profiles' => ['development', 'production'],
            'tokenRequired' => InstallToken::current() !== null,
            'unlocked' => (bool) $request->session()->get('installer_unlocked'),
        ]);
    }
}
