import { useTrans } from '@/hooks/useTrans';
import { formatDateTimeDmYHi } from '@/utils/date';
import { SectionCard } from '../../ShowUi';
import type { VehicleSwapRow } from '../types';

interface Props {
    vehicleSwaps: VehicleSwapRow[];
}

export default function VehicleSwapsSection({ vehicleSwaps }: Props): JSX.Element {
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.vehicle_swaps', undefined, 'Riwayat Pergantian Unit (Swap)')} icon="🔄">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {vehicleSwaps.map((swap) => (
                    <div key={swap.id} className="py-3 text-xs first:pt-0 last:pb-0">
                        <p className="font-bold text-slate-900 dark:text-white">
                            {swap.from_vehicle} ➔ {swap.to_vehicle}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                            {formatDateTimeDmYHi(swap.swapped_at)}
                            {swap.swapped_by ? ` · Petugas: ${swap.swapped_by}` : ''}
                            {swap.odometer_km != null ? ` · ${swap.odometer_km} km` : ''}
                        </p>
                        {swap.notes && <p className="mt-1 italic text-slate-500">{swap.notes}</p>}
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
