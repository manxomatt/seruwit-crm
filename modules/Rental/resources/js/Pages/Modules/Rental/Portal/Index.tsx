import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { formatMoney } from '@/utils/money';
import { Head, Link, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';

interface Partner {
    id: number;
    code: string;
    name: string;
}

interface RentalRow {
    id: number;
    code: string;
    status: string;
    start_date: string;
    end_date: string;
    total_amount: string;
    vehicle?: { name: string; plate_number: string } | null;
}

interface InvoiceRow {
    id: number;
    code: string;
    status: string;
    total: string;
    amount_paid: string;
    due_date: string | null;
}

interface Props {
    partner: Partner;
    rentals: { data: RentalRow[] };
    openInvoices: InvoiceRow[];
    gatewayEnabled: boolean;
}

export default function Index({ partner, rentals, openInvoices, gatewayEnabled }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();

    return (
        <DynamicLayout
            header={<PageHeader title={t('rental.portal.title')} />}
        >
            <Head title={t('rental.portal.title')} />

            <div className="mb-4 text-sm text-gray-500">
                {partner.name} <span className="text-gray-400">({partner.code})</span>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-700">{t('rental.nav.list')}</h3>
                    </div>
                    {rentals.data.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">{t('rental.portal.empty_rentals')}</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {rentals.data.map((rental) => (
                                <li key={rental.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                    <div>
                                        <Link
                                            href={prefixedRoute('portal.rentals.show', rental.id)}
                                            className="font-medium text-indigo-600 hover:underline"
                                        >
                                            {rental.code}
                                        </Link>
                                        <p className="text-gray-500">
                                            {rental.vehicle
                                                ? `${rental.vehicle.name} — ${rental.vehicle.plate_number}`
                                                : '—'}
                                            {' · '}
                                            {rental.start_date} → {rental.end_date}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="tabular-nums">{formatMoney(rental.total_amount)}</div>
                                        <div className="text-xs text-gray-400">{rental.status}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-700">{t('rental.portal.open_invoices')}</h3>
                    </div>
                    {openInvoices.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500">{t('rental.portal.empty_invoices')}</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {openInvoices.map((invoice) => (
                                <li key={invoice.id} className="px-4 py-3 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-gray-900">{invoice.code}</span>
                                        <span className="tabular-nums">{formatMoney(invoice.total)}</span>
                                    </div>
                                    {gatewayEnabled && (
                                        <div className="mt-2">
                                            <SecondaryButton
                                                type="button"
                                                onClick={() => router.post(prefixedRoute('portal.invoices.pay', invoice.id))}
                                            >
                                                {t('rental.portal.pay_invoice')}
                                            </SecondaryButton>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </DynamicLayout>
    );
}
