<?php

namespace Modules\Partners\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Partners\Models\PartnerTitle;

/** @extends Factory<PartnerTitle> */
class PartnerTitleFactory extends Factory
{
    protected $model = PartnerTitle::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $titles = [
            ['name' => 'Bapak', 'short_name' => 'Bp.'],
            ['name' => 'Ibu', 'short_name' => 'Ibu'],
            ['name' => 'Tuan', 'short_name' => 'Tn.'],
            ['name' => 'Nyonya', 'short_name' => 'Ny.'],
            ['name' => 'Doctor', 'short_name' => 'Dr.'],
            ['name' => 'Professor', 'short_name' => 'Prof.'],
        ];

        $title = fake()->randomElement($titles);

        return $title;
    }
}
