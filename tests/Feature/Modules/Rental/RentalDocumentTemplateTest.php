<?php

namespace Tests\Feature\Modules\Rental;

use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Rental\Support\DocumentTemplateManager;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class RentalDocumentTemplateTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_documents_tab_renders(): void
    {
        $this->actingAs($this->createUserWithRole())
            ->get(route('module.rental.settings.index', ['tab' => 'documents']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'documents')
                ->has('documents')
            );
    }

    public function test_document_template_can_be_updated_and_reset(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->get(route('module.rental.settings.index', ['tab' => 'documents']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Modules/Rental/Settings/Index')
                ->where('tab', 'documents')
                ->has('documents.rental_contract.name')
                ->has('documents.rental_contract.layout_preset')
            );

        $this->actingAs($user)
            ->patch(route('module.rental.settings.documents.update', ['code' => 'rental_contract']), [
                'name' => 'Custom Contract',
                'layout_preset' => 'corporate',
                'content' => [
                    'title' => 'Custom Title',
                    'subtitle' => 'Custom Subtitle',
                    'intro_html' => '<p>Custom intro</p>',
                    'terms_html' => '<p>Custom terms</p>',
                    'notes_label' => 'Custom Notes',
                    'footer_html' => '<p>Custom footer</p>',
                ],
                'options' => [
                    'show_logo' => false,
                    'show_address' => true,
                    'show_phone' => false,
                    'show_footer' => true,
                    'show_signature' => false,
                    'show_company_info' => true,
                ],
            ])
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'documents']));

        $template = DocumentTemplateManager::get('rental_contract');
        $this->assertSame('Custom Contract', $template['name']);
        $this->assertSame('corporate', $template['layout_preset']);
        $this->assertSame('Custom Title', $template['content']['title']);
        $this->assertFalse($template['options']['show_logo']);

        $this->actingAs($user)
            ->post(route('module.rental.settings.documents.reset', ['code' => 'rental_contract']))
            ->assertRedirect(route('module.rental.settings.index', ['tab' => 'documents']));

        $template = DocumentTemplateManager::get('rental_contract');
        $this->assertSame('Template Kontrak Default', $template['name']);
        $this->assertSame('classic', $template['layout_preset']);
    }

    public function test_document_template_manager_defaults_and_resolve(): void
    {
        Setting::query()->where('key', DocumentTemplateManager::KEY_DOCUMENT_TEMPLATES)->delete();

        $defaults = DocumentTemplateManager::all();
        $this->assertArrayHasKey('rental_contract', $defaults);
        $this->assertArrayHasKey('rental_handover', $defaults);
        $this->assertArrayHasKey('rental_invoice', $defaults);

        $resolved = DocumentTemplateManager::resolveForPdf('rental_contract', [
            'rental' => ['code' => 'RNT-001', 'start_date' => null, 'end_date' => null, 'total_amount' => 1000000, 'base_amount' => 800000, 'deposit_amount' => 200000],
            'partner' => ['name' => 'Test Partner', 'code' => 'P-001'],
            'vehicle' => ['name' => 'Test Vehicle', 'plate_number' => 'B 1234 CD'],
            'company' => ['name' => 'Test Company'],
        ]);

        $this->assertSame('Template Kontrak Default', $resolved['name']);
        $this->assertStringContainsString('RNT-001', $resolved['content']['subtitle']);
        $this->assertStringContainsString(now()->format('d/m/Y'), $resolved['content']['subtitle']);
    }

    public function test_invalid_document_code_is_rejected(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)
            ->patch(route('module.rental.settings.documents.update', ['code' => 'invalid_code']), [
                'name' => 'Test',
                'layout_preset' => 'classic',
                'content' => ['title' => 'Test'],
                'options' => [],
            ])
            ->assertRedirect();

        $this->actingAs($user)
            ->post(route('module.rental.settings.documents.reset', ['code' => 'invalid_code']))
            ->assertRedirect();
    }
}
