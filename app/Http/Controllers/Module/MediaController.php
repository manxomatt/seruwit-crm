<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\MediaController as AdminMediaController;

class MediaController extends AdminMediaController
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
