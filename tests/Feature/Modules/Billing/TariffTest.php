<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\OrderCharge;
use Modules\Billing\Models\Tariff;
use Modules\Partners\Models\Partner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TariffTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('module.billing.tariffs.index'))->assertRedirect(route('login'));
    }

    public function test_tariffs_can_be_created_updated_and_deleted(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('module.billing.tariffs.store'), [
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'price' => 1500000,
            'is_active' => true,
        ])->assertRedirect(route('module.billing.tariffs.index'));

        $tariff = Tariff::first();
        $this->assertNull($tariff->partner_id);

        $this->actingAs($user)->patch(route('module.billing.tariffs.update', $tariff), [
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'price' => 1750000,
            'is_active' => true,
        ])->assertRedirect(route('module.billing.tariffs.index'));

        $this->assertSame('1750000.00', $tariff->fresh()->price);

        $this->actingAs($user)->delete(route('module.billing.tariffs.destroy', $tariff))
            ->assertRedirect(route('module.billing.tariffs.index'));

        $this->assertDatabaseMissing('tariffs', ['id' => $tariff->id]);
    }

    public function test_a_duplicate_general_route_is_rejected(): void
    {
        $user = $this->createAdminUser();
        Tariff::factory()->create(['origin' => 'Jakarta', 'destination' => 'Bandung']);

        $this->actingAs($user)->post(route('module.billing.tariffs.store'), [
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'price' => 900000,
        ])->assertSessionHasErrors('destination');
    }

    public function test_a_duplicate_route_for_the_same_customer_is_rejected_but_other_customers_may_share_it(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create();
        Tariff::factory()->forCustomer($partner)->create(['origin' => 'Jakarta', 'destination' => 'Bandung']);

        $this->actingAs($user)->post(route('module.billing.tariffs.store'), [
            'partner_id' => $partner->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'price' => 900000,
        ])->assertSessionHasErrors('destination');

        $other = Partner::factory()->create();
        $this->actingAs($user)->post(route('module.billing.tariffs.store'), [
            'partner_id' => $other->id,
            'origin' => 'Jakarta',
            'destination' => 'Bandung',
            'price' => 900000,
        ])->assertSessionHasNoErrors();
    }

    public function test_deleting_a_tariff_keeps_charge_amounts_and_nulls_the_reference(): void
    {
        $user = $this->createAdminUser();
        $tariff = Tariff::factory()->create(['price' => 1200000]);
        $charge = OrderCharge::factory()->create(['tariff_id' => $tariff->id, 'amount' => 1200000]);

        $this->actingAs($user)->delete(route('module.billing.tariffs.destroy', $tariff));

        $charge->refresh();
        $this->assertNull($charge->tariff_id);
        $this->assertSame('1200000.00', $charge->amount);
    }
}
