<?php

namespace Modules\Fleet\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Modules\Fleet\Database\Factories\DriverFactory;

/**
 * Deliberately has no knowledge of Trip or any other consumer's booking
 * concept — Fleet exists so Transportation, Rental, or any future module can
 * reference the same driver records via `requires(): ['fleet']` without this
 * module depending back on any of them.
 */
class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return DriverFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'license_number',
        'license_type',
        'license_expires_at',
        'phone',
        'email',
        'status',
        'photo_url',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'license_expires_at' => 'date',
        ];
    }
}
