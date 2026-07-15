<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Page;
use App\Models\Post;
use App\Modules\Facades\Modules;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Carousels\Models\Carousel;

class DashboardController extends Controller
{
    /**
     * Display the module dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $primaryRole = $user->getPrimaryRole();

        // Get statistics
        $stats = [
            'posts' => [
                'total' => Post::query()->count(),
                'published' => Post::query()->where('is_published', true)->count(),
                'draft' => Post::query()->where('is_published', false)->count(),
            ],
            'pages' => [
                'total' => Page::query()->count(),
                'published' => Page::query()->where('is_published', true)->count(),
                'draft' => Page::query()->where('is_published', false)->count(),
            ],
            'media' => [
                'total' => Media::query()->count(),
                'images' => Media::query()->where('type', 'image')->count(),
                'documents' => Media::query()->where('type', 'document')->count(),
            ],
        ];

        if (Modules::available('carousels')) {
            $stats['carousels'] = [
                'total' => Carousel::query()->count(),
                'active' => Carousel::query()->where('is_active', true)->count(),
            ];
        }

        // Get recent posts
        $recentPosts = Post::query()
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'slug', 'is_published', 'created_at']);

        // Get recent pages
        $recentPages = Page::query()
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'slug', 'is_published', 'created_at']);

        return Inertia::render('Module/Dashboard', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
            ],
            'primaryRole' => $primaryRole ? [
                'name' => $primaryRole->name,
                'slug' => $primaryRole->slug,
            ] : null,
            'stats' => $stats,
            'recentPosts' => $recentPosts,
            'recentPages' => $recentPages,
        ]);
    }
}
