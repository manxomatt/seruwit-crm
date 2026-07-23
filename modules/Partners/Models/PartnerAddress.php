<?php

namespace Modules\Partners\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Database\Factories\PartnerAddressFactory;

class PartnerAddress extends Model
{
    /** @use HasFactory<PartnerAddressFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return PartnerAddressFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'partner_id',
        'type',
        'label',
        'street',
        'street2',
        'city',
        'province',
        'zip',
        'country',
        'latitude',
        'longitude',
        'is_default',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_default' => 'boolean',
        ];
    }

    /** @return BelongsTo<Partner, $this> */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
