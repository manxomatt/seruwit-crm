<?php

namespace Tests\Unit;

use App\Models\Permission;
use PHPUnit\Framework\TestCase;

class PermissionModelTest extends TestCase
{
    public function test_actions_constant_only_contains_standard_crud(): void
    {
        $this->assertSame([
            'view' => 'View',
            'create' => 'Create',
            'update' => 'Update',
            'delete' => 'Delete',
        ], Permission::ACTIONS);
    }

    public function test_default_actions_for_media_only_has_crud(): void
    {
        $actions = Permission::defaultActionsFor('media');

        $this->assertSame(Permission::ACTIONS, $actions);
        $this->assertArrayNotHasKey('manage_coa', $actions);
        $this->assertArrayNotHasKey('bookings', $actions);
        $this->assertArrayNotHasKey('manage_bays', $actions);
    }

    public function test_default_actions_for_accounting_matches_accounting_actions(): void
    {
        $actions = Permission::defaultActionsFor('accounting');

        $this->assertSame(Permission::ACCOUNTING_ACTIONS, $actions);
        $this->assertArrayHasKey('manage_coa', $actions);
        $this->assertArrayHasKey('journal', $actions);
        $this->assertArrayNotHasKey('bookings', $actions);
        $this->assertArrayNotHasKey('manage_bays', $actions);
    }

    public function test_default_actions_for_rental_matches_rental_actions(): void
    {
        $actions = Permission::defaultActionsFor('rental');

        $this->assertSame(Permission::RENTAL_ACTIONS, $actions);
        $this->assertArrayHasKey('bookings', $actions);
        $this->assertArrayHasKey('dispatch', $actions);
        $this->assertArrayNotHasKey('manage_coa', $actions);
    }

    public function test_default_actions_for_settings_and_analytics(): void
    {
        $settingsActions = Permission::defaultActionsFor('settings');
        $this->assertSame(['view' => 'View', 'update' => 'Update'], $settingsActions);

        $analyticsActions = Permission::defaultActionsFor('analytics');
        $this->assertSame(['view' => 'View'], $analyticsActions);
    }

    public function test_get_actions_default_view_is_view_not_rental_dashboard(): void
    {
        $actions = Permission::getActions();

        $this->assertSame('View', $actions['view']);
        $this->assertSame('Manage COA', $actions['manage_coa']);
        $this->assertSame('Bookings & Reservations', $actions['bookings']);
        $this->assertSame('Manage bays', $actions['manage_bays']);
    }

    public function test_generate_name_formats_correctly(): void
    {
        $this->assertSame('View Media', Permission::generateName('media', 'view'));
        $this->assertSame('Create Users', Permission::generateName('users', 'create'));
        $this->assertSame('Manage COA Accounting', Permission::generateName('accounting', 'manage_coa'));
        $this->assertSame('View (Dashboard & Calendar) Rental', Permission::generateName('rental', 'view'));
    }
}
