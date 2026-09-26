<?php

namespace Tests\Unit\Modules\Pages;

use Modules\Pages\Support\CentralLandingPageTemplate;
use PHPUnit\Framework\TestCase;

class CentralLandingPageTemplateTest extends TestCase
{
    public function test_build_returns_expected_structure(): void
    {
        $template = CentralLandingPageTemplate::build();

        $this->assertArrayHasKey('title', $template);
        $this->assertArrayHasKey('slug', $template);
        $this->assertArrayHasKey('html', $template);
        $this->assertArrayHasKey('css', $template);
        $this->assertNull($template['gjs_data']);

        $this->assertSame('home', $template['slug']);
        $this->assertStringContainsString('SaaS Rental Kendaraan', $template['title']);
    }

    public function test_template_contains_capsule_header(): void
    {
        $template = CentralLandingPageTemplate::build();
        $html = $template['html'];
        $css = $template['css'];

        // Capsule header classes
        $this->assertStringContainsString('srw-nav-wrapper', $html);
        $this->assertStringContainsString('srw-navbar', $html);
        $this->assertStringContainsString('srw-btn-capsule', $html);
        $this->assertStringContainsString('SaaS Rental', $html);

        // CSS capsule styles
        $this->assertStringContainsString('border-radius: 9999px', $css);
        $this->assertStringContainsString('backdrop-filter: blur', $css);
    }

    public function test_template_contains_three_core_pillars(): void
    {
        $template = CentralLandingPageTemplate::build();
        $html = $template['html'];

        // Pilar 1: Fleet Management
        $this->assertStringContainsString('Fleet Management', $html);
        $this->assertStringContainsString('Monitoring status ketersediaan armada live', $html);

        // Pilar 2: Rental Operations
        $this->assertStringContainsString('Rental Operations', $html);
        $this->assertStringContainsString('Kalender booking visual anti double-booking', $html);

        // Pilar 3: Finance Management
        $this->assertStringContainsString('Finance &amp; ROI', $html);
        $this->assertStringContainsString('split revenue mitra', $html);
    }

    public function test_template_contains_modular_ecosystem_and_cta(): void
    {
        $template = CentralLandingPageTemplate::build();
        $html = $template['html'];

        // Modular ecosystem
        $this->assertStringContainsString('srw-modular', $html);
        $this->assertStringContainsString('Platform yang Tumbuh Bersama Skala Bisnis Anda', $html);

        // Capsule CTA
        $this->assertStringContainsString('srw-cta-capsule', $html);
        $this->assertStringContainsString('Mulai Uji Coba Gratis 14 Hari', $html);

        // GrapesJS dynamic hooks
        $this->assertStringContainsString('{{pricing_table}}', $html);
        $this->assertStringContainsString('{{setting:site.logo}}', $html);
        $this->assertStringContainsString('{{setting:general.site_name}}', $html);
    }
}
