import DynamicLayout from '@/Layouts/DynamicLayout';
import PageHeader from '@/Components/PageHeader';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InvoicingNav from '../../../../InvoicingNav';

interface Settings {
    default_payment_term_days: string;
}

interface Props {
    settings: Settings;
}

export default function Edit({ settings }: Props): JSX.Element {
    const { t } = useTrans();
    const { prefixedRoute } = useRoutePrefix();
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        default_payment_term_days: settings.default_payment_term_days,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(prefixedRoute('invoicing.settings.update'), { preserveScroll: true });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('invoicing.settings.head')} />}>
            <Head title={t('invoicing.settings.head')} />
            <InvoicingNav />

            <form onSubmit={submit} className="max-w-2xl space-y-6">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-900">{t('invoicing.settings.section')}</h2>
                    <p className="mt-1 text-sm text-gray-500">{t('invoicing.settings.section_hint')}</p>

                    <div className="mt-4 max-w-xs">
                        <InputLabel
                            htmlFor="default_payment_term_days"
                            value={t('invoicing.settings.default_payment_term_days')}
                        />
                        <TextInput
                            id="default_payment_term_days"
                            type="number"
                            min={0}
                            className="mt-1 block w-full"
                            value={data.default_payment_term_days}
                            onChange={(e) => setData('default_payment_term_days', e.target.value)}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t('invoicing.settings.default_payment_term_days_hint')}</p>
                        <InputError message={errors.default_payment_term_days} className="mt-1" />
                    </div>
                </section>

                <div className="flex items-center gap-3">
                    <PrimaryButton disabled={processing}>{t('invoicing.settings.save')}</PrimaryButton>
                    {recentlySuccessful && (
                        <span className="text-sm text-green-600">{t('invoicing.messages.settings_updated')}</span>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}
