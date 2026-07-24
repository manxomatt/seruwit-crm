<?php

namespace Modules\Routing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Orders\Models\DeliveryOrder;

class RoutePlanStop extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'route_plan_route_id',
        'delivery_order_id',
        'sequence',
        'address',
        'lat',
        'lng',
        'demand_kg',
        'distance_from_previous_km',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'demand_kg' => 'decimal:2',
            'distance_from_previous_km' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<RoutePlanRoute, $this>
     */
    public function route(): BelongsTo
    {
        return $this->belongsTo(RoutePlanRoute::class, 'route_plan_route_id');
    }

    /**
     * @return BelongsTo<DeliveryOrder, $this>
     */
    public function deliveryOrder(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class);
    }
}
