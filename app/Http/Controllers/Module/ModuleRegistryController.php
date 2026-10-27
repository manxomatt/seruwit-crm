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
        $modules = collect(Modules::all())
            ->map(fn (ModuleContract $module): array => [
                'key' => $module->key(),
                'label' => $module->label(),
                'description' => $module->description(),
                'requires' => $module->requires(),
                'is_enabled' => Modules::platformEnabled($module->key()),
                'is_hidden' => Modules::isTenantHidden($module->key()),
                'parent_key' => null,
            ])
            ->merge(
                collect(Modules::subFeatures())
                    ->map(fn (array $sub): array => [
                        'key' => $sub['key'],
                        'label' => $sub['label'],
                        'description' => $sub['description'],
                        'requires' => $sub['requires'],
                        'is_enabled' => Modules::platformEnabled($sub['key']),
                        'is_hidden' => Modules::isTenantHidden($sub['key']),
                        'parent_key' => $sub['parent'],
                    ])
            )
            ->values()
            ->all();

        return Inertia::render('Module/Registry/Index', [
            'modules' => $modules,
        ]);
    }

    public function toggleStatus(string $key): RedirectResponse
    {
        $module = Modules::find($key);
        $subFeature = $module ? null : Modules::findSubFeature($key);

        if (! $module && ! $subFeature) {
            abort(404);
        }

        $label = $module ? $module->label() : $subFeature['label'];
        $enabled = Modules::platformEnabled($key);

        ModuleSetting::query()->updateOrCreate(
            ['key' => $key],
            ['is_enabled' => ! $enabled],
        );

        Modules::flushDisabledState();

        $message = $enabled
            ? __('platform.messages.module_disabled', ['module' => $label])
            : __('platform.messages.module_enabled', ['module' => $label]);

        return back()->with('success', $message);
    }

    public function toggleVisibility(string $key): RedirectResponse
    {
        $module = Modules::find($key);
        $subFeature = $module ? null : Modules::findSubFeature($key);

        if (! $module && ! $subFeature) {
            abort(404);
        }

        $label = $module ? $module->label() : $subFeature['label'];
        $hidden = Modules::isTenantHidden($key);

        ModuleSetting::query()->updateOrCreate(
            ['key' => $key],
            ['is_hidden' => ! $hidden],
        );

        Modules::flushHiddenState();

        $message = $hidden
            ? __('platform.messages.module_unhidden', ['module' => $label])
            : __('platform.messages.module_hidden', ['module' => $label]);

        return back()->with('success', $message);
    }
}
