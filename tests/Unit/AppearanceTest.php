<?php

namespace Tests\Unit;

use App\Support\Appearance;
use PHPUnit\Framework\TestCase;

class AppearanceTest extends TestCase
{
    public function test_sanitize_color_accepts_hex_and_expands_shorthand(): void
    {
        $this->assertSame('#0F766E', Appearance::sanitizeColor('#0f766e'));
        $this->assertSame('#112233', Appearance::sanitizeColor('#123'));
        $this->assertSame(Appearance::DEFAULT_PRIMARY, Appearance::sanitizeColor('not-a-color'));
        $this->assertSame(Appearance::DEFAULT_PRIMARY, Appearance::sanitizeColor('red'));
    }

    public function test_sanitize_font_strips_unsafe_characters(): void
    {
        $this->assertSame('Inter, sans-serif', Appearance::sanitizeFont('Inter, sans-serif'));
        $this->assertSame(Appearance::DEFAULT_FONT, Appearance::sanitizeFont('   '));
    }

    public function test_default_setting_values_cover_appearance_keys(): void
    {
        $defaults = Appearance::defaultSettingValues();

        $this->assertSame('#3B82F6', $defaults['appearance.primary_color']);
        $this->assertSame('#10B981', $defaults['appearance.secondary_color']);
        $this->assertSame('0', $defaults['appearance.dark_mode']);
        $this->assertSame('Inter, sans-serif', $defaults['appearance.font_family']);
        $this->assertSame('', $defaults['appearance.custom_css']);
        $this->assertSame('', $defaults['appearance.custom_js']);
    }

    public function test_truthy_parses_common_boolean_strings(): void
    {
        $this->assertTrue(Appearance::truthy('1'));
        $this->assertTrue(Appearance::truthy('true'));
        $this->assertTrue(Appearance::truthy(true));
        $this->assertFalse(Appearance::truthy('0'));
        $this->assertFalse(Appearance::truthy('false'));
        $this->assertFalse(Appearance::truthy(null));
    }

    public function test_css_variables_include_primary_secondary_and_sidebar_tokens(): void
    {
        $vars = Appearance::cssVariables([
            'primary_color' => '#0F766E',
            'secondary_color' => '#F59E0B',
            'font_family' => 'Inter, sans-serif',
            'dark_mode' => false,
            'custom_css' => '',
            'custom_js' => '',
        ]);

        $this->assertSame('#0F766E', $vars['--color-primary']);
        $this->assertSame('#F59E0B', $vars['--color-secondary']);
        $this->assertSame('Inter, sans-serif', $vars['--font-sans']);
        $this->assertSame('15 118 110', $vars['--color-primary-rgb']);
        $this->assertArrayHasKey('--brand-sidebar-via', $vars);
        $this->assertArrayHasKey('--brand-sidebar-accent', $vars);
        $this->assertStringContainsString('--color-primary:', Appearance::cssVariablesBlock([
            'primary_color' => '#0F766E',
            'secondary_color' => '#F59E0B',
            'font_family' => 'Inter, sans-serif',
            'dark_mode' => false,
            'custom_css' => '',
            'custom_js' => '',
        ]));
    }
}
