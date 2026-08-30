<?php

use App\Models\Tenant;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reclaims the data of long-uninstalled modules. Daily and off-peak: it issues DDL
// against every tenant schema that has something to drop.
Schedule::command('modules:purge-expired')
    ->dailyAt('03:00')
    ->withoutOverlapping()
    ->onOneServer();

// Pulls vehicle positions from every tenant's Traccar server. The lock expiry is
// set explicitly: the default is 24 hours, so a single crashed run would wedge
// tracking for a full day rather than for the next minute.
Schedule::command('tracking:poll')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->onOneServer()
    ->runInBackground();

// Trims raw position history to each tenant's retention window. Off-peak, and
// after the module purge, since both are heavy on the tenant schemas.
Schedule::command('tracking:prune')
    ->dailyAt('03:30')
    ->withoutOverlapping()
    ->onOneServer();

// Alerts staff about vehicle/driver papers (STNK/KIR/SIM) nearing or past
// expiry. Morning, once a day — a reminder is raised at most once per threshold.
Schedule::command('document:scan-expiring')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->onOneServer();

// Alerts staff about rentals ending soon or already overdue.
Schedule::command('rental:scan-ending')
    ->dailyAt('06:30')
    ->withoutOverlapping()
    ->onOneServer();

// HQ-style: Pending Reserved → Pending when the unpaid hold TTL expires.
Schedule::command('rental:expire-pending-reserved')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->onOneServer()
    ->runInBackground();

// Alerts staff about preventive maintenance schedules due soon / overdue,
// and optionally opens draft work orders when auto_create_wo is enabled.
Schedule::command('maintenance:scan-due')
    ->dailyAt('06:45')
    ->withoutOverlapping()
    ->onOneServer();

// Releases expired passenger seat holds on shuttle public bookings.
Schedule::command('shuttle:release-expired-holds')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->onOneServer()
    ->runInBackground();

// Suspend tenants whose trial period has expired.
Schedule::command('subscription:expire-trials')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->onOneServer();

// Auto-renew subscriptions for tenants with auto_renew = true.
Schedule::command('subscription:auto-renew')
    ->dailyAt('00:30')
    ->withoutOverlapping()
    ->onOneServer();

// Expire payment orders that have passed their 7-day deadline.
Schedule::command('subscription:expire-payment-orders')
    ->dailyAt('01:00')
    ->withoutOverlapping()
    ->onOneServer();

// Notify tenants whose trial expires in 3 days.
Schedule::call(function () {
    Tenant::query()
        ->onTrial()
        ->whereDate('trial_ends_at', now()->addDays(3))
        ->each(function ($tenant) {
            $owner = $tenant->users()->first();
            if ($owner) {
                $owner->notify(new \App\Notifications\TrialExpiringNotification($tenant, 3));
            }
        });
})->name('trial:notify-3days')->dailyAt('08:00')->onOneServer();

// Notify tenants whose trial expires in 1 day.
Schedule::call(function () {
    Tenant::query()
        ->onTrial()
        ->whereDate('trial_ends_at', now()->addDay())
        ->each(function ($tenant) {
            $owner = $tenant->users()->first();
            if ($owner) {
                $owner->notify(new \App\Notifications\TrialExpiringNotification($tenant, 1));
            }
        });
})->name('trial:notify-1day')->dailyAt('08:00')->onOneServer();

// Release reseller commissions once their refund hold window has closed, making
// them eligible for a payout batch. Runs after the payment-order sweep so a
// same-day expiry is settled before commissions mature.
Schedule::command('reseller:approve-commissions')
    ->dailyAt('01:30')
    ->withoutOverlapping()
    ->onOneServer();

// Check vehicle active lifecycle, auto-renew expiring vehicles with capacity credits,
// or deactivate vehicles past grace period.
Schedule::command('fleet:check-expirations')
    ->dailyAt('00:05')
    ->withoutOverlapping()
    ->onOneServer();
