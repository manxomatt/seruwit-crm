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
}
