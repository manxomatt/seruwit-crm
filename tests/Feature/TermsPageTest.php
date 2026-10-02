<?php

namespace Tests\Feature;

use Tests\TestCase;

class TermsPageTest extends TestCase
{
    public function test_terms_page_renders_with_legal_translations(): void
    {
        $response = $this->get(route('central.terms'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Legal/Terms')
            ->has('settings')
            ->has('locale')
            ->has('translations.legal.terms')
            ->has('translations.legal.terms.sections.account')
            ->has('translations.legal.terms.sections.tenant')
            ->has('translations.legal.terms.sections.security')
            ->has('translations.legal.terms.sections.intellectual_property')
        );
    }

    public function test_terms_page_supports_english_and_indonesian_locales(): void
    {
        $responseEn = $this->get(route('central.terms', ['lang' => 'en']));

        $responseEn->assertOk();
        $responseEn->assertInertia(fn ($page) => $page
            ->component('Legal/Terms')
            ->where('locale', 'en')
            ->where('translations.legal.terms.page_title', 'Terms & Conditions')
            ->where('translations.legal.terms.title', 'Platform Registration Terms & Conditions')
        );

        $responseId = $this->get(route('central.terms', ['lang' => 'id']));

        $responseId->assertOk();
        $responseId->assertInertia(fn ($page) => $page
            ->component('Legal/Terms')
            ->where('locale', 'id')
            ->where('translations.legal.terms.page_title', 'Syarat & Ketentuan')
            ->where('translations.legal.terms.title', 'Syarat & Ketentuan Registrasi Platform')
        );
    }

    public function test_privacy_page_renders_with_legal_translations(): void
    {
        $response = $this->get(route('central.privacy'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Legal/Privacy')
            ->has('settings')
            ->has('translations.legal.privacy')
            ->has('translations.legal.privacy.sections.collection')
        );
    }
}
