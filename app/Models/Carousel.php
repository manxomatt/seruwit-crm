<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carousel extends Model
{
    /** @use HasFactory<\Database\Factories\CarouselFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'is_active',
        'autoplay_interval',
        'show_navigation',
        'show_indicators',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'autoplay_interval' => 'integer',
            'show_navigation' => 'boolean',
            'show_indicators' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<CarouselImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(CarouselImage::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<CarouselImage, $this>
     */
    public function activeImages(): HasMany
    {
        return $this->hasMany(CarouselImage::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }
}
