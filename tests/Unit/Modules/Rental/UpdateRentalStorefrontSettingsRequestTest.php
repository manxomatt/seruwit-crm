<?php

namespace Tests\Unit\Modules\Rental;

use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory as ValidationFactory;
use Modules\Rental\Http\Requests\UpdateRentalStorefrontSettingsRequest;
use PHPUnit\Framework\TestCase;

class UpdateRentalStorefrontSettingsRequestTest extends TestCase
{
    private ValidationFactory $validator;

    protected function setUp(): void
    {
        parent::setUp();

        $loader = new ArrayLoader;
        $loader->addMessages('en', 'validation', [
            'url' => 'The :attribute field must be a valid URL.',
        ]);
        $translator = new Translator($loader, 'en');
        $this->validator = new ValidationFactory($translator);
    }

    public function test_accepts_absolute_url_for_logo_and_hero(): void
    {
        $request = new UpdateRentalStorefrontSettingsRequest;
        $rules = $request->rules();

        $validator = $this->validator->make([
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'logo_url' => 'https://example.com/logo.png',
            'hero_image_url' => 'https://example.com/hero.jpg',
        ], $rules);

        $this->assertTrue($validator->passes());
    }

    public function test_accepts_relative_storage_or_tenancy_path(): void
    {
        $request = new UpdateRentalStorefrontSettingsRequest;
        $rules = $request->rules();

        $validator = $this->validator->make([
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'logo_url' => '/tenancy/assets/media/logo.png',
            'hero_image_url' => '/storage/media/hero.jpg',
        ], $rules);

        $this->assertTrue($validator->passes());
    }

    public function test_accepts_null_or_empty_logo(): void
    {
        $request = new UpdateRentalStorefrontSettingsRequest;
        $rules = $request->rules();

        $validator = $this->validator->make([
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'logo_url' => '',
            'hero_image_url' => null,
        ], $rules);

        $this->assertTrue($validator->passes());
    }

    public function test_rejects_invalid_non_url_string(): void
    {
        $request = new UpdateRentalStorefrontSettingsRequest;
        $rules = $request->rules();

        $validator = $this->validator->make([
            'primary_color' => '#123456',
            'secondary_color' => '#654321',
            'logo_url' => 'not-a-url',
        ], $rules);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('logo_url', $validator->errors()->toArray());
    }
}
