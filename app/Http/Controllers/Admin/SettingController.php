<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSettingRequest;
use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
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
     * Redirect to the first group's page — settings are now browsed and
     * edited one group at a time rather than as a flat table.
     */
    public function index(): RedirectResponse
    {
        $firstGroup = Setting::query()->orderBy('group')->value('group') ?? 'general';

        return redirect()->route($this->getRoutePrefix().'.settings.group', $firstGroup);
    }

    /**
     * Display the settings belonging to a single group as an editable form.
     * A group with no settings yet still renders, so a brand-new group can
     * be bootstrapped from here via "Add Setting".
     */
    public function group(string $group): Response
    {
        $settings = Setting::query()
            ->where('group', $group)
            ->orderBy('sort_order')
            ->get();

        $groups = Setting::query()
            ->select('group')
            ->distinct()
            ->orderBy('group')
            ->pluck('group');

        return Inertia::render('Modules/Settings/Group', [
            'settings' => $settings,
            'groups' => $groups,
            'currentGroup' => $group,
            // Mirrors the actual routing: adding/editing settings only exists
            // as a route on the central domain (see routes/web.php).
            'canManage' => ! tenancy()->initialized && Auth::user()->can('manage-settings'),
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
            'selectedGroup' => request('group'),
            'isNewGroup' => request()->boolean('new_group'),
        ]);
    }

    /**
     * Store a newly created setting in storage.
     */
    public function store(StoreSettingRequest $request): RedirectResponse
    {
        $setting = Setting::create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.settings.group', $setting->group)
            ->with('success', 'Setting created successfully.');
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

        return redirect()->route($this->getRoutePrefix().'.settings.group', $setting->group)
            ->with('success', 'Setting updated successfully.');
    }

    /**
     * Remove the specified setting from storage.
     */
    public function destroy(Setting $setting): RedirectResponse
    {
        $group = $setting->group;
        $setting->delete();

        return redirect()->route($this->getRoutePrefix().'.settings.group', $group)
            ->with('success', 'Setting deleted successfully.');
    }

    /**
     * Update multiple settings at once (bulk update).
     */
    public function bulkUpdate(): RedirectResponse
    {
        $data = request()->validate([
            'group' => ['required', 'string'],
            'settings' => ['required', 'array'],
            'settings.*.id' => ['required', 'exists:settings,id'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $settingData) {
            Setting::where('id', $settingData['id'])->update(['value' => $settingData['value']]);
        }

        return redirect()->route($this->getRoutePrefix().'.settings.group', $data['group'])
            ->with('success', 'Settings updated successfully.');
    }
}
