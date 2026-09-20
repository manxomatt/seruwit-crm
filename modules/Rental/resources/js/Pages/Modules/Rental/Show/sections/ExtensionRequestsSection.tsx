import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { SectionCard } from '../../ShowUi';
import ReassignConflictModal from '../modals/ReassignConflictModal';
import RejectExtensionModal from '../modals/RejectExtensionModal';
import type { ExtensionRequest, Rental } from '../types';

interface Props {
    rental: Rental;
    periodLabel: string;
}

export default function ExtensionRequestsSection({ rental, periodLabel }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    const [reassignModalReq, setReassignModalReq] = useState<ExtensionRequest | null>(null);
    const [rejectModalReq, setRejectModalReq] = useState<ExtensionRequest | null>(null);

    return (
        <SectionCard title={t('rental.sections.extension_requests', undefined, 'Permohonan Perpanjangan Sewa')} icon="⏱️">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(rental.extension_requests ?? []).map((req) => (
                    <div key={req.id} className="space-y-2.5 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3 text-xs">
                            <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    ➔ {formatDateDmY(req.requested_end_date)}
                                </span>
                                <span className="ml-2 font-medium text-slate-400">
                                    (+{req.estimated_periods} {periodLabel})
                                </span>
                                {req.channel && (
                                    <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        {t(`rental.channel.${req.channel}`, undefined, req.channel)}
                                    </span>
                                )}
                                {req.notes && (
                                    <p className="mt-1 text-xs italic text-slate-500">{req.notes}</p>
                                )}
                            </div>
                            <span className="tabular-nums font-black text-indigo-600 dark:text-indigo-400">
                                {formatMoney(req.estimated_amount)}
                            </span>
                        </div>

                        {/* Collision Warning Banner */}
                        {req.has_conflict && (
                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 space-y-2">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                                        <span>⚠️</span>
                                        <span>Jadwal Bentrok dengan Booking Lain</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReassignModalReq(req)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-amber-700 transition"
                                    >
                                        <span>⚡ Atasi Benturan & Pindahkan Unit</span>
                                    </button>
                                </div>
                                {req.conflicting_rentals && req.conflicting_rentals.length > 0 && (
                                    <div className="space-y-1 text-[11px] text-amber-700 dark:text-amber-300/90">
                                        {req.conflicting_rentals.map((c) => (
                                            <div key={c.id} className="flex items-center gap-2">
                                                <span className="font-mono font-bold">{c.code}</span>
                                                <span>— {c.customer_name || 'Customer'} ({formatDateDmY(c.start_date)} s/d {formatDateDmY(c.end_date)})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <PrimaryButton
                                type="button"
                                disabled={Boolean(req.has_conflict)}
                                onClick={() =>
                                    router.post(
                                        prefixedRoute('rental.extension_requests.approve', [
                                             rental.id,
                                             req.id,
                                        ]),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                className={`text-xs font-bold ${
                                    req.has_conflict
                                        ? 'opacity-50 cursor-not-allowed bg-slate-400'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                title={req.has_conflict ? 'Selesaikan benturan jadwal terlebih dahulu' : 'Setujui perpanjangan'}
                            >
                                {t('rental.actions.approve', undefined, 'Setujui')}
                            </PrimaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={() => setRejectModalReq(req)}
                                className="text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                                {t('rental.actions.reject', undefined, 'Tolak')}
                            </SecondaryButton>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reassign Collision Modal */}
            {reassignModalReq && (
                <ReassignConflictModal
                    show={Boolean(reassignModalReq)}
                    rental={rental}
                    conflictingRentals={reassignModalReq.conflicting_rentals || []}
                    alternativeVehicles={reassignModalReq.alternative_vehicles || []}
                    onClose={() => setReassignModalReq(null)}
                />
            )}

            {/* Reject Modal with Refund Options */}
            {rejectModalReq && (
                <RejectExtensionModal
                    show={Boolean(rejectModalReq)}
                    rental={rental}
                    request={rejectModalReq}
                    onClose={() => setRejectModalReq(null)}
                />
            )}
        </SectionCard>
    );
}
