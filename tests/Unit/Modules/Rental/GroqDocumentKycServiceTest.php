<?php

namespace Tests\Unit\Modules\Rental;

use Illuminate\Support\Facades\Http;
use Modules\Rental\AI\Services\GroqDocumentKycService;
use Modules\Rental\Models\Rental;
use Tests\TestCase;

class GroqDocumentKycServiceTest extends TestCase
{
    public function test_scan_single_document_returns_extracted_metadata_from_groq(): void
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'doc_type' => 'ktp',
                                'confidence' => 0.98,
                                'data' => [
                                    'nik' => '1871012345670002',
                                    'name' => 'AHMAD RIFAI',
                                    'birth_date' => '1992-08-17',
                                    'address' => 'Jl. Raden Intan No. 88, Bandar Lampung',
                                ],
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $service = new GroqDocumentKycService(apiKey: 'gsk_test_mock_key');
        $dummyImage = 'data:image/jpeg;base64,'.base64_encode('fake-ktp-image-content');

        $result = $service->scanSingleDocument($dummyImage);

        $this->assertSame('ktp', $result['doc_type']);
        $this->assertSame(0.98, $result['confidence']);
        $this->assertSame('1871012345670002', $result['data']['nik']);
        $this->assertSame('AHMAD RIFAI', $result['data']['name']);
    }

    public function test_scan_single_document_throws_when_api_key_is_empty(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Groq API key belum dikonfigurasi');

        $service = new GroqDocumentKycService(apiKey: '');
        $service->scanSingleDocument('data:image/jpeg;base64,sample');
    }

    public function test_analyze_rental_kyc_returns_kyc_document_result(): void
    {
        Http::fake([
            'https://api.groq.com/openai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'status' => 'verified',
                                'risk_level' => 'low',
                                'risk_score' => 5,
                                'summary' => 'Dokumen KTP dan SIM valid dan sesuai.',
                                'ktp' => [
                                    'nik' => '1871012345670002',
                                    'name' => 'AHMAD RIFAI',
                                ],
                                'sim' => [
                                    'license_number' => '920812345678',
                                    'license_type' => 'SIM A',
                                    'expires_at' => '2028-08-17',
                                    'is_expired' => false,
                                ],
                                'checks' => [
                                    'name_match_score' => 1.0,
                                    'sim_valid_for_rental' => true,
                                    'is_blacklisted' => false,
                                    'issues' => [],
                                ],
                            ]),
                        ],
                    ],
                ],
            ], 200),
        ]);

        $rental = new Rental([
            'passenger_ktp_path' => 'data:image/jpeg;base64,dummyktp',
            'passenger_sim_path' => 'data:image/jpeg;base64,dummysim',
        ]);

        $service = new GroqDocumentKycService(apiKey: 'gsk_test_mock_key');
        $result = $service->analyzeRentalKyc($rental);

        $this->assertSame('verified', $result->status);
        $this->assertSame('low', $result->riskLevel);
        $this->assertSame(5, $result->riskScore);
        $this->assertSame('1871012345670002', $result->ktp['nik']);
        $this->assertSame('920812345678', $result->sim['license_number']);
        $this->assertTrue($result->checks['sim_valid_for_rental']);
    }

    public function test_decommissioned_model_is_normalized_to_qwen_vision(): void
    {
        $service = new GroqDocumentKycService(apiKey: 'gsk_test', model: 'llama-3.2-11b-vision-preview');
        $this->assertSame('qwen/qwen3.6-27b', $service->getModel());

        $service2 = new GroqDocumentKycService(apiKey: 'gsk_test', model: 'llama-3.2-90b-vision-preview');
        $this->assertSame('qwen/qwen3.6-27b', $service2->getModel());
    }
}
