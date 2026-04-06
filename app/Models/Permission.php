<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
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
        'module',
        'action',
        'description',
    ];

    /**
     * Available modules in the system.
     *
     * @var array<string, string>
     */
    public const MODULES = [
        'pages' => 'Pages',
        'posts' => 'Posts',
        'carousels' => 'Carousels',
        'media' => 'Media',
        'users' => 'Users',
        'settings' => 'Settings',
        'roles' => 'Roles',
        'live-updates' => 'Live Updates',
        'analytics' => 'Analytics',
    ];

    /**
     * Available actions for permissions.
     *
     * @var array<string, string>
     */
    public const ACTIONS = [
        'view' => 'View',
        'create' => 'Create',
        'update' => 'Update',
        'delete' => 'Delete',
    ];

    /**
     * The roles that belong to the permission.
     *
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)->withTimestamps();
    }

    /**
     * Generate a permission slug from module and action.
     */
    public static function generateSlug(string $module, string $action): string
    {
        return "{$module}.{$action}";
    }

    /**
     * Generate a permission name from module and action.
     */
    public static function generateName(string $module, string $action): string
    {
        $moduleName = self::MODULES[$module] ?? ucfirst($module);
        $actionName = self::ACTIONS[$action] ?? ucfirst($action);

        return "{$actionName} {$moduleName}";
    }

    /**
     * Get all available modules.
     *
     * @return array<string, string>
     */
    public static function getModules(): array
    {
        return self::MODULES;
    }

    /**
     * Get all available actions.
     *
     * @return array<string, string>
     */
    public static function getActions(): array
    {
        return self::ACTIONS;
    }

    /**
     * Find a permission by module and action.
     */
    public static function findByModuleAction(string $module, string $action): ?self
    {
        return self::query()
            ->where('module', $module)
            ->where('action', $action)
            ->first();
    }
}
