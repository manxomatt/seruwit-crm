import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { t } = useTrans();

    interface ConfirmForm {
        password: string;
    }

    const { data, setData, post, processing, errors, reset } = useForm<ConfirmForm>({
        password: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title={t('auth_ui.confirm_title')} />

            <div className="mb-4 text-sm text-gray-600">
                {t('auth_ui.confirm_message')}
            </div>

            <form onSubmit={submit}>
                <div className="mt-4">
                    <InputLabel htmlFor="password" value={t('auth_ui.password')} />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e: any) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="ms-4" disabled={processing}>
                        {t('auth_ui.confirm_submit')}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
