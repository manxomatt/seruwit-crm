<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Admin\PageController as AdminPageController;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends AdminPageController
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Get the Inertia page prefix for this controller.
     */
    protected function getPagePrefix(): string
    {
        return 'Module';
    }

    /**
     * Display a listing of the pages.
     */
    public function index(): Response
    {
        $pages = Auth::user()
            ->pages()
            ->latest()
            ->get();

        return Inertia::render($this->getPagePrefix().'/Pages/Index', [
            'pages' => $pages,
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        return Inertia::render($this->getPagePrefix().'/Pages/Create');
    }

    /**
     * Store a newly created page in storage.
     */
    public function store(StorePageRequest $request): RedirectResponse
    {
        $page = Auth::user()->pages()->create($request->validated());

        return redirect()->route($this->getRoutePrefix().'.pages.edit', $page);
    }

    /**
     * Display the specified page.
     */
    public function show(Page $page): Response
    {
        if ($page->user_id !== Auth::id() && ! $page->is_published) {
            abort(403);
        }

        return Inertia::render($this->getPagePrefix().'/Pages/Show', [
            'page' => $page,
        ]);
    }

    /**
     * Show the form for editing the specified page.
     */
    public function edit(Page $page): Response
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render($this->getPagePrefix().'/Pages/Edit', [
            'page' => $page,
        ]);
    }

    /**
     * Update the specified page in storage.
     */
    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        $page->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', 'Page updated successfully.');
    }

    /**
     * Remove the specified page from storage.
     */
    public function destroy(Page $page): RedirectResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        $page->delete();

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', 'Page deleted successfully.');
    }

    /**
     * Save page content via AJAX.
     */
    public function saveContent(Request $request, Page $page): \Illuminate\Http\JsonResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'html' => 'nullable|string',
            'css' => 'nullable|string',
            'gjs_data' => 'nullable|array',
        ]);

        $page->update($validated);

        return response()->json(['success' => true]);
    }

    /**
     * Set page as homepage.
     */
    public function setHomepage(Page $page): RedirectResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        Page::where('is_homepage', true)->update(['is_homepage' => false]);
        $page->update(['is_homepage' => true, 'is_published' => true]);

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', 'Homepage set successfully.');
    }
}
