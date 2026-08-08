<?php

namespace Modules\Pages\Support;

class TenantPageTemplateRegistry
{
    /**
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: array<string, mixed>}
     */
    public static function resolve(?string $vertical = null): array
    {
        $key = strtolower(trim((string) $vertical));

        return match ($key) {
            'rental', 'car_rental' => RentalLandingPageTemplate::build(),
            default => RentalLandingPageTemplate::build(),
        };
    }
}
