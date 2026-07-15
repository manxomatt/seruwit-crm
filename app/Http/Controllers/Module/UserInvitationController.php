<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\Tenant;
use App\Notifications\TenantInvitationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserInvitationController extends Controller
{
    /**
     * Invite someone into the current workspace (tenant context only).
     *
     * The invitation lives in the central database and is accepted on the
     * central domain, so it works for both new and existing accounts.
     */
    public function store(Request $request): RedirectResponse
    {
        abort_unless(tenancy()->initialized, 404);

        $request->validate([
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'role_slug' => ['required', 'string', Rule::exists(Role::class, 'slug')],
        ]);

        $email = $request->string('email')->value();

        $alreadyMember = CentralUser::query()
            ->where('email', $email)
            ->whereHas('tenants', fn ($query) => $query->whereKey(tenant('id')))
            ->exists();

        if ($alreadyMember) {
            return back()->withErrors(['email' => 'Pengguna ini sudah menjadi anggota workspace.']);
        }

        $invitation = Invitation::query()->updateOrCreate(
            [
                'tenant_id' => tenant('id'),
                'email' => $email,
            ],
            [
                'role_slug' => $request->string('role_slug')->value(),
                'token' => Str::random(64),
                'invited_by_global_id' => $request->user()->global_id,
                'expires_at' => now()->addDays(7),
                'accepted_at' => null,
            ],
        );

        Notification::route('mail', $email)->notify(new TenantInvitationNotification($invitation));

        return back()->with('success', 'Undangan telah dikirim ke '.$email.'.');
    }
}
