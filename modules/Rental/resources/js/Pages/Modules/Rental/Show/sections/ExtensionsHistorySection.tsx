import { useTrans } from '@/hooks/useTrans';
import { formatDateDmY } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import { SectionCard } from '../../ShowUi';
import type { Extension } from '../types';

interface Props {
    extensions: Extension[];
    periodLabel: string;
}

export default function ExtensionsHistorySection({ extensions, periodLabel }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.extensions', undefined, 'Riwayat Perpanjangan')} icon="⏱️">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {extensions.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                        <div>
                            <span className="font-bold text-slate-900 dark:text-white">{formatDateDmY(ext.original_end_date)} → {formatDateDmY(ext.new_end_date)}</span>
                            <span className="ml-2 text-slate-400">(+{ext.extended_periods} {periodLabel})</span>
                        </div>
                        <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(ext.additional_amount)}</span>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
