<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\PaymentOrder;
use App\Models\Subscription;
use App\Services\PaygRenewalService;
use App\Services\ReportingService;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
        private PaygRenewalService $renewalService,
        private ReportingService $reportingService,
    ) {}

    /**
     * Handle Midtrans payment webhook
     * Midtrans sends a POST request to this endpoint after payment status changes
     */
    public function handlePaymentWebhook(Request $request)
    {
        Log::info('Midtrans webhook received', $request->all());

        // Verify webhook signature (security check)
        if (! $this->verifyWebhookSignature($request)) {
            Log::warning('Invalid webhook signature', ['ip' => $request->ip()]);

            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $data = $request->all();

        // Handle based on transaction status
        $status = $data['transaction_status'] ?? null;
        $orderId = $data['order_id'] ?? null;

        if (! $orderId) {
            Log::warning('Missing order_id in webhook');

            return response()->json(['error' => 'Missing order_id'], 400);
        }

        // Find payment order
        $paymentOrder = PaymentOrder::where('unique_code', $orderId)->first();

        if (! $paymentOrder) {
            Log::warning('Payment order not found', ['order_id' => $orderId]);

            return response()->json(['error' => 'Payment order not found'], 404);
        }

        try {
            match ($status) {
                'settlement' => $this->handlePaymentSuccess($paymentOrder, $data),
                'pending' => $this->handlePaymentPending($paymentOrder, $data),
                'deny', 'cancel', 'expire' => $this->handlePaymentFailure($paymentOrder, $status, $data),
                default => Log::warning('Unknown transaction status', ['status' => $status]),
            };

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error processing webhook', [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Processing error'], 500);
        }
    }

    /**
     * Handle successful payment
     */
    private function handlePaymentSuccess(PaymentOrder $paymentOrder, array $data): void
    {
        DB::connection(config('tenancy.database.central_connection'))->transaction(function () use ($paymentOrder, $data) {
            // Update payment order status
            $paymentOrder->update([
                'status' => PaymentOrder::STATUS_CONFIRMED,
                'paid_at' => now(),
                'payment_proof_url' => $data['va_numbers'][0]['bank'] ?? null,
            ]);

            $tenant = $paymentOrder->tenant;
            $subscription = $paymentOrder->subscription;
            $plan = $paymentOrder->plan;

            // Determine action based on payment type
            if ($paymentOrder->type === 'activation') {
                // Initial subscription activation
                $this->subscriptionService->activatePaygSubscription(
                    $tenant,
                    $plan,
                    $paymentOrder->subscribed_vehicles,
                    $paymentOrder->billing_interval
                );

                Log::info('Subscription activated', ['tenant_id' => $tenant->id]);
            } elseif ($paymentOrder->type === 'renewal' && $subscription) {
                // Renewal payment received
                $this->renewalService->processRenewalPayment($paymentOrder);

                // Generate billing report
                $this->reportingService->generateBillingReport($subscription, $paymentOrder);

                Log::info('Subscription renewed', ['tenant_id' => $tenant->id]);
            } elseif ($paymentOrder->type === 'upgrade' && $subscription) {
                // Upgrade payment received
                $this->handleUpgradeCompletion($subscription, $paymentOrder);

                Log::info('Subscription upgraded', ['tenant_id' => $tenant->id]);
            }
        });
    }

    /**
     * Handle pending payment
     */
    private function handlePaymentPending(PaymentOrder $paymentOrder, array $data): void
    {
        $paymentOrder->update([
            'status' => PaymentOrder::STATUS_PENDING,
            'payment_reference' => $data['va_numbers'][0]['va_number'] ?? $data['reference_id'] ?? null,
        ]);

        Log::info('Payment pending', ['order_id' => $paymentOrder->unique_code]);
    }

    /**
     * Handle failed payment (denied, cancelled, expired)
     */
    private function handlePaymentFailure(PaymentOrder $paymentOrder, string $status, array $data): void
    {
        $paymentOrder->update([
            'status' => PaymentOrder::STATUS_REJECTED,
            'rejection_reason' => $status,
        ]);

        // If this was a renewal, mark it as failed
        if ($paymentOrder->type === 'renewal' && $paymentOrder->subscription) {
            $this->renewalService->markRenewalFailed(
                $paymentOrder,
                "Payment {$status}: ".($data['status_message'] ?? 'Payment failed')
            );
        }

        Log::warning('Payment failed', [
            'order_id' => $paymentOrder->unique_code,
            'status' => $status,
        ]);
    }

    /**
     * Handle upgrade completion
     */
    private function handleUpgradeCompletion(Subscription $subscription, PaymentOrder $paymentOrder): void
    {
        $newVehicleCount = $paymentOrder->subscribed_vehicles;

        // Update subscription with new vehicle quota
        $subscription->update([
            'subscribed_vehicles' => $newVehicleCount,
        ]);

        // Generate billing report for upgrade
        $this->reportingService->generateBillingReport($subscription, $paymentOrder);
    }

    /**
     * Verify Midtrans webhook signature
     * This ensures the webhook is really from Midtrans
     */
    private function verifyWebhookSignature(Request $request): bool
    {
        $orderId = $request->input('order_id');
        $statusCode = $request->input('status_code');
        $grossAmount = $request->input('gross_amount');
        $signature = $request->input('signature_key');

        // Get Midtrans server key from config
        $serverKey = config('services.midtrans.server_key', '');

        // Calculate expected signature
        $expectedSignature = hash(
            'sha512',
            $orderId.$statusCode.$grossAmount.$serverKey
        );

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Manual payment confirmation (for testing or manual override)
     * Admin endpoint to confirm payment without webhook
     */
    public function confirmPaymentManual(Request $request, PaymentOrder $paymentOrder)
    {
        // Verify admin authorization
        if (! auth()->user() || ! auth()->user()->can('manage-tenants')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Simulate successful payment webhook
        $this->handlePaymentSuccess($paymentOrder, [
            'transaction_status' => 'settlement',
            'order_id' => $paymentOrder->unique_code,
            'va_numbers' => [['bank' => 'BNI']],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed manually',
            'payment_order' => $paymentOrder->fresh(),
        ]);
    }
}
