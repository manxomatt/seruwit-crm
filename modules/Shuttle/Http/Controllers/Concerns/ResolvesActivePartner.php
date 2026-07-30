<?php

namespace Modules\Shuttle\Http\Controllers\Concerns;

use Illuminate\Support\Facades\Auth;
use Modules\Partners\Models\Partner;
use Modules\Shuttle\Models\ShuttleBooking;

trait ResolvesActivePartner
{
    protected function activePartner(): Partner
    {
        $user = Auth::user();

        abort_if($user === null, 403);

        $partner = Partner::query()
            ->where('portal_user_id', $user->id)
            ->where('status', 'active')
            ->first();

        abort_if($partner === null, 403, __('shuttle.portal.not_linked'));

        return $partner;
    }

    protected function ensureBookingBelongsToPartner(ShuttleBooking $booking, Partner $partner): void
    {
        abort_if((int) $booking->partner_id !== (int) $partner->id, 403);
    }

    protected function ensureInvoiceBelongsToPartner(\Modules\Invoicing\Models\Invoice $invoice, Partner $partner): void
    {
        abort_if((int) $invoice->partner_id !== (int) $partner->id, 403);
    }
}
