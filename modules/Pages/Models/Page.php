<?php

namespace Modules\Pages\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Pages\Database\Factories\PageFactory;

class Page extends Model
{
    /** @use HasFactory<PageFactory> */
    use HasFactory;

    /**
     * Factory resolution assumes App\Models, so a module's models must point at
     * their own factory explicitly.
     */
    protected static function newFactory(): Factory
    {
        return PageFactory::new();
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'slug',
        'html',
        'css',
        'gjs_data',
        'is_published',
        'is_homepage',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'gjs_data' => 'array',
            'is_published' => 'boolean',
            'is_homepage' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
