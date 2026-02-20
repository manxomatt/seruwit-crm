<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLiveUpdateRequest;
use App\Http\Requests\UpdateLiveUpdateRequest;
use App\Models\LiveUpdate;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LiveUpdateController extends Controller
{
    /**
     * Display a listing of the live updates.
     */
    public function index(): Response
    {
        $liveUpdates = LiveUpdate::query()
            ->active()
            ->published()
            ->orderBy('published_at', 'desc')
            ->get();

        return Inertia::render('LiveUpdates/Index', [
            'liveUpdates' => $liveUpdates,
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    /**
     * Show the form for creating a new live update.
     */
    public function create(): Response
    {
        return Inertia::render('LiveUpdates/Create');
    }

    /**
     * Store a newly created live update in storage.
     */
    public function store(StoreLiveUpdateRequest $request): RedirectResponse
    {
        LiveUpdate::create($request->validated());

        return redirect()->route('live-updates.index')
            ->with('success', 'Live update created successfully.');
    }

    /**
     * Display the specified live update.
     */
    public function show(LiveUpdate $liveUpdate): Response
    {
        return Inertia::render('LiveUpdates/Show', [
            'liveUpdate' => $liveUpdate,
        ]);
    }

    /**
     * Show the form for editing the specified live update.
     */
    public function edit(LiveUpdate $liveUpdate): Response
    {
        return Inertia::render('LiveUpdates/Edit', [
            'liveUpdate' => $liveUpdate,
        ]);
    }

    /**
     * Update the specified live update in storage.
     */
    public function update(UpdateLiveUpdateRequest $request, LiveUpdate $liveUpdate): RedirectResponse
    {
        $liveUpdate->update($request->validated());

        return redirect()->route('live-updates.index')
            ->with('success', 'Live update updated successfully.');
    }

    /**
     * Remove the specified live update from storage.
     */
    public function destroy(LiveUpdate $liveUpdate): RedirectResponse
    {
        $liveUpdate->delete();

        return redirect()->route('live-updates.index')
            ->with('success', 'Live update deleted successfully.');
    }
}
