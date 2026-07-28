<?php

namespace Modules\Rental\Support;

class RentalHandoverChecklist
{
    /**
     * Fixed condition checklist used at checkout and return.
     *
     * @return array<string, string> key => translation key suffix under rental.checklist.items
     */
    public static function itemKeys(): array
    {
        return [
            'exterior_body',
            'tires_wheels',
            'lights',
            'interior',
            'documents',
            'spare_tools',
            'ac',
            'keys',
        ];
    }

    /**
     * @return list<string>
     */
    public static function fuelLevels(): array
    {
        return ['empty', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'full'];
    }

    /**
     * Normalize a checklist payload into key => bool for all known items.
     *
     * @param  array<string, mixed>|null  $input
     * @return array<string, bool>
     */
    public static function normalize(?array $input): array
    {
        $normalized = [];

        foreach (self::itemKeys() as $key) {
            $normalized[$key] = (bool) ($input[$key] ?? false);
        }

        return $normalized;
    }
}
