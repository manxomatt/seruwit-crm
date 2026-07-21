<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Orders\Database\Factories\PodItemFactory;

/**
 * The delivered outcome for one order line: how much was accepted, rejected, or
 * returned, and why.
 */
class PodItem extends Model
{
    /** @use HasFactory<PodItemFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return PodItemFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'proof_of_delivery_id',
        'delivery_order_item_id',
        'accepted_quantity',
        'rejected_quantity',
        'returned_quantity',
        'reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'accepted_quantity' => 'decimal:2',
            'rejected_quantity' => 'decimal:2',
            'returned_quantity' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<ProofOfDelivery, $this>
     */
    public function proofOfDelivery(): BelongsTo
    {
        return $this->belongsTo(ProofOfDelivery::class);
    }

    /**
     * @return BelongsTo<DeliveryOrderItem, $this>
     */
    public function deliveryOrderItem(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrderItem::class);
    }
}
