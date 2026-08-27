<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Modules\Facades\Modules;
use App\Modules\ModuleCatalog;
use App\Modules\ModuleContract;
use App\Modules\ModuleInstaller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Lets the super admin install and uninstall optional modules onto the Central
 * Admin dashboard itself, à la carte.
 *
 * Central-domain only and gated to platform staff — distinct from ModuleController
 * (a tenant admin's own install/uninstall) and ModuleRegistryController (the
 * platform-wide kill switch). Only modules on the central_installable allowlist
 * may be touched here; anything else 404s.
 */
class CentralModuleController extends Controller
{
    public function __construct(private readonly ModuleCatalog $catalog) {}

    public function index(): Response
    {
        return Inertia::render('Module/CentralModules/Index', [
            'modules' => $this->catalog->forCentral(),
            'graceDays' => config('modules.purge_after_days'),
        ]);
    }

    public function install(string $key, ModuleInstaller $installer): RedirectResponse
    {
        $module = $this->allowedModule($key);

        try {
            $installer->installOnCentral($module);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', __('platform.messages.module_installed', ['module' => $module->label()]));
    }

    public function uninstall(string $key, ModuleInstaller $installer): RedirectResponse
    {
        $module = $this->allowedModule($key);

        try {
            $installer->uninstallOnCentral($module);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $days = config('modules.purge_after_days');

        return back()->with('success', __('platform.messages.module_uninstalled', [
            'module' => $module->label(),
            'days' => $days,
        ]));
    }

    /**
     * Resolve $key to a module on the central-installable allowlist, or 404.
     */
    private function allowedModule(string $key): ModuleContract
    {
        abort_unless(in_array($key, config('modules.central_installable', []), true), 404);

        $module = Modules::find($key);

        abort_if($module === null, 404);

        return $module;
    }
}
