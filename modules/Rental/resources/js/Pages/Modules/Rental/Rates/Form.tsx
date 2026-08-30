import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { Link, router, useForm, type InertiaFormProps } from '@inertiajs/react';
import { Head, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';
import { useTrans } from '@/hooks/useTrans';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { Dialog, DialogPanel } from '@headlessui/react';
import RentalNav from '../../../../RentalNav';
import AiDynamicPricingPanel from '../../../../Components/AiDynamicPricingPanel';
import RateForm from './RateForm';
import {
    PERIOD_TYPES,
    emptyForm,
    emptyTier,
    rateToFormData,
    type FormData,
    type Rate,
    type RateTier,
    type TierFormLabels,
    type TierType,
    type Vehicle,
} from './shared';

interface Props {
    rate: Rate | null;
    vehicles: Vehicle[];
    rentalClasses: Array<{ value: string; label: string }>;
    mode: 'create' | 'edit';
    aiPricingOptimizerEnabled?: boolean;
    aiPricingAnalyzeUrl?: string;
    aiPricingApplyUrl?: string;
}

function makeTierHooks(form: InertiaFormProps<FormData>) {
    const updateTier = (idx: number, key: keyof RateTier, value: string | boolean): void => {
        const next = [...form.data.tiers];
        next[idx] = { ...next[idx], [key]: value };
        form.setData('tiers', next);
    };
    const addTier = (type: TierType): void => {
        form.setData('tiers', [...form.data.tiers, emptyTier(type)]);
    };
    const removeTier = (idx: number): void => {
        const tier = form.data.tiers[idx];
        const tiers = form.data.tiers.filter((_, i) => i !== idx);
        form.setData('tiers', tiers);
        if (tier && tier.id) {
            form.setData('tiers_to_delete', [...form.data.tiers_to_delete, Number(tier.id)]);
        }
    };
    return { updateTier, addTier, removeTier };
}

export default function FormPage({
    rate,
    vehicles,
    rentalClasses,
    mode,
    aiPricingOptimizerEnabled = true,
    aiPricingAnalyzeUrl,
    aiPricingApplyUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const hasAiPanel = Boolean(aiPricingOptimizerEnabled && aiPricingAnalyzeUrl && aiPricingApplyUrl);

    const formLabels: TierFormLabels = {
        rateName: t('rental.fields.rate_name'),
        periodType: t('rental.fields.period_type'),
        ratePerPeriod: t('rental.fields.rate_per_period'),
        deposit: t('rental.fields.deposit'),
        specificVehicle: t('rental.fields.specific_vehicle'),
        anyVehicle: t('rental.placeholders.any_vehicle'),
        vehicleType: t('rental.fields.vehicle_type'),
        rentalClass: t('rental.fields.rental_class'),
        anyClass: t('rental.placeholders.any_rental_class'),
        kmLimit: t('rental.fields.km_limit'),
        excessKmRate: t('rental.fields.excess_km_rate'),
        lateFeePerDay: t('rental.fields.late_fee_per_day'),
        validFrom: t('rental.fields.valid_from'),
        validTo: t('rental.fields.valid_to'),
        minPeriods: t('rental.fields.min_periods'),
        priority: t('rental.fields.priority'),
        rateActive: t('rental.fields.rate_active'),
        cancel: t('common.cancel'),
        tiersHead: t('rental.fields.tiers_head', undefined, 'Tier Harga (Diskon Bertingkat)'),
        tierPeriodTab: t('rental.fields.tier_period_tab', undefined, 'Periode Sewa (Volume)'),
        tierLoyaltyTab: t('rental.fields.tier_loyalty_tab', undefined, 'Loyalty Customer'),
        tierEmpty: t('rental.fields.tier_empty', undefined, 'Belum ada tier untuk kategori ini'),
        tierAdd: t('rental.fields.tier_add', undefined, 'Tambah Tier'),
        tierThresholdMin: t('rental.fields.tier_threshold_min', undefined, 'Min. Jumlah Periode'),
        tierThresholdMax: t('rental.fields.tier_threshold_max', undefined, 'Maks. Jumlah Periode'),
        tierUnlimited: t('rental.fields.tier_unlimited', undefined, 'Unlimited'),
        modifierFixed: t('rental.fields.modifier_fixed', undefined, 'Fixed Rate (Rp)'),
        modifierPercent: t('rental.fields.modifier_percent', undefined, 'Diskon (%)'),
        modifierFlat: t('rental.fields.modifier_flat', undefined, 'Potongan Flat (Rp)'),
        tierPriority: t('rental.fields.tier_priority', undefined, 'Priority'),
        tierActive: t('rental.fields.tier_active', undefined, 'Aktif'),
        tierDelete: t('rental.fields.tier_delete', undefined, 'Hapus'),
        tierPreview: t('rental.fields.tier_preview', undefined, 'Preview'),
        tierLegend: t('rental.fields.tier_legend', undefined, 'Kedua tipe tier berlaku bertumpuk (stacked)'),
        tierLegendPeriod: t('rental.fields.tier_legend_period', undefined, '📅 Tier Periode (Volume)'),
        tierLegendLoyalty: t('rental.fields.tier_legend_loyalty', undefined, '⭐ Tier Loyalty (Repeat Order)'),
        tierLegendPriority: t('rental.fields.tier_legend_priority', undefined, '🎯 Aturan Modifier & Stacking'),
    };

    const periodOptions = useMemo(
        () =>
            PERIOD_TYPES.map((p) => ({
                value: p,
                label: t(`rental.period_type.${p}`, undefined, p),
            })),
        [t],
    );

    const vehicleOptions = useMemo(
        () => vehicles.map((v) => ({ value: String(v.id), label: `${v.name} · ${v.plate_number}` })),
        [vehicles],
    );
    const rentalClassOptions = rentalClasses;

    const defaultValues: FormData = rate ? rateToFormData(rate) : { ...emptyForm };
    const form = useForm<FormData>(defaultValues);

    const hooks = makeTierHooks(form);
    const { flash } = usePage().props as {
        flash?: { success?: string; error?: string; warning?: string };
    };

    const submitHandler: FormEventHandler = (e) => {
        e.preventDefault();
        if (mode === 'create') {
            form.post(prefixedRoute('rental.rates.store'), {
                onError: () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
            });
        } else if (rate) {
            form.patch(prefixedRoute('rental.rates.update', { rate: rate.id }), {
                onError: () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
            });
        }
    };

    const cancel = () => {
        router.visit(prefixedRoute('rental.rates.index'));
    };

    const pageTitle = mode === 'create' ? t('rental.pages.rates.create') : t('rental.pages.rates.edit');
    const submitLabel = mode === 'create' ? t('rental.actions.create_rate') : t('common.save');

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={pageTitle}
                    subtitle={mode === 'create' ? 'Buat konfigurasi harga pokok sewa, batasan kilometer, denda, dan skema diskon bertingkat.' : 'Sesuaikan konfigurasi harga sewa dan diskon untuk skema tarif ini.'}
                    actions={
                        <div className="flex items-center gap-2">
                            {hasAiPanel && (
                                <button
                                    type="button"
                                    onClick={() => setIsAiModalOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50/70 px-4 py-2 text-xs font-black text-indigo-700 shadow-2xs hover:border-indigo-300 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 dark:border-indigo-900/60 dark:bg-slate-800 dark:from-slate-800 dark:to-indigo-950/40 dark:text-indigo-300 dark:hover:bg-slate-700 transition"
                                >
                                    <span className="text-sm">⚡</span>
                                    <span>{t('rental.ai.btn_modal_trigger', undefined, 'AI Smart Dynamic Pricing')}</span>
                                    <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-2xs">
                                        Gemini
                                    </span>
                                </button>
                            )}
                            <Link
                                href={prefixedRoute('rental.rates.index')}
                                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                                ← {t('rental.nav.back_to_rates', undefined, 'Kembali ke Daftar Tarif')}
                            </Link>
                        </div>
                    }
                />
            }
        >
            <Head title={pageTitle} />
            <RentalNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                        ✓ {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                        ⚠️ {flash.error}
                    </div>
                )}
                {flash?.warning && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                        ⚠️ {flash.warning}
                    </div>
                )}

                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Link href={prefixedRoute('rental.dashboard')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        Rental
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('rental.rates.index')} className="hover:text-slate-700 dark:hover:text-slate-200">
                        {t('rental.nav.rates', undefined, 'Tarif & Diskon')}
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{pageTitle}</span>
                </nav>

                <div>
                    <RateForm
                        form={form}
                        onSubmit={submitHandler}
                        onCancel={cancel}
                        label={submitLabel}
                        periodOptions={periodOptions}
                        vehicleOptions={vehicleOptions}
                        rentalClassOptions={rentalClassOptions}
                        labels={formLabels}
                        onUpdateTier={hooks.updateTier}
                        onAddTier={hooks.addTier}
                        onRemoveTier={hooks.removeTier}
                    />
                </div>
            </div>

            {/* Modal AI Smart Dynamic Pricing & Fleet Optimizer */}
            {hasAiPanel && (
                <Dialog
                    open={isAiModalOpen}
                    onClose={() => setIsAiModalOpen(false)}
                    className="relative z-50"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" aria-hidden="true" />
                    <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        <DialogPanel className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 overflow-hidden">
                            <AiDynamicPricingPanel
                                analyzeUrl={aiPricingAnalyzeUrl!}
                                applyUrl={aiPricingApplyUrl!}
                                canUpdate={true}
                                onClose={() => setIsAiModalOpen(false)}
                            />
                        </DialogPanel>
                    </div>
                </Dialog>
            )}
        </DynamicLayout>
    );
}
