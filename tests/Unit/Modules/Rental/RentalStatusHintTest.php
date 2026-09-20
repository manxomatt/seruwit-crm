<?php

namespace Tests\Unit\Modules\Rental;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\App;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalStatusHint;
use Tests\TestCase;

class RentalStatusHintTest extends TestCase
{
    public function test_indonesian_hints_tell_staff_whether_the_vehicle_is_still_at_the_depot(): void
    {
        App::setLocale('id');
        $hint = new RentalStatusHint;

        $hold = new Rental([
            'status' => Rental::STATUS_PENDING_RESERVED,
            'reserved_until' => Carbon::parse('2026-09-21 07:05:00', 'UTC'),
        ]);
        $this->assertSame('Unit dikunci sampai 21-09-2026 14:05 · belum terbit', $hint->for($hold));

        $confirmed = new Rental(['status' => Rental::STATUS_CONFIRMED]);
        $this->assertSame('Jadwal terkunci · unit masih di pool', $hint->for($confirmed));

        $awaiting = new Rental([
            'status' => Rental::STATUS_CONFIRMED,
            'pickup_requested_at' => Carbon::parse('2026-09-21 03:00:00', 'UTC'),
        ]);
        $this->assertSame('Pelanggan sudah ttd kontrak · serahkan unit', $hint->for($awaiting));
        $this->assertSame(
            'Kontrak sudah ditandatangani · unit belum diserahkan',
            $hint->for($awaiting, RentalStatusHint::AUDIENCE_PASSENGER),
        );

        $onHire = new Rental([
            'status' => Rental::STATUS_ACTIVE,
            'end_date' => '2026-09-25',
        ]);
        $this->assertSame('Kunci sudah di pelanggan sampai 25-09-2026', $hint->for($onHire));
        $this->assertSame(
            'Unit sudah diserahkan · sewa berjalan sampai 25-09-2026',
            $hint->for($onHire, RentalStatusHint::AUDIENCE_PASSENGER),
        );

        $draft = new Rental(['status' => Rental::STATUS_DRAFT]);
        $this->assertNull($hint->for($draft));
    }

    public function test_english_hints_tell_staff_whether_the_vehicle_is_still_at_the_depot(): void
    {
        App::setLocale('en');
        $hint = new RentalStatusHint;

        $hold = new Rental([
            'status' => Rental::STATUS_PENDING_RESERVED,
            'reserved_until' => Carbon::parse('2026-09-21 07:05:00', 'UTC'),
        ]);
        $this->assertSame('Vehicle held until 21-09-2026 14:05 · booking not issued yet', $hint->for($hold));

        $confirmed = new Rental(['status' => Rental::STATUS_CONFIRMED]);
        $this->assertSame('Dates locked · vehicle still at the depot', $hint->for($confirmed));

        $awaiting = new Rental([
            'status' => Rental::STATUS_CONFIRMED,
            'pickup_requested_at' => Carbon::parse('2026-09-21 03:00:00', 'UTC'),
        ]);
        $this->assertSame('Customer signed the contract · hand over the vehicle', $hint->for($awaiting));
        $this->assertSame(
            'Contract signed · vehicle has not been handed over yet',
            $hint->for($awaiting, RentalStatusHint::AUDIENCE_PASSENGER),
        );

        $onHire = new Rental([
            'status' => Rental::STATUS_ACTIVE,
            'end_date' => '2026-09-25',
        ]);
        $this->assertSame('Keys with the customer until 25-09-2026', $hint->for($onHire));
    }

    public function test_pending_reserved_without_deadline_still_says_booking_is_not_issued(): void
    {
        App::setLocale('id');

        $hold = new Rental(['status' => Rental::STATUS_PENDING_RESERVED]);

        $this->assertSame(
            'Unit dikunci di kalender · belum terbit',
            (new RentalStatusHint)->for($hold),
        );
    }
}
