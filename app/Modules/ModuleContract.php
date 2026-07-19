<?php

namespace App\Modules;

/**
 * An optional feature that a tenant can install or uninstall.
 *
 * Implementations must be pure configuration: they are constructed while routes
 * are being registered, long before any tenant is initialized, so they must
 * never touch the database or the tenancy context.
 */
interface ModuleContract
{
    /**
     * Stable identifier, matching the `permissions.module` value and the
     * `installed_modules.key` row. Never change this once shipped.
     */
    public function key(): string;

    /**
     * Human-readable name shown in the module catalog.
     */
    public function label(): string;

    /**
     * One-line explanation of what the module does.
     */
    public function description(): string;

    /**
     * The architectural layer this module belongs to: cross-business-line
     * Foundation, business-line-specific Vertical, or public-site Content.
     * Drives the sidebar grouping and enforces which modules may requires() which.
     */
    public function tier(): ModuleTier;

    /**
     * Permission actions this module owns, e.g. ['view', 'create'].
     *
     * @return list<string>
     */
    public function permissions(): array;

    /**
     * Keys of modules that must be installed before this one.
     *
     * @return list<string>
     */
    public function requires(): array;

    /**
     * Sidebar entry to seed on install, or null for a module with no menu.
     * Shape matches the `menus` table columns; `route_name` is prefix-less.
     *
     * @return array<string, mixed>|null
     */
    public function menu(): ?array;

    /**
     * Absolute path to the module's migrations, run into a tenant's schema on
     * install and rolled back on purge.
     */
    public function migrationsPath(): string;

    /**
     * Absolute path to the module's Blade views, or null if it has none.
     */
    public function viewsPath(): ?string;

    /**
     * Hook the module into the framework at boot: relations on core models,
     * observers, Blade components. Runs for every request regardless of install
     * state, since no tenant is known at boot — so it must only ever register
     * things, never query.
     */
    public function boot(): void;

    /**
     * Register the module's routes. Called from within the shared
     * `module.` route group, unconditionally — enforcement is middleware's job,
     * because conditional registration would bake one tenant's install state
     * into `route:cache`.
     */
    public function routes(): void;
}
