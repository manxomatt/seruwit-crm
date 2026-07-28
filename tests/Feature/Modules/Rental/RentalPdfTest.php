<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalPdfTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirmed_rental_streams_contract_pdf(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.contract', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_draft_rental_cannot_print_contract(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->get(route('module.rental.pdf.contract', $rental))
            ->assertRedirect(route('module.rental.show', $rental));
    }

    public function test_active_rental_streams_handover_pdf(): void
    {
        $rental = Rental::factory()->active()->create([
            'start_fuel_level' => 'full',
            'checkout_checklist' => [
                'exterior_body' => true,
                'tires_wheels' => true,
                'lights' => true,
                'interior' => true,
                'documents' => true,
                'spare_tools' => true,
                'ac' => true,
                'keys' => true,
            ],
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.handover', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_confirmed_rental_cannot_print_handover_yet(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->get(route('module.rental.pdf.handover', $rental))
            ->assertRedirect(route('module.rental.show', $rental));
    }
}
