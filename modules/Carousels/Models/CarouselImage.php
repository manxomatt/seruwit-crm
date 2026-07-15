<?php

namespace Modules\Carousels\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Carousels\Database\Factories\CarouselImageFactory;

class CarouselImage extends Model
{
    /** @use HasFactory<CarouselImageFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return CarouselImageFactory::new();
    }

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
