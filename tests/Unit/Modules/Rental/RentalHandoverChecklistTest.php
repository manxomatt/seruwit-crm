<?php

namespace Tests\Unit\Modules\Rental;

use Modules\Rental\Support\RentalHandoverChecklist;
use Tests\TestCase;

class RentalHandoverChecklistTest extends TestCase
{
    /**
     * The FuelLevelPicker (ShowUi.tsx) offers a coarse 5-point scale. Its option
     * keys MUST be a subset of the backend-accepted fuel levels, otherwise checkout
     * and return fail validation ("The selected start fuel level is invalid.").
     *
     * @test
     */
    public function fuel_level_picker_tokens_are_all_accepted_by_the_backend(): void
    {
        $pickerTokens = ['empty', '1/4', '1/2', '3/4', 'full'];

        $accepted = RentalHandoverChecklist::fuelLevels();

        foreach ($pickerTokens as $token) {
            $this->assertContains(
                $token,
                $accepted,
                "FuelLevelPicker emits '{$token}', which is not in RentalHandoverChecklist::fuelLevels().",
            );
        }
    }
}
