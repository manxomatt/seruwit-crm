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
