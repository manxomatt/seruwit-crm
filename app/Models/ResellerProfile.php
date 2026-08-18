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
     * The profile for a reseller, created on first use.
     *
     * Enrolment has no ceremony: holding the role is what makes someone a
     * reseller, and the profile is just where their settings live once anyone
     * asks for them.
     */
    public static function ensureFor(string $resellerGlobalId): self
    {
        // Status and threshold are set explicitly rather than left to the column
        // defaults: firstOrCreate returns the in-memory model, which would carry
        // a null status until something refreshed it — and a null status reads
        // as "not active" everywhere it is checked.
        return static::query()->firstOrCreate(
            ['reseller_global_id' => $resellerGlobalId],
            [
                'referral_code' => static::generateReferralCode(),
                'status' => self::STATUS_ACTIVE,
                'minimum_payout' => 0,
            ],
        );
    }

    /**
     * The public sign-up link that attributes a new tenant to this reseller.
     */
    public function referralUrl(): string
    {
        return rtrim((string) config('app.url'), '/').'/register?ref='.$this->referral_code;
    }

    /**
     * Payout account shown to anyone but its owner or platform staff.
     */
    public function maskedAccountNumber(): ?string
    {
        if (blank($this->payout_account_number)) {
            return null;
        }

        return str_repeat('•', 4).' '.substr($this->payout_account_number, -4);
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
