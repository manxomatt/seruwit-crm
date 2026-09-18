<?php

namespace Tests\Unit\Modules\Rental;

use Modules\Rental\RentalModule;
use Tests\TestCase;

class RentalModuleTest extends TestCase
{
    public function test_sidebar_menu_opens_the_rental_list(): void
    {
        $menu = app(RentalModule::class)->menu();

        $this->assertNotNull($menu);
        $this->assertSame('rental', $menu['slug']);
        $this->assertSame('rental.dashboard', $menu['route_name']);
    }

    public function test_rental_module_declares_feature_level_permissions(): void
    {
        $permissions = app(RentalModule::class)->permissions();

        $this->assertSame([
            'view',
            'bookings',
            'dispatch',
            'damages',
            'finance',
            'rates',
            'settings',
        ], $permissions);
    }

    public function test_rental_routes_are_protected_by_feature_level_permissions(): void
    {
        $ratesRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.rates.index');
        $this->assertNotNull($ratesRoute);
        $this->assertContains('permission:rental,rates', $ratesRoute->middleware());

        $settingsRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.settings.index');
        $this->assertNotNull($settingsRoute);
        $this->assertContains('permission:rental,settings', $settingsRoute->middleware());

        $createRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.create');
        $this->assertNotNull($createRoute);
        $this->assertContains('permission:rental,bookings', $createRoute->middleware());

        $checkoutRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.checkout');
        $this->assertNotNull($checkoutRoute);
        $this->assertContains('permission:rental,dispatch', $checkoutRoute->middleware());

        $damageRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.damages.store');
        $this->assertNotNull($damageRoute);
        $this->assertContains('permission:rental,damages', $damageRoute->middleware());

        $confirmRoute = \Illuminate\Support\Facades\Route::getRoutes()->getByName('module.rental.confirm');
        $this->assertNotNull($confirmRoute);
        $this->assertContains('permission:rental,finance', $confirmRoute->middleware());
    }
}
