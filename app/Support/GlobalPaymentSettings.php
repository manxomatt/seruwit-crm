<?php

namespace App\Support;

use App\Models\Setting;
use Modules\Accounting\Models\CompanyBankAccount;

class GlobalPaymentSettings
{
    public const GROUP = 'payment';

    public const KEY_QRIS_ENABLED = 'payment.qris_is_enabled';

    public const KEY_QRIS_IMAGE = 'payment.qris_image';

    public const KEY_QRIS_MERCHANT_NAME = 'payment.qris_merchant_name';

    public const KEY_QRIS_NMID = 'payment.qris_nmid';

    public const KEY_QRIS_BANK_ACCOUNT_ID = 'payment.qris_bank_account_id';

    public const KEY_QRIS_INSTRUCTIONS = 'payment.qris_instructions';

    public static function isQrisActive(): bool
    {
        return filter_var(Setting::getValue(self::KEY_QRIS_ENABLED, false), FILTER_VALIDATE_BOOLEAN)
            && ! empty(Setting::getValue(self::KEY_QRIS_IMAGE, ''));
    }

    /**
     * @return array{
     *     is_enabled: bool,
     *     image_url: string,
     *     merchant_name: string,
     *     nmid: string,
     *     instructions: string,
     *     bank_account: array{id: int, name: string, bank_name: string|null, account_number: string|null}|null
     * }|null
     */
    public static function getQrisPayload(): ?array
    {
        if (! self::isQrisActive()) {
            return null;
        }

        $bankAccountId = Setting::getValue(self::KEY_QRIS_BANK_ACCOUNT_ID);
        $bankAccount = null;

        if (! empty($bankAccountId) && class_exists(CompanyBankAccount::class)) {
            $account = CompanyBankAccount::query()->where('is_active', true)->find($bankAccountId);
            if ($account) {
                $bankAccount = [
                    'id' => (int) $account->id,
                    'name' => (string) $account->name,
                    'bank_name' => $account->bank_name,
                    'account_number' => $account->account_number,
                ];
            }
        }

        $companyName = (string) Setting::getValue('general.site_name', config('app.name', 'Seruwit'));

        return [
            'is_enabled' => true,
            'image_url' => (string) Setting::getValue(self::KEY_QRIS_IMAGE, ''),
            'merchant_name' => (string) Setting::getValue(self::KEY_QRIS_MERCHANT_NAME, $companyName),
            'nmid' => (string) Setting::getValue(self::KEY_QRIS_NMID, ''),
            'instructions' => (string) Setting::getValue(
                self::KEY_QRIS_INSTRUCTIONS,
                'Buka aplikasi mobile banking atau e-wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay). Scan QRIS di atas, masukkan nominal yang sesuai, dan upload bukti pembayaran.'
            ),
            'bank_account' => $bankAccount,
        ];
    }
}
