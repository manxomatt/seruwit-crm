<?php

namespace Modules\Posts\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Posts\Http\Requests\StorePostRequest;
use Modules\Posts\Http\Requests\UpdatePostRequest;
use Modules\Posts\Models\Post;

class PostController extends Controller
{
    /**
     * Get the route prefix for this controller.
     */
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    /**
     * Display a listing of the posts.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $posts = $user->posts()->latest()->get();

        return Inertia::render('Modules/Posts/Index', [
            'posts' => $posts,
            'can' => [
                'create' => $user->hasPermissionFor('posts', 'create'),
                'update' => $user->hasPermissionFor('posts', 'update'),
                'delete' => $user->hasPermissionFor('posts', 'delete'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new post.
     */
    public function create(): Response
    {
        return Inertia::render('Modules/Posts/Create');
    }

    /**
     * Store a newly created post in storage.
     */
    public function store(StorePostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        if (isset($data['is_published']) && $data['is_published'] && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $post = Auth::user()->posts()->create($data);

        return redirect()->route($this->getRoutePrefix().'.posts.edit', $post);
    }

    /**
     * Display the specified post.
     */
    public function show(Post $post): Response
    {
        if ($post->user_id !== Auth::id() && ! $post->is_published) {
            abort(403);
        }

        return Inertia::render('Modules/Posts/Show', [
            'post' => $post,
        ]);
    }

    /**
     * Show the form for editing the specified post.
     */
    public function edit(Post $post): Response
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        return Inertia::render('Modules/Posts/Edit', [
            'post' => $post,
        ]);
    }

    /**
     * Update the specified post in storage.
     */
    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $data = $request->validated();

        if (isset($data['is_published']) && $data['is_published'] && ! $post->is_published && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $post->update($data);

        return redirect()->route($this->getRoutePrefix().'.posts.index')->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified post from storage.
     */
    public function destroy(Post $post): RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $post->delete();

        return redirect()->route($this->getRoutePrefix().'.posts.index')->with('success', 'Post deleted successfully.');
    }

    /**
     * Toggle the published status of the post.
     */
    public function togglePublish(Post $post): RedirectResponse
    {
        if ($post->user_id !== Auth::id()) {
            abort(403);
        }

        $post->update([
            'is_published' => ! $post->is_published,
            'published_at' => ! $post->is_published ? now() : $post->published_at,
        ]);

        return redirect()->route($this->getRoutePrefix().'.posts.index');
    }
}
