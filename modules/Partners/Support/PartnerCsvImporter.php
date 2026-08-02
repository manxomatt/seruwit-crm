<?php

namespace Modules\Partners\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Modules\Partners\Models\Partner;
use Modules\Partners\Models\PartnerIndustry;
use Modules\Partners\Models\PartnerTag;
use Modules\Partners\Models\PartnerTitle;
use Modules\Sales\Models\PriceList;
use Modules\Sales\Support\PriceListResolver;

class PartnerCsvImporter
{
    /**
     * @return array{created: int, updated: int, skipped: int}
     */
    public function import(UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if ($path === false) {
            throw ValidationException::withMessages([
                'csv' => __('partners.import.errors.unreadable'),
            ]);
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw ValidationException::withMessages([
                'csv' => __('partners.import.errors.unreadable'),
            ]);
        }

        try {
            $headerRow = fgetcsv($handle);
            if ($headerRow === false || $headerRow === [null] || $headerRow === []) {
                throw ValidationException::withMessages([
                    'csv' => __('partners.import.errors.empty'),
                ]);
            }

            $map = $this->mapHeaders($headerRow);
            foreach (PartnerExportColumns::requiredImportKeys() as $required) {
                if (! isset($map[$required])) {
                    throw ValidationException::withMessages([
                        'csv' => __('partners.import.errors.missing_headers', [
                            'columns' => implode(', ', PartnerExportColumns::requiredImportKeys()),
                        ]),
                    ]);
                }
            }

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $rowNumber = 1;
            $errors = [];

            while (($cells = fgetcsv($handle)) !== false) {
                $rowNumber++;

                if ($this->rowIsBlank($cells)) {
                    continue;
                }

                try {
                    $payload = $this->rowToPayload($cells, $map);
                    $result = $this->upsertPartner($payload);
                    if ($result === 'created') {
                        $created++;
                    } elseif ($result === 'updated') {
                        $updated++;
                    } else {
                        $skipped++;
                    }
                } catch (ValidationException $exception) {
                    $message = collect($exception->errors())->flatten()->first() ?? __('partners.import.errors.row_invalid');
                    $errors[] = __('partners.import.errors.row', ['row' => $rowNumber, 'message' => $message]);
                } catch (\Throwable $exception) {
                    $errors[] = __('partners.import.errors.row', [
                        'row' => $rowNumber,
                        'message' => $exception->getMessage(),
                    ]);
                }

                if (count($errors) >= 10) {
                    break;
                }
            }
        } finally {
            fclose($handle);
        }

        if ($errors !== []) {
            throw ValidationException::withMessages([
                'csv' => implode(' ', $errors),
            ]);
        }

        return compact('created', 'updated', 'skipped');
    }

    /**
     * @param  list<string|null>  $headerRow
     * @return array<string, int>
     */
    private function mapHeaders(array $headerRow): array
    {
        $aliases = [
            'code' => ['code', 'partner_code', 'kode'],
            'name' => ['name', 'partner_name', 'nama'],
            'account_type' => ['account_type', 'account type', 'tipe_akun', 'tipe akun'],
            'sub_type' => ['sub_type', 'sub type', 'sub_tipe'],
            'email' => ['email'],
            'phone' => ['phone', 'telepon', 'telp'],
            'mobile' => ['mobile', 'whatsapp', 'hp'],
            'job_title' => ['job_title', 'job title', 'jabatan'],
            'website' => ['website'],
            'tax_id' => ['tax_id', 'npwp', 'tax id'],
            'id_number' => ['id_number', 'nik', 'ktp'],
            'license_number' => ['license_number', 'sim'],
            'license_expires_at' => ['license_expires_at', 'sim_expiry'],
            'company_registry' => ['company_registry'],
            'reference' => ['reference', 'referensi'],
            'industry' => ['industry', 'industri'],
            'title' => ['title', 'gelar'],
            'parent_code' => ['parent_code', 'parent code', 'kode_induk'],
            'is_customer' => ['is_customer', 'customer', 'pelanggan'],
            'is_supplier' => ['is_supplier', 'supplier', 'pemasok'],
            'credit_limit' => ['credit_limit', 'credit limit', 'batas_kredit'],
            'payment_term_days' => ['payment_term_days', 'payment term days', 'termin'],
            'price_list_code' => ['price_list_code', 'price list code', 'kode_harga'],
            'address' => ['address', 'alamat'],
            'notes' => ['notes', 'catatan'],
            'comment' => ['comment', 'komentar'],
            'status' => ['status'],
            'tags' => ['tags', 'tag'],
        ];

        $map = [];
        foreach ($headerRow as $index => $header) {
            $normalized = $this->normalizeHeader((string) $header);
            if ($normalized === '') {
                continue;
            }

            foreach ($aliases as $key => $names) {
                if (in_array($normalized, $names, true)) {
                    $map[$key] = $index;
                    break;
                }
            }
        }

        return $map;
    }

    private function normalizeHeader(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;

        return strtolower(trim($header));
    }

    /**
     * @param  list<string|null>  $cells
     */
    private function rowIsBlank(array $cells): bool
    {
        foreach ($cells as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    /**
     * @param  list<string|null>  $cells
     * @param  array<string, int>  $map
     * @return array<string, mixed>
     */
    private function rowToPayload(array $cells, array $map): array
    {
        $get = function (string $key) use ($cells, $map): ?string {
            if (! isset($map[$key])) {
                return null;
            }

            $value = trim((string) ($cells[$map[$key]] ?? ''));

            return $value === '' ? null : $value;
        };

        $name = $get('name');
        $accountType = strtolower((string) ($get('account_type') ?? 'company'));
        $status = strtolower((string) ($get('status') ?? 'active'));

        if ($name === null) {
            throw ValidationException::withMessages([
                'name' => __('partners.import.errors.name_required'),
            ]);
        }

        if (! in_array($accountType, ['company', 'individual'], true)) {
            throw ValidationException::withMessages([
                'account_type' => __('partners.validation.account_type_in'),
            ]);
        }

        if (! in_array($status, ['active', 'inactive'], true)) {
            throw ValidationException::withMessages([
                'status' => __('partners.validation.status_in'),
            ]);
        }

        $subType = $get('sub_type');
        if ($subType !== null) {
            $subType = strtolower($subType);
            if (! in_array($subType, ['customer', 'supplier', 'other'], true)) {
                throw ValidationException::withMessages([
                    'sub_type' => __('partners.import.errors.sub_type_in'),
                ]);
            }
        }

        $industryName = $get('industry');
        $industryId = null;
        if ($industryName !== null) {
            $industry = PartnerIndustry::findByLocalizedName($industryName);
            if ($industry === null) {
                $industry = PartnerIndustry::query()->create([
                    'name' => PartnerIndustry::normalizeTranslations($industryName),
                    'is_active' => true,
                ]);
            }
            $industryId = $industry->id;
        }

        $titleName = $get('title');
        $titleId = null;
        if ($titleName !== null) {
            $title = PartnerTitle::query()->firstOrCreate(
                ['name' => $titleName],
                ['short_name' => $titleName],
            );
            $titleId = $title->id;
        }

        $parentCode = $get('parent_code');
        $parentId = null;
        if ($parentCode !== null) {
            $parent = Partner::query()->where('code', $parentCode)->first();
            if ($parent === null) {
                throw ValidationException::withMessages([
                    'parent_code' => __('partners.import.errors.parent_not_found', ['code' => $parentCode]),
                ]);
            }
            $parentId = $parent->id;
        }

        $priceListId = null;
        $priceListCode = $get('price_list_code');
        if ($priceListCode !== null && PriceListResolver::tablesReady()) {
            $priceList = PriceList::query()->where('code', $priceListCode)->first();
            if ($priceList === null) {
                throw ValidationException::withMessages([
                    'price_list_code' => __('partners.import.errors.price_list_not_found', ['code' => $priceListCode]),
                ]);
            }
            $priceListId = $priceList->id;
        }

        $tagNames = [];
        $tagsRaw = $get('tags');
        if ($tagsRaw !== null) {
            $tagNames = array_values(array_filter(array_map(
                fn (string $tag): string => trim($tag),
                preg_split('/[|,;]/', $tagsRaw) ?: [],
            )));
        }

        return [
            'code' => $get('code'),
            'name' => $name,
            'account_type' => $accountType,
            'sub_type' => $subType,
            'email' => $get('email'),
            'phone' => $get('phone'),
            'mobile' => $get('mobile'),
            'job_title' => $get('job_title'),
            'website' => $get('website'),
            'tax_id' => $get('tax_id'),
            'id_number' => $get('id_number'),
            'license_number' => $get('license_number'),
            'license_expires_at' => $get('license_expires_at'),
            'company_registry' => $get('company_registry'),
            'reference' => $get('reference'),
            'industry_id' => $industryId,
            'title_id' => $titleId,
            'parent_id' => $parentId,
            'customer_rank' => $this->toBool($get('is_customer')) ? 1 : 0,
            'supplier_rank' => $this->toBool($get('is_supplier')) ? 1 : 0,
            'credit_limit' => $get('credit_limit'),
            'payment_term_days' => $get('payment_term_days'),
            'price_list_id' => $priceListId,
            'address' => $get('address'),
            'notes' => $get('notes'),
            'comment' => $get('comment'),
            'status' => $status,
            'tag_names' => $tagNames,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function upsertPartner(array $payload): string
    {
        $tagNames = $payload['tag_names'] ?? [];
        unset($payload['tag_names']);

        if (! Schema::hasColumn('partners', 'payment_term_days')) {
            unset($payload['payment_term_days']);
        }

        if (! PriceListResolver::tablesReady()) {
            unset($payload['price_list_id']);
        }

        return DB::transaction(function () use ($payload, $tagNames): string {
            $existing = null;
            if (! empty($payload['code'])) {
                $existing = Partner::query()->where('code', $payload['code'])->first();
            }

            if ($existing === null) {
                if (empty($payload['code'])) {
                    $payload['code'] = Partner::nextCode();
                }

                $partner = Partner::query()->create($payload);
                $this->syncTags($partner, $tagNames);

                return 'created';
            }

            $existing->update($payload);
            $this->syncTags($existing, $tagNames);

            return 'updated';
        });
    }

    /**
     * @param  list<string>  $tagNames
     */
    private function syncTags(Partner $partner, array $tagNames): void
    {
        if ($tagNames === []) {
            return;
        }

        $ids = [];
        foreach ($tagNames as $name) {
            $tag = PartnerTag::query()->firstOrCreate(['name' => $name]);
            $ids[] = $tag->id;
        }

        $partner->tags()->sync($ids);
    }

    private function toBool(?string $value): bool
    {
        if ($value === null) {
            return false;
        }

        return in_array(strtolower($value), ['1', 'true', 'yes', 'y', 'ya'], true);
    }
}
