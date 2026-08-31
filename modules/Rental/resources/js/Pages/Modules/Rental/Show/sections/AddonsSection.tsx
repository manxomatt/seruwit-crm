import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { formatMoney } from '@/utils/money';
import { router } from '@inertiajs/react';
import { SectionCard } from '../../ShowUi';
import type { AddonCharge } from '../types';

interface Props {
    rentalId: number;
    addonCharges: AddonCharge[];
}

export default function AddonsSection({ rentalId, addonCharges }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <SectionCard title={t('rental.sections.addons', undefined, 'Layanan Tambahan & Biaya Opsional')} icon="📦">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {addonCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">{charge.description}</p>
                            <p className="text-[11px] text-slate-400">
                                {charge.addon_code
                                    ? t(`rental.addon.codes.${charge.addon_code}`, undefined, charge.addon_code)
                                    : t('rental.addon.codes.other', undefined, 'Lainnya')}
                                {charge.is_invoiced ? ` · ${t('rental.addon.invoiced', undefined, 'Sudah Diterbitkan Invoice')}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="tabular-nums font-black text-slate-900 dark:text-white">{formatMoney(charge.amount)}</span>
                            {charge.can_delete && (
                                <button
                                    type="button"
                                    onClick={() => router.delete(prefixedRoute('rental.addons.destroy', [rentalId, charge.id]), { preserveScroll: true })}
                                    className="text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );
}
