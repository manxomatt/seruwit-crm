<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Partners\Database\Factories\PartnerFactory;
use Modules\Sales\Models\PriceList;

class Partner extends Model
{
    /** @use HasFactory<PartnerFactory> */
    use HasFactory;

    use SoftDeletes;

    protected static function newFactory(): Factory
    {
        return PartnerFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'global_customer_id',
        'code',
        'account_type',
        'sub_type',
        'name',
        'email',
        'phone',
        'mobile',
        'job_title',
        'website',
        'tax_id',
        'id_number',
        'license_number',
        'license_expires_at',
        'company_registry',
        'reference',
        'parent_id',
        'industry_id',
        'title_id',
        'customer_rank',
        'supplier_rank',
        'credit_limit',
        'payment_term_days',
        'price_list_id',
        'address',
        'notes',
        'comment',
        'status',
        'is_blacklisted',
        'blacklist_reason',
        'blacklisted_at',
        'portal_user_id',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'customer_rank' => 'integer',
            'supplier_rank' => 'integer',
            'credit_limit' => 'decimal:2',
            'payment_term_days' => 'integer',
            'license_expires_at' => 'date:Y-m-d',
            'is_blacklisted' => 'boolean',
            'blacklisted_at' => 'datetime',
        ];
    }

    public function isCustomer(): bool
    {
        return $this->customer_rank > 0;
    }

    public function isSupplier(): bool
    {
        return $this->supplier_rank > 0;
    }

    public static function nextCode(string $prefix = 'PART'): string
    {
        $lastNumber = (int) static::query()
            ->orderByDesc('id')
            ->value('id');

        return sprintf('%s-%06d', $prefix, $lastNumber + 1);
    }

    /** @return BelongsTo<self, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<self, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /** @return BelongsTo<PartnerIndustry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(PartnerIndustry::class, 'industry_id');
    }

    /** @return BelongsTo<PriceList, $this> */
    public function priceList(): BelongsTo
    {
        return $this->belongsTo(PriceList::class);
    }

    /** @return BelongsTo<PartnerTitle, $this> */
    public function title(): BelongsTo
    {
        return $this->belongsTo(PartnerTitle::class, 'title_id');
    }

    /** @return BelongsToMany<PartnerTag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(PartnerTag::class, 'partner_partner_tag', 'partner_id', 'tag_id');
    }

    /** @return BelongsToMany<PartnerType, $this> */
    public function types(): BelongsToMany
    {
        return $this->belongsToMany(PartnerType::class, 'partner_partner_type', 'partner_id', 'partner_type_id');
    }

    /** @return HasMany<PartnerAddress, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(PartnerAddress::class);
    }

    /** @return HasMany<PartnerBankAccount, $this> */
    public function bankAccounts(): HasMany
    {
        return $this->hasMany(PartnerBankAccount::class);
    }

    /** @return BelongsTo<\App\Models\User, $this> */
    public function portalUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'portal_user_id');
    }

    public static function forPortalUser(\App\Models\User $user): ?self
    {
        return static::query()
            ->where('portal_user_id', $user->id)
            ->where('status', 'active')
            ->first();
    }
}
