<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Display a listing of published blog posts.
     */
    public function index(): Response
    {
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
