<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use App\Modules\ModuleCatalog;
use App\Modules\ModuleInstaller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Lets a workspace admin install and uninstall the modules their plan covers.
 *
 * Tenant-domain only: on central there is no workspace whose modules these would
 * be. Routes live in the shared routes/app.php, so that is enforced here.
 */
class ModuleController extends Controller
{
    public function __construct(private readonly ModuleCatalog $catalog) {}

    public function index(): Response
    {
        $this->ensureWorkspaceContext();

        return Inertia::render('Module/Modules/Index', [
            'modules' => $this->catalog->forCurrentTenant(),
            'plan' => $this->catalog->currentPlan(),
            'plans' => $this->catalog->allPlans(),
            'graceDays' => config('modules.purge_after_days'),
        ]);
    }

    public function install(string $key, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();

        $module = Modules::find($key);

        if (! $module) {
            abort(404);
        }

        try {
            $installer->install(tenant(), $module);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', "Modul {$module->label()} berhasil dipasang.");
    }

    public function uninstall(string $key, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();

        $module = Modules::find($key);

        if (! $module) {
            abort(404);
        }

        try {
            $installer->uninstall(tenant(), $module);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $days = config('modules.purge_after_days');

        return back()->with(
            'success',
            "Modul {$module->label()} dicopot. Datanya disimpan {$days} hari — pasang lagi sebelum itu untuk memulihkannya.",
        );
    }

    private function ensureWorkspaceContext(): void
    {
        abort_unless(tenancy()->initialized, 404);
        abort_unless(Auth::user()?->can('manage-modules') ?? false, 403);
    }
}
