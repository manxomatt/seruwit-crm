<?php

namespace Tests\Feature\Modules\Shuttle;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Invoicing\Models\Invoice;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Support\BookingConfirmationService;
use Modules\Shuttle\Support\SeatLabelAssigner;
use Modules\Shuttle\Support\ShuttleInvoiceService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ShuttlePhase11Test extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_seat_labels_are_assigned_on_confirm(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);
        $partner = Partner::factory()->create();

        $booking = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 2,
            'unit_fare' => 200000,
            'total_fare' => 400000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);

        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'A']);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'B']);

        app(BookingConfirmationService::class)->confirm($booking);

        $labels = $booking->fresh()->passengers->pluck('seat_label')->all();
        $this->assertSame(['A1', 'A2'], $labels);
    }

    public function test_seat_label_assigner_wraps_rows(): void
    {
        $assigner = new SeatLabelAssigner;

        $this->assertSame('A1', $assigner->labelFor(0));
        $this->assertSame('A4', $assigner->labelFor(3));
        $this->assertSame('B1', $assigner->labelFor(4));
    }

    public function test_cancel_confirmed_booking_voids_draft_invoice(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);
        $partner = Partner::factory()->create();

        $booking = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 1,
            'unit_fare' => 200000,
            'total_fare' => 200000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'A']);

        $service = app(BookingConfirmationService::class);
        $service->confirm($booking);
        $booking = $booking->fresh();

        $this->assertNotNull($booking->invoice_id);
        $this->assertSame(Invoice::STATUS_DRAFT, $booking->invoice->status);

        $service->cancel($booking, 'Customer request');

        $booking = $booking->fresh();
        $this->assertSame(ShuttleBooking::STATUS_CANCELLED, $booking->status);
        $this->assertSame(ShuttleInvoiceService::REFUND_VOIDED, $booking->refund_status);
        $this->assertSame(Invoice::STATUS_VOID, $booking->invoice->fresh()->status);
        $this->assertSame(0, $departure->fresh()->seats_booked);
    }

    public function test_cancel_paid_invoice_creates_credit_note(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);
        $partner = Partner::factory()->create();

        $booking = ShuttleBooking::factory()->create([
            'departure_id' => $departure->id,
            'partner_id' => $partner->id,
            'passenger_count' => 1,
            'unit_fare' => 200000,
            'total_fare' => 200000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'A']);

        $service = app(BookingConfirmationService::class);
        $service->confirm($booking);
        $booking = $booking->fresh(['invoice']);

        $booking->invoice->update([
            'status' => Invoice::STATUS_PAID,
            'amount_paid' => $booking->invoice->total,
            'paid_at' => now(),
        ]);

        $service->cancel($booking->fresh(), 'Paid cancel');

        $booking = $booking->fresh(['creditInvoice']);
        $this->assertSame(ShuttleInvoiceService::REFUND_CREDITED, $booking->refund_status);
        $this->assertNotNull($booking->credit_invoice_id);
        $this->assertTrue($booking->creditInvoice->isCreditNote());
        $this->assertSame(Invoice::STATUS_ISSUED, $booking->creditInvoice->status);
    }

    public function test_partner_portal_lists_own_bookings(): void
    {
        $user = $this->createAdminUser();
        $partner = Partner::factory()->create(['portal_user_id' => $user->id, 'status' => 'active']);
        $other = Partner::factory()->create();

        $mine = ShuttleBooking::factory()->create(['partner_id' => $partner->id]);
        ShuttleBooking::factory()->create(['partner_id' => $other->id]);

        $this->actingAs($user)
            ->get(route('module.portal.shuttle.bookings.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Shuttle/Portal/Index')
                ->has('bookings.data', 1)
                ->where('bookings.data.0.id', $mine->id));
    }
}
