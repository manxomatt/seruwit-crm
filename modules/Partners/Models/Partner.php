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
        'company_registry',
        'reference',
        'parent_id',
        'industry_id',
        'title_id',
        'customer_rank',
        'supplier_rank',
        'credit_limit',
        'address',
        'notes',
        'comment',
        'status',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'customer_rank' => 'integer',
            'supplier_rank' => 'integer',
            'credit_limit' => 'decimal:2',
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
}
