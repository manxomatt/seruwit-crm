<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\CarouselImageController as AdminCarouselImageController;

class CarouselImageController extends AdminCarouselImageController
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }
}
