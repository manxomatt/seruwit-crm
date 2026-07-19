<?php

namespace App\Modules;

/**
 * The architectural layer a module sits in. This is what makes the
 * "shared across every business line vs. specific to one" split — until now only
 * implied by requires() and a hard-coded sidebar list — a first-class fact each
 * module declares about itself.
 *
 * The layering is a contract, not a hint: a Foundation module must never
 * requires() a Vertical one. Dependencies only ever flow upward — Content and
 * Foundation are consumed by Verticals, never the other way round — which is the
 * same "a module never knows its consumer" rule stated at the level of layers.
 */
enum ModuleTier: string
{
    /**
     * Public-website features (page builder, blog, carousels). Orthogonal to the
     * line of business a tenant runs.
     */
    case Content = 'content';

    /**
     * Cross-business-line resources — vehicles, drivers, customers, products,
     * their documents and maintenance. Any business line that puts vehicles to
     * work reuses these rather than owning its own copy.
     */
    case Foundation = 'foundation';

    /**
     * Operations specific to one line of business, built on top of the shared
     * Foundation. Logistics dispatch/orders/billing today; travel, field sales
     * and canvassing later.
     */
    case Vertical = 'vertical';

    /**
     * Human-readable name for the catalog and sidebar grouping.
     */
    public function label(): string
    {
        return match ($this) {
            self::Content => 'Konten',
            self::Foundation => 'Fondasi',
            self::Vertical => 'Operasi',
        };
    }

    /**
     * Display order of the tier relative to the others, lowest first.
     */
    public function order(): int
    {
        return match ($this) {
            self::Content => 1,
            self::Foundation => 2,
            self::Vertical => 3,
        };
    }
}
