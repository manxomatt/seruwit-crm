<?php

namespace App\Modules\Facades;

use App\Modules\ModuleContract;
use App\Modules\ModuleRegistry;
use Illuminate\Support\Facades\Facade;

/**
 * @method static array<string, ModuleContract> all()
 * @method static array<string, ModuleContract> core()
 * @method static ModuleContract|null find(string $key)
 * @method static bool has(string $key)
 * @method static bool entitled(string $key)
 * @method static bool installed(string $key)
 * @method static bool available(string $key)
 * @method static bool isCentralModule(string $key)
 * @method static list<string> centralInstallable()
 * @method static bool isCentralInstallable(string $key)
 * @method static list<string> centralInstalled()
 * @method static bool platformEnabled(string $key)
 * @method static bool isTenantHidden(string $key)
 * @method static bool isTenantVisible(string $key)
 * @method static string pageEntrypoint(string $component)
 * @method static void flushInstalledState()
 * @method static void flushDisabledState()
 * @method static void flushHiddenState()
 * @method static void registerRoutes()
 *
 * @see ModuleRegistry
 */
class Modules extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ModuleRegistry::class;
    }
}
