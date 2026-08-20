<?php

namespace Modules\Pages\Support;

class TenantPageTemplateRegistry
{
    /**
     * @return array{title: string, slug: string, html: string, css: string, gjs_data: array<string, mixed>|null}
     */
    public static function resolve(?string $vertical = null): array
    {
        $key = strtolower(trim((string) $vertical));

        return match ($key) {
            'elevate', 'pro', 'modern', 'minimal' => SeruwitElevateLandingTemplate::build(),
            'seruwit', 'central', 'ecosystem' => CentralLandingPageTemplate::build(),
            'biz', 'business' => SeruwitBizLandingTemplate::build(),
            'rental', 'car_rental' => RentalLandingPageTemplate::build(),
            default => CentralLandingPageTemplate::build(),
        };
    }
}
