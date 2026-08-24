<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalPaymentResultTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();

        Setting::query()->updateOrCreate(
            ['key' => 'rental.passenger_booking_enabled'],
            [
                'group' => 'rental',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Passenger rental',
                'is_public' => false,
                'sort_order' => 2,
            ],
        );
    }

    private function passengerBooking(string $token): Rental
    {
        return Rental::factory()->create([
            'channel' => Rental::CHANNEL_WEB,
            'public_token' => $token,
        ]);
    }

    public function test_result_page_shows_success_on_settlement(): void
    {
        $rental = $this->passengerBooking('tokenresult'.str_repeat('a', 20));

        $this->get(route('book.rental.booking.result', [
            'token' => $rental->public_token,
            'intent' => 'deposit',
            'transaction_status' => 'settlement',
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Public/PaymentResult')
                ->where('status', 'success')
                ->where('intent', 'deposit')
                ->where('booking.code', $rental->code));
    }

    public function test_result_page_shows_pending(): void
    {
        $rental = $this->passengerBooking('tokenresult'.str_repeat('b', 20));

        $this->get(route('book.rental.booking.result', [
            'token' => $rental->public_token,
            'intent' => 'deposit',
            'transaction_status' => 'pending',
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('status', 'pending'));
    }

    public function test_result_page_shows_failed_on_deny(): void
    {
        $rental = $this->passengerBooking('tokenresult'.str_repeat('c', 20));

        $this->get(route('book.rental.booking.result', [
            'token' => $rental->public_token,
            'intent' => 'invoice',
            'transaction_status' => 'deny',
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('status', 'failed'));
    }

    public function test_result_page_defaults_to_pending_without_hint(): void
    {
        $rental = $this->passengerBooking('tokenresult'.str_repeat('d', 20));

        $this->get(route('book.rental.booking.result', [
            'token' => $rental->public_token,
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('status', 'pending'));
    }
}
