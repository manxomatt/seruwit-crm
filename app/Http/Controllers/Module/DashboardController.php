<?php

namespace App\Http\Controllers\Module;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Modules\Facades\Modules;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Carousels\Models\Carousel;
use Modules\Pages\Models\Page;
use Modules\Posts\Models\Post;

class DashboardController extends Controller
{
    /**
     * Display the module dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $primaryRole = $user->getPrimaryRole();

        // Get statistics. Posts, Pages and Carousels are optional modules, so
        // their stats only exist where the module is available — the frontend
        // renders each card conditionally.
        $stats = [
            'media' => [
                'total' => Media::query()->count(),
                'images' => Media::query()->where('type', 'image')->count(),
                'documents' => Media::query()->where('type', 'document')->count(),
            ],
        ];

        if (Modules::available('posts')) {
            $stats['posts'] = [
                'total' => Post::query()->count(),
                'published' => Post::query()->where('is_published', true)->count(),
                'draft' => Post::query()->where('is_published', false)->count(),
            ];
        }

        if (Modules::available('pages')) {
            $stats['pages'] = [
                'total' => Page::query()->count(),
                'published' => Page::query()->where('is_published', true)->count(),
                'draft' => Page::query()->where('is_published', false)->count(),
            ];
        }

        if (Modules::available('carousels')) {
            $stats['carousels'] = [
                'total' => Carousel::query()->count(),
                'active' => Carousel::query()->where('is_active', true)->count(),
            ];
        }

        $recentPosts = Modules::available('posts')
            ? Post::query()->latest()->limit(5)->get(['id', 'title', 'slug', 'is_published', 'created_at'])
            : collect();

        $recentPages = Modules::available('pages')
            ? Page::query()->latest()->limit(5)->get(['id', 'title', 'slug', 'is_published', 'created_at'])
            : collect();

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
