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
                    'is_hidden' => Modules::isTenantHidden($module->key()),
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
            ? __('platform.messages.module_disabled', ['module' => $module->label()])
            : __('platform.messages.module_enabled', ['module' => $module->label()]);

        return back()->with('success', $message);
    }

    public function toggleVisibility(string $key): RedirectResponse
    {
        $module = Modules::find($key);

        if (! $module) {
            abort(404);
        }

        $hidden = Modules::isTenantHidden($key);

        ModuleSetting::query()->updateOrCreate(
            ['key' => $key],
            ['is_hidden' => ! $hidden],
        );

        Modules::flushHiddenState();

        $message = $hidden
            ? __('platform.messages.module_unhidden', ['module' => $module->label()])
            : __('platform.messages.module_hidden', ['module' => $module->label()]);

        return back()->with('success', $message);
    }
}
