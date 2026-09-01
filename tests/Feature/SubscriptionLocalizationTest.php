<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\App;
use Tests\TestCase;

class SubscriptionLocalizationTest extends TestCase
{
    /**
     * @var list<string>
     */
    private const PAGES = [
        'resources/js/Pages/Modules/Subscription/Activate.tsx',
        'resources/js/Pages/Modules/Subscription/Payment.tsx',
    ];

    /**
     * Flatten a nested translation array into dotted keys.
     *
     * @param  array<array-key, mixed>  $translations
     * @return list<string>
     */
    private function flattenKeys(array $translations, string $prefix = ''): array
    {
        $keys = [];

        foreach ($translations as $key => $value) {
            $dotted = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($value)) {
                $keys = array_merge($keys, $this->flattenKeys($value, $dotted));

                continue;
            }

            $keys[] = $dotted;
        }

        return $keys;
    }

    public function test_subscription_translation_keys_match_across_locales(): void
    {
        $english = $this->flattenKeys(require base_path('lang/en/subscription.php'));
        $indonesian = $this->flattenKeys(require base_path('lang/id/subscription.php'));

        $this->assertSame([], array_values(array_diff($english, $indonesian)), 'Keys defined in lang/en/subscription.php are missing from lang/id/subscription.php.');
        $this->assertSame([], array_values(array_diff($indonesian, $english)), 'Keys defined in lang/id/subscription.php are missing from lang/en/subscription.php.');
    }

    public function test_subscription_pages_only_reference_defined_translation_keys(): void
    {
        $defined = $this->flattenKeys(require base_path('lang/en/subscription.php'));

        foreach (self::PAGES as $page) {
            $source = file_get_contents(base_path($page));

            preg_match_all("/t\(\s*'subscription\.([a-zA-Z0-9_.]+)'/", $source, $matches);

            $this->assertNotEmpty($matches[1], "{$page} does not use the subscription translation group at all.");

            foreach (array_unique($matches[1]) as $key) {
                $this->assertContains($key, $defined, "{$page} references undefined translation key subscription.{$key}.");
            }
        }
    }

    public function test_subscription_pages_do_not_hardcode_module_labels(): void
    {
        $activate = file_get_contents(base_path('resources/js/Pages/Modules/Subscription/Activate.tsx'));

        $this->assertStringContainsString('subscription.modules.${key}', $activate, 'Module labels must resolve through the subscription.modules translation group.');
    }

    public function test_subscription_flash_messages_follow_the_active_locale(): void
    {
        App::setLocale('en');

        $this->assertSame('Transfer proof uploaded successfully.', __('subscription.messages.proof_uploaded'));
        $this->assertSame('Payment order #42 has been cancelled successfully.', __('subscription.messages.order_cancelled', ['id' => 42]));
        $this->assertSame('The active payment order has been cancelled successfully.', __('subscription.messages.active_order_cancelled'));
        $this->assertSame('Invalid plan selected.', __('subscription.messages.invalid_plan'));

        App::setLocale('id');

        $this->assertSame('Bukti transfer berhasil diunggah.', __('subscription.messages.proof_uploaded'));
        $this->assertSame('Transaksi pesanan pembayaran #42 berhasil dibatalkan.', __('subscription.messages.order_cancelled', ['id' => 42]));
        $this->assertSame('Transaksi pesanan pembayaran aktif berhasil dibatalkan.', __('subscription.messages.active_order_cancelled'));
        $this->assertSame('Paket yang dipilih tidak valid.', __('subscription.messages.invalid_plan'));
    }

    public function test_subscription_controller_uses_translated_flash_messages(): void
    {
        $controller = file_get_contents(base_path('app/Http/Controllers/Module/SubscriptionController.php'));

        foreach (['proof_uploaded', 'order_cancelled', 'active_order_cancelled', 'invalid_plan'] as $key) {
            $this->assertStringContainsString("__('subscription.messages.{$key}'", $controller, "SubscriptionController should resolve its {$key} message through the translator.");
        }
    }
}
