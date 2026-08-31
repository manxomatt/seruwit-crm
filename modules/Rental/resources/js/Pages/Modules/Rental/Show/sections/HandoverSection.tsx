import { useTrans } from '@/hooks/useTrans';
import AiHandoverInspectionPanel, { type AiInspectionData } from '../../../../../Components/AiHandoverInspectionPanel';
import { DetailRow, SectionCard } from '../../ShowUi';
import type { HandoverEvidence, Rental } from '../types';

interface Props {
    rental: Rental;
    checklistItems: string[];
    handoverEvidence: HandoverEvidence;
    aiInspectionEnabled: boolean;
    latestAiInspection: AiInspectionData | null;
    aiInspectExistingUrl?: string;
    aiApplyDamageUrl?: string;
}

export default function HandoverSection({
    rental,
    checklistItems,
    handoverEvidence,
    aiInspectionEnabled,
    latestAiInspection,
    aiInspectExistingUrl,
    aiApplyDamageUrl,
}: Props): JSX.Element {
    const { t } = useTrans();
    const canInspect = ['active', 'returned', 'completed'].includes(rental.status);

    return (
        <SectionCard title={t('rental.sections.handover', undefined, 'Serah Terima & BAST Kendaraan')} icon="🚗">
            <dl>
                {rental.start_odometer != null && (
                    <DetailRow label={t('rental.fields.checkout', undefined, 'Odometer Berangkat')}>
                        <span className="tabular-nums font-bold">
                            {t('rental.rates.km', { km: rental.start_odometer.toLocaleString() }, `${rental.start_odometer.toLocaleString()} km`)}
                        </span>
                        {rental.start_fuel_level && (
                            <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                ⛽ {t(`rental.fuel.${rental.start_fuel_level}`, undefined, rental.start_fuel_level)}
                            </span>
                        )}
                    </DetailRow>
                )}
                {rental.end_odometer != null && (
                    <DetailRow label={t('rental.fields.return', undefined, 'Odometer Kembali')}>
                        <span className="tabular-nums font-bold">
                            {t('rental.rates.km', { km: rental.end_odometer.toLocaleString() }, `${rental.end_odometer.toLocaleString()} km`)}
                        </span>
                        {rental.end_fuel_level && (
                            <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                ⛽ {t(`rental.fuel.${rental.end_fuel_level}`, undefined, rental.end_fuel_level)}
                            </span>
                        )}
                    </DetailRow>
                )}
            </dl>
            {rental.checkout_checklist && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('rental.checklist.checkout', undefined, 'Checklist Saat Penyerahan (Checkout)')}
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                        {checklistItems.map((key) => (
                            <li key={`out-${key}`} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <span className={rental.checkout_checklist?.[key] ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                                    {rental.checkout_checklist?.[key] ? '✓' : '✗'}
                                </span>{' '}
                                {t(`rental.checklist.items.${key}`, undefined, key)}
                            </li>
                        ))}
                    </ul>
                    {rental.checkout_notes && <p className="mt-2 text-xs italic text-slate-500">{rental.checkout_notes}</p>}
                    {handoverEvidence.checkout_photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {handoverEvidence.checkout_photos.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                </a>
                            ))}
                        </div>
                    )}
                    {handoverEvidence.checkout_signature_url && (
                        <img src={handoverEvidence.checkout_signature_url} alt="" className="mt-3 h-16 rounded-xl border border-slate-200 bg-white dark:border-slate-700" />
                    )}
                </div>
            )}
            {rental.return_checklist && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {t('rental.checklist.return', undefined, 'Checklist Saat Pengembalian (Return)')}
                    </p>
                    <ul className="grid gap-1.5 sm:grid-cols-2">
                        {checklistItems.map((key) => (
                            <li key={`in-${key}`} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <span className={rental.return_checklist?.[key] ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                                    {rental.return_checklist?.[key] ? '✓' : '✗'}
                                </span>{' '}
                                {t(`rental.checklist.items.${key}`, undefined, key)}
                            </li>
                        ))}
                    </ul>
                    {rental.return_notes && <p className="mt-2 text-xs italic text-slate-500">{rental.return_notes}</p>}
                    {handoverEvidence.return_photos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {handoverEvidence.return_photos.map((url) => (
                                <a key={url} href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700" />
                                </a>
                            ))}
                        </div>
                    )}
                    {handoverEvidence.return_signature_url && (
                        <img src={handoverEvidence.return_signature_url} alt="" className="mt-3 h-16 rounded-xl border border-slate-200 bg-white dark:border-slate-700" />
                    )}
                </div>
            )}

            {aiInspectionEnabled && (
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <AiHandoverInspectionPanel
                        inspection={latestAiInspection}
                        canInspect={canInspect}
                        inspectUrl={aiInspectExistingUrl || ''}
                        applyDamageUrl={aiApplyDamageUrl}
                        hasReturnPhotos={(handoverEvidence?.return_photos?.length ?? 0) > 0}
                    />
                </div>
            )}
        </SectionCard>
    );
}
