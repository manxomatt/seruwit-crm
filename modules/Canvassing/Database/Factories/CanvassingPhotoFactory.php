<?php

namespace Modules\Canvassing\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Canvassing\Models\CanvassingPhoto;
use Modules\Canvassing\Models\CanvassingVisit;

/**
 * @extends Factory<CanvassingPhoto>
 */
class CanvassingPhotoFactory extends Factory
{
    protected $model = CanvassingPhoto::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'canvassing_visit_id' => CanvassingVisit::factory(),
            'path' => 'canvassing/photos/'.fake()->uuid().'.jpg',
        ];
    }
}
