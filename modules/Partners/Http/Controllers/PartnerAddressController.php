<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Partners\Http\Requests\StorePartnerAddressRequest;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerAddress;

class PartnerAddressController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function store(StorePartnerAddressRequest $request, Partner $partner): RedirectResponse
    {
        $validated = $request->validated();

        if (! empty($validated['is_default'])) {
            $partner->addresses()
                ->where('type', $validated['type'])
                ->update(['is_default' => false]);
        }

        $partner->addresses()->create($validated);

        return back()->with('success', 'Alamat berhasil ditambahkan.');
    }

    public function destroy(Partner $partner, PartnerAddress $address): RedirectResponse
    {
        abort_unless($address->partner_id === $partner->id, 404);

        $address->delete();

        return back()->with('success', 'Alamat berhasil dihapus.');
    }
}
