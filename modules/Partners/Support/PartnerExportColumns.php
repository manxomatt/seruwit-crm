<?php

namespace Modules\Partners\Support;

use Modules\Partners\Models\Partner;

/**
 * Flat partner columns for CSV/Excel export and CSV import templates.
 */
class PartnerExportColumns
{
    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::definitions());
    }

    /**
     * Columns always required when importing.
     *
     * @return list<string>
     */
    public static function requiredImportKeys(): array
    {
        return ['name', 'account_type', 'status'];
    }

    /**
     * Default columns selected in the export UI.
     *
     * @return list<string>
     */
    public static function defaultExportKeys(): array
    {
        return [
            'code',
            'name',
            'account_type',
            'email',
            'phone',
            'mobile',
            'is_customer',
            'is_supplier',
            'industry',
            'status',
        ];
    }

    /**
     * @return array<string, array{label_key: string, importable: bool}>
     */
    public static function definitions(): array
    {
        return [
            'code' => ['label_key' => 'partners.export.columns.code', 'importable' => true],
            'name' => ['label_key' => 'partners.export.columns.name', 'importable' => true],
            'account_type' => ['label_key' => 'partners.export.columns.account_type', 'importable' => true],
            'sub_type' => ['label_key' => 'partners.export.columns.sub_type', 'importable' => true],
            'email' => ['label_key' => 'partners.export.columns.email', 'importable' => true],
            'phone' => ['label_key' => 'partners.export.columns.phone', 'importable' => true],
            'mobile' => ['label_key' => 'partners.export.columns.mobile', 'importable' => true],
            'job_title' => ['label_key' => 'partners.export.columns.job_title', 'importable' => true],
            'website' => ['label_key' => 'partners.export.columns.website', 'importable' => true],
            'tax_id' => ['label_key' => 'partners.export.columns.tax_id', 'importable' => true],
            'id_number' => ['label_key' => 'partners.export.columns.id_number', 'importable' => true],
            'license_number' => ['label_key' => 'partners.export.columns.license_number', 'importable' => true],
            'license_expires_at' => ['label_key' => 'partners.export.columns.license_expires_at', 'importable' => true],
            'company_registry' => ['label_key' => 'partners.export.columns.company_registry', 'importable' => true],
            'reference' => ['label_key' => 'partners.export.columns.reference', 'importable' => true],
            'industry' => ['label_key' => 'partners.export.columns.industry', 'importable' => true],
            'title' => ['label_key' => 'partners.export.columns.title', 'importable' => true],
            'parent_code' => ['label_key' => 'partners.export.columns.parent_code', 'importable' => true],
            'is_customer' => ['label_key' => 'partners.export.columns.is_customer', 'importable' => true],
            'is_supplier' => ['label_key' => 'partners.export.columns.is_supplier', 'importable' => true],
            'credit_limit' => ['label_key' => 'partners.export.columns.credit_limit', 'importable' => true],
            'payment_term_days' => ['label_key' => 'partners.export.columns.payment_term_days', 'importable' => true],
            'price_list_code' => ['label_key' => 'partners.export.columns.price_list_code', 'importable' => true],
            'address' => ['label_key' => 'partners.export.columns.address', 'importable' => true],
            'notes' => ['label_key' => 'partners.export.columns.notes', 'importable' => true],
            'comment' => ['label_key' => 'partners.export.columns.comment', 'importable' => true],
            'status' => ['label_key' => 'partners.export.columns.status', 'importable' => true],
            'tags' => ['label_key' => 'partners.export.columns.tags', 'importable' => true],
        ];
    }

    /**
     * @param  list<string>  $columns
     * @return list<string>
     */
    public static function sanitize(array $columns): array
    {
        $allowed = self::keys();

        $selected = array_values(array_unique(array_filter(
            $columns,
            fn (mixed $column): bool => is_string($column) && in_array($column, $allowed, true),
        )));

        return $selected !== [] ? $selected : self::defaultExportKeys();
    }

    /**
     * @param  list<string>  $columns
     * @return list<string>
     */
    public static function headersFor(array $columns): array
    {
        return $columns;
    }

    /**
     * @param  list<string>  $columns
     * @return list<string|int|float|null>
     */
    public static function valuesFor(Partner $partner, array $columns): array
    {
        $row = [];

        foreach ($columns as $column) {
            $row[] = match ($column) {
                'code' => $partner->code,
                'name' => $partner->name,
                'account_type' => $partner->account_type,
                'sub_type' => $partner->sub_type,
                'email' => $partner->email,
                'phone' => $partner->phone,
                'mobile' => $partner->mobile,
                'job_title' => $partner->job_title,
                'website' => $partner->website,
                'tax_id' => $partner->tax_id,
                'id_number' => $partner->id_number,
                'license_number' => $partner->license_number,
                'license_expires_at' => $partner->license_expires_at?->format('Y-m-d'),
                'company_registry' => $partner->company_registry,
                'reference' => $partner->reference,
                'industry' => $partner->industry?->name,
                'title' => $partner->title?->name,
                'parent_code' => $partner->parent?->code,
                'is_customer' => $partner->customer_rank > 0 ? '1' : '0',
                'is_supplier' => $partner->supplier_rank > 0 ? '1' : '0',
                'credit_limit' => $partner->credit_limit,
                'payment_term_days' => $partner->payment_term_days,
                'price_list_code' => $partner->priceList?->code,
                'address' => $partner->address,
                'notes' => $partner->notes,
                'comment' => $partner->comment,
                'status' => $partner->status,
                'tags' => $partner->tags->pluck('name')->implode('|'),
                default => null,
            };
        }

        return $row;
    }

    /**
     * Sample row used in the downloadable CSV template.
     *
     * @return array<string, string>
     */
    public static function templateSample(): array
    {
        return [
            'code' => 'PART-000001',
            'name' => 'Acme Indonesia',
            'account_type' => 'company',
            'sub_type' => 'customer',
            'email' => 'billing@acme.example',
            'phone' => '0211234567',
            'mobile' => '081234567890',
            'job_title' => '',
            'website' => 'https://acme.example',
            'tax_id' => '10.0.0.1-012.000',
            'id_number' => '',
            'license_number' => '',
            'license_expires_at' => '',
            'company_registry' => '',
            'reference' => '',
            'industry' => 'Logistics',
            'title' => '',
            'parent_code' => '',
            'is_customer' => '1',
            'is_supplier' => '0',
            'credit_limit' => '10000000',
            'payment_term_days' => '30',
            'price_list_code' => '',
            'address' => 'Jakarta',
            'notes' => '',
            'comment' => '',
            'status' => 'active',
            'tags' => 'VIP|Retail',
        ];
    }

    /**
     * Columns included in the import template (all importable keys).
     *
     * @return list<string>
     */
    public static function templateKeys(): array
    {
        return array_values(array_filter(
            self::keys(),
            fn (string $key): bool => self::definitions()[$key]['importable'],
        ));
    }
}
