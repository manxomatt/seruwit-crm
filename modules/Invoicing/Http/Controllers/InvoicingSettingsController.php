<?php

namespace Modules\Invoicing\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Invoicing\Http\Requests\UpdateInvoicingSettingsRequest;
use Modules\Invoicing\Support\InvoicingSettings;

class InvoicingSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Modules/Invoicing/Settings/Edit', [
            'settings' => InvoicingSettings::all(),
        ]);
    }

    public function update(UpdateInvoicingSettingsRequest $request): RedirectResponse
    {
        InvoicingSettings::update($request->validated());

        return back()->with('success', __('invoicing.messages.settings_updated'));
    }
}
