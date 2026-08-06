<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;
use Modules\Rental\Support\RentalMailer;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalMailNotificationTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_confirm_emails_staff_and_customer(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        $partner = Partner::factory()->create(['email' => 'customer@example.test']);
        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_DRAFT,
        ]);

        $this->actingAs($admin)
            ->post(route('module.rental.confirm', $rental), ['deposit_collected' => true, 'payment_method' => 'cash'])
            ->assertRedirect();

        Notification::assertSentTo(
            $admin,
            RentalLifecycleMailNotification::class,
            fn (RentalLifecycleMailNotification $mail) => $mail->event === RentalLifecycleMailNotification::EVENT_CONFIRMED
                && $mail->rental->is($rental),
        );

        Notification::assertSentOnDemand(
            RentalLifecycleMailNotification::class,
            function (RentalLifecycleMailNotification $mail, array $channels, object $notifiable): bool {
                return $mail->event === RentalLifecycleMailNotification::EVENT_CONFIRMED
                    && ($notifiable->routes['mail'] ?? null) === 'customer@example.test';
            },
        );
    }

    public function test_checkout_and_return_send_lifecycle_mail(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        $partner = Partner::factory()->create(['email' => 'customer@example.test']);
        $rental = Rental::factory()->confirmed()->create([
            'partner_id' => $partner->id,
        ]);

        $this->actingAs($admin)
            ->post(route('module.rental.checkout', $rental), $this->rentalCheckoutPayload([
                'start_odometer' => 1000,
                'start_fuel_level' => 'full',
            ]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        Notification::assertSentTo(
            $admin,
            RentalLifecycleMailNotification::class,
            fn (RentalLifecycleMailNotification $mail) => $mail->event === RentalLifecycleMailNotification::EVENT_CHECKED_OUT,
        );

        $rental->refresh();

        $this->actingAs($admin)
            ->post(route('module.rental.return', $rental), $this->rentalReturnPayload([
                'actual_return_date' => now()->toDateString(),
                'end_odometer' => 1100,
                'end_fuel_level' => 'full',
            ]))
            ->assertRedirect();

        Notification::assertSentTo(
            $admin,
            RentalLifecycleMailNotification::class,
            fn (RentalLifecycleMailNotification $mail) => $mail->event === RentalLifecycleMailNotification::EVENT_RETURNED,
        );
    }

    public function test_mailer_skips_customer_when_partner_has_no_email(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();
        $partner = Partner::factory()->create(['email' => null]);
        $rental = Rental::factory()->create(['partner_id' => $partner->id]);

        app(RentalMailer::class)->notify($rental, RentalLifecycleMailNotification::EVENT_CONFIRMED);

        Notification::assertSentTo($admin, RentalLifecycleMailNotification::class);
        Notification::assertSentToTimes($admin, RentalLifecycleMailNotification::class, 1);
    }

    public function test_mailer_skips_when_email_notifications_disabled(): void
    {
        Notification::fake();

        \App\Models\Setting::factory()->create([
            'key' => 'email.notification_enabled',
            'group' => 'email',
            'value' => '0',
            'type' => 'boolean',
            'label' => 'Enable Email Notifications',
        ]);

        $this->createAdminUser();
        $rental = Rental::factory()->create();

        app(RentalMailer::class)->notify($rental, RentalLifecycleMailNotification::EVENT_CONFIRMED);

        Notification::assertNothingSent();
    }
}
