import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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
    const { t } = useTrans();
    const page = usePage<{ availableLocales?: LocaleOption[] }>();
    const availableLocales = page.props.availableLocales ?? [];

    const locked = props.tokenRequired && !props.unlocked;
    const [step, setStep] = useState(0);
    const currentKey: StepKey = STEPS[step];
    const go = (key: StepKey) => setStep(STEPS.indexOf(key));

    const post = { preserveState: true, preserveScroll: true } as const;

    const unlockForm = useForm({ token: '' });
    const dbForm = useForm({
        driver: props.drivers[0] ?? 'pgsql',
        host: '127.0.0.1',
        port: 5432,
        database: '',
        username: '',
        password: '',
    });
    const migrateForm = useForm({});
    const platformForm = useForm({
        app_name: props.defaults.app_name ?? '',
        app_url: props.defaults.app_url ?? '',
        tenant_base_domain: props.defaults.tenant_base_domain ?? '',
        profile: 'production',
        ai_features: false as boolean,
    });
    const adminForm = useForm({ name: '', email: '', password: '', password_confirmation: '' });
    const finalizeForm = useForm({});

    const submitUnlock: FormEventHandler = (e) => {
        e.preventDefault();
        unlockForm.post('/install/unlock', { ...post, onSuccess: () => go('requirements') });
    };
    const submitDatabase: FormEventHandler = (e) => {
        e.preventDefault();
        dbForm.post('/install/database', { ...post, onSuccess: () => go('migrate') });
    };
    const runMigrate = () => migrateForm.post('/install/migrate', { ...post, onSuccess: () => go('platform') });
    const submitPlatform: FormEventHandler = (e) => {
        e.preventDefault();
        platformForm.post('/install/platform', { ...post, onSuccess: () => go('admin') });
    };
    const submitAdmin: FormEventHandler = (e) => {
        e.preventDefault();
        adminForm.post('/install/admin', { ...post, onSuccess: () => go('complete') });
    };
    const finish = () => finalizeForm.post('/install/finalize');

    const showSqliteServer = dbForm.data.driver !== 'sqlite';

    return (
        <>
            <Head title={t('install.title', undefined, 'Install')} />

            <div className="min-h-screen bg-gray-100 text-gray-900">
                <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
                    <header className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{page.props.appName as string}</h1>
                            <p className="text-sm text-gray-500">{t('install.subtitle')}</p>
                        </div>
                        <div className="flex gap-2 text-sm">
                            {availableLocales.map((locale) => (
                                <button
                                    key={locale.code}
                                    type="button"
                                    onClick={() => router.get('/install', { lang: locale.code }, { preserveState: false })}
                                    className="rounded px-2 py-1 text-gray-500 hover:bg-white hover:text-gray-900"
                                >
                                    {locale.code.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </header>

                    <div className="grid flex-1 gap-8 md:grid-cols-[220px_1fr]">
                        <nav aria-label="steps">
                            <ol className="space-y-1">
                                {STEPS.map((key, index) => {
                                    const active = index === step;
                                    const done = index < step;
                                    return (
                                        <li
                                            key={key}
                                            className={
                                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm ' +
                                                (active ? 'bg-white font-semibold shadow-sm' : done ? 'text-gray-500' : 'text-gray-400')
                                            }
                                        >
                                            <span
                                                className={
                                                    'flex h-6 w-6 items-center justify-center rounded-full text-xs ' +
                                                    (active
                                                        ? 'bg-primary text-white'
                                                        : done
                                                          ? 'bg-primary/20 text-primary'
                                                          : 'bg-gray-200 text-gray-500')
                                                }
                                            >
                                                {index + 1}
                                            </span>
                                            {t(`install.steps.${key}`)}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>

                        <main className="rounded-xl bg-white p-8 shadow-sm">
                            {locked ? (
                                <form onSubmit={submitUnlock} className="max-w-md space-y-4">
                                    <h2 className="text-xl font-semibold">{t('install.token.heading')}</h2>
                                    <p className="text-sm text-gray-500">{t('install.token.hint')}</p>
                                    <div>
                                        <InputLabel htmlFor="token" value={t('install.token.label')} />
                                        <TextInput
                                            id="token"
                                            className="mt-1 block w-full"
                                            value={unlockForm.data.token}
                                            onChange={(e) => unlockForm.setData('token', e.target.value)}
                                            isFocused
                                        />
                                        <InputError message={unlockForm.errors.token} className="mt-1" />
                                    </div>
                                    <PrimaryButton disabled={unlockForm.processing}>{t('install.token.unlock')}</PrimaryButton>
                                </form>
                            ) : (
                                <>
                                    {currentKey === 'welcome' && (
                                        <section className="space-y-6">
                                            <h2 className="text-xl font-semibold">{t('install.welcome.heading')}</h2>
                                            <p className="text-gray-600">{t('install.welcome.intro')}</p>
                                            <PrimaryButton onClick={() => go('requirements')}>{t('install.welcome.start')}</PrimaryButton>
                                        </section>
                                    )}

                                    {currentKey === 'requirements' && (
                                        <section className="space-y-6">
                                            <h2 className="text-xl font-semibold">{t('install.requirements.heading')}</h2>
                                            <p className="text-gray-600">{t('install.requirements.intro')}</p>
                                            <ul className="divide-y rounded-md border">
                                                {props.requirements.map((check) => (
                                                    <li key={check.name} className="flex items-center justify-between px-4 py-2 text-sm">
                                                        <span>
                                                            {check.name}
                                                            <span className="ml-2 text-xs text-gray-400">{check.hint}</span>
                                                        </span>
                                                        <span className={check.passed ? 'text-green-600' : 'text-red-600'}>
                                                            {check.passed ? '✓' : '✗'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className={props.requirementsPass ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
                                                {props.requirementsPass
                                                    ? t('install.requirements.all_passed')
                                                    : t('install.requirements.some_failed')}
                                            </p>
                                            <div className="flex gap-3">
                                                <SecondaryButton onClick={() => router.reload()}>↻</SecondaryButton>
                                                <PrimaryButton onClick={() => go('database')}>{t('install.actions.next')}</PrimaryButton>
                                            </div>
                                        </section>
                                    )}

                                    {currentKey === 'database' && (
                                        <form onSubmit={submitDatabase} className="max-w-lg space-y-4">
                                            <h2 className="text-xl font-semibold">{t('install.database.heading')}</h2>
                                            <p className="text-gray-600">{t('install.database.intro')}</p>
                                            <div>
                                                <InputLabel htmlFor="driver" value={t('install.database.driver')} />
                                                <select
                                                    id="driver"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={dbForm.data.driver}
                                                    onChange={(e) => dbForm.setData('driver', e.target.value)}
                                                >
                                                    {props.drivers.map((driver) => (
                                                        <option key={driver} value={driver}>
                                                            {driver}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {showSqliteServer && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="host" value={t('install.database.host')} />
                                                        <TextInput
                                                            id="host"
                                                            className="mt-1 block w-full"
                                                            value={dbForm.data.host}
                                                            onChange={(e) => dbForm.setData('host', e.target.value)}
                                                        />
                                                        <InputError message={dbForm.errors.host} className="mt-1" />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="port" value={t('install.database.port')} />
                                                        <TextInput
                                                            id="port"
                                                            type="number"
                                                            className="mt-1 block w-full"
                                                            value={dbForm.data.port}
                                                            onChange={(e) => dbForm.setData('port', Number(e.target.value))}
                                                        />
                                                        <InputError message={dbForm.errors.port} className="mt-1" />
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <InputLabel htmlFor="database" value={t('install.database.database')} />
                                                <TextInput
                                                    id="database"
                                                    className="mt-1 block w-full"
                                                    value={dbForm.data.database}
                                                    onChange={(e) => dbForm.setData('database', e.target.value)}
                                                />
                                                <InputError message={dbForm.errors.database} className="mt-1" />
                                            </div>
                                            {showSqliteServer && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="username" value={t('install.database.username')} />
                                                        <TextInput
                                                            id="username"
                                                            className="mt-1 block w-full"
                                                            value={dbForm.data.username}
                                                            onChange={(e) => dbForm.setData('username', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="password" value={t('install.database.password')} />
                                                        <TextInput
                                                            id="password"
                                                            type="password"
                                                            className="mt-1 block w-full"
                                                            value={dbForm.data.password}
                                                            onChange={(e) => dbForm.setData('password', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <InputError message={dbForm.errors.database} />
                                            <div className="flex gap-3">
                                                <SecondaryButton onClick={() => go('requirements')}>{t('install.actions.back')}</SecondaryButton>
                                                <PrimaryButton disabled={dbForm.processing}>{t('install.database.submit')}</PrimaryButton>
                                            </div>
                                        </form>
                                    )}

                                    {currentKey === 'migrate' && (
                                        <section className="space-y-6">
                                            <h2 className="text-xl font-semibold">{t('install.migrate.heading')}</h2>
                                            <p className="text-gray-600">{t('install.migrate.intro')}</p>
                                            <PrimaryButton onClick={runMigrate} disabled={migrateForm.processing}>
                                                {migrateForm.processing ? t('install.migrate.running') : t('install.migrate.run')}
                                            </PrimaryButton>
                                        </section>
                                    )}

                                    {currentKey === 'platform' && (
                                        <form onSubmit={submitPlatform} className="max-w-lg space-y-4">
                                            <h2 className="text-xl font-semibold">{t('install.platform.heading')}</h2>
                                            <p className="text-gray-600">{t('install.platform.intro')}</p>
                                            <div>
                                                <InputLabel htmlFor="app_name" value={t('install.platform.app_name')} />
                                                <TextInput
                                                    id="app_name"
                                                    className="mt-1 block w-full"
                                                    value={platformForm.data.app_name}
                                                    onChange={(e) => platformForm.setData('app_name', e.target.value)}
                                                />
                                                <InputError message={platformForm.errors.app_name} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="app_url" value={t('install.platform.app_url')} />
                                                <TextInput
                                                    id="app_url"
                                                    className="mt-1 block w-full"
                                                    value={platformForm.data.app_url}
                                                    onChange={(e) => platformForm.setData('app_url', e.target.value)}
                                                />
                                                <InputError message={platformForm.errors.app_url} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="tenant_base_domain" value={t('install.platform.tenant_base_domain')} />
                                                <TextInput
                                                    id="tenant_base_domain"
                                                    className="mt-1 block w-full"
                                                    value={platformForm.data.tenant_base_domain}
                                                    onChange={(e) => platformForm.setData('tenant_base_domain', e.target.value)}
                                                />
                                                <p className="mt-1 text-xs text-gray-400">{t('install.platform.tenant_base_domain_hint')}</p>
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="profile" value={t('install.platform.profile')} />
                                                <select
                                                    id="profile"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={platformForm.data.profile}
                                                    onChange={(e) => platformForm.setData('profile', e.target.value)}
                                                >
                                                    {props.profiles.map((profile) => (
                                                        <option key={profile} value={profile}>
                                                            {t(`install.platform.profile_${profile}`)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={platformForm.data.ai_features}
                                                    onChange={(e) => platformForm.setData('ai_features', e.target.checked)}
                                                />
                                                {t('install.platform.ai_features')}
                                            </label>
                                            <div className="flex gap-3">
                                                <SecondaryButton onClick={() => go('migrate')}>{t('install.actions.back')}</SecondaryButton>
                                                <PrimaryButton disabled={platformForm.processing}>{t('install.platform.submit')}</PrimaryButton>
                                            </div>
                                        </form>
                                    )}

                                    {currentKey === 'admin' && (
                                        <form onSubmit={submitAdmin} className="max-w-lg space-y-4">
                                            <h2 className="text-xl font-semibold">{t('install.admin.heading')}</h2>
                                            <p className="text-gray-600">{t('install.admin.intro')}</p>
                                            <div>
                                                <InputLabel htmlFor="name" value={t('install.admin.name')} />
                                                <TextInput
                                                    id="name"
                                                    className="mt-1 block w-full"
                                                    value={adminForm.data.name}
                                                    onChange={(e) => adminForm.setData('name', e.target.value)}
                                                />
                                                <InputError message={adminForm.errors.name} className="mt-1" />
                                            </div>
                                            <div>
                                                <InputLabel htmlFor="email" value={t('install.admin.email')} />
                                                <TextInput
                                                    id="email"
                                                    type="email"
                                                    className="mt-1 block w-full"
                                                    value={adminForm.data.email}
                                                    onChange={(e) => adminForm.setData('email', e.target.value)}
                                                />
                                                <InputError message={adminForm.errors.email} className="mt-1" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="password" value={t('install.admin.password')} />
                                                    <TextInput
                                                        id="password"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={adminForm.data.password}
                                                        onChange={(e) => adminForm.setData('password', e.target.value)}
                                                    />
                                                    <InputError message={adminForm.errors.password} className="mt-1" />
                                                </div>
                                                <div>
                                                    <InputLabel htmlFor="password_confirmation" value={t('install.admin.password_confirmation')} />
                                                    <TextInput
                                                        id="password_confirmation"
                                                        type="password"
                                                        className="mt-1 block w-full"
                                                        value={adminForm.data.password_confirmation}
                                                        onChange={(e) => adminForm.setData('password_confirmation', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <SecondaryButton onClick={() => go('platform')}>{t('install.actions.back')}</SecondaryButton>
                                                <PrimaryButton disabled={adminForm.processing}>{t('install.admin.submit')}</PrimaryButton>
                                            </div>
                                        </form>
                                    )}

                                    {currentKey === 'complete' && (
                                        <section className="space-y-6">
                                            <h2 className="text-xl font-semibold">{t('install.complete.heading')}</h2>
                                            <p className="text-gray-600">{t('install.complete.intro')}</p>
                                            <PrimaryButton onClick={finish} disabled={finalizeForm.processing}>
                                                {t('install.complete.launch')}
                                            </PrimaryButton>
                                        </section>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
