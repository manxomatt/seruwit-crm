<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Each user's own notification feed. No permission gate — every authenticated
 * user reads and clears only their own notifications.
 */
class NotificationController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $tab = $request->query('tab', 'all');
        $search = $request->query('search');

        $query = $user->notifications()->latest();

        if ($tab === 'unread') {
            $query->whereNull('read_at');
        } elseif ($tab === 'read') {
            $query->whereNotNull('read_at');
        }

        if (filled($search)) {
            $query->where('data', 'like', "%{$search}%");
        }

        $notifications = $query->paginate(15)
            ->withQueryString()
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at?->toDateTimeString(),
                'created_at_human' => $notification->created_at?->diffForHumans(),
                ...$notification->data,
            ]);

        $totalCount = $user->notifications()->count();
        $unreadCount = $user->unreadNotifications()->count();
        $readCount = $totalCount - $unreadCount;

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'counts' => [
                'total' => $totalCount,
                'unread' => $unreadCount,
                'read' => $readCount,
            ],
            'filters' => [
                'tab' => $tab,
                'search' => $search,
            ],
        ]);
    }

    public function markAsRead(string $notification): RedirectResponse
    {
        Auth::user()->notifications()->where('id', $notification)->first()?->markAsRead();

        return back();
    }

    public function markAsUnread(string $notification): RedirectResponse
    {
        Auth::user()->notifications()->where('id', $notification)->update(['read_at' => null]);

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        Auth::user()->unreadNotifications->markAsRead();

        return back();
    }

    public function destroy(string $notification): RedirectResponse
    {
        Auth::user()->notifications()->where('id', $notification)->delete();

        return back()->with('success', __('notifications.deleted'));
    }

    public function destroyAll(): RedirectResponse
    {
        Auth::user()->notifications()->delete();

        return back()->with('success', __('notifications.all_deleted'));
    }
}
