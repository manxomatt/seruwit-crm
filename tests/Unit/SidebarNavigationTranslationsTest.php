<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class SidebarNavigationTranslationsTest extends TestCase
{
    public function test_shell_translations_include_sidebar_collapse_and_expand_keys(): void
    {
        $baseDir = dirname(__DIR__, 2);
        $idShell = require $baseDir.'/lang/id/shell.php';
        $enShell = require $baseDir.'/lang/en/shell.php';

        $this->assertArrayHasKey('collapse_sidebar', $idShell);
        $this->assertArrayHasKey('expand_sidebar', $idShell);

        $this->assertArrayHasKey('collapse_sidebar', $enShell);
        $this->assertArrayHasKey('expand_sidebar', $enShell);

        $this->assertSame('Tutup menu samping', $idShell['collapse_sidebar']);
        $this->assertSame('Buka menu samping', $idShell['expand_sidebar']);

        $this->assertSame('Collapse sidebar', $enShell['collapse_sidebar']);
        $this->assertSame('Expand sidebar', $enShell['expand_sidebar']);
    }

    public function test_fleet_navigation_and_module_translations_include_dashboard_and_vehicles(): void
    {
        $baseDir = dirname(__DIR__, 2);
        $idFleet = require $baseDir.'/lang/id/fleet.php';
        $enFleet = require $baseDir.'/lang/en/fleet.php';
        $idModules = require $baseDir.'/lang/id/modules.php';
        $enModules = require $baseDir.'/lang/en/modules.php';

        $this->assertArrayHasKey('nav', $idFleet);
        $this->assertSame('Dashboard', $idFleet['nav']['dashboard']);
        $this->assertSame('Kendaraan', $idFleet['nav']['vehicles']);

        $this->assertArrayHasKey('nav', $enFleet);
        $this->assertSame('Dashboard', $enFleet['nav']['dashboard']);
        $this->assertSame('Vehicles', $enFleet['nav']['vehicles']);

        $this->assertSame('Dashboard', $idModules['fleet-dashboard']);
        $this->assertSame('Kendaraan', $idModules['fleet-vehicles']);

        $this->assertSame('Dashboard', $enModules['fleet-dashboard']);
        $this->assertSame('Vehicles', $enModules['fleet-vehicles']);
    }
}
