<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Assign missing global_id values so onboarding and tenant pivots can key off them.
     */
    public function up(): void
    {
        User::query()
            ->whereNull('global_id')
            ->eachById(function (User $user): void {
                $user->forceFill([
                    'global_id' => (string) Str::uuid(),
                ])->saveQuietly();
            });
    }

    public function down(): void
    {
        // Intentionally empty — assigned identifiers must remain stable.
    }
};
