<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Modules\Facades\Modules;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Posts\Models\Post;

/**
 * The public face of the Posts module. These routes are core, so they stay
 * registered whether or not the module is installed and gate on
 * Modules::available('posts') at runtime instead.
 */
class BlogController extends Controller
{
    /**
     * Display a listing of published blog posts.
     */
    public function index(): Response
    {
        abort_unless(Modules::available('posts'), 404);

        $posts = Post::query()
            ->where('is_published', true)
            ->with('user:id,name')
            ->latest('published_at')
            ->paginate(9);

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Blog/Index', [
            'posts' => $posts,
            'settings' => $settings,
        ]);
    }

    /**
     * Display the specified blog post.
     */
    public function show(string $slug): Response
    {
        abort_unless(Modules::available('posts'), 404);

        $post = Post::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with('user:id,name')
            ->firstOrFail();

        $relatedPosts = Post::query()
            ->where('is_published', true)
            ->where('id', '!=', $post->id)
            ->latest('published_at')
            ->limit(3)
            ->get();

        $settings = Setting::getPublic()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
            ->toArray();

        return Inertia::render('Blog/Show', [
            'post' => $post,
            'relatedPosts' => $relatedPosts,
            'settings' => $settings,
        ]);
    }
}
