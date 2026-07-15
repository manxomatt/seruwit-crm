<?php

namespace Modules\Carousels\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Carousels\Http\Requests\StoreCarouselRequest;
use Modules\Carousels\Http\Requests\UpdateCarouselRequest;
use Modules\Carousels\Models\Carousel;

class CarouselController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the carousels.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $carousels = $user
            ->carousels()
            ->withCount('images')
            ->latest()
            ->get();

        return Inertia::render('Modules/Carousels/Index', [
            'carousels' => $carousels,
            'can' => [
                'create' => $user->hasPermissionFor('carousels', 'create'),
                'update' => $user->hasPermissionFor('carousels', 'update'),
                'delete' => $user->hasPermissionFor('carousels', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new carousel.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Carousels/Create');
    }

    /**
     * Store a newly created carousel in storage.
     */
    public function store(StoreCarouselRequest $request): RedirectResponse
    {
        $carousel = Auth::user()->carousels()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.carousels.edit', $carousel)
            ->with('success', 'Carousel created successfully.');
    }

    /**
     * Display the specified carousel.
     */
    public function show(Carousel $carousel): Response
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $carousel->load('images');

        return Inertia::render('Modules/Carousels/Show', [
            'carousel' => $carousel,
        ]);
    }

    /**
     * Show the form for editing the specified carousel.
     */
    public function edit(Carousel $carousel): Response
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $carousel->load('images');

        return Inertia::render('Modules/Carousels/Edit', [
            'carousel' => $carousel,
        ]);
    }

    /**
     * Update the specified carousel in storage.
     */
    public function update(UpdateCarouselRequest $request, Carousel $carousel): RedirectResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $carousel->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.carousels.edit', $carousel)
            ->with('success', 'Carousel updated successfully.');
    }

    /**
     * Remove the specified carousel from storage.
     */
    public function destroy(Carousel $carousel): RedirectResponse
    {
        if ($carousel->user_id !== Auth::id()) {
            abort(403);
        }

        $carousel->delete();

        return redirect()->route($this->getRoutePrefix().'.carousels.index')
            ->with('success', 'Carousel deleted successfully.');
    }
}
