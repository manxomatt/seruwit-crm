<?php

namespace Modules\Driver\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Driver\Http\Requests\StoreDriverAccountRequest;
use Modules\Driver\Models\Driver;

/**
 * Provisions a login user account for a Driver: creates a tenant User, gives it
 * the driver role, and links it back to the Driver record.
 */
class DriverAccountController extends Controller
{
    public function store(StoreDriverAccountRequest $request, Driver $driver): RedirectResponse
    {
        if ($driver->user_id !== null) {
            return back()->withErrors(['username' => 'This driver already has a login.']);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($driver, $validated): void {
            $user = User::create([
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            $user->assignRole($this->driverRole());

            $driver->update(['user_id' => $user->id]);
        });

        return back()->with('success', __('fleet.messages.driver_login_created'));
    }

    /**
     * Resolves the driver role, guaranteeing it carries the orders.deliver capability.
     */
    protected function driverRole(): Role
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => 'driver'],
            [
                'name' => 'Driver',
                'description' => 'Mobile delivery driver — POD only',
                'is_system' => true,
                'dashboard_path' => '/module/driver/today',
            ],
        );

        $deliver = Permission::query()->firstWhere([
            'module' => 'orders',
            'action' => 'deliver',
        ]);

        if ($deliver !== null && ! $role->permissions()->where('permissions.id', $deliver->id)->exists()) {
            $role->permissions()->attach($deliver->id);
        }

        return $role;
    }
}
