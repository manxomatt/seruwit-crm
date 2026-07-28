import AccountingShell from '../AccountingShell';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import Select from '@/Components/Select';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface AccountOption {
    id: number;
    name: string;
    kind: string;
}

interface MatchedTxn {
    id: number;
    reference: string | null;
    memo: string | null;
    type: string;
}

interface StatementLine {
    id: number;
    row_number: number;
    line_date: string;
    description: string | null;
    reference: string | null;
    direction: string;
    amount: number;
    match_status: string;
    bank_transaction_id: number | null;
    journal_entry_id: number | null;
    matched_transaction: MatchedTxn | null;
}

interface BookTxn {
    id: number;
    transacted_on: string;
    amount: number;
    direction: string;
    reference: string | null;
    memo: string | null;
    type: string;
    is_cleared: boolean;
}

interface Suggestion {
    id: number;
    transacted_on: string;
    amount: number;
    direction: string;
    reference: string | null;
    memo: string | null;
    type: string;
}

interface Props {
    reconciliation: {
        id: number;
        status: string;
        period_start: string;
        period_end: string;
        statement_date: string;
        opening_balance: number;
        closing_balance: number;
        csv_filename: string | null;
        notes: string | null;
        account: AccountOption | null;
    };
    lines: StatementLine[];
    bookTransactions: BookTxn[];
    suggestions: Record<number, Suggestion[]>;
    counts: {
        total: number;
        unmatched: number;
        matched: number;
        ignored: number;
        adjusted: number;
    };
    csvHelp: string;
    can: { bank: boolean };
}

function formatAmount(amount: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(amount);
}

export default function Show({
    reconciliation,
    lines,
    bookTransactions,
    suggestions,
    counts,
    csvHelp,
    can,
}: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const isOpen = reconciliation.status === 'open';
    const [matchPick, setMatchPick] = useState<Record<number, string>>({});

    const importForm = useForm<{ csv: File | null }>({ csv: null });

    const submitImport = (e: FormEvent) => {
        e.preventDefault();
        importForm.post(prefixedRoute('accounting.bank-reconciliations.import', reconciliation.id), {
            forceFormData: true,
        });
    };

    const postAction = (url: string) => {
        router.post(url);
    };

    const matchLine = (lineId: number) => {
        const txnId = matchPick[lineId];
        if (!txnId) {
            return;
        }
        router.post(prefixedRoute('accounting.bank-reconciliations.match', [reconciliation.id, lineId]), {
            bank_transaction_id: Number(txnId),
        });
    };

    const complete = () => {
        router.post(prefixedRoute('accounting.bank-reconciliations.complete', reconciliation.id));
    };

    const destroy = () => {
        if (!confirm(t('accounting.recon.confirm_delete'))) {
            return;
        }
        router.delete(prefixedRoute('accounting.bank-reconciliations.destroy', reconciliation.id));
    };

    return (
        <AccountingShell
            active="bank"
            title={`${t('accounting.recon.title')} #${reconciliation.id}`}
            headerActions={
                can.bank && isOpen ? (
                    <div className="flex flex-wrap gap-2">
                        <PrimaryButton type="button" onClick={complete} disabled={counts.unmatched > 0 || counts.total === 0}>
                            {t('accounting.recon.complete')}
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={destroy}
                            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                ) : undefined
            }
        >
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <Link href={prefixedRoute('accounting.bank-reconciliations.index')} className="text-indigo-600 hover:text-indigo-800">
                    {t('accounting.recon.title')}
                </Link>
                <span className="text-gray-300">|</span>
                <span className="text-gray-700">
                    {reconciliation.account?.name} · {reconciliation.period_start} → {reconciliation.period_end}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {t(`accounting.recon.statuses.${reconciliation.status}`, undefined, reconciliation.status)}
                </span>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-5">
                {[
                    ['total', counts.total],
                    ['unmatched', counts.unmatched],
                    ['matched', counts.matched],
                    ['adjusted', counts.adjusted],
                    ['ignored', counts.ignored],
                ].map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-white px-4 py-3 shadow-sm">
                        <div className="text-xs uppercase text-gray-500">{t(`accounting.recon.counts.${key}`)}</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums text-gray-900">{value}</div>
                    </div>
                ))}
            </div>

            {can.bank && isOpen && (
                <form onSubmit={submitImport} className="mb-6 space-y-2 rounded-lg bg-white p-4 shadow-sm">
                    <div className="text-sm font-medium text-gray-800">{t('accounting.recon.import_csv')}</div>
                    <p className="text-xs text-gray-500">{csvHelp}</p>
                    {reconciliation.csv_filename && (
                        <p className="text-xs text-gray-600">
                            {t('accounting.recon.last_import')}: {reconciliation.csv_filename}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={(e) => importForm.setData('csv', e.target.files?.[0] ?? null)}
                            className="block text-sm text-gray-700"
                        />
                        <PrimaryButton disabled={importForm.processing || !importForm.data.csv}>
                            {t('accounting.recon.upload')}
                        </PrimaryButton>
                    </div>
                    <InputError message={importForm.errors.csv} />
                </form>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="border-b px-4 py-3 text-sm font-semibold text-gray-800">
                        {t('accounting.recon.statement_lines')}
                    </div>
                    <div className="divide-y">
                        {lines.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">{t('accounting.recon.no_lines')}</div>
                        )}
                        {lines.map((line) => {
                            const suggestionOptions = (suggestions[line.id] ?? []).map((s) => ({
                                value: String(s.id),
                                label: `${s.transacted_on} · ${formatAmount(s.amount)} · ${s.reference ?? s.memo ?? `#${s.id}`}`,
                            }));
                            const bookOptions = bookTransactions
                                .filter((txn) => txn.direction === line.direction && Math.abs(txn.amount - line.amount) < 0.005)
                                .map((txn) => ({
                                    value: String(txn.id),
                                    label: `${txn.transacted_on} · ${formatAmount(txn.amount)} · ${txn.reference ?? txn.memo ?? `#${txn.id}`}`,
                                }));
                            const options = suggestionOptions.length > 0 ? suggestionOptions : bookOptions;

                            return (
                                <div key={line.id} className="px-4 py-3 text-sm">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {line.line_date} · {t(`accounting.transactions.${line.direction === 'in' ? 'in' : 'out'}`)}{' '}
                                                {formatAmount(line.amount)}
                                            </div>
                                            <div className="text-gray-600">
                                                {line.reference ? <span className="font-medium">{line.reference}</span> : null}
                                                {line.reference && line.description ? ' · ' : null}
                                                {line.description}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                {t(`accounting.recon.match_statuses.${line.match_status}`, undefined, line.match_status)}
                                                {line.matched_transaction
                                                    ? ` → #${line.matched_transaction.id} ${line.matched_transaction.reference ?? ''}`.trim()
                                                    : null}
                                            </div>
                                        </div>
                                    </div>

                                    {can.bank && isOpen && line.match_status === 'unmatched' && (
                                        <div className="mt-3 space-y-2">
                                            {options.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    <div className="min-w-[200px] flex-1">
                                                        <Select
                                                            options={[
                                                                { value: '', label: t('accounting.recon.pick_transaction') },
                                                                ...options,
                                                            ]}
                                                            value={matchPick[line.id] ?? ''}
                                                            onChange={(value) => setMatchPick((prev) => ({ ...prev, [line.id]: value }))}
                                                            searchable
                                                        />
                                                    </div>
                                                    <PrimaryButton type="button" onClick={() => matchLine(line.id)}>
                                                        {t('accounting.recon.match')}
                                                    </PrimaryButton>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    onClick={() =>
                                                        postAction(
                                                            prefixedRoute('accounting.bank-reconciliations.ignore', [
                                                                reconciliation.id,
                                                                line.id,
                                                            ]),
                                                        )
                                                    }
                                                >
                                                    {t('accounting.recon.ignore')}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                                                    onClick={() =>
                                                        postAction(
                                                            prefixedRoute('accounting.bank-reconciliations.adjust', [
                                                                reconciliation.id,
                                                                line.id,
                                                            ]),
                                                        )
                                                    }
                                                >
                                                    {t('accounting.recon.adjust')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {can.bank && isOpen && line.match_status === 'matched' && (
                                        <button
                                            type="button"
                                            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                            onClick={() =>
                                                postAction(
                                                    prefixedRoute('accounting.bank-reconciliations.unmatch', [
                                                        reconciliation.id,
                                                        line.id,
                                                    ]),
                                                )
                                            }
                                        >
                                            {t('accounting.recon.unmatch')}
                                        </button>
                                    )}

                                    {can.bank && isOpen && line.match_status === 'ignored' && (
                                        <button
                                            type="button"
                                            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                            onClick={() =>
                                                postAction(
                                                    prefixedRoute('accounting.bank-reconciliations.unignore', [
                                                        reconciliation.id,
                                                        line.id,
                                                    ]),
                                                )
                                            }
                                        >
                                            {t('accounting.recon.unignore')}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <div className="border-b px-4 py-3 text-sm font-semibold text-gray-800">
                        {t('accounting.recon.book_transactions')}
                    </div>
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">{t('accounting.transactions.date')}</th>
                                <th className="px-4 py-2">{t('accounting.transactions.type')}</th>
                                <th className="px-4 py-2 text-right">{t('accounting.transactions.amount')}</th>
                                <th className="px-4 py-2">{t('accounting.transactions.memo')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {bookTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                        {t('accounting.recon.no_book_txns')}
                                    </td>
                                </tr>
                            )}
                            {bookTransactions.map((txn) => (
                                <tr key={txn.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{txn.transacted_on}</td>
                                    <td className="px-4 py-2">
                                        {t(`accounting.transactions.types.${txn.type}`, undefined, txn.type)} /{' '}
                                        {t(`accounting.transactions.${txn.direction === 'in' ? 'in' : 'out'}`)}
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">{formatAmount(txn.amount)}</td>
                                    <td className="px-4 py-2 max-w-[180px] truncate" title={txn.memo ?? undefined}>
                                        {txn.reference ?? txn.memo ?? `#${txn.id}`}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AccountingShell>
    );
}
