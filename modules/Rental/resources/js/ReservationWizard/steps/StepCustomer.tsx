import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Select from '@/Components/Select';
import TextInput from '@/Components/TextInput';
import { useTrans } from '@/hooks/useTrans';
import { FormEventHandler, useMemo, useState } from 'react';
import PreviousStepsSummary from '../PreviousStepsSummary';
import type {
    AvailableVehicle,
    DriverOption,
    InsurancePackage,
    PartnerOption,
    ReservationFormData,
} from '../types';
import { csrfToken } from '../types';

type SetData = <K extends keyof ReservationFormData>(key: K, value: ReservationFormData[K]) => void;

interface Props {
    data: ReservationFormData;
    setData: SetData;
    errors: Partial<Record<keyof ReservationFormData, string>>;
    partners: PartnerOption[];
    setPartners: (partners: PartnerOption[]) => void;
    walkInUrl: string;
    selectedVehicle: AvailableVehicle | null;
    drivers: DriverOption[];
    insurancePackages: InsurancePackage[];
    isOneWay: boolean;
}

export default function StepCustomer({
    data,
    setData,
    errors,
    partners,
    setPartners,
    walkInUrl,
    selectedVehicle,
    drivers,
    insurancePackages,
    isOneWay,
}: Props): JSX.Element {
    const { t } = useTrans();
    const [showWalkIn, setShowWalkIn] = useState(false);
    const [walkIn, setWalkIn] = useState({ name: '', phone: '', email: '', id_number: '' });
    const [walkInErrors, setWalkInErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const partnerOptions = useMemo(
        () => partners.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
        [partners],
    );

    const submitWalkIn: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setWalkInErrors({});

        try {
            const response = await fetch(walkInUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                    'X-Reservation-Wizard': '1',
                },
                body: JSON.stringify(walkIn),
            });

            const payload = (await response.json()) as {
                partner?: PartnerOption;
                message?: string;
                message_bag?: Record<string, string[]>;
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                const errs = payload.errors ?? {};
                const flat: Record<string, string> = {};
                Object.entries(errs).forEach(([key, messages]) => {
                    flat[key] = messages[0] ?? '';
                });
                setWalkInErrors(flat);
                return;
            }

            if (payload.partner) {
                if (!partners.some((p) => p.id === payload.partner!.id)) {
                    setPartners([payload.partner, ...partners]);
                }
                setData('partner_id', String(payload.partner.id));
                setShowWalkIn(false);
                setWalkIn({ name: '', phone: '', email: '', id_number: '' });
            }
        } catch {
            setWalkInErrors({ name: t('rental.wizard.walk_in_failed') });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                            {t('rental.wizard.steps.4')}
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowWalkIn(true)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            + {t('rental.actions.walk_in_customer')}
                        </button>
                    </div>
                    <div>
                        <InputLabel htmlFor="partner_id" value={`${t('rental.fields.customer')} *`} />
                        <Select
                            id="partner_id"
                            className="mt-1"
                            value={data.partner_id}
                            onChange={(value) => setData('partner_id', value)}
                            placeholder={t('rental.placeholders.select_partner')}
                            options={partnerOptions}
                        />
                        <InputError message={errors.partner_id} className="mt-1" />
                    </div>
                </div>

                <PreviousStepsSummary
                    data={data}
                    selectedVehicle={selectedVehicle}
                    includeExtras
                    drivers={drivers}
                    insurancePackages={insurancePackages}
                    isOneWay={isOneWay}
                />
            </div>

            <Modal show={showWalkIn} onClose={() => !processing && setShowWalkIn(false)} maxWidth="md">
                <form onSubmit={submitWalkIn} className="space-y-4 p-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">{t('rental.pages.create.walk_in_title')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('rental.pages.create.walk_in_hint')}</p>
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_name" value={`${t('partners.fields.name')} *`} />
                        <TextInput
                            id="walk_in_name"
                            className="mt-1 block w-full"
                            value={walkIn.name}
                            onChange={(e) => setWalkIn((c) => ({ ...c, name: e.target.value }))}
                            required
                        />
                        <InputError message={walkInErrors.name} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_phone" value={`${t('partners.fields.phone')} *`} />
                        <TextInput
                            id="walk_in_phone"
                            className="mt-1 block w-full"
                            value={walkIn.phone}
                            onChange={(e) => setWalkIn((c) => ({ ...c, phone: e.target.value }))}
                            required
                        />
                        <InputError message={walkInErrors.phone} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_email" value={t('partners.fields.email')} />
                        <TextInput
                            id="walk_in_email"
                            type="email"
                            className="mt-1 block w-full"
                            value={walkIn.email}
                            onChange={(e) => setWalkIn((c) => ({ ...c, email: e.target.value }))}
                        />
                        <InputError message={walkInErrors.email} className="mt-1" />
                    </div>
                    <div>
                        <InputLabel htmlFor="walk_in_id_number" value={t('partners.fields.id_number')} />
                        <TextInput
                            id="walk_in_id_number"
                            className="mt-1 block w-full"
                            value={walkIn.id_number}
                            onChange={(e) => setWalkIn((c) => ({ ...c, id_number: e.target.value }))}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={() => setShowWalkIn(false)} disabled={processing}>
                            {t('common.cancel')}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>{t('rental.actions.save_walk_in')}</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
