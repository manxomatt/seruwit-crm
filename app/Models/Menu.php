<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Route;

class Menu extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'icon',
        'route_name',
        'url',
        'parent_id',
        'permission_module',
        'permission_action',
        'sort_order',
        'is_active',
        'target',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the parent menu item.
     *
     * @return BelongsTo<Menu, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    /**
     * Get the child menu items.
     *
     * @return HasMany<Menu, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('sort_order');
    }

    /**
     * Get active child menu items.
     *
     * @return HasMany<Menu, $this>
     */
    public function activeChildren(): HasMany
    {
        return $this->children()->where('is_active', true);
    }

    /**
     * Scope to get only active menus.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Menu>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Menu>
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only root menus (no parent).
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Menu>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Menu>
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to order by sort_order.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Menu>  $query
     * @return \Illuminate\Database\Eloquent\Builder<Menu>
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Check if user has permission to view this menu item.
     */
    public function userHasPermission(User $user): bool
    {
        // If no permission module is set, menu is visible to all authenticated users
        if (empty($this->permission_module)) {
            return true;
        }

        // Admin has all permissions
        if ($user->isAdmin()) {
            return true;
        }

        // Check if user has the required permission
        return $user->hasPermissionFor($this->permission_module, $this->permission_action);
    }

    /**
     * Get the URL for this menu item.
     */
    public function getUrl(string $routePrefix = 'admin'): ?string
    {
        if ($this->url) {
            return $this->url;
        }

        if ($this->route_name) {
            $fullRouteName = "{$routePrefix}.{$this->route_name}";
            if (Route::has($fullRouteName)) {
                return route($fullRouteName);
            }
        }

        return null;
    }

    /**
     * Get all menus for a user based on their permissions.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function getMenusForUser(User $user, string $routePrefix = 'admin'): Collection
    {
        $menus = self::query()
            ->active()
            ->root()
            ->ordered()
            ->with(['activeChildren' => function ($query) {
                $query->ordered();
            }])
            ->get();

        return $menus
            ->filter(fn (Menu $menu) => $menu->userHasPermission($user))
            ->map(function (Menu $menu) use ($user, $routePrefix) {
                $children = $menu->activeChildren
                    ->filter(fn (Menu $child) => $child->userHasPermission($user))
                    ->map(fn (Menu $child) => $child->toMenuArray($routePrefix))
                    ->values();

                $menuArray = $menu->toMenuArray($routePrefix);
                if ($children->isNotEmpty()) {
                    $menuArray['children'] = $children->toArray();
                }

                return $menuArray;
            })
            ->values();
    }

    /**
     * Convert menu to array format for frontend.
     *
     * @return array<string, mixed>
     */
    public function toMenuArray(string $routePrefix = 'admin'): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'href' => $this->getUrl($routePrefix),
            'route_name' => $this->route_name,
            'permission_module' => $this->permission_module,
            'target' => $this->target,
        ];
    }
}
