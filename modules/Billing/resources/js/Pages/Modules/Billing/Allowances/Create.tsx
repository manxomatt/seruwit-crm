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
import BillingNav from '../../../../BillingNav';

interface Trip {
    id: number;
    code: string;
    origin: string;
    destination: string;
    scheduled_at: string;
    driver: { id: number; name: string } | null;
}

interface Props {
    trips: Trip[];
}

export default function Create({ trips }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const { data, setData, post, processing, errors } = useForm({
        trip_id: '',
        advance_amount: '',
        notes: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(prefixedRoute('billing.allowances.store'));
    };

    return (
        <DynamicLayout
            header={
                <PageHeader
                    title={t('billing.allowances.issue_title')}
                    actions={
                        <Link href={prefixedRoute('billing.allowances.index')}>
                            <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.back')}</SecondaryButton>
                        </Link>
                    }
                />
            }
        >
            <Head title={t('billing.allowances.issue_title')} />

            <BillingNav />

            <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="trip_id" value={`${t('billing.allowances.trip')} *`} />
                    <Select
                        id="trip_id"
                        className="mt-1"
                        value={data.trip_id}
                        onChange={(value) => setData('trip_id', value)}
                        placeholder={t('billing.allowances.select_trip')}
                        options={trips.map((trip) => ({
                            value: String(trip.id),
                            label: `${trip.code} — ${trip.driver?.name || '?'} — ${trip.origin} → ${trip.destination}`,
                        }))}
                    />
                    <InputError message={errors.trip_id} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="advance_amount" value={`${t('billing.allowances.advance_label')} *`} />
                    <TextInput id="advance_amount" type="number" min={0} step="0.01" className="mt-1 block w-full !rounded-2xl text-xs font-mono" value={data.advance_amount} onChange={(e) => setData('advance_amount', e.target.value)} required />
                    <InputError message={errors.advance_amount} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="notes" value={t('billing.allowances.notes_optional')} />
                    <textarea id="notes" rows={3} className="mt-1 block w-full rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    <InputError message={errors.notes} className="mt-2" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href={prefixedRoute('billing.allowances.index')}>
                        <SecondaryButton type="button" className="!rounded-xl text-xs">{t('common.cancel')}</SecondaryButton>
                    </Link>
                    <PrimaryButton disabled={processing} className="!rounded-xl text-xs shadow-sm">💾 {t('billing.allowances.issue')}</PrimaryButton>
                </div>
            </form>
        </DynamicLayout>
    );
}
