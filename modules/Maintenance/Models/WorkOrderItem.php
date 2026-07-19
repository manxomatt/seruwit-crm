<?php

namespace Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrderItem extends Model
{
    public const TYPE_PART = 'part';

    public const TYPE_LABOR = 'labor';

    public const TYPE_OTHER = 'other';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'work_order_id',
        'item_type',
        'name',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'total_price',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<WorkOrder, $this>
     */
    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }
}
