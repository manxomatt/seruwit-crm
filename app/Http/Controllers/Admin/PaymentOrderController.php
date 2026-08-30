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
            ->with(['tenant', 'onboardingSession', 'plan', 'confirmedBy', 'rejectedBy'])
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search): void {
                $q->whereHas('tenant', function ($t) use ($search): void {
                    $t->where('name', 'like', "%{$search}%");
                })->orWhereHas('onboardingSession', function ($s) use ($search): void {
                    $s->where('company_name', 'like', "%{$search}%");
                });
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
        $paymentOrder->load(['tenant', 'onboardingSession', 'plan', 'subscription', 'confirmedBy', 'rejectedBy']);

        return Inertia::render('Admin/PaymentOrders/Show', [
            'paymentOrder' => $paymentOrder,
        ]);
    }

    public function proof(PaymentOrder $paymentOrder): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\Response
    {
        $path = $paymentOrder->transfer_proof_path;
        abort_unless($path, 404, 'Bukti transfer belum diunggah.');

        $cleanPath = ltrim($path, '/');

        if (\Illuminate\Support\Facades\Storage::disk('payment_proofs')->exists($cleanPath)) {
            return response()->file(\Illuminate\Support\Facades\Storage::disk('payment_proofs')->path($cleanPath));
        }

        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($cleanPath)) {
            return response()->file(\Illuminate\Support\Facades\Storage::disk('public')->path($cleanPath));
        }

        if (\Illuminate\Support\Facades\Storage::disk('local')->exists($cleanPath)) {
            return response()->file(\Illuminate\Support\Facades\Storage::disk('local')->path($cleanPath));
        }

        $candidatePaths = [
            storage_path('app/public/payment-proofs/'.$cleanPath),
            storage_path('app/public/'.$cleanPath),
            storage_path('app/payment-proofs/'.$cleanPath),
            storage_path('app/'.$cleanPath),
            public_path('storage/payment-proofs/'.$cleanPath),
            public_path('storage/'.$cleanPath),
        ];

        foreach ($candidatePaths as $candidate) {
            if (file_exists($candidate) && is_file($candidate)) {
                return response()->file($candidate);
            }
        }

        abort(404, 'File bukti transfer tidak ditemukan di storage server.');
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
