<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerAddress;

/** @extends Factory<PartnerAddress> */
class PartnerAddressFactory extends Factory
{
    protected $model = PartnerAddress::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'partner_id' => Partner::factory(),
            'type' => 'shipping',
            'label' => fake()->optional()->randomElement(['Kantor Pusat', 'Gudang', 'Cabang']),
            'street' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->randomElement([
                'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
                'Banten', 'Sumatera Utara', 'Sulawesi Selatan', 'Bali',
            ]),
            'zip' => fake()->postcode(),
            'country' => 'Indonesia',
            'is_default' => true,
        ];
    }

    public function billing(): static
    {
        return $this->state(fn (): array => ['type' => 'billing']);
    }

    public function warehouse(): static
    {
        return $this->state(fn (): array => [
            'type' => 'warehouse',
            'label' => 'Gudang',
        ]);
    }
}
