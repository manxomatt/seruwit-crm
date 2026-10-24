<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Central;

use App\Http\Controllers\Controller;
use App\Models\CentralUser;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Modules\Fleet\Models\Driver;
use Throwable;

class CentralAuthApiController extends Controller
{
    /**
     * Authenticate against central identity database and return all available workspaces.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $login = $validated['login'];
        $user = CentralUser::query()
            ->where('email', $login)
            ->orWhere('username', $login)
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_CREDENTIALS',
                    'message' => 'Email/username atau password salah.',
                ],
            ], 401);
        }

        $user->forceFill(['last_login_at' => now()])->save();

        $deviceName = (string) ($request->input('device_name') ?: 'Mobile App');
        $centralToken = $user->createToken('central_'.$deviceName)->plainTextToken;

        $tenants = $this->resolveUserTenants($user);

        return response()->json([
            'success' => true,
            'message' => 'Autentikasi central berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'global_id' => $user->global_id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
                'central_token' => $centralToken,
                'tenants' => $tenants,
                'has_multiple_tenants' => count($tenants) > 1,
            ],
        ]);
    }

    /**
     * List all workspaces/tenants that the authenticated user belongs to.
     */
    public function workspaces(Request $request): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();

        $tenants = $this->resolveUserTenants($user);

        return response()->json([
            'success' => true,
            'data' => [
                'tenants' => $tenants,
                'count' => count($tenants),
            ],
        ]);
    }

    /**
     * Exchange central authentication for a tenant-scoped Sanctum bearer token.
     */
    public function exchangeWorkspaceToken(Request $request, Tenant $tenant): JsonResponse
    {
        /** @var CentralUser $user */
        $user = $request->user();

        if (! $user->tenants()->whereKey($tenant->getTenantKey())->exists()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'NOT_A_MEMBER',
                    'message' => 'Anda bukan anggota dari workspace ini.',
                ],
            ], 403);
        }

        if ($tenant->status !== 'active') {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'WORKSPACE_INACTIVE',
                    'message' => 'Workspace sedang non-aktif atau dalam masa penangguhan.',
                ],
            ], 403);
        }

        $deviceName = (string) ($request->input('device_name') ?: 'Mobile App');
        $domain = $tenant->domains->first()?->domain;

        $tenantAuth = null;
        try {
            $tenantAuth = $tenant->run(function () use ($user, $deviceName): ?array {
                $tenantUser = User::query()
                    ->where('global_id', $user->global_id)
                    ->with('roles')
                    ->first();

                if (! $tenantUser) {
                    return null;
                }

                $token = $tenantUser->createToken('tenant_'.$deviceName)->plainTextToken;
                $driver = class_exists(Driver::class) ? Driver::forUser($tenantUser) : null;

                return [
                    'token' => $token,
                    'user' => [
                        'id' => $tenantUser->id,
                        'global_id' => $tenantUser->global_id,
                        'name' => $tenantUser->name,
                        'email' => $tenantUser->email,
                        'roles' => $tenantUser->roles->map(fn (Role $r): array => [
                            'id' => $r->id,
                            'name' => $r->name,
                            'slug' => $r->slug,
                        ])->values()->all(),
                        'driver_profile' => $driver ? [
                            'id' => $driver->id,
                            'name' => $driver->name,
                            'phone' => $driver->phone,
                        ] : null,
                    ],
                ];
            });
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_INITIALIZATION_FAILED',
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }

        if (! $tenantAuth) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'TENANT_USER_NOT_FOUND',
                    'message' => 'Akun pengguna tidak ditemukan di schema workspace ini.',
                ],
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil menghubungkan ke workspace.',
            'data' => [
                'token' => $tenantAuth['token'],
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'domain' => $domain,
                ],
                'api_base_url' => $domain ? 'https://'.$domain.'/api/staff/v1' : null,
                'user' => $tenantAuth['user'],
            ],
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function resolveUserTenants(CentralUser $user): array
    {
        return $user->tenants()
            ->with('domains')
            ->get()
            ->map(function (Tenant $tenant) use ($user): array {
                $roles = [];
                try {
                    $roles = $tenant->run(function () use ($user): array {
                        $tenantUser = User::query()
                            ->where('global_id', $user->global_id)
                            ->with('roles:id,name,slug')
                            ->first();

                        if (! $tenantUser) {
                            return [];
                        }

                        return $tenantUser->roles
                            ->map(fn (Role $r): array => [
                                'id' => $r->id,
                                'name' => $r->name,
                                'slug' => $r->slug,
                            ])
                            ->values()
                            ->all();
                    });
                } catch (Throwable) {
                    $roles = [];
                }

                $domain = $tenant->domains->first()?->domain;

                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'status' => $tenant->status,
                    'domain' => $domain,
                    'api_base_url' => $domain ? 'https://'.$domain.'/api/staff/v1' : null,
                    'roles' => $roles,
                ];
            })
            ->values()
            ->all();
    }
}
