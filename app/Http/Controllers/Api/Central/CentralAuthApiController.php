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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Modules\Fleet\Models\Driver;
use Throwable;

class CentralAuthApiController extends Controller
{
    /**
     * Authenticate against central identity database and return all available workspaces.
     * Can also be called directly on central domain via /api/staff/v1/auth/login.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'tenant_id' => ['nullable', 'string'],
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

        DB::table('users')->where('id', $user->id)->update(['last_login_at' => now()]);

        $deviceName = (string) ($request->input('device_name') ?: 'Mobile App');
        $centralToken = $user->createToken('central_'.$deviceName)->plainTextToken;

        $tenants = $this->resolveUserTenants($user);

        // Check if a specific tenant is requested or if user belongs to exactly one tenant
        $targetTenantId = $request->input('tenant_id') ?: $request->header('X-Tenant-Id');
        $targetTenant = null;

        if ($targetTenantId) {
            $targetTenant = $user->tenants()->whereKey($targetTenantId)->first();
        } elseif (count($tenants) === 1) {
            $targetTenant = $user->tenants()->first();
        }

        $tenantAuth = null;
        if ($targetTenant && $targetTenant->status === 'active') {
            $tenantAuth = $this->mintTenantToken($targetTenant, $user, $deviceName);
        }

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
                // If a tenant was auto-resolved or selected, supply tenant-scoped credentials directly
                'token' => $tenantAuth ? $tenantAuth['token'] : null,
                'tenant' => $tenantAuth ? $tenantAuth['tenant'] : null,
                'api_base_url' => $tenantAuth ? $tenantAuth['api_base_url'] : null,
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
        $tenantAuth = $this->mintTenantToken($tenant, $user, $deviceName);

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
            'data' => $tenantAuth,
        ]);
    }

    /**
     * Mint a Sanctum token inside a specific tenant's database schema.
     *
     * @return array<string, mixed>|null
     */
    private function mintTenantToken(Tenant $tenant, CentralUser $user, string $deviceName): ?array
    {
        $domain = $tenant->domains->first()?->domain;

        try {
            return $tenant->run(function () use ($user, $deviceName, $domain, $tenant): ?array {
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
                    'tenant' => [
                        'id' => $tenant->id,
                        'name' => $tenant->name,
                        'domain' => $domain,
                    ],
                    'api_base_url' => $domain ? 'https://'.$domain.'/api/staff/v1' : null,
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
        } catch (Throwable) {
            return null;
        }
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
