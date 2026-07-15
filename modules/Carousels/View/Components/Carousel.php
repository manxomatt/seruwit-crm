<?php

namespace Modules\Carousels\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;
use Modules\Carousels\Models\Carousel as CarouselModel;

class Carousel extends Component
{
    public ?CarouselModel $carousel = null;

    /**
     * Create a new component instance.
     */
    public function __construct(public string $slug)
    {
        $this->carousel = CarouselModel::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->with('activeImages')
            ->first();
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('carousels::carousel');
    }
}
