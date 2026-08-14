<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentOrder;
use App\Services\PaymentOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentOrderController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    protected function getPagePrefix(): string
    {
        return 'Admin';
    }

    public function __construct(private readonly PaymentOrderService $service) {}

    public function index(Request $request): Response
    {
        $query = PaymentOrder::query()
            ->with(['tenant', 'plan', 'confirmedBy', 'rejectedBy'])
            ->latest();

        if ($search = $request->input('search')) {
            $query->whereHas('tenant', function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $paymentOrders = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/PaymentOrders/Index', [
            'paymentOrders' => $paymentOrders,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(PaymentOrder $paymentOrder): Response
    {
        $paymentOrder->load(['tenant', 'plan', 'subscription', 'confirmedBy', 'rejectedBy']);

        return Inertia::render('Admin/PaymentOrders/Show', [
            'paymentOrder' => $paymentOrder,
        ]);
    }

    public function confirm(Request $request, PaymentOrder $paymentOrder): RedirectResponse
    {
        $user = $request->user();

        $this->service->confirm($paymentOrder, $user);

        return back()->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function reject(Request $request, PaymentOrder $paymentOrder): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $user = $request->user();

        $this->service->reject($paymentOrder, $user, $request->input('rejection_reason'));

        return back()->with('success', 'Pembayaran berhasil ditolak.');
    }
}
