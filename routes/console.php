<?php

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
