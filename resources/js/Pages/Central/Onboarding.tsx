import GuestLayout from '@/Layouts/GuestLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link } from '@inertiajs/react';

interface Props {
    user: {
        name: string;
        email: string;
    };
}

export default function Onboarding({ user }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <GuestLayout>
            <Head title={t('central.onboarding.title')} />

            <div className="space-y-4">
                <h1 className="text-lg font-semibold text-gray-900">
                    {t('central.onboarding.title')}
                </h1>
                <p className="text-sm text-gray-600">
                    {t('central.onboarding.verified_as', { email: user.email })}
                </p>
                <p className="text-sm text-gray-600">{t('central.onboarding.pending_message')}</p>
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    {t('shell.log_out')}
                </Link>
            </div>
        </GuestLayout>
    );
}
