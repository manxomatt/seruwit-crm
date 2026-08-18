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
use Modules\Pages\Models\PageComponent;

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

        $pages = Page::query()->latest()->get();

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
    protected function authorizePageAccess(Page $page, string $permission = 'update'): void
    {
        $user = Auth::user();

        if (! $user) {
            abort(401);
        }

        if ($page->user_id === $user->id || $user->isAdmin() || $user->hasPermissionFor('pages', $permission)) {
            return;
        }

        abort(403);
    }

    /**
     * Display the specified page.
     */
    public function show(Page $page): Response
    {
        $user = Auth::user();

        if (! $page->is_published && $page->user_id !== $user?->id && ! $user?->isAdmin() && ! $user?->hasPermissionFor('pages', 'view')) {
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
        $this->authorizePageAccess($page);

        $customBlocks = PageComponent::query()
            ->active()
            ->ordered()
            ->get(['key', 'label', 'category', 'content', 'media', 'attributes']);

        return Inertia::render('Modules/Pages/Editor', [
            'page' => $page,
            'customBlocks' => $customBlocks,
        ]);
    }

    /**
     * Update the specified page in storage.
     */
    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $this->authorizePageAccess($page);

        $page->update($request->validated());

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', __('pages.messages.updated'));
    }

    /**
     * Remove the specified page from storage.
     */
    public function destroy(Page $page): RedirectResponse
    {
        $this->authorizePageAccess($page, 'delete');

        $page->delete();

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', __('pages.messages.deleted'));
    }

    /**
     * Save the GrapesJS editor content via AJAX.
     */
    public function saveContent(Request $request, Page $page): JsonResponse
    {
        $this->authorizePageAccess($page);

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
        $this->authorizePageAccess($page);

        Page::query()->where('is_homepage', true)->update(['is_homepage' => false]);
        $page->update(['is_homepage' => true, 'is_published' => true]);

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', __('pages.messages.homepage_set'));
    }

    /**
     * Duplicate (copy) an existing page.
     */
    public function copy(Page $page): RedirectResponse
    {
        $this->authorizePageAccess($page);

        $baseTitle = $page->title;
        $title = $baseTitle.' (Copy)';
        $baseSlug = $page->slug.'-copy';
        $slug = $baseSlug;

        $count = 1;
        while (Page::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.$count;
            $title = $baseTitle.' (Copy '.$count.')';
            $count++;
        }

        Auth::user()->pages()->create([
            'title' => $title,
            'slug' => $slug,
            'html' => $page->html,
            'css' => $page->css,
            'gjs_data' => $page->gjs_data,
            'is_published' => false,
            'is_homepage' => false,
        ]);

        return redirect()->route($this->getRoutePrefix().'.pages.index')->with('success', __('pages.messages.copied'));
    }
}
