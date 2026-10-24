<?php

declare(strict_types=1);

namespace Modules\Rental\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Modules\Rental\Http\Requests\Staff\StaffLoginRequest;

class StaffAuthController extends Controller
{
    /**
     * Authenticate staff member and issue Sanctum token.
     */
    public function login(StaffLoginRequest $request): JsonResponse
    {
        $login = $request->validated('login');
        $password = (string) $request->validated('password');

        /** @var User|null $user */
        $user = User::query()
            ->where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                    'message' => __('auth.failed'),
                ],
            ], 401);
        }

        $user->update(['last_login_at' => now()]);

        $deviceName = (string) ($request->validated('device_name') ?: 'mobile-staff');
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => $this->transformUser($user),
            ],
        ]);
    }

    /**
     * Retrieve the authenticated staff user profile and permissions.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $this->transformUser($user),
            ],
        ]);
    }

    /**
     * Invalidate the current Sanctum access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function transformUser(User $user): array
    {
        $roles = $user->roles()->with('permissions')->get();
        $roleSlugs = $roles->pluck('slug')->values()->all();

        $permissions = $roles
            ->flatMap(fn ($role) => $role->permissions)
            ->map(fn ($perm): string => (string) ($perm->slug ?? ($perm->module.':'.$perm->action)))
            ->unique()
            ->values()
            ->all();

        return [
            'id' => $user->id,
            'global_id' => $user->global_id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $roleSlugs,
            'permissions' => $permissions,
        ];
    }
}
