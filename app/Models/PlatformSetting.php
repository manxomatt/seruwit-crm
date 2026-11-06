<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * A platform-global setting, stored in the CENTRAL schema and managed only by
 * the central admin.
 *
 * Counterpart to App\Models\Setting, which is tenant-scoped (each tenant admin
 * manages its own values in the tenant schema). Pinned to the central
 * connection — like ModuleSetting — so it reads correctly even from tenant
 * context, where the default connection points at the tenant schema.
 */
class PlatformSetting extends Model
{
    public const KEY_CAPACITY_BUSINESS_MODEL = 'capacity.business_model';

    public const KEY_PLATFORM_NAME = 'general.platform_name';

    public const KEY_PLATFORM_TAGLINE = 'general.platform_tagline';

    public const KEY_ADMIN_EMAIL = 'general.admin_email';

    public const KEY_SUPPORT_URL = 'general.support_url';

    public const KEY_ALLOW_PUBLIC_REGISTRATION = 'general.allow_public_registration';

    public const KEY_DEFAULT_TENANT_TRIAL_DAYS = 'general.default_tenant_trial_days';

    public const KEY_MAINTENANCE_MODE = 'general.maintenance_mode';

    public const KEY_MAINTENANCE_MESSAGE = 'general.maintenance_message';

    public const KEY_AI_OCR_ENABLED = 'general.ai_ocr_enabled';

    public const KEY_AI_QUICK_FILL_ENABLED = 'general.ai_quick_fill_enabled';

    public const KEY_AI_GEMINI_API_KEY = 'ai.gemini_api_key';

    public const KEY_AI_GEMINI_MODEL = 'ai.gemini_model';

    public const KEY_AI_GEMINI_BASE_URL = 'ai.gemini_base_url';

    public const KEY_AI_KYC_DRIVER = 'ai.kyc_driver';

    public const KEY_AI_GROQ_API_KEY = 'ai.groq_api_key';

    public const KEY_AI_GROQ_MODEL = 'ai.groq_model';

    public const KEY_AI_GROQ_BASE_URL = 'ai.groq_base_url';

    public const KEY_VEHICLE_TRIAL_DURATION_DAYS = 'capacity.vehicle_trial_duration_days';

    public const KEY_MAX_TRIAL_VEHICLES_PER_TENANT = 'capacity.max_trial_vehicles_per_tenant';

    public const KEY_PREVENT_DUPLICATE_PLATE_TRIAL = 'capacity.prevent_duplicate_plate_trial';

    public const KEY_CAPACITY_CREDITS_LIFETIME = 'capacity_credits_lifetime_enabled';

    public const KEY_VEHICLE_ACTIVATION_DURATION_DAYS = 'vehicle_activation_duration_days';

    public const KEY_VEHICLE_GRACE_PERIOD_DAYS = 'vehicle_grace_period_days';

    public const KEY_PAUSE_DURING_MAINTENANCE = 'pause_during_maintenance_enabled';

    public const KEY_SHOW_DASHBOARD_PRICING_SECTION = 'capacity.show_dashboard_pricing_section';

    public const KEY_SHOW_VEHICLE_QUOTA_SECTION = 'capacity.show_vehicle_quota_section';

    public const MODEL_PER_VEHICLE_TRIAL = 'per_vehicle_trial';

    public const MODEL_TENANT_QUOTA = 'tenant_quota';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'group',
        'value',
        'type',
        'label',
        'description',
        'is_public',
        'sort_order',
    ];

    /**
     * Pinned to the central connection. Without this, reading a platform setting
     * from tenant context would hit the tenant schema, where this table does not
     * exist.
     */
    public function getConnectionName(): ?string
    {
        $connection = config('tenancy.database.central_connection');

        if ($connection && config("database.connections.{$connection}")) {
            return $connection;
        }

        return config('database.default', 'pgsql');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get a platform setting value by key.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        return static::query()->where('key', $key)->value('value') ?? $default;
    }

    public static function isAiOcrEnabled(): bool
    {
        return static::getValue(self::KEY_AI_OCR_ENABLED, '1') === '1';
    }

    public static function isMaintenanceMode(): bool
    {
        return static::getValue(self::KEY_MAINTENANCE_MODE, '0') === '1';
    }

    public static function isPublicRegistrationAllowed(): bool
    {
        return static::getValue(self::KEY_ALLOW_PUBLIC_REGISTRATION, '1') === '1';
    }

    public static function platformName(): string
    {
        return (string) static::getValue(self::KEY_PLATFORM_NAME, config('app.name', 'Seruwit'));
    }

    public static function defaultTenantTrialDays(): int
    {
        return (int) static::getValue(self::KEY_DEFAULT_TENANT_TRIAL_DAYS, 30);
    }

    public static function isAiQuickFillEnabled(): bool
    {
        return static::getValue(self::KEY_AI_QUICK_FILL_ENABLED, '1') === '1';
    }

    public static function getBusinessModel(): string
    {
        return (string) static::getValue(self::KEY_CAPACITY_BUSINESS_MODEL, self::MODEL_PER_VEHICLE_TRIAL);
    }

    public static function isPerVehicleTrialEnabled(): bool
    {
        return static::getBusinessModel() === self::MODEL_PER_VEHICLE_TRIAL;
    }

    public static function getVehicleTrialDurationDays(): int
    {
        return (int) static::getValue(self::KEY_VEHICLE_TRIAL_DURATION_DAYS, 30);
    }

    public static function getMaxTrialVehiclesPerTenant(): int
    {
        return (int) static::getValue(self::KEY_MAX_TRIAL_VEHICLES_PER_TENANT, 5);
    }

    public static function isPreventDuplicatePlateTrial(): bool
    {
        $val = static::getValue(self::KEY_PREVENT_DUPLICATE_PLATE_TRIAL, '1');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isCapacityCreditsLifetime(): bool
    {
        $val = static::getValue(self::KEY_CAPACITY_CREDITS_LIFETIME, '1');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function getVehicleActivationDurationDays(): int
    {
        return (int) static::getValue(self::KEY_VEHICLE_ACTIVATION_DURATION_DAYS, 30);
    }

    public static function getVehicleGracePeriodDays(): int
    {
        return (int) static::getValue(self::KEY_VEHICLE_GRACE_PERIOD_DAYS, 3);
    }

    public static function isPauseDuringMaintenanceEnabled(): bool
    {
        $val = static::getValue(self::KEY_PAUSE_DURING_MAINTENANCE, '0');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isDashboardPricingSectionVisible(): bool
    {
        $val = static::getValue(self::KEY_SHOW_DASHBOARD_PRICING_SECTION, '1');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isVehicleQuotaSectionVisible(): bool
    {
        $val = static::getValue(self::KEY_SHOW_VEHICLE_QUOTA_SECTION, '1');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isWhatsAppEnabled(): bool
    {
        $val = static::getValue('whatsapp.is_enabled', '0');

        return filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isOnboardingWelcomeWhatsAppEnabled(): bool
    {
        $welcome = static::getValue('whatsapp.onboarding_welcome_enabled', '1');

        return static::isWhatsAppEnabled() && filter_var($welcome, FILTER_VALIDATE_BOOLEAN);
    }

    public static function isPhoneVerificationRequired(): bool
    {
        $val = static::getValue('whatsapp.require_phone_verification', '1');

        return static::isWhatsAppEnabled() && filter_var($val, FILTER_VALIDATE_BOOLEAN);
    }

    public static function getOtpResendCooldownSeconds(): int
    {
        return (int) static::getValue('whatsapp.otp_resend_cooldown_seconds', 60);
    }

    /**
     * Dynamically apply Platform SMTP settings to Laravel runtime config.
     */
    public static function applyCentralMailConfig(): void
    {
        try {
            $host = static::getValue('email.smtp_host');
            if (blank($host)) {
                return;
            }

            $port = (int) static::getValue('email.smtp_port', 587);
            $encryption = static::getValue('email.smtp_encryption');
            $encryption = filled($encryption) && $encryption !== 'none' ? $encryption : null;
            $username = static::getValue('email.smtp_username');
            $password = static::getValue('email.smtp_password');
            $fromAddress = static::getValue('email.from_address');
            $fromName = static::getValue('email.from_name');

            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $host,
                'mail.mailers.smtp.port' => $port,
                'mail.mailers.smtp.encryption' => $encryption,
                'mail.mailers.smtp.username' => $username,
                'mail.mailers.smtp.password' => $password,
                'mail.mailers.smtp.timeout' => null,
            ]);

            if (filled($fromAddress)) {
                config(['mail.from.address' => $fromAddress]);
            }

            if (filled($fromName)) {
                config(['mail.from.name' => $fromName]);
            }
        } catch (\Throwable) {
            // Gracefully ignore during early boot
        }
    }

    /**
     * Dynamically apply Platform AI settings to Laravel runtime config.
     */
    public static function applyCentralAiConfig(): void
    {
        try {
            $geminiApiKey = static::getValue(self::KEY_AI_GEMINI_API_KEY);
            $geminiModel = static::getValue(self::KEY_AI_GEMINI_MODEL);
            $geminiBaseUrl = static::getValue(self::KEY_AI_GEMINI_BASE_URL);

            $kycDriver = static::getValue(self::KEY_AI_KYC_DRIVER);
            $groqApiKey = static::getValue(self::KEY_AI_GROQ_API_KEY);
            $groqModel = static::getValue(self::KEY_AI_GROQ_MODEL);
            $groqBaseUrl = static::getValue(self::KEY_AI_GROQ_BASE_URL);

            if (filled($geminiApiKey)) {
                config(['services.gemini.api_key' => $geminiApiKey]);
            }
            if (filled($geminiModel)) {
                config(['services.gemini.model' => $geminiModel]);
            }
            if (filled($geminiBaseUrl)) {
                config(['services.gemini.base_url' => $geminiBaseUrl]);
            }

            if (filled($kycDriver)) {
                config(['services.kyc.driver' => $kycDriver]);
            }
            if (filled($groqApiKey)) {
                config(['services.groq.api_key' => $groqApiKey]);
            }
            if (filled($groqModel)) {
                config(['services.groq.model' => $groqModel]);
            }
            if (filled($groqBaseUrl)) {
                config(['services.groq.base_url' => $groqBaseUrl]);
            }
        } catch (\Throwable) {
            // Gracefully ignore during early boot
        }
    }

    /**
     * Create or update a platform setting value by key, filling required columns
     * with sensible defaults on first write.
     */
    public static function setValue(string $key, mixed $value): bool
    {
        $setting = static::query()->firstOrNew(['key' => $key]);

        $setting->value = $value;

        if (! $setting->exists) {
            $setting->group = $setting->group ?: 'general';
            $setting->label = $setting->label ?: $key;
        }

        return $setting->save();
    }

    /**
     * All platform settings keyed by their group.
     *
     * @return Collection<int, static>
     */
    public static function getGrouped(): Collection
    {
        return static::query()
            ->orderBy('group')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('group');
    }

    /**
     * Default list of platform settings.
     *
     * @return list<array{key: string, group: string, value: string|null, type: string, label: string, description: string, is_public: bool, sort_order: int}>
     */
    public static function defaults(): array
    {
        return [
            // GENERAL
            [
                'key' => 'general.system_mode',
                'group' => 'general',
                'value' => app()->environment('production') ? 'production' : 'development',
                'type' => 'select',
                'label' => 'Mode Sistem',
                'description' => 'Development menonaktifkan email keluar & menampilkan OTP di layar. Production mengaktifkan email nyata dan proteksi keamanan penuh.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => self::KEY_MAINTENANCE_MODE,
                'group' => 'general',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Mode Pemeliharaan (Maintenance Mode)',
                'description' => 'Aktifkan mode pemeliharaan untuk menghentikan akses sementara bagi seluruh pengguna publik saat pembaruan sistem.',
                'is_public' => true,
                'sort_order' => 2,
            ],
            [
                'key' => self::KEY_MAINTENANCE_MESSAGE,
                'group' => 'general',
                'value' => 'Sistem sedang dalam peningkatan performa berkala. Silakan coba beberapa saat lagi.',
                'type' => 'textarea',
                'label' => 'Pesan Pemeliharaan Sistem',
                'description' => 'Pesan pemberitahuan yang ditampilkan kepada pengunjung saat mode pemeliharaan aktif.',
                'is_public' => true,
                'sort_order' => 3,
            ],
            [
                'key' => self::KEY_ALLOW_PUBLIC_REGISTRATION,
                'group' => 'general',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Pendaftaran Tenant Mandiri (Public Registration)',
                'description' => 'Jika dinonaktifkan, pendaftaran akun dan workspace baru ditutup dari publik (hanya via undangan/manual admin).',
                'is_public' => true,
                'sort_order' => 4,
            ],
            [
                'key' => self::KEY_DEFAULT_TENANT_TRIAL_DAYS,
                'group' => 'general',
                'value' => '30',
                'type' => 'number',
                'label' => 'Durasi Trial Default Tenant Baru (Hari)',
                'description' => 'Jumlah hari masa percobaan gratis yang didapat workspace tenant baru saat pertama kali registrasi.',
                'is_public' => false,
                'sort_order' => 5,
            ],
            [
                'key' => self::KEY_PLATFORM_NAME,
                'group' => 'general',
                'value' => (string) config('app.name', 'Seruwit'),
                'type' => 'text',
                'label' => 'Nama Platform Sentral',
                'description' => 'Nama resmi platform yang tampil pada header aplikasi, email notifikasi sentral, dan tab peramban.',
                'is_public' => true,
                'sort_order' => 6,
            ],
            [
                'key' => self::KEY_PLATFORM_TAGLINE,
                'group' => 'general',
                'value' => 'Sistem Manajemen Armada & Rental Terintegrasi',
                'type' => 'text',
                'label' => 'Slogan / Tagline Platform',
                'description' => 'Deskripsi singkat platform yang muncul pada halaman login dan onboarding sentral.',
                'is_public' => true,
                'sort_order' => 7,
            ],
            [
                'key' => self::KEY_ADMIN_EMAIL,
                'group' => 'general',
                'value' => 'admin@seruwit.com',
                'type' => 'email',
                'label' => 'Email Administrator Sentral',
                'description' => 'Alamat email utama administrator platform untuk menerima laporan sistem dan notifikasi pendaftaran tenant.',
                'is_public' => false,
                'sort_order' => 8,
            ],
            [
                'key' => self::KEY_SUPPORT_URL,
                'group' => 'general',
                'value' => '',
                'type' => 'url',
                'label' => 'URL Layanan Bantuan / Helpdesk',
                'description' => 'Tautan layanan pelanggan atau nomor WhatsApp resmi pengembang (contoh: https://wa.me/628123456789).',
                'is_public' => true,
                'sort_order' => 9,
            ],
            [
                'key' => 'general.ai_features_enabled',
                'group' => 'ai',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI (Artificial Intelligence)',
                'description' => 'Master switch untuk mengaktifkan atau menonaktifkan seluruh fitur AI (Visual Handover, Smart KYC, Dynamic Pricing, Predictive Maintenance, AI Smart Quick-Fill Armada) di semua workspace tenant.',
                'is_public' => true,
                'sort_order' => 1,
            ],
            [
                'key' => self::KEY_AI_OCR_ENABLED,
                'group' => 'ai',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI OCR Dokumen (KTP / SIM)',
                'description' => 'Kontrol ketersediaan fitur pemindaian cepat (OCR) foto KTP dan SIM pelanggan pada form booking dan walk-in di seluruh tenant. Jika dinonaktifkan, scanner OCR disembunyikan dari halaman tenant.',
                'is_public' => true,
                'sort_order' => 2,
            ],
            [
                'key' => self::KEY_AI_QUICK_FILL_ENABLED,
                'group' => 'ai',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Fitur AI Smart Quick-Fill (Asisten Armada)',
                'description' => 'Kontrol ketersediaan asisten pengisian otomatis spesifikasi unit armada (AI Smart Quick-Fill) pada form pendaftaran kendaraan baru di seluruh tenant. Jika dinonaktifkan, panel asisten AI disembunyikan dari halaman tenant.',
                'is_public' => true,
                'sort_order' => 3,
            ],
            [
                'key' => self::KEY_AI_GEMINI_API_KEY,
                'group' => 'ai',
                'value' => (string) config('services.gemini.api_key', ''),
                'type' => 'password',
                'label' => 'Google Gemini API Key',
                'description' => 'API Key dari Google AI Studio (https://aistudio.google.com/app/apikey) untuk menjalankan engine Vision & AI Seruwit.',
                'is_public' => false,
                'sort_order' => 10,
            ],
            [
                'key' => self::KEY_AI_GEMINI_MODEL,
                'group' => 'ai',
                'value' => (string) config('services.gemini.model', 'gemini-3.6-flash'),
                'type' => 'text',
                'label' => 'Google Gemini Model',
                'description' => 'Model Google Gemini yang aktif (contoh: gemini-3.6-flash, gemini-2.5-flash, gemini-1.5-flash).',
                'is_public' => false,
                'sort_order' => 11,
            ],
            [
                'key' => self::KEY_AI_GEMINI_BASE_URL,
                'group' => 'ai',
                'value' => (string) config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta'),
                'type' => 'text',
                'label' => 'Google Gemini Base URL',
                'description' => 'Base endpoint Google Gemini API (default: https://generativelanguage.googleapis.com/v1beta).',
                'is_public' => false,
                'sort_order' => 12,
            ],
            [
                'key' => self::KEY_AI_KYC_DRIVER,
                'group' => 'ai',
                'value' => (string) config('services.kyc.driver', 'auto'),
                'type' => 'select',
                'label' => 'Provider Driver OCR & KYC Dokumen',
                'description' => 'Pilih driver utama untuk pemindaian KTP & SIM (auto = utamakan Groq jika terpasang, lalu Gemini; groq = hanya Groq; gemini = hanya Gemini).',
                'is_public' => false,
                'sort_order' => 20,
            ],
            [
                'key' => self::KEY_AI_GROQ_API_KEY,
                'group' => 'ai',
                'value' => (string) config('services.groq.api_key', ''),
                'type' => 'password',
                'label' => 'Groq Cloud API Key',
                'description' => 'API Key Groq Cloud gratis (https://console.groq.com/keys) untuk alternatif scanner dokumen super cepat.',
                'is_public' => false,
                'sort_order' => 21,
            ],
            [
                'key' => self::KEY_AI_GROQ_MODEL,
                'group' => 'ai',
                'value' => (string) config('services.groq.model', 'qwen/qwen3.6-27b'),
                'type' => 'text',
                'label' => 'Groq Cloud Vision Model',
                'description' => 'Model Vision pada Groq Cloud (contoh: qwen/qwen3.6-27b, meta-llama/llama-4-scenic-12b).',
                'is_public' => false,
                'sort_order' => 22,
            ],
            [
                'key' => self::KEY_AI_GROQ_BASE_URL,
                'group' => 'ai',
                'value' => (string) config('services.groq.base_url', 'https://api.groq.com/openai/v1'),
                'type' => 'text',
                'label' => 'Groq Cloud Base URL',
                'description' => 'Endpoint API Groq Cloud (default: https://api.groq.com/openai/v1).',
                'is_public' => false,
                'sort_order' => 23,
            ],

            // CAPACITY
            [
                'key' => self::KEY_CAPACITY_BUSINESS_MODEL,
                'group' => 'capacity',
                'value' => self::MODEL_PER_VEHICLE_TRIAL,
                'type' => 'select',
                'label' => 'Model Interaksi Bisnis Kapasitas Armada',
                'description' => 'Pilih antara Per-Vehicle Free Trial (pendaftaran bebas kuota & 30 hari trial per armada) atau Tenant Quota (kuota langganan / top-up kredit di muka).',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => self::KEY_VEHICLE_TRIAL_DURATION_DAYS,
                'group' => 'capacity',
                'value' => '30',
                'type' => 'number',
                'label' => 'Durasi Free Trial per Armada (Hari)',
                'description' => 'Masa uji coba gratis yang didapat setiap unit kendaraan baru yang didaftarkan tenant (pada model Per-Vehicle Free Trial).',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => self::KEY_MAX_TRIAL_VEHICLES_PER_TENANT,
                'group' => 'capacity',
                'value' => '5',
                'type' => 'number',
                'label' => 'Batas Maksimal Unit Free Trial per Tenant',
                'description' => 'Jumlah maksimal unit kendaraan yang dapat menikmati masa uji coba gratis untuk setiap tenant (isi 0 untuk tanpa batas / unlimited).',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => self::KEY_PREVENT_DUPLICATE_PLATE_TRIAL,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Cegah Duplikasi Trial Pelat Nomor',
                'description' => 'Mencegah kendaraan dengan pelat nomor yang sama memperoleh masa trial ulang jika dihapus dan didaftarkan kembali.',
                'is_public' => false,
                'sort_order' => 4,
            ],
            [
                'key' => self::KEY_CAPACITY_CREDITS_LIFETIME,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Saldo Kredit Lifetime',
                'description' => 'Saldo kredit kapasitas unit yang dimiliki tenant akan tersimpan selamanya sampai digunakan (tidak pernah kadaluarsa).',
                'is_public' => false,
                'sort_order' => 5,
            ],
            [
                'key' => self::KEY_VEHICLE_ACTIVATION_DURATION_DAYS,
                'group' => 'capacity',
                'value' => '30',
                'type' => 'number',
                'label' => 'Durasi 1 Siklus Aktivasi (Hari)',
                'description' => 'Masa aktif yang didapat kendaraan saat mengkonsumsi 1 unit kapasitas kuota armada (default: 30 hari).',
                'is_public' => false,
                'sort_order' => 6,
            ],
            [
                'key' => self::KEY_VEHICLE_GRACE_PERIOD_DAYS,
                'group' => 'capacity',
                'value' => '3',
                'type' => 'number',
                'label' => 'Masa Tenggang / Grace Period (Hari)',
                'description' => 'Toleransi hari setelah masa aktif habis sebelum unit dinonaktifkan dari jadwal operasional (default: 3 hari).',
                'is_public' => false,
                'sort_order' => 7,
            ],
            [
                'key' => self::KEY_PAUSE_DURING_MAINTENANCE,
                'group' => 'capacity',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Bekukan Masa Aktif Saat Masuk Bengkel',
                'description' => 'Jika diaktifkan, masa aktif kendaraan tidak berkurang saat kendaraan berstatus dalam perbaikan (maintenance).',
                'is_public' => false,
                'sort_order' => 7,
            ],
            [
                'key' => self::KEY_SHOW_DASHBOARD_PRICING_SECTION,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Tampilkan Section Tarif Berjenjang di Dashboard Tenant',
                'description' => 'Tampilkan atau sembunyikan section Paket & Harga per Kendaraan (Tarif Berjenjang Sesuai Skala Armada) pada halaman Dashboard seluruh tenant.',
                'is_public' => true,
                'sort_order' => 8,
            ],
            [
                'key' => self::KEY_SHOW_VEHICLE_QUOTA_SECTION,
                'group' => 'capacity',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Tampilkan Bar/Gauge Kapasitas di Halaman Armada Kendaraan',
                'description' => 'Tampilkan atau sembunyikan section info Kapasitas Unit Kendaraan Aktif (kuota trial, saldo kredit, dan progress bar) pada halaman /module/fleet/vehicles seluruh tenant.',
                'is_public' => true,
                'sort_order' => 9,
            ],

            // EMAIL (Central Root SMTP Mailer)
            [
                'key' => 'email.smtp_host',
                'group' => 'email',
                'value' => config('mail.mailers.smtp.host', 'smtp.gmail.com'),
                'type' => 'text',
                'label' => 'Host SMTP',
                'description' => 'Alamat host server SMTP untuk pengiriman email platform.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'email.smtp_port',
                'group' => 'email',
                'value' => (string) config('mail.mailers.smtp.port', '587'),
                'type' => 'number',
                'label' => 'Port SMTP',
                'description' => 'Port koneksi SMTP (587 untuk TLS, 465 untuk SSL, atau 25).',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'email.smtp_encryption',
                'group' => 'email',
                'value' => config('mail.mailers.smtp.encryption', 'tls') ?: 'tls',
                'type' => 'select',
                'label' => 'Enkripsi SMTP',
                'description' => 'Protokol enkripsi koneksi SMTP (TLS, SSL, atau none).',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => 'email.smtp_username',
                'group' => 'email',
                'value' => config('mail.mailers.smtp.username', ''),
                'type' => 'text',
                'label' => 'Username SMTP',
                'description' => 'Username atau API Key untuk login ke server SMTP.',
                'is_public' => false,
                'sort_order' => 4,
            ],
            [
                'key' => 'email.smtp_password',
                'group' => 'email',
                'value' => config('mail.mailers.smtp.password', ''),
                'type' => 'text',
                'label' => 'Password SMTP',
                'description' => 'Password atau API Secret Key untuk login ke server SMTP.',
                'is_public' => false,
                'sort_order' => 5,
            ],
            [
                'key' => 'email.from_address',
                'group' => 'email',
                'value' => config('mail.from.address', 'noreply@seruwit.com'),
                'type' => 'email',
                'label' => 'Alamat Email Pengirim',
                'description' => 'Alamat email yang tertera sebagai pengirim resmi notifikasi platform.',
                'is_public' => false,
                'sort_order' => 6,
            ],
            [
                'key' => 'email.from_name',
                'group' => 'email',
                'value' => config('mail.from.name', 'Seruwit Platform'),
                'type' => 'text',
                'label' => 'Nama Pengirim Platform',
                'description' => 'Nama pengirim yang tampil pada inbox email penerima.',
                'is_public' => false,
                'sort_order' => 7,
            ],

            // SECURITY (Central)
            [
                'key' => 'security.max_login_attempts',
                'group' => 'security',
                'value' => '5',
                'type' => 'number',
                'label' => 'Batas Percobaan Login',
                'description' => 'Jumlah maksimal kegagalan login berturut-turut sebelum akun diblokir sementara.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'security.lockout_duration_minutes',
                'group' => 'security',
                'value' => '15',
                'type' => 'number',
                'label' => 'Durasi Penguncian Akun (Menit)',
                'description' => 'Waktu tunggu akun sebelum dapat mencoba login kembali setelah terkena pembatasan.',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'security.enforce_two_factor',
                'group' => 'security',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Wajibkan Otentikasi Dua Faktor (2FA)',
                'description' => 'Wajibkan seluruh admin central untuk mengaktifkan 2FA saat mengakses dashboard central.',
                'is_public' => false,
                'sort_order' => 3,
            ],

            // WHATSAPP GATEWAY (Central)
            [
                'key' => 'whatsapp.is_enabled',
                'group' => 'whatsapp',
                'value' => '0',
                'type' => 'boolean',
                'label' => 'Aktifkan WhatsApp Gateway Central',
                'description' => 'Aktifkan pengiriman pesan dan notifikasi WhatsApp resmi dari sistem platform central.',
                'is_public' => false,
                'sort_order' => 1,
            ],
            [
                'key' => 'whatsapp.provider',
                'group' => 'whatsapp',
                'value' => 'seruwit',
                'type' => 'string',
                'label' => 'Provider WhatsApp',
                'description' => 'Layanan gateway yang digunakan (seruwit, fonnte, atau custom webhook).',
                'is_public' => false,
                'sort_order' => 2,
            ],
            [
                'key' => 'whatsapp.session_id',
                'group' => 'whatsapp',
                'value' => 'central_platform',
                'type' => 'string',
                'label' => 'Session ID Central',
                'description' => 'Identifier sesi koneksi WhatsApp untuk domain platform central.',
                'is_public' => false,
                'sort_order' => 3,
            ],
            [
                'key' => 'whatsapp.onboarding_welcome_enabled',
                'group' => 'whatsapp',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Kirim Sambutan Onboarding Otomatis',
                'description' => 'Kirim pesan sambutan dan kredensial akses secara otomatis via WhatsApp saat tenant baru selesai dibuat.',
                'is_public' => false,
                'sort_order' => 4,
            ],
            [
                'key' => 'whatsapp.onboarding_welcome_template',
                'group' => 'whatsapp',
                'value' => "Halo {owner_name}, selamat datang di Seruwit! 🎉\n\nWorkspace bisnis Anda untuk *{company_name}* telah berhasil dibuat dan siap digunakan.\n\nBerikut informasi akses workspace Anda:\n🔗 *URL Workspace:* {workspace_url}\n📧 *Email Login:* {email}\n📦 *Paket:* {plan_name}\n\nSilakan masuk dan mulai kelola armada serta operasional rental Anda. Jika ada kendala, tim kami siap membantu.\n\nSalam hangat,\n*Tim Seruwit*",
                'type' => 'textarea',
                'label' => 'Template Pesan Sambutan Onboarding',
                'description' => 'Format pesan yang dikirimkan ke tenant baru. Variabel: {owner_name}, {company_name}, {workspace_url}, {email}, {plan_name}, {subdomain}.',
                'is_public' => false,
                'sort_order' => 5,
            ],
            [
                'key' => 'whatsapp.custom_url',
                'group' => 'whatsapp',
                'value' => '',
                'type' => 'text',
                'label' => 'Custom Webhook URL',
                'description' => 'Endpoint URL webhook kustom untuk pengiriman pesan.',
                'is_public' => false,
                'sort_order' => 6,
            ],
            [
                'key' => 'whatsapp.custom_token',
                'group' => 'whatsapp',
                'value' => '',
                'type' => 'text',
                'label' => 'Custom Webhook Token',
                'description' => 'Token otentikasi Bearer untuk custom webhook.',
                'is_public' => false,
                'sort_order' => 7,
            ],
            [
                'key' => 'whatsapp.fonnte_token',
                'group' => 'whatsapp',
                'value' => '',
                'type' => 'text',
                'label' => 'Fonnte Token',
                'description' => 'API Token perangkat dari Fonnte (jika menggunakan provider Fonnte).',
                'is_public' => false,
                'sort_order' => 8,
            ],
            [
                'key' => 'whatsapp.require_phone_verification',
                'group' => 'whatsapp',
                'value' => '1',
                'type' => 'boolean',
                'label' => 'Wajibkan Verifikasi WhatsApp Tenant',
                'description' => 'Wajibkan pengguna untuk memverifikasi nomor WhatsApp via OTP sebelum membuat atau mengakses workspace.',
                'is_public' => false,
                'sort_order' => 9,
            ],
            [
                'key' => 'whatsapp.otp_resend_cooldown_seconds',
                'group' => 'whatsapp',
                'value' => '60',
                'type' => 'number',
                'label' => 'Waktu Tunggu Kirim Ulang OTP (Detik)',
                'description' => 'Durasi jeda sebelum pengguna dapat meminta pengiriman ulang kode OTP WhatsApp.',
                'is_public' => false,
                'sort_order' => 10,
            ],
            [
                'key' => 'whatsapp.otp_template',
                'group' => 'whatsapp',
                'value' => "🔐 *KODE VERIFIKASI SERUWIT*\n\nHalo *{user_name}*,\nGunakan kode berikut untuk memverifikasi nomor WhatsApp akun bisnis Anda:\n\n👉 *{code}*\n\nKode ini berlaku selama *5 menit*. Jangan bagikan kode ini kepada siapa pun demi keamanan akun Anda.\n\nSalam,\n*Tim Seruwit Platform*",
                'type' => 'textarea',
                'label' => 'Template Pesan OTP WhatsApp',
                'description' => 'Format pesan OTP verifikasi. Variabel: {user_name}, {code}, {expiry_minutes}.',
                'is_public' => false,
                'sort_order' => 11,
            ],
        ];
    }

    /**
     * Ensure all default platform settings exist in database.
     */
    public static function ensureDefaultsExist(): void
    {
        try {
            foreach (static::defaults() as $def) {
                static::query()->firstOrCreate(
                    ['key' => $def['key']],
                    $def
                );
            }

            // Sync AI platform settings to dedicated 'ai' group
            static::query()->whereIn('key', [
                'general.ai_features_enabled',
                self::KEY_AI_OCR_ENABLED,
                self::KEY_AI_QUICK_FILL_ENABLED,
                self::KEY_AI_GEMINI_API_KEY,
                self::KEY_AI_GEMINI_MODEL,
                self::KEY_AI_GEMINI_BASE_URL,
                self::KEY_AI_KYC_DRIVER,
                self::KEY_AI_GROQ_API_KEY,
                self::KEY_AI_GROQ_MODEL,
                self::KEY_AI_GROQ_BASE_URL,
            ])->where('group', '!=', 'ai')->update(['group' => 'ai']);

            // If Gemini API key in database is blank but exists in config, migrate it
            $geminiKey = static::getValue(self::KEY_AI_GEMINI_API_KEY);
            if (blank($geminiKey) && filled(config('services.gemini.api_key'))) {
                static::query()->where('key', self::KEY_AI_GEMINI_API_KEY)->update([
                    'value' => (string) config('services.gemini.api_key'),
                ]);
            }
            $groqKey = static::getValue(self::KEY_AI_GROQ_API_KEY);
            if (blank($groqKey) && filled(config('services.groq.api_key'))) {
                static::query()->where('key', self::KEY_AI_GROQ_API_KEY)->update([
                    'value' => (string) config('services.groq.api_key'),
                ]);
            }
        } catch (\Throwable) {
            // Gracefully ignore if database connection is unavailable during boot
        }
    }

    /**
     * Preferred tab order on Modules/PlatformSettings. Unknown groups append alphabetically.
     *
     * @return list<string>
     */
    public static function uiGroupOrder(): array
    {
        return [
            'general',
            'ai',
            'capacity',
            'email',
            'whatsapp',
            'security',
        ];
    }

    /**
     * Distinct setting groups in UI tab order.
     *
     * @return list<string>
     */
    public static function orderedVisibleGroups(): array
    {
        static::ensureDefaultsExist();

        $existing = static::query()
            ->select('group')
            ->distinct()
            ->pluck('group')
            ->all();

        $preferred = array_values(array_filter(
            static::uiGroupOrder(),
            fn (string $group): bool => in_array($group, $existing, true),
        ));

        $remainder = collect($existing)
            ->reject(fn (string $group): bool => in_array($group, $preferred, true))
            ->sort()
            ->values()
            ->all();

        return [...$preferred, ...$remainder];
    }

    /**
     * @param  Builder<$this>  $query
     * @return Builder<$this>
     */
    public function scopeGroup(Builder $query, string $group): Builder
    {
        return $query->where('group', $group);
    }
}
