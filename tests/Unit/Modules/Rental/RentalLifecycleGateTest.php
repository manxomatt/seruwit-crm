<?php

namespace Tests\Unit\Modules\Rental;

use Illuminate\Validation\ValidationException;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalLifecycleGate;
use Tests\TestCase;

class RentalLifecycleGateTest extends TestCase
{
    public function test_issuing_a_booking_is_allowed_only_before_confirm(): void
    {
        $gate = new RentalLifecycleGate;

        foreach (Rental::confirmableStatuses() as $status) {
            $gate->assertCanIssueBooking($this->rental($status));
        }

        $this->assertGateRejects(
            fn () => $gate->assertCanIssueBooking($this->rental(Rental::STATUS_CONFIRMED)),
            'rental.errors.confirm_draft_only',
        );
        $this->assertGateRejects(
            fn () => $gate->assertCanIssueBooking($this->rental(Rental::STATUS_ACTIVE)),
            'rental.errors.confirm_draft_only',
        );
    }

    public function test_handover_no_show_and_contract_sign_require_an_issued_booking(): void
    {
        $gate = new RentalLifecycleGate;
        $confirmed = $this->rental(Rental::STATUS_CONFIRMED);

        $gate->assertCanHandOver($confirmed);
        $gate->assertCanMarkNoShow($confirmed);
        $gate->assertCanSignContract($confirmed);

        foreach ([Rental::STATUS_DRAFT, Rental::STATUS_PENDING_RESERVED, Rental::STATUS_ACTIVE] as $status) {
            $rental = $this->rental($status);

            $this->assertGateRejects(
                fn () => $gate->assertCanHandOver($rental),
                'rental.errors.checkout_confirmed_only',
            );
            $this->assertGateRejects(
                fn () => $gate->assertCanMarkNoShow($rental),
                'rental.errors.no_show_confirmed_only',
            );
            $this->assertGateRejects(
                fn () => $gate->assertCanSignContract($rental),
                'rental.public.pickup_confirmed_only',
            );
        }
    }

    public function test_issue_and_handover_gates_never_accept_the_same_status(): void
    {
        $gate = new RentalLifecycleGate;

        foreach (Rental::confirmableStatuses() as $status) {
            $rental = $this->rental($status);
            $gate->assertCanIssueBooking($rental);
            $this->assertGateRejects(
                fn () => $gate->assertCanHandOver($rental),
                'rental.errors.checkout_confirmed_only',
            );
        }

        $confirmed = $this->rental(Rental::STATUS_CONFIRMED);
        $gate->assertCanHandOver($confirmed);
        $this->assertGateRejects(
            fn () => $gate->assertCanIssueBooking($confirmed),
            'rental.errors.confirm_draft_only',
        );
    }

    private function rental(string $status): Rental
    {
        return new Rental(['status' => $status]);
    }

    private function assertGateRejects(callable $callback, string $messageKey): void
    {
        try {
            $callback();
            $this->fail('Expected ValidationException for '.$messageKey);
        } catch (ValidationException $e) {
            $this->assertSame(__($messageKey), $e->errors()['status'][0]);
        }
    }
}
