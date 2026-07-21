<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
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

    public function index(): Response
    {
        $user = Auth::user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate(20)
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at?->toDateTimeString(),
                ...$notification->data,
            ]);

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }

    public function markAsRead(string $notification): RedirectResponse
    {
        Auth::user()->notifications()->where('id', $notification)->first()?->markAsRead();

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        Auth::user()->unreadNotifications->markAsRead();

        return back();
    }
}
