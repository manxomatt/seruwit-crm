import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

interface AvailableLocale {
    code: string;
    label: string;
}

interface Props {
    mustVerifyEmail?: boolean;
    status?: string;
    className?: string;
}

const LOCALE_FLAGS: Record<string, string> = {
    en: '🇬🇧',
    id: '🇮🇩',
};

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: Props) {
    const page = usePage().props as unknown as {
        auth: { user: { name: string; email: string; locale?: string; email_verified_at?: string | null } };
        availableLocales?: AvailableLocale[];
    };
    const user = page.auth.user;
    const availableLocales = page.availableLocales ?? [];
    const { t } = useTrans();

    interface ProfileForm {
        name: string;
        email: string;
        locale: string;
    }

    const localeOptions = availableLocales.map((item) => ({
        value: item.code,
        label: `${LOCALE_FLAGS[item.code] ?? '🌐'}  ${item.label}`,
    }));

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm<ProfileForm>({
            name: user.name,
            email: user.email,
            locale: user.locale ?? 'id',
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">{t('profile.information')}</h2>
                <p className="mt-1 text-sm text-gray-600">{t('profile.information_help')}</p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value={t('profile.name')} />
                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e: any) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />
                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value={t('profile.email')} />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e: any) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="locale" value={t('profile.language')} />
                    <Select
                        id="locale"
                        className="mt-1 block w-full"
                        value={data.locale}
                        onChange={(value) => setData('locale', value)}
                        placeholder={t('profile.select_language', undefined, 'Pilih bahasa')}
                        options={localeOptions}
                    />
                    <p className="mt-1 text-sm text-gray-500">{t('profile.language_help')}</p>
                    <InputError className="mt-2" message={errors.locale} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>{t('profile.save')}</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">{t('profile.saved')}</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
