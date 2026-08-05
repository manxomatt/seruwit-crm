<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalPostConfirmProgress;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalPostConfirmStepperTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_progress_hidden_for_draft(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $progress = app(RentalPostConfirmProgress::class)->for($rental);

        $this->assertFalse($progress['visible']);
        $this->assertNull($progress['current_step']);
        $this->assertSame([], $progress['steps']);
    }

    public function test_confirmed_with_unpaid_deposit_starts_at_payments(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'deposit_amount' => 500000,
            'deposit_received_at' => null,
            'deposit_payment_method' => null,
        ]);

        $progress = app(RentalPostConfirmProgress::class)->for($rental);

        $this->assertTrue($progress['visible']);
        $this->assertSame(RentalPostConfirmProgress::STEP_PAYMENTS, $progress['current_step']);
        $this->assertFalse(collect($progress['steps'])->firstWhere('id', 6)['done']);
        $this->assertFalse(collect($progress['steps'])->firstWhere('id', 7)['available']);
    }

    public function test_confirmed_with_deposit_received_starts_at_pickup(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'deposit_amount' => 500000,
            'deposit_received_at' => now(),
            'deposit_payment_method' => 'cash',
        ]);

        $progress = app(RentalPostConfirmProgress::class)->for($rental);

        $this->assertTrue($progress['visible']);
        $this->assertSame(RentalPostConfirmProgress::STEP_PICKUP, $progress['current_step']);
        $this->assertTrue(collect($progress['steps'])->firstWhere('id', 6)['done']);
        $this->assertTrue(collect($progress['steps'])->firstWhere('id', 7)['available']);
    }

    public function test_active_rental_defaults_to_changes_step(): void
    {
        $rental = Rental::factory()->active()->create();

        $progress = app(RentalPostConfirmProgress::class)->for($rental);

        $this->assertTrue($progress['visible']);
        $this->assertSame(RentalPostConfirmProgress::STEP_CHANGES, $progress['current_step']);
        $this->assertTrue(collect($progress['steps'])->firstWhere('id', 7)['done']);
        $this->assertTrue(collect($progress['steps'])->firstWhere('id', 10)['available']);
        $this->assertFalse(collect($progress['steps'])->firstWhere('id', 10)['done']);
    }

    public function test_show_page_includes_post_confirm_prop(): void
    {
        $rental = Rental::factory()->confirmed()->create([
            'deposit_amount' => 0,
            'deposit_received_at' => null,
        ]);

        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('postConfirm.visible', true)
                ->where('postConfirm.current_step', RentalPostConfirmProgress::STEP_PICKUP)
                ->has('postConfirm.steps', 5)
            );
    }

    public function test_show_page_hides_post_confirm_for_draft(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.show', $rental))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Show')
                ->where('postConfirm.visible', false)
            );
    }
}
