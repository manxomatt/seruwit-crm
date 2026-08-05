import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';

interface Props {
    partner: { id: number; code: string; name: string };
    rental: {
        id: number;
        code: string;
        status: string;
        start_date: string;
        end_date: string;
        deposit_amount: string;
        deposit_received_at: string | null;
        total_amount: string;
        pickup_location: string | null;
        return_location: string | null;
        vehicle?: { name: string; plate_number: string; type: string } | null;
    };
    gatewayEnabled: boolean;
    canPayDeposit: boolean;
}

export default function Show({ partner, rental, canPayDeposit }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={<PageHeader title={rental.code} />}
        >
            <Head title={rental.code} />

            <div className="mb-4 flex items-center justify-between gap-3">
                <Link href={prefixedRoute('portal.rentals.index')}>
                    <SecondaryButton type="button">{t('rental.portal.back')}</SecondaryButton>
                </Link>
                {canPayDeposit && (
                    <PrimaryButton
                        type="button"
                        onClick={() => router.post(prefixedRoute('portal.rentals.pay_deposit', rental.id))}
                    >
                        {t('rental.portal.pay_deposit')}
                    </PrimaryButton>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm text-gray-500">
                    {partner.name} ({partner.code})
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <dt className="text-gray-500">{t('rental.fields.vehicle')}</dt>
                    <dd className="text-gray-900">
                        {rental.vehicle
                            ? `${rental.vehicle.name} — ${rental.vehicle.plate_number}`
                            : '—'}
                    </dd>
                    <dt className="text-gray-500">{t('rental.fields.status')}</dt>
                    <dd className="text-gray-900">{rental.status}</dd>
                    <dt className="text-gray-500">{t('rental.fields.period')}</dt>
                    <dd className="text-gray-900">{rental.start_date} → {rental.end_date}</dd>
                    <dt className="text-gray-500">{t('rental.fields.deposit')}</dt>
                    <dd className="text-gray-900">
                        {formatMoney(rental.deposit_amount)}
                        {rental.deposit_received_at ? ` · ${t('rental.deposit.received')}` : ''}
                    </dd>
                    <dt className="text-gray-500">{t('rental.fields.total_amount')}</dt>
                    <dd className="tabular-nums text-gray-900">{formatMoney(rental.total_amount)}</dd>
                    {typeof rental.pickup_location === 'string' && rental.pickup_location && (
                        <>
                            <dt className="text-gray-500">{t('rental.fields.pickup_location')}</dt>
                            <dd className="text-gray-900">{rental.pickup_location}</dd>
                        </>
                    )}
                    {typeof rental.return_location === 'string' && rental.return_location && (
                        <>
                            <dt className="text-gray-500">{t('rental.fields.return_location')}</dt>
                            <dd className="text-gray-900">{rental.return_location}</dd>
                        </>
                    )}
                </dl>
            </div>
        </DynamicLayout>
    );
}
