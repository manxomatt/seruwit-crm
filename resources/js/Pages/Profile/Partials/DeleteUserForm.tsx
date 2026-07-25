import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function DeleteUserForm() {
    const { t } = useTrans();
    const [confirming, setConfirming] = useState(false);

    const { delete: destroy, processing } = useForm();

    const confirmUserDeletion = () => setConfirming(true);

    const deleteUser = (e: React.FormEvent) => {
        e.preventDefault();

        destroy(route('profile.destroy'));
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-medium text-gray-900">{t('profile.delete.title')}</h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t('profile.delete.help')}
                </p>
            </header>

            <div className="mt-6">
                <SecondaryButton onClick={confirmUserDeletion}>{t('profile.delete.action')}</SecondaryButton>
            </div>

            {confirming && (
                <form onSubmit={deleteUser} className="mt-6">
                    <p className="text-sm text-gray-600 mb-4">
                        {t('profile.delete.confirm_message')}
                    </p>

                    <div className="flex items-center gap-4">
                        <DangerButton disabled={processing}>{t('profile.delete.action')}</DangerButton>
                    </div>
                </form>
            )}
        </section>
    );
}
