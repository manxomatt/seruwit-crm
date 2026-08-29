<?php

namespace Modules\Fleet\AI\Contracts;

interface VehicleAiGeneratorServiceInterface
{
    /**
     * Parse and generate structured vehicle attributes from unstructured text.
     *
     * @param  array<int, array{id: int, name: string, code: string}>  $availableBases
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableBases = []): array;
}
