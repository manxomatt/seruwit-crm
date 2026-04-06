<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\SettingController as AdminSettingController;

class SettingController extends AdminSettingController
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
