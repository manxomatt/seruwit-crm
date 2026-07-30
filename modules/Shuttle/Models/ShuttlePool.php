<?php

namespace Modules\Shuttle\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Partners\Models\Location;

class ShuttlePool extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'city_id',
        'code',
        'name',
        'location_id',
        'corridor_id',
        'is_origin',
        'is_destination',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_origin' => 'boolean',
            'is_destination' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function displayName(): string
    {
        if (filled($this->name)) {
            return $this->name;
        }

        return $this->location?->name ?? ($this->code ?? 'Pool #'.$this->id);
    }

    /**
     * @return BelongsTo<ShuttleCity, $this>
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(ShuttleCity::class, 'city_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * @return BelongsTo<ShuttleCorridor, $this>
     */
    public function corridor(): BelongsTo
    {
        return $this->belongsTo(ShuttleCorridor::class, 'corridor_id');
    }
}
