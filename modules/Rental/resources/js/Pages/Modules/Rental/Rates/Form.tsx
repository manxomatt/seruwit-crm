import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import { Link, router, useForm, type InertiaFormProps } from '@inertiajs/react';
import { Head, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';
import { useTrans } from '@/hooks/useTrans';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import RentalNav from '../../../../RentalNav';
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

export default function FormPage({ rate, vehicles, rentalClasses, mode }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();

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
        router.visit(prefixedRoute('rental.settings.index', { tab: 'rates' }));
    };

    const pageTitle = mode === 'create' ? t('rental.pages.rates.create') : t('rental.pages.rates.edit');
    const submitLabel = mode === 'create' ? t('rental.actions.create_rate') : t('common.save');

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={pageTitle}
                    actions={
                        <Link
                            href={prefixedRoute('rental.settings.index', { tab: 'rates' })}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Kembali ke Daftar Tarif
                        </Link>
                    }
                />
            }
        >
            <Head title={pageTitle} />
            <RentalNav />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {flash?.success && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}
                {flash?.warning && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        {flash.warning}
                    </div>
                )}

                <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                    <Link href={prefixedRoute('rental.dashboard')} className="hover:text-gray-700">
                        Rental
                    </Link>
                    <span>/</span>
                    <Link href={prefixedRoute('rental.settings.index', { tab: 'rates' })} className="hover:text-gray-700">
                        {t('rental.settings.tab_rates')}
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-gray-700">{pageTitle}</span>
                </nav>

                <div className="pb-20">
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
        </DynamicLayout>
    );
}
