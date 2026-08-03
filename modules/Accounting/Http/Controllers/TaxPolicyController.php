<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Modules\Accounting\Http\Requests\UpdateTaxPoliciesRequest;
use Modules\Accounting\Models\TaxPolicy;
use Modules\Accounting\Support\TaxChannels;
use Modules\Accounting\Support\TaxCodeService;
use Modules\Accounting\Support\TaxPolicyService;
use Modules\Accounting\Support\TaxSettings;

class TaxPolicyController extends Controller
{
    public function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(TaxCodeService $taxCodes): Response
    {
        $policies = TaxPolicy::query()
            ->get(['channel', 'tax_code_id'])
            ->keyBy('channel');

        $default = TaxSettings::snapshot();

        $rows = collect(TaxChannels::available())
            ->map(function (array $definition) use ($policies): array {
                $policy = $policies->get($definition['channel']);

                return [
                    'channel' => $definition['channel'],
                    'module' => $definition['module'],
                    'label' => __($definition['label_key']),
                    'tax_code_id' => $policy?->tax_code_id,
                    'uses_default' => $policy === null || $policy->tax_code_id === null,
                ];
            })
            ->values()
            ->all();

        return inertia('Modules/Accounting/TaxPolicies/Index', [
            'policies' => $rows,
            'taxCodes' => $taxCodes->ppnOptions(),
            'workspaceDefault' => [
                'tax_code_id' => $default['tax_code_id'],
                'tax_code' => $default['tax_code'],
                'rate' => $default['rate'],
                'enabled' => $default['enabled'],
            ],
            'can' => [
                'manage' => auth()->user()?->hasPermissionFor('accounting', 'manage_tax') ?? false,
            ],
        ]);
    }

    public function update(UpdateTaxPoliciesRequest $request, TaxPolicyService $service): RedirectResponse
    {
        try {
            $service->sync($request->validated('policies'));
        } catch (ValidationException $e) {
            throw $e;
        }

        return redirect()
            ->route($this->getRoutePrefix().'.accounting.tax-policies.index')
            ->with('success', __('accounting.messages.tax_policies_updated'));
    }
}
