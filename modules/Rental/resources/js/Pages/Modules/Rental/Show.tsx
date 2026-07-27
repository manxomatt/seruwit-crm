import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import RentalNav from '../../../RentalNav';

const formatMoney = (v: string | number) => 'Rp ' + Number(v).toLocaleString('id-ID');

interface Extension { id: number; original_end_date: string; new_end_date: string; extended_periods: number; additional_amount: string; notes: string | null; }
interface Damage { id: number; description: string; amount: string; photo_path: string | null; reported_at: string; }
interface Rental {
    id: number; code: string; status: string; is_overdue: boolean;
    start_date: string; end_date: string; actual_return_date: string | null;
    period_type: string; total_periods: number;
    rate_per_period: string; km_limit_per_period: number | null; excess_km_rate: string | null;
    deposit_amount: string; deposit_returned: boolean;
    base_amount: string; excess_km: number | null; excess_amount: string; total_amount: string;
    start_odometer: number | null; end_odometer: number | null;
    notes: string | null; cancelled_reason: string | null;
    confirmed_at: string | null; checked_out_at: string | null; returned_at: string | null; completed_at: string | null;
    vehicle: { id: number; name: string; plate_number: string; type: string; status: string; };
    partner: { id: number; name: string; code: string; phone: string | null; };
    driver: { id: number; name: string; phone: string | null; } | null;
    confirmed_by: { id: number; name: string; } | null;
    extensions: Extension[];
    damages: Damage[];
}

interface Props { rental: Rental; }

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700', confirmed: 'bg-blue-100 text-blue-700',
    active: 'bg-amber-100 text-amber-700', returned: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

export default function Show({ rental }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [modal, setModal] = useState<'cancel' | 'checkout' | 'return' | 'extend' | 'damage' | null>(null);

    const cancelForm = useForm({ cancelled_reason: '' });
    const checkoutForm = useForm({ start_odometer: '' });
    const returnForm = useForm({ actual_return_date: '', end_odometer: '', deposit_returned: false });
    const extendForm = useForm({ new_end_date: '', notes: '' });
    const damageForm = useForm({ description: '', amount: '', photo_path: '' });

    const action = (name: string, extra: Record<string, unknown> = {}) =>
        router.post(prefixedRoute(`rental.${name}`, rental.id), extra as any, { preserveScroll: true });

    const submitCancel: FormEventHandler = (e) => { e.preventDefault(); cancelForm.post(prefixedRoute('rental.cancel', rental.id), { onSuccess: () => setModal(null) }); };
    const submitCheckout: FormEventHandler = (e) => { e.preventDefault(); checkoutForm.post(prefixedRoute('rental.checkout', rental.id), { onSuccess: () => setModal(null) }); };
    const submitReturn: FormEventHandler = (e) => { e.preventDefault(); returnForm.post(prefixedRoute('rental.return', rental.id), { onSuccess: () => setModal(null) }); };
    const submitExtend: FormEventHandler = (e) => { e.preventDefault(); extendForm.post(prefixedRoute('rental.extend', rental.id), { onSuccess: () => setModal(null) }); };
    const submitDamage: FormEventHandler = (e) => { e.preventDefault(); damageForm.post(prefixedRoute('rental.damages.store', rental.id), { onSuccess: () => setModal(null) }); };

    const is = (s: string) => rental.status === s;

    const periodLabel = t(`rental.period_type.${rental.period_type}`, undefined, rental.period_type);

    const timelineSteps = [
        { label: t('rental.timeline.created'), date: rental.confirmed_at ? '' : t('rental.timeline.pending'), done: true },
        { label: t('rental.timeline.confirmed'), date: rental.confirmed_at, by: rental.confirmed_by?.name, done: !!rental.confirmed_at },
        { label: t('rental.timeline.checked_out'), date: rental.checked_out_at, done: !!rental.checked_out_at },
        { label: t('rental.timeline.returned'), date: rental.returned_at, done: !!rental.returned_at },
        { label: t('rental.timeline.completed'), date: rental.completed_at, done: !!rental.completed_at },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="font-mono text-xl font-semibold text-gray-800">{rental.code}</h2>
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[rental.status]}`}>
                            {t(`rental.status.${rental.status}`, undefined, rental.status)}
                        </span>
                        {rental.is_overdue && (
                            <span className="inline-flex rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                {t('rental.status.overdue')}
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={t('rental.pages.show.title', { code: rental.code })} />

            <RentalNav />

            <div className="mb-6 flex flex-wrap justify-end gap-2">
                        {(is('draft') || is('confirmed')) && (
                            <Link href={prefixedRoute('rental.edit', rental.id)}>
                                <SecondaryButton>{t('common.edit')}</SecondaryButton>
                            </Link>
                        )}
                        {is('draft') && <PrimaryButton onClick={() => action('confirm')}>{t('rental.actions.confirm')}</PrimaryButton>}
                        {is('confirmed') && <PrimaryButton onClick={() => setModal('checkout')}>{t('rental.actions.checkout')}</PrimaryButton>}
                        {is('active') && (
                            <>
                                <SecondaryButton onClick={() => setModal('extend')}>{t('rental.actions.extend')}</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('damage')}>{t('rental.actions.add_damage')}</SecondaryButton>
                                <PrimaryButton onClick={() => setModal('return')}>{t('rental.actions.return')}</PrimaryButton>
                            </>
                        )}
                        {is('returned') && (
                            <>
                                <SecondaryButton onClick={() => setModal('damage')}>{t('rental.actions.add_damage')}</SecondaryButton>
                                <PrimaryButton onClick={() => action('complete')}>{t('rental.actions.complete')}</PrimaryButton>
                            </>
                        )}
                        {(is('draft') || is('confirmed')) && (
                            <DangerButton onClick={() => setModal('cancel')}>{t('common.cancel')}</DangerButton>
                        )}
            </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Booking info */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.booking_details')}</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">{t('rental.fields.vehicle')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.vehicle.name} <span className="text-gray-400">({rental.vehicle.plate_number})</span></dd>
                                <dt className="text-gray-500">{t('rental.fields.customer')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.partner.name}</dd>
                                {rental.driver && <><dt className="text-gray-500">{t('rental.fields.driver')}</dt><dd className="text-gray-900 dark:text-white">{rental.driver.name}</dd></>}
                                <dt className="text-gray-500">{t('rental.fields.period')}</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.start_date} → {rental.end_date} ({rental.total_periods} {periodLabel})</dd>
                                {rental.actual_return_date && <><dt className="text-gray-500">{t('rental.fields.actual_return')}</dt><dd className="text-gray-900 dark:text-white">{rental.actual_return_date}</dd></>}
                            </dl>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.pricing_snapshot')}</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">{t('rental.fields.rate')}</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.rate_per_period)} / {periodLabel}</dd>
                                {rental.km_limit_per_period && <><dt className="text-gray-500">{t('rental.fields.km_limit')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{t('rental.rates.km', { km: rental.km_limit_per_period })} / {periodLabel}</dd></>}
                                {rental.excess_km_rate && <><dt className="text-gray-500">{t('rental.fields.excess_km_rate')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.excess_km_rate)} / km</dd></>}
                                <dt className="text-gray-500">{t('rental.fields.deposit')}</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.deposit_amount)} {rental.deposit_returned && <span className="ml-1 text-xs text-green-600">{t('rental.timeline.deposit_returned')}</span>}</dd>
                                <dt className="text-gray-500 font-medium">{t('rental.fields.base_amount')}</dt>
                                <dd className="tabular-nums font-medium text-gray-900 dark:text-white">{formatMoney(rental.base_amount)}</dd>
                                {Number(rental.excess_amount) > 0 && (
                                    <>
                                        <dt className="text-gray-500">{t('rental.fields.excess_km', { km: rental.excess_km ?? 0 })}</dt>
                                        <dd className="tabular-nums text-red-600">{formatMoney(rental.excess_amount)}</dd>
                                    </>
                                )}
                                <dt className="border-t border-gray-100 pt-2 text-gray-700 font-semibold dark:border-gray-700">{t('rental.fields.total_amount')}</dt>
                                <dd className="border-t border-gray-100 pt-2 tabular-nums text-gray-900 font-semibold dark:border-gray-700 dark:text-white">{formatMoney(rental.total_amount)}</dd>
                            </dl>
                        </div>

                        {/* Odometer */}
                        {(rental.start_odometer || rental.end_odometer) && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.odometer')}</h2>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                    {rental.start_odometer && <><dt className="text-gray-500">{t('rental.fields.checkout')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{t('rental.rates.km', { km: rental.start_odometer.toLocaleString() })}</dd></>}
                                    {rental.end_odometer && <><dt className="text-gray-500">{t('rental.fields.return')}</dt><dd className="tabular-nums text-gray-900 dark:text-white">{t('rental.rates.km', { km: rental.end_odometer.toLocaleString() })}</dd></>}
                                </dl>
                            </div>
                        )}

                        {/* Extensions */}
                        {rental.extensions.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.extensions')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rental.extensions.map((ext) => (
                                        <div key={ext.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                            <div>
                                                <span className="text-gray-900 dark:text-white">{ext.original_end_date} → {ext.new_end_date}</span>
                                                <span className="ml-2 text-gray-400">(+{ext.extended_periods} {periodLabel})</span>
                                            </div>
                                            <span className="tabular-nums text-gray-700 dark:text-gray-300">{formatMoney(ext.additional_amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Damages */}
                        {rental.damages.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.damages')}</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rental.damages.map((dmg) => (
                                        <div key={dmg.id} className="flex items-start justify-between px-4 py-3 text-sm">
                                            <div className="flex-1">
                                                <p className="text-gray-900 dark:text-white">{dmg.description}</p>
                                                <p className="text-xs text-gray-400">{dmg.reported_at}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="tabular-nums text-red-600">{formatMoney(dmg.amount)}</span>
                                                <button
                                                    onClick={() => router.delete(prefixedRoute('rental.damages.destroy', [rental.id, dmg.id]), { preserveScroll: true })}
                                                    className="text-xs text-gray-400 hover:text-red-600"
                                                >
                                                    {t('rental.actions.remove')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column — timeline */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.timeline')}</h2>
                            <ol className="relative border-l border-gray-200 dark:border-gray-700">
                                {timelineSteps.map((step, i) => (
                                    <li key={i} className="mb-4 ml-4">
                                        <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border ${step.done ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'}`} />
                                        <p className={`text-sm font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                                        {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
                                        {step.by && <p className="text-xs text-gray-400">{t('rental.timeline.by', { name: step.by })}</p>}
                                    </li>
                                ))}
                                {rental.status === 'cancelled' && (
                                    <li className="mb-4 ml-4">
                                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-red-500 bg-red-500" />
                                        <p className="text-sm font-medium text-red-600">{t('rental.timeline.cancelled')}</p>
                                        {rental.cancelled_reason && <p className="text-xs text-gray-400">{rental.cancelled_reason}</p>}
                                    </li>
                                )}
                            </ol>
                        </div>
                        {rental.notes && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('rental.sections.notes')}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{rental.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

            {/* Modals */}
            <Modal show={modal === 'cancel'} onClose={() => setModal(null)}>
                <form onSubmit={submitCancel} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.cancel')}</h2>
                    <InputLabel htmlFor="cancelled_reason" value={`${t('rental.fields.cancel_reason')} *`} />
                    <textarea id="cancelled_reason" rows={3} value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-1" />
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('rental.nav.back')}</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>{t('rental.actions.cancel_rental')}</DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'checkout'} onClose={() => setModal(null)}>
                <form onSubmit={submitCheckout} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.checkout')}</h2>
                    <InputLabel htmlFor="start_odometer" value={t('rental.fields.start_odometer')} />
                    <TextInput id="start_odometer" type="number" min="0" value={checkoutForm.data.start_odometer} onChange={(e) => checkoutForm.setData('start_odometer', e.target.value)} className="mt-1 w-full" />
                    <InputError message={checkoutForm.errors.start_odometer} className="mt-1" />
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={checkoutForm.processing}>{t('rental.actions.checkout')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'return'} onClose={() => setModal(null)}>
                <form onSubmit={submitReturn} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.return')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="actual_return_date" value={`${t('rental.fields.return_date')} *`} />
                            <TextInput id="actual_return_date" type="date" value={returnForm.data.actual_return_date} onChange={(e) => returnForm.setData('actual_return_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.actual_return_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_odometer" value={t('rental.fields.end_odometer')} />
                            <TextInput id="end_odometer" type="number" min="0" value={returnForm.data.end_odometer} onChange={(e) => returnForm.setData('end_odometer', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.end_odometer} className="mt-1" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="checkbox" checked={returnForm.data.deposit_returned} onChange={(e) => returnForm.setData('deposit_returned', e.target.checked)} className="rounded" />
                            {t('rental.fields.deposit_returned')}
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={returnForm.processing}>{t('rental.actions.record_return')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'extend'} onClose={() => setModal(null)}>
                <form onSubmit={submitExtend} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.extend')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="new_end_date" value={`${t('rental.fields.new_end_date')} *`} />
                            <TextInput id="new_end_date" type="date" value={extendForm.data.new_end_date} onChange={(e) => extendForm.setData('new_end_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={extendForm.errors.new_end_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="extend_notes" value={t('rental.fields.notes')} />
                            <textarea id="extend_notes" rows={2} value={extendForm.data.notes} onChange={(e) => extendForm.setData('notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={extendForm.processing}>{t('rental.actions.extend')}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'damage'} onClose={() => setModal(null)}>
                <form onSubmit={submitDamage} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('rental.modals.damage')}</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="damage_desc" value={`${t('rental.fields.description')} *`} />
                            <textarea id="damage_desc" rows={2} value={damageForm.data.description} onChange={(e) => damageForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <InputError message={damageForm.errors.description} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="damage_amount" value={`${t('rental.fields.repair_cost')} *`} />
                            <TextInput id="damage_amount" type="number" min="0" value={damageForm.data.amount} onChange={(e) => damageForm.setData('amount', e.target.value)} className="mt-1 w-full" />
                            <InputError message={damageForm.errors.amount} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>{t('common.cancel')}</SecondaryButton>
                        <PrimaryButton disabled={damageForm.processing}>{t('rental.actions.save_damage')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
