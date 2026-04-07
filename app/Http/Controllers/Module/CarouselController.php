<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\CarouselController as AdminCarouselController;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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

    /**
     * Display a listing of the carousels.
     */
    public function index(): Response
    {
        $carousels = Auth::user()
            ->carousels()
            ->withCount('images')
            ->latest()
            ->get();

        $user = Auth::user();

        return Inertia::render('Modules/Carousels/Index', [
            'carousels' => $carousels,
            'can' => [
                'create' => $user->hasPermissionFor('carousels', 'create'),
                'update' => $user->hasPermissionFor('carousels', 'update'),
                'delete' => $user->hasPermissionFor('carousels', 'delete'),
            ],
        ]);
    }
}
