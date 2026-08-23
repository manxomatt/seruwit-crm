import { useTrans } from '@/hooks/useTrans';
import type {
    AvailableVehicle,
    DriverOption,
    InsurancePackage,
    PartnerOption,
    ReservationFormData,
    ServerQuote,
} from '../types';
import { formatDateDisplay, formatMoney } from '../types';

interface Props {
    data: ReservationFormData;
    quote: ServerQuote | null;
    quoteLoading: boolean;
    quoteError: string | null;
    selectedVehicle: AvailableVehicle | null;
    partners: PartnerOption[];
    drivers?: DriverOption[];
    insurancePackages?: InsurancePackage[];
}

export default function StepConfirm({
    data,
    quote,
    quoteLoading,
    quoteError,
    selectedVehicle,
    partners,
    drivers = [],
    insurancePackages = [],
}: Props): JSX.Element {
    const { t } = useTrans();
    const partner = partners.find((p) => String(p.id) === data.partner_id) ?? null;
    const selectedDriver = drivers.find((driver) => String(driver.id) === data.driver_id) ?? null;
    const selectedInsurance =
        insurancePackages.find((pkg) => String(pkg.id) === data.insurance_package_id) ?? null;

    const periodLabel = t(
        `rental.period_type.${
            data.period_type === 'daily' ? 'day' : data.period_type === 'weekly' ? 'week' : 'month'
        }`,
        undefined,
        data.period_type,
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('rental.wizard.steps.6', undefined, 'Review & Konfirmasi Reservasi')}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('rental.wizard.confirm.subtitle', undefined, 'Periksa detail pemesanan di bawah ini, lalu buat reservasi sebagai draft Quote.')}
                </p>
            </div>

            {quoteLoading && <ConfirmSkeleton />}

            {quoteError && (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    {quoteError}
                </div>
            )}

            {!quoteLoading && quote && (
                <>
                    {/* Status Readiness Banner */}
                    <StatusBanner available={quote.available} reasons={quote.reasons} />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="space-y-6 lg:col-span-3">
                            {/* Vehicle Header Card */}
                            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="h-44 shrink-0 bg-slate-100 dark:bg-slate-800 sm:h-auto sm:w-48">
                                        {selectedVehicle?.photo_url ? (
                                            <img
                                                src={selectedVehicle.photo_url}
                                                alt={selectedVehicle.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full min-h-[11rem] w-full items-center justify-center text-xs text-slate-400">
                                                🚗 {t('rental.availability.no_photo', undefined, 'Tanpa Foto')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-center gap-3 p-5">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                {t('rental.fields.vehicle', undefined, 'Unit Kendaraan')}
                                            </p>
                                            <h4 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
                                                {selectedVehicle?.name ?? data.vehicle_id}
                                            </h4>
                                            <span className="mt-1 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                {selectedVehicle?.plate_number ?? '—'}
                                            </span>
                                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                {[
                                                    selectedVehicle?.rental_class
                                                        ? t(`fleet.rental_class.${selectedVehicle.rental_class}`, undefined, selectedVehicle.rental_class)
                                                        : null,
                                                    selectedVehicle?.type,
                                                    quote.rate?.name ?? selectedVehicle?.rate?.name,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || '—'}
                                            </p>
                                        </div>

                                        {/* Date Interval Bar */}
                                        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                                            <DateBlock
                                                label={t('rental.fields.start_date', undefined, 'Mulai')}
                                                value={data.start_date}
                                            />
                                            <div className="text-slate-300 dark:text-slate-600">
                                                ➔
                                            </div>
                                            <DateBlock
                                                label={t('rental.fields.end_date', undefined, 'Selesai')}
                                                value={data.end_date}
                                            />
                                            <div className="ml-auto border-l border-slate-200 pl-3 text-right dark:border-slate-700">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {t('rental.fields.period', undefined, 'Durasi')}
                                                </p>
                                                <p className="mt-0.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                                                    {quote.total_periods} {periodLabel}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <InfoTile
                                    icon="👤"
                                    title={t('rental.fields.customer', undefined, 'Pelanggan')}
                                    primary={partner ? partner.name : '—'}
                                    secondary={partner ? `${partner.code} · ${partner.phone || ''}` : undefined}
                                />
                                <InfoTile
                                    icon="📍"
                                    title={t('rental.wizard.confirm.trip', undefined, 'Rute & Cabang')}
                                    primary={data.pickup_location || t('rental.wizard.confirm.no_pickup', undefined, 'Lokasi pickup')}
                                    secondary={
                                        data.return_location
                                            ? `Kembali: ${data.return_location}`
                                            : undefined
                                    }
                                />
                                <InfoTile
                                    icon="👨‍✈️"
                                    title={t('rental.fields.driver', undefined, 'Layanan Supir')}
                                    primary={
                                        selectedDriver
                                            ? selectedDriver.name
                                            : t('rental.placeholders.no_driver', undefined, 'Lepas Kunci (Tanpa Supir)')
                                    }
                                    secondary={selectedDriver?.phone ?? undefined}
                                />
                                <InfoTile
                                    icon="🛡️"
                                    title={t('rental.fields.insurance_package', undefined, 'Asuransi & Proteksi')}
                                    primary={
                                        selectedInsurance
                                            ? selectedInsurance.name
                                            : t('rental.placeholders.no_insurance', undefined, 'Tanpa Asuransi Tambahan')
                                    }
                                    secondary={
                                        selectedInsurance
                                            ? `${formatMoney(selectedInsurance.amount)}/hari`
                                            : undefined
                                    }
                                />
                            </div>

                            {/* Operational Notes */}
                            {(data.fuel_policy_notes.trim() || data.notes.trim()) && (
                                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        📝 {t('rental.wizard.confirm.notes_section', undefined, 'Catatan & Kebijakan')}
                                    </h4>
                                    <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        {data.fuel_policy_notes.trim() && (
                                            <p>
                                                <strong className="text-slate-900 dark:text-white">⛽ BBM: </strong>
                                                {data.fuel_policy_notes}
                                            </p>
                                        )}
                                        {data.notes.trim() && (
                                            <p>
                                                <strong className="text-slate-900 dark:text-white">📌 Catatan: </strong>
                                                {data.notes}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Summary Pricing Voucher */}
                        <aside className="lg:col-span-2">
                            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-6">
                                <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/70 to-slate-50/50 p-6 dark:border-slate-800 dark:from-indigo-950/40 dark:to-slate-900">
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        💳 {t('rental.wizard.summary.pricing', undefined, 'Kalkulasi Total Biaya')}
                                    </h4>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                                        {formatMoney(quote.total_amount)}
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {t('rental.wizard.confirm.total_hint', undefined, 'Estimasi total biaya sewa')}
                                    </p>
                                </div>

                                <dl className="space-y-3 p-6">
                                    <PriceRow
                                        label={`${t('rental.fields.rate_per_period', undefined, 'Tarif')} / ${periodLabel}`}
                                        value={formatMoney(quote.rate_per_period)}
                                    />
                                    <PriceRow
                                        label={`${t('rental.fields.base_amount', undefined, 'Total Pokok')} (${quote.total_periods}×)`}
                                        value={formatMoney(quote.base_amount)}
                                    />
                                    {Number(quote.one_way_fee_amount ?? 0) > 0 && (
                                        <PriceRow
                                            label={t('rental.fields.one_way_fee', undefined, 'Biaya One-Way')}
                                            value={formatMoney(quote.one_way_fee_amount)}
                                        />
                                    )}
                                    {Number(quote.insurance_amount ?? 0) > 0 && (
                                        <PriceRow
                                            label={t('rental.fields.insurance_package', undefined, 'Proteksi Asuransi')}
                                            value={formatMoney(quote.insurance_amount)}
                                        />
                                    )}
                                    <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <PriceRow
                                            label={t('rental.fields.deposit', undefined, 'Deposit Jaminan')}
                                            value={formatMoney(quote.deposit_amount)}
                                            hint={t('rental.wizard.confirm.deposit_hint', undefined, 'Ditahan terpisah; dikembalikan setelah sewa selesai')}
                                        />
                                    </div>
                                </dl>

                                {quote.available ? (
                                    <div className="border-t border-emerald-100 bg-emerald-50/70 p-4 text-xs font-bold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        ✓ {t('rental.wizard.confirm.ready', undefined, 'Kendaraan tersedia untuk tanggal ini. Anda bisa membuat reservasi.')}
                                    </div>
                                ) : (
                                    <div className="border-t border-rose-100 bg-rose-50/70 p-4 text-xs font-bold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                                        ✕ {quote.reasons[0] ?? t('rental.wizard.quote_unavailable', undefined, 'Reservasi ini tidak lagi tersedia.')}
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </>
            )}
        </div>
    );
}

function StatusBanner({ available, reasons }: { available: boolean; reasons: string[] }): JSX.Element {
    const { t } = useTrans();

    if (available) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/40">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs">
                    ✓
                </span>
                <div>
                    <p className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                        {t('rental.wizard.confirm.ready_title', undefined, 'Armada Siap Dipesan')}
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        {t('rental.wizard.confirm.ready', undefined, 'Kendaraan tersedia untuk tanggal ini. Anda bisa membuat reservasi.')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/40">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-sm font-bold text-white shadow-xs">
                !
            </span>
            <div>
                <p className="text-xs font-black text-rose-950 dark:text-rose-200">
                    {t('rental.wizard.confirm.blocked_title', undefined, 'Belum Bisa Dipesan')}
                </p>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                    {reasons[0] ?? t('rental.wizard.quote_unavailable', undefined, 'Reservasi ini tidak lagi tersedia.')}
                </p>
            </div>
        </div>
    );
}

function DateBlock({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-0.5 truncate text-xs font-black text-slate-900 dark:text-white">{formatDateDisplay(value) || '—'}</p>
        </div>
    );
}

function InfoTile({
    icon,
    title,
    primary,
    secondary,
}: {
    icon: string;
    title: string;
    primary: string;
    secondary?: string;
}): JSX.Element {
    return (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
                <span>{icon}</span>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
            </div>
            <p className="mt-2 text-xs font-black text-slate-900 dark:text-white">{primary}</p>
            {secondary && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{secondary}</p>}
        </div>
    );
}

function PriceRow({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}): JSX.Element {
    return (
        <div>
            <div className="flex items-start justify-between gap-3 text-xs">
                <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="font-bold text-slate-900 dark:text-white">{value}</dd>
            </div>
            {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
        </div>
    );
}

function ConfirmSkeleton(): JSX.Element {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
                <div className="h-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                    <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
                </div>
            </div>
            <div className="h-72 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800 lg:col-span-2" />
        </div>
    );
}

