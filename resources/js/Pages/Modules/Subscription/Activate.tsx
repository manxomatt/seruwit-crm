import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string | null;
    badge?: string | null;
    is_popular?: boolean;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    annual_original_price: string | null;
    currency: string;
    interval: string;
    modules: string[];
    limits?: {
        max_vehicles?: number | null;
        max_users?: number | null;
        max_branches?: number | null;
    } | null;
    features_list?: string[] | null;
}

interface ActivePaymentOrder {
    id: number;
    status: string;
    total_amount: string;
    unique_code: number;
    expires_at: string;
    type: string;
    subscribed_vehicles?: number | null;
    upgrade_from_vehicles?: number | null;
}

interface OrderItem {
    id: number;
    type: string;
    status: string;
    amount: string;
    unique_code: number;
    total_amount: string;
    created_at: string | null;
    expires_at: string | null;
    plan_name: string;
    billing_interval?: string;
    subscribed_vehicles?: number | null;
    upgrade_from_vehicles?: number | null;
    price_per_vehicle?: string | number | null;
    can_cancel: boolean;
}

interface SubscriptionTier {
    id: number;
    name: string;
    min_vehicles: number;
    max_vehicles: number;
    price_per_vehicle: string;
}

interface Props {
    tenant: {
        id: string;
        name: string;
        status: string;
        plan?: string | null;
        trial_ends_at: string | null;
        is_on_trial: boolean;
    };
    plans: PlanOption[];
    subscription: { id: number; status: string; plan?: string; plan_id?: number; ends_at?: string; subscribed_vehicles?: number } | null;
    isOnTrial: boolean;
    trialEndsAt: string | null;
    activePaymentOrder: ActivePaymentOrder | null;
    orders?: OrderItem[];
    currentVehiclesCount: number;
    totalVehiclesCount?: number;
    business_model?: string;
    is_trial_mode?: boolean;
    available_credits?: number;
    fleet_summary?: {
        total: number;
        active_paid: number;
        active_trial: number;
        expiring_soon: number;
        inactive: number;
    };
    expiring_vehicles?: Array<{
        id: number;
        name: string;
        plate_number: string;
        type: string;
        status: string;
        is_trial: boolean;
        active_until: string | null;
        auto_renew: boolean;
    }>;
    tiers: SubscriptionTier[];
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
    isPopular = false,
    isCurrentPlan = false,
}: {
    plan: PlanOption;
    interval: BillingInterval;
    selected: boolean;
    onSelect: () => void;
    isPopular?: boolean;
    isCurrentPlan?: boolean;
}) {
    const [showAllModules, setShowAllModules] = useState(false);
    const popularCard = plan.is_popular ?? isPopular;

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

    const hasFeaturesList = Array.isArray(plan.features_list) && plan.features_list.length > 0;
    const displayedModules = showAllModules ? plan.modules : plan.modules.slice(0, 7);
    const remainingCount = plan.modules.length - 7;

    return (
        <div
            onClick={onSelect}
            className={`group relative flex flex-col justify-between rounded-3xl p-7 sm:p-8 cursor-pointer transition-all duration-300 ${
                selected
                    ? 'border-2 border-teal-600 bg-gradient-to-b from-teal-50/70 via-white to-teal-50/30 shadow-xl shadow-teal-900/10 ring-4 ring-teal-500/20'
                    : popularCard
                      ? 'border-2 border-teal-300 bg-white hover:border-teal-400 hover:shadow-xl'
                      : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
            }`}
        >
            {/* Ribbon Badge */}
            {(popularCard || plan.badge) && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md whitespace-nowrap">
                        <SparklesIcon className="h-3.5 w-3.5" />
                        {plan.badge || 'Paling Lengkap & Populer'}
                    </span>
                </div>
            )}

            <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                popularCard ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {plan.badge || (plan.key === 'free' ? 'Starter' : plan.key === 'basic' ? 'Standard' : 'Enterprise')}
                            </span>
                            {isCurrentPlan && (
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-800">
                                    ✓ Paket Aktif
                                </span>
                            )}
                        </div>
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

                {/* Quota / Limits Bar */}
                {(plan.limits?.max_vehicles !== undefined || plan.limits?.max_users !== undefined) && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/60">
                        <span>
                            🚗 {plan.limits?.max_vehicles ? `Maks. ${plan.limits.max_vehicles} Armada` : 'Unlimited Armada'}
                        </span>
                        <span>•</span>
                        <span>
                            👥 {plan.limits?.max_users ? `Maks. ${plan.limits.max_users} Pengguna` : 'Unlimited Pengguna'}
                        </span>
                    </div>
                )}

                {/* Price Section */}
                <div className="my-6 rounded-2xl bg-slate-50/80 p-5 border border-slate-100">
                    {plan.key === 'pay_as_you_go' ? (
                        <div className="py-2">
                            <span className="text-3xl font-black text-slate-900">Pay As You Go</span>
                            <p className="mt-1.5 text-xs text-slate-500 font-bold text-teal-700">Mulai Rp 10.000 / kendaraan / bln</p>
                        </div>
                    ) : !hasMonthly && !hasAnnual ? (
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

                {/* Feature Highlights or Modules Included */}
                {hasFeaturesList ? (
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                                Fitur Utama Paket
                            </span>
                            <ul className="space-y-2.5">
                                {plan.features_list?.map((feature, fIdx) => (
                                    <li key={fIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                            <CheckIcon className="h-3 w-3" />
                                        </span>
                                        <span className="font-medium text-slate-800">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Collapsible Technical Modules */}
                        {plan.modules.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAllModules(!showAllModules);
                                    }}
                                    className="flex items-center justify-between w-full text-xs font-bold text-teal-600 hover:text-teal-800 py-1"
                                >
                                    <span>Modul Teknis ({plan.modules.length})</span>
                                    <span>{showAllModules ? '▲ Sembunyikan' : '▼ Lihat Detail'}</span>
                                </button>
                                {showAllModules && (
                                    <ul className="mt-2 space-y-1.5 pl-1">
                                        {plan.modules.map((m) => {
                                            const def = MODULE_DEFINITIONS[m] || { label: m.replace(/-/g, ' '), icon: '✨' };
                                            return (
                                                <li key={m} className="flex items-center gap-2 text-xs text-slate-600">
                                                    <span>{def.icon}</span>
                                                    <span>{def.label}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
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
                )}
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
                    {selected
                        ? (isCurrentPlan ? '✓ Paket Aktif Saat Ini' : '✓ Paket Terpilih')
                        : (isCurrentPlan ? 'Paket Aktif Saat Ini' : 'Pilih Paket Ini')}
                </button>
            </div>
        </div>
    );
}

export default function SubscriptionActivate({
    tenant,
    plans,
    subscription,
    isOnTrial,
    trialEndsAt,
    activePaymentOrder,
    orders = [],
    currentVehiclesCount,
    totalVehiclesCount = 0,
    business_model = 'per_vehicle_trial',
    is_trial_mode = true,
    available_credits = 0,
    fleet_summary = { total: 0, active_paid: 0, active_trial: 0, expiring_soon: 0, inactive: 0 },
    expiring_vehicles = [],
    tiers,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string; error?: string } };

    const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const [isRenewingCurrentPlan, setIsRenewingCurrentPlan] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const handleOpenCancelModal = (orderId?: number) => {
        setCancellingOrderId(orderId || activePaymentOrder?.id || null);
        setShowCancelModal(true);
    };

    const handleConfirmCancel = () => {
        const targetId = cancellingOrderId || activePaymentOrder?.id;
        if (!targetId) return;

        setIsCancelling(true);
        router.post(
            route('module.subscription.cancel', targetId),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsCancelling(false);
                    setShowCancelModal(false);
                    setCancellingOrderId(null);
                },
            }
        );
    };

    const renderOrderStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-xs font-bold text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Menunggu Transfer
                    </span>
                );
            case 'awaiting_confirmation':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-xs font-bold text-blue-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Menunggu Konfirmasi
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        ✓ Berhasil / Aktif
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2.5 py-1 text-xs font-bold text-rose-800">
                        ✕ Ditolak
                    </span>
                );
            case 'expired':
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        Kedaluwarsa
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 line-through">
                        Dibatalkan
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {status}
                    </span>
                );
        }
    };

    const activePlan = useMemo(() => {
        if (subscription?.plan_id) {
            const match = plans.find((p) => p.id === subscription.plan_id);
            if (match) return match;
        }
        if (subscription?.plan) {
            const match = plans.find((p) => p.name === subscription.plan);
            if (match) return match;
        }
        if (tenant?.plan) {
            const match = plans.find((p) => p.key === tenant.plan);
            if (match) return match;
        }
        return plans.find((p) => p.key === 'free') || plans[0];
    }, [plans, subscription, tenant?.plan]);

    const defaultSubscribedVehicles = subscription?.subscribed_vehicles 
        ? Number(subscription.subscribed_vehicles) 
        : Math.max(1, currentVehiclesCount);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: activePlan ? String(activePlan.id) : '',
        type: (subscription && subscription.status === 'active' ? 'renew' : 'activate') as 'activate' | 'renew',
        billing_interval: 'month' as BillingInterval,
        subscribed_vehicles: defaultSubscribedVehicles,
    });

    const getPAYGPrice = (vehicles: number, interval: BillingInterval) => {
        const tier = tiers.find(t => vehicles >= t.min_vehicles && vehicles <= t.max_vehicles);
        const pricePerUnit = tier ? Number(tier.price_per_vehicle) : 20000;
        const total = vehicles * pricePerUnit;
        if (interval === 'annual') {
            return total * 10;
        }
        return total;
    };

    const selectedPlan = useMemo(() => plans.find((p) => p.id === Number(data.plan_id)), [plans, data.plan_id]);
    const isPlanDifferent = activePlan && selectedPlan ? selectedPlan.id !== activePlan.id : false;
    const isQuotaChanged = selectedPlan?.key === 'pay_as_you_go' && subscription && data.subscribed_vehicles > (subscription.subscribed_vehicles || 0);
    const isSelectedPaid = selectedPlan 
        ? selectedPlan.key === 'pay_as_you_go'
            ? true
            : Number(billingInterval === 'annual' && selectedPlan.annual_price ? selectedPlan.annual_price : selectedPlan.price) > 0
        : false;

    const showCheckoutBar = Boolean(selectedPlan && isSelectedPaid && (isPlanDifferent || isRenewingCurrentPlan || isQuotaChanged));

    const totalAmountValue = useMemo(() => {
        if (!selectedPlan) return 0;
        if (selectedPlan.key === 'pay_as_you_go') {
            return getPAYGPrice(data.subscribed_vehicles, billingInterval);
        }
        return billingInterval === 'annual' && selectedPlan.annual_price && Number(selectedPlan.annual_price) > 0
            ? Number(selectedPlan.annual_price)
            : Number(selectedPlan.price || 0);
    }, [selectedPlan, data.subscribed_vehicles, billingInterval, tiers]);

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
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                                                Menunggu Transfer
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                #{activePaymentOrder.id}
                                            </span>
                                        </div>
                                        <h4 className="mt-1 text-base font-black text-slate-900">
                                            Pesanan Pembayaran #{activePaymentOrder.id} Sedang Aktif
                                        </h4>
                                        <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
                                            {activePaymentOrder.subscribed_vehicles ? (
                                                <>Kapasitas: <strong className="text-slate-900">{activePaymentOrder.subscribed_vehicles} Unit {activePaymentOrder.type === 'upgrade' && activePaymentOrder.upgrade_from_vehicles ? `(+${Math.max(1, activePaymentOrder.subscribed_vehicles - activePaymentOrder.upgrade_from_vehicles)} upgrade)` : ''}</strong> · </>
                                            ) : null}
                                            Total: <strong className="text-slate-900">{fmtCurrency(activePaymentOrder.total_amount, 'IDR')}</strong> (kode unik <strong className="text-amber-700">+{activePaymentOrder.unique_code}</strong>) · batas waktu <strong className="text-slate-900">{paymentOrderDaysLeft} hari lagi</strong>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenCancelModal(activePaymentOrder.id)}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition shadow-2xs active:scale-95"
                                    >
                                        ✕ Batalkan Transaksi
                                    </button>
                                    <Link
                                        href={route('module.subscription.payment', activePaymentOrder.id)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-amber-700 transition active:scale-95"
                                    >
                                        Lanjutkan Pembayaran →
                                    </Link>
                                </div>
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
                                        <h4 className="font-bold text-teal-950">Masa Trial Aktif: {activePlan?.name || 'Trial'}</h4>
                                        <span className="rounded-full bg-teal-200/80 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                                            {trialDaysLeft} Hari Tersisa
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm text-teal-800">
                                        Berakhir pada <strong>{trialEndsAt ? dateLocale(trialEndsAt) : ''}</strong>. Anda dapat mengaktifkan atau upgrade paket di bawah.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Free Lifetime State */}
                    {!isOnTrial && (!subscription || subscription.status !== 'active') && tenant.plan === 'free' && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6">
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                    <CheckIcon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="font-bold text-emerald-950">Paket Aktif: Free Lifetime</h4>
                                        <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                                            Status: Aktif Selamanya
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs sm:text-sm text-emerald-800">
                                        Workspace Anda aktif pada paket gratis selamanya (kapasitas maks. 2 kendaraan). Anda dapat upgrade ke paket berbayar kapan saja di bawah.
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

                {/* ── Fleet Capacity & Trial Health Overview (Mode PLG / Per-Vehicle Trial Hub) ── */}
                <div className="mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 dark:border-slate-800">
                        <div className="flex items-center gap-3.5">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-md shadow-indigo-600/20">
                                🚗
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                        Kapasitas Armada & Status Uji Coba Unit
                                    </h3>
                                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {is_trial_mode ? 'Mode Per-Vehicle Trial' : 'Mode Kuota Tenant'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {is_trial_mode
                                        ? 'Pendaftaran armada bebas kuota. Setiap unit baru otomatis mendapatkan 30 hari masa trial gratis.'
                                        : 'Kapasitas armada dibatasi oleh paket langganan dan saldo kredit aktif.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href={route('module.fleet.vehicles.index')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            >
                                Kelola Armada ({fleet_summary.total} Unit) →
                            </Link>
                        </div>
                    </div>

                    {/* 4 KPI Cards */}
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Saldo Kredit Unit */}
                        <div className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-transparent p-5 shadow-2xs transition-all hover:border-indigo-200 dark:border-indigo-900/30 dark:bg-slate-900/90 dark:hover:border-indigo-800/60">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                            ⚡
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            Saldo Kredit
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        Lifetime
                                    </span>
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        {available_credits}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Unit Kredit
                                    </span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Saldo aktif untuk aktivasi atau perpanjangan armada.
                            </p>
                        </div>

                        {/* 2. Armada Masa Trial */}
                        <div className="flex flex-col justify-between rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/40 via-white to-transparent p-5 shadow-2xs transition-all hover:border-cyan-200 dark:border-cyan-900/30 dark:bg-slate-900/90 dark:hover:border-cyan-800/60">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                                            🎁
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            Trial Aktif
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                        Gratis 30 Hari
                                    </span>
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        {fleet_summary.active_trial}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Armada
                                    </span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Unit armada baru dalam masa uji coba gratis.
                            </p>
                        </div>

                        {/* 3. Armada Berbayar Aktif */}
                        <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-transparent p-5 shadow-2xs transition-all hover:border-emerald-200 dark:border-emerald-900/30 dark:bg-slate-900/90 dark:hover:border-emerald-800/60">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            🟢
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            Aktif Berbayar
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        Produksi
                                    </span>
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        {fleet_summary.active_paid}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Armada
                                    </span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                Unit aktif beroperasi penuh dengan masa aktif valid.
                            </p>
                        </div>

                        {/* 4. Perlu Perpanjangan / Expired */}
                        <div className="flex flex-col justify-between rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 via-white to-transparent p-5 shadow-2xs transition-all hover:border-amber-200 dark:border-amber-900/30 dark:bg-slate-900/90 dark:hover:border-amber-800/60">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                            ⚠️
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                            Perlu Perhatian
                                        </span>
                                    </div>
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        Jatuh Tempo
                                    </span>
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        {fleet_summary.expiring_soon + fleet_summary.inactive}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        Armada
                                    </span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                {fleet_summary.expiring_soon} jatuh tempo &le; 7 hari, {fleet_summary.inactive} unit non-aktif.
                            </p>
                        </div>
                    </div>

                    {/* Expiring / Action-Required Vehicles List */}
                    {expiring_vehicles.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                    🚨 Unit Mendekati Jatuh Tempo atau Non-Aktif
                                </h4>
                                <span className="text-[11px] text-slate-500">
                                    Perpanjang unit agar tidak terputus dari jadwal operasional
                                </span>
                            </div>

                            <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                                {expiring_vehicles.map((v) => (
                                    <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-sm shadow-2xs dark:border-slate-700 dark:bg-slate-900">
                                                🚘
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                                                        {v.plate_number}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        · {v.name}
                                                    </span>
                                                    {v.is_trial ? (
                                                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[9px] font-black text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                                                            Trial
                                                        </span>
                                                    ) : v.status === 'active' ? (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                            Non-Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500">
                                                    {v.active_until ? `Masa aktif s/d ${dateLocale(v.active_until)}` : 'Belum pernah diaktifkan'} · Auto-Renew: {v.auto_renew ? 'Aktif' : 'Mati'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route('module.fleet.vehicles.show', v.id)}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition"
                                            >
                                                Perpanjang / Kelola Unit →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
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
                                onSelect={() => {
                                    setData('plan_id', String(plan.id));
                                    setIsRenewingCurrentPlan(false);
                                }}
                                isPopular={plan.key === 'pro' || (plans.length > 1 && idx === plans.length - 1)}
                                isCurrentPlan={activePlan?.id === plan.id}
                            />
                        ))}
                    </div>

                    {selectedPlan?.key === 'pay_as_you_go' && (
                        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                            <h3 className="text-lg font-black text-slate-900">
                                {t('subscription.payg_config_title', undefined, 'Konfigurasi Kuota Pay As You Go')}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {t('subscription.payg_config_desc', undefined, 'Tentukan kapasitas maksimal kendaraan yang ingin Anda daftarkan di workspace ini.')}
                            </p>

                            <div className="mt-6 grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        {t('subscription.vehicle_capacity', undefined, 'Kapasitas Unit Kendaraan')}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setData('subscribed_vehicles', Math.max(Math.max(1, currentVehiclesCount), data.subscribed_vehicles - 1))}
                                            className="w-11 h-11 flex items-center justify-center bg-white border border-slate-300 text-slate-800 font-bold rounded-xl hover:bg-slate-50 active:bg-slate-100 shadow-sm"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={Math.max(1, currentVehiclesCount)}
                                            value={data.subscribed_vehicles}
                                            onChange={(e) => setData('subscribed_vehicles', Math.max(Math.max(1, currentVehiclesCount), parseInt(e.target.value) || 0))}
                                            className="w-24 text-center py-2.5 border border-slate-300 rounded-xl font-bold text-lg shadow-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setData('subscribed_vehicles', data.subscribed_vehicles + 1)}
                                            className="w-11 h-11 flex items-center justify-center bg-white border border-slate-300 text-slate-800 font-bold rounded-xl hover:bg-slate-50 active:bg-slate-100 shadow-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {t('subscription.min_capacity_hint', { count: currentVehiclesCount }, `Jumlah minimal kapasitas adalah ${currentVehiclesCount} unit, disesuaikan dengan armada terdaftar Anda saat ini.`)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                                        {t('subscription.tier_pricing_scheme', undefined, 'Skema Harga Tiering')}
                                    </label>
                                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                        {tiers.map((t) => {
                                            const isActive = data.subscribed_vehicles >= t.min_vehicles && data.subscribed_vehicles <= t.max_vehicles;
                                            return (
                                                <div key={t.id} className={`flex justify-between items-center p-3.5 text-sm ${isActive ? 'bg-teal-50/75 font-bold text-teal-950' : 'text-slate-600'}`}>
                                                    <span>{t.min_vehicles} - {t.max_vehicles === 999999 ? '∞' : t.max_vehicles} Unit</span>
                                                    <span>{fmtCurrency(t.price_per_vehicle, 'IDR')}/unit/bln</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {errors.plan_id && (
                        <div className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
                            {errors.plan_id}
                        </div>
                    )}

                    {/* ── Floating / Sticky Bottom Checkout Bar ── */}
                    {showCheckoutBar && selectedPlan && (
                        <div className="sticky bottom-6 z-30 mt-10 rounded-3xl border border-teal-200 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md ring-1 ring-slate-900/5">
                            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                                <div>
                                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-600">
                                        {isQuotaChanged ? 'Upgrade Kuota Armada' : isPlanDifferent ? 'Upgrade / Ganti Paket' : 'Perpanjangan Paket'}
                                    </span>
                                    <h4 className="mt-0.5 text-xl font-black text-slate-900">
                                        Paket {selectedPlan.name}{' '}
                                        <span className="text-sm font-semibold text-slate-500">
                                            ({billingInterval === 'annual' ? 'Tahunan' : 'Bulanan'})
                                        </span>
                                    </h4>
                                    <p className="mt-0.5 text-sm font-bold text-teal-700">
                                        Total Tagihan:{' '}
                                        {fmtCurrency(totalAmountValue, selectedPlan.currency)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
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
                                            isQuotaChanged
                                                ? 'Upgrade Kuota →'
                                                : isPlanDifferent
                                                  ? `Upgrade ke ${selectedPlan.name} →`
                                                  : 'Lanjutkan ke Pembayaran →'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* ── Riwayat Transaksi & Pembayaran ── */}
                {orders && orders.length > 0 && (
                    <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
                        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                    <span>🧾</span>
                                    <span>{t('subscription.transactions_history', undefined, 'Riwayat Transaksi & Pembayaran')}</span>
                                </h4>
                                <p className="text-xs text-slate-500">
                                    {t('subscription.transactions_history_desc', undefined, 'Daftar pesanan pembayaran dan status invoice langganan workspace Anda')}
                                </p>
                            </div>
                            <span className="inline-flex self-start sm:self-auto rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                                {t('subscription.recent_transactions', { count: orders.length }, `${orders.length} Transaksi Terakhir`)}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3.5">{t('subscription.order_id', undefined, 'ID Pesanan')}</th>
                                        <th className="px-6 py-3.5">{t('subscription.order_date', undefined, 'Tanggal')}</th>
                                        <th className="px-6 py-3.5">{t('subscription.plan_type', undefined, 'Paket / Tipe')}</th>
                                        <th className="px-6 py-3.5">{t('subscription.unit_capacity', undefined, 'Kapasitas Unit')}</th>
                                        <th className="px-6 py-3.5">{t('subscription.total_bill', undefined, 'Total Tagihan')}</th>
                                        <th className="px-6 py-3.5">{t('subscription.status', undefined, 'Status')}</th>
                                        <th className="px-6 py-3.5 text-right">{t('subscription.action', undefined, 'Aksi')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((o) => (
                                        <tr key={o.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                                #{o.id}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                {o.created_at ? dateLocale(o.created_at) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-800">{o.plan_name}</span>
                                                <span className="block text-[10px] uppercase text-slate-400">
                                                    {o.type === 'upgrade'
                                                        ? t('subscription.upgrade_capacity', undefined, 'Upgrade Kuota')
                                                        : o.type === 'renew'
                                                          ? t('subscription.renewal', undefined, 'Perpanjangan')
                                                          : t('subscription.activation', undefined, 'Aktivasi')}{' '}
                                                    {o.billing_interval === 'annual'
                                                        ? t('subscription.annual', undefined, '(Tahunan)')
                                                        : t('subscription.monthly', undefined, '(Bulanan)')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {o.subscribed_vehicles ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">
                                                            {o.subscribed_vehicles} {t('subscription.units', undefined, 'Unit')}
                                                        </span>
                                                        {o.type === 'upgrade' && o.upgrade_from_vehicles !== undefined && o.upgrade_from_vehicles !== null ? (
                                                            <span className="text-[10px] font-bold text-indigo-600">
                                                                {t('subscription.unit_upgrade', { count: Math.max(1, o.subscribed_vehicles - o.upgrade_from_vehicles) }, `(+${Math.max(1, o.subscribed_vehicles - o.upgrade_from_vehicles)} unit upgrade)`)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">
                                                                {t('subscription.total_active_fleet', undefined, 'Total armada aktif')}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-medium">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                                {fmtCurrency(o.total_amount, 'IDR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderOrderStatusBadge(o.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {o.can_cancel ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenCancelModal(o.id)}
                                                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition active:scale-95"
                                                            >
                                                                ✕ {t('subscription.cancel_order', undefined, 'Batalkan')}
                                                            </button>
                                                            <Link
                                                                href={route('module.subscription.payment', o.id)}
                                                                className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-700 transition active:scale-95"
                                                            >
                                                                {t('subscription.pay_order', undefined, 'Bayar →')}
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

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

            {/* Modal Konfirmasi Pembatalan Transaksi */}
            <ConfirmDeleteDialog
                show={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setCancellingOrderId(null);
                }}
                onConfirm={handleConfirmCancel}
                processing={isCancelling}
                title={`Batalkan Pesanan Pembayaran #${cancellingOrderId || activePaymentOrder?.id}?`}
                message="Pesanan pembayaran ini akan dibatalkan dan statusnya ditutup. Kode unik transfer akan dilepaskan sehingga Anda dapat memilih paket langganan lain atau membuat pesanan baru kapan saja."
                confirmText="Ya, Batalkan Transaksi"
                cancelText="Kembali"
                processingText="Membatalkan Transaksi…"
            />
        </DynamicLayout>
    );
}
