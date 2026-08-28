<?php

namespace App\Http\Controllers\Install;

use App\Actions\Install\InstallationFinalizer;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class FinalizeController extends Controller
{
    public function store(InstallationFinalizer $finalizer): Response
    {
        $finalizer->finalize();

        session()->flash('status', 'installed');

        // The lock is now written, so the gate will send any future /install hit
        // back to the live application. We force a full-page visit rather than a
        // plain redirect: the wizard posts via Inertia, and the homepage is a Blade
        // response, so a normal redirect would be swallowed and rendered inside
        // Inertia's error-modal iframe instead of navigating the browser.
        return Inertia::location('/');
    }
}
