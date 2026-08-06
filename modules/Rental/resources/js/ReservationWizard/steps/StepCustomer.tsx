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

type LicenseAlert = {
    tone: 'danger' | 'warning';
    date: string;
};

const LICENSE_EXPIRING_SOON_DAYS = 30;

function partnerInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function parseDateOnly(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return today;
}

function licenseAlertFor(expiresAt: string | null | undefined): LicenseAlert | null {
    if (!expiresAt) {
        return null;
    }

    const expiry = parseDateOnly(expiresAt);
    if (!expiry) {
        return null;
    }

    const today = startOfToday();
    if (expiry < today) {
        return { tone: 'danger', date: expiresAt };
    }

    const soon = new Date(today);
    soon.setDate(soon.getDate() + LICENSE_EXPIRING_SOON_DAYS);
    if (expiry <= soon) {
        return { tone: 'warning', date: expiresAt };
    }

    return null;
}

function DetailItem({
    label,
    value,
    valueClassName = 'text-gray-900',
}: {
    label: string;
    value: string | null | undefined;
    valueClassName?: string;
}): JSX.Element | null {
    if (!value) {
        return null;
    }

    return (
        <div className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className={`mt-0.5 break-words text-sm ${valueClassName}`}>{value}</dd>
        </div>
    );
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

    const selectedPartner = useMemo(
        () => partners.find((partner) => String(partner.id) === data.partner_id) ?? null,
        [partners, data.partner_id],
    );

    const licenseAlert = licenseAlertFor(selectedPartner?.license_expires_at);
    const accountTypeLabel = selectedPartner?.account_type
        ? t(`partners.account_type.${selectedPartner.account_type}`)
        : null;

    const hasDetails = Boolean(
        selectedPartner?.phone ||
            selectedPartner?.mobile ||
            selectedPartner?.email ||
            selectedPartner?.id_number ||
            selectedPartner?.license_number ||
            selectedPartner?.license_expires_at ||
            selectedPartner?.address,
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
                const nextPartners = partners.some((p) => p.id === payload.partner!.id)
                    ? partners.map((p) => (p.id === payload.partner!.id ? payload.partner! : p))
                    : [payload.partner, ...partners];
                setPartners(nextPartners);
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

                    {selectedPartner && (
                        <section
                            className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white via-white to-indigo-50/60 shadow-sm"
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-4 border-b border-gray-100 px-4 py-4 sm:px-5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold tracking-wide text-white">
                                    {partnerInitials(selectedPartner.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate text-base font-semibold text-gray-900">
                                            {selectedPartner.name}
                                        </h3>
                                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                            {selectedPartner.code}
                                        </span>
                                        {accountTypeLabel && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                                                {accountTypeLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('rental.wizard.customer.selected_hint')}
                                    </p>
                                </div>
                            </div>

                            {licenseAlert && (
                                <div
                                    className={
                                        licenseAlert.tone === 'danger'
                                            ? 'border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 sm:px-5'
                                            : 'border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-5'
                                    }
                                    role="alert"
                                >
                                    {licenseAlert.tone === 'danger'
                                        ? t('rental.wizard.customer.license_expired', { date: licenseAlert.date })
                                        : t('rental.wizard.customer.license_expiring', { date: licenseAlert.date })}
                                </div>
                            )}

                            {hasDetails ? (
                                <dl className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
                                    <DetailItem label={t('partners.fields.phone')} value={selectedPartner.phone} />
                                    <DetailItem label={t('partners.fields.mobile')} value={selectedPartner.mobile} />
                                    <DetailItem label={t('partners.fields.email')} value={selectedPartner.email} />
                                    <DetailItem label={t('partners.fields.id_number')} value={selectedPartner.id_number} />
                                    <DetailItem
                                        label={t('partners.fields.license_number')}
                                        value={selectedPartner.license_number}
                                    />
                                    <DetailItem
                                        label={t('partners.fields.license_expires_at')}
                                        value={selectedPartner.license_expires_at}
                                        valueClassName={
                                            licenseAlert?.tone === 'danger'
                                                ? 'font-medium text-red-700'
                                                : licenseAlert?.tone === 'warning'
                                                  ? 'font-medium text-amber-700'
                                                  : 'text-gray-900'
                                        }
                                    />
                                    <div className="sm:col-span-2">
                                        <DetailItem label={t('partners.fields.address')} value={selectedPartner.address} />
                                    </div>
                                </dl>
                            ) : (
                                <p className="px-4 py-3 text-sm text-gray-500 sm:px-5">
                                    {t('rental.wizard.customer.no_details')}
                                </p>
                            )}
                        </section>
                    )}
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
