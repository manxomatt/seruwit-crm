<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBankAccount;

/** @extends Factory<PartnerBankAccount> */
class PartnerBankAccountFactory extends Factory
{
    protected $model = PartnerBankAccount::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'bank_name' => fake()->randomElement([
                'BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga',
                'Danamon', 'Permata', 'BTN', 'BSI',
            ]),
            'account_number' => fake()->unique()->numerify('##########'),
            'account_holder_name' => fake()->name(),
            'is_active' => true,
            'can_send_money' => false,
        ];
    }
}
