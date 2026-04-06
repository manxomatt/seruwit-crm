<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\AnalyticsController as AdminAnalyticsController;

class AnalyticsController extends AdminAnalyticsController
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    protected function getPagePrefix(): string
    {
        return 'Module';
    }
}
