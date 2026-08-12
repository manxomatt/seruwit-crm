<?php

namespace Modules\Rental\Support;

use App\Models\Setting;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class DocumentTemplateManager
{
    public const GROUP = 'rental_internal';

    public const KEY_DOCUMENT_TEMPLATES = 'rental.document_templates';

    public const CODE_CONTRACT = 'rental_contract';

    public const CODE_HANDOVER = 'rental_handover';

    public const CODE_INVOICE = 'rental_invoice';

    public const LAYOUT_CLASSIC = 'classic';

    public const LAYOUT_COMPACT = 'compact';

    public const LAYOUT_CORPORATE = 'corporate';

    public const VALID_CODES = [
        self::CODE_CONTRACT,
        self::CODE_HANDOVER,
        self::CODE_INVOICE,
    ];

    public const VALID_LAYOUTS = [
        self::LAYOUT_CLASSIC,
        self::LAYOUT_COMPACT,
        self::LAYOUT_CORPORATE,
    ];

    public const CONTRACT_OPTIONS = [
        'show_logo',
        'show_address',
        'show_phone',
        'show_footer',
        'show_signature',
        'show_company_info',
    ];

    public const HANDOVER_OPTIONS = [
        'show_logo',
        'show_address',
        'show_phone',
        'show_footer',
        'show_signature',
        'show_damage_section',
    ];

    public const INVOICE_OPTIONS = [
        'show_logo',
        'show_address',
        'show_phone',
        'show_footer',
        'show_signature',
        'show_company_info',
        'show_paid_stamp',
    ];

    public static function defaults(): array
    {
        return [
            self::CODE_CONTRACT => [
                'name' => 'Template Kontrak Default',
                'layout_preset' => self::LAYOUT_CLASSIC,
                'content' => [
                    'title' => 'Perjanjian Sewa Kendaraan',
                    'subtitle' => '{{ rental.code }} - {{ today }}',
                    'intro_html' => '<p>Dokumen ini merupakan perjanjian resmi antara pihak penyedia kendaraan dan penyewa. Mohon bacakan ketentuan di bawah ini sebelum menandatangani.</p>',
                    'terms_html' => '<ol><li>Penyewa bertanggung jawab atas kondisi kendaraan selama masa sewa.</li><li>Kerusakan, kehilangan, dan kelebihan kilometer ditagihkan sesuai tarif yang berlaku.</li><li>Deposit dapat dipotong untuk biaya kerusakan / tagihan tertunggak, sisanya dikembalikan setelah settlement.</li><li>Kendaraan dikembalikan sesuai tanggal perjanjian kecuali diperpanjang secara tertulis.</li><li>Serah terima dicatat pada berita acara checkout / return.</li></ol>',
                    'notes_label' => 'Catatan',
                    'footer_html' => '<p>Dokumen ini sah tanpa cap basah.</p>',
                ],
                'options' => [
                    'show_logo' => true,
                    'show_address' => true,
                    'show_phone' => true,
                    'show_footer' => true,
                    'show_signature' => true,
                    'show_company_info' => true,
                ],
            ],
            self::CODE_HANDOVER => [
                'name' => 'Template BA Serah Terima Default',
                'layout_preset' => self::LAYOUT_CLASSIC,
                'content' => [
                    'title' => 'Berita Acara Serah Terima',
                    'subtitle' => '{{ rental.code }} - {{ vehicle.name }} ({{ vehicle.plate_number }})',
                    'intro_html' => '<p>Berita acara ini mencatat kondisi kendaraan pada saat serah terima.</p>',
                    'checkout_label' => 'Checkout (Serah ke Penyewa)',
                    'return_label' => 'Return (Kembali dari Penyewa)',
                    'footer_html' => '<p>Berita acara ini disetujui oleh kedua belah pihak.</p>',
                ],
                'options' => [
                    'show_logo' => true,
                    'show_address' => true,
                    'show_phone' => true,
                    'show_footer' => true,
                    'show_signature' => true,
                    'show_damage_section' => true,
                ],
            ],
            self::CODE_INVOICE => [
                'name' => 'Template Invoice Default',
                'layout_preset' => self::LAYOUT_CLASSIC,
                'content' => [
                    'title' => 'Invoice',
                    'subtitle' => '{{ invoice.code }}',
                    'bill_to_label' => 'Ditagihkan kepada',
                    'footer_html' => '<p>Terima kasih atas kepercayaan Anda.</p>',
                ],
                'options' => [
                    'show_logo' => true,
                    'show_address' => true,
                    'show_phone' => true,
                    'show_footer' => true,
                    'show_signature' => true,
                    'show_company_info' => true,
                    'show_paid_stamp' => true,
                ],
            ],
        ];
    }

    public static function all(): array
    {
        $raw = Setting::getValue(self::KEY_DOCUMENT_TEMPLATES);

        if (! is_string($raw) || $raw === '') {
            return self::defaults();
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return self::defaults();
        }

        return self::mergeWithDefaults($decoded);
    }

    public static function get(string $code): array
    {
        $all = self::all();

        return $all[$code] ?? self::defaults()[$code] ?? self::defaults()[self::CODE_CONTRACT];
    }

    public static function update(string $code, array $data): void
    {
        if (! in_array($code, self::VALID_CODES, true)) {
            return;
        }

        $all = self::all();

        if (isset($data['name'])) {
            $all[$code]['name'] = (string) $data['name'];
        }

        if (isset($data['layout_preset']) && in_array($data['layout_preset'], self::VALID_LAYOUTS, true)) {
            $all[$code]['layout_preset'] = $data['layout_preset'];
        }

        if (isset($data['content']) && is_array($data['content'])) {
            $all[$code]['content'] = array_merge($all[$code]['content'] ?? [], $data['content']);
        }

        if (isset($data['options']) && is_array($data['options'])) {
            $allowed = match ($code) {
                self::CODE_CONTRACT => self::CONTRACT_OPTIONS,
                self::CODE_HANDOVER => self::HANDOVER_OPTIONS,
                self::CODE_INVOICE => self::INVOICE_OPTIONS,
                default => [],
            };

            $all[$code]['options'] = array_merge($all[$code]['options'] ?? [], Arr::only($data['options'], $allowed));
        }

        self::put(self::KEY_DOCUMENT_TEMPLATES, json_encode($all));
    }

    public static function reset(string $code): void
    {
        if (! in_array($code, self::VALID_CODES, true)) {
            return;
        }

        $all = self::all();
        $all[$code] = self::defaults()[$code];

        self::put(self::KEY_DOCUMENT_TEMPLATES, json_encode($all));
    }

    public static function resolveForPdf(string $code, array $context): array
    {
        $template = self::get($code);
        $content = $template['content'] ?? [];
        $options = $template['options'] ?? [];

        $resolved = [
            'name' => $template['name'] ?? '',
            'layout_preset' => $template['layout_preset'] ?? self::LAYOUT_CLASSIC,
            'content' => [],
            'options' => $options,
        ];

        foreach ($content as $key => $value) {
            if (is_string($value)) {
                $resolved['content'][$key] = self::resolvePlaceholders($value, $context);
            } else {
                $resolved['content'][$key] = $value;
            }
        }

        return $resolved;
    }

    public static function resolvePlaceholders(string $text, array $context): string
    {
        if (Str::contains($text, '{{') === false) {
            return $text;
        }

        $today = now()->format('d/m/Y');

        $values = [
            'rental.code' => $context['rental']['code'] ?? '',
            'rental.start_date' => $context['rental']['start_date']?->format('d/m/Y') ?? '',
            'rental.end_date' => $context['rental']['end_date']?->format('d/m/Y') ?? '',
            'rental.total_amount' => self::formatMoney($context['rental']['total_amount'] ?? 0),
            'rental.base_amount' => self::formatMoney($context['rental']['base_amount'] ?? 0),
            'rental.deposit_amount' => self::formatMoney($context['rental']['deposit_amount'] ?? 0),
            'partner.name' => $context['partner']['name'] ?? '',
            'partner.code' => $context['partner']['code'] ?? '',
            'vehicle.name' => $context['vehicle']['name'] ?? '',
            'vehicle.plate_number' => $context['vehicle']['plate_number'] ?? '',
            'company.name' => $context['company']['name'] ?? '',
            'today' => $today,
            'invoice.code' => $context['invoice']['code'] ?? '',
            'invoice.issue_date' => $context['invoice']['issue_date']?->format('d/m/Y') ?? '',
            'invoice.due_date' => $context['invoice']['due_date']?->format('d/m/Y') ?? '',
            'invoice.total' => self::formatMoney($context['invoice']['total'] ?? 0),
            'checkout.time' => $context['checkout']['time']?->format('d/m/Y H:i') ?? '',
            'return.time' => $context['return']['time']?->format('d/m/Y H:i') ?? '',
        ];

        foreach ($values as $placeholder => $value) {
            $text = Str::replace('{{ '.$placeholder.' }}', $value, $text);
        }

        return $text;
    }

    public static function optionsFor(string $code): array
    {
        return match ($code) {
            self::CODE_CONTRACT => self::CONTRACT_OPTIONS,
            self::CODE_HANDOVER => self::HANDOVER_OPTIONS,
            self::CODE_INVOICE => self::INVOICE_OPTIONS,
            default => [],
        };
    }

    private static function mergeWithDefaults(array $decoded): array
    {
        $defaults = self::defaults();
        $result = [];

        foreach (self::VALID_CODES as $code) {
            $result[$code] = array_merge($defaults[$code], $decoded[$code] ?? []);
        }

        return $result;
    }

    private static function put(string $key, string $value): void
    {
        Setting::query()->updateOrCreate(
            ['key' => $key],
            [
                'group' => self::GROUP,
                'value' => $value,
                'type' => 'json',
                'label' => 'Document Templates',
                'description' => 'Managed via Rental → Settings → Document Templates.',
                'is_public' => false,
                'sort_order' => 50,
            ],
        );
    }

    private static function formatMoney(int|float|string $amount): string
    {
        return 'Rp '.number_format((float) $amount, 0, ',', '.');
    }
}
