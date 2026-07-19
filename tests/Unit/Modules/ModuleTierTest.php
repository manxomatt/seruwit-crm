<?php

namespace Tests\Unit\Modules;

use App\Modules\ModuleRegistry;
use App\Modules\ModuleTier;
use Tests\TestCase;

/**
 * Pins the tier every module declares about itself.
 *
 * The tier is what makes the "shared by every business line vs. specific to one"
 * split a fact the code carries rather than a convention held in someone's head,
 * and the sidebar now groups itself from it — so a module landing in the wrong
 * tier silently files it under the wrong heading for every tenant.
 */
class ModuleTierTest extends TestCase
{
    private ModuleRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();

        $this->registry = app(ModuleRegistry::class);
    }

    public function test_every_registered_module_declares_a_tier(): void
    {
        $this->assertNotEmpty($this->registry->all());

        foreach ($this->registry->all() as $key => $module) {
            $this->assertInstanceOf(
                ModuleTier::class,
                $module->tier(),
                "Module [{$key}] must declare a tier.",
            );
        }
    }

    public function test_cross_business_line_resources_are_foundation(): void
    {
        foreach (['fleet', 'customers', 'products', 'document', 'maintenance'] as $key) {
            $this->assertSame(
                ModuleTier::Foundation,
                $this->registry->find($key)?->tier(),
                "Module [{$key}] is reused across business lines and must stay Foundation.",
            );
        }
    }

    public function test_logistics_specific_operations_are_vertical(): void
    {
        foreach (['transportation', 'orders', 'billing'] as $key) {
            $this->assertSame(
                ModuleTier::Vertical,
                $this->registry->find($key)?->tier(),
                "Module [{$key}] is specific to one business line and must stay Vertical.",
            );
        }
    }

    public function test_public_site_features_are_content(): void
    {
        foreach (['pages', 'posts', 'carousels'] as $key) {
            $this->assertSame(
                ModuleTier::Content,
                $this->registry->find($key)?->tier(),
                "Module [{$key}] serves the public site and must stay Content.",
            );
        }
    }
}
