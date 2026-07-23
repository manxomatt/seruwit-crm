<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Rental\Database\Factories\RentalDamageFactory;

class RentalDamage extends Model
{
    /** @use HasFactory<RentalDamageFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return RentalDamageFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'description',
        'amount',
        'photo_path',
        'reported_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'reported_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }
}
