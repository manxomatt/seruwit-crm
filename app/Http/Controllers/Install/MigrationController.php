<?php

namespace App\Http\Controllers\Install;

use App\Actions\Install\CentralMigrator;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

class MigrationController extends Controller
{
    public function run(CentralMigrator $migrator): RedirectResponse
    {
        try {
            $migrator->run();
        } catch (RuntimeException $e) {
            return back()->withErrors(['migrate' => $e->getMessage()]);
        }

        return redirect()->route('install.index')->with('status', 'migrated');
    }
}
