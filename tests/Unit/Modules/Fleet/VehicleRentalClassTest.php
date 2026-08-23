<?php

namespace Tests\Unit\Modules\Fleet;

use Illuminate\Support\Facades\App;
use Modules\Fleet\Support\VehicleRentalClass;
use Tests\TestCase;

class VehicleRentalClassTest extends TestCase
{
    public function test_rental_class_values_contain_all_expected_classes(): void
    {
        $values = VehicleRentalClass::values();

        $this->assertContains(VehicleRentalClass::ECONOMY, $values);
        $this->assertContains(VehicleRentalClass::MPV, $values);
        $this->assertContains(VehicleRentalClass::SUV, $values);
        $this->assertContains(VehicleRentalClass::VAN, $values);
        $this->assertContains(VehicleRentalClass::PREMIUM, $values);
        $this->assertContains(VehicleRentalClass::TRUCK, $values);
        $this->assertContains(VehicleRentalClass::OTHER, $values);
        $this->assertContains('van', $values);
    }

    public function test_rental_class_labels_are_localized_in_indonesian_and_english(): void
    {
        App::setLocale('id');
        $this->assertSame('Ekonomi', VehicleRentalClass::label('economy'));
        $this->assertSame('MPV', VehicleRentalClass::label('mpv'));
        $this->assertSame('SUV', VehicleRentalClass::label('suv'));
        $this->assertSame('Van', VehicleRentalClass::label('van'));
        $this->assertSame('Premium', VehicleRentalClass::label('premium'));
        $this->assertSame('Truk', VehicleRentalClass::label('truck'));
        $this->assertSame('Lainnya', VehicleRentalClass::label('other'));

        App::setLocale('en');
        $this->assertSame('Economy', VehicleRentalClass::label('economy'));
        $this->assertSame('MPV', VehicleRentalClass::label('mpv'));
        $this->assertSame('SUV', VehicleRentalClass::label('suv'));
        $this->assertSame('Van', VehicleRentalClass::label('van'));
        $this->assertSame('Premium', VehicleRentalClass::label('premium'));
        $this->assertSame('Truck', VehicleRentalClass::label('truck'));
        $this->assertSame('Other', VehicleRentalClass::label('other'));
    }

    public function test_label_falls_back_to_humanized_value_for_untranslated_classes(): void
    {
        foreach (['en', 'id'] as $locale) {
            App::setLocale($locale);

            // Legacy free-text classes with no translation key must never leak the
            // raw key to the UI.
            $this->assertSame('Limousine', VehicleRentalClass::label('limousine'));
            $this->assertSame('Box Truck', VehicleRentalClass::label('box truck'));
            $this->assertFalse(str_starts_with(VehicleRentalClass::label('limousine'), 'fleet.rental_class.'));
        }
    }

    public function test_all_rental_class_values_have_valid_translations_in_both_locales(): void
    {
        foreach (['en', 'id'] as $locale) {
            App::setLocale($locale);
            foreach (VehicleRentalClass::values() as $value) {
                $label = VehicleRentalClass::label($value);
                $this->assertNotEmpty($label);
                $this->assertFalse(str_starts_with($label, 'fleet.rental_class.'), "Translation missing for {$value} in locale {$locale}");
            }
        }
    }
}
