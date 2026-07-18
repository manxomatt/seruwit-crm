<?php

namespace Tests\Feature\Modules\Billing;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Billing\Models\TripAllowance;
use Modules\Billing\Models\TripAllowanceExpense;
use Modules\TransportationManagement\Models\Trip;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class TripAllowanceTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_an_allowance_can_be_issued_for_any_non_cancelled_trip(): void
    {
        $user = $this->createAdminUser();

        foreach ([Trip::factory()->create(), Trip::factory()->inProgress()->create(), Trip::factory()->completed()->create()] as $trip) {
            $this->actingAs($user)->post(route('module.billing.allowances.store'), [
                'trip_id' => $trip->id,
                'advance_amount' => 500000,
            ])->assertSessionHasNoErrors();
        }

        $this->assertSame(3, TripAllowance::count());
        $this->assertNotNull(TripAllowance::first()->issued_at);
    }

    public function test_a_cancelled_trip_cannot_receive_an_allowance(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->cancelled()->create();

        $this->actingAs($user)->post(route('module.billing.allowances.store'), [
            'trip_id' => $trip->id,
            'advance_amount' => 500000,
        ])->assertSessionHas('error');

        $this->assertSame(0, TripAllowance::count());
    }

    public function test_a_trip_can_only_have_one_allowance(): void
    {
        $user = $this->createAdminUser();
        $trip = Trip::factory()->create();
        TripAllowance::factory()->create(['trip_id' => $trip->id]);

        $this->actingAs($user)->post(route('module.billing.allowances.store'), [
            'trip_id' => $trip->id,
            'advance_amount' => 500000,
        ])->assertSessionHasErrors('trip_id');
    }

    public function test_expenses_are_validated_and_can_be_added_and_removed_while_issued(): void
    {
        $user = $this->createAdminUser();
        $allowance = TripAllowance::factory()->create();

        $this->actingAs($user)->post(route('module.billing.allowances.expenses.store', $allowance), [
            'category' => 'parfum',
            'amount' => 50000,
        ])->assertSessionHasErrors('category');

        $this->actingAs($user)->post(route('module.billing.allowances.expenses.store', $allowance), [
            'category' => 'bbm',
            'amount' => 300000,
            'note' => 'Isi solar',
        ])->assertSessionHas('success');

        $expense = $allowance->expenses()->first();
        $this->actingAs($user)->delete(route('module.billing.allowances.expenses.destroy', [$allowance, $expense]))
            ->assertSessionHas('success');

        $this->assertSame(0, $allowance->expenses()->count());
    }

    public function test_settling_computes_the_balance_in_both_directions(): void
    {
        $user = $this->createAdminUser();

        $surplus = TripAllowance::factory()->create(['advance_amount' => 500000]);
        TripAllowanceExpense::factory()->create(['trip_allowance_id' => $surplus->id, 'amount' => 300000]);

        $this->actingAs($user)->post(route('module.billing.allowances.settle', $surplus))
            ->assertSessionHas('success', 'Allowance settled. Driver returns Rp 200.000.');

        $surplus->refresh();
        $this->assertSame(TripAllowance::STATUS_SETTLED, $surplus->status);
        $this->assertNotNull($surplus->settled_at);

        $deficit = TripAllowance::factory()->create(['advance_amount' => 100000]);
        TripAllowanceExpense::factory()->create(['trip_allowance_id' => $deficit->id, 'amount' => 250000]);

        $this->actingAs($user)->post(route('module.billing.allowances.settle', $deficit))
            ->assertSessionHas('success', 'Allowance settled. Company reimburses Rp 150.000.');
    }

    public function test_a_settled_allowance_is_immutable_and_cannot_be_deleted(): void
    {
        $user = $this->createAdminUser();
        $allowance = TripAllowance::factory()->settled()->create();

        $this->actingAs($user)->post(route('module.billing.allowances.expenses.store', $allowance), [
            'category' => 'tol',
            'amount' => 50000,
        ])->assertSessionHas('error');

        $this->actingAs($user)->post(route('module.billing.allowances.settle', $allowance))->assertSessionHas('error');

        $this->actingAs($user)->delete(route('module.billing.allowances.destroy', $allowance))->assertSessionHas('error');
        $this->assertDatabaseHas('trip_allowances', ['id' => $allowance->id]);
    }

    public function test_an_issued_allowance_can_be_deleted_and_its_expenses_cascade(): void
    {
        $user = $this->createAdminUser();
        $allowance = TripAllowance::factory()->create();
        $expense = TripAllowanceExpense::factory()->create(['trip_allowance_id' => $allowance->id]);

        $this->actingAs($user)->delete(route('module.billing.allowances.destroy', $allowance))
            ->assertRedirect(route('module.billing.allowances.index'));

        $this->assertDatabaseMissing('trip_allowances', ['id' => $allowance->id]);
        $this->assertDatabaseMissing('trip_allowance_expenses', ['id' => $expense->id]);
    }

    public function test_a_trip_with_an_allowance_is_protected_from_deletion_at_the_database_level(): void
    {
        $trip = Trip::factory()->create();
        TripAllowance::factory()->create(['trip_id' => $trip->id]);

        $this->expectException(QueryException::class);
        $trip->delete();
    }
}
