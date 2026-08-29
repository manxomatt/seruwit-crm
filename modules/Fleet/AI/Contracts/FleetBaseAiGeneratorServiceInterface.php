<?php

namespace Modules\Fleet\AI\Contracts;

interface FleetBaseAiGeneratorServiceInterface
{
    /**
     * Parse and generate structured fleet base/pool attributes from unstructured text.
     *
     * @param  array<int, array{id: int, name: string, email: string}>  $availableManagers
     * @return array<string, mixed>
     */
    public function generateFromText(string $text, array $availableManagers = []): array;
}
