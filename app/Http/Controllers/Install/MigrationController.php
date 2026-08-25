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
        // The central migrations plus the platform seeders legitimately run past
        // PHP's default 30s max_execution_time (which php artisan serve enforces),
        // so lift the limit for this one long request and keep going if the client
        // navigates away mid-run.
        @set_time_limit(0);
        ignore_user_abort(true);

        try {
            $migrator->run();
        } catch (RuntimeException $e) {
            return back()->withErrors(['migrate' => $e->getMessage()]);
        }

        return redirect()->route('install.index')->with('status', 'migrated');
    }
}
