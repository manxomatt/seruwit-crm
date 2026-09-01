<?php

namespace Modules\Fleet\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Fleet\Support\VehicleCheckoutService;
use Throwable;

class VehicleCheckoutController extends Controller
{
    /**
     * Calculate checkout pricing breakdown for selected vehicles and duration.
     */
    public function calculate(Request $request, VehicleCheckoutService $checkoutService): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_ids' => ['required', 'array', 'min:1'],
            'vehicle_ids.*' => ['integer', 'distinct', 'exists:vehicles,id'],
            'duration_months' => ['required', 'integer', 'in:1,3,6,12'],
        ]);

        try {
            $pricing = $checkoutService->calculatePrice(
                $validated['vehicle_ids'],
                (int) $validated['duration_months']
            );

            return response()->json([
                'success' => true,
                'data' => $pricing,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Create PaymentOrder and redirect to payment instruction page.
     */
    public function checkout(Request $request, VehicleCheckoutService $checkoutService): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'vehicle_ids' => ['required', 'array', 'min:1'],
            'vehicle_ids.*' => ['integer', 'distinct', 'exists:vehicles,id'],
            'duration_months' => ['required', 'integer', 'in:1,3,6,12'],
            'payment_method' => ['nullable', 'string', 'in:manual_transfer,qris,virtual_account'],
        ]);

        $tenant = tenant();
        if (! $tenant instanceof Tenant) {
            abort(404, 'Tenant context not found.');
        }

        try {
            $order = $checkoutService->createCheckoutOrder(
                $tenant,
                $validated['vehicle_ids'],
                (int) $validated['duration_months'],
                $validated['payment_method'] ?? 'manual_transfer'
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order_id' => $order->id,
                    'redirect_url' => route('module.subscription.payment', $order->id),
                ]);
            }

            return redirect()->route('module.subscription.payment', $order->id);
        } catch (Throwable $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->with('error', $e->getMessage());
        }
    }
}
