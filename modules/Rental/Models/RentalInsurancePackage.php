<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Rental\Database\Factories\RentalInsurancePackageFactory;

class RentalInsurancePackage extends Model
{
    /** @use HasFactory<RentalInsurancePackageFactory> */
    use HasFactory;

    public const CODE_CDW = 'cdw';

    public const CODE_TPL = 'tpl';

    public const CODE_FULL = 'full';

    protected static function newFactory(): Factory
    {
        return RentalInsurancePackageFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'code',
        'name',
        'period_type',
        'amount',
        'deductible_amount',
        'coverage_limit',
        'description',
        'is_active',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'deductible_amount' => 'decimal:2',
            'coverage_limit' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @return HasMany<Rental, $this> */
    public function rentals(): HasMany
    {
        return $this->hasMany(Rental::class, 'insurance_package_id');
    }

    public function addonCode(): string
    {
        return 'insurance_'.$this->code;
    }
}
