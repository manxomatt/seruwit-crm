<?php

namespace App\Support\Onboarding;

use App\Modules\VerticalPacks;

/**
 * Maps onboarding vertical choices to installable packs / content modules.
 */
class SelfServeProvisioningPlan
{
    public const VERTICAL_RENTAL = 'rental';

    public const VERTICAL_TRAVEL = 'travel';

    /**
     * Every vertical shown on the onboarding form, selectable or not.
     *
     * @return list<string>
     */
    public static function verticals(): array
    {
        return [self::VERTICAL_RENTAL, self::VERTICAL_TRAVEL];
    }

    /**
     * Verticals a self-serve signup may actually pick today. Travel stays
     * visible on the form but cannot be chosen yet.
     *
     * @return list<string>
     */
    public static function selectableVerticals(): array
    {
        return [self::VERTICAL_RENTAL];
    }

    public static function isSelectableVertical(string $vertical): bool
    {
        return in_array($vertical, self::selectableVerticals(), true);
    }

    /**
     * Content modules always installed for self-serve workspaces.
     *
     * @return list<string>
     */
    public static function defaultContentModules(): array
    {
        return ['pages', 'posts', 'carousels'];
    }

    /**
     * @param  list<string>  $verticals
     * @return list<string> VerticalPack keys
     */
    public static function packKeysForVerticals(array $verticals): array
    {
        $packs = [];

        if (in_array(self::VERTICAL_RENTAL, $verticals, true)) {
            $packs[] = VerticalPacks::RENTAL_MOBIL;
        }

        if (in_array(self::VERTICAL_TRAVEL, $verticals, true)) {
            $packs[] = VerticalPacks::TRAVEL_SHUTTLE;
        }

        return $packs;
    }

    /**
     * Preview module keys that will be installed (excluding core partners/accounting).
     *
     * @param  list<string>  $verticals
     * @return list<string>
     */
    public static function previewModules(array $verticals): array
    {
        $modules = self::defaultContentModules();

        foreach (self::packKeysForVerticals($verticals) as $packKey) {
            $pack = VerticalPacks::find($packKey);
            if ($pack === null) {
                continue;
            }
            $modules = array_merge($modules, $pack['modules']);
        }

        $modules = array_values(array_unique($modules));
        sort($modules);

        return $modules;
    }
}
