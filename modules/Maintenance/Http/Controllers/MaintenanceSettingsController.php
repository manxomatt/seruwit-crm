<?php

namespace Modules\Maintenance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Maintenance\Http\Requests\UpdateMaintenanceSettingsRequest;
use Modules\Maintenance\Support\MaintenanceSettings;

class MaintenanceSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Modules/Maintenance/Settings/Edit', [
            'settings' => MaintenanceSettings::all(),
        ]);
    }

    public function update(UpdateMaintenanceSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['auto_create_wo'] = $request->boolean('auto_create_wo');
        $data['single_active_wo_per_vehicle'] = $request->boolean('single_active_wo_per_vehicle');
        $data['single_active_wo_per_bay'] = $request->boolean('single_active_wo_per_bay');

        MaintenanceSettings::update($data);

        return back()->with('success', __('maintenance.messages.settings_updated'));
    }
}
