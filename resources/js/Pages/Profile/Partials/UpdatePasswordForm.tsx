import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';

export default function UpdatePasswordForm() {
    interface PasswordForm {
        current_password: string;
        password: string;
        password_confirmation: string;
    }

    const { data, setData, put, errors, processing, reset } = useForm<PasswordForm>({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(route('password.update'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <section>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Update Password</h2>

                <p className="mt-1 text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay
                    secure.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="current_password" value="Current Password" />

                    <TextInput
                        id="current_password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.current_password}
                        onChange={(e: any) => setData('current_password', e.target.value)}
                        required
                        autoComplete="current-password"
                    />

                    <InputError className="mt-2" message={errors.current_password} />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New Password" />

                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={(e: any) => setData('password', e.target.value)}
                        required
                        autoComplete="new-password"
                    />

                    <InputError className="mt-2" message={errors.password} />
                </div>

                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password_confirmation}
                        onChange={(e: any) => setData('password_confirmation', e.target.value)}
                        required
                        autoComplete="new-password"
                    />

                    <InputError className="mt-2" message={errors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                </div>
            </form>
        </section>
    );
}
