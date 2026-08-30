<?php

namespace Modules\Rental\AI\Contracts;

interface RentalRateAiGeneratorServiceInterface
{
    /**
     * Parse unstructured prompt text and generate structured rental tariff data with tiered discounts.
     *
     * @param  array<int, array{id: int|string, name: string, plate_number?: string, type?: string}>  $availableVehicles
     * @param  array<int, array{value: string, label: string}>  $availableRentalClasses
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableVehicles = [], array $availableRentalClasses = []): array;
}
