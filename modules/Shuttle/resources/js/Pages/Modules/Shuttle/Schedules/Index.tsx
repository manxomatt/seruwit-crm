import ConfirmDeleteDialog from '@/Components/ConfirmDeleteDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import DynamicLayout from '@/Layouts/DynamicLayout';
import { useRoutePrefix } from '@/hooks/useRoutePrefix';
import { useTrans } from '@/hooks/useTrans';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import ShuttleNav from '../ShuttleNav';
import { ActionIconButton, CalendarPlusIcon, PencilIcon, TrashIcon } from '../components/ActionIcons';
import ShuttlePagination, { type PaginatedMeta } from '../components/ShuttlePagination';

interface Schedule {
    id: number;
    code: string;
    days_of_week: number[];
    departure_time: string;
    seat_capacity: number;
    is_active: boolean;
    corridor?: { name: string; code: string; service_type?: string } | null;
    vehicle?: { name: string; plate_number: string } | null;
}

interface Props {
    schedules: PaginatedMeta & { data: Schedule[] };
    can: { create: boolean; update: boolean; delete: boolean };
}

export default function Index({ schedules, can }: Props) {
    const { prefixedRoute } = useRoutePrefix();
    const { t } = useTrans();
    const [generateId, setGenerateId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<Schedule | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);
    const generateForm = useForm({ from: '', to: '' });

    const submitGenerate: FormEventHandler = (e) => {
        e.preventDefault();
        if (!generateId) return;
        generateForm.post(prefixedRoute('shuttle.schedules.generate', generateId), {
            onSuccess: () => setGenerateId(null),
        });
    };

    const closeDeleteDialog = () => {
        setDeleting(null);
    };

    const confirmDelete = () => {
        if (!deleting) {
            return;
        }

        setProcessingDelete(true);
        router.delete(prefixedRoute('shuttle.schedules.destroy', deleting.id), {
            onSuccess: () => closeDeleteDialog(),
            onFinish: () => setProcessingDelete(false),
        });
    };

    return (
        <DynamicLayout
            header={
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{t('shuttle.schedules.title')}</h2>
                    {can.create && (
                        <Link href={prefixedRoute('shuttle.schedules.create')}>
                            <PrimaryButton type="button">{t('shuttle.schedules.create')}</PrimaryButton>
                        </Link>
                    )}
                </div>
            }
        >
            <Head title={t('shuttle.schedules.title')} />
            <ShuttleNav active="schedules" />

            <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.code')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.corridor')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.days')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.departure_time')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('shuttle.schedules.seat_capacity')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('common.actions', undefined, 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {schedules.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                                    —
                                </td>
                            </tr>
                        ) : (
                            schedules.data.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{s.code}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-900">{s.corridor?.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {s.corridor?.service_type === 'door'
                                                ? t('shuttle.service.door_short')
                                                : t('shuttle.service.pool_short')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {(s.days_of_week ?? []).map((d) => t(`shuttle.days.${d}`)).join(', ')}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">{String(s.departure_time).slice(0, 5)}</td>
                                    <td className="px-4 py-3 tabular-nums text-gray-700">{s.seat_capacity}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {can.create && (
                                                <ActionIconButton
                                                    title={t('shuttle.schedules.generate')}
                                                    tone="emerald"
                                                    onClick={() => setGenerateId(s.id)}
                                                >
                                                    <CalendarPlusIcon />
                                                </ActionIconButton>
                                            )}
                                            {can.update && (
                                                <ActionIconButton
                                                    title={t('common.edit', undefined, 'Edit')}
                                                    href={prefixedRoute('shuttle.schedules.edit', s.id)}
                                                >
                                                    <PencilIcon />
                                                </ActionIconButton>
                                            )}
                                            {can.delete && (
                                                <ActionIconButton
                                                    title={t('common.delete', undefined, 'Delete')}
                                                    tone="red"
                                                    onClick={() => setDeleting(s)}
                                                >
                                                    <TrashIcon />
                                                </ActionIconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <ShuttlePagination meta={schedules} />
            </div>

            {generateId && (
                <form
                    onSubmit={submitGenerate}
                    className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div>
                        <div className="mb-1 text-sm text-gray-600">{t('shuttle.schedules.from')}</div>
                        <TextInput type="date" value={generateForm.data.from} onChange={(e) => generateForm.setData('from', e.target.value)} />
                    </div>
                    <div>
                        <div className="mb-1 text-sm text-gray-600">{t('shuttle.schedules.to')}</div>
                        <TextInput type="date" value={generateForm.data.to} onChange={(e) => generateForm.setData('to', e.target.value)} />
                    </div>
                    <PrimaryButton disabled={generateForm.processing}>{t('shuttle.schedules.generate')}</PrimaryButton>
                    <button type="button" className="text-sm text-gray-500 hover:text-gray-700" onClick={() => setGenerateId(null)}>
                        {t('common.cancel', undefined, 'Cancel')}
                    </button>
                </form>
            )}

            <ConfirmDeleteDialog
                show={deleting !== null}
                onClose={closeDeleteDialog}
                onConfirm={confirmDelete}
                processing={processingDelete}
                message={
                    deleting
                        ? t('shuttle.messages.delete_confirm', { name: deleting.code })
                        : undefined
                }
            />
        </DynamicLayout>
    );
}
