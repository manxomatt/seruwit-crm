<?php

namespace Modules\Canvassing\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Canvassing\Database\Factories\SalespersonFactory;

class Salesperson extends Model
{
    /** @use HasFactory<SalespersonFactory> */
    use HasFactory;

    protected static function newFactory(): Factory
    {
        return SalespersonFactory::new();
    }

    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'name',
        'employee_code',
        'phone',
        'email',
        'area',
        'is_active',
        'notes',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<CanvassingPlan, $this> */
    public function plans(): HasMany
    {
        return $this->hasMany(CanvassingPlan::class);
    }

    /** @return HasMany<CanvassingVisit, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(CanvassingVisit::class);
    }

    /** @return HasMany<CanvassingTarget, $this> */
    public function targets(): HasMany
    {
        return $this->hasMany(CanvassingTarget::class);
    }

    /**
     * Resolve the active salesperson for a given user, or null if none linked.
     */
    public static function forUser(User $user): ?self
    {
        return static::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();
    }

    /** @param Builder<self> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
