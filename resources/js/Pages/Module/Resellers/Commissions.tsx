import CommissionTable from '@/Components/Reseller/CommissionTable';
import Pagination from '@/Components/Reseller/Pagination';
import StatCard from '@/Components/Reseller/StatCard';
import { CommissionRow, Paginated } from '@/Components/Reseller/types';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import SecondaryButton from '@/Components/SecondaryButton';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface StatusTotal {
    total: number;
    count: number;
}

interface Props {
    commissions: Paginated<CommissionRow>;
    totals: Record<string, StatusTotal>;
    filters: { status: string | null };
}

const STATUSES = ['pending', 'approved', 'paid', 'void'] as const;

export default function Commissions({ commissions, totals, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const [voiding, setVoiding] = useState<CommissionRow | null>(null);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ reason: '' });

    const filterBy = (status: string | null) => {
        router.get(
            route('module.reseller-commissions.index'),
            { status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    const closeModal = () => {
        setVoiding(null);
        clearErrors();
        reset();
    };

    const submitVoid: FormEventHandler = (event) => {
        event.preventDefault();

        if (!voiding) {
            return;
        }

        post(route('module.reseller-commissions.void', voiding.id), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.queue_title')} />}>
            <Head title={t('reseller.queue_title')} />

            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label={t('reseller.stats.pending')}
                        value={formatMoney(totals.pending?.total ?? 0)}
                        hint={`${totals.pending?.count ?? 0}×`}
                        tone="amber"
                    />
                    <StatCard
                        label={t('reseller.stats.approved')}
                        value={formatMoney(totals.approved?.total ?? 0)}
                        hint={`${totals.approved?.count ?? 0}×`}
                        tone="sky"
                    />
                    <StatCard
                        label={t('reseller.stats.paid')}
                        value={formatMoney(totals.paid?.total ?? 0)}
                        hint={`${totals.paid?.count ?? 0}×`}
                        tone="emerald"
                    />
                    <StatCard
                        label={t('reseller.stats.void')}
                        value={formatMoney(totals.void?.total ?? 0)}
                        hint={`${totals.void?.count ?? 0}×`}
                        tone="rose"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a
                        href={route('module.reseller-commissions.export', { status: filters.status ?? undefined })}
                        className="order-last ml-auto rounded-xl border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                        {t('reseller.table.export')}
                    </a>
                    <button
                        type="button"
                        onClick={() => filterBy(null)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            !filters.status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {t('reseller.status.all')}
                    </button>
                    {STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            onClick={() => filterBy(status)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                filters.status === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                        >
                            {t(`reseller.status.${status}`)}
                        </button>
                    ))}
                </div>

                <CommissionTable
                    rows={commissions.data}
                    showReseller
                    renderActions={(row) =>
                        row.status === 'pending' || row.status === 'approved' ? (
                            <button
                                type="button"
                                onClick={() => setVoiding(row)}
                                className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                            >
                                {t('reseller.void.action')}
                            </button>
                        ) : null
                    }
                />

                <Pagination links={commissions.links} />
            </div>

            <Modal show={voiding !== null} maxWidth="md" onClose={closeModal}>
                <form onSubmit={submitVoid} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('reseller.void.title')}</h2>

                    {voiding && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {voiding.tenant_name ?? voiding.tenant_id} — {formatMoney(voiding.commission_amount)}
                        </p>
                    )}

                    <div className="mt-4">
                        <InputLabel htmlFor="reason" value={t('reseller.void.reason')} />
                        <textarea
                            id="reason"
                            value={data.reason}
                            onChange={(event) => setData('reason', event.target.value)}
                            rows={3}
                            placeholder={t('reseller.void.reason_placeholder')}
                            className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <InputError message={errors.reason} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModal}>
                            {t('reseller.void.cancel')}
                        </SecondaryButton>
                        <DangerButton disabled={processing}>{t('reseller.void.submit')}</DangerButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
