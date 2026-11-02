<?php

namespace Tests\Unit\Modules\RentalStorefront;

use Illuminate\Support\Facades\Route;
use Modules\RentalStorefront\RentalStorefrontModule;
use Tests\TestCase;

class RentalStorefrontAdminRoutesTest extends TestCase
{
    public function test_module_declares_correct_admin_menu(): void
    {
        $module = new RentalStorefrontModule;
        $menu = $module->menu();

        $this->assertNotNull($menu);
        $this->assertSame('Storefront & Portal Online', $menu['name']);
        $this->assertSame('rental-storefront', $menu['slug']);
        $this->assertSame('rental.storefront.index', $menu['route_name']);
        $this->assertSame('rental-storefront', $menu['permission_module']);
        $this->assertSame('manage_storefront', $menu['permission_action']);
    }

    public function test_admin_routes_are_registered(): void
    {
        $routes = Route::getRoutes();

        $this->assertNotNull($routes->getByName('module.rental.storefront.index'));
        $this->assertNotNull($routes->getByName('module.rental.storefront.settings.update'));
        $this->assertNotNull($routes->getByName('module.rental.storefront.testimonials.update'));
        $this->assertNotNull($routes->getByName('module.rental.storefront.policy.update'));
        $this->assertNotNull($routes->getByName('module.rental-storefront.settings'));
    }
}
