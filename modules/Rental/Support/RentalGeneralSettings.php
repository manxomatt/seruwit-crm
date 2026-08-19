<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

class RentalGeneralSettings
{
    public const GROUP = 'rental_internal';

    public const KEY_DEFAULT_ONE_WAY_FEE = 'rental.default_one_way_fee';

    public const KEY_PASSENGER_BOOKING_ENABLED = 'rental.passenger_booking_enabled';

    public const KEY_PENDING_RESERVED_TTL = 'rental.pending_reserved_ttl_minutes';

    public const KEY_CANCELLATION_FEE_TYPE = 'rental.cancellation_fee_type';

    public const KEY_CANCELLATION_FEE_AMOUNT = 'rental.cancellation_fee_amount';

    public const KEY_NO_SHOW_FEE_TYPE = 'rental.no_show_fee_type';

    public const KEY_NO_SHOW_FEE_AMOUNT = 'rental.no_show_fee_amount';

    public const KEY_PASSENGER_FREE_CANCEL_HOURS = 'rental.passenger_free_cancel_hours';

    public const KEY_PUBLIC_MASK_PLATES = 'rental.public_mask_plates';

    public const KEY_CALENDAR_CLICK_TO_BOOK = 'rental.calendar_click_to_book';

    public const KEY_AI_INSPECTION_ENABLED = 'rental.ai_inspection_enabled';

    public const KEY_AI_KYC_ENABLED = 'rental.ai_kyc_enabled';

    public const KEY_AI_PRICING_OPTIMIZER_ENABLED = 'rental.ai_pricing_optimizer_enabled';

    /**
     * @return list<string>
     */
    public static function managedKeys(): array
    {
        return [
            self::KEY_DEFAULT_ONE_WAY_FEE,
            self::KEY_PASSENGER_BOOKING_ENABLED,
            self::KEY_PENDING_RESERVED_TTL,
            self::KEY_CANCELLATION_FEE_TYPE,
            self::KEY_CANCELLATION_FEE_AMOUNT,
            self::KEY_NO_SHOW_FEE_TYPE,
            self::KEY_NO_SHOW_FEE_AMOUNT,
            self::KEY_PASSENGER_FREE_CANCEL_HOURS,
            self::KEY_PUBLIC_MASK_PLATES,
            self::KEY_CALENDAR_CLICK_TO_BOOK,
            self::KEY_AI_INSPECTION_ENABLED,
            self::KEY_AI_KYC_ENABLED,
            self::KEY_AI_PRICING_OPTIMIZER_ENABLED,
        ];
    }

    /**
     * @return array{
     *     default_one_way_fee: string,
     *     passenger_booking_enabled: bool,
     *     pending_reserved_ttl_minutes: string,
     *     cancellation_fee_type: string,
     *     cancellation_fee_amount: string,
     *     no_show_fee_type: string,
     *     no_show_fee_amount: string,
     *     passenger_free_cancel_hours: string,
     *     public_mask_plates: bool,
     *     calendar_click_to_book: bool,
     *     ai_inspection_enabled: bool,
     *     ai_kyc_enabled: bool,
     *     ai_pricing_optimizer_enabled: bool
     * }
     */
    public static function all(): array
    {
        return [
            'default_one_way_fee' => (string) Setting::getValue(self::KEY_DEFAULT_ONE_WAY_FEE, '150000'),
            'passenger_booking_enabled' => Setting::getValue(self::KEY_PASSENGER_BOOKING_ENABLED, '0') === '1',
            'pending_reserved_ttl_minutes' => (string) Setting::getValue(self::KEY_PENDING_RESERVED_TTL, '120'),
            'cancellation_fee_type' => (string) Setting::getValue(self::KEY_CANCELLATION_FEE_TYPE, RentalBookingPolicy::FEE_TYPE_FIXED),
            'cancellation_fee_amount' => (string) Setting::getValue(self::KEY_CANCELLATION_FEE_AMOUNT, '0'),
            'no_show_fee_type' => (string) Setting::getValue(self::KEY_NO_SHOW_FEE_TYPE, RentalBookingPolicy::FEE_TYPE_FIXED),
            'no_show_fee_amount' => (string) Setting::getValue(self::KEY_NO_SHOW_FEE_AMOUNT, '0'),
            'passenger_free_cancel_hours' => (string) Setting::getValue(self::KEY_PASSENGER_FREE_CANCEL_HOURS, '24'),
            'public_mask_plates' => Setting::getValue(self::KEY_PUBLIC_MASK_PLATES, '1') === '1',
            'calendar_click_to_book' => Setting::getValue(self::KEY_CALENDAR_CLICK_TO_BOOK, '1') === '1',
            'ai_inspection_enabled' => Setting::getValue(self::KEY_AI_INSPECTION_ENABLED, '1') === '1',
            'ai_kyc_enabled' => Setting::getValue(self::KEY_AI_KYC_ENABLED, '1') === '1',
            'ai_pricing_optimizer_enabled' => Setting::getValue(self::KEY_AI_PRICING_OPTIMIZER_ENABLED, '1') === '1',
        ];
    }

    /**
     * @param  array{
     *     default_one_way_fee: int|float|string,
     *     passenger_booking_enabled: bool,
     *     pending_reserved_ttl_minutes: int|string,
     *     cancellation_fee_type: string,
     *     cancellation_fee_amount: int|float|string,
     *     no_show_fee_type: string,
     *     no_show_fee_amount: int|float|string,
     *     passenger_free_cancel_hours: int|string,
     *     public_mask_plates: bool,
     *     calendar_click_to_book: bool,
     *     ai_inspection_enabled?: bool,
     *     ai_kyc_enabled?: bool,
     *     ai_pricing_optimizer_enabled?: bool
     * }  $data
     */
    public static function update(array $data): void
    {
        self::put(self::KEY_DEFAULT_ONE_WAY_FEE, (string) $data['default_one_way_fee'], 'number', 'Default One-Way Fee (Rp)', 1);
        self::put(self::KEY_PASSENGER_BOOKING_ENABLED, $data['passenger_booking_enabled'] ? '1' : '0', 'boolean', 'Mobile / passenger rental booking', 2);
        self::put(self::KEY_PENDING_RESERVED_TTL, (string) $data['pending_reserved_ttl_minutes'], 'number', 'Pending Reserved TTL (minutes)', 10);
        self::put(self::KEY_CANCELLATION_FEE_TYPE, (string) $data['cancellation_fee_type'], 'string', 'Cancellation fee type', 11);
        self::put(self::KEY_CANCELLATION_FEE_AMOUNT, (string) $data['cancellation_fee_amount'], 'number', 'Cancellation fee amount', 12);
        self::put(self::KEY_NO_SHOW_FEE_TYPE, (string) $data['no_show_fee_type'], 'string', 'No-show fee type', 13);
        self::put(self::KEY_NO_SHOW_FEE_AMOUNT, (string) $data['no_show_fee_amount'], 'number', 'No-show fee amount', 14);
        self::put(self::KEY_PASSENGER_FREE_CANCEL_HOURS, (string) $data['passenger_free_cancel_hours'], 'number', 'Passenger free-cancel window (hours)', 15);
        self::put(self::KEY_PUBLIC_MASK_PLATES, $data['public_mask_plates'] ? '1' : '0', 'boolean', 'Mask plates on public booking pages', 16);
        self::put(self::KEY_CALENDAR_CLICK_TO_BOOK, $data['calendar_click_to_book'] ? '1' : '0', 'boolean', 'Calendar click to book', 20);
        self::put(self::KEY_AI_INSPECTION_ENABLED, ! empty($data['ai_inspection_enabled']) ? '1' : '0', 'boolean', 'AI Visual Inspection (Handover)', 30);
        self::put(self::KEY_AI_KYC_ENABLED, ! empty($data['ai_kyc_enabled']) ? '1' : '0', 'boolean', 'AI Smart KYC & Document OCR', 31);
        self::put(self::KEY_AI_PRICING_OPTIMIZER_ENABLED, ! empty($data['ai_pricing_optimizer_enabled']) ? '1' : '0', 'boolean', 'AI Dynamic Pricing & Fleet Optimizer', 32);
    }

    private static function put(string $key, string $value, string $type, string $label, int $sortOrder): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => self::GROUP,
                'value' => $value,
                'type' => $type,
                'label' => $label,
                'description' => 'Managed via Rental → Settings → General.',
                'is_public' => false,
                'sort_order' => $sortOrder,
            ],
        );
    }
}
