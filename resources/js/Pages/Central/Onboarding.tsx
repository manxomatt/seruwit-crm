import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

interface PlanOption {
    id: number;
    key: string;
    name: string;
    description: string | null;
    badge?: string | null;
    is_popular?: boolean;
    is_default?: boolean;
    is_trial?: boolean;
    trial_days?: number | null;
    price: string | null;
    original_price: string | null;
    annual_price: string | null;
    currency: string;
    limits?: {
        max_vehicles?: number | null;
        max_users?: number | null;
        max_branches?: number | null;
    } | null;
    features_list?: string[] | null;
    modules: string[];
}

interface VerticalOption {
    key: string;
    label: string;
    description: string;
    available: boolean;
}

interface FailedSession {
    company_name: string;
    phone?: string | null;
    city?: string | null;
    subdomain: string;
    fleet_size?: string | null;
    rental_model?: string | null;
    base_name?: string | null;
    base_code?: string | null;
    base_address?: string | null;
    base_city?: string | null;
    base_province?: string | null;
    base_phone?: string | null;
    base_email?: string | null;
    base_opens_at?: string | null;
    base_closes_at?: string | null;
    base_vehicle_capacity?: number | null;
    plan_key?: string | null;
    verticals: string[];
    error_message: string | null;
}

interface Props {
    user: { name: string; email: string };
    centralHost: string;
    availablePlans?: PlanOption[];
    initialPlanKey?: string;
    initialCompanyName?: string;
    initialSubdomain?: string;
    initialPhone?: string;
    initialCity?: string;
    initialFleetSize?: string;
    initialRentalModel?: string;
    initialBaseName?: string;
    initialBaseCode?: string;
    initialBaseAddress?: string;
    initialBaseCity?: string;
    initialBaseProvince?: string;
    initialBasePhone?: string;
    initialBaseEmail?: string;
    initialBaseOpensAt?: string;
    initialBaseClosesAt?: string;
    initialBaseVehicleCapacity?: number | null;
    verticalOptions: VerticalOption[];
    failedSession: FailedSession | null;
    settings?: Record<string, string>;
}

export default function Onboarding({
    user,
    centralHost,
    availablePlans = [],
    initialPlanKey = '',
    initialCompanyName = '',
    initialSubdomain = '',
    initialPhone = '',
    initialCity = '',
    initialFleetSize = '1-5',
    initialRentalModel = 'both',
    initialBaseName = '',
    initialBaseCode = 'HQ',
    initialBaseAddress = '',
    initialBaseCity = '',
    initialBaseProvince = '',
    initialBasePhone = '',
    initialBaseEmail = '',
    initialBaseOpensAt = '08:00',
    initialBaseClosesAt = '20:00',
    initialBaseVehicleCapacity = null,
    verticalOptions,
    failedSession,
    settings,
}: Props): JSX.Element {
    const { t } = useTrans();
    const storageKey = `onboarding_draft_${user.email}`;

    // Load saved draft from localStorage on initial render
    const savedDraft = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                return parsed as {
                    step?: number;
                    data?: Partial<{
                        company_name: string;
                        phone: string;
                        city: string;
                        subdomain: string;
                        fleet_size: string;
                        rental_model: string;
                        base_name: string;
                        base_code: string;
                        base_address: string;
                        base_city: string;
                        base_province: string;
                        base_phone: string;
                        base_email: string;
                        base_opens_at: string;
                        base_closes_at: string;
                        base_vehicle_capacity: number | string | null;
                        plan_key: string;
                        verticals: string[];
                    }>;
                };
            }
        } catch {
            // ignore storage parse error
        }
        return null;
    }, [storageKey]);

    const [currentStep, setCurrentStep] = useState<number>(() => {
        if (savedDraft?.step && typeof savedDraft.step === 'number' && savedDraft.step >= 1 && savedDraft.step <= 4) {
            return savedDraft.step;
        }
        return 1;
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [showAdvancedBase, setShowAdvancedBase] = useState<boolean>(false);

    const defaultPlanKey = useMemo(() => {
        if (availablePlans.length === 0) {
            return initialPlanKey || 'pay_as_you_go';
        }
        if (initialPlanKey && availablePlans.some((p) => p.key === initialPlanKey)) {
            return initialPlanKey;
        }
        const payAsYouGo = availablePlans.find((p) => p.key === 'pay_as_you_go');
        if (payAsYouGo) return payAsYouGo.key;

        const defaultPlan = availablePlans.find((p) => p.is_default);
        if (defaultPlan) return defaultPlan.key;

        const popularPlan = availablePlans.find((p) => p.is_popular);
        if (popularPlan) return popularPlan.key;

        return availablePlans[0].key;
    }, [availablePlans, initialPlanKey]);

    const initialResolvedPlanKey = useMemo(() => {
        if (failedSession?.plan_key && availablePlans.some((p) => p.key === failedSession.plan_key)) {
            return failedSession.plan_key;
        }
        if (savedDraft?.data?.plan_key && availablePlans.some((p) => p.key === savedDraft.data.plan_key)) {
            return savedDraft.data.plan_key;
        }
        return defaultPlanKey;
    }, [failedSession?.plan_key, savedDraft?.data?.plan_key, availablePlans, defaultPlanKey]);

    const { data, setData, post, processing, errors } = useForm({
        company_name: failedSession?.company_name ?? savedDraft?.data?.company_name ?? initialCompanyName ?? '',
        phone: failedSession?.phone ?? savedDraft?.data?.phone ?? initialPhone ?? '',
        city: failedSession?.city ?? savedDraft?.data?.city ?? initialCity ?? '',
        subdomain: failedSession?.subdomain ?? savedDraft?.data?.subdomain ?? initialSubdomain ?? '',
        fleet_size: failedSession?.fleet_size ?? savedDraft?.data?.fleet_size ?? initialFleetSize ?? '1-5',
        rental_model: failedSession?.rental_model ?? savedDraft?.data?.rental_model ?? initialRentalModel ?? 'both',
        base_name: failedSession?.base_name ?? savedDraft?.data?.base_name ?? initialBaseName ?? '',
        base_code: failedSession?.base_code ?? savedDraft?.data?.base_code ?? initialBaseCode ?? 'HQ',
        base_address: failedSession?.base_address ?? savedDraft?.data?.base_address ?? initialBaseAddress ?? '',
        base_city: failedSession?.base_city ?? savedDraft?.data?.base_city ?? initialBaseCity ?? initialCity ?? '',
        base_province: failedSession?.base_province ?? savedDraft?.data?.base_province ?? initialBaseProvince ?? '',
        base_phone: failedSession?.base_phone ?? savedDraft?.data?.base_phone ?? initialBasePhone ?? initialPhone ?? '',
        base_email: failedSession?.base_email ?? savedDraft?.data?.base_email ?? initialBaseEmail ?? user.email ?? '',
        base_opens_at: failedSession?.base_opens_at ?? savedDraft?.data?.base_opens_at ?? initialBaseOpensAt ?? '00:00',
        base_closes_at: failedSession?.base_closes_at ?? savedDraft?.data?.base_closes_at ?? initialBaseClosesAt ?? '23:59',
        base_vehicle_capacity: failedSession?.base_vehicle_capacity ?? savedDraft?.data?.base_vehicle_capacity ?? initialBaseVehicleCapacity ?? '',
        plan_key: initialResolvedPlanKey,
        verticals: failedSession?.verticals ?? savedDraft?.data?.verticals ?? (['rental'] as string[]),
    });

    useEffect(() => {
        if (availablePlans.length > 0 && (!data.plan_key || !availablePlans.some((p) => p.key === data.plan_key))) {
            setData('plan_key', defaultPlanKey);
        }
    }, [availablePlans, defaultPlanKey, data.plan_key, setData]);

    // Save draft and current step to localStorage on state change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(
                storageKey,
                JSON.stringify({
                    step: currentStep,
                    data,
                })
            );
        } catch {
            // ignore storage quota errors
        }
    }, [currentStep, data, storageKey]);

    const [is24Hours, setIs24Hours] = useState<boolean>(
        data.base_opens_at === '00:00' && data.base_closes_at === '23:59'
    );

    const toggle24Hours = (enabled: boolean): void => {
        setIs24Hours(enabled);
        if (enabled) {
            setData((prev) => ({
                ...prev,
                base_opens_at: '00:00',
                base_closes_at: '23:59',
            }));
        } else {
            setData((prev) => ({
                ...prev,
                base_opens_at: '08:00',
                base_closes_at: '20:00',
            }));
        }
    };

    const slugify = (text: string): string =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 30);

    const handleCompanyNameChange = (val: string): void => {
        const prevSlug = slugify(data.company_name);
        const newSlug = slugify(val);
        const prevDefaultBaseName = data.company_name
            ? t('central.onboarding.default_base_prefix', { name: data.company_name }, `Kantor Operasional ${data.company_name}`)
            : '';
        const shouldUpdateBaseName = !data.base_name || data.base_name === prevDefaultBaseName;

        setData((prev) => ({
            ...prev,
            company_name: val,
            subdomain: !data.subdomain || data.subdomain === prevSlug ? newSlug : prev.subdomain,
            base_name: shouldUpdateBaseName
                ? val
                    ? t('central.onboarding.default_base_prefix', { name: val }, `Kantor Operasional ${val}`)
                    : ''
                : prev.base_name,
        }));
        if (clientErrors.company_name) {
            setClientErrors((prev) => ({ ...prev, company_name: '' }));
        }
    };

    const handleCitySelect = (cityName: string): void => {
        const isDeselect = data.city.toLowerCase() === cityName.toLowerCase();
        const nextCity = isDeselect ? '' : cityName;
        setData((prev) => ({
            ...prev,
            city: nextCity,
            base_city: !prev.base_city || prev.base_city === prev.city ? nextCity : prev.base_city,
        }));
    };

    const toggleVertical = (key: string): void => {
        if (!verticalOptions.some((option) => option.key === key && option.available)) {
            return;
        }

        if (data.verticals.includes(key)) {
            if (data.verticals.length > 1) {
                setData(
                    'verticals',
                    data.verticals.filter((item) => item !== key),
                );
            }
            return;
        }

        setData('verticals', [...data.verticals, key]);
        if (clientErrors.verticals) {
            setClientErrors((prev) => ({ ...prev, verticals: '' }));
        }
    };

    const previewHint = useMemo(() => {
        if (data.verticals.length === 0) {
            return t('central.onboarding.preview_core');
        }

        return `${t('central.onboarding.preview_core')} + ${data.verticals
            .map((key) => t(`central.onboarding.verticals.${key}`, undefined, key))
            .join(', ')}`;
    }, [data.verticals, t]);

    const selectedPlan = useMemo(() => {
        return availablePlans.find((p) => p.key === data.plan_key) || availablePlans[0];
    }, [availablePlans, data.plan_key]);

    // Validation for Step 1: Business Identity & Subdomain
    const validateStep1 = (): boolean => {
        const errs: Record<string, string> = {};
        if (!data.company_name.trim()) {
            errs.company_name = t(
                'central.onboarding.validation.company_name_required',
                undefined,
                'Nama perusahaan atau usaha rental wajib diisi.'
            );
        }
        if (!data.subdomain.trim()) {
            errs.subdomain = t(
                'central.onboarding.validation.subdomain_required',
                undefined,
                'Subdomain workspace wajib diisi.'
            );
        } else if (data.subdomain.length < 2) {
            errs.subdomain = t(
                'central.onboarding.validation.subdomain_min',
                undefined,
                'Subdomain minimal 2 karakter.'
            );
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation for Step 2: Rental Model & Fleet Scale
    const validateStep2 = (): boolean => {
        const errs: Record<string, string> = {};
        if (data.verticals.length === 0) {
            errs.verticals = t('central.onboarding.validation.verticals_required', undefined, 'Pilih minimal satu layanan rental.');
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validation for Step 3: Pool & Office Location
    const validateStep3 = (): boolean => {
        const errs: Record<string, string> = {};
        if (!data.base_name.trim()) {
            errs.base_name = t(
                'central.onboarding.validation.base_name_required',
                undefined,
                'Nama kantor operasional atau pool armada wajib diisi.'
            );
        }
        if (!data.base_code.trim()) {
            errs.base_code = t(
                'central.onboarding.validation.base_code_required',
                undefined,
                'Kode base wajib diisi (contoh: HQ).'
            );
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = (): void => {
        if (currentStep === 1) {
            if (validateStep1()) {
                // Smart auto-prefills for Step 3
                if (!data.base_name.trim() && data.company_name) {
                    setData(
                        'base_name',
                        t('central.onboarding.default_base_prefix', { name: data.company_name }, `Kantor Operasional ${data.company_name}`)
                    );
                }
                if (!data.base_code.trim()) {
                    setData('base_code', 'HQ');
                }
                if (!data.base_city && data.city) {
                    setData('base_city', data.city.split(',')[0].trim());
                }
                if (!data.base_phone && data.phone) {
                    setData('base_phone', data.phone);
                }
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
            if (validateStep3()) {
                // Auto-suggest best plan for Step 4 based on fleet size
                if (data.fleet_size === '21-50+') {
                    const proPlan = availablePlans.find((p) => p.key === 'pro');
                    if (proPlan) setData('plan_key', proPlan.key);
                } else if (data.fleet_size === '6-20') {
                    const starterPlan = availablePlans.find((p) => p.key === 'starter' || p.is_popular);
                    if (starterPlan) setData('plan_key', starterPlan.key);
                } else {
                    const payAsYouGo = availablePlans.find((p) => p.key === 'pay_as_you_go' || p.key === 'free');
                    if (payAsYouGo) setData('plan_key', payAsYouGo.key);
                }
                setCurrentStep(4);
            }
        }
    };

    const handleBack = (): void => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const submit = (e: FormEvent): void => {
        e.preventDefault();
        post(route('central.onboarding.store'), {
            onSuccess: () => {
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage.removeItem(storageKey);
                    } catch {
                        // ignore
                    }
                }
            },
            onError: (errs) => {
                if (errs.company_name || errs.subdomain || errs.phone || errs.city) {
                    setCurrentStep(1);
                } else if (errs.verticals || errs.fleet_size || errs.rental_model) {
                    setCurrentStep(2);
                } else if (errs.base_name || errs.base_code || errs.base_address || errs.base_city || errs.base_phone) {
                    setCurrentStep(3);
                } else if (errs.plan_key) {
                    setCurrentStep(4);
                }
            },
        });
    };

    const siteName = settings?.['general.site_name'] || DEFAULT_SITE_NAME;
    const siteLogo = settings?.['site.logo'];

    const verticalIcon = (key: string): string => {
        if (key === 'rental') return 'directions_car';
        if (key === 'travel') return 'airport_shuttle';
        return 'apps';
    };

    const popularCities = ['Jakarta', 'Bali (Denpasar)', 'Surabaya', 'Yogyakarta', 'Bandung', 'Medan', 'Semarang'];

    // Helper to identify if a plan matches the current fleet recommendation
    const isPlanRecommended = (planKey: string): boolean => {
        if (data.fleet_size === '21-50+' && planKey === 'pro') return true;
        if (data.fleet_size === '6-20' && (planKey === 'starter' || planKey === 'business')) return true;
        if (data.fleet_size === '1-5' && (planKey === 'pay_as_you_go' || planKey === 'free')) return true;
        return false;
    };

    return (
        <>
            <Head title={t('central.onboarding.title')} />

            <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-slate-100/90 text-slate-800 antialiased selection:bg-indigo-600 selection:text-white">
                {/* Ambient Soft Glow Effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-200/40 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-sky-200/40 blur-[130px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-emerald-100/30 blur-[140px]" />
                </div>

                {/* Top Bar Navigation */}
                <header className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-8">
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 transition focus:outline-none"
                    >
                        {siteLogo ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs transition group-hover:shadow">
                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                            </div>
                        ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600 text-white shadow-xs shadow-indigo-600/20 transition group-hover:scale-105">
                                <span className="material-symbols-outlined text-lg">domain_add</span>
                            </div>
                        )}
                        <span className="text-sm font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                            {siteName}
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <LanguageSwitcher
                            compact
                            className="bg-white border border-slate-200 backdrop-blur-md text-xs font-bold shadow-xs [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white"
                        />
                    </div>
                </header>

                {/* Main Content: Split Bento Card Layout */}
                <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-4 sm:px-6">
                    <div className="w-full max-w-5xl">
                        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
                            
                            {/* Left Panel: Deep Executive Navy & Stepper Progress (Dark Studio Canvas) */}
                            <div className="relative hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-between p-7 sm:p-8 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white border-r border-slate-800/80">
                                {/* Ambient Orbs inside left panel */}
                                <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
                                <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-sky-500/15 blur-2xl" />

                                <div className="relative z-10">
                                    {/* Top Status Pill */}
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400 backdrop-blur-md">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                            {t('auth_ui.status_provisioning', undefined, 'Setup Instan • Database Terisolasi')}
                                        </span>
                                    </div>

                                    {/* Brand Logo & Tagline Header */}
                                    <div className="mt-5 flex items-center gap-3">
                                        {siteLogo ? (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white p-2 shadow-sm">
                                                <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                            </div>
                                        ) : (
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/30 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                                                <span className="material-symbols-outlined text-2xl">domain_add</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-base font-black tracking-tight text-white leading-tight">
                                                {siteName}
                                            </div>
                                            <div className="text-[11px] font-bold text-indigo-300">
                                                {t('auth_ui.brand_sub_rental', undefined, 'Sistem Operasional Rental Kendaraan')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Step Header */}
                                    <div className="mt-6">
                                        <h2 className="text-xl font-black tracking-tight text-white leading-snug">
                                            {currentStep === 1 && t('central.onboarding.step1_title')}
                                            {currentStep === 2 && t('central.onboarding.step2_title')}
                                            {currentStep === 3 && t('central.onboarding.step3_title')}
                                            {currentStep === 4 && t('central.onboarding.step4_title')}
                                        </h2>
                                        <p className="mt-2 text-xs font-medium text-slate-300 leading-relaxed">
                                            {currentStep === 1 && t('central.onboarding.step1_desc')}
                                            {currentStep === 2 && t('central.onboarding.step2_desc')}
                                            {currentStep === 3 && t('central.onboarding.step3_desc')}
                                            {currentStep === 4 && t('central.onboarding.step4_desc')}
                                        </p>
                                    </div>

                                    {/* Live Step Progress Timeline */}
                                    <div className="mt-6 space-y-2.5">
                                        {[
                                            {
                                                step: 1,
                                                title: t('central.onboarding.step1_title', undefined, 'Identitas Usaha & Domain'),
                                                icon: 'business',
                                                desc: t('central.onboarding.step1_guide_desc', undefined, 'Nama usaha & URL workspace'),
                                            },
                                            {
                                                step: 2,
                                                title: t('central.onboarding.step2_title', undefined, 'Model Rental & Armada'),
                                                icon: 'tune',
                                                desc: t('central.onboarding.step2_guide_desc', undefined, 'Skema sewa & kapasitas unit'),
                                            },
                                            {
                                                step: 3,
                                                title: t('central.onboarding.step3_title', undefined, 'Pool & Kantor Operasional'),
                                                icon: 'apartment',
                                                desc: t('central.onboarding.step3_guide_desc', undefined, 'Alamat pool & jam operasional'),
                                            },
                                            {
                                                step: 4,
                                                title: t('central.onboarding.step4_title', undefined, 'Paket & Peluncuran'),
                                                icon: 'rocket_launch',
                                                desc: t('central.onboarding.step4_guide_desc', undefined, 'Rekomendasi paket & aktivasi'),
                                            },
                                        ].map((item) => {
                                            const isDone = currentStep > item.step;
                                            const isCurrent = currentStep === item.step;

                                            return (
                                                <div
                                                    key={item.step}
                                                    onClick={() => item.step < currentStep && setCurrentStep(item.step)}
                                                    className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-all ${
                                                        isCurrent
                                                            ? 'border-indigo-500/80 bg-indigo-950/70 shadow-md ring-1 ring-indigo-400/40 text-white'
                                                            : isDone
                                                              ? 'border-emerald-500/30 bg-emerald-950/30 cursor-pointer hover:bg-emerald-900/40 text-emerald-200'
                                                              : 'border-white/5 bg-white/5 opacity-50 text-slate-400'
                                                    }`}
                                                >
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-black text-xs ${
                                                        isDone
                                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                                                            : isCurrent
                                                              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40 ring-2 ring-indigo-400/30'
                                                              : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {isDone ? '✓' : item.step}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className={`text-xs font-bold leading-tight ${isCurrent ? 'text-white font-black' : isDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                                                            {item.title}
                                                        </h4>
                                                        <p className={`text-[10px] truncate mt-0.5 ${isCurrent ? 'text-indigo-200/80' : isDone ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bottom Tagline & Trust Indicator */}
                                <div className="relative z-10 mt-6 pt-3.5 border-t border-slate-800/80">
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                                        <span className="material-symbols-outlined text-sm text-indigo-400">lock</span>
                                        <span>Data terisolasi di database tenant tersendiri</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Panel: Clean Functional Studio Canvas */}
                            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
                                <div>
                                    {/* Stepper Header */}
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                                                <span className="material-symbols-outlined text-xs">tune</span>
                                                {t('central.onboarding.step_indicator', { current: currentStep, total: 4 })}
                                            </span>
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {user.email}
                                            </span>
                                        </div>

                                        {/* Visual Progress Bar */}
                                        <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                                        </div>
                                    </div>

                                    {/* Failed Session Banner if any */}
                                    {failedSession && (
                                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5">
                                            <div className="flex items-start gap-2.5">
                                                <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
                                                <div>
                                                    <p className="text-xs font-bold text-rose-800">
                                                        {t('central.onboarding.failed_title')}
                                                    </p>
                                                    {failedSession.error_message && (
                                                        <p className="mt-0.5 break-words text-[11px] text-rose-700">
                                                            {failedSession.error_message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={submit}>
                                        
                                        {/* STEP 1: IDENTITAS USAHA & SUBDOMAIN */}
                                        {currentStep === 1 && (
                                            <div className="space-y-4">
                                                <div className="mb-2">
                                                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                                                        {t('central.onboarding.step1_title')}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {t('central.onboarding.step1_form_desc')}
                                                    </p>
                                                </div>

                                                {/* Company Name */}
                                                <div>
                                                    <label htmlFor="company_name" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.company_name')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">business</span>
                                                        </div>
                                                        <input
                                                            id="company_name"
                                                            type="text"
                                                            value={data.company_name}
                                                            required
                                                            autoFocus
                                                            onChange={(e) => handleCompanyNameChange(e.target.value)}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                            placeholder={t('central.onboarding.company_name_placeholder')}
                                                        />
                                                    </div>
                                                    <InputError message={errors.company_name || clientErrors.company_name} className="mt-1" />
                                                </div>

                                                {/* Subdomain */}
                                                <div>
                                                    <label htmlFor="subdomain" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.subdomain')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="relative min-w-0 flex-1">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                                <span className="material-symbols-outlined text-lg">language</span>
                                                            </div>
                                                            <input
                                                                id="subdomain"
                                                                type="text"
                                                                value={data.subdomain}
                                                                required
                                                                onChange={(e) =>
                                                                    setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                                                                }
                                                                className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                                placeholder="bintangkejora"
                                                            />
                                                        </div>
                                                        <span className="shrink-0 font-mono text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                                                            .{centralHost}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.subdomain_hint')}</p>
                                                    <InputError message={errors.subdomain || clientErrors.subdomain} className="mt-1" />
                                                </div>

                                                {/* City & Popular Quick Chips */}
                                                <div>
                                                    <label htmlFor="city" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.city')}
                                                    </label>
                                                    <div className="relative">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">location_on</span>
                                                        </div>
                                                        <input
                                                            id="city"
                                                            type="text"
                                                            value={data.city}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    city: val,
                                                                    base_city: !prev.base_city || prev.base_city === prev.city ? val : prev.base_city,
                                                                }));
                                                            }}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                            placeholder={t('central.onboarding.city_placeholder')}
                                                        />
                                                    </div>
                                                    {/* Quick City Single Select Chips */}
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {popularCities.map((cityName) => {
                                                            const isSelected = data.city.toLowerCase() === cityName.toLowerCase();
                                                            return (
                                                                <button
                                                                    key={cityName}
                                                                    type="button"
                                                                    onClick={() => handleCitySelect(cityName)}
                                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition ${
                                                                        isSelected
                                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs ring-1 ring-indigo-500/20'
                                                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                                                                    }`}
                                                                >
                                                                    {isSelected ? '✓ ' : '+ '}
                                                                    {cityName}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.city_hint')}</p>
                                                </div>

                                                {/* WhatsApp Phone */}
                                                <div>
                                                    <label htmlFor="phone" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.phone')}
                                                    </label>
                                                    <div className="relative">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">chat</span>
                                                        </div>
                                                        <input
                                                            id="phone"
                                                            type="tel"
                                                            value={data.phone}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setData((prev) => ({
                                                                    ...prev,
                                                                    phone: val,
                                                                    base_phone: !prev.base_phone || prev.base_phone === prev.phone ? val : prev.base_phone,
                                                                }));
                                                            }}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                            placeholder={t('central.onboarding.phone_placeholder')}
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.phone_hint')}</p>
                                                </div>

                                                {/* Next Button */}
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleNext}
                                                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                                                    >
                                                        <span>{t('central.onboarding.btn_next_model', undefined, 'Lanjut: Model Rental & Armada')}</span>
                                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 2: MODEL RENTAL & SKALA ARMADA (VISUAL & ZERO FATIGUE) */}
                                        {currentStep === 2 && (
                                            <div className="space-y-4">
                                                <div className="mb-2">
                                                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                                                        {t('central.onboarding.step2_title')}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {t('central.onboarding.step2_form_desc')}
                                                    </p>
                                                </div>

                                                {/* Rental Model Visual Cards */}
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.rental_model_title')}
                                                    </label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                        {[
                                                            {
                                                                key: 'self',
                                                                label: t('central.onboarding.rental_model_self', undefined, 'Lepas Kunci'),
                                                                icon: 'key',
                                                                desc: 'Sewa mandiri pelanggan',
                                                            },
                                                            {
                                                                key: 'driver',
                                                                label: t('central.onboarding.rental_model_driver', undefined, 'Dengan Supir'),
                                                                icon: 'person',
                                                                desc: 'Layanan sopir & perjalanan',
                                                            },
                                                            {
                                                                key: 'both',
                                                                label: t('central.onboarding.rental_model_both', undefined, 'Kombinasi Keduanya'),
                                                                icon: 'stars',
                                                                desc: 'Fleksibel lepas kunci & sopir',
                                                            },
                                                        ].map((opt) => {
                                                            const isSelected = data.rental_model === opt.key;
                                                            return (
                                                                <div
                                                                    key={opt.key}
                                                                    onClick={() => setData('rental_model', opt.key)}
                                                                    className={`flex flex-col items-center text-center p-3 rounded-2xl border cursor-pointer transition-all ${
                                                                        isSelected
                                                                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                                                                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl mb-1.5 ${
                                                                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                        <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                                                                    <span className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Fleet Size Scale */}
                                                <div>
                                                    <label className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.fleet_size_title')}
                                                    </label>
                                                    <p className="mb-2 text-[11px] text-slate-400">{t('central.onboarding.fleet_size_hint')}</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[
                                                            { key: '1-5', title: t('central.onboarding.fleet_size_1_5'), desc: t('central.onboarding.fleet_size_1_5_desc') },
                                                            { key: '6-20', title: t('central.onboarding.fleet_size_6_20'), desc: t('central.onboarding.fleet_size_6_20_desc') },
                                                            { key: '21-50+', title: t('central.onboarding.fleet_size_21_plus'), desc: t('central.onboarding.fleet_size_21_plus_desc') },
                                                        ].map((opt) => {
                                                            const isSelected = data.fleet_size === opt.key;
                                                            return (
                                                                <div
                                                                    key={opt.key}
                                                                    onClick={() => setData('fleet_size', opt.key)}
                                                                    className={`rounded-xl border p-2.5 text-center cursor-pointer transition ${
                                                                        isSelected
                                                                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs'
                                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <span className="block text-xs font-bold text-slate-900">{opt.title}</span>
                                                                    <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Verticals / Modul */}
                                                <div>
                                                    <p className="mb-1.5 text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.verticals_title')} <span className="text-rose-500">*</span>
                                                    </p>
                                                    <div className="space-y-2">
                                                        {verticalOptions.map((option) => {
                                                            const checked = data.verticals.includes(option.key);
                                                            const disabled = !option.available;

                                                            return (
                                                                <label
                                                                    key={option.key}
                                                                    aria-disabled={disabled}
                                                                    className={`flex gap-3 rounded-2xl border p-3 transition-all ${
                                                                        disabled
                                                                            ? 'cursor-not-allowed border-slate-200/50 bg-slate-100/50 opacity-50'
                                                                            : checked
                                                                              ? 'cursor-pointer border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/30'
                                                                              : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 disabled:cursor-not-allowed"
                                                                        checked={checked}
                                                                        disabled={disabled}
                                                                        onChange={() => toggleVertical(option.key)}
                                                                    />
                                                                    <span className="flex min-w-0 items-start gap-2.5">
                                                                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${
                                                                            checked ? 'border-indigo-200 bg-indigo-100 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-500'
                                                                        }`}>
                                                                            <span className="material-symbols-outlined text-base">
                                                                                {verticalIcon(option.key)}
                                                                            </span>
                                                                        </span>
                                                                        <span>
                                                                            <span className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-900">
                                                                                {option.label}
                                                                                {disabled && (
                                                                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                                                                                        {t('central.onboarding.verticals.coming_soon')}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                            <span className="block text-[11px] text-slate-500 mt-0.5">
                                                                                {option.description}
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                    <InputError message={errors.verticals || clientErrors.verticals} className="mt-1" />
                                                </div>

                                                {/* Included Core Modules Preview */}
                                                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 text-xs text-slate-600">
                                                    <p className="font-bold text-slate-800 text-[11px]">{t('central.onboarding.preview_title')}</p>
                                                    <p className="mt-0.5 text-[11px] text-slate-500">{previewHint}</p>
                                                </div>

                                                {/* Navigation Buttons */}
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleBack}
                                                        className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                                    >
                                                        ← {t('central.onboarding.btn_back')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleNext}
                                                        className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
                                                    >
                                                        <span>{t('central.onboarding.btn_next_base', undefined, 'Lanjut: Pool & Kantor Operasional')}</span>
                                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 3: POOL & KANTOR OPERASIONAL (SMART PRE-FILL & TIDAK REDUNDAN) */}
                                        {currentStep === 3 && (
                                            <div className="space-y-4">
                                                <div className="mb-2">
                                                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                                                        {t('central.onboarding.step3_title')}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {t('central.onboarding.step3_form_desc')}
                                                    </p>
                                                </div>

                                                {/* Base Name */}
                                                <div>
                                                    <label htmlFor="base_name" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.base_name')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">apartment</span>
                                                        </div>
                                                        <input
                                                            id="base_name"
                                                            type="text"
                                                            value={data.base_name}
                                                            required
                                                            onChange={(e) => {
                                                                setData('base_name', e.target.value);
                                                                if (clientErrors.base_name) {
                                                                    setClientErrors((prev) => ({ ...prev, base_name: '' }));
                                                                }
                                                            }}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                            placeholder={t('central.onboarding.base_name_placeholder')}
                                                        />
                                                    </div>
                                                    <InputError message={errors.base_name || clientErrors.base_name} className="mt-1" />
                                                </div>

                                                {/* Base Address */}
                                                <div>
                                                    <label htmlFor="base_address" className="mb-1 block text-xs font-bold text-slate-700">
                                                        {t('central.onboarding.base_address')}
                                                    </label>
                                                    <div className="relative">
                                                        <div className="pointer-events-none absolute top-2.5 left-0 flex items-center pl-3 text-slate-400">
                                                            <span className="material-symbols-outlined text-lg">pin_drop</span>
                                                        </div>
                                                        <textarea
                                                            id="base_address"
                                                            rows={2}
                                                            value={data.base_address}
                                                            onChange={(e) => setData('base_address', e.target.value)}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                            placeholder={t('central.onboarding.base_address_placeholder')}
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.base_address_hint')}</p>
                                                    <InputError message={errors.base_address} className="mt-1" />
                                                </div>

                                                {/* City & Province Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    <div>
                                                        <label htmlFor="base_city" className="mb-1 block text-xs font-bold text-slate-700">
                                                            {t('central.onboarding.base_city')}
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                                <span className="material-symbols-outlined text-lg">location_city</span>
                                                            </div>
                                                            <input
                                                                id="base_city"
                                                                type="text"
                                                                value={data.base_city}
                                                                onChange={(e) => setData('base_city', e.target.value)}
                                                                className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                                placeholder={t('central.onboarding.base_city_placeholder')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.base_city} className="mt-1" />
                                                    </div>

                                                    <div>
                                                        <label htmlFor="base_province" className="mb-1 block text-xs font-bold text-slate-700">
                                                            {t('central.onboarding.base_province')}
                                                        </label>
                                                        <div className="relative">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                                <span className="material-symbols-outlined text-lg">map</span>
                                                            </div>
                                                            <input
                                                                id="base_province"
                                                                type="text"
                                                                value={data.base_province}
                                                                onChange={(e) => setData('base_province', e.target.value)}
                                                                className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all hover:border-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                                                                placeholder={t('central.onboarding.base_province_placeholder')}
                                                            />
                                                        </div>
                                                        <InputError message={errors.base_province} className="mt-1" />
                                                    </div>
                                                </div>

                                                {/* Operating Hours Box */}
                                                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                            <span className="material-symbols-outlined text-base text-indigo-600">schedule</span>
                                                            {t('central.onboarding.base_operating_hours')}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggle24Hours(!is24Hours)}
                                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                                                                is24Hours
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                                            }`}
                                                        >
                                                            {is24Hours ? '✓ ' : ''}{t('central.onboarding.base_24_hours')}
                                                        </button>
                                                    </div>

                                                    {!is24Hours ? (
                                                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                                                            <div>
                                                                <label htmlFor="base_opens_at" className="mb-1 block text-[11px] font-bold text-slate-500">
                                                                    {t('central.onboarding.base_opens_at')}
                                                                </label>
                                                                <input
                                                                    id="base_opens_at"
                                                                    type="time"
                                                                    value={data.base_opens_at}
                                                                    onChange={(e) => setData('base_opens_at', e.target.value)}
                                                                    className="block w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="base_closes_at" className="mb-1 block text-[11px] font-bold text-slate-500">
                                                                    {t('central.onboarding.base_closes_at')}
                                                                </label>
                                                                <input
                                                                    id="base_closes_at"
                                                                    type="time"
                                                                    value={data.base_closes_at}
                                                                    onChange={(e) => setData('base_closes_at', e.target.value)}
                                                                    className="block w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-emerald-700 font-medium">
                                                            {t('central.onboarding.base_24_hours_note')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Advanced Options Accordion (Code & Capacity) */}
                                                <div className="pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAdvancedBase(!showAdvancedBase)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition focus:outline-none"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            {showAdvancedBase ? 'expand_less' : 'expand_more'}
                                                        </span>
                                                        <span>
                                                            {showAdvancedBase ? 'Sembunyikan Pengaturan Tambahan' : 'Pengaturan Lanjutan (Kode Pool & Kapasitas Parkir)'}
                                                        </span>
                                                    </button>

                                                    {showAdvancedBase && (
                                                        <div className="mt-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                            <div>
                                                                <label htmlFor="base_code" className="mb-1 block text-[11px] font-bold text-slate-600">
                                                                    {t('central.onboarding.base_code')} <span className="text-rose-500">*</span>
                                                                </label>
                                                                <input
                                                                    id="base_code"
                                                                    type="text"
                                                                    value={data.base_code}
                                                                    required
                                                                    onChange={(e) => {
                                                                        setData('base_code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                                                                        if (clientErrors.base_code) {
                                                                            setClientErrors((prev) => ({ ...prev, base_code: '' }));
                                                                        }
                                                                    }}
                                                                    className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono uppercase font-bold text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                                                                    placeholder="HQ"
                                                                    maxLength={16}
                                                                />
                                                                <InputError message={errors.base_code || clientErrors.base_code} className="mt-1" />
                                                            </div>

                                                            <div>
                                                                <label htmlFor="base_vehicle_capacity" className="mb-1 block text-[11px] font-bold text-slate-600">
                                                                    {t('central.onboarding.base_capacity')}
                                                                </label>
                                                                <input
                                                                    id="base_vehicle_capacity"
                                                                    type="number"
                                                                    min="1"
                                                                    max="9999"
                                                                    value={data.base_vehicle_capacity ?? ''}
                                                                    onChange={(e) => setData('base_vehicle_capacity', e.target.value ? parseInt(e.target.value, 10) : null)}
                                                                    className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-medium text-slate-900 shadow-xs focus:border-indigo-600 focus:outline-none"
                                                                    placeholder={t('central.onboarding.base_capacity_placeholder')}
                                                                />
                                                                <InputError message={errors.base_vehicle_capacity} className="mt-1" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Navigation Buttons */}
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleBack}
                                                        className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                                                    >
                                                        ← {t('central.onboarding.btn_back')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleNext}
                                                        className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
                                                    >
                                                        <span>{t('central.onboarding.btn_next_plan', undefined, 'Lanjut: Pilihan Paket & Peluncuran')}</span>
                                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* STEP 4: PILIHAN PAKET & PELUNCURAN WORKSPACE */}
                                        {currentStep === 4 && (
                                            <div className="space-y-4">
                                                <div className="mb-2">
                                                    <h3 className="text-base font-black text-slate-900 sm:text-lg">
                                                        {t('central.onboarding.step4_title')}
                                                    </h3>
                                                    <p className="text-xs font-medium text-slate-500">
                                                        {t('central.onboarding.step4_form_desc')}
                                                    </p>
                                                </div>

                                                {/* Live Summary Box */}
                                                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-sky-50/40 p-3.5 shadow-xs">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-2 pb-1.5 border-b border-indigo-100">
                                                        <span className="material-symbols-outlined text-base text-indigo-600">verified</span>
                                                        <span>{t('central.onboarding.summary_title')}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                        <div>
                                                            <span className="text-slate-400 block">{t('central.onboarding.summary_company')}:</span>
                                                            <span className="font-bold text-slate-800">{data.company_name}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">{t('central.onboarding.summary_domain')}:</span>
                                                            <span className="font-bold text-indigo-600 font-mono">{data.subdomain}.{centralHost}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">{t('central.onboarding.summary_base')}:</span>
                                                            <span className="font-bold text-slate-800">
                                                                {data.base_name || t('central.onboarding.default_base_name', undefined, 'Kantor Operasional')} ({data.base_code || 'HQ'})
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400 block">{t('central.onboarding.summary_location')}:</span>
                                                            <span className="font-bold text-slate-800">{data.base_city || data.city || '-'}</span>
                                                        </div>
                                                        <div className="col-span-2 pt-1 border-t border-indigo-100/70">
                                                            <span className="text-slate-400 block">{t('central.onboarding.summary_services')}:</span>
                                                            <span className="font-bold text-slate-800">
                                                                {data.verticals.map((k) => t(`central.onboarding.verticals.${k}`, undefined, k)).join(' + ')} • {data.fleet_size} {t('central.onboarding.summary_units', undefined, 'unit')} ({data.rental_model === 'self' ? 'Lepas Kunci' : data.rental_model === 'driver' ? 'Dengan Sopir' : 'Lepas Kunci & Sopir'})
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Available Plans */}
                                                {availablePlans.length > 0 && (
                                                    <div>
                                                        <p className="mb-1.5 text-xs font-bold text-slate-700">
                                                            {t('central.onboarding.plans_title')}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {availablePlans.map((p) => {
                                                                const selected = data.plan_key === p.key;
                                                                const hasMonthly = p.price && Number(p.price) > 0;
                                                                const isRecommended = isPlanRecommended(p.key) || p.is_popular || p.is_default;

                                                                return (
                                                                    <div
                                                                        key={p.key}
                                                                        onClick={() => setData('plan_key', p.key)}
                                                                        className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-2.5 cursor-pointer transition-all ${
                                                                            selected
                                                                                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                                                                                : isRecommended
                                                                                  ? 'border-emerald-300 bg-emerald-50/20 hover:border-emerald-400'
                                                                                  : 'border-slate-200 bg-white hover:border-slate-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-2.5">
                                                                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                                                                selected
                                                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                                                    : 'border-slate-300 bg-white'
                                                                            }`}>
                                                                                {selected && (
                                                                                    <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                                                                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                                                    </svg>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                                    <span className="text-xs font-bold text-slate-900">{p.name}</span>
                                                                                    {p.badge && (
                                                                                        <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-700">
                                                                                            {p.badge}
                                                                                        </span>
                                                                                    )}
                                                                                    {isRecommended && (!p.badge || !p.badge.toLowerCase().includes('rekomendasi')) && (
                                                                                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                                                                                            ★ {t('central.onboarding.plan_recommended_badge', undefined, 'Rekomendasi')}
                                                                                        </span>
                                                                                    )}
                                                                                    {p.trial_days !== undefined && p.trial_days !== null && Number(p.trial_days) > 0 ? (
                                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                                                                                            {t('central.onboarding.trial_badge', { days: p.trial_days }, `Trial ${p.trial_days} Hari`)}
                                                                                        </span>
                                                                                    ) : hasMonthly && (
                                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                                                                                            {t('central.onboarding.pay_direct_badge', undefined, '⚡ Bayar Langsung')}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {p.limits && (
                                                                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                                                                        <span>🚗 {p.limits.max_vehicles ? t('central.onboarding.max_vehicles', { count: p.limits.max_vehicles }, `Maks. ${p.limits.max_vehicles} Armada`) : t('central.onboarding.unlimited_vehicles', undefined, 'Unlimited Armada')}</span>
                                                                                        <span>•</span>
                                                                                        <span>👥 {p.limits.max_users ? t('central.onboarding.max_users', { count: p.limits.max_users }, `Maks. ${p.limits.max_users} Pengguna`) : t('central.onboarding.unlimited_users', undefined, 'Unlimited Pengguna')}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
                                                                            <div className="text-xs font-bold text-slate-900">
                                                                                {!hasMonthly ? (
                                                                                    <span className="text-emerald-700 font-bold">{t('central.onboarding.plan_free', undefined, 'Gratis')}</span>
                                                                                ) : (
                                                                                    <span>
                                                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: p.currency || 'IDR', maximumFractionDigits: 0 }).format(Number(p.price))}
                                                                                        <span className="text-[10px] font-normal text-slate-400">{t('central.subscription.month', undefined, '/bln')}</span>
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <InputError message={errors.plan_key} className="mt-1" />
                                                    </div>
                                                )}

                                                {/* Navigation & Submit */}
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleBack}
                                                        disabled={processing}
                                                        className="w-1/3 rounded-xl border border-slate-200 bg-white py-2.5 sm:py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                                                    >
                                                        ← {t('central.onboarding.btn_back')}
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        {processing ? (
                                                            <>
                                                                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                <span>{t('central.onboarding.submitting')}</span>
                                                            </>
                                                        ) : selectedPlan && Number(selectedPlan.price || 0) > 0 && (!selectedPlan.trial_days || Number(selectedPlan.trial_days) === 0) ? (
                                                            <span>{t('central.onboarding.btn_proceed_payment', undefined, 'Lanjut ke Pembayaran & Aktivasi →')}</span>
                                                        ) : (
                                                            <span>{t('central.onboarding.submit_launch')}</span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </form>
                                </div>

                                {/* Secondary Actions & Links */}
                                <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        type="button"
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                try {
                                                    window.localStorage.removeItem(storageKey);
                                                } catch {
                                                    // ignore
                                                }
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-rose-600"
                                    >
                                        <span className="material-symbols-outlined text-base">logout</span>
                                        {t('shell.log_out')}
                                    </Link>

                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition hover:text-slate-800"
                                    >
                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                        {t('auth_ui.back_home')}
                                    </Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Bottom Simple Copyright Bar */}
                <footer className="relative z-20 py-2.5 text-center text-[11px] font-medium text-slate-400">
                    &copy; {new Date().getFullYear()} {siteName}. {t('central.onboarding.all_rights_reserved', undefined, 'All rights reserved.')}
                </footer>
            </div>
        </>
    );
}
