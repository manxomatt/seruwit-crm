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

const fmtCurrency = (amount: string | number | null, currency: string): string => {
    if (!amount || Number(amount) === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount));
};

const daysUntil = (iso: string | null): number => {
    if (!iso) return 0;
    return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
};

const dateLocale = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className ?? 'h-4 w-4'} viewBox="0 0 20 20" fill="currentColor">
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
            />
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

    return (
        <label
            className={`relative flex cursor-pointer flex-col rounded-3xl border-2 p-8 transition-all duration-200 ${
                selected
                    ? 'border-teal-500 bg-teal-50 shadow-xl shadow-teal-700/10 ring-1 ring-teal-400/30'
                    : isPopular
                      ? 'border-teal-200 bg-white hover:border-teal-400 hover:shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
        >
            <input type="radio" name="plan_id" value={plan.id} checked={selected} onChange={onSelect} className="sr-only" />

            {/* Popular ribbon */}
            {isPopular && !selected && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-teal-600 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-sm">
                        Populer
                    </span>
                </div>
            )}

            {/* Selected indicator */}
            {selected && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                        <CheckIcon className="h-3 w-3" />
                        Dipilih
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {plan.description && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{plan.description}</p>}
            </div>

            {/* Pricing block */}
            <div className="mb-6 rounded-2xl bg-gray-50 p-5">
                {!hasMonthly && !hasAnnual ? (
                    <p className="text-sm italic text-gray-400">Harga belum tersedia</p>
                ) : (
                    <>
                        {/* Saving badge */}
                        {isAnnual && savingPct !== null && savingPct > 0 && (
                            <div className="mb-3">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                                    Hemat {savingPct}% vs bulanan
                                </span>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black tracking-tight text-gray-900">
                                {fmtCurrency(displayPrice, plan.currency)}
                            </span>
                            {strikePrice && (
                                <span className="mb-1 text-base text-gray-400 line-through">
                                    {fmtCurrency(strikePrice, plan.currency)}
                                </span>
                            )}
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                            {isAnnual ? (
                                <>
                                    per tahun
                                    {perMonth !== null && (
                                        <> &middot; setara{' '}
                                        <span className="font-semibold text-gray-700">
                                            {fmtCurrency(perMonth, plan.currency)}
                                        </span>
                                        /bln</>
                                    )}
                                </>
                            ) : (
                                'per bulan'
                            )}
                        </p>

                        {/* Annual teaser when on monthly */}
                        {!isAnnual && hasAnnual && savingPct !== null && savingPct > 0 && (
                            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                                <p className="text-xs text-emerald-700">
                                    🎉 Pilih <strong>Tahunan</strong> dan hemat{' '}
                                    <strong>{savingPct}%</strong> — hanya{' '}
                                    <strong>{fmtCurrency(plan.annual_price, plan.currency)}/tahun</strong>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modules */}
            {plan.modules.length > 0 && (
                <div className="flex-1">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Fitur termasuk
                    </p>
                    <ul className="space-y-2.5">
                        {plan.modules.map((m) => (
                            <li key={m} className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                                    <CheckIcon className="h-3 w-3" />
                                </span>
                                <span className="capitalize">{m.replace(/-/g, ' ')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </label>
    );
}

export default function SubscriptionActivate({ tenant, plans, subscription, isOnTrial, trialEndsAt, activePaymentOrder }: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string } };

    const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');

    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
        type: 'activate' as 'activate' | 'renew',
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

    return (
        <DynamicLayout>
            <Head title={t('central.subscription.title')} />

            {/* ── Page hero ── */}
            <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-6 py-12 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-teal-600">{tenant.name}</p>
                <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                    {t('central.subscription.headline')}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">
                    {t('central.subscription.subtitle', { name: tenant.name })}
                </p>

                {/* Billing toggle */}
                {hasAnyAnnual && (
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
                            <button
                                type="button"
                                onClick={() => handleIntervalSwitch('month')}
                                className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-150 ${
                                    billingInterval === 'month'
                                        ? 'bg-gray-900 text-white shadow'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => handleIntervalSwitch('annual')}
                                className={`relative flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-150 ${
                                    billingInterval === 'annual'
                                        ? 'bg-gray-900 text-white shadow'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                Tahunan
                                {billingInterval !== 'annual' && (
                                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                        HEMAT
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Flash message */}
                {flash?.success && (
                    <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                {/* Status banners */}
                <div className="mb-8 space-y-4">
                    {/* Active payment order */}
                    {activePaymentOrder && !['confirmed', 'rejected', 'expired', 'cancelled'].includes(activePaymentOrder.status) && (
                        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-amber-900">Pembayaran sedang diproses</p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        Total:{' '}
                                        <strong>{fmtCurrency(activePaymentOrder.total_amount, 'IDR')}</strong>
                                        {' '}· kode unik <strong>+{activePaymentOrder.unique_code}</strong>
                                        {' '}· berakhir dalam <strong>{paymentOrderDaysLeft} hari</strong>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('module.subscription.payment', activePaymentOrder.id)}
                                className="shrink-0 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700"
                            >
                                Lanjutkan Pembayaran →
                            </Link>
                        </div>
                    )}

                    {/* Trial active */}
                    {isOnTrial && (
                        <div className="flex items-start gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-teal-900">Masa trial sedang berjalan</p>
                                <p className="mt-1 text-sm text-teal-700">
                                    Sisa <strong>{trialDaysLeft} hari</strong> — berakhir pada{' '}
                                    <strong>{trialEndsAt ? dateLocale(trialEndsAt) : ''}</strong>.
                                    Pilih paket sebelum trial habis agar workspace tidak terkunci.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Subscription active */}
                    {!isOnTrial && subscription && subscription.status === 'active' && (
                        <div className="flex items-start gap-4 rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-teal-900">Langganan aktif · {subscription.plan}</p>
                                {subscription.ends_at && (
                                    <p className="mt-1 text-sm text-teal-700">
                                        Berlaku hingga <strong>{dateLocale(subscription.ends_at)}</strong>.
                                        Anda bisa upgrade atau perpanjang kapan saja.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No subscription */}
                    {!isOnTrial && !subscription && (
                        <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-500">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-red-900">Workspace tidak aktif</p>
                                <p className="mt-1 text-sm text-red-700">Aktifkan langganan untuk melanjutkan menggunakan semua fitur.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plan cards */}
                <form onSubmit={(e) => submit(e, 'activate')}>
                    <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {plans.map((plan, i) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                interval={billingInterval}
                                selected={data.plan_id === String(plan.id)}
                                onSelect={() => setData('plan_id', String(plan.id))}
                                isPopular={plans.length > 1 && i === 1}
                            />
                        ))}
                    </div>

                    {errors.plan_id && (
                        <p className="mt-4 text-center text-sm text-red-600">{errors.plan_id}</p>
                    )}

                    {/* Sticky CTA bar */}
                    {selectedPlan && (
                        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-teal-200 bg-teal-50 px-8 py-6 shadow-lg shadow-teal-700/5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-teal-600">Paket dipilih</p>
                                <p className="mt-1 text-xl font-black text-gray-900">
                                    {selectedPlan.name}
                                    <span className="ml-2 text-base font-semibold text-gray-500">
                                        · {billingInterval === 'annual' ? 'Tahunan' : 'Bulanan'}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-sm text-teal-700">
                                    {billingInterval === 'annual' && selectedPlan.annual_price && Number(selectedPlan.annual_price) > 0
                                        ? `${fmtCurrency(selectedPlan.annual_price, selectedPlan.currency)} / tahun`
                                        : selectedPlan.price && Number(selectedPlan.price) > 0
                                          ? `${fmtCurrency(selectedPlan.price, selectedPlan.currency)} / bulan`
                                          : 'Gratis'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {subscription && subscription.status === 'active' && (
                                    <button
                                        type="button"
                                        onClick={(e) => submit(e, 'renew')}
                                        disabled={processing}
                                        className="rounded-2xl border border-teal-300 bg-white px-6 py-3 text-sm font-bold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50"
                                    >
                                        Perpanjang
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-2xl bg-teal-700 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Memproses…' : t('central.subscription.activate_button')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Prompt to pick a plan */}
                    {!selectedPlan && (
                        <p className="mt-8 text-center text-sm text-gray-400">
                            Pilih paket di atas untuk melanjutkan.
                        </p>
                    )}
                </form>
            </div>
        </DynamicLayout>
    );
}
