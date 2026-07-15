<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Show the invitation acceptance page.
     */
    public function show(string $token): Response
    {
        $invitation = $this->pendingInvitation($token);

        return Inertia::render('Central/InvitationAccept', [
            'token' => $invitation->token,
            'email' => $invitation->email,
            'tenantName' => $invitation->tenant->name,
            'hasAccount' => CentralUser::query()->where('email', $invitation->email)->exists(),
        ]);
    }

    /**
     * Accept the invitation: ensure a central account exists, attach the
     * membership (which syncs the user into the tenant schema), assign the
     * invited role inside the tenant, then SSO into the workspace.
     */
    public function accept(Request $request, string $token): RedirectResponse
    {
        $invitation = $this->pendingInvitation($token);

        $centralUser = CentralUser::query()->where('email', $invitation->email)->first();

        if ($centralUser === null) {
            $request->validate([
                'name' => 'required|string|max:255',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $invitation->email,
                'password' => Hash::make($request->password),
            ]);

            $centralUser = CentralUser::query()->firstWhere('global_id', $user->global_id);

            Auth::login($user);
        } elseif ($request->user()?->email !== $invitation->email) {
            return redirect()
                ->route('login')
                ->with('status', 'Masuk terlebih dahulu dengan akun '.$invitation->email.' untuk menerima undangan.');
        }

        $tenant = $invitation->tenant;

        $centralUser->tenants()->syncWithoutDetaching([$tenant->getTenantKey()]);

        $tenant->run(function () use ($centralUser, $invitation): void {
            $role = Role::query()->where('slug', $invitation->role_slug)->first()
                ?? Role::query()->where('slug', 'user')->firstOrFail();

            User::query()
                ->firstWhere('global_id', $centralUser->global_id)
                ->assignRole($role);
        });

        $invitation->update(['accepted_at' => now()]);

        return redirect()->route('central.workspaces.enter', $tenant);
    }

    private function pendingInvitation(string $token): Invitation
    {
        return Invitation::query()
            ->pending()
            ->where('token', $token)
            ->with('tenant')
            ->firstOrFail();
    }
}
