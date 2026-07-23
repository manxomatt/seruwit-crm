<?php

namespace Modules\Canvassing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Canvassing\Database\Factories\CanvassingTargetFactory;

class CanvassingTarget extends Model
{
    /** @use HasFactory<CanvassingTargetFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return CanvassingTargetFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'salesperson_id',
        'year',
        'month',
        'target_visits',
        'target_new_partners',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
            'target_visits' => 'integer',
            'target_new_partners' => 'integer',
        ];
    }

    /** @return BelongsTo<Salesperson, $this> */
    public function salesperson(): BelongsTo
    {
        return $this->belongsTo(Salesperson::class);
    }
}
