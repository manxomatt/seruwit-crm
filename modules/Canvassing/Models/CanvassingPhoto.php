<?php

namespace Modules\Canvassing\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Canvassing\Database\Factories\CanvassingPhotoFactory;

class CanvassingPhoto extends Model
{
    /** @use HasFactory<CanvassingPhotoFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return CanvassingPhotoFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'canvassing_visit_id',
        'path',
    ];

    /** @return BelongsTo<CanvassingVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(CanvassingVisit::class, 'canvassing_visit_id');
    }

    public function getUrlAttribute(): string
    {
        return route('stancl.tenancy.asset', ['path' => $this->path]);
    }
}
