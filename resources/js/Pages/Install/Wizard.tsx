import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface RequirementCheck {
    name: string;
    passed: boolean;
    hint: string;
}

interface Props {
    requirements: RequirementCheck[];
    requirementsPass: boolean;
    defaults: { app_name: string; app_url: string; tenant_base_domain: string };
    drivers: string[];
    profiles: string[];
    tokenRequired: boolean;
    unlocked: boolean;
}

const STEPS = ['welcome', 'requirements', 'database', 'migrate', 'platform', 'admin', 'complete'] as const;
type StepKey = (typeof STEPS)[number];

interface LocaleOption {
    code: string;
    label: string;
}

export default function Wizard(props: Props) {
    const { t, locale: currentLocale } = useTrans();
    const page = usePage<{ availableLocales?: LocaleOption[]; appName?: string; flash?: { status?: string }; errors?: Record<string, string> }>();
    const availableLocales = page.props.availableLocales ?? [];

    const locked = props.tokenRequired && !props.unlocked;
    const [step, setStep] = useState(0);
    const currentKey: StepKey = STEPS[step];
    const go = (key: StepKey) => setStep(STEPS.indexOf(key));

    const post = { preserveState: true, preserveScroll: true } as const;

    // Form hooks for each step
    const unlockForm = useForm({ token: '' });
    const dbForm = useForm({
        driver: props.drivers[0] ?? 'pgsql',
        host: '127.0.0.1',
        port: (props.drivers[0] ?? 'pgsql') === 'mysql' ? 3306 : 5432,
        database: 'seruwit_crm',
        username: 'postgres',
        password: '',
    });
    const migrateForm = useForm<{ migrate?: string }>({});
    const platformForm = useForm({
        app_name: props.defaults.app_name || 'Seruwit CRM',
        app_url: props.defaults.app_url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'),
        tenant_base_domain: props.defaults.tenant_base_domain ?? '',
        profile: 'production',
        ai_features_enabled: false as boolean,
    });
    const adminForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const finalizeForm = useForm({});

    // Interactive UI state
    const [dbTestStatus, setDbTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [dbTestMessage, setDbTestMessage] = useState('');
    const [showDbPassword, setShowDbPassword] = useState(false);
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [showAdminPasswordConfirm, setShowAdminPasswordConfirm] = useState(false);
    const [copiedTokenCmd, setCopiedTokenCmd] = useState(false);
    const [isRechecking, setIsRechecking] = useState(false);

    // Copy artisan command for token
    const copyTokenCommand = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText('php artisan app:install-token');
            setCopiedTokenCmd(true);
            setTimeout(() => setCopiedTokenCmd(false), 2500);
        }
    };

    // Driver switch helper
    const handleDriverChange = (driver: string) => {
        let newPort = dbForm.data.port;
        if (driver === 'pgsql') newPort = 5432;
        if (driver === 'mysql') newPort = 3306;

        let newDatabase = dbForm.data.database;
        if (driver === 'sqlite' && (!newDatabase || newDatabase === 'seruwit_crm')) {
            newDatabase = 'database/database.sqlite';
        } else if (driver !== 'sqlite' && newDatabase === 'database/database.sqlite') {
            newDatabase = 'seruwit_crm';
        }

        dbForm.setData({
            ...dbForm.data,
            driver,
            port: newPort,
            database: newDatabase,
        });
        setDbTestStatus('idle');
        setDbTestMessage('');
    };

    // Live Database Connection Tester
    const testDbConnection = async () => {
        setDbTestStatus('testing');
        setDbTestMessage('');
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/install/database/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(dbForm.data),
            });
            const data = await res.json();
            if (data.ok) {
                setDbTestStatus('success');
                setDbTestMessage(data.message || t('install.database.test_success', undefined, 'Database connection verified successfully!'));
            } else {
                setDbTestStatus('error');
                setDbTestMessage(data.message || t('install.database.test_failed', undefined, 'Database connection failed'));
            }
        } catch (err: unknown) {
            setDbTestStatus('error');
            const msg = err instanceof Error ? err.message : 'Network error';
            setDbTestMessage(msg);
        }
    };

    // Form submit handlers
    const submitUnlock: FormEventHandler = (e) => {
        e.preventDefault();
        unlockForm.post('/install/unlock', { ...post, onSuccess: () => go('requirements') });
    };

    const submitDatabase: FormEventHandler = (e) => {
        e.preventDefault();
        dbForm.post('/install/database', {
            ...post,
            onSuccess: () => go('migrate'),
            onError: () => {
                setDbTestStatus('error');
                setDbTestMessage(dbForm.errors.database || t('install.database.test_failed', undefined, 'Failed to save database configuration'));
            },
        });
    };

    const runMigrate = () => {
        migrateForm.post('/install/migrate', { ...post, onSuccess: () => go('platform') });
    };

    const submitPlatform: FormEventHandler = (e) => {
        e.preventDefault();
        platformForm.post('/install/platform', { ...post, onSuccess: () => go('admin') });
    };

    const submitAdmin: FormEventHandler = (e) => {
        e.preventDefault();
        adminForm.post('/install/admin', { ...post, onSuccess: () => go('complete') });
    };

    const finish = () => {
        finalizeForm.post('/install/finalize');
    };

    const handleRecheck = () => {
        setIsRechecking(true);
        router.reload({
            onFinish: () => setIsRechecking(false),
        });
    };

    const showSqliteServer = dbForm.data.driver !== 'sqlite';

    // Step icons & metadata
    const stepIcons: Record<StepKey, string> = {
        welcome: 'waving_hand',
        requirements: 'rule',
        database: 'database',
        migrate: 'schema',
        platform: 'tune',
        admin: 'admin_panel_settings',
        complete: 'task_alt',
    };

    const progressPercentage = Math.round((step / (STEPS.length - 1)) * 100);

    return (
        <>
            <Head title={t('install.title', undefined, 'Seruwit CRM Installation')} />

            <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-indigo-50/70 font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
                {/* Background Ambient Soft Pastel Glows */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -left-28 -top-28 h-[500px] w-[500px] rounded-full bg-sky-200/40 blur-[130px]" />
                    <div className="absolute -right-28 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-[130px]" />
                    <div className="absolute -bottom-28 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-200/30 blur-[150px]" />
                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e125_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e125_1px,transparent_1px)] bg-[size:4rem_4rem]" />
                </div>

                <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
                    {/* Top Header Bar */}
                    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 sm:px-6 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
                        <div className="flex items-center gap-3.5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-2 shadow-sm">
                                <ApplicationLogo showText={false} className="h-8 w-8" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black tracking-tight text-slate-900">SERUWIT <span className="text-indigo-600">BIZ</span></span>
                                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                                        Setup Wizard
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500">
                                    {t('install.subtitle', undefined, 'First-time platform setup')}
                                </p>
                            </div>
                        </div>

                        {/* Top Right Language Selector & System Status */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1 shadow-inner backdrop-blur-md">
                                {availableLocales.length > 0 ? (
                                    availableLocales.map((locale) => {
                                        const isSelected = currentLocale === locale.code;
                                        return (
                                            <button
                                                key={locale.code}
                                                type="button"
                                                onClick={() => router.get('/install', { lang: locale.code }, { preserveState: false })}
                                                className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                                    isSelected
                                                        ? 'bg-white text-indigo-600 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {locale.code.toUpperCase()}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => router.get('/install', { lang: 'id' }, { preserveState: false })}
                                            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                                currentLocale === 'id'
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            ID
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.get('/install', { lang: 'en' }, { preserveState: false })}
                                            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                                                currentLocale === 'en'
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            EN
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Mobile Stepper Header (< lg) */}
                    <div className="mb-6 lg:hidden">
                        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
                            <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>
                                    {t('install.step_counter', { current: step + 1, total: STEPS.length }, `Step ${step + 1} of ${STEPS.length}`)}
                                </span>
                                <span className="font-mono text-indigo-600 font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-indigo-600">
                                    {stepIcons[currentKey]}
                                </span>
                                <span className="text-sm font-bold text-slate-900">
                                    {t(`install.steps.${currentKey}`, undefined, currentKey)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid flex-1 items-start gap-8 lg:grid-cols-[300px_1fr]">
                        {/* Desktop Stepper Sidebar */}
                        <aside className="sticky top-8 hidden lg:block">
                            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-2xl">
                                <div className="mb-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            {t('install.welcome.roadmap_title', undefined, 'Setup Progress')}
                                        </h3>
                                        <span className="font-mono text-xs font-bold text-indigo-600">{progressPercentage}%</span>
                                    </div>
                                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-500 ease-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>

                                <nav aria-label="steps" className="relative">
                                    <ol className="space-y-2.5">
                                        {STEPS.map((key, index) => {
                                            const active = index === step;
                                            const done = index < step;
                                            const isClickable = done && !locked;

                                            return (
                                                <li key={key}>
                                                    <button
                                                        type="button"
                                                        disabled={!isClickable}
                                                        onClick={() => isClickable && go(key)}
                                                        className={`group relative flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition-all ${
                                                            active
                                                                ? 'border border-indigo-200/90 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-500/20'
                                                                : done
                                                                  ? 'cursor-pointer hover:border-slate-200 hover:bg-slate-50/80'
                                                                  : 'cursor-default opacity-50'
                                                        }`}
                                                    >
                                                        {/* Step Icon / Number Indicator */}
                                                        <div
                                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${
                                                                active
                                                                    ? 'bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-300/50'
                                                                    : done
                                                                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 font-bold'
                                                                      : 'border border-slate-200 bg-slate-100 text-slate-400'
                                                            }`}
                                                        >
                                                            {done ? (
                                                                <span className="material-symbols-outlined text-base">check</span>
                                                            ) : (
                                                                <span>{index + 1}</span>
                                                            )}
                                                        </div>

                                                        {/* Step Title & Subtitle */}
                                                        <div className="min-w-0 flex-1">
                                                            <p
                                                                className={`truncate text-xs font-bold ${
                                                                    active
                                                                        ? 'text-indigo-950'
                                                                        : done
                                                                          ? 'text-slate-700 group-hover:text-slate-900'
                                                                          : 'text-slate-400'
                                                                }`}
                                                            >
                                                                {t(`install.steps.${key}`, undefined, key)}
                                                            </p>
                                                            <p className={`truncate text-[10px] ${active ? 'text-indigo-600/80 font-medium' : 'text-slate-400'}`}>
                                                                {t(`install.step_desc.${key}`, undefined, '')}
                                                            </p>
                                                        </div>

                                                        {active && (
                                                            <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-[0_0_8px_#6366f1] animate-pulse" />
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </nav>
                            </div>
                        </aside>

                        {/* Main Step Content Container */}
                        <main className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 sm:p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-2xl">
                            {locked ? (
                                /* STEP 0: Token Unlock Gate */
                                <div className="mx-auto max-w-lg space-y-6">
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-md shadow-amber-500/10">
                                            <span className="material-symbols-outlined text-2xl">shield_lock</span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-slate-900">{t('install.token.heading', undefined, 'Token Protected Access')}</h2>
                                            <p className="text-xs text-slate-500">{t('install.token.hint', undefined, 'This deployment requires a secret token to proceed.')}</p>
                                        </div>
                                    </div>

                                    {/* Terminal Command Snippet Box */}
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-inner">
                                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                                Terminal Command
                                            </span>
                                            <button
                                                type="button"
                                                onClick={copyTokenCommand}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {copiedTokenCmd ? 'check' : 'content_copy'}
                                                </span>
                                                {copiedTokenCmd
                                                    ? t('install.token.command_copied', undefined, 'Copied!')
                                                    : t('install.token.copy_command', undefined, 'Copy')}
                                            </button>
                                        </div>
                                        <code className="block overflow-x-auto font-mono text-xs text-emerald-400">
                                            php artisan app:install-token
                                        </code>
                                    </div>

                                    <form onSubmit={submitUnlock} className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="token" value={t('install.token.label', undefined, 'Installer Token')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                            <div className="relative mt-1">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">key</span>
                                                </div>
                                                <TextInput
                                                    id="token"
                                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-3 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                    value={unlockForm.data.token}
                                                    onChange={(e) => unlockForm.setData('token', e.target.value)}
                                                    placeholder={t('install.token.placeholder', undefined, 'Paste installer token here...')}
                                                    isFocused
                                                />
                                            </div>
                                            <InputError message={unlockForm.errors.token} className="mt-1.5" />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={unlockForm.processing || !unlockForm.data.token}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {unlockForm.processing ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    <span>Unlocking...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>{t('install.token.unlock', undefined, 'Unlock Installer')}</span>
                                                    <span className="material-symbols-outlined text-base">lock_open</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    {/* STEP 1: WELCOME */}
                                    {currentKey === 'welcome' && (
                                        <section className="space-y-8">
                                            <div>
                                                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/90 px-3.5 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                                    {t('install.welcome.estimated_time', undefined, 'Estimated time: ~2 mins')}
                                                </div>
                                                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl leading-tight">
                                                    {t('install.welcome.heading', undefined, 'Welcome to Seruwit CRM')}
                                                </h2>
                                                <p className="mt-2 text-sm font-medium text-slate-600 leading-relaxed">
                                                    {t('install.welcome.intro', undefined, 'This wizard will guide you through setting up the platform control plane, database, and primary administrator.')}
                                                </p>
                                            </div>

                                            {/* Roadmap Feature Grid */}
                                            <div className="grid gap-3.5 sm:grid-cols-2">
                                                <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-white hover:border-indigo-200 hover:shadow-sm">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                                        <span className="material-symbols-outlined text-xl">verified</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">1. {t('install.steps.requirements', undefined, 'Requirements')}</h4>
                                                        <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{t('install.welcome.item_req', undefined, 'Server compatibility & PHP 8.4+ validation')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-white hover:border-sky-200 hover:shadow-sm">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                                        <span className="material-symbols-outlined text-xl">database</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">2. {t('install.steps.database', undefined, 'Database')}</h4>
                                                        <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{t('install.welcome.item_db', undefined, 'Central database connection setup & live test')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-white hover:border-violet-200 hover:shadow-sm">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-600">
                                                        <span className="material-symbols-outlined text-xl">schema</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">3. {t('install.steps.migrate', undefined, 'Migrate')}</h4>
                                                        <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{t('install.welcome.item_mig', undefined, 'Database schema migration, roles & permissions')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-white hover:border-emerald-200 hover:shadow-sm">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                                                        <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-800">4. {t('install.steps.admin', undefined, 'Admin')}</h4>
                                                        <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">{t('install.welcome.item_admin', undefined, 'Initial Super Administrator account creation')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => go('requirements')}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all"
                                                >
                                                    <span>{t('install.welcome.start', undefined, 'Start Installation')}</span>
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </button>
                                            </div>
                                        </section>
                                    )}

                                    {/* STEP 2: REQUIREMENTS */}
                                    {currentKey === 'requirements' && (
                                        <section className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                                    {t('install.requirements.heading', undefined, 'Server Requirements')}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('install.requirements.intro', undefined, 'Please ensure all server environment requirements below are satisfied before proceeding.')}
                                                </p>
                                            </div>

                                            {/* Overall Status Banner */}
                                            <div
                                                className={`flex items-center gap-3.5 rounded-2xl border p-4 shadow-sm backdrop-blur-md ${
                                                    props.requirementsPass
                                                        ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
                                                        : 'border-rose-200 bg-rose-50/90 text-rose-800'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-2xl shrink-0">
                                                    {props.requirementsPass ? 'task_alt' : 'error'}
                                                </span>
                                                <div className="flex-1 text-xs font-bold">
                                                    {props.requirementsPass
                                                        ? t('install.requirements.all_passed', undefined, 'All server requirements are satisfied! You are ready to proceed.')
                                                        : t('install.requirements.some_failed', undefined, 'Some requirements are not met. Please adjust your server environment, then click re-check.')}
                                                </div>
                                            </div>

                                            {/* Requirements List */}
                                            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                                {props.requirements.map((check) => (
                                                    <div
                                                        key={check.name}
                                                        className="flex items-center justify-between p-3.5 text-xs transition hover:bg-slate-50/70"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                                                                    check.passed
                                                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                                                                        : 'border border-rose-200 bg-rose-50 text-rose-600'
                                                                }`}
                                                            >
                                                                <span className="material-symbols-outlined text-sm font-bold">
                                                                    {check.passed ? 'check' : 'close'}
                                                                </span>
                                                            </span>
                                                            <div>
                                                                <span className="font-bold text-slate-800">{check.name}</span>
                                                                {check.hint && (
                                                                    <span className="ml-2 font-mono text-[11px] text-slate-400">
                                                                        ({check.hint})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                check.passed
                                                                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : 'border border-rose-200 bg-rose-50 text-rose-700'
                                                            }`}
                                                        >
                                                            {check.passed
                                                                ? t('install.requirements.status_pass', undefined, 'Passed')
                                                                : t('install.requirements.status_fail', undefined, 'Missing')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={handleRecheck}
                                                    disabled={isRechecking}
                                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <span className={`material-symbols-outlined text-base ${isRechecking ? 'animate-spin' : ''}`}>
                                                        refresh
                                                    </span>
                                                    <span>{t('install.requirements.recheck', undefined, 'Re-check')}</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => go('database')}
                                                    disabled={!props.requirementsPass}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <span>{t('install.actions.next', undefined, 'Next')}</span>
                                                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                </button>
                                            </div>
                                        </section>
                                    )}

                                    {/* STEP 3: DATABASE */}
                                    {currentKey === 'database' && (
                                        <form onSubmit={submitDatabase} className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                                    {t('install.database.heading', undefined, 'Database Configuration')}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('install.database.intro', undefined, 'Choose your database engine and enter central connection credentials.')}
                                                </p>
                                            </div>

                                            {/* Database Driver Selector Cards */}
                                            <div>
                                                <InputLabel value={t('install.database.driver', undefined, 'Database Engine')} className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    {props.drivers.map((driver) => {
                                                        const isSelected = dbForm.data.driver === driver;
                                                        const driverTitles: Record<string, string> = {
                                                            pgsql: 'PostgreSQL',
                                                            mysql: 'MySQL / MariaDB',
                                                            sqlite: 'SQLite',
                                                        };
                                                        const driverIcons: Record<string, string> = {
                                                            pgsql: 'dns',
                                                            mysql: 'storage',
                                                            sqlite: 'folder_zip',
                                                        };

                                                        return (
                                                            <button
                                                                key={driver}
                                                                type="button"
                                                                onClick={() => handleDriverChange(driver)}
                                                                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                                                                    isSelected
                                                                        ? 'border-indigo-300 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20'
                                                                        : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 shadow-sm'
                                                                }`}
                                                            >
                                                                <div className="flex w-full items-center justify-between">
                                                                    <div
                                                                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                                                            isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                                                                        }`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-lg">
                                                                            {driverIcons[driver] || 'database'}
                                                                        </span>
                                                                    </div>
                                                                    {isSelected && (
                                                                        <span className="material-symbols-outlined text-indigo-600 text-lg">
                                                                            check_circle
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="mt-3 text-xs font-bold text-slate-900">
                                                                    {driverTitles[driver] || driver}
                                                                </span>
                                                                <span className="mt-1 text-[10px] text-slate-500 leading-snug">
                                                                    {t(`install.database.driver_${driver}_desc`, undefined, '')}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <InputError message={dbForm.errors.driver} className="mt-1.5" />
                                            </div>

                                            {/* Connection Fields */}
                                            {showSqliteServer ? (
                                                <div className="space-y-4">
                                                    <div className="grid gap-4 sm:grid-cols-3">
                                                        <div className="sm:col-span-2">
                                                            <InputLabel htmlFor="host" value={t('install.database.host', undefined, 'Host')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                            <div className="relative mt-1">
                                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                    <span className="material-symbols-outlined text-base">router</span>
                                                                </div>
                                                                <TextInput
                                                                    id="host"
                                                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                    value={dbForm.data.host}
                                                                    onChange={(e) => dbForm.setData('host', e.target.value)}
                                                                />
                                                            </div>
                                                            <InputError message={dbForm.errors.host} className="mt-1" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="port" value={t('install.database.port', undefined, 'Port')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                            <div className="relative mt-1">
                                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                    <span className="material-symbols-outlined text-base">tag</span>
                                                                </div>
                                                                <TextInput
                                                                    id="port"
                                                                    type="number"
                                                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                    value={dbForm.data.port}
                                                                    onChange={(e) => dbForm.setData('port', Number(e.target.value))}
                                                                />
                                                            </div>
                                                            <InputError message={dbForm.errors.port} className="mt-1" />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="database" value={t('install.database.database', undefined, 'Database Name')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                        <div className="relative mt-1">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                <span className="material-symbols-outlined text-base">folder_open</span>
                                                            </div>
                                                            <TextInput
                                                                id="database"
                                                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                value={dbForm.data.database}
                                                                onChange={(e) => dbForm.setData('database', e.target.value)}
                                                            />
                                                        </div>
                                                        <InputError message={dbForm.errors.database} className="mt-1" />
                                                    </div>

                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <InputLabel htmlFor="username" value={t('install.database.username', undefined, 'Username')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                            <div className="relative mt-1">
                                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                    <span className="material-symbols-outlined text-base">person</span>
                                                                </div>
                                                                <TextInput
                                                                    id="username"
                                                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                    value={dbForm.data.username}
                                                                    onChange={(e) => dbForm.setData('username', e.target.value)}
                                                                />
                                                            </div>
                                                            <InputError message={dbForm.errors.username} className="mt-1" />
                                                        </div>

                                                        <div>
                                                            <InputLabel htmlFor="password" value={t('install.database.password', undefined, 'Password')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                            <div className="relative mt-1">
                                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                    <span className="material-symbols-outlined text-base">lock</span>
                                                                </div>
                                                                <TextInput
                                                                    id="password"
                                                                    type={showDbPassword ? 'text' : 'password'}
                                                                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                    value={dbForm.data.password}
                                                                    onChange={(e) => dbForm.setData('password', e.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowDbPassword(!showDbPassword)}
                                                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                                                                >
                                                                    <span className="material-symbols-outlined text-base">
                                                                        {showDbPassword ? 'visibility_off' : 'visibility'}
                                                                    </span>
                                                                </button>
                                                            </div>
                                                            <InputError message={dbForm.errors.password} className="mt-1" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <InputLabel htmlFor="database" value={t('install.database.sqlite_path', undefined, 'SQLite File Path')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">description</span>
                                                        </div>
                                                        <TextInput
                                                            id="database"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={dbForm.data.database}
                                                            onChange={(e) => dbForm.setData('database', e.target.value)}
                                                            placeholder="database/database.sqlite"
                                                        />
                                                    </div>
                                                    <InputError message={dbForm.errors.database} className="mt-1" />
                                                </div>
                                            )}

                                            {/* Live Connection Test Banner */}
                                            {dbTestStatus !== 'idle' && (
                                                <div
                                                    className={`flex items-start gap-3 rounded-2xl border p-4 text-xs font-bold shadow-sm backdrop-blur-md ${
                                                        dbTestStatus === 'testing'
                                                            ? 'border-sky-200 bg-sky-50 text-sky-800'
                                                            : dbTestStatus === 'success'
                                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                              : 'border-rose-200 bg-rose-50 text-rose-800'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-lg shrink-0">
                                                        {dbTestStatus === 'testing'
                                                            ? 'sync'
                                                            : dbTestStatus === 'success'
                                                              ? 'check_circle'
                                                              : 'cancel'}
                                                    </span>
                                                    <div className="flex-1">
                                                        {dbTestStatus === 'testing' && t('install.database.testing', undefined, 'Testing connection...')}
                                                        {dbTestStatus !== 'testing' && dbTestMessage}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => go('requirements')}
                                                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                                                    >
                                                        <span className="material-symbols-outlined text-base">arrow_back</span>
                                                        <span>{t('install.actions.back', undefined, 'Back')}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={testDbConnection}
                                                        disabled={dbTestStatus === 'testing'}
                                                        className="inline-flex items-center gap-1.5 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-xs font-bold text-sky-700 shadow-sm transition hover:bg-sky-100"
                                                    >
                                                        <span className={`material-symbols-outlined text-base ${dbTestStatus === 'testing' ? 'animate-spin' : ''}`}>
                                                            bolt
                                                        </span>
                                                        <span>{t('install.database.test_btn', undefined, 'Test Connection')}</span>
                                                    </button>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={dbForm.processing}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {dbForm.processing ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{t('install.database.submit', undefined, 'Save & Continue')}</span>
                                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* STEP 4: MIGRATE */}
                                    {currentKey === 'migrate' && (
                                        <section className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                                    {t('install.migrate.heading', undefined, 'Schema Migrations & Seeders')}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('install.migrate.intro', undefined, 'The system will build all central tables and register default roles, permissions, and modules.')}
                                                </p>
                                            </div>

                                            {/* Details Checklist Card */}
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 shadow-inner">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('install.migrate.details_title', undefined, 'Actions to be performed:')}
                                                </h4>
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center gap-3 text-xs text-slate-700">
                                                        <span className="material-symbols-outlined text-base text-indigo-600">table_rows</span>
                                                        <span>{t('install.migrate.detail_1', undefined, 'Executing central database schema migrations')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-700">
                                                        <span className="material-symbols-outlined text-base text-sky-600">shield_person</span>
                                                        <span>{t('install.migrate.detail_2', undefined, 'Bootstrapping system roles and permission matrix')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-700">
                                                        <span className="material-symbols-outlined text-base text-emerald-600">extension</span>
                                                        <span>{t('install.migrate.detail_3', undefined, 'Registering platform module catalog and system settings')}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {(migrateForm.errors.migrate || page.props.errors?.migrate) && (
                                                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-sm">
                                                    <span className="material-symbols-outlined text-lg shrink-0">error</span>
                                                    <div>{migrateForm.errors.migrate || page.props.errors?.migrate}</div>
                                                </div>
                                            )}

                                            {/* Migration Action Area */}
                                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-b from-slate-50/60 to-indigo-50/40 p-8 text-center shadow-sm">
                                                {migrateForm.processing ? (
                                                    <div className="space-y-4">
                                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900">{t('install.migrate.running', undefined, 'Running Migrations & Seeders…')}</h4>
                                                            <p className="mt-1 text-xs text-slate-500">{t('install.migrate.note', undefined, 'This process runs automatically and typically takes a few seconds.')}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                                                            <span className="material-symbols-outlined text-3xl">play_circle</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-extrabold text-slate-900">{t('install.migrate.heading', undefined, 'Ready to build database')}</h4>
                                                            <p className="mt-1 text-xs text-slate-500">{t('install.migrate.note', undefined, 'Click the button below to start.')}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={runMigrate}
                                                            disabled={migrateForm.processing}
                                                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-base">bolt</span>
                                                            <span>{t('install.migrate.run', undefined, 'Run Schema Migrations')}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => go('database')}
                                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                                    <span>{t('install.actions.back', undefined, 'Back')}</span>
                                                </button>
                                            </div>
                                        </section>
                                    )}

                                    {/* STEP 5: PLATFORM PROFILE */}
                                    {currentKey === 'platform' && (
                                        <form onSubmit={submitPlatform} className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                                    {t('install.platform.heading', undefined, 'Platform Profile & Settings')}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('install.platform.intro', undefined, 'Define the platform branding identity, access URLs, and deployment profile preferences.')}
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <InputLabel htmlFor="app_name" value={t('install.platform.app_name', undefined, 'Application Name')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">badge</span>
                                                        </div>
                                                        <TextInput
                                                            id="app_name"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={platformForm.data.app_name}
                                                            onChange={(e) => platformForm.setData('app_name', e.target.value)}
                                                        />
                                                    </div>
                                                    <InputError message={platformForm.errors.app_name} className="mt-1" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="app_url" value={t('install.platform.app_url', undefined, 'Primary Application URL')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">link</span>
                                                        </div>
                                                        <TextInput
                                                            id="app_url"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={platformForm.data.app_url}
                                                            onChange={(e) => platformForm.setData('app_url', e.target.value)}
                                                        />
                                                    </div>
                                                    <InputError message={platformForm.errors.app_url} className="mt-1" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="tenant_base_domain" value={t('install.platform.tenant_base_domain', undefined, 'Tenant Base Domain (Optional)')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">domain</span>
                                                        </div>
                                                        <TextInput
                                                            id="tenant_base_domain"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={platformForm.data.tenant_base_domain}
                                                            onChange={(e) => platformForm.setData('tenant_base_domain', e.target.value)}
                                                            placeholder="e.g. yourdomain.com"
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {t('install.platform.tenant_base_domain_hint', undefined, 'Leave blank to use the APP_URL host.')}
                                                    </p>
                                                    <InputError message={platformForm.errors.tenant_base_domain} className="mt-1" />
                                                </div>

                                                {/* Deployment Profile Radio Cards */}
                                                <div>
                                                    <InputLabel value={t('install.platform.profile', undefined, 'Deployment Profile')} className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {props.profiles.map((prof) => {
                                                            const isSelected = platformForm.data.profile === prof;
                                                            return (
                                                                <button
                                                                    key={prof}
                                                                    type="button"
                                                                    onClick={() => platformForm.setData('profile', prof)}
                                                                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                                                                        isSelected
                                                                            ? 'border-indigo-300 bg-indigo-50/80 shadow-sm ring-2 ring-indigo-500/20'
                                                                            : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 shadow-sm'
                                                                    }`}
                                                                >
                                                                    <div
                                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                                                                            isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500'
                                                                        }`}
                                                                    >
                                                                        <span className="material-symbols-outlined text-base">
                                                                            {prof === 'production' ? 'cloud_done' : 'terminal'}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-bold text-slate-900 capitalize">{prof}</span>
                                                                        <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                                                                            {t(`install.platform.profile_${prof}`, undefined, prof)}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <InputError message={platformForm.errors.profile} className="mt-1" />
                                                </div>

                                                {/* AI Features Toggle Switch */}
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
                                                    <label className="flex cursor-pointer items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-200">
                                                                <span className="material-symbols-outlined text-lg">psychology</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-900">{t('install.platform.ai_features', undefined, 'Enable AI Platform Features')}</span>
                                                                <p className="text-[11px] text-slate-500 mt-0.5">{t('install.platform.ai_features_hint', undefined, 'Enable AI capabilities for smart CRM analytics and automated assistance.')}</p>
                                                            </div>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                                                            checked={platformForm.data.ai_features_enabled}
                                                            onChange={(e) => platformForm.setData('ai_features_enabled', e.target.checked)}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => go('migrate')}
                                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                                    <span>{t('install.actions.back', undefined, 'Back')}</span>
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={platformForm.processing}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {platformForm.processing ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Saving...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{t('install.platform.submit', undefined, 'Save Profile & Continue')}</span>
                                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* STEP 6: ADMIN ACCOUNT */}
                                    {currentKey === 'admin' && (
                                        <form onSubmit={submitAdmin} className="space-y-6">
                                            <div>
                                                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                                                    {t('install.admin.heading', undefined, 'Super Administrator Account')}
                                                </h2>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {t('install.admin.intro', undefined, 'Create the initial root administrator account to manage the entire platform.')}
                                                </p>
                                            </div>

                                            {/* Role Privilege Notice */}
                                            <div className="flex items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs text-indigo-800 shadow-sm">
                                                <span className="material-symbols-outlined text-lg shrink-0 text-indigo-600">admin_panel_settings</span>
                                                <div>{t('install.admin.role_notice', undefined, 'This account will have highest administrative privileges (Super Admin) to manage platform settings, users, and workspaces.')}</div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <InputLabel htmlFor="name" value={t('install.admin.name', undefined, 'Full Name')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">person</span>
                                                        </div>
                                                        <TextInput
                                                            id="name"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={adminForm.data.name}
                                                            onChange={(e) => adminForm.setData('name', e.target.value)}
                                                            placeholder="John Doe"
                                                            isFocused
                                                        />
                                                    </div>
                                                    <InputError message={adminForm.errors.name} className="mt-1" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="email" value={t('install.admin.email', undefined, 'Email Address')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                    <div className="relative mt-1">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                            <span className="material-symbols-outlined text-base">mail</span>
                                                        </div>
                                                        <TextInput
                                                            id="email"
                                                            type="email"
                                                            className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                            value={adminForm.data.email}
                                                            onChange={(e) => adminForm.setData('email', e.target.value)}
                                                            placeholder="admin@example.com"
                                                        />
                                                    </div>
                                                    <InputError message={adminForm.errors.email} className="mt-1" />
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div>
                                                        <InputLabel htmlFor="password" value={t('install.admin.password', undefined, 'Password')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                        <div className="relative mt-1">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                <span className="material-symbols-outlined text-base">lock</span>
                                                            </div>
                                                            <TextInput
                                                                id="password"
                                                                type={showAdminPassword ? 'text' : 'password'}
                                                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                value={adminForm.data.password}
                                                                onChange={(e) => adminForm.setData('password', e.target.value)}
                                                                placeholder="••••••••"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowAdminPassword(!showAdminPassword)}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <span className="material-symbols-outlined text-base">
                                                                    {showAdminPassword ? 'visibility_off' : 'visibility'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                        <InputError message={adminForm.errors.password} className="mt-1" />
                                                    </div>

                                                    <div>
                                                        <InputLabel htmlFor="password_confirmation" value={t('install.admin.password_confirmation', undefined, 'Confirm Password')} className="text-xs font-bold uppercase tracking-wider text-slate-700" />
                                                        <div className="relative mt-1">
                                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                                <span className="material-symbols-outlined text-base">lock_reset</span>
                                                            </div>
                                                            <TextInput
                                                                id="password_confirmation"
                                                                type={showAdminPasswordConfirm ? 'text' : 'password'}
                                                                className="block w-full rounded-2xl border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 font-mono text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                                value={adminForm.data.password_confirmation}
                                                                onChange={(e) => adminForm.setData('password_confirmation', e.target.value)}
                                                                placeholder="••••••••"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowAdminPasswordConfirm(!showAdminPasswordConfirm)}
                                                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                                                            >
                                                                <span className="material-symbols-outlined text-base">
                                                                    {showAdminPasswordConfirm ? 'visibility_off' : 'visibility'}
                                                                </span>
                                                            </button>
                                                        </div>
                                                        <InputError message={adminForm.errors.password_confirmation} className="mt-1" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => go('platform')}
                                                    className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                                                >
                                                    <span className="material-symbols-outlined text-base">arrow_back</span>
                                                    <span>{t('install.actions.back', undefined, 'Back')}</span>
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={adminForm.processing}
                                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 px-8 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {adminForm.processing ? (
                                                        <>
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Creating Admin...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{t('install.admin.submit', undefined, 'Create Administrator Account')}</span>
                                                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {/* STEP 7: COMPLETE */}
                                    {currentKey === 'complete' && (
                                        <section className="space-y-6">
                                            <div className="text-center">
                                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-xl shadow-emerald-200/50">
                                                    <span className="material-symbols-outlined text-5xl">celebration</span>
                                                </div>
                                                <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                                                    {t('install.complete.heading', undefined, 'Installation Complete & Ready!')}
                                                </h2>
                                                <p className="mx-auto mt-2 max-w-md text-xs font-medium text-slate-500">
                                                    {t('install.complete.intro', undefined, 'All fundamental configurations for Seruwit CRM have been successfully initialized.')}
                                                </p>
                                            </div>

                                            {/* Configuration Summary Card */}
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 space-y-3 shadow-inner">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                                    {t('install.complete.summary_title', undefined, 'Configuration Summary')}
                                                </h4>
                                                <div className="grid gap-2 text-xs sm:grid-cols-2">
                                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <span className="text-slate-500">{t('install.complete.summary_app', undefined, 'Platform Name')}</span>
                                                        <span className="font-bold text-slate-900">{platformForm.data.app_name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <span className="text-slate-500">{t('install.complete.summary_url', undefined, 'System URL')}</span>
                                                        <span className="font-mono font-bold text-indigo-600">{platformForm.data.app_url}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <span className="text-slate-500">{t('install.complete.summary_driver', undefined, 'Database')}</span>
                                                        <span className="font-mono font-bold text-emerald-600 uppercase">{dbForm.data.driver}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                                        <span className="text-slate-500">{t('install.complete.summary_admin', undefined, 'Super Admin')}</span>
                                                        <span className="font-mono font-bold text-slate-800">{adminForm.data.email || 'admin'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Notice */}
                                            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-800 shadow-sm">
                                                <span className="material-symbols-outlined text-lg shrink-0 text-amber-600">lock</span>
                                                <div>{t('install.complete.security_notice', undefined, 'For security reasons, the installer will be permanently sealed once you click launch.')}</div>
                                            </div>

                                            <div className="pt-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={finish}
                                                    disabled={finalizeForm.processing}
                                                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 px-10 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {finalizeForm.processing ? (
                                                        <>
                                                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            <span>Launching...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{t('install.complete.launch', undefined, 'Finish & Launch Application')}</span>
                                                            <span className="material-symbols-outlined text-xl">rocket_launch</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}
                        </main>
                    </div>

                    {/* Footer Branding */}
                    <footer className="mt-8 text-center text-xs font-medium text-slate-400">
                        &copy; {new Date().getFullYear()} Seruwit BIZ. Integrated Business Systems.
                    </footer>
                </div>
            </div>
        </>
    );
}


