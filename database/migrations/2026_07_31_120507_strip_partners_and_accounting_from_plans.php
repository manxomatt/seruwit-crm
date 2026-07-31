<?php

use App\Models\Plan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Partners and Accounting are core features — strip them from plan entitlement lists.
     */
    public function up(): void
    {
        $coreKeys = ['partners', 'accounting'];

        Plan::query()->each(function (Plan $plan) use ($coreKeys): void {
            $modules = array_values(array_filter(
                $plan->modules ?? [],
                fn (string $key): bool => ! in_array($key, $coreKeys, true),
            ));

            if ($modules !== ($plan->modules ?? [])) {
                $plan->forceFill(['modules' => $modules])->save();
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty — core modules should not return to plan catalogs.
    }
};
