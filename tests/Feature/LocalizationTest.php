<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Tests\TestCase;
use Tests\Traits\WithRoles;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;
    use WithRoles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->setUpRoles();
    }

    public function test_login_page_shares_locale_and_translations(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Auth/Login')
                ->has('locale')
                ->has('translations.shell')
                ->has('translations.auth_ui')
                ->has('availableLocales', 2)
            );
    }

    public function test_guest_can_switch_locale_via_session(): void
    {
        $this->patch(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $this->assertSame('en', session('locale'));

        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en')
                ->where('translations.shell.log_out', 'Log Out')
            );
    }

    public function test_authenticated_user_locale_is_persisted(): void
    {
        $user = $this->createAdminUser(['locale' => 'id']);

        $this->actingAs($user)
            ->patch(route('locale.update'), ['locale' => 'en'])
            ->assertRedirect();

        $this->assertSame('en', $user->fresh()->locale);
        $this->assertSame('en', session('locale'));
        $this->assertSame('en', App::getLocale());
    }

    public function test_unsupported_locale_is_rejected(): void
    {
        $this->patch(route('locale.update'), ['locale' => 'fr'])
            ->assertSessionHasErrors('locale');
    }

    public function test_profile_update_can_change_locale(): void
    {
        $user = $this->createAdminUser(['locale' => 'id']);

        $this->actingAs($user)
            ->patch(route('profile.update'), [
                'name' => $user->name,
                'email' => $user->email,
                'locale' => 'en',
            ])
            ->assertRedirect(route('profile.edit'));

        $this->assertSame('en', $user->fresh()->locale);
    }

    public function test_module_dashboard_uses_user_locale(): void
    {
        $user = $this->createAdminUser(['locale' => 'en']);

        $this->actingAs($user)
            ->get(route('module.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('locale', 'en')
                ->where('translations.modules.fleet', 'Fleet')
            );
    }
}
