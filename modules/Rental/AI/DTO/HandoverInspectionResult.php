<?php

namespace Modules\Rental\AI\DTO;

class HandoverInspectionResult
{
    /**
     * @param  list<DetectedDamageItem>  $damages
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public ?int $extractedOdometer,
        public ?string $extractedFuelLevel,
        public string $conditionSummary,
        public string $overallStatus,
        public array $damages = [],
        public array $rawResponse = [],
        public string $modelUsed = 'gemini-1.5-flash',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'extracted_odometer' => $this->extractedOdometer,
            'extracted_fuel_level' => $this->extractedFuelLevel,
            'condition_summary' => $this->conditionSummary,
            'overall_status' => $this->overallStatus,
            'damages' => array_map(fn (DetectedDamageItem $item) => $item->toArray(), $this->damages),
            'model_used' => $this->modelUsed,
        ];
    }
}
