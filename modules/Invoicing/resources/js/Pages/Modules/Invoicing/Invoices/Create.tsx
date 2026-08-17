import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import InvoicingNav from '../../../../InvoicingNav';

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface Props {
    partners: Partner[];
    selectedPartnerId?: number | string | null;
}

export default function Create({ partners, selectedPartnerId }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm<{
        partner_id: string;
        issue_date: string;
        due_date: string;
        notes: string;
    }>({
        partner_id: selectedPartnerId ? String(selectedPartnerId) : '',
        issue_date: '',
        due_date: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('invoicing.invoices.store'));
    };

    return (
        <DynamicLayout
            header={<PageHeader title={t('invoicing.create.head')} />}
        >
            <Head title={t('invoicing.create.title')} />

            <InvoicingNav />

            <div className="max-w-3xl rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="sm:col-span-3">
                            <InputLabel htmlFor="partner_id" value={t('invoicing.create.partner')} />
                            <Select
                                id="partner_id"
                                className="mt-1 block w-full"
                                value={data.partner_id}
                                onChange={(value) => setData('partner_id', value)}
                                placeholder={t('invoicing.create.select_partner')}
                                options={partners.map((partner) => ({
                                    value: String(partner.id),
                                    label: `${partner.name} (${partner.code})`,
                                }))}
                            />
                            <InputError message={errors.partner_id} className="mt-2" />
                        </div>
                        <div className="sm:col-span-1">
                            <InputLabel htmlFor="issue_date" value={t('invoicing.create.issue_date')} />
                            <TextInput id="issue_date" type="date" className="mt-1 block w-full !rounded-2xl text-xs font-mono" value={data.issue_date} onChange={(e) => setData('issue_date', e.target.value)} />
                            <InputError message={errors.issue_date} className="mt-2" />
                        </div>
                        <div className="sm:col-span-1">
                            <InputLabel htmlFor="due_date" value={t('invoicing.create.due_date')} />
                            <TextInput id="due_date" type="date" className="mt-1 block w-full !rounded-2xl text-xs font-mono" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                            <InputError message={errors.due_date} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <InputLabel htmlFor="notes" value={t('invoicing.create.notes')} />
                        <textarea
                            id="notes"
                            rows={3}
                            className="mt-1 block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                        <InputError message={errors.notes} className="mt-2" />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <PrimaryButton disabled={processing || !data.partner_id} className="!rounded-xl text-xs shadow-sm">
                            💾 {t('invoicing.create.submit')}
                        </PrimaryButton>
                        <Link href={prefixedRoute('invoicing.invoices.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                        </Link>
                    </div>
                </form>
            </div>
        </DynamicLayout>
    );
}
