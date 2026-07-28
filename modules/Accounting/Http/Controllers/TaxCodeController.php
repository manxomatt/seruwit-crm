<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Http\Requests\StoreTaxCodeRequest;
use Modules\Accounting\Http\Requests\UpdateTaxCodeRequest;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\TaxCode;
use Modules\Accounting\Support\TaxCodeService;

class TaxCodeController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $codes = TaxCode::query()
            ->with([
                'outputAccount:id,code,name',
                'inputAccount:id,code,name',
                'whtAccount:id,code,name',
            ])
            ->orderBy('category')
            ->orderBy('code')
            ->get()
            ->map(fn (TaxCode $code): array => $this->serialize($code));

        return inertia('Modules/Accounting/TaxCodes/Index', [
            'codes' => $codes,
            'can' => [
                'manage' => auth()->user()?->hasPermissionFor('accounting', 'manage_tax') ?? false,
            ],
        ]);
    }

    public function create(): Response
    {
        return inertia('Modules/Accounting/TaxCodes/Create', [
            'categories' => TaxCode::CATEGORIES,
            'calculations' => TaxCode::CALCULATIONS,
            'directions' => TaxCode::DIRECTIONS,
            'accounts' => $this->accountOptions(),
        ]);
    }

    public function store(StoreTaxCodeRequest $request, TaxCodeService $service): RedirectResponse
    {
        try {
            $service->create($request->validated());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.tax-codes.index')
            ->with('success', __('accounting.messages.tax_code_created'));
    }

    public function edit(TaxCode $taxCode): Response
    {
        $taxCode->load(['outputAccount:id,code,name', 'inputAccount:id,code,name', 'whtAccount:id,code,name']);

        return inertia('Modules/Accounting/TaxCodes/Edit', [
            'taxCode' => $this->serialize($taxCode),
            'categories' => TaxCode::CATEGORIES,
            'calculations' => TaxCode::CALCULATIONS,
            'directions' => TaxCode::DIRECTIONS,
            'accounts' => $this->accountOptions(),
        ]);
    }

    public function update(UpdateTaxCodeRequest $request, TaxCode $taxCode, TaxCodeService $service): RedirectResponse
    {
        try {
            $service->update($taxCode, $request->validated());
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.tax-codes.index')
            ->with('success', __('accounting.messages.tax_code_updated'));
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(TaxCode $code): array
    {
        return [
            'id' => $code->id,
            'code' => $code->code,
            'name' => $code->name,
            'category' => $code->category,
            'rate' => (float) $code->rate,
            'calculation' => $code->calculation,
            'direction' => $code->direction,
            'output_account_id' => $code->output_account_id,
            'input_account_id' => $code->input_account_id,
            'wht_account_id' => $code->wht_account_id,
            'is_default' => $code->is_default,
            'is_active' => $code->is_active,
            'notes' => $code->notes,
            'output_account' => $code->outputAccount
                ? ['id' => $code->outputAccount->id, 'code' => $code->outputAccount->code, 'name' => $code->outputAccount->name]
                : null,
            'input_account' => $code->inputAccount
                ? ['id' => $code->inputAccount->id, 'code' => $code->inputAccount->code, 'name' => $code->inputAccount->name]
                : null,
            'wht_account' => $code->whtAccount
                ? ['id' => $code->whtAccount->id, 'code' => $code->whtAccount->code, 'name' => $code->whtAccount->name]
                : null,
        ];
    }

    /**
     * @return list<array{id: int, code: string, name: string, type: string}>
     */
    private function accountOptions(): array
    {
        return Account::query()
            ->where('is_postable', true)
            ->where('is_active', true)
            ->whereIn('type', [Account::TYPE_ASSET, Account::TYPE_LIABILITY])
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type'])
            ->map(fn (Account $account): array => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
            ])
            ->all();
    }
}
