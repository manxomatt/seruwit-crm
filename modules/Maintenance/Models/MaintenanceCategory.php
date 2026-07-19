<?php

namespace Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaintenanceCategory extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'color',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<WorkOrder, $this>
     */
    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class, 'category_id');
    }

    /**
     * @return HasMany<MaintenanceSchedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(MaintenanceSchedule::class, 'category_id');
    }
}
