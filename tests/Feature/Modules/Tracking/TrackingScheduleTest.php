<?php

namespace Tests\Feature\Modules\Tracking;

use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class TrackingScheduleTest extends TestCase
{
    public function test_tracking_poll_is_scheduled_every_minute(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains($event->command ?? '', 'tracking:poll'));

        $this->assertNotNull($event, 'tracking:poll should be registered on the scheduler.');
        $this->assertSame('* * * * *', $event->expression);
    }
}
