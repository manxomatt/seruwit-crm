<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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
                'url' => $this->resolveNotificationUrl($notification),
                'title' => $notification->data['title'] ?? $this->resolveFallbackTitle($notification),
                'body' => $notification->data['body'] ?? $this->resolveFallbackBody($notification),
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

    public function open(string $notification): SymfonyResponse|RedirectResponse
    {
        /** @var DatabaseNotification|null $item */
        $item = Auth::user()->notifications()->where('id', $notification)->firstOrFail();

        if (! $item->read_at) {
            $item->markAsRead();
        }

        $url = $this->resolveNotificationUrl($item);

        if (filled($url)) {
            $parsedHost = parse_url($url, PHP_URL_HOST);
            if ($parsedHost && $parsedHost !== request()->getHost()) {
                return Inertia::location($url);
            }

            return redirect()->to($url);
        }

        return redirect()->route('module.notifications.index');
    }

    public function resolveNotificationUrl(DatabaseNotification $notification): ?string
    {
        $data = $notification->data ?? [];
        $rawUrl = $data['url'] ?? $data['action_url'] ?? $data['link'] ?? null;

        if (filled($rawUrl)) {
            return $this->normalizeNotificationUrl((string) $rawUrl);
        }

        $type = $data['type'] ?? null;

        return match ($type) {
            'inventory_low_stock' => route('module.inventory.stock.index', absolute: false),
            'payment_order_created', 'payment_order_confirmed', 'payment_order_rejected' => isset($data['payment_order_id'])
                ? route('module.payment-orders.show', $data['payment_order_id'], absolute: false)
                : null,
            'reseller_payout_paid' => route('module.reseller.payouts', absolute: false),
            default => null,
        };
    }

    protected function normalizeNotificationUrl(string $url): string
    {
        $parts = parse_url($url);
        if ($parts === false) {
            return $url;
        }

        $path = $parts['path'] ?? '';
        $query = isset($parts['query']) ? '?'.$parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#'.$parts['fragment'] : '';

        $host = $parts['host'] ?? null;
        $currentHost = request()->getHost();

        if (! $host) {
            return $url;
        }

        if ($host === $currentHost) {
            return $path.$query.$fragment;
        }

        $knownInternalHosts = [
            'localhost',
            '127.0.0.1',
            'localhost.test',
            'seruwit.com',
            parse_url((string) config('app.url', ''), PHP_URL_HOST),
        ];

        if (in_array($host, array_filter($knownInternalHosts), true) && str_starts_with($path, '/module/')) {
            return $path.$query.$fragment;
        }

        return $url;
    }

    protected function resolveFallbackTitle(DatabaseNotification $notification): string
    {
        $data = $notification->data ?? [];
        $type = $data['type'] ?? '';

        return match ($type) {
            'payment_order_created' => 'Pesanan Pembayaran Baru',
            'payment_order_confirmed' => 'Pembayaran Dikonfirmasi',
            'payment_order_rejected' => 'Pembayaran Ditolak',
            'trial_expiring' => 'Masa Percobaan Segera Berakhir',
            'trial_expired' => 'Masa Percobaan Berakhir',
            'trial_suspended' => 'Layanan Ditangguhkan',
            'reseller_payout_paid' => 'Pembayaran Komisi Reseller',
            default => 'Notifikasi',
        };
    }

    protected function resolveFallbackBody(DatabaseNotification $notification): string
    {
        $data = $notification->data ?? [];
        $type = $data['type'] ?? '';

        return match ($type) {
            'payment_order_created' => 'Pesanan pembayaran untuk paket '.($data['plan_name'] ?? 'Langganan').' telah dibuat.',
            'payment_order_confirmed' => 'Pembayaran paket '.($data['plan_name'] ?? 'Langganan').' telah dikonfirmasi.',
            'payment_order_rejected' => 'Pembayaran paket '.($data['plan_name'] ?? 'Langganan').' ditolak.'.(isset($data['rejection_reason']) ? ' Alasan: '.$data['rejection_reason'] : ''),
            'trial_expiring' => 'Masa percobaan untuk '.($data['tenant_name'] ?? 'workspace').' tersisa '.($data['days_left'] ?? '').' hari.',
            'trial_expired' => 'Masa percobaan untuk '.($data['tenant_name'] ?? 'workspace').' telah berakhir.',
            'trial_suspended' => 'Layanan untuk '.($data['tenant_name'] ?? 'workspace').' telah ditangguhkan.',
            'reseller_payout_paid' => 'Pembayaran komisi reseller telah diproses.',
            default => '',
        };
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
