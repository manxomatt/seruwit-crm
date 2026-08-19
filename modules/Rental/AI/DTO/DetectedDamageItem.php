<?php

namespace Modules\Rental\AI\DTO;

class DetectedDamageItem
{
    public function __construct(
        public string $panel,
        public string $damageType,
        public string $severity,
        public string $description,
        public float $confidenceScore,
        public ?int $photoIndex = null,
        public float $suggestedRepairCost = 0.0,
        public bool $isNewDamage = true,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            panel: (string) ($data['panel'] ?? 'unknown_panel'),
            damageType: (string) ($data['damage_type'] ?? 'scratch'),
            severity: (string) ($data['severity'] ?? 'minor'),
            description: (string) ($data['description'] ?? ''),
            confidenceScore: (float) ($data['confidence_score'] ?? 0.8),
            photoIndex: isset($data['photo_index']) ? (int) $data['photo_index'] : null,
            suggestedRepairCost: (float) ($data['suggested_repair_cost'] ?? 0),
            isNewDamage: (bool) ($data['is_new_damage'] ?? true),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'panel' => $this->panel,
            'damage_type' => $this->damageType,
            'severity' => $this->severity,
            'description' => $this->description,
            'confidence_score' => round($this->confidenceScore, 2),
            'photo_index' => $this->photoIndex,
            'suggested_repair_cost' => $this->suggestedRepairCost,
            'is_new_damage' => $this->isNewDamage,
        ];
    }
}
