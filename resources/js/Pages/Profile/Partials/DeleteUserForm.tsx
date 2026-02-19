import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function DeleteUserForm() {
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
                <h2 className="text-lg font-medium text-gray-900">Delete Account</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Permanently delete your account.
                </p>
            </header>

            <div className="mt-6">
                <SecondaryButton onClick={confirmUserDeletion}>Delete Account</SecondaryButton>
            </div>

            {confirming && (
                <form onSubmit={deleteUser} className="mt-6">
                    <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to delete your account? This action
                        cannot be undone.
                    </p>

                    <div className="flex items-center gap-4">
                        <DangerButton disabled={processing}>Delete Account</DangerButton>
                    </div>
                </form>
            )}
        </section>
    );
}
