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
        $this->assertSame('Lainnya', VehicleRentalClass::label('other'));

        App::setLocale('en');
        $this->assertSame('Economy', VehicleRentalClass::label('economy'));
        $this->assertSame('MPV', VehicleRentalClass::label('mpv'));
        $this->assertSame('SUV', VehicleRentalClass::label('suv'));
        $this->assertSame('Van', VehicleRentalClass::label('van'));
        $this->assertSame('Premium', VehicleRentalClass::label('premium'));
        $this->assertSame('Other', VehicleRentalClass::label('other'));
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
