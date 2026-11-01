<?php

declare(strict_types=1);

namespace Tests\Unit\Modules\Rental;

use Tests\TestCase;

class RentalDepositRefundMigrationTest extends TestCase
{
    public function test_migration_files_exist_in_tenant_and_module_paths(): void
    {
        $tenantPath = database_path('migrations/tenant/2026_11_01_220000_add_missing_deposit_refund_columns_to_rentals_table.php');
        $modulePath = base_path('modules/Rental/Database/Migrations/2026_11_01_220000_add_missing_deposit_refund_columns_to_rentals_table.php');

        $this->assertFileExists($tenantPath);
        $this->assertFileExists($modulePath);

        $tenantMigration = require $tenantPath;
        $this->assertTrue(method_exists($tenantMigration, 'up'));
        $this->assertTrue(method_exists($tenantMigration, 'down'));

        $moduleMigration = require $modulePath;
        $this->assertTrue(method_exists($moduleMigration, 'up'));
        $this->assertTrue(method_exists($moduleMigration, 'down'));
    }
}
