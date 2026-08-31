import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useLocaleTag, useTrans } from '@/hooks/useTrans';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import AiPredictiveMaintenanceCard from '../../../../Components/AiPredictiveMaintenanceCard';
import MaintenanceNav from '../../../../MaintenanceNav';
import { formatCurrency } from '../../../../maintenanceUtils';

interface Summary {
    work_order_count: number;
    total_cost: number;
    labor_cost: number;
    parts_cost: number;
    avg_downtime_hours: number | null;
    compliance_pct: number | null;
}

interface VehicleRow {
    vehicle_id: number | null;
    name: string;
    plate_number: string | null;
    work_order_count: number;
    labor_cost: number;
    parts_cost: number;
    total_cost: number;
    downtime_hours: number;
}

interface CategoryRow {
    category_id: number | null;
    name: string;
    color: string | null;
    work_order_count: number;
    total_cost: number;
}

interface VendorRow {
    vendor_key: string;
    name: string;
    partner_id: number | null;
    work_order_count: number;
    total_cost: number;
}

interface MonthPoint {
    month: string;
    label: string;
    cost: number;
    work_order_count: number;
}

interface Analytics {
    summary: Summary;
    by_vehicle: VehicleRow[];
    by_category: CategoryRow[];
    by_vendor: VendorRow[];
    downtime: { avg_hours: number | null; total_hours: number; sample_count: number };
    compliance: { pct: number | null; on_time: number; total: number };
    monthly_costs: MonthPoint[];
}

interface Props {
    filters: { from: string; to: string };
    analytics: Analytics;
    aiPredictiveEnabled?: boolean;
    aiPredictiveAnalyzeUrl?: string;
    aiPredictiveCreateWoUrl?: string;
    can?: {
        view?: boolean;
        create_wo?: boolean;
    };
}

function Bar({ value, max, color = 'from-indigo-500 to-indigo-600' }: { value: number; max: number; color?: string }): JSX.Element {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
    );
}

export default function Index({
    filters,
    analytics,
    aiPredictiveEnabled = true,
    aiPredictiveAnalyzeUrl,
    aiPredictiveCreateWoUrl,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const localeTag = useLocaleTag();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('maintenance.analytics.index'), { from, to }, { preserveState: true, replace: true });
    };

    const maxVehicleCost = Math.max(1, ...analytics.by_vehicle.map((row) => row.total_cost));
    const maxCategoryCost = Math.max(1, ...analytics.by_category.map((row) => row.total_cost));
    const maxVendorCost = Math.max(1, ...analytics.by_vendor.map((row) => row.total_cost));
    const maxMonthly = Math.max(1, ...analytics.monthly_costs.map((row) => row.cost));

    const summaryCards = [
        {
            label: 'Total Biaya Servis',
            value: formatCurrency(analytics.summary.total_cost, localeTag),
            icon: '💰',
            color: 'indigo',
        },
        {
            label: 'Surat Perintah Kerja (SPK)',
            value: `${analytics.summary.work_order_count} SPK`,
            icon: '🔧',
            color: 'emerald',
        },
        {
            label: 'Rata-Rata Downtime Unit',
            value: analytics.summary.avg_downtime_hours != null ? `${analytics.summary.avg_downtime_hours} Jam` : '—',
            icon: '⏱️',
            color: 'sky',
        },
        {
            label: 'Kepatuhan Jadwal (Compliance)',
            value: analytics.summary.compliance_pct != null ? `${analytics.summary.compliance_pct}%` : '—',
            icon: '🎯',
            color: 'amber',
        },
    ];

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title="Analisis & Laporan Maintenance"
                    subtitle="Ringkasan eksekutif pengeluaran servis armada, efisiensi downtime, kepatuhan jadwal, serta analisis biaya per unit."
                    actions={
                        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
                            <div>
                                <InputLabel htmlFor="from" value="Tanggal Dari" className="text-[10px] uppercase font-black text-slate-400" />
                                <TextInput
                                    id="from"
                                    type="date"
                                    className="mt-1 block !rounded-2xl !py-1.5 font-mono text-xs shadow-2xs"
                                    value={from}
                                    onChange={(e) => setFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="to" value="Tanggal Sampai" className="text-[10px] uppercase font-black text-slate-400" />
                                <TextInput
                                    id="to"
                                    type="date"
                                    className="mt-1 block !rounded-2xl !py-1.5 font-mono text-xs shadow-2xs"
                                    value={to}
                                    onChange={(e) => setTo(e.target.value)}
                                />
                            </div>
                            <PrimaryButton type="submit" className="rounded-2xl text-xs font-black shadow-md">
                                Terapkan Filter
                            </PrimaryButton>
                        </form>
                    }
                />
            }
        >
            <Head title="Analisis Maintenance · Fleet" />
            <MaintenanceNav />

            <div className="w-full space-y-6 pb-12">
                {/* AI Predictive Maintenance Section */}
                {aiPredictiveEnabled && aiPredictiveAnalyzeUrl && aiPredictiveCreateWoUrl && (
                    <AiPredictiveMaintenanceCard
                        analyzeUrl={aiPredictiveAnalyzeUrl}
                        createWoUrl={aiPredictiveCreateWoUrl}
                        canCreateWo={can?.create_wo ?? true}
                    />
                )}

                {/* Header Action Link */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Laporan Eksekutif Performa Maintenance</h2>
                        <p className="text-xs text-slate-400">Periode laporan: {from} s/d {to}</p>
                    </div>
                    <Link
                        href={prefixedRoute('maintenance.schedules.index')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        <span>Jadwal Maintenance Berkala →</span>
                    </Link>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {summaryCards.map((card) => (
                        <div
                            key={card.label}
                            className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{card.label}</p>
                                <span className="text-base">{card.icon}</span>
                            </div>
                            <p className="mt-2 text-2xl font-black tabular-nums text-slate-900 dark:text-white">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Labor vs Parts Breakdown Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white">👨‍🔧 Total Ongkos Jasa Mekanik</span>
                            <span className="text-xs font-mono text-slate-400">Labor</span>
                        </div>
                        <p className="mt-2 font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(analytics.summary.labor_cost, localeTag)}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white">🔩 Total Biaya Suku Cadang</span>
                            <span className="text-xs font-mono text-slate-400">Spareparts</span>
                        </div>
                        <p className="mt-2 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(analytics.summary.parts_cost, localeTag)}
                        </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white">🎯 Rincian Kepatuhan Servis</span>
                            <span className="text-xs font-mono text-slate-400">On-Time</span>
                        </div>
                        <p className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
                            {analytics.compliance.on_time} / {analytics.compliance.total} Servis
                        </p>
                    </div>
                </div>

                {/* Section 1: Biaya per Kendaraan */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Biaya Maintenance per Kendaraan</h3>
                            <p className="text-xs text-slate-400">Ranking unit kendaraan berdasarkan total pengeluaran biaya perbaikan.</p>
                        </div>
                    </div>

                    {analytics.by_vehicle.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">Belum ada data perbaikan kendaraan pada periode ini.</p>
                    ) : (
                        <div className="space-y-4">
                            {analytics.by_vehicle.map((row) => (
                                <div key={row.vehicle_id ?? row.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 dark:text-white">{row.name}</span>
                                            {row.plate_number && (
                                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {row.plate_number}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono font-black text-slate-900 dark:text-white">
                                                {formatCurrency(row.total_cost, localeTag)}
                                            </span>
                                            <span className="ml-2 text-[10px] text-slate-400">
                                                ({row.work_order_count} SPK · {row.downtime_hours} jam)
                                            </span>
                                        </div>
                                    </div>
                                    <Bar value={row.total_cost} max={maxVehicleCost} color="from-indigo-600 to-blue-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Section 2 Grid: By Category & By Vendor */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Biaya per Kategori */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Biaya per Kategori Perbaikan</h3>
                            <p className="text-xs text-slate-400">Distribusi pengeluaran berdasarkan kelompok perbaikan.</p>
                        </div>

                        {analytics.by_category.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-400">Belum ada data kategori.</p>
                        ) : (
                            <div className="space-y-4">
                                {analytics.by_category.map((row) => (
                                    <div key={row.category_id ?? row.name} className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: row.color ?? '#6B7280' }}
                                                />
                                                {row.name}
                                                <span className="text-[10px] text-slate-400">({row.work_order_count} SPK)</span>
                                            </span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {formatCurrency(row.total_cost, localeTag)}
                                            </span>
                                        </div>
                                        <Bar value={row.total_cost} max={maxCategoryCost} color="from-emerald-500 to-teal-600" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Biaya per Vendor */}
                    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Biaya per Vendor / Bengkel Rekanan</h3>
                            <p className="text-xs text-slate-400">Distribusi biaya ke masing-masing bengkel luar atau internal.</p>
                        </div>

                        {analytics.by_vendor.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-400">Belum ada data vendor/bengkel.</p>
                        ) : (
                            <div className="space-y-4">
                                {analytics.by_vendor.map((row) => (
                                    <div key={row.vendor_key} className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {row.name}
                                                <span className="ml-1 text-[10px] text-slate-400">({row.work_order_count} SPK)</span>
                                            </span>
                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                                {formatCurrency(row.total_cost, localeTag)}
                                            </span>
                                        </div>
                                        <Bar value={row.total_cost} max={maxVendorCost} color="from-purple-500 to-indigo-600" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Section 3: Tren Biaya Bulanan */}
                <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                        <h3 className="text-base font-black text-slate-900 dark:text-white">Tren Biaya Maintenance Bulanan</h3>
                        <p className="text-xs text-slate-400">Perkembangan total biaya servis dan volume SPK dari bulan ke bulan.</p>
                    </div>

                    <div className="space-y-4">
                        {analytics.monthly_costs.map((row) => (
                            <div key={row.month} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <span className="font-bold text-slate-900 dark:text-white">{row.label}</span>
                                    <div className="font-mono text-xs text-slate-800 dark:text-slate-200">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(row.cost, localeTag)}
                                        </span>
                                        <span className="ml-2 text-[10px] text-slate-400">({row.work_order_count} SPK)</span>
                                    </div>
                                </div>
                                <Bar value={row.cost} max={maxMonthly} color="from-sky-500 to-indigo-600" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </DynamicLayout>
    );
}
