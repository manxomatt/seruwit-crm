<?php

namespace Tests\Unit\Modules;

use App\Modules\ModuleRegistry;
use Tests\TestCase;

/**
 * Pins the root view's page preload to where a module's pages actually live.
 *
 * The Vite entrypoint is resolved server-side but the page is resolved again
 * client-side by resources/js/app.tsx, and nothing makes the two agree except
 * this. When they disagree the page 500s on `Unable to locate file in Vite
 * manifest` — which is exactly what moving Carousels into a module caused.
 */
class ModulePageEntrypointTest extends TestCase
{
    private ModuleRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();

        $this->registry = app(ModuleRegistry::class);
    }

    public function test_a_page_owned_by_a_module_resolves_to_the_modules_copy(): void
    {
        $this->assertSame(
            'modules/Carousels/resources/js/Pages/Modules/Carousels/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Carousels/Index'),
        );
    }

    public function test_a_page_owned_by_the_fleet_module_resolves_to_the_modules_copy(): void
    {
        $this->assertSame(
            'modules/Fleet/resources/js/Pages/Modules/Fleet/Vehicles/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Fleet/Vehicles/Index'),
        );
    }

    public function test_a_page_owned_by_the_customer_module_resolves_to_the_modules_copy(): void
    {
        $this->assertSame(
            'modules/Customer/resources/js/Pages/Modules/Customer/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Customer/Index'),
        );
    }

    public function test_a_page_owned_by_the_product_module_resolves_to_the_modules_copy(): void
    {
        $this->assertSame(
            'modules/Product/resources/js/Pages/Modules/Product/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Product/Index'),
        );
    }

    public function test_pages_owned_by_the_pages_and_posts_modules_resolve_to_the_modules_copies(): void
    {
        $this->assertSame(
            'modules/Pages/resources/js/Pages/Modules/Pages/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Pages/Index'),
        );

        $this->assertSame(
            'modules/Posts/resources/js/Pages/Modules/Posts/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Posts/Index'),
        );
    }

    public function test_a_core_page_resolves_to_core(): void
    {
        $this->assertSame(
            'resources/js/Pages/Module/Dashboard.tsx',
            $this->registry->pageEntrypoint('Module/Dashboard'),
        );
    }

    /**
     * Core pages still live under the Modules/ namespace for every feature that
     * has not been extracted yet, so the namespace alone must not send the
     * entrypoint hunting in modules/.
     */
    public function test_a_page_under_the_modules_namespace_with_no_module_falls_back_to_core(): void
    {
        $this->assertSame(
            'resources/js/Pages/Modules/Users/Index.tsx',
            $this->registry->pageEntrypoint('Modules/Users/Index'),
        );
    }

    public function test_every_resolved_entrypoint_is_a_file_that_exists(): void
    {
        $components = [
            'Modules/Carousels/Index',
            'Modules/Carousels/Create',
            'Modules/Carousels/Edit',
            'Modules/Carousels/Show',
            'Modules/Users/Index',
            'Module/Dashboard',
            'Module/Plans/Index',
            'Modules/Fleet/Vehicles/Index',
            'Modules/Fleet/Vehicles/Create',
            'Modules/Fleet/Vehicles/Edit',
            'Modules/Fleet/Vehicles/Show',
            'Modules/Fleet/Drivers/Index',
            'Modules/Fleet/Drivers/Create',
            'Modules/Fleet/Drivers/Edit',
            'Modules/Fleet/Drivers/Show',
            'Modules/Customer/Index',
            'Modules/Customer/Create',
            'Modules/Customer/Edit',
            'Modules/Customer/Show',
            'Modules/Product/Index',
            'Modules/Product/Create',
            'Modules/Product/Edit',
            'Modules/Product/Show',
            'Modules/Pages/Index',
            'Modules/Pages/Create',
            'Modules/Pages/Editor',
            'Modules/Pages/Show',
            'Modules/Posts/Index',
            'Modules/Posts/Create',
            'Modules/Posts/Edit',
            'Modules/Posts/Show',
            'Modules/TransportationManagement/Trips/Index',
            'Modules/TransportationManagement/Trips/Create',
            'Modules/TransportationManagement/Trips/Show',
            'Modules/TransportationManagement/Reports/Index',
            'Modules/TransportationManagement/Schedules/Index',
            'Modules/TransportationManagement/Schedules/Create',
            'Modules/TransportationManagement/Schedules/Edit',
            'Modules/TransportationManagement/Schedules/Show',
            'Modules/TransportationManagement/Calendar/Index',
        ];

        foreach ($components as $component) {
            $this->assertFileExists(
                base_path($this->registry->pageEntrypoint($component)),
                "No file backs the entrypoint resolved for [{$component}].",
            );
        }
    }
}
