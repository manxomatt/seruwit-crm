import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { DetailRow, SectionCard } from '../../ShowUi';
import type { Rental } from '../types';

interface Props {
    rental: Rental;
    periodLabel: string;
}

export default function PricingSnapshotSection({ rental, periodLabel }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.pricing_snapshot', undefined, 'Rincian Tarif & Potongan Harga')} icon="💳">
            <dl>
                <DetailRow label={t('rental.fields.rate', undefined, 'Tarif Pokok')}>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums font-bold">
                            {formatMoney(rental.rate_per_period)} / {periodLabel}
                        </span>
                        {(() => {
                            const pTier = rental.applied_period_tier;
                            const lTier = rental.applied_loyalty_tier;
                            if (!pTier && !lTier) return null;
                            const tierLabel = (t: NonNullable<typeof pTier>) => {
                                const max = t.max_threshold ? `-${t.max_threshold}` : '+';
                                const range = `${t.min_threshold ?? 0}${max}`;
                                let mod = '';
                                if (String(t.rate_per_period ?? '').trim() !== '') mod = `Fixed ${Number(t.rate_per_period).toLocaleString('id-ID')}`;
                                else if (String(t.discount_percent ?? '').trim() !== '') mod = `-${t.discount_percent}%`;
                                else if (String(t.discount_flat ?? '').trim() !== '') mod = `-Rp ${Number(t.discount_flat).toLocaleString('id-ID')}`;
                                return `${range}${mod ? ' · ' + mod : ''}`;
                            };
                            return (
                                <div className="flex flex-wrap items-center gap-1">
                                    {pTier && (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900"
                                            title={`Tier Periode Sewa: ${tierLabel(pTier)}`}
                                        >
                                            <span>📅</span>
                                            <span>{tierLabel(pTier)}</span>
                                        </span>
                                    )}
                                    {lTier && (
                                        <span
                                            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900"
                                            title={`Tier Loyalty: ${tierLabel(lTier)}`}
                                        >
                                            <span>⭐</span>
                                            <span>{tierLabel(lTier)}</span>
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </DetailRow>
                {rental.km_limit_per_period && (
                    <DetailRow label={t('rental.fields.km_limit', undefined, 'Batas Jarak')}>
                        {t('rental.rates.km', { km: rental.km_limit_per_period }, `${rental.km_limit_per_period} km`)} / {periodLabel}
                    </DetailRow>
                )}
                {rental.excess_km_rate && (
                    <DetailRow label={t('rental.fields.excess_km_rate', undefined, 'Tarif Kelebihan Jarak')}>
                        <span className="tabular-nums">{formatMoney(rental.excess_km_rate)} / km</span>
                    </DetailRow>
                )}
                {rental.late_fee_per_day && (
                    <DetailRow label={t('rental.fields.late_fee_per_day', undefined, 'Denda Keterlambatan')}>
                        <span className="tabular-nums">{formatMoney(rental.late_fee_per_day)} / hari</span>
                    </DetailRow>
                )}
                <DetailRow label={t('rental.fields.deposit', undefined, 'Deposit Jaminan')}>
                    <span className="tabular-nums">{formatMoney(rental.deposit_amount)}</span>
                    <span className="ml-2 text-xs font-normal text-slate-500">
                        ({t(`rental.deposit.${rental.deposit_status}`, undefined, rental.deposit_status)})
                    </span>
                </DetailRow>
                {rental.deposit_status === 'settled' && Number(rental.deposit_amount) > 0 && (
                    <>
                        <DetailRow label={t('rental.deposit.applied', undefined, 'Deposit Digunakan')}>
                            <span className="tabular-nums">{formatMoney(rental.deposit_applied_amount)}</span>
                        </DetailRow>
                        <DetailRow label={t('rental.deposit.refunded', undefined, 'Deposit Dikembalikan')}>
                            <span className="tabular-nums">{formatMoney(rental.deposit_refunded_amount)}</span>
                        </DetailRow>
                    </>
                )}
                {rental.tier_discount_amount && Number(rental.tier_discount_amount) > 0 && (
                    <DetailRow label={t('rental.fields.tier_discount', undefined, 'Potongan Tier Harga')}>
                        <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">− {formatMoney(rental.tier_discount_amount)}</span>
                    </DetailRow>
                )}
                <DetailRow label={t('rental.fields.base_amount', undefined, 'Total Pokok Sewa')}>
                    <span className="tabular-nums">{formatMoney(rental.base_amount)}</span>
                </DetailRow>
                {Number(rental.excess_amount) > 0 && (
                    <DetailRow label={t('rental.fields.excess_km', { km: rental.excess_km ?? 0 }, `Kelebihan Jarak (${rental.excess_km} km)`)}>
                        <span className="tabular-nums text-rose-600">{formatMoney(rental.excess_amount)}</span>
                    </DetailRow>
                )}
                {Number(rental.late_fee_amount) > 0 && (
                    <DetailRow label={t('rental.fields.late_fee', { days: rental.overdue_days ?? 0 }, `Denda Terlambat (${rental.overdue_days} hari)`)}>
                        <span className="tabular-nums text-rose-600">{formatMoney(rental.late_fee_amount)}</span>
                    </DetailRow>
                )}
                <DetailRow label={t('rental.fields.total_amount', undefined, 'Total Biaya Keseluruhan')}>
                    <span className="text-base font-black tabular-nums text-indigo-600 dark:text-indigo-400">{formatMoney(rental.total_amount)}</span>
                </DetailRow>
            </dl>

            {rental.period_pricing_snapshot && rental.period_pricing_snapshot.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                    <details className="group" open>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4 text-slate-500 transition group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                                <span>
                                    {t('rental.sections.period_breakdown', undefined, 'Rincian Periode & Rate Terpakai')}
                                </span>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-2xs dark:bg-slate-700 dark:text-slate-300">
                                    {rental.period_pricing_snapshot.length} periode
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400">Klik untuk expand</span>
                        </summary>
                        <div className="border-t border-slate-100 dark:border-slate-800">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                    <thead className="bg-white/60 dark:bg-slate-800/60">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">#</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                {t('rental.fields.date_range', undefined, 'Tanggal')}
                                            </th>
                                            <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                {t('rental.fields.rate_applied', undefined, 'Rate Terpakai')}
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                {t('rental.fields.tier_applied', undefined, 'Keterangan Tier')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                        {rental.period_pricing_snapshot.map((row) => (
                                            <tr key={row.period} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/50">
                                                <td className="whitespace-nowrap px-3 py-2 text-xs">
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white dark:bg-slate-700">
                                                        {row.period}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                                                    <div className="font-bold tabular-nums">{formatDateDmY(row.from_date)}</div>
                                                    <div className="text-[11px] text-slate-400">s/d {formatDateDmY(row.to_date)}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-black tabular-nums text-slate-900 dark:text-white">
                                                    {formatMoney(row.rate_applied)}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                                                    {row.tier_label ? (
                                                        <code className="rounded-lg bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900">
                                                            {row.tier_label}
                                                        </code>
                                                    ) : (
                                                        <span className="text-slate-400">— (Base Rate)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </details>
                </div>
            )}
        </SectionCard>
    );
}
