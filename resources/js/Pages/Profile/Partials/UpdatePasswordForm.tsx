import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { useForm } from '@inertiajs/react';

export default function UpdatePasswordForm() {
    const { t } = useTrans();

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
                <h2 className="text-lg font-medium text-gray-900">{t('profile.password.title')}</h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t('profile.password.help')}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="current_password" value={t('profile.password.current')} />

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
                    <InputLabel htmlFor="password" value={t('profile.password.new')} />

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
                    <InputLabel htmlFor="password_confirmation" value={t('profile.password.confirm')} />

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
                    <PrimaryButton disabled={processing}>{t('profile.save')}</PrimaryButton>
                </div>
            </form>
        </section>
    );
}
