<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalCharge;
use Modules\Rental\Support\RentalAddonCatalog;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAddonChargeTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_can_add_addon_on_active_rental_and_update_total(): void
    {
        $rental = Rental::factory()->active()->create([
            'base_amount' => 1000000,
            'excess_amount' => 0,
            'late_fee_amount' => 0,
            'total_amount' => 1000000,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.addons.store', $rental), [
                'addon_code' => RentalAddonCatalog::INSURANCE,
                'amount' => 150000,
                'description' => 'Full coverage',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $rental->refresh();
        $this->assertEquals(1150000, (float) $rental->total_amount);

        $charge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_ADDON)
            ->first();

        $this->assertNotNull($charge);
        $this->assertSame(RentalAddonCatalog::INSURANCE, $charge->addon_code);
        $this->assertEquals(150000, (float) $charge->amount);
        $this->assertSame('Full coverage', $charge->description);

        $this->assertTrue(
            InvoiceLine::query()
                ->where('source_type', $charge->getMorphClass())
                ->where('source_id', $charge->id)
                ->exists()
        );
    }

    public function test_addon_defaults_description_from_catalog(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'base_amount' => 500000,
            'total_amount' => 500000,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.addons.store', $rental), [
                'addon_code' => RentalAddonCatalog::BABY_SEAT,
                'amount' => 50000,
            ])
            ->assertRedirect();

        $charge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_ADDON)
            ->first();

        $this->assertNotNull($charge);
        $this->assertSame(__('rental.addon.codes.baby_seat'), $charge->description);
    }

    public function test_cannot_add_addon_on_draft_rental(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.addons.store', $rental), [
                'addon_code' => RentalAddonCatalog::OTHER,
                'amount' => 10000,
            ])
            ->assertStatus(422);
    }

    public function test_rejects_invalid_addon_code(): void
    {
        $rental = Rental::factory()->active()->create();

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->post(route('module.rental.addons.store', $rental), [
                'addon_code' => 'not_a_real_code',
                'amount' => 10000,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('addon_code');
    }

    public function test_can_delete_addon_while_invoice_still_draft(): void
    {
        $rental = Rental::factory()->active()->create([
            'base_amount' => 1000000,
            'total_amount' => 1000000,
            'deposit_amount' => 0,
        ]);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.rental.addons.store', $rental), [
                'addon_code' => RentalAddonCatalog::DELIVERY,
                'amount' => 75000,
            ])
            ->assertRedirect();

        $charge = RentalCharge::query()
            ->where('rental_id', $rental->id)
            ->where('kind', RentalCharge::KIND_ADDON)
            ->firstOrFail();

        $this->actingAs($this->createAdminUser())
            ->delete(route('module.rental.addons.destroy', [$rental, $charge]))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('rental_charges', ['id' => $charge->id]);

        $rental->refresh();
        $this->assertEquals(1000000, (float) $rental->total_amount);
    }

    public function test_cannot_delete_addon_with_issued_invoice(): void
    {
        $rental = Rental::factory()->returned()->create(['deposit_amount' => 0]);

        $charge = RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => RentalAddonCatalog::CHAUFFEUR,
            'amount' => 200000,
            'description' => 'Chauffeur',
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $rental->partner_id,
            'status' => Invoice::STATUS_ISSUED,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Chauffeur',
            'amount' => 200000,
            'source_type' => $charge->getMorphClass(),
            'source_id' => $charge->id,
        ]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->delete(route('module.rental.addons.destroy', [$rental, $charge]))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('rental_charges', ['id' => $charge->id]);
    }

    public function test_show_includes_addon_props(): void
    {
        $rental = Rental::factory()->active()->create();

        RentalCharge::query()->create([
            'rental_id' => $rental->id,
            'kind' => RentalCharge::KIND_ADDON,
            'addon_code' => RentalAddonCatalog::FUEL,
            'amount' => 100000,
            'description' => 'Fuel top-up',
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->has('addonCharges', 1)
                ->has('addonCodes')
                ->where('addonCharges.0.addon_code', RentalAddonCatalog::FUEL)
                ->where('addonCharges.0.amount', 100000)
            );
    }
}
