<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Stancl\Tenancy\Database\Models\Domain as BaseDomain;

/**
 * Domain model representing both system subdomains and tenant custom domains.
 *
 * Pinned to the central connection because the `domains` table lives in the
 * central schema, ensuring reads/writes from tenant context work properly.
 *
 * @property int $id
 * @property string $domain
 * @property string $tenant_id
 * @property bool $is_custom
 * @property bool $is_primary
 * @property string $status
 * @property string|null $verification_token
 * @property string|null $cloudflare_hostname_id
 * @property string|null $cloudflare_status
 * @property string|null $cloudflare_ssl_status
 * @property \Illuminate\Support\Carbon|null $verified_at
 * @property \Illuminate\Support\Carbon|null $last_checked_at
 * @property string|null $last_error
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Domain extends BaseDomain
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PENDING_DNS = 'pending_dns';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_FAILED = 'failed';

    /**
     * Pinned to the central connection.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'domain',
        'tenant_id',
        'is_custom',
        'is_primary',
        'status',
        'verification_token',
        'cloudflare_hostname_id',
        'cloudflare_status',
        'cloudflare_ssl_status',
        'verified_at',
        'last_checked_at',
        'last_error',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
            'is_primary' => 'boolean',
            'verified_at' => 'datetime',
            'last_checked_at' => 'datetime',
        ];
    }

    /**
     * Scope for custom domains added by tenants.
     *
     * @param  Builder<Domain>  $query
     * @return Builder<Domain>
     */
    public function scopeCustom(Builder $query): Builder
    {
        return $query->where('is_custom', true);
    }

    /**
     * Scope for system-provided subdomains.
     *
     * @param  Builder<Domain>  $query
     * @return Builder<Domain>
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_custom', false);
    }

    /**
     * Scope for active / verified domains.
     *
     * @param  Builder<Domain>  $query
     * @return Builder<Domain>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_ACTIVE, self::STATUS_VERIFIED]);
    }
}
