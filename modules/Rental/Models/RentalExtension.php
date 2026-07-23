<?php

namespace Modules\Rental\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Rental\Database\Factories\RentalExtensionFactory;

class RentalExtension extends Model
{
    /** @use HasFactory<RentalExtensionFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return RentalExtensionFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'rental_id',
        'original_end_date',
        'new_end_date',
        'extended_periods',
        'additional_amount',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'original_end_date' => 'date',
            'new_end_date' => 'date',
            'extended_periods' => 'integer',
            'additional_amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Rental, $this> */
    public function rental(): BelongsTo
    {
        return $this->belongsTo(Rental::class);
    }
}
