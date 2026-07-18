<?php

namespace Modules\Pages\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pages\Http\Requests\StorePageRequest;
use Modules\Pages\Http\Requests\UpdatePageRequest;
use Modules\Pages\Models\Page;

class PageController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the pages.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $pages = $user->pages()->latest()->get();

        return Inertia::render('Modules/Pages/Index', [
            'pages' => $pages,
            'can' => [
                'create' => $user->hasPermissionFor('pages', 'create'),
                'update' => $user->hasPermissionFor('pages', 'update'),
                'delete' => $user->hasPermissionFor('pages', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Pages/Create');
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

        return Inertia::render('Modules/Pages/Show', [
            'page' => $page,
        ]);
    }

    /**
     * Show the GrapesJS editor for the specified page.
     */
    public function edit(Page $page): Response
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Modules/Pages/Editor', [
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
     * Save the GrapesJS editor content via AJAX.
     */
    public function saveContent(Request $request, Page $page): JsonResponse
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
     * Set a page as the homepage.
     */
    public function setHomepage(Page $page): RedirectResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        Page::query()->where('is_homepage', true)->update(['is_homepage' => false]);
        $page->update(['is_homepage' => true, 'is_published' => true]);

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', 'Homepage set successfully.');
    }
}
