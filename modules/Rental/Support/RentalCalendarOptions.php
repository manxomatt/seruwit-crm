<?php

namespace Modules\Rental\Support;

use App\Models\Setting;

class RentalCalendarOptions
{
    public const SETTING_CLICK_TO_BOOK = 'rental.calendar_click_to_book';

    public static function clickToBookEnabled(): bool
    {
        return Setting::getValue(self::SETTING_CLICK_TO_BOOK, '1') === '1';
    }

    public static function setClickToBookEnabled(bool $enabled): void
    {
        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_CLICK_TO_BOOK],
            [
                'group' => 'rental',
                'value' => $enabled ? '1' : '0',
                'type' => 'boolean',
                'label' => 'Calendar click to book',
                'description' => 'When enabled, clicking a date (or free vehicle cell) on the rental calendar opens the reservation wizard.',
                'is_public' => false,
                'sort_order' => 20,
            ],
        );
    }
}
