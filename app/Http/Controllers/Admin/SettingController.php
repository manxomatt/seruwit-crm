<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSettingRequest;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the settings.
     */
    public function index(): Response
    {
        $settings = Setting::query()
            ->when(request('search'), function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('key', 'like', "%{$search}%")
                        ->orWhere('label', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(request('group'), function ($query, $group) {
                $query->where('group', $group);
            })
            ->orderBy('group')
            ->orderBy('sort_order')
            ->paginate(15)
            ->withQueryString();

        $groups = Setting::query()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group');

        return Inertia::render('Modules/Settings/Index', [
            'settingsList' => $settings,
            'groups' => $groups,
            'filters' => [
                'search' => request('search'),
                'group' => request('group'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new setting.
     */
    public function create(): Response
    {
        $groups = Setting::query()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group');

        return Inertia::render('Modules/Settings/Create', [
            'groups' => $groups,
        ]);
    }

    /**
     * Store a newly created setting in storage.
     */
    public function store(StoreSettingRequest $request): RedirectResponse
    {
        Setting::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.settings.index')
            ->with('success', 'Setting created successfully.');
    }

    /**
     * Display the specified setting.
     */
    public function show(Setting $setting): Response
    {
        return Inertia::render('Modules/Settings/Show', [
            'setting' => $setting,
        ]);
    }

    /**
     * Show the form for editing the specified setting.
     */
    public function edit(Setting $setting): Response
    {
        $groups = Setting::query()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group');

        return Inertia::render('Modules/Settings/Edit', [
            'setting' => $setting,
            'groups' => $groups,
        ]);
    }

    /**
     * Update the specified setting in storage.
     */
    public function update(UpdateSettingRequest $request, Setting $setting): RedirectResponse
    {
        $setting->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.settings.index')
            ->with('success', 'Setting updated successfully.');
    }

    /**
     * Remove the specified setting from storage.
     */
    public function destroy(Setting $setting): RedirectResponse
    {
        $setting->delete();

        return redirect()->route($this->getRoutePrefix().'.settings.index')
            ->with('success', 'Setting deleted successfully.');
    }

    /**
     * Update multiple settings at once (bulk update).
     */
    public function bulkUpdate(): RedirectResponse
    {
        $settings = request()->validate([
            'settings' => ['required', 'array'],
            'settings.*.id' => ['required', 'exists:settings,id'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($settings['settings'] as $settingData) {
            Setting::where('id', $settingData['id'])->update(['value' => $settingData['value']]);
        }

        return redirect()->route($this->getRoutePrefix().'.settings.index')
            ->with('success', 'Settings updated successfully.');
    }
}
