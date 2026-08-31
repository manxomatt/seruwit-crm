import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { SectionCard } from '../../ShowUi';
import type { Rental } from '../types';

interface Props {
    rental: Rental;
    periodLabel: string;
}

export default function ExtensionRequestsSection({ rental, periodLabel }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.extension_requests', undefined, 'Permohonan Perpanjangan Sewa')} icon="⏱️">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(rental.extension_requests ?? []).map((req) => (
                    <div key={req.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
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
                        <div className="flex flex-wrap gap-2">
                            <PrimaryButton
                                type="button"
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
                                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                            >
                                {t('rental.actions.approve', undefined, 'Setujui')}
                            </PrimaryButton>
                            <SecondaryButton
                                type="button"
                                onClick={() =>
                                    router.post(
                                        prefixedRoute('rental.extension_requests.reject', [
                                            rental.id,
                                            req.id,
                                        ]),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                className="text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                                {t('rental.actions.reject', undefined, 'Tolak')}
                            </SecondaryButton>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
