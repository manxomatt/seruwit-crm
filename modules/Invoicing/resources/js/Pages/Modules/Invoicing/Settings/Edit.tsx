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
                <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">⚙️ {t('invoicing.settings.section')}</h2>
                    <p className="mt-0.5 text-xs text-slate-400">{t('invoicing.settings.section_hint')}</p>

                    <div className="mt-5 max-w-xs">
                        <InputLabel
                            htmlFor="default_payment_term_days"
                            value={t('invoicing.settings.default_payment_term_days')}
                        />
                        <TextInput
                            id="default_payment_term_days"
                            type="number"
                            min={0}
                            className="mt-1 block w-full !rounded-2xl text-xs font-mono"
                            value={data.default_payment_term_days}
                            onChange={(e) => setData('default_payment_term_days', e.target.value)}
                        />
                        <p className="mt-1 text-[11px] text-slate-400">{t('invoicing.settings.default_payment_term_days_hint')}</p>
                        <InputError message={errors.default_payment_term_days} className="mt-1" />
                    </div>
                </section>

                <div className="flex items-center gap-3">
                    <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">
                        💾 {t('invoicing.settings.save')}
                    </PrimaryButton>
                    {recentlySuccessful && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ {t('invoicing.messages.settings_updated')}
                        </span>
                    )}
                </div>
            </form>
        </DynamicLayout>
    );
}
