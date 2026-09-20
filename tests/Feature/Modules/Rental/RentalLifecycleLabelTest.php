<?php

namespace Tests\Feature\Modules\Rental;

use Illuminate\Support\Facades\App;
use Modules\Rental\Support\DocumentTemplateManager;
use Tests\TestCase;

class RentalLifecycleLabelTest extends TestCase
{
    public function test_indonesian_labels_separate_issuing_a_booking_from_handing_over_the_vehicle(): void
    {
        App::setLocale('id');

        $this->assertSame('Siap diambil', __('rental.status.confirmed'));
        $this->assertSame('Sedang disewa', __('rental.status.active'));
        $this->assertSame('Terbitkan booking', __('rental.actions.confirm'));
        $this->assertSame('Serahkan unit', __('rental.actions.checkout'));
        $this->assertSame('Tinjau & simpan', __('rental.wizard.steps.6'));
        $this->assertSame('Serah terima', __('rental.post_confirm.steps.8'));
        $this->assertSame('Pembayaran', __('rental.post_confirm.steps.7'));
        $this->assertSame('Pengembalian', __('rental.post_confirm.steps.10'));
        $this->assertSame('Booking diterbitkan. Unit masih di pool.', __('rental.messages.confirmed'));
        $this->assertSame('Unit diserahkan. Sewa sedang berjalan.', __('rental.messages.checked_out'));
        $this->assertSame('Hanya rental Siap diambil yang dapat diserahkan.', __('rental.errors.checkout_confirmed_only'));
        $this->assertSame('Kontrak ditandatangani. Tunjukkan layar ini kepada staf depot. Unit belum diserahkan.', __('rental.public.pickup_requested'));
        $this->assertSame('Jadwal terkunci · unit masih di pool', __('rental.status_hint.confirmed'));
        $this->assertSame('Pelanggan sudah ttd kontrak · serahkan unit', __('rental.status_hint.confirmed_awaiting_handover'));
        $this->assertSame('Kontrak sudah ditandatangani · unit belum diserahkan', __('rental.status_hint.confirmed_awaiting_handover_passenger'));
    }

    public function test_english_labels_separate_issuing_a_booking_from_handing_over_the_vehicle(): void
    {
        App::setLocale('en');

        $this->assertSame('Ready for pickup', __('rental.status.confirmed'));
        $this->assertSame('On hire', __('rental.status.active'));
        $this->assertSame('Issue booking', __('rental.actions.confirm'));
        $this->assertSame('Hand over vehicle', __('rental.actions.checkout'));
        $this->assertSame('Review & save', __('rental.wizard.steps.6'));
        $this->assertSame('Handover', __('rental.post_confirm.steps.8'));
        $this->assertSame('Booking issued. The vehicle is still at the depot.', __('rental.messages.confirmed'));
        $this->assertSame('Vehicle handed over. The rental is now on hire.', __('rental.messages.checked_out'));
        $this->assertSame('Only Ready for pickup rentals can be handed over.', __('rental.errors.checkout_confirmed_only'));
        $this->assertSame('Contract signed. Show this screen to depot staff. The vehicle has not been handed over yet.', __('rental.public.pickup_requested'));
        $this->assertSame('Dates locked · vehicle still at the depot', __('rental.status_hint.confirmed'));
        $this->assertSame('Customer signed the contract · hand over the vehicle', __('rental.status_hint.confirmed_awaiting_handover'));
        $this->assertSame('Contract signed · vehicle has not been handed over yet', __('rental.status_hint.confirmed_awaiting_handover_passenger'));
    }

    public function test_default_handover_pdf_labels_do_not_use_checkout_jargon(): void
    {
        $handover = DocumentTemplateManager::defaults()[DocumentTemplateManager::CODE_HANDOVER];

        $this->assertSame('Serah terima ke penyewa', $handover['content']['checkout_label']);
        $this->assertSame('Pengembalian dari penyewa', $handover['content']['return_label']);
        $this->assertStringNotContainsStringIgnoringCase('checkout', $handover['content']['checkout_label']);
        $this->assertStringNotContainsStringIgnoringCase('check out', $handover['content']['checkout_label']);
    }
}
