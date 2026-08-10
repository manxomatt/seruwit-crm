<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Http\Requests\UpdateOrdersSettingsRequest;
use Modules\Orders\Support\OrdersSettings;

class OrdersSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Modules/Orders/Settings/Edit', [
            'settings' => OrdersSettings::all(),
        ]);
    }

    public function update(UpdateOrdersSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['auto_confirm_do_from_gin'] = $request->boolean('auto_confirm_do_from_gin');

        OrdersSettings::update($data);

        return back()->with('success', __('orders.messages.settings_updated'));
    }
}
