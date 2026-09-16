import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { DEFAULT_SITE_NAME } from '@/constants/brand';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

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
    initialPlanKey = 'free',
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
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors } = useForm({
        company_name: failedSession?.company_name ?? initialCompanyName ?? '',
        phone: failedSession?.phone ?? initialPhone ?? '',
        city: failedSession?.city ?? initialCity ?? '',
        subdomain: failedSession?.subdomain ?? initialSubdomain ?? '',
        fleet_size: failedSession?.fleet_size ?? initialFleetSize ?? '1-5',
        rental_model: failedSession?.rental_model ?? initialRentalModel ?? 'both',
        base_name: failedSession?.base_name ?? initialBaseName ?? '',
        base_code: failedSession?.base_code ?? initialBaseCode ?? 'HQ',
        base_address: failedSession?.base_address ?? initialBaseAddress ?? '',
        base_city: failedSession?.base_city ?? initialBaseCity ?? initialCity ?? '',
        base_province: failedSession?.base_province ?? initialBaseProvince ?? '',
        base_phone: failedSession?.base_phone ?? initialBasePhone ?? initialPhone ?? '',
        base_email: failedSession?.base_email ?? initialBaseEmail ?? user.email ?? '',
        base_opens_at: failedSession?.base_opens_at ?? initialBaseOpensAt ?? '08:00',
        base_closes_at: failedSession?.base_closes_at ?? initialBaseClosesAt ?? '20:00',
        base_vehicle_capacity: failedSession?.base_vehicle_capacity ?? initialBaseVehicleCapacity ?? '',
        plan_key: failedSession?.plan_key ?? initialPlanKey,
        verticals: failedSession?.verticals ?? (['rental'] as string[]),
    });

    const [is24Hours, setIs24Hours] = useState<boolean>(
        (data.base_opens_at === '00:00' && data.base_closes_at === '23:59')
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
        const prevDefaultBaseName = data.company_name ? `Kantor Operasional ${data.company_name}` : '';
        const shouldUpdateBaseName = !data.base_name || data.base_name === prevDefaultBaseName;

        setData((prev) => ({
            ...prev,
            company_name: val,
            subdomain: !data.subdomain || data.subdomain === prevSlug ? newSlug : prev.subdomain,
            base_name: shouldUpdateBaseName ? (val ? `Kantor Operasional ${val}` : '') : prev.base_name,
        }));
        if (clientErrors.company_name) {
            setClientErrors((prev) => ({ ...prev, company_name: '' }));
        }
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
            .map((key) => t(`central.onboarding.verticals.${key}`))
            .join(', ')}`;
    }, [data.verticals, t]);

    const selectedPlan = useMemo(() => {
        return availablePlans.find((p) => p.key === data.plan_key) || availablePlans[0];
    }, [availablePlans, data.plan_key]);

    const validateStep1 = (): boolean => {
        const errs: Record<string, string> = {};
        if (!data.company_name.trim()) {
            errs.company_name = 'Nama perusahaan atau usaha rental wajib diisi.';
        }
        if (!data.subdomain.trim()) {
            errs.subdomain = 'Subdomain workspace wajib diisi.';
        } else if (data.subdomain.length < 2) {
            errs.subdomain = 'Subdomain minimal 2 karakter.';
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = (): boolean => {
        const errs: Record<string, string> = {};
        if (!data.base_name.trim()) {
            errs.base_name = 'Nama kantor operasional atau pool armada wajib diisi.';
        }
        if (!data.base_code.trim()) {
            errs.base_code = 'Kode base wajib diisi (contoh: HQ).';
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = (): boolean => {
        const errs: Record<string, string> = {};
        if (data.verticals.length === 0) {
            errs.verticals = t('central.onboarding.validation.verticals_required');
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = (): void => {
        if (currentStep === 1) {
            if (validateStep1()) {
                if (!data.base_name.trim() && data.company_name) {
                    setData('base_name', `Kantor Operasional ${data.company_name}`);
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
            onError: (errs) => {
                if (errs.company_name || errs.subdomain || errs.phone || errs.city) {
                    setCurrentStep(1);
                } else if (errs.base_name || errs.base_code || errs.base_address || errs.base_city || errs.base_phone) {
                    setCurrentStep(2);
                } else if (errs.verticals || errs.fleet_size || errs.rental_model) {
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
        if (key === 'rental') {
            return 'directions_car';
        }
        if (key === 'travel') {
            return 'airport_shuttle';
        }

        return 'apps';
    };

    const popularCities = ['Jakarta', 'Bali (Denpasar)', 'Surabaya', 'Yogyakarta', 'Bandung', 'Medan', 'Semarang'];

    const handleCityClick = (cityName: string) => {
        const currentText = data.city ?? '';
        const currentList = currentText
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

        const existingIndex = currentList.findIndex((c) => c.toLowerCase() === cityName.toLowerCase());

        if (existingIndex !== -1) {
            currentList.splice(existingIndex, 1);
            setData('city', currentList.join(', '));
        } else {
            currentList.push(cityName);
            setData('city', currentList.join(', '));
        }
    };

    const isCitySelected = (cityName: string) => {
        if (!data.city) return false;
        const currentList = data.city
            .split(',')
            .map((c) => c.trim().toLowerCase())
            .filter(Boolean);
        return currentList.includes(cityName.toLowerCase());
    };

    return (
        <>
            <Head title={t('central.onboarding.title')} />

            <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-sky-50/60 to-indigo-50/80 text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Ambient glow effects */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-20 -top-20 h-[450px] w-[450px] rounded-full bg-sky-300/30 blur-[130px]" />
                    <div className="absolute -right-20 -bottom-20 h-[450px] w-[450px] rounded-full bg-indigo-300/30 blur-[130px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-300/20 blur-[150px]" />
                </div>

                {/* Top-Right Language Switcher */}
                <div className="absolute right-6 top-6 z-20">
                    <LanguageSwitcher compact className="bg-white/80 border border-slate-200/80 backdrop-blur-md text-xs font-bold shadow-sm [&_button]:text-slate-600 [&_button.bg-white]:bg-indigo-600 [&_button.bg-white]:text-white" />
                </div>

                {/* Left Side: Brand & Progress Showcase */}
                <div className="relative hidden lg:flex lg:w-5/12 border-r border-slate-200/60 bg-white/40 backdrop-blur-md">
                    <div className="relative z-10 flex w-full flex-col justify-between p-12 lg:p-14">
                        {/* Top Status Pill */}
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur-md">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                Multi-Tenant Provisioning
                            </span>
                        </div>

                        {/* Middle Content & Visual Guide */}
                        <div className="max-w-md">
                            <div className="mb-6 inline-flex">
                                {siteLogo ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-3 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                                        <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-indigo-100 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 backdrop-blur-xl">
                                        <span className="material-symbols-outlined text-4xl text-indigo-600">apartment</span>
                                    </div>
                                )}
                            </div>

                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                                {currentStep === 1 && '1. Identitas & Domain'}
                                {currentStep === 2 && '2. Kantor Operasional'}
                                {currentStep === 3 && '3. Skala & Modul Bisnis'}
                                {currentStep === 4 && '4. Konfirmasi & Peluncuran'}
                            </h1>
                            <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
                                {currentStep === 1 && 'Tentukan nama usaha rental dan alamat domain workspace khusus untuk bisnis Anda.'}
                                {currentStep === 2 && 'Atur identitas kantor pusat dan pool armada utama yang akan otomatis didaftarkan ke sistem.'}
                                {currentStep === 3 && 'Pilih modul operasional armada dan estimasi kendaraan agar kapasitas sistem terkalibrasi presisi.'}
                                {currentStep === 4 && 'Tinjau ringkasan workspace dan pilih paket langganan terbaik untuk memulai operasional.'}
                            </p>

                            {/* Live Step Progress Guide */}
                            <div className="mt-8 space-y-3">
                                {[
                                    { step: 1, title: 'Identitas & Subdomain', icon: 'business', desc: 'Nama usaha & URL workspace' },
                                    { step: 2, title: 'Kantor Operasional', icon: 'apartment', desc: 'Pool armada & kantor pusat' },
                                    { step: 3, title: 'Skala & Modul Armada', icon: 'tune', desc: 'Rental, shuttle & jumlah unit' },
                                    { step: 4, title: 'Pilihan Paket & Launching', icon: 'rocket_launch', desc: 'Skema paket & database tenant' },
                                ].map((item) => {
                                    const isDone = currentStep > item.step;
                                    const isCurrent = currentStep === item.step;

                                    return (
                                        <div
                                            key={item.step}
                                            onClick={() => item.step < currentStep && setCurrentStep(item.step)}
                                            className={`flex items-center gap-3.5 rounded-2xl border p-3 transition-all ${
                                                isCurrent
                                                    ? 'border-indigo-500/80 bg-white shadow-md ring-2 ring-indigo-500/20'
                                                    : isDone
                                                      ? 'border-emerald-200 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50'
                                                      : 'border-slate-200/60 bg-white/40 opacity-60'
                                            }`}
                                        >
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : isCurrent
                                                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                                      : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {isDone ? '✓' : item.step}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`text-xs font-bold ${isCurrent ? 'text-indigo-950 font-black' : isDone ? 'text-emerald-900' : 'text-slate-500'}`}>
                                                    {item.title}
                                                </h4>
                                                <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Tagline */}
                        <div className="text-xs font-medium text-slate-400">
                            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
                        </div>
                    </div>
                </div>

                {/* Right Side: Wizard Form Stage */}
                <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-8 lg:w-7/12 lg:p-12">
                    <div className="w-full max-w-xl">
                        {/* Mobile Brand Logo */}
                        <div className="mb-4 flex justify-center lg:hidden">
                            {siteLogo ? (
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md backdrop-blur-xl">
                                    <img src={siteLogo} alt={siteName} className="h-full w-full object-contain" />
                                </div>
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-500/10 shadow-md backdrop-blur-xl">
                                    <span className="material-symbols-outlined text-2xl text-indigo-600">apartment</span>
                                </div>
                            )}
                        </div>

                        {/* Wizard Card */}
                        <div className="rounded-3xl border border-white/90 bg-white/90 p-6 sm:p-9 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            
                            {/* Stepper Header */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                                        Langkah {currentStep} dari 4
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                        {user.email}
                                    </span>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="mt-2.5 grid grid-cols-4 gap-2">
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                    <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep >= 4 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                </div>
                            </div>

                            {failedSession && (
                                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 backdrop-blur-md">
                                    <div className="flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-rose-600 text-lg">error</span>
                                        <div>
                                            <p className="text-xs font-bold text-rose-800">
                                                {t('central.onboarding.failed_title')}
                                            </p>
                                            {failedSession.error_message && (
                                                <p className="mt-1 break-words text-xs text-rose-700">
                                                    {failedSession.error_message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit}>
                                
                                {/* STEP 1: PROFIL USAHA & SUBDOMAIN */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-extrabold text-slate-900">
                                                {t('central.onboarding.step1_title')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Beri nama bisnis rental Anda dan tentukan alamat website workspace.
                                            </p>
                                        </div>

                                        {/* Company Name */}
                                        <div>
                                            <label htmlFor="company_name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.company_name')} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                    <span className="material-symbols-outlined text-xl">business</span>
                                                </div>
                                                <input
                                                    id="company_name"
                                                    type="text"
                                                    value={data.company_name}
                                                    required
                                                    autoFocus
                                                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder="Contoh: CV Bintang Kejora Rental"
                                                />
                                            </div>
                                            <InputError message={errors.company_name || clientErrors.company_name} className="mt-1.5" />
                                        </div>

                                        {/* Subdomain */}
                                        <div>
                                            <label htmlFor="subdomain" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.subdomain')} <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative min-w-0 flex-1">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">language</span>
                                                    </div>
                                                    <input
                                                        id="subdomain"
                                                        type="text"
                                                        value={data.subdomain}
                                                        required
                                                        onChange={(e) =>
                                                            setData('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                                                        }
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="bintangkejora"
                                                    />
                                                </div>
                                                <span className="shrink-0 font-mono text-xs font-bold text-slate-500 bg-slate-100 px-3 py-3.5 rounded-2xl border border-slate-200">
                                                    .{centralHost}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.subdomain_hint')}</p>
                                            <InputError message={errors.subdomain || clientErrors.subdomain} className="mt-1.5" />
                                        </div>

                                        {/* City & Location */}
                                        <div>
                                            <label htmlFor="city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.city')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                    <span className="material-symbols-outlined text-xl">location_on</span>
                                                </div>
                                                <input
                                                    id="city"
                                                    type="text"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder={t('central.onboarding.city_placeholder')}
                                                />
                                            </div>
                                            {/* Quick City Chips */}
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {popularCities.map((cityName) => {
                                                    const selected = isCitySelected(cityName);
                                                    return (
                                                        <button
                                                            key={cityName}
                                                            type="button"
                                                            onClick={() => handleCityClick(cityName)}
                                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                                                                selected
                                                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {selected ? '✓ ' : '+ '}
                                                            {cityName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.city_hint')}</p>
                                        </div>

                                        {/* WhatsApp Phone */}
                                        <div>
                                            <label htmlFor="phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.phone')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                    <span className="material-symbols-outlined text-xl">chat</span>
                                                </div>
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={(e) => setData('phone', e.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                                                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition"
                                            >
                                                <span>Lanjut: Kantor Operasional</span>
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: KANTOR OPERASIONAL (BASE UTAMA) */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-extrabold text-slate-900">
                                                {t('central.onboarding.step2_title')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Tentukan identitas kantor pusat dan pool armada utama yang akan otomatis didaftarkan ke sistem.
                                            </p>
                                        </div>

                                        {/* Base Name & Code */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2">
                                                <label htmlFor="base_name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_name')} <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">apartment</span>
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
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder={t('central.onboarding.base_name_placeholder')}
                                                    />
                                                </div>
                                                <InputError message={errors.base_name || clientErrors.base_name} className="mt-1.5" />
                                            </div>

                                            <div>
                                                <label htmlFor="base_code" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_code')} <span className="text-rose-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">tag</span>
                                                    </div>
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
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono uppercase text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="HQ"
                                                        maxLength={16}
                                                    />
                                                </div>
                                                <InputError message={errors.base_code || clientErrors.base_code} className="mt-1.5" />
                                            </div>
                                        </div>

                                        {/* Base Address */}
                                        <div>
                                            <label htmlFor="base_address" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.base_address')}
                                            </label>
                                            <div className="relative">
                                                <div className="pointer-events-none absolute top-3.5 left-0 flex items-center pl-4 text-slate-400">
                                                    <span className="material-symbols-outlined text-xl">pin_drop</span>
                                                </div>
                                                <textarea
                                                    id="base_address"
                                                    rows={2}
                                                    value={data.base_address}
                                                    onChange={(e) => setData('base_address', e.target.value)}
                                                    className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                    placeholder={t('central.onboarding.base_address_placeholder')}
                                                />
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.base_address_hint')}</p>
                                            <InputError message={errors.base_address} className="mt-1.5" />
                                        </div>

                                        {/* City & Province */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="base_city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_city')}
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">location_city</span>
                                                    </div>
                                                    <input
                                                        id="base_city"
                                                        type="text"
                                                        value={data.base_city}
                                                        onChange={(e) => setData('base_city', e.target.value)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="Contoh: Jakarta Selatan"
                                                    />
                                                </div>
                                                <InputError message={errors.base_city} className="mt-1.5" />
                                            </div>

                                            <div>
                                                <label htmlFor="base_province" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_province')}
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">map</span>
                                                    </div>
                                                    <input
                                                        id="base_province"
                                                        type="text"
                                                        value={data.base_province}
                                                        onChange={(e) => setData('base_province', e.target.value)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="Contoh: DKI Jakarta"
                                                    />
                                                </div>
                                                <InputError message={errors.base_province} className="mt-1.5" />
                                            </div>
                                        </div>

                                        {/* Phone & Parking Capacity */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="base_phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_phone')}
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">call</span>
                                                    </div>
                                                    <input
                                                        id="base_phone"
                                                        type="tel"
                                                        value={data.base_phone}
                                                        onChange={(e) => setData('base_phone', e.target.value)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder="081234567890"
                                                    />
                                                </div>
                                                <InputError message={errors.base_phone} className="mt-1.5" />
                                            </div>

                                            <div>
                                                <label htmlFor="base_vehicle_capacity" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.base_capacity')}
                                                </label>
                                                <div className="relative">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                                        <span className="material-symbols-outlined text-xl">directions_car</span>
                                                    </div>
                                                    <input
                                                        id="base_vehicle_capacity"
                                                        type="number"
                                                        min="1"
                                                        max="9999"
                                                        value={data.base_vehicle_capacity ?? ''}
                                                        onChange={(e) => setData('base_vehicle_capacity', e.target.value ? parseInt(e.target.value, 10) : null)}
                                                        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-xs font-mono text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                        placeholder={t('central.onboarding.base_capacity_placeholder')}
                                                    />
                                                </div>
                                                <p className="mt-1 text-[11px] text-slate-400">{t('central.onboarding.base_capacity_hint')}</p>
                                                <InputError message={errors.base_vehicle_capacity} className="mt-1.5" />
                                            </div>
                                        </div>

                                        {/* Operating Hours */}
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-base text-indigo-600">schedule</span>
                                                    {t('central.onboarding.base_operating_hours')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggle24Hours(!is24Hours)}
                                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition ${
                                                        is24Hours
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                                                    }`}
                                                >
                                                    {is24Hours ? '✓ ' : ''}{t('central.onboarding.base_24_hours')}
                                                </button>
                                            </div>

                                            {!is24Hours ? (
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <div>
                                                        <label htmlFor="base_opens_at" className="mb-1 block text-[11px] font-bold text-slate-500">
                                                            {t('central.onboarding.base_opens_at')}
                                                        </label>
                                                        <input
                                                            id="base_opens_at"
                                                            type="time"
                                                            value={data.base_opens_at}
                                                            onChange={(e) => setData('base_opens_at', e.target.value)}
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
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
                                                            className="block w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-mono text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-emerald-700 font-medium">
                                                    Base beroperasi penuh 24 jam setiap hari untuk serah terima armada.
                                                </p>
                                            )}
                                        </div>

                                        {/* Live Preview Info Box */}
                                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs text-slate-600 flex items-center gap-2.5">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                                <span className="material-symbols-outlined text-lg">verified</span>
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-indigo-950 truncate">
                                                    {data.base_name || 'Kantor Operasional'} ({data.base_code || 'HQ'})
                                                </p>
                                                <p className="text-[10px] text-indigo-700/80">
                                                    Otomatis tercatat sebagai Base Utama di modul Armada (Fleet) dengan Admin Anda sebagai pengelola.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Navigation Buttons */}
                                        <div className="flex gap-2.5 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="w-1/3 rounded-2xl border border-slate-300 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                ← {t('central.onboarding.btn_back')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition"
                                            >
                                                <span>Lanjut: Skala & Modul Bisnis</span>
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: SKALA OPERASIONAL & MODUL BISNIS */}
                                {currentStep === 3 && (
                                    <div className="space-y-5">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-extrabold text-slate-900">
                                                {t('central.onboarding.step2_title')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Sesuaikan konfigurasi modul dan perkiraan jumlah unit kendaraan Anda.
                                            </p>
                                        </div>

                                        {/* Verticals / Modul */}
                                        <div>
                                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
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
                                                            className={`flex gap-3 rounded-2xl border p-3.5 transition-all ${
                                                                disabled
                                                                    ? 'cursor-not-allowed border-slate-200/50 bg-slate-100/50 opacity-50'
                                                                    : checked
                                                                      ? 'cursor-pointer border-indigo-500 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-500/30'
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
                                                            <span className="flex min-w-0 items-start gap-3">
                                                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                                                                    checked ? 'border-indigo-200 bg-indigo-100 text-indigo-600' : 'border-slate-200 bg-slate-50 text-slate-500'
                                                                }`}>
                                                                    <span className="material-symbols-outlined text-lg">
                                                                        {verticalIcon(option.key)}
                                                                    </span>
                                                                </span>
                                                                <span>
                                                                    <span className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-900">
                                                                        {option.label}
                                                                        {disabled && (
                                                                            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
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
                                            <InputError message={errors.verticals || clientErrors.verticals} className="mt-1.5" />
                                        </div>

                                        {/* Fleet Size Chips */}
                                        <div>
                                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.fleet_size_title')}
                                            </p>
                                            <p className="mb-2.5 text-[11px] text-slate-400">{t('central.onboarding.fleet_size_hint')}</p>
                                            <div className="grid grid-cols-3 gap-2.5">
                                                {[
                                                    { key: '1-5', title: t('central.onboarding.fleet_size_1_5'), desc: t('central.onboarding.fleet_size_1_5_desc') },
                                                    { key: '6-20', title: t('central.onboarding.fleet_size_6_20'), desc: t('central.onboarding.fleet_size_6_20_desc') },
                                                    { key: '21-50+', title: t('central.onboarding.fleet_size_21_plus'), desc: t('central.onboarding.fleet_size_21_plus_desc') },
                                                ].map((opt) => (
                                                    <div
                                                        key={opt.key}
                                                        onClick={() => setData('fleet_size', opt.key)}
                                                        className={`rounded-2xl border p-3 text-center cursor-pointer transition ${
                                                            data.fleet_size === opt.key
                                                                ? 'border-indigo-600 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-500/30'
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <span className="block text-xs font-black text-slate-900">{opt.title}</span>
                                                        <span className="block text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rental Model Chips */}
                                        <div>
                                            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                                                {t('central.onboarding.rental_model_title')}
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { key: 'self', label: t('central.onboarding.rental_model_self') },
                                                    { key: 'driver', label: t('central.onboarding.rental_model_driver') },
                                                    { key: 'both', label: t('central.onboarding.rental_model_both') },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        onClick={() => setData('rental_model', opt.key)}
                                                        className={`rounded-xl py-2 px-2 text-[11px] font-bold border transition ${
                                                            data.rental_model === opt.key
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Included Core Modules Preview */}
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                            <p className="font-bold text-slate-800">{t('central.onboarding.preview_title')}</p>
                                            <p className="mt-0.5 text-[11px] text-slate-500">{previewHint}</p>
                                        </div>

                                        {/* Navigation Buttons */}
                                        <div className="flex gap-2.5 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                className="w-1/3 rounded-2xl border border-slate-300 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                ← {t('central.onboarding.btn_back')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNext}
                                                className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 active:from-indigo-700 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition"
                                            >
                                                <span>Lanjut: Konfirmasi Paket</span>
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: PILIHAN PAKET & LAUNCHING WORKSPACE */}
                                {currentStep === 4 && (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-extrabold text-slate-900">
                                                {t('central.onboarding.step4_title')}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Pilih paket langganan dan luncurkan workspace database terisolasi Anda.
                                            </p>
                                        </div>

                                        {/* Live Summary Box */}
                                        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-sky-50/60 p-4 shadow-sm">
                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-900 mb-2.5 pb-2 border-b border-indigo-100">
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
                                                    <span className="font-bold text-slate-800">{data.base_name || 'Kantor Operasional'} ({data.base_code || 'HQ'})</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 block">{t('central.onboarding.summary_location')}:</span>
                                                    <span className="font-bold text-slate-800">{data.base_city || data.city || '-'} {data.phone || data.base_phone ? `(${data.phone || data.base_phone})` : ''}</span>
                                                </div>
                                                <div className="col-span-2 pt-1 border-t border-indigo-100/60">
                                                    <span className="text-slate-400 block">{t('central.onboarding.summary_services')}:</span>
                                                    <span className="font-bold text-slate-800">{data.verticals.join(' + ')} ({data.fleet_size} unit)</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Available Plans */}
                                        {availablePlans.length > 0 && (
                                            <div>
                                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('central.onboarding.plans_title')}
                                                </p>
                                                <div className="space-y-2">
                                                    {availablePlans.map((p) => {
                                                        const selected = data.plan_key === p.key;
                                                        const hasMonthly = p.price && Number(p.price) > 0;
                                                        const isRecommended = (data.fleet_size === '21-50+' && p.key === 'pro') ||
                                                                              (data.fleet_size === '6-20' && p.key === 'starter') ||
                                                                              (data.fleet_size === '1-5' && p.key === 'free');

                                                        return (
                                                            <div
                                                                key={p.key}
                                                                onClick={() => setData('plan_key', p.key)}
                                                                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border p-3 cursor-pointer transition-all ${
                                                                    selected
                                                                        ? 'border-indigo-600 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80 shadow-md ring-2 ring-indigo-500/20'
                                                                        : isRecommended
                                                                          ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
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
                                                                            <span className="text-xs font-black text-slate-900">{p.name}</span>
                                                                            {p.badge && (
                                                                                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-700">
                                                                                    {p.badge}
                                                                                </span>
                                                                            )}
                                                                            {isRecommended && (
                                                                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                                                                                    ★ Rekomendasi
                                                                                </span>
                                                                            )}
                                                                            {p.trial_days !== undefined && p.trial_days !== null && Number(p.trial_days) > 0 ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-800">
                                                                                    Trial {p.trial_days} Hari
                                                                                </span>
                                                                            ) : hasMonthly && (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                                                                                    ⚡ Bayar Langsung
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {p.limits && (
                                                                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                                                                <span>🚗 {p.limits.max_vehicles ? `Maks. ${p.limits.max_vehicles} Armada` : 'Unlimited Armada'}</span>
                                                                                <span>•</span>
                                                                                <span>👥 {p.limits.max_users ? `Maks. ${p.limits.max_users} User` : 'Unlimited User'}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="sm:text-right shrink-0 pl-6 sm:pl-0">
                                                                    <div className="text-xs font-black text-slate-900">
                                                                        {!hasMonthly ? (
                                                                            <span className="text-emerald-700 font-bold">Gratis</span>
                                                                        ) : (
                                                                            <span>
                                                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: p.currency || 'IDR', maximumFractionDigits: 0 }).format(Number(p.price))}
                                                                                <span className="text-[10px] font-normal text-slate-400">/bln</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={errors.plan_key} className="mt-1.5" />
                                            </div>
                                        )}

                                        {/* Navigation & Submit */}
                                        <div className="flex gap-2.5 pt-2">
                                            <button
                                                type="button"
                                                onClick={handleBack}
                                                disabled={processing}
                                                className="w-1/3 rounded-2xl border border-slate-300 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                                            >
                                                ← {t('central.onboarding.btn_back')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-2/3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:from-emerald-700 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
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
                                                    <span>Lanjut ke Pembayaran & Aktivasi →</span>
                                                ) : (
                                                    <span>{t('central.onboarding.submit_launch')}</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </form>

                            {/* Logout */}
                            <div className="mt-5 text-center">
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    type="button"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 transition hover:text-rose-600"
                                >
                                    <span className="material-symbols-outlined text-sm">logout</span>
                                    {t('shell.log_out')}
                                </Link>
                            </div>
                        </div>

                        {/* Footer Branding */}
                        <div className="mt-4 text-center">
                            <p className="text-[11px] font-medium text-slate-400">{t('auth_ui.tagline', { name: siteName })}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
