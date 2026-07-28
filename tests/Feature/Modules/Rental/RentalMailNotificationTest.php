<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Partners\Models\Partner;
use Modules\Rental\Models\Rental;
use Modules\Rental\Notifications\RentalLifecycleMailNotification;
use Modules\Rental\Support\RentalMailer;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalMailNotificationTest extends TestCase
{
    use RefreshDatabase;
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
            ->post(route('module.rental.confirm', $rental))
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
        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('module.rental.checkout', $rental), [
                'start_odometer' => 1000,
                'start_fuel_level' => 'full',
            ])
            ->assertRedirect();

        Notification::assertSentTo(
            $admin,
            RentalLifecycleMailNotification::class,
            fn (RentalLifecycleMailNotification $mail) => $mail->event === RentalLifecycleMailNotification::EVENT_CHECKED_OUT,
        );

        $rental->refresh();

        $this->actingAs($admin)
            ->post(route('module.rental.return', $rental), [
                'actual_return_date' => now()->toDateString(),
                'end_odometer' => 1100,
                'end_fuel_level' => 'full',
            ])
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
}
