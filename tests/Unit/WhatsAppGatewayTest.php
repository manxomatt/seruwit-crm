<?php

namespace Tests\Unit;

use App\Services\WhatsApp\CustomWebhookGateway;
use App\Services\WhatsApp\FonnteGateway;
use App\Services\WhatsApp\LogWhatsAppGateway;
use App\Services\WhatsApp\WhatsAppGatewayManager;
use Tests\TestCase;

class WhatsAppGatewayTest extends TestCase
{
    public function test_normalize_phone_converts_indonesian_formats_to_international(): void
    {
        // 08xx format
        $this->assertSame('628123456789', WhatsAppGatewayManager::normalizePhone('08123456789'));

        // +628xx format with symbols
        $this->assertSame('628123456789', WhatsAppGatewayManager::normalizePhone('+62 812-3456-789'));

        // 8xx format without leading 0 or 62
        $this->assertSame('628123456789', WhatsAppGatewayManager::normalizePhone('8123456789'));

        // Already 628xx
        $this->assertSame('628123456789', WhatsAppGatewayManager::normalizePhone('628123456789'));

        // Whitespaces, dashes, parentheses
        $this->assertSame('6285711223344', WhatsAppGatewayManager::normalizePhone('(0857) 1122-3344'));
    }

    public function test_log_gateway_returns_success_status(): void
    {
        $gateway = new LogWhatsAppGateway;
        $result = $gateway->sendMessage('08123456789', 'Hello Test');

        $this->assertTrue($result);

        $status = $gateway->getDeviceStatus();
        $this->assertTrue($status['connected']);
        $this->assertSame('log_driver_active', $status['status']);
    }

    public function test_fonnte_gateway_instantiation(): void
    {
        $gateway = new FonnteGateway('sample_token');
        $this->assertInstanceOf(FonnteGateway::class, $gateway);
    }

    public function test_custom_gateway_instantiation(): void
    {
        $gateway = new CustomWebhookGateway('https://wa.example.com/api/send', 'secret_key');
        $this->assertInstanceOf(CustomWebhookGateway::class, $gateway);
    }
}
