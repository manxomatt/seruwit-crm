<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Modules\Rental\Models\Rental;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalPdfTest extends TestCase
{
    use DatabaseTransactions;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->withoutMiddleware([
            \Stancl\Tenancy\Middleware\InitializeTenancyByDomain::class,
            \Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains::class,
            \App\Http\Middleware\EnsureTenantIsActive::class,
            \App\Http\Middleware\CheckPermission::class,
            \App\Http\Middleware\RedirectUnfinishedSignup::class,
            \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        ]);
    }

    public function test_confirmed_rental_streams_contract_pdf(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.contract', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_draft_rental_cannot_print_contract(): void
    {
        $rental = Rental::factory()->create(['status' => Rental::STATUS_DRAFT]);

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->get(route('module.rental.pdf.contract', $rental))
            ->assertRedirect(route('module.rental.show', $rental));
    }

    public function test_active_rental_streams_handover_pdf(): void
    {
        $rental = Rental::factory()->active()->create([
            'start_fuel_level' => 'full',
            'checkout_checklist' => [
                'exterior_body' => true,
                'tires_wheels' => true,
                'lights' => true,
                'interior' => true,
                'documents' => true,
                'spare_tools' => true,
                'ac' => true,
                'keys' => true,
            ],
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.handover', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_confirmed_rental_cannot_print_handover_yet(): void
    {
        $rental = Rental::factory()->confirmed()->create();

        $this->actingAs($this->createAdminUser())
            ->from(route('module.rental.show', $rental))
            ->get(route('module.rental.pdf.handover', $rental))
            ->assertRedirect(route('module.rental.show', $rental));
    }

    public function test_contract_pdf_renders_with_digital_signature_and_self_service_fields(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $signaturePath = 'rentals/signatures/customer_digital_sig.png';
        \Illuminate\Support\Facades\Storage::disk('public')->put(
            $signaturePath,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
        );

        $rental = Rental::factory()->confirmed()->create([
            'service_type' => Rental::SERVICE_SELF_DRIVE,
            'delivery_type' => 'airport',
            'delivery_address' => 'Bandara Soekarno Hatta Terminal 3',
            'return_delivery_type' => 'hotel',
            'return_delivery_address' => 'Hotel Indonesia Kempinski Room 801',
            'emergency_contact_name' => 'Budi Santoso',
            'emergency_contact_phone' => '081234567890',
            'delivery_fee' => 50000,
            'return_delivery_fee' => 75000,
            'contract_signature_path' => $signaturePath,
            'contract_signed_at' => now(),
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.contract', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_handover_pdf_renders_with_digital_signature(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $custSigPath = 'rentals/signatures/cust_handover.png';
        $staffSigPath = 'rentals/signatures/staff_handover.png';
        $tinyPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        \Illuminate\Support\Facades\Storage::disk('public')->put($custSigPath, $tinyPng);
        \Illuminate\Support\Facades\Storage::disk('public')->put($staffSigPath, $tinyPng);

        $rental = Rental::factory()->active()->create([
            'contract_signature_path' => $custSigPath,
            'checkout_signature_path' => $staffSigPath,
            'contract_signed_at' => now(),
            'start_fuel_level' => 'full',
            'checkout_checklist' => [
                'exterior_body' => true,
                'keys' => true,
            ],
        ]);

        $this->actingAs($this->createAdminUser())
            ->get(route('module.rental.pdf.handover', $rental))
            ->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
