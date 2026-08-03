<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Modules\DemoDatasets;
use App\Modules\Facades\Modules;
use App\Modules\ModuleCatalog;
use App\Modules\ModuleInstaller;
use App\Modules\VerticalPacks;
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

        $canInstallDemoData = tenant()->canInstallDemoData();

        return Inertia::render('Module/Modules/Index', [
            'modules' => $this->catalog->forCurrentTenant(),
            'plan' => $this->catalog->currentPlan(),
            'plans' => $this->catalog->allPlans(),
            'graceDays' => config('modules.purge_after_days'),
            'canInstallDemoData' => $canInstallDemoData,
            'demos' => $canInstallDemoData
                ? collect(DemoDatasets::all())
                    ->map(fn (array $demo, string $key): array => [
                        'key' => $key,
                        'label' => $demo['label'],
                        'description' => $demo['description'],
                        'installed' => DemoDatasets::isInstalled($key),
                        'includes' => $demo['includes'] ?? [],
                    ])
                    ->values()
                    ->all()
                : [],
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

        return back()->with('success', __('platform.messages.module_installed', ['module' => $module->label()]));
    }

    public function installPack(string $pack, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();

        if (! VerticalPacks::find($pack)) {
            abort(404);
        }

        try {
            $installer->installPack(tenant(), $pack);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $label = VerticalPacks::find($pack)['label'];

        return back()->with('success', __('platform.messages.pack_installed', ['pack' => $label]));
    }

    public function uninstallPack(string $pack, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();

        if (! VerticalPacks::find($pack)) {
            abort(404);
        }

        try {
            $installer->uninstallPack(tenant(), $pack);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $label = VerticalPacks::find($pack)['label'];
        $days = config('modules.purge_after_days');

        return back()->with('success', __('platform.messages.pack_uninstalled', [
            'pack' => $label,
            'days' => $days,
        ]));
    }

    public function installDemo(string $demo, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();
        abort_unless(tenant()->canInstallDemoData(), 403);

        if (! DemoDatasets::find($demo)) {
            abort(404);
        }

        try {
            $installer->installDemo(tenant(), $demo);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $label = DemoDatasets::find($demo)['label'];

        return back()->with('success', __('platform.messages.demo_installed', ['demo' => $label]));
    }

    public function uninstallDemo(string $demo, ModuleInstaller $installer): RedirectResponse
    {
        $this->ensureWorkspaceContext();
        abort_unless(tenant()->canInstallDemoData(), 403);

        if (! DemoDatasets::find($demo)) {
            abort(404);
        }

        try {
            $installer->uninstallDemo(tenant(), $demo);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        $label = DemoDatasets::find($demo)['label'];

        return back()->with('success', __('platform.messages.demo_uninstalled', ['demo' => $label]));
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

        return back()->with('success', __('platform.messages.module_uninstalled', [
            'module' => $module->label(),
            'days' => $days,
        ]));
    }

    private function ensureWorkspaceContext(): void
    {
        abort_unless(tenancy()->initialized, 404);
        abort_unless(Auth::user()?->can('manage-modules') ?? false, 403);
    }
}
