<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\ModuleSetting;
use App\Modules\Facades\Modules;
use App\Modules\ModuleContract;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Super admin platform-wide module kill switch.
 *
 * Central only — this overrides every tenant's plan and install state at once,
 * distinct from ModuleController (a workspace admin's own install/uninstall)
 * and PlanController (which modules a plan sells).
 */
class ModuleRegistryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Module/Registry/Index', [
            'modules' => collect(Modules::all())
                ->map(fn (ModuleContract $module): array => [
                    'key' => $module->key(),
                    'label' => $module->label(),
                    'description' => $module->description(),
                    'requires' => $module->requires(),
                    'is_enabled' => Modules::platformEnabled($module->key()),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function toggleStatus(string $key): RedirectResponse
    {
        $module = Modules::find($key);

        if (! $module) {
            abort(404);
        }

        $enabled = Modules::platformEnabled($key);

        ModuleSetting::query()->updateOrCreate(
            ['key' => $key],
            ['is_enabled' => ! $enabled],
        );

        Modules::flushDisabledState();

        $message = $enabled
            ? "Modul {$module->label()} dinonaktifkan untuk semua tenant."
            : "Modul {$module->label()} diaktifkan kembali.";

        return back()->with('success', $message);
    }
}
