<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Modules\Partners\Http\Requests\StorePartnerBankAccountRequest;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerBankAccount;

class PartnerBankAccountController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function store(StorePartnerBankAccountRequest $request, Partner $partner): RedirectResponse
    {
        $partner->bankAccounts()->create($request->validated());

        return back()->with('success', 'Rekening bank berhasil ditambahkan.');
    }

    public function destroy(Partner $partner, PartnerBankAccount $bankAccount): RedirectResponse
    {
        abort_unless($bankAccount->partner_id === $partner->id, 404);

        $bankAccount->delete();

        return back()->with('success', 'Rekening bank berhasil dihapus.');
    }
}
