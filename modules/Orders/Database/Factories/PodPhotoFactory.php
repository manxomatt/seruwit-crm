<?php

namespace Modules\Orders\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Orders\Models\PodPhoto;
use Modules\Orders\Models\ProofOfDelivery;

/**
 * @extends Factory<PodPhoto>
 */
class PodPhotoFactory extends Factory
{
    /**
     * Factory::modelName() infers App\Models from the factory's own name, so a
     * module factory has to state its model outright.
     *
     * @var class-string<PodPhoto>
     */
    protected $model = PodPhoto::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'proof_of_delivery_id' => ProofOfDelivery::factory(),
            'path' => 'pod/photos/'.fake()->uuid().'.jpg',
        ];
    }
}
