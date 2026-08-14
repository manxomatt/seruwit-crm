import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string;
    price: string;
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
    settings?: Record<string, string>;
    activePaymentOrder: ActivePaymentOrder | null;
}

export default function SubscriptionActivate({
    tenant,
    plans,
    subscription,
    isOnTrial,
    trialEndsAt,
    settings,
    activePaymentOrder,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { flash } = usePage().props as { flash?: { success?: string } };

    const { data, setData, post, processing, errors } = useForm({
        plan_id: '',
        type: 'activate',
    });

    const selectedPlan = useMemo(
        () => plans.find((p) => p.id === Number(data.plan_id)),
        [plans, data.plan_id],
    );

    const trialDate = trialEndsAt ? new Date(trialEndsAt) : null;
    const daysLeft = trialDate
        ? Math.max(0, Math.ceil((trialDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    const submit = (e: React.FormEvent, type: string): void => {
        e.preventDefault();
        if (!data.plan_id) return;
        setData('type', type);
        post(route('module.subscription.order'));
    };

    const formatPrice = (price: string): string => {
        const num = Number(price);
        if (num === 0) return 'Free';
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    const paymentOrderExpiry = activePaymentOrder?.expires_at
        ? new Date(activePaymentOrder.expires_at)
        : null;
    const paymentOrderDaysLeft = paymentOrderExpiry
        ? Math.max(0, Math.ceil((paymentOrderExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('central.subscription.headline')}
                    description={t('central.subscription.subtitle', { name: tenant.name })}
                />
            }
        >
            <Head title={t('central.subscription.title')} />

            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
                {flash?.success && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}

                {activePaymentOrder && !activePaymentOrder.status.endsWith('ed') && (
                    <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm shadow-amber-200/60 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <span className="material-symbols-outlined text-2xl">payments</span>
                            </span>
                            <div>
                                <p className="font-semibold text-amber-900">Pembayaran dalam proses</p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Nominal: {formatPrice(activePaymentOrder.total_amount)} (kode unik{' '}
                                    {activePaymentOrder.unique_code})
                                </p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Berakhir dalam {paymentOrderDaysLeft} hari
                                </p>
                                <a
                                    href={route('module.subscription.payment', activePaymentOrder.id)}
                                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                                >
                                    Lanjutkan Pembayaran
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {(isOnTrial || (subscription && subscription.status === 'active')) && (
                    <div className="mb-6 rounded-2xl border border-cyan-200/80 bg-cyan-50/90 p-6 shadow-sm shadow-cyan-200/60 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
                                <span className="material-symbols-outlined text-2xl">new_releases</span>
                            </span>
                            <div>
                                <p className="font-semibold text-cyan-900">
                                    {isOnTrial
                                        ? t('central.subscription.trial_info', { days: String(daysLeft), date: trialDate?.toLocaleDateString() ?? '' })
                                        : t('central.subscription.current_plan')}
                                </p>
                                {isOnTrial && (
                                    <p className="mt-1 text-sm text-cyan-700">
                                        {t('central.trial.days_left', { days: String(daysLeft) })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isOnTrial && !subscription && (
                    <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm shadow-amber-200/60 backdrop-blur-sm">
                        <div className="flex items-start gap-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <span className="material-symbols-outlined text-2xl">warning</span>
                            </span>
                            <div>
                                <p className="font-semibold text-amber-900">
                                    {t('central.subscription.trial_expired')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={(e) => submit(e, data.type)} className="space-y-6">
                    <div>
                        <p className="mb-3 text-sm font-semibold text-slate-700">
                            {t('central.subscription.select_plan')}
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {plans.map((plan) => {
                                const isSelected = data.plan_id === String(plan.id);
                                const price = formatPrice(plan.price);
                                const moduleCount = plan.modules?.length ?? 0;

                                return (
                                    <label
                                        key={plan.id}
                                        className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                                            isSelected
                                                ? 'border-teal-500 bg-teal-50/80 shadow-md shadow-teal-700/10'
                                                : 'border-slate-200 bg-white/90 hover:border-teal-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="plan_id"
                                            value={plan.id}
                                            checked={isSelected}
                                            onChange={(e) => setData('plan_id', e.target.value)}
                                            className="sr-only"
                                        />

                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-display text-lg font-bold text-slate-900">
                                                    {plan.name}
                                                </p>
                                                <p className="mt-1 text-2xl font-extrabold text-teal-700">
                                                    {price}
                                                    <span className="text-sm font-semibold text-slate-500">
                                                        {t('central.subscription.month')}
                                                    </span>
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white">
                                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">{plan.description}</p>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[18px] text-teal-600">
                                                    widgets
                                                </span>
                                                {t('central.subscription.modules_included', { count: String(moduleCount) })}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-[18px] text-teal-600">
                                                    support_agent
                                                </span>
                                                {t('central.subscription.support')}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        {errors.plan_id && (
                            <p className="mt-2 text-sm text-red-600">{errors.plan_id}</p>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={processing || !data.plan_id}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-700/25 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            {processing
                                ? t('central.subscription.activating')
                                : t('central.subscription.activate_button')}
                        </button>

                        {subscription && subscription.status === 'active' && (
                            <button
                                type="button"
                                onClick={(e) => submit(e, 'renew')}
                                disabled={processing || !data.plan_id}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Perpanjang Sekarang
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
