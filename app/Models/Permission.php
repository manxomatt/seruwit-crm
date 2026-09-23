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
    /**
     * Core modules, seeded for every tenant. Optional modules declare their own
     * permissions via App\Modules\ModuleContract and are seeded on install, so
     * they are deliberately absent here.
     */
    public const MODULES = [
        'media' => 'Media',
        'pages' => 'Pages',
        'posts' => 'Posts',
        'carousels' => 'Carousels',
        'users' => 'Users',
        'settings' => 'Settings',
        'roles' => 'Roles',
        'live-updates' => 'Live Updates',
        'analytics' => 'Analytics',
        'partners' => 'Contacts',
        'accounting' => 'Accounting',
        'subscription' => 'Subscription',
    ];

    /**
     * Accounting uses a custom action set (not CRUD). Seeded for every tenant.
     *
     * @var array<string, string>
     */
    public const ACCOUNTING_ACTIONS = [
        'view' => 'View',
        'manage_coa' => 'Manage COA',
        'journal' => 'Journal',
        'post' => 'Post',
        'period' => 'Period',
        'bank' => 'Bank',
        'manage_tax' => 'Manage Tax',
        'manage_assets' => 'Manage Assets',
        'manage_budget' => 'Manage Budget',
    ];

    /**
     * Rental uses a feature-level action set. Seeded when Rental module is installed.
     *
     * @var array<string, string>
     */
    public const RENTAL_ACTIONS = [
        'view' => 'View (Dashboard & Calendar)',
        'bookings' => 'Bookings & Reservations',
        'dispatch' => 'Fleet Dispatch & Handover',
        'damages' => 'Damages & Claims',
        'finance' => 'Finance & Security Deposits',
        'rates' => 'Tariff Rates & Pricing',
        'settings' => 'Module Settings & Templates',
    ];

    /**
     * Available actions for permissions (standard CRUD).
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
        $modules = self::getModules();
        $moduleName = $modules[$module] ?? ucfirst($module);
        $actionName = match ($module) {
            'accounting' => self::ACCOUNTING_ACTIONS[$action] ?? self::ACTIONS[$action] ?? ucfirst($action),
            'rental' => self::RENTAL_ACTIONS[$action] ?? self::ACTIONS[$action] ?? ucfirst($action),
            default => self::ACTIONS[$action] ?? self::getActions()[$action] ?? ucfirst($action),
        };

        return "{$actionName} {$moduleName}";
    }

    /**
     * Get default actions that belong to a specific module.
     *
     * @return array<string, string>
     */
    public static function defaultActionsFor(string $module): array
    {
        return match ($module) {
            'accounting' => self::ACCOUNTING_ACTIONS,
            'rental' => self::RENTAL_ACTIONS,
            'settings', 'subscription' => [
                'view' => 'View',
                'update' => 'Update',
            ],
            'analytics' => [
                'view' => 'View',
            ],
            default => self::ACTIONS,
        };
    }

    /**
     * Get all available modules.
     *
     * @return array<string, string>
     */
    public static function getModules(): array
    {
        $modules = self::MODULES;

        if (class_exists(\App\Modules\Facades\Modules::class)) {
            try {
                foreach (\App\Modules\Facades\Modules::all() as $module) {
                    $modules[$module->key()] = $module->label();
                }
            } catch (\Throwable) {
                // Ignore if container or module facade is not ready
            }
        }

        return $modules;
    }

    /**
     * Get all available actions dictionary for label display.
     *
     * @return array<string, string>
     */
    public static function getActions(): array
    {
        return array_merge(
            [
                'approve' => 'Approve',
                'assign' => 'Assign',
                'manage_bays' => 'Manage bays',
                'decide' => 'Decide',
                'deliver' => 'Deliver',
                'adjust' => 'Adjust Stock',
                'receive' => 'Receive',
                'issue' => 'Issue',
                'checkin' => 'Check-in',
            ],
            self::ACCOUNTING_ACTIONS,
            self::RENTAL_ACTIONS,
            // Standard CRUD actions take precedence so 'view' stays 'View'
            self::ACTIONS,
        );
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
