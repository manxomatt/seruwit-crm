<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * Business profile of a reseller: referral code, payout details, and the
 * per-reseller default rates that sit between platform rules and the hardcoded
 * config fallback in the resolution chain.
 *
 * A reseller without a profile is still a valid reseller — they simply have no
 * overrides. Accrual never requires one.
 *
 * @property string $reseller_global_id
 * @property string $referral_code
 * @property string $status
 */
class ResellerProfile extends Model
{
    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_TERMINATED = 'terminated';

    /**
     * Pinned to the central connection: the reseller program is a control-plane
     * concern and must read correctly even from inside a tenant context.
     */
    public function getConnectionName(): ?string
    {
        return config('tenancy.database.central_connection');
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'reseller_global_id',
        'parent_global_id',
        'referral_code',
        'company_name',
        'status',
        'default_commission_type',
        'default_commission_value',
        'renewal_commission_value',
        'payout_bank_name',
        'payout_account_number',
        'payout_account_name',
        'tax_id',
        'minimum_payout',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_commission_value' => 'decimal:2',
            'renewal_commission_value' => 'decimal:2',
            'minimum_payout' => 'decimal:2',
        ];
    }

    public function reseller(): BelongsTo
    {
        return $this->belongsTo(CentralUser::class, 'reseller_global_id', 'global_id');
    }

    /**
     * @return HasMany<ResellerCommission, $this>
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(ResellerCommission::class, 'reseller_global_id', 'reseller_global_id');
    }

    /**
     * Whether this reseller may still earn new commissions.
     *
     * Suspension only blocks payouts — a suspended reseller keeps accruing so
     * that a temporary dispute does not silently cost them earned fees.
     */
    public function canAccrue(): bool
    {
        return $this->status !== self::STATUS_TERMINATED;
    }

    public function canBePaid(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * @param  Builder<$this>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * A short, human-quotable referral code. Collisions are resolved by
     * retrying rather than by widening the code, so links stay short.
     */
    public static function generateReferralCode(): string
    {
        do {
            $code = 'SRW-'.Str::upper(Str::random(6));
        } while (self::query()->where('referral_code', $code)->exists());

        return $code;
    }
}
