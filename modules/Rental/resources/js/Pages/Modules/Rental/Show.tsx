import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

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

    return (
        <DynamicLayout header="Rental">
            <Head title={`Rental ${rental.code}`} />
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <Link href={prefixedRoute('rental.index')} className="mb-1 block text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">← Back</Link>
                        <div className="flex items-center gap-3">
                            <h1 className="font-mono text-xl font-bold text-gray-900 dark:text-white">{rental.code}</h1>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[rental.status]}`}>
                                {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                            </span>
                            {rental.is_overdue && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Overdue</span>}
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {(is('draft') || is('confirmed')) && (
                            <Link href={prefixedRoute('rental.edit', rental.id)}>
                                <SecondaryButton>Edit</SecondaryButton>
                            </Link>
                        )}
                        {is('draft') && <PrimaryButton onClick={() => action('confirm')}>Confirm</PrimaryButton>}
                        {is('confirmed') && <PrimaryButton onClick={() => setModal('checkout')}>Check Out</PrimaryButton>}
                        {is('active') && (
                            <>
                                <SecondaryButton onClick={() => setModal('extend')}>Extend</SecondaryButton>
                                <SecondaryButton onClick={() => setModal('damage')}>Add Damage</SecondaryButton>
                                <PrimaryButton onClick={() => setModal('return')}>Return</PrimaryButton>
                            </>
                        )}
                        {is('returned') && (
                            <>
                                <SecondaryButton onClick={() => setModal('damage')}>Add Damage</SecondaryButton>
                                <PrimaryButton onClick={() => action('complete')}>Complete</PrimaryButton>
                            </>
                        )}
                        {(is('draft') || is('confirmed')) && (
                            <DangerButton onClick={() => setModal('cancel')}>Cancel</DangerButton>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Booking info */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Booking Details</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">Vehicle</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.vehicle.name} <span className="text-gray-400">({rental.vehicle.plate_number})</span></dd>
                                <dt className="text-gray-500">Customer</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.partner.name}</dd>
                                {rental.driver && <><dt className="text-gray-500">Driver</dt><dd className="text-gray-900 dark:text-white">{rental.driver.name}</dd></>}
                                <dt className="text-gray-500">Period</dt>
                                <dd className="text-gray-900 dark:text-white">{rental.start_date} → {rental.end_date} ({rental.total_periods} {rental.period_type})</dd>
                                {rental.actual_return_date && <><dt className="text-gray-500">Actual Return</dt><dd className="text-gray-900 dark:text-white">{rental.actual_return_date}</dd></>}
                            </dl>
                        </div>

                        {/* Pricing */}
                        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pricing Snapshot</h2>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                <dt className="text-gray-500">Rate</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.rate_per_period)} / {rental.period_type}</dd>
                                {rental.km_limit_per_period && <><dt className="text-gray-500">KM Limit</dt><dd className="tabular-nums text-gray-900 dark:text-white">{rental.km_limit_per_period} km / {rental.period_type}</dd></>}
                                {rental.excess_km_rate && <><dt className="text-gray-500">Excess Rate</dt><dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.excess_km_rate)} / km</dd></>}
                                <dt className="text-gray-500">Deposit</dt>
                                <dd className="tabular-nums text-gray-900 dark:text-white">{formatMoney(rental.deposit_amount)} {rental.deposit_returned && <span className="ml-1 text-xs text-green-600">Returned</span>}</dd>
                                <dt className="text-gray-500 font-medium">Base Amount</dt>
                                <dd className="tabular-nums font-medium text-gray-900 dark:text-white">{formatMoney(rental.base_amount)}</dd>
                                {Number(rental.excess_amount) > 0 && (
                                    <>
                                        <dt className="text-gray-500">Excess KM ({rental.excess_km} km)</dt>
                                        <dd className="tabular-nums text-red-600">{formatMoney(rental.excess_amount)}</dd>
                                    </>
                                )}
                                <dt className="border-t border-gray-100 pt-2 text-gray-700 font-semibold dark:border-gray-700">Total Amount</dt>
                                <dd className="border-t border-gray-100 pt-2 tabular-nums text-gray-900 font-semibold dark:border-gray-700 dark:text-white">{formatMoney(rental.total_amount)}</dd>
                            </dl>
                        </div>

                        {/* Odometer */}
                        {(rental.start_odometer || rental.end_odometer) && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Odometer</h2>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
                                    {rental.start_odometer && <><dt className="text-gray-500">Checkout</dt><dd className="tabular-nums text-gray-900 dark:text-white">{rental.start_odometer.toLocaleString()} km</dd></>}
                                    {rental.end_odometer && <><dt className="text-gray-500">Return</dt><dd className="tabular-nums text-gray-900 dark:text-white">{rental.end_odometer.toLocaleString()} km</dd></>}
                                </dl>
                            </div>
                        )}

                        {/* Extensions */}
                        {rental.extensions.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extensions</h2>
                                </div>
                                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {rental.extensions.map((ext) => (
                                        <div key={ext.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                            <div>
                                                <span className="text-gray-900 dark:text-white">{ext.original_end_date} → {ext.new_end_date}</span>
                                                <span className="ml-2 text-gray-400">(+{ext.extended_periods} {rental.period_type})</span>
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
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Damages</h2>
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
                                                    Remove
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
                            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Timeline</h2>
                            <ol className="relative border-l border-gray-200 dark:border-gray-700">
                                {[
                                    { label: 'Created', date: rental.confirmed_at ? '' : 'pending', done: true },
                                    { label: 'Confirmed', date: rental.confirmed_at, by: rental.confirmed_by?.name, done: !!rental.confirmed_at },
                                    { label: 'Checked Out', date: rental.checked_out_at, done: !!rental.checked_out_at },
                                    { label: 'Returned', date: rental.returned_at, done: !!rental.returned_at },
                                    { label: 'Completed', date: rental.completed_at, done: !!rental.completed_at },
                                ].map((step, i) => (
                                    <li key={i} className="mb-4 ml-4">
                                        <div className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border ${step.done ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'}`} />
                                        <p className={`text-sm font-medium ${step.done ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                                        {step.date && <p className="text-xs text-gray-400">{step.date}</p>}
                                        {step.by && <p className="text-xs text-gray-400">by {step.by}</p>}
                                    </li>
                                ))}
                                {rental.status === 'cancelled' && (
                                    <li className="mb-4 ml-4">
                                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-red-500 bg-red-500" />
                                        <p className="text-sm font-medium text-red-600">Cancelled</p>
                                        {rental.cancelled_reason && <p className="text-xs text-gray-400">{rental.cancelled_reason}</p>}
                                    </li>
                                )}
                            </ol>
                        </div>
                        {rental.notes && (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{rental.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal show={modal === 'cancel'} onClose={() => setModal(null)}>
                <form onSubmit={submitCancel} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Cancel Rental</h2>
                    <InputLabel htmlFor="cancelled_reason" value="Reason *" />
                    <textarea id="cancelled_reason" rows={3} value={cancelForm.data.cancelled_reason} onChange={(e) => cancelForm.setData('cancelled_reason', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    <InputError message={cancelForm.errors.cancelled_reason} className="mt-1" />
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>Back</SecondaryButton>
                        <DangerButton disabled={cancelForm.processing}>Cancel Rental</DangerButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'checkout'} onClose={() => setModal(null)}>
                <form onSubmit={submitCheckout} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Check Out Vehicle</h2>
                    <InputLabel htmlFor="start_odometer" value="Starting Odometer (km)" />
                    <TextInput id="start_odometer" type="number" min="0" value={checkoutForm.data.start_odometer} onChange={(e) => checkoutForm.setData('start_odometer', e.target.value)} className="mt-1 w-full" />
                    <InputError message={checkoutForm.errors.start_odometer} className="mt-1" />
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={checkoutForm.processing}>Check Out</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'return'} onClose={() => setModal(null)}>
                <form onSubmit={submitReturn} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Record Return</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="actual_return_date" value="Return Date *" />
                            <TextInput id="actual_return_date" type="date" value={returnForm.data.actual_return_date} onChange={(e) => returnForm.setData('actual_return_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.actual_return_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="end_odometer" value="End Odometer (km)" />
                            <TextInput id="end_odometer" type="number" min="0" value={returnForm.data.end_odometer} onChange={(e) => returnForm.setData('end_odometer', e.target.value)} className="mt-1 w-full" />
                            <InputError message={returnForm.errors.end_odometer} className="mt-1" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <input type="checkbox" checked={returnForm.data.deposit_returned} onChange={(e) => returnForm.setData('deposit_returned', e.target.checked)} className="rounded" />
                            Deposit returned to customer
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={returnForm.processing}>Record Return</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'extend'} onClose={() => setModal(null)}>
                <form onSubmit={submitExtend} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Extend Rental</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="new_end_date" value="New End Date *" />
                            <TextInput id="new_end_date" type="date" value={extendForm.data.new_end_date} onChange={(e) => extendForm.setData('new_end_date', e.target.value)} className="mt-1 w-full" />
                            <InputError message={extendForm.errors.new_end_date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="extend_notes" value="Notes" />
                            <textarea id="extend_notes" rows={2} value={extendForm.data.notes} onChange={(e) => extendForm.setData('notes', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={extendForm.processing}>Extend</PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal show={modal === 'damage'} onClose={() => setModal(null)}>
                <form onSubmit={submitDamage} className="p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Record Damage</h2>
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="damage_desc" value="Description *" />
                            <textarea id="damage_desc" rows={2} value={damageForm.data.description} onChange={(e) => damageForm.setData('description', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <InputError message={damageForm.errors.description} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="damage_amount" value="Repair Cost (Rp) *" />
                            <TextInput id="damage_amount" type="number" min="0" value={damageForm.data.amount} onChange={(e) => damageForm.setData('amount', e.target.value)} className="mt-1 w-full" />
                            <InputError message={damageForm.errors.amount} className="mt-1" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={() => setModal(null)}>Cancel</SecondaryButton>
                        <PrimaryButton disabled={damageForm.processing}>Save Damage</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </DynamicLayout>
    );
}
