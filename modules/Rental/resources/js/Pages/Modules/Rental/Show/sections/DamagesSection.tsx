import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatDateTimeDmYHi } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { SectionCard } from '../../ShowUi';
import type { Damage } from '../types';

interface Props {
    rentalId: number;
    damages: Damage[];
}

export default function DamagesSection({ rentalId, damages }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.damages', undefined, 'Laporan Kerusakan & Klaim')} icon="⚠️">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {damages.map((dmg) => (
                    <div key={dmg.id} className="flex items-start justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                        <div className="flex flex-1 gap-3">
                            {dmg.photo_path && (
                                <a href={dmg.photo_path} target="_blank" rel="noreferrer" className="shrink-0">
                                    <img src={dmg.photo_path} alt="" className="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                </a>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 dark:text-white">{dmg.description}</p>
                                <p className="text-[11px] text-slate-400">{formatDateTimeDmYHi(dmg.reported_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="tabular-nums font-black text-rose-600 dark:text-rose-400">{formatMoney(dmg.amount)}</span>
                            <button
                                type="button"
                                onClick={() => router.delete(prefixedRoute('rental.damages.destroy', [rentalId, dmg.id]), { preserveScroll: true })}
                                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
