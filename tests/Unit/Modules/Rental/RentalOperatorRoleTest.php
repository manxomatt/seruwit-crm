<?php

namespace Tests\Unit\Modules\Rental;

use App\Models\User;
use App\Support\SystemRolePermissions;
use Modules\Fleet\Support\AccessibleFleetBases;
use Tests\TestCase;

class RentalOperatorRoleTest extends TestCase
{
    public function test_rental_operator_system_role_definition_is_registered(): void
    {
        $definition = SystemRolePermissions::getSystemRoleDefinition('rental_operator');

        $this->assertNotNull($definition);
        $this->assertSame('rental_operator', $definition['slug']);
        $this->assertSame('Rental Operator', $definition['name']);
        $this->assertTrue($definition['is_system']);
        $this->assertSame('/module/rental/dashboard', $definition['dashboard_path']);
    }

    public function test_accessible_fleet_bases_includes_rental_operator_in_scoped_slugs(): void
    {
        $this->assertContains(
            AccessibleFleetBases::ROLE_OPERATOR,
            AccessibleFleetBases::scopedRoleSlugs()
        );
    }

    public function test_rental_operator_without_fleet_bases_is_not_scoped_global(): void
    {
        $user = $this->createMock(User::class);
        $user->method('isAdmin')->willReturn(false);
        $user->method('hasAnyRole')->with([AccessibleFleetBases::ROLE_HEAD, AccessibleFleetBases::ROLE_MANAGER])->willReturn(false);
        $user->method('hasRole')->with(AccessibleFleetBases::ROLE_OPERATOR)->willReturn(true);
        $user->method('relationLoaded')->with('fleetBases')->willReturn(true);
        $user->method('getRelation')->with('fleetBases')->willReturn(collect([]));

        $this->assertFalse(AccessibleFleetBases::isScoped($user));
    }

    public function test_rental_operator_with_fleet_bases_is_scoped(): void
    {
        $user = $this->createMock(User::class);
        $user->method('isAdmin')->willReturn(false);
        $user->method('hasAnyRole')->with([AccessibleFleetBases::ROLE_HEAD, AccessibleFleetBases::ROLE_MANAGER])->willReturn(false);
        $user->method('hasRole')->with(AccessibleFleetBases::ROLE_OPERATOR)->willReturn(true);
        $user->method('relationLoaded')->with('fleetBases')->willReturn(true);
        $user->method('getRelation')->with('fleetBases')->willReturn(collect([(object) ['id' => 1]]));

        $this->assertTrue(AccessibleFleetBases::isScoped($user));
    }
}
