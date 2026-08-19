import InputError from '@/Components/InputError';
import { useTrans } from '@/hooks/useTrans';
import { useMemo, useState } from 'react';
import type { AvailableVehicle, AvailableVehiclesMeta, ReservationFormData } from '../types';
import { formatMoney } from '../types';

interface Props {
    data: ReservationFormData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    vehicles: AvailableVehicle[];
    meta: AvailableVehiclesMeta | null;
    loading: boolean;
    loadError: string | null;
    onSelect: (vehicle: AvailableVehicle) => void;
}

export default function StepVehicles({
    data,
    errors,
    vehicles,
    meta,
    loading,
    loadError,
    onSelect,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [search, setSearch] = useState('');
    const [selectedClass, setSelectedClass] = useState<string>('all');

    const selected =
        vehicles.find((vehicle) => String(vehicle.id) === data.vehicle_id) ?? null;
    const showInitialLoader = loading && vehicles.length === 0;
    const showRefreshIndicator = loading && vehicles.length > 0;

    const periodLabel = (periodType: string): string =>
        t(
            `rental.period_type.${
                periodType === 'daily' ? 'day' : periodType === 'weekly' ? 'week' : 'month'
            }`,
            undefined,
            periodType,
        );

    // Extract available rental classes from vehicles list
    const availableClasses = useMemo(() => {
        const classes = new Set<string>();
        vehicles.forEach((v) => {
            if (v.rental_class) classes.add(v.rental_class);
        });
        return Array.from(classes);
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        const query = search.trim().toLowerCase();
        return vehicles.filter((vehicle) => {
            if (selectedClass !== 'all' && vehicle.rental_class !== selectedClass) {
                return false;
            }
            if (!query) return true;

            const classLabel = vehicle.rental_class
                ? t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class).toLowerCase()
                : '';

            return (
                vehicle.name.toLowerCase().includes(query) ||
                vehicle.plate_number.toLowerCase().includes(query) ||
                (vehicle.type ?? '').toLowerCase().includes(query) ||
                classLabel.includes(query)
            );
        });
    }, [vehicles, search, selectedClass, t]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {t('rental.wizard.steps.2', undefined, 'Pilih Unit Kendaraan')}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Pilih armada yang tersedia pada rentang tanggal <strong className="text-slate-700 dark:text-slate-300">{data.start_date} – {data.end_date}</strong>.
                    </p>
                </div>

                {/* Live Search */}
                {vehicles.length > 0 && (
                    <div className="relative w-full sm:w-64">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                            🔍
                        </span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari armada, plat..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-3 text-xs font-semibold placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-900"
                        />
                    </div>
                )}
            </div>

            <InputError message={errors.vehicle_id} />
            {loadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    {loadError}
                </div>
            )}

            {/* Filter Chips for Rental Class */}
            {availableClasses.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setSelectedClass('all')}
                        className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                            selectedClass === 'all'
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        Semua Kelas ({vehicles.length})
                    </button>
                    {availableClasses.map((cls) => {
                        const count = vehicles.filter((v) => v.rental_class === cls).length;
                        const label = t(`fleet.rental_class.${cls}`, undefined, cls);
                        return (
                            <button
                                key={cls}
                                type="button"
                                onClick={() => setSelectedClass(cls)}
                                className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                                    selectedClass === cls
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            {showInitialLoader && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200/80 bg-white p-12 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <Spinner className="h-8 w-8 text-indigo-600" />
                    <span className="text-xs font-bold">{t('rental.wizard.vehicles_loading', undefined, 'Memeriksa ketersediaan unit armada…')}</span>
                </div>
            )}

            {!showInitialLoader && vehicles.length === 0 && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-xs text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <p className="text-sm font-bold">{t('rental.wizard.no_vehicles', undefined, 'Tidak ada kendaraan tersedia untuk tanggal ini.')}</p>
                    {meta && (meta.has_active_rates === false || (meta.skipped_no_rate ?? 0) > 0) && (
                        <p className="mt-1 text-xs opacity-90">{t('rental.wizard.no_rates_hint', undefined, 'Hanya kendaraan yang terhubung ke skema tarif aktif yang bisa dipesan. Buat atau hubungkan tarif di menu Tarif.')}</p>
                    )}
                </div>
            )}

            {vehicles.length > 0 && (
                <div className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                    {showRefreshIndicator && (
                        <div className="absolute inset-x-0 -top-3 z-10 flex justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm backdrop-blur-md dark:border-indigo-800 dark:bg-indigo-950/90 dark:text-indigo-300">
                                <Spinner className="h-3.5 w-3.5" />
                                <span>{t('rental.wizard.vehicles_refreshing', undefined, 'Memperbarui ketersediaan…')}</span>
                            </div>
                        </div>
                    )}

                    {/* Vehicles Grid / List */}
                    <div className="space-y-3 lg:col-span-2">
                        {filteredVehicles.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                                Tidak ada armada yang cocok dengan filter pencarian.
                            </div>
                        ) : (
                            filteredVehicles.map((vehicle) => {
                                const isSelected = data.vehicle_id === String(vehicle.id);
                                const rentalClassLabel = vehicle.rental_class
                                    ? t(`fleet.rental_class.${vehicle.rental_class}`, undefined, vehicle.rental_class)
                                    : null;

                                return (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => onSelect(vehicle)}
                                        className={`group relative flex flex-col gap-4 rounded-3xl border p-4 transition-all duration-200 cursor-pointer sm:flex-row sm:items-center sm:justify-between ${
                                            isSelected
                                                ? 'border-indigo-500 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20 dark:border-indigo-500 dark:bg-indigo-950/30'
                                                : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                            {/* Photo */}
                                            <div className="h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700">
                                                {vehicle.photo_url ? (
                                                    <img
                                                        src={vehicle.photo_url}
                                                        alt={vehicle.name}
                                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                        🚗
                                                    </div>
                                                )}
                                            </div>

                                            {/* Specs & Meta */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                                        {vehicle.name}
                                                    </h4>
                                                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        {vehicle.plate_number}
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {rentalClassLabel && (
                                                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                                                            {rentalClassLabel}
                                                        </span>
                                                    )}
                                                    {vehicle.type && (
                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                            {vehicle.type}
                                                        </span>
                                                    )}
                                                    {vehicle.rate?.name && (
                                                        <span className="text-[11px]">
                                                            · {vehicle.rate.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rate and CTA Button */}
                                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t border-slate-100 pt-2 sm:border-0 sm:pt-0">
                                            {vehicle.rate && (
                                                <div className="sm:text-right">
                                                    <div className="flex items-baseline gap-1 sm:justify-end">
                                                        <span className="text-base font-black text-indigo-600 dark:text-indigo-400">
                                                            {formatMoney(vehicle.rate.rate_per_period)}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-400">
                                                            /{periodLabel(vehicle.rate.period_type)}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-400">
                                                        {t('rental.fields.deposit', undefined, 'Deposit')}: {formatMoney(vehicle.rate.deposit_amount)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-2">
                                                <button
                                                    type="button"
                                                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                                                        isSelected
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    {isSelected ? '✓ Terpilih' : 'Pilih Unit'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Sticky Sidebar Selection Preview */}
                    <aside className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60 lg:sticky lg:top-6">
                        <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            📋 {t('rental.wizard.summary.selection', undefined, 'Detail Armada Terpilih')}
                        </h3>

                        {!selected ? (
                            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                {t('rental.wizard.summary.select_hint', undefined, 'Pilih kendaraan dari daftar untuk melihat detail harga.')}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-2xl bg-white shadow-2xs dark:bg-slate-900">
                                    {selected.photo_url ? (
                                        <img
                                            src={selected.photo_url}
                                            alt={selected.name}
                                            className="h-36 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-xs text-slate-400 dark:bg-slate-800">
                                            🚗
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        {selected.name}
                                    </h4>
                                    <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {selected.plate_number}
                                    </span>
                                </div>

                                <dl className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                                    <SummaryRow
                                        label={t('rental.fields.start_date', undefined, 'Mulai')}
                                        value={data.start_date || '—'}
                                    />
                                    <SummaryRow
                                        label={t('rental.fields.end_date', undefined, 'Selesai')}
                                        value={data.end_date || '—'}
                                    />
                                    <SummaryRow
                                        label={t('rental.fields.period', undefined, 'Durasi')}
                                        value={`${selected.total_periods} ${periodLabel(data.period_type)}`}
                                    />
                                    {selected.rate && (
                                        <>
                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                            <SummaryRow
                                                label={t('rental.fields.rate_per_period', undefined, 'Tarif')}
                                                value={`${formatMoney(selected.rate.rate_per_period)}/${periodLabel(selected.rate.period_type)}`}
                                            />
                                            <SummaryRow
                                                label={t('rental.fields.base_amount', undefined, 'Total Pokok')}
                                                value={formatMoney(selected.base_amount)}
                                                strong
                                            />
                                            <SummaryRow
                                                label={t('rental.fields.deposit', undefined, 'Deposit')}
                                                value={formatMoney(selected.rate.deposit_amount)}
                                            />
                                        </>
                                    )}
                                </dl>
                            </div>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
}

function Spinner({ className = 'h-4 w-4' }: { className?: string }): JSX.Element {
    return (
        <svg
            className={`animate-spin ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

function SummaryRow({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}): JSX.Element {
    return (
        <div className="flex items-start justify-between gap-3 text-xs">
            <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className={`text-right ${strong ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'font-medium text-slate-900 dark:text-slate-200'}`}>
                {value}
            </dd>
        </div>
    );
}

