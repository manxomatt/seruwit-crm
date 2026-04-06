<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Display a listing of the pages.
     */
    public function index(): Response
    {
        $pages = Auth::user()
            ->pages()
            ->latest()
            ->get();

        return Inertia::render('Modules/Pages/Index', [
            'pages' => $pages,
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

        return redirect()->route('admin.pages.edit', $page);
    }

    /**
     * Display the specified page (preview).
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

        return redirect()->route('admin.pages.edit', $page);
    }

    /**
     * Save the GrapesJS editor content via AJAX.
     */
    public function saveContent(UpdatePageRequest $request, Page $page): JsonResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        $page->update($request->validated());

        return response()->json(['success' => true, 'message' => 'Page saved successfully']);
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

        return redirect()->route('admin.pages.index');
    }

    /**
     * Set a page as the homepage.
     */
    public function setHomepage(Page $page): RedirectResponse
    {
        if ($page->user_id !== Auth::id()) {
            abort(403);
        }

        // Remove homepage status from all other pages
        Page::query()
            ->where('user_id', Auth::id())
            ->where('is_homepage', true)
            ->update(['is_homepage' => false]);

        // Set this page as homepage
        $page->update(['is_homepage' => true, 'is_published' => true]);

        return redirect()->route('admin.pages.index')->with('success', 'Page set as homepage successfully.');
    }
}
