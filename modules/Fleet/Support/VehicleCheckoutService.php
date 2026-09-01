<?php

namespace Modules\Fleet\Support;

use App\Models\PaymentOrder;
use App\Models\Plan;
use App\Models\SubscriptionTier;
use App\Models\Tenant;
use App\Notifications\PaymentOrderCreatedNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Modules\Fleet\Models\Vehicle;
use RuntimeException;

class VehicleCheckoutService
{
    private function centralConnection(): string
    {
        return Config::get('tenancy.database.central_connection');
    }

    /**
     * Calculate price and discount for vehicle capacity direct checkout.
     *
     * @param  array<int>  $vehicleIds
     * @return array{
     *     vehicle_count: int,
     *     duration_months: int,
     *     price_per_vehicle_per_month: float,
     *     subtotal: float,
     *     discount_percent: int,
     *     discount_amount: float,
     *     total_amount: float,
     *     tier_name: string
     * }
     */
    public function calculatePrice(array $vehicleIds, int $durationMonths = 1): array
    {
        $count = count($vehicleIds);
        if ($count < 1) {
            throw new RuntimeException('Minimal 1 kendaraan harus dipilih untuk perpanjangan.');
        }

        $tier = SubscriptionTier::tierFor(max(1, $count));
        $pricePerUnit = $tier ? (float) $tier->price_per_vehicle : 25000.00;

        $subtotal = $count * $pricePerUnit * $durationMonths;

        $discountPercent = match ($durationMonths) {
            3 => 5,
            6 => 10,
            12 => 20,
            default => 0,
        };

        $discountAmount = round(($subtotal * $discountPercent) / 100, 2);
        $totalAmount = max(0, $subtotal - $discountAmount);

        return [
            'vehicle_count' => $count,
            'duration_months' => $durationMonths,
            'price_per_vehicle_per_month' => $pricePerUnit,
            'subtotal' => $subtotal,
            'discount_percent' => $discountPercent,
            'discount_amount' => $discountAmount,
            'total_amount' => $totalAmount,
            'tier_name' => $tier?->name ?? 'Standard Fleet Tier',
        ];
    }

    /**
     * Create a direct PaymentOrder for single or batch vehicle checkout.
     *
     * @param  array<int>  $vehicleIds
     */
    public function createCheckoutOrder(Tenant $tenant, array $vehicleIds, int $durationMonths = 1, string $paymentMethod = 'manual_transfer'): PaymentOrder
    {
        $uniqueVehicleIds = array_values(array_unique(array_map('intval', $vehicleIds)));
        $vehicles = Vehicle::query()->whereIn('id', $uniqueVehicleIds)->get();

        if ($vehicles->count() !== count($uniqueVehicleIds)) {
            throw new RuntimeException('Sebagian armada yang dipilih tidak ditemukan dalam sistem.');
        }

        $pricing = $this->calculatePrice($uniqueVehicleIds, $durationMonths);
        $central = $this->centralConnection();
        $tenantId = (string) $tenant->getKey();
        $instructions = Config::get('payment.manual_transfer', []);

        return DB::connection($central)->transaction(function () use (
            $central,
            $tenant,
            $tenantId,
            $uniqueVehicleIds,
            $vehicles,
            $durationMonths,
            $paymentMethod,
            $pricing,
            $instructions
        ): PaymentOrder {
            $uniqueCode = PaymentOrder::generateUniqueCode();
            $totalWithCode = $pricing['total_amount'] + $uniqueCode;

            $vehiclesSnapshot = $vehicles->map(fn (Vehicle $v): array => [
                'id' => $v->id,
                'name' => $v->name,
                'plate_number' => $v->plate_number,
                'status' => $v->status,
                'is_trial' => (bool) $v->is_trial,
                'active_until' => $v->active_until?->toIso8601String(),
            ])->toArray();

            $planId = $tenant->subscription?->plan_id
                ?? Plan::on($central)->where('key', $tenant->plan)->value('id')
                ?? Plan::on($central)->where('key', 'pay_as_you_go')->value('id')
                ?? Plan::on($central)->value('id');

            $order = new PaymentOrder;
            $order->setConnection($central);
            $order->tenant_id = $tenantId;
            $order->plan_id = $planId;
            $order->subscribed_vehicles = $pricing['vehicle_count'];
            $order->price_per_vehicle = $pricing['price_per_vehicle_per_month'];
            $order->total_vehicle_cost = $pricing['total_amount'];
            $order->type = PaymentOrder::TYPE_VEHICLE_CHECKOUT;
            $order->billing_interval = $durationMonths === 12 ? 'annual' : 'month';
            $order->payment_method = $paymentMethod;
            $order->status = PaymentOrder::STATUS_PENDING;
            $order->amount = $pricing['total_amount'];
            $order->unique_code = $uniqueCode;
            $order->total_amount = $totalWithCode;
            $order->currency = 'IDR';
            $order->bank_name = $instructions['bank_name'] ?? 'BCA';
            $order->bank_account_number = $instructions['bank_account_number'] ?? null;
            $order->bank_account_name = $instructions['bank_account_name'] ?? null;
            $order->expires_at = Carbon::now()->addHours(48);
            $order->gateway_data = [
                'vehicle_ids' => $uniqueVehicleIds,
                'duration_months' => $durationMonths,
                'discount_percent' => $pricing['discount_percent'],
                'discount_amount' => $pricing['discount_amount'],
                'vehicles' => $vehiclesSnapshot,
            ];
            $order->save();

            $tenant->load('users');
            foreach ($tenant->users as $owner) {
                $owner->notify(new PaymentOrderCreatedNotification($order));
            }

            return $order->fresh();
        });
    }

    /**
     * Process vehicle activation/renewal upon payment order confirmation.
     */
    public function confirmCheckoutOrder(PaymentOrder $order, ?string $confirmedBy = null): void
    {
        $gatewayData = $order->gateway_data ?? [];
        $vehicleIds = $gatewayData['vehicle_ids'] ?? [];
        $durationMonths = (int) ($gatewayData['duration_months'] ?? 1);

        if (empty($vehicleIds)) {
            return;
        }

        $central = $this->centralConnection();
        $tenant = Tenant::on($central)->whereKey($order->tenant_id)->first();

        if (! $tenant) {
            throw new RuntimeException("Tenant [{$order->tenant_id}] tidak ditemukan.");
        }

        $tenant->run(function () use ($vehicleIds, $durationMonths): void {
            $vehicles = Vehicle::query()->whereIn('id', $vehicleIds)->get();
            $now = Carbon::now();

            foreach ($vehicles as $vehicle) {
                $baseDate = ($vehicle->active_until && $vehicle->active_until->isFuture())
                    ? $vehicle->active_until->copy()
                    : $now->copy();

                $newActiveUntil = $baseDate->addMonths($durationMonths);

                $vehicle->update([
                    'status' => Vehicle::STATUS_ACTIVE,
                    'is_trial' => false,
                    'activated_at' => $now,
                    'active_until' => $newActiveUntil,
                ]);
            }
        });
    }
}
