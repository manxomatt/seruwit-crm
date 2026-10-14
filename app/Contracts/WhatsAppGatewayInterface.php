<?php

namespace App\Contracts;

interface WhatsAppGatewayInterface
{
    /**
     * Send a plain text WhatsApp message.
     */
    public function sendMessage(string $targetPhone, string $message): bool;

    /**
     * Send a WhatsApp message with media attachment (image, pdf, etc).
     */
    public function sendMedia(string $targetPhone, string $caption, string $mediaUrl, ?string $fileName = null): bool;

    /**
     * Check device connection status.
     *
     * @return array{connected: bool, status: string, message?: string}
     */
    public function getDeviceStatus(): array;
}
