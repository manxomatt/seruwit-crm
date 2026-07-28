<?php

namespace Tests\Feature\Modules\Rental;

use App\Notifications\GenericNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Rental\Models\Rental;
use Modules\Rental\Models\RentalReminder;
use Modules\Rental\Support\RentalReminderScanner;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalReminderTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_ending_soon_thresholds_are_raised_once(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();

        Rental::factory()->active()->create([
            'start_date' => now()->subDays(5)->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);

        $scanner = app(RentalReminderScanner::class);
        $first = $scanner->scan();
        $second = $scanner->scan();

        $this->assertSame(1, $first); // days_before 3 only (2 days left)
        $this->assertSame(0, $second);

        $this->assertDatabaseHas('rental_reminders', [
            'kind' => RentalReminder::KIND_ENDING,
            'days_before' => 3,
        ]);

        Notification::assertSentTo($admin, GenericNotification::class);
        Notification::assertSentTo($admin, \Modules\Rental\Notifications\RentalLifecycleMailNotification::class);
    }

    public function test_overdue_rental_raises_a_single_alert(): void
    {
        Notification::fake();

        $admin = $this->createAdminUser();

        Rental::factory()->active()->create([
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->subDays(2)->toDateString(),
        ]);

        $scanner = app(RentalReminderScanner::class);
        $this->assertSame(1, $scanner->scan());
        $this->assertSame(0, $scanner->scan());

        $this->assertDatabaseHas('rental_reminders', [
            'kind' => RentalReminder::KIND_OVERDUE,
            'days_before' => 0,
        ]);

        Notification::assertSentTo($admin, GenericNotification::class);
        Notification::assertSentTo($admin, \Modules\Rental\Notifications\RentalLifecycleMailNotification::class);
    }

    public function test_far_future_rental_raises_nothing(): void
    {
        Notification::fake();

        Rental::factory()->active()->create([
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
        ]);

        $this->assertSame(0, app(RentalReminderScanner::class)->scan());
        $this->assertSame(0, RentalReminder::query()->count());
        Notification::assertNothingSent();
    }
}
