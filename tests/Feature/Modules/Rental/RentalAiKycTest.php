<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Modules\Partners\Models\Partner;
use Modules\Rental\AI\Contracts\DocumentKycServiceInterface;
use Modules\Rental\AI\DTO\KycDocumentResult;
use Modules\Rental\Models\Rental;
use Modules\Rental\Support\RentalGeneralSettings;
use Tests\Support\WithRentalHandoverEvidence;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalAiKycTest extends TestCase
{
    use RefreshDatabase;
    use WithRentalHandoverEvidence;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    protected function dummyDataUrl(): string
    {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    }

    public function test_guests_cannot_access_ai_kyc(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);

        $this->post(route('module.rental.ai_scan_kyc', $rental))
            ->assertRedirect(route('login'));
    }

    public function test_unauthorized_users_cannot_access_ai_kyc(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_ACTIVE]);

        $this->actingAs($this->createUserWithRole())
            ->postJson(route('module.rental.ai_scan_kyc', $rental))
            ->assertForbidden();
    }

    public function test_ai_kyc_requires_documents_uploaded(): void
    {
        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_ACTIVE,
            'passenger_ktp_path' => null,
            'passenger_sim_path' => null,
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_scan_kyc', $rental))
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_ai_kyc_scan_succeeds_and_saves_assessment(): void
    {
        $partner = Partner::factory()->create([
            'name' => 'Budi Santoso',
            'is_blacklisted' => false,
        ]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'passenger_ktp_path' => 'rental/documents/ktp.jpg',
            'passenger_sim_path' => 'rental/documents/sim.jpg',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-05',
        ]);

        $mockResult = new KycDocumentResult(
            status: 'verified',
            riskLevel: 'low',
            riskScore: 95,
            summary: 'Dokumen KTP dan SIM valid. SIM aktif hingga 2028-11-15.',
            ktp: [
                'nik' => '3271012345670001',
                'name' => 'BUDI SANTOSO',
                'birth_date' => '1990-05-12',
                'address' => 'Jl. Sudirman No. 45, Jakarta Selatan',
                'religion' => 'Islam',
                'occupation' => 'Karyawan Swasta',
                'confidence' => 0.96,
            ],
            sim: [
                'license_number' => '900512345678',
                'license_type' => 'SIM A',
                'name' => 'BUDI SANTOSO',
                'expires_at' => '2028-11-15',
                'is_expired' => false,
                'confidence' => 0.94,
            ],
            checks: [
                'name_match_score' => 0.98,
                'sim_valid_for_rental' => true,
                'is_blacklisted' => false,
                'issues' => [],
            ],
            rawResponse: ['status' => 'mocked'],
            scannedAt: '2026-08-19T10:00:00Z',
        );

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) use ($mockResult): void {
            $mock->shouldReceive('analyzeRentalKyc')
                ->once()
                ->andReturn($mockResult);
        });

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_scan_kyc', $rental))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('assessment.status', 'verified')
            ->assertJsonPath('assessment.risk_level', 'low')
            ->assertJsonPath('assessment.risk_score', 95)
            ->assertJsonPath('assessment.ktp.nik', '3271012345670001')
            ->assertJsonPath('assessment.sim.license_number', '900512345678');
    }

    public function test_single_document_ocr_returns_extracted_fields(): void
    {
        $mockOcrResponse = [
            'doc_type' => 'ktp',
            'confidence' => 0.96,
            'data' => [
                'name' => 'BUDI SANTOSO',
                'nik' => '3271012345670001',
                'birth_date' => '1990-05-12',
                'address' => 'Jl. Sudirman No. 45',
            ],
            'raw' => ['mock' => true],
        ];

        $this->mock(DocumentKycServiceInterface::class, function (MockInterface $mock) use ($mockOcrResponse): void {
            $mock->shouldReceive('scanSingleDocument')
                ->once()
                ->andReturn($mockOcrResponse);
        });

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_scan_document'), [
                'image' => $this->dummyDataUrl(),
                'doc_type' => 'auto',
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('result.doc_type', 'ktp')
            ->assertJsonPath('result.data.name', 'BUDI SANTOSO')
            ->assertJsonPath('result.data.nik', '3271012345670001');
    }

    public function test_sync_to_partner_updates_partner_id_and_license(): void
    {
        $partner = Partner::factory()->create([
            'name' => 'Budi Santoso',
            'id_number' => null,
            'license_number' => null,
            'license_expires_at' => null,
        ]);

        $rental = Rental::factory()->create([
            'partner_id' => $partner->id,
            'status' => Rental::STATUS_ACTIVE,
            'ai_kyc_assessment' => [
                'ktp' => [
                    'nik' => '3271012345670001',
                    'name' => 'BUDI SANTOSO',
                ],
                'sim' => [
                    'license_number' => '900512345678',
                    'expires_at' => '2028-11-15',
                ],
            ],
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_sync_kyc_partner', $rental))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('partner.id_number', '3271012345670001')
            ->assertJsonPath('partner.license_number', '900512345678')
            ->assertJsonPath('partner.license_expires_at', '2028-11-15');

        $partner->refresh();
        $this->assertSame('3271012345670001', $partner->id_number);
        $this->assertSame('900512345678', $partner->license_number);
        $this->assertSame('2028-11-15', $partner->license_expires_at?->format('Y-m-d'));
    }

    public function test_disabled_setting_blocks_ai_kyc_execution(): void
    {
        RentalGeneralSettings::update(array_merge(RentalGeneralSettings::all(), [
            'ai_kyc_enabled' => false,
        ]));

        $rental = Rental::factory()->create([
            'status' => Rental::STATUS_ACTIVE,
            'passenger_ktp_path' => 'rental/documents/ktp.jpg',
        ]);

        $this->actingAs($this->createAdminUser())
            ->postJson(route('module.rental.ai_scan_kyc', $rental))
            ->assertStatus(403)
            ->assertJsonPath('success', false);
    }
}
