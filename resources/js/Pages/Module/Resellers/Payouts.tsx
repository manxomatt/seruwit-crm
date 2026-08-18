import Pagination from '@/Components/Reseller/Pagination';
import PayoutStatusBadge from '@/Components/Reseller/PayoutStatusBadge';
import { Paginated, PayoutCandidate, PayoutRow } from '@/Components/Reseller/types';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    payouts: Paginated<PayoutRow>;
    candidates: PayoutCandidate[];
    filters: { status: string | null };
}

const STATUSES = ['draft', 'approved', 'paid', 'cancelled'] as const;

const today = (): string => new Date().toISOString().slice(0, 10);

const firstOfMonth = (): string => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

export default function Payouts({ payouts, candidates, filters }: Props): JSX.Element {
    const { t } = useTrans();
    const [building, setBuilding] = useState<PayoutCandidate | null>(null);

    const form = useForm({
        reseller_global_id: '',
        period_start: firstOfMonth(),
        period_end: today(),
    });

    const openBuilder = (candidate: PayoutCandidate) => {
        form.setData('reseller_global_id', candidate.reseller_global_id);
        form.clearErrors();
        setBuilding(candidate);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        form.post(route('module.reseller-payouts.store'), {
            preserveScroll: true,
            onSuccess: () => setBuilding(null),
        });
    };

    const filterBy = (status: string | null) => {
        router.get(
            route('module.reseller-payouts.index'),
            { status: status || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <DynamicLayout header={<PageHeader title={t('reseller.payout.title')} />}>
            <Head title={t('reseller.payout.title')} />

            <div className="space-y-6">
                {/* Who is owed money right now */}
                <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/10 to-transparent p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('reseller.payout.candidates')}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('reseller.payout.candidates_hint')}</p>

                    {candidates.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t('reseller.payout.candidates_empty')}</p>
                    ) : (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {candidates.map((candidate) => (
                                <div
                                    key={candidate.reseller_global_id}
                                    className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60"
                                >
                                    <div className="font-medium text-slate-900 dark:text-white">
                                        {candidate.reseller_name ?? candidate.reseller_global_id}
                                    </div>
                                    <div className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">
                                        {formatMoney(candidate.total)}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {candidate.entries} {t('reseller.payout.entries')}
                                        {candidate.earliest && ` · ${t('reseller.payout.since')} ${candidate.earliest}`}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openBuilder(candidate)}
                                        className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        {t('reseller.payout.build')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => filterBy(null)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                            !filters.status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                    >
                        {t('reseller.payout_status.all')}
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
                            {t(`reseller.payout_status.${status}`)}
                        </button>
                    ))}
                </div>

                {payouts.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {t('reseller.payout.empty')}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.reference')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.table.reseller')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.period')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.payout.net')}</th>
                                    <th className="px-4 py-3 text-left font-semibold">{t('reseller.payout.status')}</th>
                                    <th className="px-4 py-3 text-right font-semibold">{t('reseller.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payouts.data.map((payout) => (
                                    <tr key={payout.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-white">{payout.reference}</td>
                                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">
                                            {payout.reseller_name ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                                            {payout.period_start} → {payout.period_end}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900 dark:text-white">
                                            {formatMoney(payout.net_amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <PayoutStatusBadge status={payout.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={route('module.reseller-payouts.show', payout.id)}
                                                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                {t('reseller.payout.detail')} →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination links={payouts.links} />
            </div>

            <Modal show={building !== null} maxWidth="md" onClose={() => setBuilding(null)}>
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('reseller.payout.build_title')}</h2>

                    {building && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {building.reseller_name} — {formatMoney(building.total)}
                        </p>
                    )}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="period_start" value={t('reseller.payout.period_start')} />
                            <TextInput
                                id="period_start"
                                type="date"
                                value={form.data.period_start}
                                onChange={(event) => form.setData('period_start', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={form.errors.period_start} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="period_end" value={t('reseller.payout.period_end')} />
                            <TextInput
                                id="period_end"
                                type="date"
                                value={form.data.period_end}
                                onChange={(event) => form.setData('period_end', event.target.value)}
                                className="mt-1 block w-full"
                            />
                            <InputError message={form.errors.period_end} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setBuilding(null)}>
                            {t('reseller.payout.close')}
                        </SecondaryButton>
                        <PrimaryButton disabled={form.processing}>{t('reseller.payout.submit')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
