<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMailConfigRequest;
use App\Models\MailConfig;
use App\Support\TenantMailConfigBootstrapper;
use Illuminate\Http\RedirectResponse;

class MailConfigController extends Controller
{
    public function update(UpdateMailConfigRequest $request): RedirectResponse
    {
        abort_unless(tenancy()->initialized, 404);

        $validated = $request->validated();
        $config = MailConfig::current();

        $attributes = [
            'is_enabled' => $validated['is_enabled'],
            'host' => $validated['host'] ?? null,
            'port' => $validated['port'] ?? null,
            'encryption' => filled($validated['encryption'] ?? null) ? $validated['encryption'] : null,
            'username' => $validated['username'] ?? null,
        ];

        if (filled($validated['password'] ?? null)) {
            $attributes['password'] = $validated['password'];
        }

        $config->update($attributes);

        app(TenantMailConfigBootstrapper::class)->refresh();

        return back()->with('success', __('settings.mail.messages.saved'));
    }
}
