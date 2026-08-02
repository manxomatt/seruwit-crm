<?php

namespace Modules\Partners\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Partners\Http\Requests\ExportPartnersRequest;
use Modules\Partners\Http\Requests\ImportPartnersRequest;
use Modules\Partners\Http\Requests\StorePartnerRequest;
use Modules\Partners\Http\Requests\UpdatePartnerRequest;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Models\PartnerTag;
use Modules\Partners\Models\PartnerTitle;
use Modules\Partners\Support\PartnerCsvImporter;
use Modules\Partners\Support\PartnerExportColumns;
use Modules\Partners\Support\SimpleXlsxWriter;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Support\PriceListResolver;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PartnerController extends Controller
{
    protected function getRoutePrefix(): string
    {
        return 'module';
    }

    public function index(): Response
    {
        $user = Auth::user();

        $partners = $this->filteredPartnersQuery()
            ->with('industry', 'tags')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Partners/Index', [
            'partners' => $partners,
            'filters' => [
                'search' => request('search'),
                'status' => request('status'),
                'account_type' => request('account_type'),
                'role' => request('role'),
            ],
            'exportColumns' => collect(PartnerExportColumns::definitions())
                ->map(fn (array $definition, string $key): array => [
                    'key' => $key,
                    'label' => __($definition['label_key']),
                    'default' => in_array($key, PartnerExportColumns::defaultExportKeys(), true),
                ])
                ->values()
                ->all(),
            'can' => [
                'create' => $user->hasPermissionFor('partners', 'create'),
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
                'export' => $user->hasPermissionFor('partners', 'view'),
                'import' => $user->hasPermissionFor('partners', 'create'),
            ],
        ]);
    }

    public function export(ExportPartnersRequest $request): StreamedResponse|HttpResponse
    {
        $columns = PartnerExportColumns::sanitize($request->validated('columns'));
        $format = $request->validated('format');
        $timestamp = now()->format('Ymd-His');

        $partners = $this->filteredPartnersQuery($request->only([
            'search',
            'status',
            'account_type',
            'role',
        ]))
            ->with(array_values(array_filter([
                'industry',
                'title',
                'parent',
                'tags',
                PriceListResolver::tablesReady() ? 'priceList' : null,
            ])))
            ->orderBy('code')
            ->get();

        $headers = PartnerExportColumns::headersFor($columns);
        $rows = $partners->map(
            fn (Partner $partner): array => PartnerExportColumns::valuesFor($partner, $columns),
        )->all();

        if ($format === 'xlsx') {
            $binary = SimpleXlsxWriter::toString($headers, $rows);

            return response($binary, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="partners-'.$timestamp.'.xlsx"',
            ]);
        }

        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            // Excel-friendly UTF-8 BOM
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, 'partners-'.$timestamp.'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $columns = PartnerExportColumns::templateKeys();
        $sample = PartnerExportColumns::templateSample();

        return response()->streamDownload(function () use ($columns, $sample): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $columns);
            fputcsv($handle, array_map(
                fn (string $column): string => (string) ($sample[$column] ?? ''),
                $columns,
            ));
            fclose($handle);
        }, 'partners-import-template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(ImportPartnersRequest $request, PartnerCsvImporter $importer): RedirectResponse
    {
        $result = $importer->import($request->file('csv'));

        return redirect()
            ->route($this->getRoutePrefix().'.partners.index')
            ->with('success', __('partners.import.success', $result));
    }

    /**
     * @param  array{search?: string|null, status?: string|null, account_type?: string|null, role?: string|null}|null  $filters
     * @return Builder<Partner>
     */
    private function filteredPartnersQuery(?array $filters = null): Builder
    {
        $filters ??= [
            'search' => request('search'),
            'status' => request('status'),
            'account_type' => request('account_type'),
            'role' => request('role'),
        ];

        return Partner::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%")
                        ->orWhere('phone', 'ilike', "%{$search}%")
                        ->orWhere('mobile', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('tax_id', 'ilike', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['account_type'] ?? null, fn ($query, $type) => $query->where('account_type', $type))
            ->when($filters['role'] ?? null, function ($query, $role) {
                if ($role === 'customer') {
                    $query->where('customer_rank', '>', 0);
                } elseif ($role === 'supplier') {
                    $query->where('supplier_rank', '>', 0);
                }
            });
    }

    public function create(): Response
    {
        return Inertia::render('Modules/Partners/Create', [
            'industries' => PartnerIndustry::query()->where('is_active', true)->orderBy('name')->get(),
            'titles' => PartnerTitle::query()->orderBy('name')->get(),
            'tags' => PartnerTag::query()->orderBy('name')->get(),
            'partners' => Partner::query()->where('account_type', 'company')->orderBy('name')->get(['id', 'name', 'code']),
            'priceLists' => PriceListResolver::tablesReady()
                ? PriceList::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
                : [],
        ]);
    }

    public function store(StorePartnerRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? [];
        unset($validated['tag_ids']);

        if (! PriceListResolver::tablesReady()) {
            unset($validated['price_list_id']);
        }

        $validated['customer_rank'] = ($validated['is_customer'] ?? false) ? 1 : 0;
        $validated['supplier_rank'] = ($validated['is_supplier'] ?? false) ? 1 : 0;
        unset($validated['is_customer'], $validated['is_supplier']);

        $partner = Partner::create([
            ...$validated,
            'code' => Partner::nextCode(),
        ]);

        if ($tagIds) {
            $partner->tags()->sync($tagIds);
        }

        return redirect()->route($this->getRoutePrefix().'.partners.show', $partner)
            ->with('success', __('partners.messages.created'));
    }

    public function show(Partner $partner): Response
    {
        $user = Auth::user();

        $partner->load([
            'industry',
            'title',
            'tags',
            'parent',
            'children',
            'addresses',
            'bankAccounts',
        ]);

        return Inertia::render('Modules/Partners/Show', [
            'partner' => $partner,
            'can' => [
                'update' => $user->hasPermissionFor('partners', 'update'),
                'delete' => $user->hasPermissionFor('partners', 'delete'),
            ],
        ]);
    }

    public function edit(Partner $partner): Response
    {
        $partner->load('tags');

        return Inertia::render('Modules/Partners/Edit', [
            'partner' => $partner,
            'industries' => PartnerIndustry::query()->where('is_active', true)->orderBy('name')->get(),
            'titles' => PartnerTitle::query()->orderBy('name')->get(),
            'tags' => PartnerTag::query()->orderBy('name')->get(),
            'partners' => Partner::query()
                ->where('account_type', 'company')
                ->where('id', '!=', $partner->id)
                ->orderBy('name')
                ->get(['id', 'name', 'code']),
            'priceLists' => PriceListResolver::tablesReady()
                ? PriceList::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])
                : [],
            'portalUsers' => \App\Models\User::query()->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function update(UpdatePartnerRequest $request, Partner $partner): RedirectResponse
    {
        $validated = $request->validated();
        $tagIds = $validated['tag_ids'] ?? null;
        unset($validated['tag_ids']);

        if (! PriceListResolver::tablesReady()) {
            unset($validated['price_list_id']);
        }

        if (array_key_exists('is_customer', $validated)) {
            $validated['customer_rank'] = $validated['is_customer'] ? max(1, $partner->customer_rank) : 0;
            unset($validated['is_customer']);
        }

        if (array_key_exists('is_supplier', $validated)) {
            $validated['supplier_rank'] = $validated['is_supplier'] ? max(1, $partner->supplier_rank) : 0;
            unset($validated['is_supplier']);
        }

        if (array_key_exists('is_blacklisted', $validated)) {
            $blacklisted = (bool) $validated['is_blacklisted'];
            $validated['is_blacklisted'] = $blacklisted;
            $validated['blacklisted_at'] = $blacklisted
                ? ($partner->blacklisted_at ?? now())
                : null;

            if (! $blacklisted) {
                $validated['blacklist_reason'] = null;
            }
        }

        $partner->update($validated);

        if ($tagIds !== null) {
            $partner->tags()->sync($tagIds);
        }

        return redirect()->route($this->getRoutePrefix().'.partners.show', $partner)
            ->with('success', __('partners.messages.updated'));
    }

    public function destroy(Partner $partner): RedirectResponse
    {
        try {
            DB::transaction(fn () => $partner->delete());
        } catch (QueryException) {
            return back()->with('error', __('partners.messages.delete_referenced'));
        }

        return redirect()->route($this->getRoutePrefix().'.partners.index')
            ->with('success', __('partners.messages.deleted'));
    }
}
