<?php

namespace Tests\Feature\Modules\Shuttle;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\JournalEntry;
use Modules\Accounting\Support\AccountingBridge;
use Modules\Accounting\Support\FiscalCalendarService;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;
use Modules\Shuttle\Models\ShuttleDeparture;
use Modules\Shuttle\Models\ShuttlePassenger;
use Modules\Shuttle\Support\BookingConfirmationService;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class ShuttleAccountingTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
        app(FiscalCalendarService::class)->ensureYear((int) now()->format('Y'));
        Setting::query()->updateOrCreate(
            ['key' => 'ecommerce.tax_enabled'],
            ['group' => 'ecommerce', 'value' => '0', 'type' => 'boolean', 'label' => 'Enable Tax']
        );
    }

    public function test_issuing_shuttle_invoice_credits_shuttle_revenue(): void
    {
        $partner = Partner::factory()->create(['customer_rank' => 1]);
        $booking = ShuttleBooking::factory()->create([
            'partner_id' => $partner->id,
            'total_fare' => 200000,
            'unit_fare' => 200000,
        ]);

        $invoice = Invoice::factory()->create([
            'partner_id' => $partner->id,
            'tax_enabled' => false,
            'tax_rate' => 0,
            'status' => Invoice::STATUS_DRAFT,
        ]);

        InvoiceLine::query()->create([
            'invoice_id' => $invoice->id,
            'description' => 'Travel',
            'amount' => 200000,
            'source_type' => $booking->getMorphClass(),
            'source_id' => $booking->id,
        ]);
        $invoice->recalculate();

        $this->actingAs($this->createAdminUser())
            ->post(route('module.invoicing.invoices.issue', $invoice))
            ->assertSessionHas('success');

        $journal = JournalEntry::query()
            ->where('source_type', $invoice->getMorphClass())
            ->where('source_id', $invoice->id)
            ->where('event', 'invoice.issued')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());

        $revenue = $journal->lines->first(
            fn ($line) => $line->account->system_role === 'shuttle_revenue'
        );
        $this->assertNotNull($revenue);
        $this->assertSame(200000.0, (float) $revenue->credit);
        $this->assertTrue(Account::query()->where('system_role', 'shuttle_revenue')->exists());
    }

    public function test_walk_in_confirm_posts_cash_travel_sale_journal(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $booking = ShuttleBooking::factory()->walkIn()->create([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 150000,
            'total_fare' => 150000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Walk-in']);

        app(BookingConfirmationService::class)->confirm($booking);
        $booking = $booking->fresh();

        $this->assertSame(ShuttleBooking::STATUS_CONFIRMED, $booking->status);
        $this->assertNull($booking->invoice_id);

        $journal = JournalEntry::query()
            ->where('source_type', $booking->getMorphClass())
            ->where('source_id', $booking->id)
            ->where('event', 'shuttle_sale.completed')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);
        $this->assertTrue($journal->isBalanced());

        $byRole = $journal->lines->mapWithKeys(
            fn ($line) => [$line->account->system_role => ['debit' => (float) $line->debit, 'credit' => (float) $line->credit]]
        );

        $this->assertSame(150000.0, $byRole['cash']['debit'] ?? $byRole['bank']['debit'] ?? 0.0);
        $this->assertSame(150000.0, $byRole['shuttle_revenue']['credit']);
    }

    public function test_walk_in_cancel_voids_travel_sale_journal(): void
    {
        $departure = ShuttleDeparture::factory()->create([
            'seat_capacity' => 7,
            'seats_booked' => 0,
            'status' => ShuttleDeparture::STATUS_OPEN,
        ]);

        $booking = ShuttleBooking::factory()->walkIn()->create([
            'departure_id' => $departure->id,
            'passenger_count' => 1,
            'unit_fare' => 100000,
            'total_fare' => 100000,
            'status' => ShuttleBooking::STATUS_DRAFT,
        ]);
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Walk-in']);

        $service = app(BookingConfirmationService::class);
        $service->confirm($booking);
        $booking = $booking->fresh();

        $this->assertNotNull(
            JournalEntry::query()
                ->where('source_id', $booking->id)
                ->where('event', 'shuttle_sale.completed')
                ->first()
        );

        $service->cancel($booking, 'Customer cancel');
        $booking = $booking->fresh();

        $this->assertSame(ShuttleBooking::STATUS_CANCELLED, $booking->status);

        $void = JournalEntry::query()
            ->where('source_type', $booking->getMorphClass())
            ->where('source_id', $booking->id)
            ->where('event', 'shuttle_sale.voided')
            ->where('status', JournalEntry::STATUS_POSTED)
            ->first();

        $this->assertNotNull($void);
    }

    public function test_partner_booking_does_not_post_walk_in_sale(): void
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
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Partner pax']);

        app(BookingConfirmationService::class)->confirm($booking);
        $booking = $booking->fresh();

        $this->assertNotNull($booking->invoice_id);
        $this->assertNull(
            JournalEntry::query()
                ->where('source_id', $booking->id)
                ->where('event', 'shuttle_sale.completed')
                ->first()
        );
        $this->assertTrue(AccountingBridge::available());
    }

    public function test_partner_credit_note_on_cancel_uses_shuttle_revenue(): void
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
        ShuttlePassenger::query()->create(['booking_id' => $booking->id, 'name' => 'Partner']);

        $service = app(BookingConfirmationService::class);
        $service->confirm($booking);
        $booking = $booking->fresh(['invoice']);

        $this->actingAs($this->createAdminUser())
            ->post(route('module.invoicing.invoices.issue', $booking->invoice))
            ->assertSessionHas('success');

        $booking->invoice->fresh()->update([
            'status' => Invoice::STATUS_PAID,
            'amount_paid' => $booking->invoice->fresh()->total,
            'paid_at' => now(),
        ]);

        $service->cancel($booking->fresh(), 'Paid cancel');
        $booking = $booking->fresh(['creditInvoice']);

        $this->assertNotNull($booking->credit_invoice_id);

        $journal = JournalEntry::query()
            ->where('source_type', $booking->creditInvoice->getMorphClass())
            ->where('source_id', $booking->credit_invoice_id)
            ->where('event', 'credit_note.issued')
            ->with('lines.account')
            ->first();

        $this->assertNotNull($journal);

        $revenue = $journal->lines->first(
            fn ($line) => $line->account->system_role === 'shuttle_revenue'
        );
        $this->assertNotNull($revenue);
        $this->assertNull(
            $journal->lines->first(fn ($line) => $line->account->system_role === 'sales_revenue')
        );
    }
}
