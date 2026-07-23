<?php

namespace Modules\Canvassing\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Canvassing\Models\CanvassingVisit;

class CanvassingVisitController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $visits = CanvassingVisit::query()
            ->with(['salesperson', 'partner'])
            ->when(request('salesperson_id'), fn ($q) => $q->where('salesperson_id', request('salesperson_id')))
            ->when(request('outcome'), fn ($q) => $q->where('outcome', request('outcome')))
            ->when(request('date'), fn ($q) => $q->whereDate('checked_in_at', request('date')))
            ->latest('checked_in_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Modules/Canvassing/Visits/Index', [
            'visits' => $visits,
            'filters' => request()->only(['salesperson_id', 'outcome', 'date']),
        ]);
    }

    public function show(CanvassingVisit $visit): Response
    {
        $visit->load(['salesperson', 'partner', 'submitter', 'photos', 'plan']);

        return Inertia::render('Modules/Canvassing/Visits/Show', [
            'visit' => $visit,
        ]);
    }
}
