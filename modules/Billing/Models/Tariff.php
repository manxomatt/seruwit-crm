<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Billing\Database\Factories\TariffFactory;
use Modules\Partners\Models\Location;
use Modules\Partners\Models\Partner;

class Tariff extends Model
{
    /** @use HasFactory<TariffFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return TariffFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'partner_id',
        'origin_location_id',
        'destination_location_id',
        'origin',
        'destination',
        'price',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The partner this tariff is specific to; null means it applies to every
     * partner that has no tariff of its own for the route.
     *
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function originLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'origin_location_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function destinationLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'destination_location_id');
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Prefer master-location matching (stable IDs), then fall back to the
     * legacy case-insensitive free-text route for older tariffs / orders.
     * Partner-specific tariffs always win over general ones.
     */
    public static function findFor(
        int $partnerId,
        string $origin,
        string $destination,
        ?int $originLocationId = null,
        ?int $destinationLocationId = null,
    ): ?self {
        if ($originLocationId && $destinationLocationId) {
            $byLocation = static::query()
                ->active()
                ->where('origin_location_id', $originLocationId)
                ->where('destination_location_id', $destinationLocationId)
                ->where(fn (Builder $query) => $query->where('partner_id', $partnerId)->orWhereNull('partner_id'))
                ->orderByRaw('partner_id is null')
                ->first();

            if ($byLocation) {
                return $byLocation;
            }
        }

        if (! filled($origin) || ! filled($destination)) {
            return null;
        }

        return static::query()
            ->active()
            ->whereRaw('LOWER(origin) = ?', [mb_strtolower(trim($origin))])
            ->whereRaw('LOWER(destination) = ?', [mb_strtolower(trim($destination))])
            ->where(fn (Builder $query) => $query->where('partner_id', $partnerId)->orWhereNull('partner_id'))
            ->orderByRaw('partner_id is null')
            ->first();
    }
}
