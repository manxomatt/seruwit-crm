<?php

namespace Modules\Pages\Models;

use App\Modules\Facades\Modules;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class PageComponent extends Model
{
    use CentralConnection;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'label',
        'category',
        'module',
        'content',
        'media',
        'attributes',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attributes' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope a query to only include active page components.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to order components by sort_order.
     *
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order', 'asc')->orderBy('id', 'asc');
    }

    /**
     * Whether this component should appear in the page editor's block palette
     * for the current request context.
     *
     * A module-bound component is hidden from a tenant's editor unless that tenant
     * has the module installed, so a tenant never sees a widget it cannot render.
     * The central admin (no tenant initialized) always sees every component — the
     * whole library stays manageable there regardless of any single tenant's plan.
     */
    public function isAvailableInCurrentContext(): bool
    {
        if ($this->module === null || $this->module === '') {
            return true;
        }

        if (! tenancy()->initialized) {
            return true;
        }

        return Modules::available($this->module);
    }
}
