import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import TransportationNav from '../../../../TransportationNav';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TripSchedule {
    id: number;
    origin: string;
    destination: string;
    days_of_week: number[];
    time_of_day: string;
    starts_on: string;
    ends_on: string | null;
    is_active: boolean;
    vehicle: { id: number; name: string; plate_number: string };
    driver: { id: number; name: string };
}

interface PaginatedSchedules {
    data: TripSchedule[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Filters {
    search: string | null;
}

interface Props {
    schedules: PaginatedSchedules;
    filters: Filters;
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ schedules, filters, can }: Props): JSX.Element {
    const { prefixedRoute } = useRoutePrefix();
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<TripSchedule | null>(null);
    const [processing, setProcessing] = useState(false);
    const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
    const [to, setTo] = useState(new Date(Date.now() + 13 * 86400000).toISOString().slice(0, 10));
    const [generating, setGenerating] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get(prefixedRoute('transportation.schedules.index'), { search: search || undefined }, { preserveState: true, replace: true });
    };

    const handleGenerate: FormEventHandler = (e) => {
        e.preventDefault();
        setGenerating(true);
        router.post(prefixedRoute('transportation.schedules.generate'), { from, to }, {
            preserveScroll: true,
            onFinish: () => setGenerating(false),
        });
    };

    const openDeleteDialog = (schedule: TripSchedule) => {
        setScheduleToDelete(schedule);
        setShowDeleteDialog(true);
    };

    const closeDeleteDialog = () => {
        setShowDeleteDialog(false);
        setScheduleToDelete(null);
    };

    const confirmDelete = () => {
        if (!scheduleToDelete) return;
        setProcessing(true);
        router.delete(prefixedRoute('transportation.schedules.destroy', scheduleToDelete.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Transportation</h2>
                    {can.create && (
                        <Link href={prefixedRoute('transportation.schedules.create')}>
                            <PrimaryButton>Add Schedule</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="Trip Schedules" />

            <TransportationNav />

            {can.create && (
                <div className="mb-6 overflow-hidden bg-white shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <h3 className="mb-3 text-sm font-medium text-gray-900">Generate Trips</h3>
                        <p className="mb-4 text-sm text-gray-500">
                            Creates real trips from every active schedule for the dates below. Safe to run more than once — dates already generated are skipped.
                        </p>
                        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
                            <div>
                                <InputLabel htmlFor="from" value="From" />
                                <TextInput id="from" type="date" className="mt-1 block" value={from} onChange={(e) => setFrom(e.target.value)} />
                            </div>
                            <div>
                                <InputLabel htmlFor="to" value="To" />
                                <TextInput id="to" type="date" className="mt-1 block" value={to} onChange={(e) => setTo(e.target.value)} />
                            </div>
                            <PrimaryButton type="submit" disabled={generating}>
                                {generating ? 'Generating…' : 'Generate Trips'}
                            </PrimaryButton>
                        </form>
                    </div>
                </div>
            )}

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <div className="p-6">
                    <form onSubmit={handleSearch} className="mb-6 flex flex-wrap gap-4">
                        <div className="min-w-[220px] flex-1">
                            <TextInput
                                type="text"
                                placeholder="Search by origin or destination..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <PrimaryButton type="submit">Search</PrimaryButton>
                    </form>

                    {schedules.data.length === 0 ? (
                        <div className="py-12 text-center">
                            <h3 className="text-sm font-medium text-gray-900">No schedules found</h3>
                            <p className="mt-1 text-sm text-gray-500">Create a recurring schedule to generate trips automatically.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Route</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Vehicle / Driver</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Days</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {schedules.data.map((schedule) => (
                                            <tr key={schedule.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{schedule.origin} → {schedule.destination}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {schedule.vehicle.name} ({schedule.vehicle.plate_number}) / {schedule.driver.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {schedule.days_of_week.map((d) => DAY_LABELS[d]).join(', ')}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{schedule.time_of_day.slice(0, 5)}</td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {schedule.is_active ? 'Active' : 'Paused'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <Link href={prefixedRoute('transportation.schedules.show', schedule.id)} className="text-gray-600 hover:text-gray-900">
                                                            View
                                                        </Link>
                                                        {can.update && (
                                                            <Link href={prefixedRoute('transportation.schedules.edit', schedule.id)} className="text-indigo-600 hover:text-indigo-900">
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {can.delete && (
                                                            <button onClick={() => openDeleteDialog(schedule)} className="text-red-600 hover:text-red-900">
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {schedules.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {(schedules.current_page - 1) * schedules.per_page + 1} to{' '}
                                        {Math.min(schedules.current_page * schedules.per_page, schedules.total)} of {schedules.total} results
                                    </p>
                                    <div className="flex gap-1">
                                        {schedules.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => link.url && router.get(link.url)}
                                                disabled={!link.url}
                                                className={`rounded px-3 py-1 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'border bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <ConfirmDeleteDialog
                show={showDeleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processing}
                title="Delete Schedule"
                message={
                    scheduleToDelete
                        ? `Are you sure you want to delete the schedule "${scheduleToDelete.origin} → ${scheduleToDelete.destination}"? Trips already generated from it are kept.`
                        : 'Are you sure you want to delete this schedule?'
                }
            />
        </DynamicLayout>
    );
}
