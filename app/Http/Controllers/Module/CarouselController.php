<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\CarouselController as AdminCarouselController;

class CarouselController extends AdminCarouselController
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
