<?php

namespace Modules\Fleet\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_ON_LEAVE = 'on_leave';

    public const STATUS_INACTIVE = 'inactive';

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
            'license_expires_at' => 'date',
        ];
    }

    /**
     * The driver's login, if one has been provisioned. Points at the core User
     * model — a downward reference, so Fleet stays free of consumer modules.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The driver linked to a given login, or null. How the driver portal
     * resolves "who am I" from the authenticated user.
     */
    public static function forUser(User $user): ?self
    {
        return static::query()->firstWhere('user_id', $user->id);
    }
}
