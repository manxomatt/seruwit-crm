<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use App\Models\Page;
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

        return Inertia::render('PageBuilder/Index', [
            'pages' => $pages,
        ]);
    }

    /**
     * Show the form for creating a new page.
     */
    public function create(): Response
    {
        return Inertia::render('PageBuilder/Create');
    }

    /**
     * Store a newly created page in storage.
     */
    public function store(StorePageRequest $request): RedirectResponse
    {
        $page = Auth::user()->pages()->create($request->validated());

        return redirect()->route('pages.edit', $page);
    }

    /**
     * Display the specified page (preview).
     */
    public function show(Page $page): Response
    {
        if ($page->user_id !== Auth::id() && ! $page->is_published) {
            abort(403);
        }

        return Inertia::render('PageBuilder/Show', [
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

        return Inertia::render('PageBuilder/Editor', [
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

        return redirect()->route('pages.edit', $page);
    }

    /**
     * Save the GrapesJS editor content via AJAX.
     */
    public function saveContent(UpdatePageRequest $request, Page $page): \Illuminate\Http\JsonResponse
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

        return redirect()->route('pages.index');
    }

    /**
     * Render the published page for public viewing.
     */
    public function render(string $slug): Response|\Illuminate\Http\Response
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return response()->view('pages.render', ['page' => $page]);
    }
}
