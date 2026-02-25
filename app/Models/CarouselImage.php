<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarouselImage extends Model
{
    /** @use HasFactory<\Database\Factories\CarouselImageFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'carousel_id',
        'image_path',
        'title',
        'description',
        'link_url',
        'link_target',
        'button_text',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Carousel, $this>
     */
    public function carousel(): BelongsTo
    {
        return $this->belongsTo(Carousel::class);
    }
}
