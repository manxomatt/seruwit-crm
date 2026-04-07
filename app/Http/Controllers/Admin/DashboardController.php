<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carousel;
use App\Models\Media;
use App\Models\Page;
use App\Models\Todo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard', [
            'stats' => $this->getStats(),
            'recentActivity' => $this->getRecentActivity(),
            'quickStats' => $this->getQuickStats(),
        ]);
    }

    /**
     * Get main dashboard statistics.
     *
     * @return array<string, mixed>
     */
    private function getStats(): array
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

        $userGrowth = $usersLastMonth > 0
            ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
            : ($usersThisMonth > 0 ? 100 : 0);

        $pagesThisMonth = Page::query()
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $pagesLastMonth = Page::query()
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $pageGrowth = $pagesLastMonth > 0
            ? round((($pagesThisMonth - $pagesLastMonth) / $pagesLastMonth) * 100, 1)
            : ($pagesThisMonth > 0 ? 100 : 0);

        $mediaThisMonth = Media::query()
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->count();

        $mediaLastMonth = Media::query()
            ->whereBetween('created_at', [
                Carbon::now()->subMonth()->startOfMonth(),
                Carbon::now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $mediaGrowth = $mediaLastMonth > 0
            ? round((($mediaThisMonth - $mediaLastMonth) / $mediaLastMonth) * 100, 1)
            : ($mediaThisMonth > 0 ? 100 : 0);

        $totalStorageBytes = Media::query()->sum('size');

        return [
            'totalUsers' => User::query()->count(),
            'userGrowth' => $userGrowth,
            'totalPages' => Page::query()->count(),
            'publishedPages' => Page::query()->where('is_published', true)->count(),
            'pageGrowth' => $pageGrowth,
            'totalMedia' => Media::query()->count(),
            'mediaGrowth' => $mediaGrowth,
            'totalStorage' => $this->formatBytes($totalStorageBytes),
            'totalCarousels' => Carousel::query()->count(),
            'activeCarousels' => Carousel::query()->where('is_active', true)->count(),
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
            ->take(3)
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
            ->take(3)
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
            ->take(3)
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
        Carousel::query()
            ->latest('updated_at')
            ->take(2)
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

        // Recent todos
        Todo::query()
            ->latest('updated_at')
            ->take(2)
            ->get()
            ->each(function ($todo) use ($activities) {
                $activities->push([
                    'id' => 'todo_'.$todo->id,
                    'type' => $todo->is_completed ? 'todo_completed' : 'todo_created',
                    'description' => $todo->is_completed
                        ? "Todo \"{$todo->title}\" was completed"
                        : "Todo \"{$todo->title}\" was created",
                    'time' => $todo->updated_at,
                    'timeForHumans' => $todo->updated_at->diffForHumans(),
                ]);
            });

        return $activities
            ->sortByDesc('time')
            ->take(8)
            ->values()
            ->map(fn ($activity) => [
                'id' => $activity['id'],
                'type' => $activity['type'],
                'description' => $activity['description'],
                'time' => $activity['timeForHumans'],
            ])
            ->toArray();
    }

    /**
     * Get quick stats for dashboard widgets.
     *
     * @return array<string, mixed>
     */
    private function getQuickStats(): array
    {
        $totalTodos = Todo::query()->count();
        $completedTodos = Todo::query()->where('is_completed', true)->count();
        $todoCompletionRate = $totalTodos > 0 ? round(($completedTodos / $totalTodos) * 100) : 0;

        // Get 7-day trends
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

        return [
            'todos' => [
                'total' => $totalTodos,
                'completed' => $completedTodos,
                'pending' => $totalTodos - $completedTodos,
                'completionRate' => $todoCompletionRate,
            ],
            'recentPages' => Page::query()
                ->latest()
                ->take(5)
                ->get(['id', 'title', 'slug', 'is_published', 'created_at'])
                ->map(fn ($page) => [
                    'id' => $page->id,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'isPublished' => $page->is_published,
                    'createdAt' => $page->created_at->diffForHumans(),
                ])
                ->toArray(),
            'trends' => [
                'labels' => $dates->map(fn ($date) => Carbon::parse($date)->format('M d'))->toArray(),
                'pages' => $dates->map(fn ($date) => $pagesByDate[$date] ?? 0)->toArray(),
                'users' => $dates->map(fn ($date) => $usersByDate[$date] ?? 0)->toArray(),
            ],
        ];
    }

    /**
     * Format bytes to human readable format.
     */
    private function formatBytes(int $bytes): string
    {
        if ($bytes === 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }
}
