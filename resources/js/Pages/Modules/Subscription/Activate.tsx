import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string | null;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    annual_original_price: string | null;
    currency: string;
    interval: string;
    modules: string[];
}

interface ActivePaymentOrder {
    id: number;
    status: string;
    total_amount: string;
    unique_code: number;
    expires_at: string;
    type: string;
}

interface Props {
    tenant: {
        id: string;
        name: string;
        status: string;
        trial_ends_at: string | null;
        is_on_trial: boolean;
    };
    plans: PlanOption[];
    subscription: { id: number; status: string; plan?: string; ends_at?: string } | null;
    isOnTrial: boolean;
    trialEndsAt: string | null;
    activePaymentOrder: ActivePaymentOrder | null;
}

type BillingInterval = 'month' | 'annual';

const MODULE_DEFINITIONS: Record<string, { label: string; icon: string; category: string }> = {
    accounting: { label: 'Akuntansi & Jurnal', icon: '📊', category: 'Keuangan' },
    invoicing: { label: 'Invoicing & Tagihan', icon: '🧾', category: 'Keuangan' },
    receivables: { label: 'Piutang Usaha (AR)', icon: '💳', category: 'Keuangan' },
    payables: { label: 'Hutang Usaha (AP)', icon: '📝', category: 'Keuangan' },
    billing: { label: 'Sistem Penagihan', icon: '💰', category: 'Keuangan' },
    purchasing: { label: 'Pembelian & PO', icon: '🛍️', category: 'Operasional' },
    inventory: { label: 'Stok & Inventaris', icon: '📦', category: 'Operasional' },
    orders: { label: 'Manajemen Pesanan', icon: '📋', category: 'Operasional' },
    pos: { label: 'Kasir Point of Sale (POS)', icon: '🏪', category: 'Operasional' },
    fleet: { label: 'Manajemen Armada', icon: '🚗', category: 'Transportasi' },
    rental: { label: 'Rental & Sewa Mobil', icon: '🔑', category: 'Transportasi' },
    shuttle: { label: 'Travel & Tiket Shuttle', icon: '🚐', category: 'Transportasi' },
    tracking: { label: 'Live GPS Tracking', icon: '📍', category: 'Transportasi' },
    routing: { label: 'Rute & Disparitas', icon: '🗺️', category: 'Transportasi' },
    maintenance: { label: 'Servis & Perawatan', icon: '🔧', category: 'Transportasi' },
    transportation: { label: 'Transportation TMS', icon: '🚚', category: 'Transportasi' },
    scoring: { label: 'Driver Scoring', icon: '⭐', category: 'Transportasi' },
    partners: { label: 'Database Mitra & CRM', icon: '👥', category: 'Manajemen' },
    document: { label: 'Dokumen & Kontrak', icon: '📁', category: 'Manajemen' },
    approvals: { label: 'Sistem Approval', icon: '✅', category: 'Manajemen' },
    bi: { label: 'Executive Dashboard & BI', icon: '📈', category: 'Manajemen' },
    canvassing: { label: 'Sales Canvassing', icon: '🎯', category: 'Pemasaran' },
    promotions: { label: 'Promo & Diskon', icon: '🏷️', category: 'Pemasaran' },
    outbound: { label: 'Logistik Outbound', icon: '📤', category: 'Logistik' },
    carousels: { label: 'Banner & Slider Promo', icon: '🖼️', category: 'Konten' },
    pages: { label: 'Landing Pages Kustom', icon: '🌐', category: 'Konten' },
    posts: { label: 'Blog & Artikel Berita', icon: '📰', category: 'Konten' },
};

const fmtCurrency = (amount: string | number | null, currency: string): string => {
    if (!amount || Number(amount) === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: currency || 'IDR', maximumFractionDigits: 0 }).format(Number(amount));
};

const daysUntil = (iso: string | null): number => {
    if (!iso) return 0;
    return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
};

const dateLocale = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function SparklesIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
    );
}

function ShieldCheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function LightningIcon({ className = 'h-5 w-5' }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
    );
}

function PlanCard({
    plan,
    interval,
    selected,
    onSelect,
    isPopular,
}: {
    plan: PlanOption;
    interval: BillingInterval;
    selected: boolean;
    onSelect: () => void;
    isPopular?: boolean;
}) {
    const [showAllModules, setShowAllModules] = useState(false);

    const isAnnual = interval === 'annual';
    const hasAnnual = !!(plan.annual_price && Number(plan.annual_price) > 0);
    const hasMonthly = !!(plan.price && Number(plan.price) > 0);

    const displayPrice = isAnnual && hasAnnual ? plan.annual_price : plan.price;
    const strikePrice = isAnnual
        ? plan.annual_original_price && Number(plan.annual_original_price) > 0
            ? plan.annual_original_price
            : null
        : plan.original_price && Number(plan.original_price) > 0
          ? plan.original_price
          : null;

    const savingPct =
        isAnnual && hasAnnual && hasMonthly
            ? Math.round((1 - Number(plan.annual_price) / (Number(plan.price) * 12)) * 100)
            : null;

    const perMonth = isAnnual && hasAnnual ? Number(plan.annual_price) / 12 : null;

    const displayedModules = showAllModules ? plan.modules : plan.modules.slice(0, 7);
    const remainingCount = plan.modules.length - 7;

    return (
        <div
            onClick={onSelect}
            className={`group relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 cursor-pointer transition-all duration-300 ${
                selected
                    ? 'border-2 border-teal-600 bg-gradient-to-b from-teal-50/70 via-white to-teal-50/30 shadow-xl shadow-teal-900/10 ring-4 ring-teal-500/20'
                    : isPopular
                      ? 'border-2 border-teal-200 bg-white hover:border-teal-400 hover:shadow-xl'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
            }`}
        >
            {/* Ribbon Badge */}
            {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        Paling Lengkap & Populer
                    </span>
                </div>
            )}

            <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                            isPopular ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                            {plan.key === 'free' ? 'Starter' : plan.key === 'basic' ? 'Standard' : 'Enterprise'}
                        </span>
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{plan.name}</h3>
                        {plan.description && (
                            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500 line-clamp-2">
                                {plan.description}
                            </p>
                        )}
                    </div>

                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                        selected
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-300 bg-white group-hover:border-teal-400'
                    }`}>
                        {selected && <CheckIcon className="h-3.5 w-3.5" />}
                    </div>
                </div>

                {/* Price Section */}
                <div className="my-6 rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
                    {!hasMonthly && !hasAnnual ? (
                        <div className="py-2">
                            <span className="text-3xl font-black text-slate-900">Gratis</span>
                            <p className="mt-1 text-xs text-slate-500">Tanpa biaya langganan</p>
                        </div>
                    ) : (
                        <div>
                            {isAnnual && savingPct !== null && savingPct > 0 && (
                                <div className="mb-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                        Hemat {savingPct}%
                                    </span>
                                </div>
                            )}

                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                                    {fmtCurrency(displayPrice, plan.currency)}
                                </span>
                                {strikePrice && (
                                    <span className="text-sm font-medium text-slate-400 line-through">
                                        {fmtCurrency(strikePrice, plan.currency)}
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                                {isAnnual ? (
                                    <>
                                        /tahun
                                        {perMonth !== null && (
                                            <span className="ml-1 text-teal-700">
                                                (setara {fmtCurrency(perMonth, plan.currency)}/bln)
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    '/bulan'
                                )}
                            </p>

                            {!isAnnual && hasAnnual && savingPct !== null && savingPct > 0 && (
                                <p className="mt-2.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-200">
                                    💡 Hemat {savingPct}% jika bayar tahunan ({fmtCurrency(plan.annual_price, plan.currency)}/thn)
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Modules Included */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Fitur & Modul ({plan.modules.length})
                        </span>
                        {plan.modules.length > 7 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllModules(!showAllModules);
                                }}
                                className="text-xs font-bold text-teal-600 hover:text-teal-800"
                            >
                                {showAllModules ? 'Tutup Ringkas' : `+${remainingCount} Lainnya`}
                            </button>
                        )}
                    </div>

                    {plan.modules.length === 0 ? (
                        <p className="text-xs italic text-slate-400">Fitur dasar workspace</p>
                    ) : (
                        <ul className="space-y-2.5">
                            {displayedModules.map((m) => {
                                const def = MODULE_DEFINITIONS[m] || { label: m.replace(/-/g, ' '), icon: '✨', category: 'Fitur' };
                                return (
                                    <li key={m} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100/70 text-teal-700">
                                            <CheckIcon className="h-3 w-3" />
                                        </span>
                                        <span className="truncate font-medium text-slate-800">
                                            <span className="mr-1.5 opacity-90">{def.icon}</span>
                                            {def.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Bottom Select Action */}
            <div className="mt-8 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                        selected
                            ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 hover:bg-teal-800'
                            : isPopular
                              ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    {selected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                </button>
            </div>
        </div>
    );
}

export default function SubscriptionActivate({ tenant, plans, subscription, isOnTrial, trialEndsAt, activePaymentOrder }: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string } };

    const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
        type: (subscription && subscription.status === 'active' ? 'renew' : 'activate') as 'activate' | 'renew',
        billing_interval: 'month' as BillingInterval,
    });

    const selectedPlan = useMemo(() => plans.find((p) => p.id === Number(data.plan_id)), [plans, data.plan_id]);
    const trialDaysLeft = daysUntil(trialEndsAt);
    const paymentOrderDaysLeft = daysUntil(activePaymentOrder?.expires_at ?? null);
    const hasAnyAnnual = plans.some((p) => p.annual_price && Number(p.annual_price) > 0);

    const handleIntervalSwitch = (interval: BillingInterval) => {
        setBillingInterval(interval);
        setData('billing_interval', interval);
    };

    const submit = (e: React.FormEvent, type: 'activate' | 'renew') => {
        e.preventDefault();
        if (!data.plan_id) return;
        setData('type', type);
        post(route('module.subscription.order'));
    };

    const faqs = [
        {
            q: 'Bagaimana cara pembayaran langganan?',
            a: 'Pembayaran dilakukan via transfer bank manual ke rekening resmi kami. Setelah memilih paket, sistem akan memberikan nominal tepat beserta 3 digit kode unik untuk verifikasi instan.',
        },
        {
            q: 'Kapan paket saya langsung aktif?',
            a: 'Setelah Anda mengunggah bukti transfer, tim admin akan memverifikasi dalam waktu 5-15 menit pada jam operasional, dan seluruh modul paket akan aktif otomatis.',
        },
        {
            q: 'Apakah saya bisa upgrade atau perpanjang paket kapan saja?',
            a: 'Tentu. Anda dapat berpindah ke paket yang lebih tinggi atau memperpanjang masa aktif workspace kapan saja tanpa kehilangan data bisnis Anda.',
        },
        {
            q: 'Bagaimana jika masa trial saya habis?',
            a: 'Data workspace Anda tetap aman tersimpan. Namun akses ke modul bisnis akan dijeda hingga Anda mengaktifkan salah satu paket langganan.',
        },
    ];

    return (
        <DynamicLayout>
            <Head title="Langganan & Paket Workspace" />

            {/* ── Top Hero ── */}
            <div className="relative overflow-hidden bg-slate-900 py-12 sm:py-16 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.3),rgba(255,255,255,0))]" />
                
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                        Workspace: <strong className="text-white">{tenant.name}</strong>
                    </div>

                    <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
                        Tingkatkan Bisnis dengan Paket Lengkap
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
                        Pilih paket langganan terbaik untuk mengaktifkan seluruh otomasi rental, travel, armada, kasir POS, dan akuntansi terpadu.
                    </p>

                    {/* Billing Period Selector */}
                    {hasAnyAnnual && (
                        <div className="mt-8 flex justify-center">
                            <div className="inline-flex items-center rounded-2xl bg-slate-800/90 p-1.5 border border-slate-700 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => handleIntervalSwitch('month')}
                                    className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
                                        billingInterval === 'month'
                                            ? 'bg-teal-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Bayar Bulanan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleIntervalSwitch('annual')}
                                    className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition-all ${
                                        billingInterval === 'annual'
                                            ? 'bg-teal-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Bayar Tahunan
                                    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-slate-900 shadow">
                                        Hemat 20%
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Flash Message */}
                {flash?.success && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                        <CheckIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* ── Status Widgets ── */}
                <div className="mb-8 space-y-4">
                    {/* Active Pending Payment Order */}
                    {activePaymentOrder && !['confirmed', 'rejected', 'expired', 'cancelled'].includes(activePaymentOrder.status) && (
                        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-5 sm:p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                                        <LightningIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                            Menunggu Transfer
                                        </span>
                                        <h4 className="mt-1 text-base font-black text-slate-900">
                                            Pesanan Pembayaran #{activePaymentOrder.id} Sedang Aktif
                                        </h4>
                                        <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
                                            Total: <strong className="text-slate-900">{fmtCurrency(activePaymentOrder.total_amount, 'IDR')}</strong> (kode unik <strong className="text-amber-700">+{activePaymentOrder.unique_code}</strong>) · batas waktu <strong className="text-slate-900">{paymentOrderDaysLeft} hari lagi</strong>
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={route('module.subscription.payment', activePaymentOrder.id)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition"
                                >
                                    Lanjutkan Pembayaran →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Active Trial State */}
                    {isOnTrial && (
                        <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-5 sm:p-6">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
                                    <SparklesIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-teal-950">Masa Trial Gratis 7 Hari Aktif</h4>
                                        <span className="rounded-full bg-teal-200/80 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                                            {trialDaysLeft} Hari Tersisa
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm text-teal-800">
                                        Berakhir pada <strong>{trialEndsAt ? dateLocale(trialEndsAt) : ''}</strong>. Aktifkan paket pilihan sekarang agar bisnis berjalan lancar tanpa jeda.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Subscription State */}
                    {!isOnTrial && subscription && subscription.status === 'active' && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                    <CheckIcon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-emerald-950">Paket Aktif: {subscription.plan}</h4>
                                        <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                                            Status: Aktif
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm text-emerald-800">
                                        Masa berlaku sampai <strong>{subscription.ends_at ? dateLocale(subscription.ends_at) : 'Tidak terbatas'}</strong>. Anda dapat memperpanjang atau upgrade paket di bawah.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Plans Grid ── */}
                <form onSubmit={(e) => submit(e, subscription?.status === 'active' ? 'renew' : 'activate')}>
                    <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-md mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-4xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {plans.map((plan, idx) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                interval={billingInterval}
                                selected={data.plan_id === String(plan.id)}
                                onSelect={() => setData('plan_id', String(plan.id))}
                                isPopular={plan.key === 'pro' || (plans.length > 1 && idx === plans.length - 1)}
                            />
                        ))}
                    </div>

                    {errors.plan_id && (
                        <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                            {errors.plan_id}
                        </div>
                    )}

                    {/* ── Floating / Sticky Bottom Checkout Bar ── */}
                    {selectedPlan && (
                        <div className="sticky bottom-6 z-30 mt-10 rounded-3xl border border-teal-200 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-600">
                                        Ringkasan Pesanan
                                    </span>
                                    <h4 className="mt-0.5 text-xl font-black text-slate-900">
                                        Paket {selectedPlan.name}{' '}
                                        <span className="text-sm font-semibold text-slate-500">
                                            ({billingInterval === 'annual' ? 'Tahunan' : 'Bulanan'})
                                        </span>
                                    </h4>
                                    <p className="mt-0.5 text-sm font-bold text-teal-700">
                                        Total Tagihan:{' '}
                                        {billingInterval === 'annual' && selectedPlan.annual_price && Number(selectedPlan.annual_price) > 0
                                            ? fmtCurrency(selectedPlan.annual_price, selectedPlan.currency)
                                            : fmtCurrency(selectedPlan.price, selectedPlan.currency)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {subscription && subscription.status === 'active' && (
                                        <button
                                            type="button"
                                            onClick={(e) => submit(e, 'renew')}
                                            disabled={processing}
                                            className="flex-1 md:flex-none rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Perpanjang Masa Aktif
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-700/25 hover:bg-teal-800 transition disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                                Memproses...
                                            </>
                                        ) : (
                                            'Lanjutkan ke Pembayaran →'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* ── Feature Guarantee Badges ── */}
                <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 pt-12 border-t border-slate-200">
                    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                            <ShieldCheckIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900">Database Terisolasi</h5>
                            <p className="mt-0.5 text-[11px] text-slate-500">Data tenant aman & mandiri</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                            <LightningIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900">Aktivasi Cepat</h5>
                            <p className="mt-0.5 text-[11px] text-slate-500">Verifikasi instan via kode unik</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                            <SparklesIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900">Update Berkala</h5>
                            <p className="mt-0.5 text-[11px] text-slate-500">Fitur baru tanpa biaya tambahan</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                        <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                            <CheckIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h5 className="text-xs font-bold text-slate-900">Bantuan Prioritas</h5>
                            <p className="mt-0.5 text-[11px] text-slate-500">Support teknis responsif</p>
                        </div>
                    </div>
                </div>

                {/* ── FAQ Section ── */}
                <div className="mt-16 mx-auto max-w-3xl">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-slate-900">Pertanyaan yang Sering Diajukan</h3>
                        <p className="mt-1 text-sm text-slate-500">Informasi seputar langganan dan proses aktivasi</p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
                            >
                                <button
                                    type="button"
                                    onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                                    className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-800 hover:text-teal-700"
                                >
                                    <span>{faq.q}</span>
                                    <span className={`transform transition-transform text-slate-400 ${faqOpen === index ? 'rotate-180 text-teal-600' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                                {faqOpen === index && (
                                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DynamicLayout>
    );
}
