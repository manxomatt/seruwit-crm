<?php

namespace Modules\DriverScoring\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\DriverScoring\Http\Requests\UpdateScoringSettingsRequest;
use Modules\DriverScoring\Models\DriverScoringSetting;

class ScoringSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Modules/DriverScoring/Settings/Edit', [
            'settings' => DriverScoringSetting::current(),
        ]);
    }

    public function update(UpdateScoringSettingsRequest $request): RedirectResponse
    {
        $settings = DriverScoringSetting::current();
        $settings->update($request->validated());

        return back()->with('success', __('scoring.messages.thresholds_updated'));
    }
}
