import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { t } = useTrans();

    interface RegisterForm {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        company_name: string;
        subdomain: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        subdomain: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('auth_ui.register_title')} />

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="name" value={t('auth_ui.name')} />

                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="mt-1 block w-full"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e: any) => setData('name', e.target.value)}
                        required
                    />

                    <InputError message={errors.name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="email" value={t('auth_ui.email')} />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e: any) => setData('email', e.target.value)}
                        required
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t('auth_ui.password')} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e: any) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value={t('auth_ui.password_confirmation')}
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e: any) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="company_name" value={t('auth_ui.company_name')} />

                    <TextInput
                        id="company_name"
                        name="company_name"
                        value={data.company_name}
                        className="mt-1 block w-full"
                        autoComplete="organization"
                        onChange={(e: any) => setData('company_name', e.target.value)}
                        required
                    />

                    <InputError message={errors.company_name} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="subdomain" value={t('auth_ui.subdomain')} />

                    <div className="mt-1 flex items-center">
                        <TextInput
                            id="subdomain"
                            name="subdomain"
                            value={data.subdomain}
                            className="block w-full"
                            placeholder={t('auth_ui.subdomain_placeholder')}
                            onChange={(e: any) =>
                                setData('subdomain', e.target.value.toLowerCase())
                            }
                            required
                        />
                        <span className="ms-2 whitespace-nowrap text-sm text-gray-500">
                            .{window.location.hostname}
                        </span>
                    </div>

                    <InputError message={errors.subdomain} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <Link
                        href={route('login')}
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t('auth_ui.already_registered')}
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t('auth_ui.register_submit')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
