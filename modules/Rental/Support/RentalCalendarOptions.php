<?php

namespace Modules\Rental\Support;

class RentalCalendarOptions
{
    public const SETTING_CLICK_TO_BOOK = RentalGeneralSettings::KEY_CALENDAR_CLICK_TO_BOOK;

    public const SETTING_GROUP = RentalGeneralSettings::GROUP;

    public static function clickToBookEnabled(): bool
    {
        return RentalGeneralSettings::all()['calendar_click_to_book'];
    }

    public static function setClickToBookEnabled(bool $enabled): void
    {
        $current = RentalGeneralSettings::all();
        $current['calendar_click_to_book'] = $enabled;
        RentalGeneralSettings::update($current);
    }
}
