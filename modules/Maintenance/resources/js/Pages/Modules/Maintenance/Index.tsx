import DynamicLayout from '@/Layouts/DynamicLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link } from '@inertiajs/react';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import MaintenanceNav from '../MaintenanceNav';
import {
    WorkOrder,
    getStatusBadge,
    getPriorityBadge,
    formatDate,
    formatCurrency,
} from '../maintenanceUtils';

interface Summary {
    draft: number;
    pending: number;
    approved: number;
    in_progress: number;
    overdue: number;
    completed_this_month: number;
    total_cost_this_month: number;
}

interface Props {
    summary: Summary;
    recentWorkOrders: WorkOrder[];
    can: { create: boolean; update: boolean; delete: boolean; approve: boolean };
}

const WrenchIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
);

const ClockIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ExclamationIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

const CurrencyIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
);

export default function Index({ summary, recentWorkOrders, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();

    const summaryCards = [
        {
            label: 'Sedang Dikerjakan',
            value: summary.in_progress,
            icon: <WrenchIcon />,
            bg: 'bg-indigo-50',
            iconBg: 'bg-indigo-500',
            textColor: 'text-indigo-700',
        },
        {
            label: 'Menunggu Persetujuan',
            value: summary.pending + summary.approved,
            icon: <ClockIcon />,
            bg: 'bg-yellow-50',
            iconBg: 'bg-yellow-500',
            textColor: 'text-yellow-700',
        },
        {
            label: 'Terlambat',
            value: summary.overdue,
            icon: <ExclamationIcon />,
            bg: 'bg-red-50',
            iconBg: 'bg-red-500',
            textColor: 'text-red-700',
        },
        {
            label: 'Selesai Bulan Ini',
            value: summary.completed_this_month,
            icon: <CheckIcon />,
            bg: 'bg-green-50',
            iconBg: 'bg-green-500',
            textColor: 'text-green-700',
        },
        {
            label: 'Biaya Bulan Ini',
            value: formatCurrency(summary.total_cost_this_month),
            icon: <CurrencyIcon />,
            bg: 'bg-blue-50',
            iconBg: 'bg-blue-500',
            textColor: 'text-blue-700',
            wide: true,
        },
    ];

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Maintenance</h2>
                    {can.create && (
                        <Link href={prefixedRoute('maintenance.work-orders.create')}>
                            <PrimaryButton>+ Work Order Baru</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Maintenance" />

            <MaintenanceNav />

            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {summaryCards.map((card) => (
                    <div key={card.label} className={`rounded-xl ${card.bg} p-4 ${card.wide ? 'col-span-2 sm:col-span-1' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg ${card.iconBg} p-2 text-white`}>
                                {card.icon}
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
                                <p className="text-xs text-gray-500">{card.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Work Orders */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h3 className="font-semibold text-gray-900">Work Order Aktif</h3>
                    <Link
                        href={prefixedRoute('maintenance.work-orders.index')}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Lihat Semua →
                    </Link>
                </div>

                {recentWorkOrders.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <WrenchIcon />
                        <p className="mt-2 text-sm">Tidak ada work order aktif</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentWorkOrders.map((wo) => {
                            const statusBadge = getStatusBadge(wo.status);
                            const priorityBadge = getPriorityBadge(wo.priority);
                            return (
                                <Link
                                    key={wo.id}
                                    href={prefixedRoute('maintenance.work-orders.show', wo.id)}
                                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                                >
                                    {/* Category color dot */}
                                    <div
                                        className="h-3 w-3 flex-shrink-0 rounded-full"
                                        style={{ backgroundColor: wo.category?.color ?? '#6B7280' }}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-gray-400">{wo.reference_number}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.classes}`}>
                                                {statusBadge.label}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge.classes}`}>
                                                {priorityBadge.label}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 truncate font-medium text-gray-900">{wo.title}</p>
                                        <p className="text-sm text-gray-500">
                                            {wo.vehicle?.name} · {wo.vehicle?.plate_number}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 text-right">
                                        <p className="text-sm text-gray-500">{formatDate(wo.scheduled_date)}</p>
                                        {wo.estimated_cost && (
                                            <p className="text-sm font-medium text-gray-700">{formatCurrency(wo.estimated_cost)}</p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </DynamicLayout>
    );
}
