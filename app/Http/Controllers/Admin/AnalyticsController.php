<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LiveUpdate;
use App\Models\Media;
use App\Models\Page;
use App\Models\Setting;
use App\Models\Todo;
use App\Models\User;
use App\Modules\Facades\Modules;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Carousels\Models\Carousel;
use Modules\Carousels\Models\CarouselImage;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Modules/Analytics/Index', [
            'overview' => $this->getOverviewStats(),
            'contentStats' => $this->getContentStats(),
            'mediaStats' => $this->getMediaStats(),
            'userStats' => $this->getUserStats(),
            'recentActivity' => $this->getRecentActivity(),
            'trendsData' => $this->getTrendsData(),
        ]);
    }

    /**
     * Get overview statistics.
     *
     * @return array<string, mixed>
     */
    private function getOverviewStats(): array
    {
        $stats = [
            'totalUsers' => User::query()->count(),
            'totalPages' => Page::query()->count(),
            'publishedPages' => Page::query()->where('is_published', true)->count(),
            'totalMedia' => Media::query()->count(),
            'totalTodos' => Todo::query()->count(),
            'completedTodos' => Todo::query()->where('is_completed', true)->count(),
            'totalSettings' => Setting::query()->count(),
        ];

        if (Modules::installed('carousels')) {
            $stats['totalCarousels'] = Carousel::query()->count();
        }

        return $stats;
    }

    /**
     * Get content statistics.
     *
     * @return array<string, mixed>
     */
    private function getContentStats(): array
    {
        $pages = Page::query()
            ->select('is_published', DB::raw('count(*) as count'))
            ->groupBy('is_published')
            ->get()
            ->mapWithKeys(fn ($item) => [
                $item->is_published ? 'published' : 'draft' => $item->count,
            ])
            ->toArray();

        $liveUpdates = LiveUpdate::query()
            ->select('is_active', DB::raw('count(*) as count'))
            ->groupBy('is_active')
            ->get()
            ->mapWithKeys(fn ($item) => [
                $item->is_active ? 'active' : 'inactive' => $item->count,
            ])
            ->toArray();

        $stats = [
            'pages' => [
                'published' => $pages['published'] ?? 0,
                'draft' => $pages['draft'] ?? 0,
                'total' => Page::query()->count(),
                'hasHomepage' => Page::query()->where('is_homepage', true)->exists(),
            ],
            'liveUpdates' => [
                'active' => $liveUpdates['active'] ?? 0,
                'inactive' => $liveUpdates['inactive'] ?? 0,
                'total' => LiveUpdate::query()->count(),
            ],
            'todos' => [
                'completed' => Todo::query()->where('is_completed', true)->count(),
                'pending' => Todo::query()->where('is_completed', false)->count(),
                'total' => Todo::query()->count(),
                'completionRate' => $this->calculateCompletionRate(),
            ],
        ];

        if (Modules::installed('carousels')) {
            $carousels = Carousel::query()
                ->select('is_active', DB::raw('count(*) as count'))
                ->groupBy('is_active')
                ->get()
                ->mapWithKeys(fn ($item) => [
                    $item->is_active ? 'active' : 'inactive' => $item->count,
                ])
                ->toArray();

            $stats['carousels'] = [
                'active' => $carousels['active'] ?? 0,
                'inactive' => $carousels['inactive'] ?? 0,
                'total' => Carousel::query()->count(),
                'totalImages' => CarouselImage::query()->count(),
            ];
        }

        return $stats;
    }

    /**
     * Get media statistics.
     *
     * @return array<string, mixed>
     */
    private function getMediaStats(): array
    {
        $mediaByType = Media::query()
            ->select('type', DB::raw('count(*) as count'), DB::raw('sum(size) as total_size'))
            ->groupBy('type')
            ->get()
            ->map(fn ($item) => [
                'type' => $item->type ?? 'unknown',
                'count' => $item->count,
                'totalSize' => $item->total_size ?? 0,
                'humanSize' => $this->formatBytes($item->total_size ?? 0),
            ])
            ->toArray();

        $totalStorageUsed = Media::query()->sum('size');

        return [
            'byType' => $mediaByType,
            'totalFiles' => Media::query()->count(),
            'totalStorageUsed' => $totalStorageUsed,
            'humanStorageUsed' => $this->formatBytes($totalStorageUsed),
            'recentUploads' => Media::query()
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'type', 'size', 'created_at'])
                ->map(fn ($media) => [
                    'id' => $media->id,
                    'name' => $media->name,
                    'type' => $media->type,
                    'size' => $media->size,
                    'humanSize' => $this->formatBytes($media->size),
                    'createdAt' => $media->created_at->diffForHumans(),
                ])
                ->toArray(),
        ];
    }

    /**
     * Get user statistics.
     *
     * @return array<string, mixed>
     */
    private function getUserStats(): array
    {
        $usersThisMonth = User::query()
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $usersLastMonth = User::query()
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $growthRate = $usersLastMonth > 0
            ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
            : ($usersThisMonth > 0 ? 100 : 0);

        $carouselsInstalled = Modules::installed('carousels');

        $topContributors = User::query()
            ->withCount(array_filter(['pages', 'media', $carouselsInstalled ? 'carousels' : null]))
            ->orderByDesc('pages_count')
            ->take(5)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'pagesCount' => $user->pages_count,
                'mediaCount' => $user->media_count,
                'carouselsCount' => $carouselsInstalled ? $user->carousels_count : 0,
            ])
            ->toArray();

        return [
            'total' => User::query()->count(),
            'thisMonth' => $usersThisMonth,
            'lastMonth' => $usersLastMonth,
            'growthRate' => $growthRate,
            'verified' => User::query()->whereNotNull('email_verified_at')->count(),
            'unverified' => User::query()->whereNull('email_verified_at')->count(),
            'topContributors' => $topContributors,
            'recentUsers' => User::query()
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'email', 'created_at'])
                ->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'createdAt' => $user->created_at->diffForHumans(),
                ])
                ->toArray(),
        ];
    }

    /**
     * Get recent activity across all models.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getRecentActivity(): array
    {
        $activities = collect();

        // Recent pages
        Page::query()
            ->latest('updated_at')
            ->take(5)
            ->get()
            ->each(function ($page) use ($activities) {
                $activities->push([
                    'id' => 'page_'.$page->id,
                    'type' => $page->created_at->eq($page->updated_at) ? 'page_created' : 'page_updated',
                    'description' => $page->created_at->eq($page->updated_at)
                        ? "Page \"{$page->title}\" was created"
                        : "Page \"{$page->title}\" was updated",
                    'time' => $page->updated_at,
                    'timeForHumans' => $page->updated_at->diffForHumans(),
                ]);
            });

        // Recent users
        User::query()
            ->latest()
            ->take(5)
            ->get()
            ->each(function ($user) use ($activities) {
                $activities->push([
                    'id' => 'user_'.$user->id,
                    'type' => 'user_registered',
                    'description' => "User \"{$user->name}\" registered",
                    'time' => $user->created_at,
                    'timeForHumans' => $user->created_at->diffForHumans(),
                ]);
            });

        // Recent media uploads
        Media::query()
            ->latest()
            ->take(5)
            ->get()
            ->each(function ($media) use ($activities) {
                $activities->push([
                    'id' => 'media_'.$media->id,
                    'type' => 'media_uploaded',
                    'description' => "Media \"{$media->name}\" was uploaded",
                    'time' => $media->created_at,
                    'timeForHumans' => $media->created_at->diffForHumans(),
                ]);
            });

        // Recent carousels
        if (Modules::installed('carousels')) {
            Carousel::query()
                ->latest('updated_at')
                ->take(5)
                ->get()
                ->each(function ($carousel) use ($activities) {
                    $activities->push([
                        'id' => 'carousel_'.$carousel->id,
                        'type' => $carousel->created_at->eq($carousel->updated_at) ? 'carousel_created' : 'carousel_updated',
                        'description' => $carousel->created_at->eq($carousel->updated_at)
                            ? "Carousel \"{$carousel->name}\" was created"
                            : "Carousel \"{$carousel->name}\" was updated",
                        'time' => $carousel->updated_at,
                        'timeForHumans' => $carousel->updated_at->diffForHumans(),
                    ]);
                });
        }

        return $activities
            ->sortByDesc('time')
            ->take(10)
            ->values()
            ->toArray();
    }

    /**
     * Get trends data for charts.
     *
     * @return array<string, mixed>
     */
    private function getTrendsData(): array
    {
        $days = 7;
        $dates = collect();

        for ($i = $days - 1; $i >= 0; $i--) {
            $dates->push(Carbon::now()->subDays($i)->format('Y-m-d'));
        }

        $pagesByDate = Page::query()
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $usersByDate = User::query()
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $mediaByDate = Media::query()
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        return [
            'labels' => $dates->map(fn ($date) => Carbon::parse($date)->format('M d'))->toArray(),
            'pages' => $dates->map(fn ($date) => $pagesByDate[$date] ?? 0)->toArray(),
            'users' => $dates->map(fn ($date) => $usersByDate[$date] ?? 0)->toArray(),
            'media' => $dates->map(fn ($date) => $mediaByDate[$date] ?? 0)->toArray(),
        ];
    }

    /**
     * Calculate todo completion rate.
     */
    private function calculateCompletionRate(): float
    {
        $total = Todo::query()->count();
        if ($total === 0) {
            return 0;
        }

        $completed = Todo::query()->where('is_completed', true)->count();

        return round(($completed / $total) * 100, 1);
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }
}
