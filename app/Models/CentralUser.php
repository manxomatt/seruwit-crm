<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Stancl\Tenancy\Contracts\SyncMaster;
use Stancl\Tenancy\Database\Concerns\CentralConnection;
use Stancl\Tenancy\Database\Concerns\ResourceSyncing;
use Stancl\Tenancy\Database\Models\TenantPivot;

/**
 * The global user identity, stored in the central users table.
 *
 * Tenant schemas hold synced copies of this record (see App\Models\User).
 * Name, email and password are kept in sync across the central record and
 * every tenant copy; roles are intentionally tenant-local.
 */
class CentralUser extends Authenticatable implements SyncMaster
{
    use CentralConnection, Notifiable, ResourceSyncing;

    protected $table = 'users';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'global_id',
        'name',
        'username',
        'email',
        'password',
        'last_login_at',
        'locale',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if (blank($user->global_id)) {
                $user->global_id = (string) Str::uuid();
            }
        });
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * The tenants (workspaces) this user belongs to.
     *
     * @return BelongsToMany<Tenant, $this>
     */
    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_users', 'global_user_id', 'tenant_id', 'global_id')
            ->using(TenantPivot::class)
            ->withTimestamps();
    }

    /**
     * Reseller programme profile, if this identity is enrolled as a reseller.
     *
     * @return HasOne<ResellerProfile, $this>
     */
    public function resellerProfile(): HasOne
    {
        return $this->hasOne(ResellerProfile::class, 'reseller_global_id', 'global_id');
    }

    /**
     * Tenants this identity brought in as a reseller.
     *
     * @return HasMany<Tenant, $this>
     */
    public function resoldTenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'reseller_global_id', 'global_id');
    }

    public function getTenantModelName(): string
    {
        return User::class;
    }

    public function getGlobalIdentifierKey(): string
    {
        return (string) $this->getAttribute($this->getGlobalIdentifierKeyName());
    }

    public function getGlobalIdentifierKeyName(): string
    {
        return 'global_id';
    }

    public function getCentralModelName(): string
    {
        return static::class;
    }

    /**
     * @return array<int, string>
     */
    public function getSyncedAttributeNames(): array
    {
        return [
            'name',
            'username',
            'email',
            'password',
            'locale',
        ];
    }
}
