<?php

namespace Modules\Maintenance\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceScheduleReminder extends Model
{
    public const KIND_DUE_SOON = 'due_soon';

    public const KIND_OVERDUE = 'overdue';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'maintenance_schedule_id',
        'kind',
        'target',
        'sent_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<MaintenanceSchedule, $this>
     */
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(MaintenanceSchedule::class, 'maintenance_schedule_id');
    }
}
