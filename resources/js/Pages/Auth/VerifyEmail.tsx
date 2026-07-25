import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, useForm } from '@inertiajs/react';

interface Props {
    status?: string;
}

export default function VerifyEmail({ status }: Props) {
    const { t } = useTrans();
    const { post, processing } = useForm<Record<string, never>>({});

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title={t('auth_ui.verify_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth_ui.verify_message')}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {t('auth_ui.verify_sent')}
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        {t('auth_ui.resend_verification')}
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        {t('shell.log_out')}
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
