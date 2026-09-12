<?php

namespace Tests\Unit\Modules\Rental;

use Modules\Rental\AI\Services\GeminiDocumentKycService;
use Tests\TestCase;

class GeminiDocumentKycServiceTest extends TestCase
{
    /**
     * A basic unit test example.
     */
    public function test_it_resolves_legacy_model_to_gemini_3_6_flash(): void
    {
        $service = new GeminiDocumentKycService(
            apiKey: 'test-key',
            model: 'gemini-1.5-flash'
        );

        $this->assertSame('gemini-3.6-flash', $service->getModel());
    }

    public function test_it_strips_models_prefix(): void
    {
        $service = new GeminiDocumentKycService(
            apiKey: 'test-key',
            model: 'models/gemini-3.6-flash'
        );

        $this->assertSame('gemini-3.6-flash', $service->getModel());
    }

    public function test_it_defaults_to_gemini_3_6_flash_when_empty(): void
    {
        $service = new GeminiDocumentKycService(
            apiKey: 'test-key',
            model: ''
        );

        $this->assertSame('gemini-3.6-flash', $service->getModel());
    }
}
