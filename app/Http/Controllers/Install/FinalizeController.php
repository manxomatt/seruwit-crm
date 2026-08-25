<?php

namespace App\Http\Controllers\Install;

use App\Actions\Install\InstallationFinalizer;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class FinalizeController extends Controller
{
    public function store(InstallationFinalizer $finalizer): RedirectResponse
    {
        $finalizer->finalize();

        // The lock is now written, so the gate will send any future /install hit
        // back to the live application.
        return redirect()->to('/')->with('status', 'installed');
    }
}
