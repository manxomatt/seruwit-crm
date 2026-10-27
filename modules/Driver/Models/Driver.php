<?php

namespace Modules\Driver\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Driver\Database\Factories\DriverFactory;

/**
 * Driver entity representing a professional driver or operator.
 * Independent of vehicle or trip concepts, reusable across Rental, Shuttle,
 * Logistics, and Driver Scoring.
 */
class Driver extends Model
{
    /** @use HasFactory<DriverFactory> */
    use HasFactory;

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_ON_TRIP = 'on_trip';

    public const STATUS_OFF_DUTY = 'off_duty';

    public const STATUS_ON_LEAVE = 'on_leave';

    public const STATUS_INACTIVE = 'inactive';

    protected static function newFactory(): Factory
    {
        return DriverFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
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
            'license_expires_at' => 'date:Y-m-d',
        ];
    }

    /**
     * The driver's login user account, if one has been provisioned.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The driver linked to a given login, or null.
     */
    public static function forUser(User $user): ?self
    {
        return static::query()->firstWhere('user_id', $user->id);
    }
}
